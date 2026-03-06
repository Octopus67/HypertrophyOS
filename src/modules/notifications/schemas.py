"""Pydantic schemas for the notifications module."""

from __future__ import annotations

import uuid
from datetime import datetime, time
from typing import Any, Optional

from pydantic import BaseModel, Field


class RegisterTokenRequest(BaseModel):
    """Request body for registering a device push token."""

    platform: str = Field(..., pattern=r"^(ios|android|web)$")
    token: str = Field(..., min_length=1, max_length=512)


# Keep backward-compatible alias
DeviceTokenCreate = RegisterTokenRequest


class DeviceTokenResponse(BaseModel):
    """Response body for a registered device token."""

    id: uuid.UUID
    user_id: uuid.UUID
    platform: str
    token: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationPreferenceResponse(BaseModel):
    """Response body for notification preferences."""

    push_enabled: bool
    coaching_reminders: bool
    subscription_alerts: bool
    workout_reminders: bool
    meal_reminders: bool
    pr_celebrations: bool
    weekly_checkin_alerts: bool
    volume_warnings: bool
    quiet_hours_start: Optional[time] = None
    quiet_hours_end: Optional[time] = None

    model_config = {"from_attributes": True}


# Keep backward-compatible alias
NotificationPreferencesResponse = NotificationPreferenceResponse


class NotificationPreferenceUpdate(BaseModel):
    """Request body for updating notification preferences (partial)."""

    push_enabled: Optional[bool] = None
    coaching_reminders: Optional[bool] = None
    subscription_alerts: Optional[bool] = None
    workout_reminders: Optional[bool] = None
    meal_reminders: Optional[bool] = None
    pr_celebrations: Optional[bool] = None
    weekly_checkin_alerts: Optional[bool] = None
    volume_warnings: Optional[bool] = None
    quiet_hours_start: Optional[time] = None
    quiet_hours_end: Optional[time] = None


class NotificationLogResponse(BaseModel):
    """Response body for a notification log entry."""

    id: uuid.UUID
    type: str
    title: str
    body: Optional[str] = None
    data: Optional[dict[str, Any]] = None
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MarkReadRequest(BaseModel):
    """Request body for marking notifications as read."""

    notification_ids: list[uuid.UUID] = Field(..., min_length=1, max_length=100)
