"""Unit tests for the auth module — task 2.4.

Validates: Requirements 1.1, 1.4, 1.5, 1.7, 1.8
"""

import pytest

from src.middleware.rate_limiter import clear_all, record_attempt
from src.config.settings import settings


@pytest.fixture(autouse=True)
def _clear_rate_limiter():
    """Reset rate limiter state before each test."""
    clear_all()
    yield
    clear_all()


# ------------------------------------------------------------------
# 1. Email registration happy path
# ------------------------------------------------------------------

@pytest.mark.asyncio
async def test_register_email_happy_path(client, override_get_db):
    """POST /register with valid email/password → 201, returns tokens."""
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "new@example.com", "password": "SecurePass123"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert "expires_in" in body
    assert body["token_type"] == "bearer"


# ------------------------------------------------------------------
# 2. Duplicate email registration
# ------------------------------------------------------------------

@pytest.mark.asyncio
async def test_register_duplicate_email(client, override_get_db):
    """Register same email twice → second returns 201 with empty tokens to prevent enumeration."""
    payload = {"email": "dup@example.com", "password": "SecurePass123"}
    first = await client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201

    second = await client.post("/api/v1/auth/register", json=payload)
    assert second.status_code == 201
    # Should return empty tokens to prevent email enumeration
    body = second.json()
    assert body["access_token"] == ""
    assert body["refresh_token"] == ""
    assert body["expires_in"] == 0


# ------------------------------------------------------------------
# 3. Login with correct credentials
# ------------------------------------------------------------------

@pytest.mark.asyncio
async def test_login_correct_credentials(client, override_get_db):
    """Register, then POST /login → 200, returns tokens."""
    creds = {"email": "login@example.com", "password": "SecurePass123"}
    await client.post("/api/v1/auth/register", json=creds)

    resp = await client.post("/api/v1/auth/login", json=creds)
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"


# ------------------------------------------------------------------
# 4. Login with incorrect password
# ------------------------------------------------------------------

@pytest.mark.asyncio
async def test_login_incorrect_password(client, override_get_db):
    """POST /login with wrong password → 401."""
    creds = {"email": "wrongpw@example.com", "password": "SecurePass123"}
    await client.post("/api/v1/auth/register", json=creds)

    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpw@example.com", "password": "wrongpassword"},
    )
    assert resp.status_code == 401


# ------------------------------------------------------------------
# 5. Login with non-existent email
# ------------------------------------------------------------------

@pytest.mark.asyncio
async def test_login_nonexistent_email(client, override_get_db):
    """POST /login with unknown email → 401."""
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "doesntmatter"},
    )
    assert resp.status_code == 401


# ------------------------------------------------------------------
# 6. Token refresh with valid refresh token
# ------------------------------------------------------------------

@pytest.mark.asyncio
async def test_refresh_valid_token(client, override_get_db):
    """Register, extract refresh_token, POST /refresh → 200, new tokens."""
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": "refresh@example.com", "password": "SecurePass123"},
    )
    refresh_tok = reg.json()["refresh_token"]

    resp = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_tok},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert "refresh_token" in body


# ------------------------------------------------------------------
# 7. Token refresh with invalid token
# ------------------------------------------------------------------

@pytest.mark.asyncio
async def test_refresh_invalid_token(client, override_get_db):
    """POST /refresh with garbage token → 401."""
    resp = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "not-a-real-token"},
    )
    assert resp.status_code == 401


# ------------------------------------------------------------------
# 8. Apple OAuth — verifies token and creates/finds user
# ------------------------------------------------------------------

@pytest.mark.asyncio
async def test_apple_oauth_happy_path(client, override_get_db, monkeypatch):
    """POST /oauth/apple with valid token → 200, returns tokens and creates user."""
    import jwt as pyjwt
    from unittest.mock import MagicMock

    monkeypatch.setattr(settings, "APPLE_CLIENT_ID", "com.repwise.app")

    fake_key = MagicMock()
    decoded_payload = {
        "sub": "apple-user-001",
        "email": "user@example.com",
        "iss": "https://appleid.apple.com",
        "aud": "com.repwise.app",
    }

    def mock_get_signing_key(token):
        return fake_key

    def mock_decode(token, key, **kwargs):
        return decoded_payload

    monkeypatch.setattr(
        "src.modules.auth.service._apple_jwk_client.get_signing_key_from_jwt",
        mock_get_signing_key,
    )
    monkeypatch.setattr("src.modules.auth.service.pyjwt.decode", mock_decode)

    resp = await client.post(
        "/api/v1/auth/oauth/apple",
        json={"provider": "apple", "token": "valid-apple-token"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_apple_oauth_invalid_token(client, override_get_db, monkeypatch):
    """POST /oauth/apple with invalid token → 401."""
    import jwt as pyjwt
    from unittest.mock import MagicMock

    monkeypatch.setattr(settings, "APPLE_CLIENT_ID", "com.repwise.app")

    def mock_get_signing_key(token):
        raise pyjwt.InvalidTokenError("bad key")

    monkeypatch.setattr(
        "src.modules.auth.service._apple_jwk_client.get_signing_key_from_jwt",
        mock_get_signing_key,
    )

    resp = await client.post(
        "/api/v1/auth/oauth/apple",
        json={"provider": "apple", "token": "invalid-token"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_apple_oauth_not_configured(client, override_get_db, monkeypatch):
    """POST /oauth/apple when APPLE_CLIENT_ID is empty → 401."""
    monkeypatch.setattr(settings, "APPLE_CLIENT_ID", "")

    resp = await client.post(
        "/api/v1/auth/oauth/apple",
        json={"provider": "apple", "token": "any-token"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_apple_oauth_privacy_relay_email(client, override_get_db, monkeypatch):
    """Apple user with no email gets a privaterelay fallback."""
    from unittest.mock import MagicMock

    monkeypatch.setattr(settings, "APPLE_CLIENT_ID", "com.repwise.app")

    fake_key = MagicMock()
    decoded_payload = {
        "sub": "apple-user-no-email",
        "iss": "https://appleid.apple.com",
        "aud": "com.repwise.app",
    }

    monkeypatch.setattr(
        "src.modules.auth.service._apple_jwk_client.get_signing_key_from_jwt",
        lambda t: fake_key,
    )
    monkeypatch.setattr(
        "src.modules.auth.service.pyjwt.decode",
        lambda token, key, **kw: decoded_payload,
    )

    resp = await client.post(
        "/api/v1/auth/oauth/apple",
        json={"provider": "apple", "token": "valid-apple-token"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body


@pytest.mark.asyncio
async def test_apple_oauth_existing_user(client, override_get_db, monkeypatch):
    """Second Apple login with same sub returns tokens without creating duplicate."""
    from unittest.mock import MagicMock

    monkeypatch.setattr(settings, "APPLE_CLIENT_ID", "com.repwise.app")

    fake_key = MagicMock()
    decoded_payload = {
        "sub": "apple-returning-user",
        "email": "returning@example.com",
        "iss": "https://appleid.apple.com",
        "aud": "com.repwise.app",
    }

    monkeypatch.setattr(
        "src.modules.auth.service._apple_jwk_client.get_signing_key_from_jwt",
        lambda t: fake_key,
    )
    monkeypatch.setattr(
        "src.modules.auth.service.pyjwt.decode",
        lambda token, key, **kw: decoded_payload,
    )

    # First login — creates user
    resp1 = await client.post(
        "/api/v1/auth/oauth/apple",
        json={"provider": "apple", "token": "token1"},
    )
    assert resp1.status_code == 200

    # Second login — finds existing user
    resp2 = await client.post(
        "/api/v1/auth/oauth/apple",
        json={"provider": "apple", "token": "token2"},
    )
    assert resp2.status_code == 200
    assert resp2.json()["access_token"] != resp1.json()["access_token"]


# ------------------------------------------------------------------
# 9. Rate limiting after threshold exceeded
# ------------------------------------------------------------------

@pytest.mark.asyncio
async def test_rate_limiting_after_threshold(client, override_get_db):
    """Make LOGIN_RATE_LIMIT_THRESHOLD failed attempts, then verify 429."""
    email = "ratelimit@example.com"
    bad_creds = {"email": email, "password": "wrongpassword"}

    # Exhaust the threshold with failed login attempts
    for _ in range(settings.LOGIN_RATE_LIMIT_THRESHOLD):
        resp = await client.post("/api/v1/auth/login", json=bad_creds)
        assert resp.status_code == 401

    # Next attempt should be rate-limited
    resp = await client.post("/api/v1/auth/login", json=bad_creds)
    assert resp.status_code == 429
