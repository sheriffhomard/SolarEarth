"""Initial locations table for SQLite and relational databases

Revision ID: 001_initial_locations
Revises: 
Create Date: 2026-10-12 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_locations'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'locations',
        sa.Column('id', sa.String(length=36), primary_key=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('geom_wkt', sa.String(length=100), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('timezone', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    )

    op.create_index(op.f('ix_locations_id'), 'locations', ['id'], unique=False)
    op.create_index(op.f('ix_locations_name'), 'locations', ['name'], unique=False)
    op.create_index(op.f('ix_locations_latitude'), 'locations', ['latitude'], unique=False)
    op.create_index(op.f('ix_locations_longitude'), 'locations', ['longitude'], unique=False)
    op.create_index(op.f('ix_locations_country'), 'locations', ['country'], unique=False)
    op.create_index('idx_locations_lat_lon', 'locations', ['latitude', 'longitude'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_locations_lat_lon', table_name='locations')
    op.drop_index(op.f('ix_locations_country'), table_name='locations')
    op.drop_index(op.f('ix_locations_longitude'), table_name='locations')
    op.drop_index(op.f('ix_locations_latitude'), table_name='locations')
    op.drop_index(op.f('ix_locations_name'), table_name='locations')
    op.drop_index(op.f('ix_locations_id'), table_name='locations')
    op.drop_table('locations')
