"""add users columns missing from old installs

Revision ID: a1c2d3e4f5a6
Revises: bf60e849d28a
"""
from alembic import op

revision = 'a1c2d3e4f5a6'
down_revision = 'bf60e849d28a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # No-op on fresh dbs (baseline already has them); fixes old installs.
    for ddl in (
        "water_goal_cups DOUBLE PRECISION",
        "ai_scans_used INTEGER",
        "ai_scans_reset_date DATE",
        "ai_scans_monthly_limit INTEGER",
        "xp INTEGER",
        "level INTEGER",
    ):
        op.execute(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {ddl}")


def downgrade() -> None:
    pass  # columns belong to the baseline on fresh dbs
