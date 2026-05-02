from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_hr, require_roles, get_current_user
from app.schemas.employee import EmployeeProfileCreate, EmployeeProfileOut, EmployeeProfileUpdate, SalaryStructureOut
from app.services.employee_service import list_employees, get_employee, update_employee, create_employee_profile, get_employee_salary
from app.models.employee import EmployeeProfile
from app.models.user import User

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.get("", response_model=list[EmployeeProfileOut])
def list_all(db: Session = Depends(get_db), current_user: User = Depends(require_hr)):
	return list_employees(db)


@router.get("/me", response_model=EmployeeProfileOut)
def get_my_profile(
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == current_user.id).first()
	if not profile:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")
	return profile


@router.get("/{employee_id}", response_model=EmployeeProfileOut)
def get_one(employee_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_hr)):
	return get_employee(employee_id, db)


@router.post("", response_model=EmployeeProfileOut)
def create_profile(
	data: EmployeeProfileCreate,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_hr),
):
	return create_employee_profile(data, db)


@router.patch("/{employee_id}", response_model=EmployeeProfileOut)
def update_profile(
	employee_id: str,
	data: EmployeeProfileUpdate,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_hr),
):
	return update_employee(employee_id, data, db)


@router.get("/{employee_id}/salary", response_model=SalaryStructureOut)
def get_salary(
	employee_id: str,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_roles("admin", "payroll_officer")),
):
	return get_employee_salary(employee_id, db)
