from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_roles
from app.schemas.leave import LeaveApplyRequest, LeaveRequestOut
from app.services.leave_service import apply_leave, list_my_leaves, list_all_leaves
from app.models.user import User

router = APIRouter(prefix="/leave-requests", tags=["Leave"])


@router.post("", response_model=LeaveRequestOut)
def apply(
	data: LeaveApplyRequest,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_roles("employee")),
):
	return apply_leave(current_user, data, db)


@router.get("/me", response_model=list[LeaveRequestOut])
def list_me(
	db: Session = Depends(get_db),
	current_user: User = Depends(require_roles("employee")),
):
	return list_my_leaves(current_user, db)


@router.get("", response_model=list[LeaveRequestOut])
def list_all(
	db: Session = Depends(get_db),
	current_user: User = Depends(require_roles("hr_officer", "payroll_officer", "admin")),
):
	return list_all_leaves(db)
