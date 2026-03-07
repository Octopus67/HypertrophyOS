"""Trial expiration job — downgrades expired trial subscriptions.

Schedule: hourly via APScheduler or system cron.
Usage:
    python -m src.jobs.trial_expiration
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.database import async_session_factory
from src.modules.payments.models import Subscription
from src.shared.types import SubscriptionStatus

logger = logging.getLogger(__name__)


async def run_trial_expiration(session: AsyncSession | None = None) -> int:
    """Expire trial subscriptions past their end date. Returns count expired."""
    owns_session = session is None
    if owns_session:
        session = async_session_factory()

    try:
        count = await _expire_trials(session)
        if owns_session:
            await session.commit()
        return count
    except Exception:
        if owns_session:
            await session.rollback()
        raise
    finally:
        if owns_session:
            await session.close()


async def _expire_trials(session: AsyncSession) -> int:
    """Find and downgrade expired trial subscriptions."""
    now = datetime.now(timezone.utc)

    stmt = (
        select(Subscription)
        .where(
            Subscription.is_trial.is_(True),
            Subscription.status == SubscriptionStatus.ACTIVE,
            Subscription.current_period_end <= now,
            Subscription.deleted_at.is_(None),
        )
    )
    result = await session.execute(stmt)
    expired = result.scalars().all()

    for sub in expired:
        sub.status = SubscriptionStatus.FREE
        logger.info("Expired trial subscription %s for user %s", sub.id, sub.user_id)

    await session.flush()
    logger.info("Trial expiration job: %d subscriptions expired", len(expired))
    return len(expired)


if __name__ == "__main__":
    asyncio.run(run_trial_expiration())
