"""add employee_code to employee_profiles

Revision ID: a1b2c3d4e5f6
Revises: 21232ece52e3
Create Date: 2026-05-02

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '21232ece52e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('employee_profiles',
        sa.Column('employee_code', sa.String(length=20), nullable=True)
    )
    op.create_unique_constraint('uq_employee_code', 'employee_profiles', ['employee_code'])
    op.create_index('ix_employee_profiles_employee_code', 'employee_profiles', ['employee_code'])


def downgrade() -> None:
    op.drop_index('ix_employee_profiles_employee_code', table_name='employee_profiles')
    op.drop_constraint('uq_employee_code', 'employee_profiles', type_='unique')
    op.drop_column('employee_profiles', 'employee_code')
