"""Auth routes — registration, login, OAuth, token refresh, and logout."""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.database import get_db
from src.middleware.authenticate import get_current_user
from src.middleware.rate_limiter import check_rate_limit, record_attempt, reset_attempts
from src.modules.auth.models import User
from src.modules.auth.schemas import (
    AuthTokensResponse,
    ForgotPasswordRequest,
    LoginRequest,
    OAuthCallbackRequest,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
    ResendVerificationRequest,
    VerifyEmailRequest,
)
from src.modules.auth.service import AuthService
from src.shared.errors import UnauthorizedError, ConflictError

router = APIRouter()


def _get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db)


@router.post("/register", response_model=AuthTokensResponse, status_code=201)
async def register(
    data: RegisterRequest,
    service: AuthService = Depends(_get_auth_service),
) -> AuthTokensResponse:
    """Register a new user with email and password."""
    try:
        tokens = await service.register_email(email=data.email, password=data.password)
        return AuthTokensResponse(
            access_token=tokens.access_token,
            refresh_token=tokens.refresh_token,
            expires_in=tokens.expires_in
        )
    except ConflictError:
        # Return same success response to prevent email enumeration
        # In production, could send "account exists" email to the address
        return AuthTokensResponse(
            access_token="",
            refresh_token="", 
            expires_in=0
        )


@router.post("/login", response_model=AuthTokensResponse)
async def login(
    data: LoginRequest,
    service: AuthService = Depends(_get_auth_service),
) -> AuthTokensResponse:
    """Authenticate with email and password."""
    check_rate_limit(data.email)
    try:
        tokens = await service.login_email(email=data.email, password=data.password)
    except UnauthorizedError:
        record_attempt(data.email)
        raise
    # Successful login — clear rate limit counter
    reset_attempts(data.email)
    return tokens


@router.post("/oauth/{provider}", response_model=AuthTokensResponse)
async def oauth_login(
    provider: str,
    data: OAuthCallbackRequest,
    service: AuthService = Depends(_get_auth_service),
) -> AuthTokensResponse:
    """Authenticate via OAuth provider (google, apple, etc.)."""
    tokens = await service.login_oauth(provider=provider, token=data.token)
    return tokens


@router.post("/refresh", response_model=AuthTokensResponse)
async def refresh(
    data: RefreshTokenRequest,
    service: AuthService = Depends(_get_auth_service),
) -> AuthTokensResponse:
    """Obtain a new access token using a valid refresh token."""
    tokens = await service.refresh_token(refresh_token=data.refresh_token)
    return tokens


@router.post("/logout", status_code=204, response_model=None)
async def logout(
    request: Request,
    user: User = Depends(get_current_user),
    service: AuthService = Depends(_get_auth_service),
) -> None:
    """Logout the current user (invalidate tokens server-side)."""
    from src.middleware.authenticate import _extract_bearer_token
    token = _extract_bearer_token(request)
    await service.logout(token)


@router.get("/me")
async def get_current_user_info(
    user: User = Depends(get_current_user),
) -> dict:
    """Return the current authenticated user's basic info."""
    return {"id": str(user.id), "email": user.email, "role": user.role}


@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest,
    service: AuthService = Depends(_get_auth_service),
) -> dict:
    """Request a password reset OTP code via email.

    Always returns 200 regardless of whether the email exists,
    to avoid leaking account information.
    """
    await service.generate_reset_code(email=data.email)
    return {
        "message": "If an account exists with that email, a reset code has been sent"
    }


@router.post("/reset-password")
async def reset_password(
    data: ResetPasswordRequest,
    service: AuthService = Depends(_get_auth_service),
) -> dict:
    """Reset password using a valid 6-digit OTP code."""
    success = await service.reset_password(
        email=data.email, code=data.code, new_password=data.new_password
    )
    if not success:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")
    return {"message": "Password has been reset"}


@router.post("/verify-email")
async def verify_email(
    data: VerifyEmailRequest,
    user: User = Depends(get_current_user),
    service: AuthService = Depends(_get_auth_service),
) -> dict:
    """Verify the user's email with a 6-digit OTP code."""
    if user.email_verified:
        return {"message": "Email already verified"}

    success = await service.verify_email(user_id=user.id, code=data.code)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
async def resend_verification(
    user: User = Depends(get_current_user),
    service: AuthService = Depends(_get_auth_service),
) -> dict:
    """Resend the email verification code. Rate limited to 3 per 15 minutes."""
    if user.email_verified:
        return {"message": "Email already verified"}

    await service.resend_verification_code(user)
    return {"message": "Verification code sent"}
