from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.base import new_uuid
from app.models.leave_balance import LeaveBalance
from app.models.leave_type import LeaveType
from app.schemas.leave_balance import LeaveBalanceCreate, LeaveBalanceUpdate


def allocate_leave(db: Session, data: LeaveBalanceCreate) -> LeaveBalance:
	stmt = select(LeaveBalance).where(
		LeaveBalance.employee_id == data.employee_id,
		LeaveBalance.leave_type_id == data.leave_type_id,
		LeaveBalance.year == data.year,
	)
	existing = db.execute(stmt).scalar_one_or_none()
	if existing:
		raise AppException(409, "Leave already allocated for this year")

	balance = LeaveBalance(
		id=new_uuid(),
		employee_id=data.employee_id,
		leave_type_id=data.leave_type_id,
		year=data.year,
		allocated_days=data.allocated_days,
		used_days=Decimal("0.0"),
	)
	db.add(balance)
	db.commit()
	db.refresh(balance)
	return balance


def update_allocation(db: Session, balance_id: str, data: LeaveBalanceUpdate) -> LeaveBalance:
	balance = db.execute(select(LeaveBalance).where(LeaveBalance.id == balance_id)).scalar_one_or_none()
	if not balance:
		raise AppException(404, "Leave balance not found")

	balance.allocated_days = data.allocated_days
	db.commit()
	db.refresh(balance)
	return balance


def get_balances_for_employee(db: Session, employee_id: str, year: int) -> list[LeaveBalance]:
	stmt = (
		select(LeaveBalance)
		.join(LeaveBalance.leave_type)
		.where(LeaveBalance.employee_id == employee_id, LeaveBalance.year == year)
		.order_by(LeaveType.name)
	)
	return db.execute(stmt).scalars().unique().all()
