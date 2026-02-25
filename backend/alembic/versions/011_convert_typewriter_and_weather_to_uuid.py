"""Convert typewriter_contents and weather id columns from Integer to UUID

Revision ID: 011
Revises: 010
Create Date: 2026-02-15 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '011'
down_revision: Union[str, None] = '010'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Convert typewriter_contents.id from Integer to UUID
    # First, add a new UUID column
    op.add_column('typewriter_contents',
                  sa.Column('id_new', postgresql.UUID(as_uuid=True), nullable=True))

    # Migrate existing data: convert integer IDs to UUIDs
    op.execute("""
        UPDATE typewriter_contents
        SET id_new = gen_random_uuid()
        WHERE id_new IS NULL
    """)

    # Drop the old id column and rename the new one
    # Note: This will drop and recreate the primary key constraint
    op.execute("""
        ALTER TABLE typewriter_contents
        DROP CONSTRAINT typewriter_contents_pkey
    """)

    op.execute("""
        ALTER TABLE typewriter_contents
        ALTER COLUMN id_new SET NOT NULL
    """)

    op.execute("""
        ALTER TABLE typewriter_contents
        ADD CONSTRAINT typewriter_contents_pkey PRIMARY KEY (id_new)
    """)

    op.execute("""
        ALTER TABLE typewriter_contents
        RENAME COLUMN id_new TO id
    """)

    # Convert weather.id from Integer to UUID
    op.add_column('weather',
                  sa.Column('id_new', postgresql.UUID(as_uuid=True), nullable=True))

    op.execute("""
        UPDATE weather
        SET id_new = gen_random_uuid()
        WHERE id_new IS NULL
    """)

    op.execute("""
        ALTER TABLE weather
        DROP CONSTRAINT weather_pkey
    """)

    op.execute("""
        ALTER TABLE weather
        ALTER COLUMN id_new SET NOT NULL
    """)

    op.execute("""
        ALTER TABLE weather
        ADD CONSTRAINT weather_pkey PRIMARY KEY (id_new)
    """)

    op.execute("""
        ALTER TABLE weather
        RENAME COLUMN id_new TO id
    """)


def downgrade() -> None:
    # Revert typewriter_contents.id from UUID back to Integer
    op.add_column('typewriter_contents',
                  sa.Column('id_new', sa.Integer(), autoincrement=True, nullable=True))

    op.execute("""
        ALTER TABLE typewriter_contents
        DROP CONSTRAINT typewriter_contents_pkey
    """)

    op.execute("""
        ALTER TABLE typewriter_contents
        ALTER COLUMN id_new SET NOT NULL
    """)

    op.execute("""
        ALTER TABLE typewriter_contents
        ADD CONSTRAINT typewriter_contents_pkey PRIMARY KEY (id_new)
    """)

    op.execute("""
        ALTER TABLE typewriter_contents
        RENAME COLUMN id_new TO id
    """)

    op.drop_column('typewriter_contents', 'id')

    # Revert weather.id from UUID back to Integer
    op.add_column('weather',
                  sa.Column('id_new', sa.Integer(), autoincrement=True, nullable=True))

    op.execute("""
        ALTER TABLE weather
        DROP CONSTRAINT weather_pkey
    """)

    op.execute("""
        ALTER TABLE weather
        ALTER COLUMN id_new SET NOT NULL
    """)

    op.execute("""
        ALTER TABLE weather
        ADD CONSTRAINT weather_pkey PRIMARY KEY (id_new)
    """)

    op.execute("""
        ALTER TABLE weather
        RENAME COLUMN id_new TO id
    """)

    op.drop_column('weather', 'id')
