import secrets
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_permission, get_current_user
from app.core.employee_id import generate_employee_code
from app.models.base import new_uuid
from app.models.employee import EmployeeProfile
from app.models.enums import EmploymentType, UserRole
from app.models.user import User
from app.schemas.user import UserAdminOut, UserStatusUpdate, UserRoleUpdate
from app.services.auth_services import hash_password,verify_password
from app.services.email_service import send_welcome_email

router = APIRouter(prefix="/users", tags=["Users"])


# ── Schema for onboarding ─────────────────────────────────────────────────────

class OnboardEmployeeRequest(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.employee
    department_id: str | None = None
    designation: str | None = None
    phone: str | None = None
    date_of_joining: date | None = None
    employment_type: EmploymentType = EmploymentType.full_time


class OnboardEmployeeResponse(BaseModel):
    user_id: str
    employee_code: str
    email: str
    full_name: str
    email_status: str  # "sent", "failed", or "disabled"

    class Config:
        from_attributes = True


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/onboard", response_model=OnboardEmployeeResponse, status_code=status.HTTP_201_CREATED)
def onboard_employee(
    data: OnboardEmployeeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("directory", "edit", required_level="all")),
):
    """Admin-only: Create a new employee user+profile, generate their employee code,
    and email their temporary credentials."""
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # 1. Temporary password — simple format: Welcome@{year}
    join_year = data.date_of_joining.year if data.date_of_joining else date.today().year
    temp_password = f"Welcome@{join_year}"

    # 2. Create User
    user = User(
        id=new_uuid(),
        email=data.email,
        full_name=data.full_name,
        hashed_password=hash_password(temp_password),
        role=data.role,
        must_change_password=True,
    )
    db.add(user)
    db.flush()  # get user.id without committing

    # 3. Generate employee code
    employee_code = generate_employee_code(data.full_name, join_year, db)

    # 4. Create EmployeeProfile
    profile = EmployeeProfile(
        id=new_uuid(),
        employee_code=employee_code,
        user_id=user.id,
        department_id=data.department_id,
        designation=data.designation,
        phone=data.phone,
        date_of_joining=data.date_of_joining,
        employment_type=data.employment_type,
    )
    db.add(profile)
    db.commit()

    # 5. Send welcome email (non-blocking — failure doesn't roll back)
    email_status = send_welcome_email(
        to_email=data.email,
        full_name=data.full_name,
        employee_code=employee_code,
        temp_password=temp_password,
    )

    return OnboardEmployeeResponse(
        user_id=user.id,
        employee_code=employee_code,
        email=user.email,
        full_name=user.full_name,
        email_status=email_status,
    )


class ChangePasswordRequest(BaseModel):
	current_password: str
	new_password: str = Field(min_length=8)


@router.get("", response_model=list[UserAdminOut])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_permission("settings", "view", required_level="all"))):
    return db.query(User).order_by(User.full_name.asc()).all()


@router.patch("/{user_id}/status", response_model=UserAdminOut)
def update_user_status(
    user_id: str,
    data: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("settings", "edit", required_level="all")),
):
    print(f"DEBUG: Attempting to update status for user_id: {user_id}")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        print(f"DEBUG: User with id {user_id} NOT FOUND in database")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return user



@router.patch("/{user_id}/change-password")
def change_password(
	user_id: str,
	data: ChangePasswordRequest,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	# Only the account owner can change their own password
	if current_user.id != user_id:
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only change your own password")

	if not verify_password(data.current_password, current_user.hashed_password):
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

	current_user.hashed_password = hash_password(data.new_password)
	db.commit()
	return {"message": "Password changed successfully"}



@router.patch("/{user_id}/role", response_model=UserAdminOut)
def update_user_role(
    user_id: str,
    data: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("settings", "edit", required_level="all")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.role = data.role
    db.commit()
    db.refresh(user)
    return user
