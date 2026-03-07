"""Auth module SQLAlchemy models."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.shared.base_model import Base
from src.shared.soft_delete import SoftDeleteMixin
from src.shared.types import AuthProvider, UserRole
from typing import Optional


class User(SoftDeleteMixin, Base):
    """Users table.

    Stores authentication credentials and role information.
    Supports email/password and OAuth (Google, Apple) login.
    """

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(320), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[Optional[str]] = mapped_column(
        String(128), nullable=True
    )
    auth_provider: Mapped[str] = mapped_column(
        String(20), nullable=False, default=AuthProvider.EMAIL
    )
    auth_provider_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    role: Mapped[str] = mapped_column(
        String(20), nullable=False, default=UserRole.USER
    )

    # Trial fields
    has_used_trial: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    trial_started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    trial_ends_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    __table_args__ = (
        Index("ix_users_auth_provider_id", "auth_provider", "auth_provider_id"),
    )


class PasswordResetToken(Base):
    """Password reset tokens table.
    
    Stores hashed tokens for password reset with expiry and usage tracking.
    """

    __tablename__ = "password_reset_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class TokenBlacklist(Base):
    """JWT token blacklist table.
    
    Stores JTI (JWT ID) of tokens that have been logged out.
    """

    __tablename__ = "token_blacklist"

    jti: Mapped[str] = mapped_column(String(36), nullable=False, unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
