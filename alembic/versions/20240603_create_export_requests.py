"""Create export_requests table for GDPR data portability.

Revision ID: export_001
Revises:
Create Date: 2024-06-03
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "export_001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "export_requests",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("format", sa.String(10), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("download_url", sa.Text, nullable=True),
        sa.Column("file_size_bytes", sa.Integer, nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("downloaded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_export_requests_user_id", "export_requests", ["user_id"])
    op.create_index("ix_export_requests_status", "export_requests", ["status"])
    op.create_index("ix_export_requests_expires_at", "export_requests", ["expires_at"])


def downgrade() -> None:
    op.drop_index("ix_export_requests_expires_at", table_name="export_requests")
    op.drop_index("ix_export_requests_status", table_name="export_requests")
    op.drop_index("ix_export_requests_user_id", table_name="export_requests")
    op.drop_table("export_requests")
