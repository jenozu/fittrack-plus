"""food entries by grams

Revision ID: b2d4f6a8c0e1
Revises: a1c2d3e4f5a6
"""
from alembic import op
import sqlalchemy as sa

revision = 'b2d4f6a8c0e1'
down_revision = 'a1c2d3e4f5a6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # foods is owned by food_data/schema.sql; FK added only if that table exists.
    op.add_column('food_entries', sa.Column('food_id', sa.BigInteger(), nullable=True))
    op.add_column('food_entries', sa.Column('grams', sa.Float(), nullable=True))
    op.add_column('food_entries', sa.Column('portion_label', sa.Text(), nullable=True))
    op.add_column('food_entries', sa.Column('fiber_g', sa.Float(), nullable=True))
    op.add_column('food_entries', sa.Column('sugar_g', sa.Float(), nullable=True))
    op.add_column('food_entries', sa.Column('sodium_mg', sa.Float(), nullable=True))
    op.create_index('ix_food_entries_food_id', 'food_entries', ['food_id'])
    op.execute("""
        DO $$ BEGIN
          IF to_regclass('public.foods') IS NOT NULL THEN
            ALTER TABLE food_entries ADD CONSTRAINT fk_food_entries_food_id
              FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE SET NULL;
          END IF;
        END $$;
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE food_entries DROP CONSTRAINT IF EXISTS fk_food_entries_food_id")
    op.drop_index('ix_food_entries_food_id', table_name='food_entries')
    for c in ('sodium_mg', 'sugar_g', 'fiber_g', 'portion_label', 'grams', 'food_id'):
        op.drop_column('food_entries', c)
