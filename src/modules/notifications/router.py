"""Notification routes — device tokens, preferences, history, and mark-read.

POST   /register-device              — Register a device push token
DELETE /register-device/{token_id}   — Unregister a device push token
GET    /preferences                  — Get notification preferences
PATCH  /preferences                  — Update notification preferences
GET    /history                      — Get notification history (paginated)
POST   /mark-read                    — Mark notifications as read
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.database import get_db
from src.middleware.authenticate import get_current_user
from src.modules.auth.models import User
from src.modules.notifications.schemas import (
    DeviceTokenCreate,
    DeviceTokenResponse,
    MarkReadRequest,
    NotificationLogResponse,
    NotificationPreferenceResponse,
    NotificationPreferenceUpdate,
)
from src.modules.notifications.service import NotificationService
from src.shared.pagination import PaginatedResult, PaginationParams

router = APIRouter()


def _get_service(db: AsyncSession = Depends(get_db)) -> NotificationService:
    return NotificationService(db)


@router.post("/register-device", response_model=DeviceTokenResponse, status_code=201)
async def register_device(
    data: DeviceTokenCreate,
    user: User = Depends(get_current_user),
    service: NotificationService = Depends(_get_service),
) -> DeviceTokenResponse:
    """Register a device push token for the authenticated user."""
    token = await service.register_device(user_id=user.id, data=data)
    return DeviceTokenResponse.model_validate(token)


@router.delete("/register-device/{token_id}", status_code=204)
async def unregister_device(
    token_id: uuid.UUID,
    user: User = Depends(get_current_user),
    service: NotificationService = Depends(_get_service),
) -> Response:
    """Unregister a device push token for the authenticated user."""
    await service.unregister_device(user_id=user.id, token_id=token_id)
    return Response(status_code=204)


@router.get("/preferences", response_model=NotificationPreferenceResponse)
async def get_preferences(
    user: User = Depends(get_current_user),
    service: NotificationService = Depends(_get_service),
) -> NotificationPreferenceResponse:
    """Get notification preferences for the authenticated user."""
    prefs = await service.get_preferences(user_id=user.id)
    return NotificationPreferenceResponse.model_validate(prefs)


@router.patch("/preferences", response_model=NotificationPreferenceResponse)
async def update_preferences(
    data: NotificationPreferenceUpdate,
    user: User = Depends(get_current_user),
    service: NotificationService = Depends(_get_service),
) -> NotificationPreferenceResponse:
    """Update notification preferences for the authenticated user."""
    prefs = await service.update_preferences(user_id=user.id, data=data)
    return NotificationPreferenceResponse.model_validate(prefs)


@router.get("/history", response_model=PaginatedResult[NotificationLogResponse])
async def get_notification_history(
    user: User = Depends(get_current_user),
    service: NotificationService = Depends(_get_service),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
) -> PaginatedResult[NotificationLogResponse]:
    """Return paginated notification history for the authenticated user."""
    pagination = PaginationParams(page=page, limit=limit)
    return await service.get_notification_history(user.id, pagination)


@router.post("/mark-read")
async def mark_notifications_read(
    data: MarkReadRequest,
    user: User = Depends(get_current_user),
    service: NotificationService = Depends(_get_service),
) -> dict:
    """Mark notifications as read."""
    count = await service.mark_as_read(user.id, data.notification_ids)
    return {"updated": count}
