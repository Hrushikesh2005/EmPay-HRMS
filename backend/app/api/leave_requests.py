from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.models.employee import EmployeeProfile
from app.models.enums import LeaveRequestStatus
from app.models.user import User
from app.schemas.leave_request import LeaveRequestCreate, LeaveRequestResponse, LeaveReviewRequest
from app.services.leave_request_service import (
    cancel_leave_request,
    create_leave_request,
    list_leave_requests,
    get_my_leave_requests,
    review_leave_request,
)

router = APIRouter(prefix="/leave-requests", tags=["Leave Requests"])


@router.post("/", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
def submit_leave_request(
    data: LeaveRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leave", "edit")),
) -> LeaveRequestResponse:
    # If employee_id is provided and user is HR/Admin, use that. Otherwise use current user's profile.
    target_profile_id = None
    
    if data.employee_id:
        # Check if current user has 'all' access to 'leave' to submit for others
        # (This is handled by our require_permission dependency if we check level here)
        # But we'll do a quick manual check for safety.
        from app.models.permission import Permission
        role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        perm = db.query(Permission).filter(Permission.role == role_str, Permission.module == "leave").first()
        if not perm or perm.access_level.value != "all":
             raise HTTPException(status_code=403, detail="You do not have permission to submit leave for others")
        target_profile_id = data.employee_id
    else:
        profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == current_user.id).first()
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")
        target_profile_id = profile.id
        
    return create_leave_request(db, target_profile_id, data)


@router.get("/me", response_model=list[LeaveRequestResponse])
def list_my_leave_requests(
    request_status: LeaveRequestStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leave", "view")),
) -> list[LeaveRequestResponse]:
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")
    status_filter = request_status.value if request_status is not None else None
    return get_my_leave_requests(db, profile.id, status_filter)


@router.patch("/{request_id}/cancel", response_model=LeaveRequestResponse)
def cancel_own_leave_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leave", "edit")),
) -> LeaveRequestResponse:
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")
    return cancel_leave_request(db, request_id, profile.id)


@router.get("/", response_model=list[LeaveRequestResponse])
def list_all_leave_requests(
    request_status: LeaveRequestStatus | None = Query(default=None, alias="status"),
    employee_id: str | None = None,
    leave_type_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leave", "view", required_level="all")),
) -> list[LeaveRequestResponse]:
    return list_leave_requests(db, request_status=request_status, employee_id=employee_id, leave_type_id=leave_type_id)


@router.patch("/{request_id}/review", response_model=LeaveRequestResponse)
def review_leave_request_route(
    request_id: str,
    data: LeaveReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leave", "edit", required_level="all")),
) -> LeaveRequestResponse:
    return review_leave_request(db, request_id, current_user.id, data.action, data.review_remarks)
