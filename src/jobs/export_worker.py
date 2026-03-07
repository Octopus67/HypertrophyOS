"""Background worker for processing pending export requests.

Schedule: run periodically via APScheduler or cron.
Usage:
    python -m src.jobs.export_worker          # one-shot
"""

from __future__ import annotations

import asyncio
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.database import async_session_factory
from src.modules.export.models import ExportRequest
from src.modules.export.service import ExportService

logger = logging.getLogger(__name__)


async def run_export_worker(session: AsyncSession | None = None) -> int:
    """Process all pending export requests. Returns count processed."""
    owns_session = session is None
    if owns_session:
        session = async_session_factory()

    try:
        stmt = select(ExportRequest).where(ExportRequest.status == "pending")
        result = await session.execute(stmt)
        pending = list(result.scalars().all())

        processed = 0
        service = ExportService(session)
        for export in pending:
            try:
                await service.generate_export(export.id)
                processed += 1
            except Exception:
                logger.exception("Failed to process export %s", export.id)

        if owns_session:
            await session.commit()

        logger.info("Export worker processed %d / %d pending exports", processed, len(pending))
        return processed
    except Exception:
        if owns_session:
            await session.rollback()
        raise
    finally:
        if owns_session:
            await session.close()


if __name__ == "__main__":
    asyncio.run(run_export_worker())
