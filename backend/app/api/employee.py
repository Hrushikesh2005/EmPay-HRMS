from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_hr
from app.schemas.employee import EmployeeProfileCreate, EmployeeProfileOut, EmployeeProfileUpdate
from app.services.employee_service import list_employees, get_employee, update_employee, create_employee_profile
from app.models.user import User

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.get("", response_model=list[EmployeeProfileOut])
def list_all(db: Session = Depends(get_db), current_user: User = Depends(require_hr)):
	return list_employees(db)


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
