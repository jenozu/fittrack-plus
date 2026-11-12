"""favourite foods

Revision ID: c3e5a7b9d1f2
Revises: b2d4f6a8c0e1
"""
from alembic import op
import sqlalchemy as sa

revision = 'c3e5a7b9d1f2'
down_revision = 'b2d4f6a8c0e1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # foods is owned by food_data/schema.sql; FK added only if that table exists.
    op.create_table(
        'favourite_foods',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('food_id', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.UniqueConstraint('user_id', 'food_id', name='uq_favourite_foods_user_food'),
    )
    op.create_index('ix_favourite_foods_user_id', 'favourite_foods', ['user_id'])
    op.execute("""
        DO $$ BEGIN
          IF to_regclass('public.foods') IS NOT NULL THEN
            ALTER TABLE favourite_foods ADD CONSTRAINT fk_favourite_foods_food_id
              FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE;
          END IF;
        END $$;
    """)


def downgrade() -> None:
    op.drop_index('ix_favourite_foods_user_id', table_name='favourite_foods')
    op.drop_table('favourite_foods')
