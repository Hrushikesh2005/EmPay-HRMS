from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.models.employee import EmployeeProfile
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.leave_balance import LeaveBalanceCreate, LeaveBalanceResponse, LeaveBalanceUpdate
from app.services.leave_balance_service import allocate_leave, get_balances_for_employee, update_allocation

router = APIRouter(prefix="/leave-balances", tags=["Leave Balances"])


@router.post("/", response_model=LeaveBalanceResponse, status_code=status.HTTP_201_CREATED)
def allocate_leave_route(
	data: LeaveBalanceCreate,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_roles(UserRole.hr_officer, UserRole.admin)),
) -> LeaveBalanceResponse:
	return allocate_leave(db, data)


@router.get("/me", response_model=list[LeaveBalanceResponse])
def my_balances(
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
) -> list[LeaveBalanceResponse]:
	profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == current_user.id).first()
	if not profile:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")

	year = date.today().year
	return get_balances_for_employee(db, profile.id, year)


@router.get("/{employee_id}", response_model=list[LeaveBalanceResponse])
def employee_balances(
	employee_id: str,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_roles(UserRole.hr_officer, UserRole.payroll_officer, UserRole.admin)),
) -> list[LeaveBalanceResponse]:
	year = date.today().year
	return get_balances_for_employee(db, employee_id, year)


@router.patch("/{balance_id}", response_model=LeaveBalanceResponse)
def update_leave_allocation_route(
	balance_id: str,
	data: LeaveBalanceUpdate,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_roles(UserRole.hr_officer, UserRole.admin)),
) -> LeaveBalanceResponse:
	return update_allocation(db, balance_id, data)
