from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.models.enums import UserRole
from app.models.user import User
from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.get("", response_model=list[DepartmentResponse])
def get_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> list[DepartmentResponse]:
    """Get all departments. Any authenticated user can view departments."""
    stmt = select(Department).order_by(Department.name)
    departments = db.execute(stmt).scalars().all()
    return departments

@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("settings", "edit", "all"))
) -> DepartmentResponse:
    """Create a new department. Admin/HR only."""
    # Check for existing department
    existing = db.execute(select(Department).where(Department.name == data.name)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A department with this name already exists"
        )
        
    dept = Department(name=data.name, description=data.description)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

@router.put("/{dept_id}", response_model=DepartmentResponse)
def update_department(
    dept_id: str,
    data: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("settings", "edit", "all"))
) -> DepartmentResponse:
    """Update a department. Admin/HR only."""
    dept = db.execute(select(Department).where(Department.id == dept_id)).scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    if data.name is not None and data.name != dept.name:
        existing = db.execute(select(Department).where(Department.name == data.name)).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A department with this name already exists"
            )
        dept.name = data.name
        
    if data.description is not None:
        dept.description = data.description
        
    db.commit()
    db.refresh(dept)
    return dept

@router.delete("/{dept_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(
    dept_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("settings", "edit", "all"))
):
    """Delete a department. Admin/HR only."""
    dept = db.execute(select(Department).where(Department.id == dept_id)).scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    # Check if there are employees assigned
    if dept.employees:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete department. There are employees assigned to it."
        )
        
    db.delete(dept)
    db.commit()
    return None
