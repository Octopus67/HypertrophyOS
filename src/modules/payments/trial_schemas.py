"""Pydantic schemas for trial endpoints."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class TrialEligibilityResponse(BaseModel):
    eligible: bool
    has_used_trial: bool


class TrialStatusResponse(BaseModel):
    active: bool
    has_used_trial: bool
    trial_started_at: Optional[str] = None
    trial_ends_at: Optional[str] = None
    days_remaining: int = 0


class TrialInsightsResponse(BaseModel):
    workouts_logged: int
    prs_hit: int
    total_volume_kg: float
    meals_logged: int
    measurements_tracked: int
    trial_started_at: str
    trial_ends_at: str
