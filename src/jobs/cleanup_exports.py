"""Cleanup job for expired export files.

Schedule: daily via APScheduler or cron.
Usage:
    python -m src.jobs.cleanup_exports        # one-shot
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.database import async_session_factory
from src.modules.export.models import ExportRequest

logger = logging.getLogger(__name__)


async def run_cleanup_exports(session: AsyncSession | None = None) -> int:
    """Delete expired export requests and their files. Returns count cleaned."""
    owns_session = session is None
    if owns_session:
        session = async_session_factory()

    try:
        now = datetime.now(timezone.utc)
        stmt = select(ExportRequest).where(
            ExportRequest.expires_at.isnot(None),
            ExportRequest.expires_at <= now,
        )
        result = await session.execute(stmt)
        expired = list(result.scalars().all())

        cleaned = 0
        for export in expired:
            # Remove file
            if export.download_url:
                path = Path(export.download_url)
                if path.exists():
                    path.unlink(missing_ok=True)
                    logger.debug("Deleted export file: %s", path)
            await session.delete(export)
            cleaned += 1

        if owns_session:
            await session.commit()

        logger.info("Cleanup: removed %d expired exports", cleaned)
        return cleaned
    except Exception:
        if owns_session:
            await session.rollback()
        raise
    finally:
        if owns_session:
            await session.close()


if __name__ == "__main__":
    asyncio.run(run_cleanup_exports())
