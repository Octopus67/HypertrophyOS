"""Free trial routes.

GET  /trial/eligibility — Check trial eligibility
POST /trial/start       — Start free trial
GET  /trial/status      — Get trial status
GET  /trial/insights    — Get trial insights
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.database import get_db
from src.middleware.authenticate import get_current_user
from src.modules.auth.models import User
from src.modules.payments.schemas import SubscriptionResponse
from src.modules.payments.trial_schemas import (
    TrialEligibilityResponse,
    TrialInsightsResponse,
    TrialStatusResponse,
)
from src.modules.payments.trial_service import TrialService

router = APIRouter()


def _get_service(db: AsyncSession = Depends(get_db)) -> TrialService:
    return TrialService(db)


@router.get("/eligibility", response_model=TrialEligibilityResponse)
async def check_eligibility(
    user: User = Depends(get_current_user),
    service: TrialService = Depends(_get_service),
) -> TrialEligibilityResponse:
    """Check if the authenticated user is eligible for a free trial."""
    result = await service.check_eligibility(user.id)
    return TrialEligibilityResponse(**result)


@router.post("/start", response_model=SubscriptionResponse, status_code=201)
async def start_trial(
    user: User = Depends(get_current_user),
    service: TrialService = Depends(_get_service),
) -> SubscriptionResponse:
    """Activate a 7-day free trial for the authenticated user."""
    subscription = await service.start_trial(user.id)
    return SubscriptionResponse.model_validate(subscription)


@router.get("/status", response_model=TrialStatusResponse)
async def trial_status(
    user: User = Depends(get_current_user),
    service: TrialService = Depends(_get_service),
) -> TrialStatusResponse:
    """Get the current trial status for the authenticated user."""
    result = await service.get_trial_status(user.id)
    return TrialStatusResponse(**result)


@router.get("/insights", response_model=TrialInsightsResponse)
async def trial_insights(
    user: User = Depends(get_current_user),
    service: TrialService = Depends(_get_service),
) -> TrialInsightsResponse:
    """Get activity insights from the trial period."""
    result = await service.get_trial_insights(user.id)
    return TrialInsightsResponse(**result)
