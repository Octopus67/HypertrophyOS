"""Account management routes — deletion, reactivation, cleanup."""

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.database import get_db
from src.middleware.authenticate import get_current_user
from src.modules.account.schemas import AccountDeletionResponse, AccountReactivationResponse
from src.modules.account.service import AccountService
from src.modules.auth.models import User
from typing import Optional

router = APIRouter()


def _get_service(db: AsyncSession = Depends(get_db)) -> AccountService:
    return AccountService(db)


@router.delete("/", response_model=AccountDeletionResponse)
async def delete_account(
    user: User = Depends(get_current_user),
    service: AccountService = Depends(_get_service),
) -> AccountDeletionResponse:
    """Request account deletion with 30-day grace period.

    Requirement 22.1, 22.4, 22.5.
    """
    result = await service.request_deletion(user.id)
    return AccountDeletionResponse(**result)


@router.post("/reactivate/{user_id}", response_model=AccountReactivationResponse)
async def reactivate_account_by_id(
    user_id: str,
    service: AccountService = Depends(_get_service),
) -> AccountReactivationResponse:
    """Reactivate a deactivated account by user ID within the grace period.

    This is a simplified endpoint for the MVP. In production, this would
    require email verification or a special reactivation token.

    Requirement 22.3.
    """
    import uuid as _uuid

    uid = _uuid.UUID(user_id)
    result = await service.reactivate(uid)
    return AccountReactivationResponse(**result)
