"""Add radiation_observations table for solar irradiance time series

Revision ID: 002_radiation_observations
Revises: 001_initial_locations
Create Date: 2026-10-12 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_radiation_observations'
down_revision: Union[str, None] = '001_initial_locations'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'radiation_observations',
        sa.Column('id', sa.String(length=36), primary_key=True, nullable=False),
        sa.Column('location_id', sa.String(length=36), sa.ForeignKey('locations.id', ondelete='CASCADE'), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('source', sa.String(length=50), nullable=False, server_default='pvgis'),
        sa.Column('observation_type', sa.String(length=30), nullable=False, server_default='model'),
        sa.Column('ghi', sa.Float(), nullable=False),
        sa.Column('dni', sa.Float(), nullable=False),
        sa.Column('dhi', sa.Float(), nullable=False),
        sa.Column('solar_elevation', sa.Float(), nullable=True),
        sa.Column('solar_azimuth', sa.Float(), nullable=True),
        sa.Column('temperature', sa.Float(), nullable=True),
        sa.Column('quality_flag', sa.String(length=20), nullable=False, server_default='validated'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    )

    op.create_index(op.f('ix_radiation_observations_id'), 'radiation_observations', ['id'], unique=False)
    op.create_index(op.f('ix_radiation_observations_location_id'), 'radiation_observations', ['location_id'], unique=False)
    op.create_index(op.f('ix_radiation_observations_timestamp'), 'radiation_observations', ['timestamp'], unique=False)
    op.create_index(op.f('ix_radiation_observations_source'), 'radiation_observations', ['source'], unique=False)
    op.create_index('idx_rad_obs_loc_time', 'radiation_observations', ['location_id', 'timestamp'], unique=False)
    op.create_index('idx_rad_obs_source_time', 'radiation_observations', ['source', 'timestamp'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_rad_obs_source_time', table_name='radiation_observations')
    op.drop_index('idx_rad_obs_loc_time', table_name='radiation_observations')
    op.drop_index(op.f('ix_radiation_observations_source'), table_name='radiation_observations')
    op.drop_index(op.f('ix_radiation_observations_timestamp'), table_name='radiation_observations')
    op.drop_index(op.f('ix_radiation_observations_location_id'), table_name='radiation_observations')
    op.drop_index(op.f('ix_radiation_observations_id'), table_name='radiation_observations')
    op.drop_table('radiation_observations')
