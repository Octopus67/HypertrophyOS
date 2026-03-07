"""Pydantic schemas for data export."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


class ExportRequestCreate(BaseModel):
    """Request body for creating an export."""

    format: str

    @field_validator("format")
    @classmethod
    def validate_format(cls, v: str) -> str:
        allowed = {"json", "csv", "pdf"}
        if v.lower() not in allowed:
            raise ValueError(f"format must be one of {allowed}")
        return v.lower()


class ExportRequestResponse(BaseModel):
    """Response for an export request."""

    id: str
    format: str
    status: str
    file_size_bytes: Optional[int] = None
    error_message: Optional[str] = None
    requested_at: datetime
    completed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    downloaded_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ExportDownloadResponse(BaseModel):
    """Response containing the download path."""

    download_url: str
    file_size_bytes: Optional[int] = None
