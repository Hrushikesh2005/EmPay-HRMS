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


def allocate_base_leaves(db: Session, employee_id: str) -> list[LeaveBalance]:
	from datetime import date
	current_year = date.today().year

	# Check if any balances already exist for this employee for the current year
	stmt = select(LeaveBalance).where(
		LeaveBalance.employee_id == employee_id,
		LeaveBalance.year == current_year
	)
	existing = db.execute(stmt).scalars().first()
	if existing:
		raise AppException(400, "Base leaves are already allocated for this employee.")

	# Get all leave types
	leave_types = db.execute(select(LeaveType)).scalars().all()
	if not leave_types:
		raise AppException(400, "No leave types found in the system to allocate.")

	new_balances = []
	for lt in leave_types:
		balance = LeaveBalance(
			id=new_uuid(),
			employee_id=employee_id,
			leave_type_id=lt.id,
			year=current_year,
			allocated_days=Decimal(str(lt.default_days_per_year)),
			used_days=Decimal("0.0"),
		)
		db.add(balance)
		new_balances.append(balance)

	db.commit()
	for b in new_balances:
		db.refresh(b)
	
	return new_balances
