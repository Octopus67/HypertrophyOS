"""Workout reminder job — sends push to users who haven't trained in 24h.

Schedule: daily via APScheduler or system cron.
Usage:
    python -m src.jobs.workout_reminders          # one-shot
    # Or register with APScheduler:
    # scheduler.add_job(run_workout_reminders, "cron", hour=9)
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.database import async_session_factory
from src.modules.auth.models import User
from src.modules.notifications.models import NotificationLog, NotificationPreference
from src.modules.notifications.service import NotificationService
from src.modules.training.models import TrainingSession

logger = logging.getLogger(__name__)


async def run_workout_reminders(session: AsyncSession | None = None) -> int:
    """Send workout reminders to eligible users. Returns count of notifications sent."""
    owns_session = session is None
    if owns_session:
        session = async_session_factory()

    try:
        sent = await _send_reminders(session)
        if owns_session:
            await session.commit()
        return sent
    except Exception:
        if owns_session:
            await session.rollback()
        raise
    finally:
        if owns_session:
            await session.close()


async def _send_reminders(session: AsyncSession) -> int:
    """Core logic: find users without recent training and send reminders."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    today = datetime.now(timezone.utc).date()

    # Users who trained in the last 24h
    recent_trainers = (
        select(TrainingSession.user_id)
        .where(TrainingSession.session_date >= today - timedelta(days=1))
        .distinct()
    )

    # Users who already got a workout_reminder today
    already_notified = (
        select(NotificationLog.user_id)
        .where(
            NotificationLog.type == "workout_reminder",
            NotificationLog.sent_at >= cutoff,
        )
        .distinct()
    )

    # Users with workout_reminders enabled
    eligible = (
        select(User.id)
        .join(NotificationPreference, NotificationPreference.user_id == User.id)
        .where(
            NotificationPreference.push_enabled.is_(True),
            NotificationPreference.workout_reminders.is_(True),
            User.id.notin_(recent_trainers),
            User.id.notin_(already_notified),
        )
    )

    result = await session.execute(eligible)
    user_ids = [row[0] for row in result.all()]

    sent = 0
    notif_svc = NotificationService(session)
    for uid in user_ids:
        try:
            count = await notif_svc.send_push(
                user_id=uid,
                title="Time to train!",
                body="You haven't logged a workout today",
                notification_type="workout_reminder",
                data={"screen": "Logs"},
            )
            if count > 0:
                sent += 1
        except Exception:
            logger.exception("Failed to send workout reminder to user %s", uid)

    logger.info("Workout reminders sent: %d / %d eligible", sent, len(user_ids))
    return sent


if __name__ == "__main__":
    asyncio.run(run_workout_reminders())
