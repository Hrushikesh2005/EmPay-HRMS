"""drop manager_id from employee_profiles

Revision ID: b2c3d4e5f6a1
Revises: a1b2c3d4e5f6
Create Date: 2026-05-02

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b2c3d4e5f6a1'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint('employee_profiles_manager_id_fkey', 'employee_profiles', type_='foreignkey')
    op.drop_column('employee_profiles', 'manager_id')


def downgrade() -> None:
    op.add_column('employee_profiles',
        sa.Column('manager_id', sa.String(length=36), nullable=True)
    )
    op.create_foreign_key(
        'employee_profiles_manager_id_fkey',
        'employee_profiles', 'employee_profiles',
        ['manager_id'], ['id'],
        ondelete='SET NULL'
    )
