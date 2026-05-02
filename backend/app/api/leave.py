from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.dependencies.auth import require_roles
from app.schemas.leave import LeaveApplyRequest, LeaveRequestOut
from app.services.leave_service import apply_leave, list_my_leaves, list_all_leaves
from app.models.user import User

router = APIRouter(prefix="/leave-requests-legacy", tags=["Leave (Legacy)"])


@router.post("", response_model=LeaveRequestOut)
def apply(
	data: LeaveApplyRequest,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_roles("employee")),
):
	result = apply_leave(current_user, data, db)
	return LeaveRequestOut.from_orm_with_name(result)


@router.get("/me", response_model=list[LeaveRequestOut])
def list_me(
	db: Session = Depends(get_db),
	current_user: User = Depends(require_roles("employee")),
):
	results = list_my_leaves(current_user, db)
	return [LeaveRequestOut.from_orm_with_name(r) for r in results]


@router.get("", response_model=list[LeaveRequestOut])
def list_all(
	db: Session = Depends(get_db),
	current_user: User = Depends(require_roles("hr_officer", "payroll_officer", "admin")),
):
	results = list_all_leaves(db)
	return [LeaveRequestOut.from_orm_with_name(r) for r in results]
