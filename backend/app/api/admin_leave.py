"""Admin leave approval routes.

APIRouter for admin leave request approvals and rejections.
Prefix: /admin/leave
Tag: "Admin - Leave"
All endpoints are sync (no async/await).
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import require_roles, require_permission
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.leave_request import LeaveQueueItem, LeaveReviewRequest
from app.services.leave_approval_service import (
    get_all_leave_requests,
    get_pending_requests,
    get_pending_count,
    approve_leave_request,
    reject_leave_request,
)

router = APIRouter(prefix="/admin/leave", tags=["Admin - Leave"])


@router.get("/requests", response_model=list[LeaveQueueItem])
def list_all_leave_requests(
    status: str | None = Query(None, description="Filter by status (e.g., pending, approved, rejected)"),
    employee_id: str | None = Query(None, description="Filter by employee_id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leave", "view", "all")),
) -> list[LeaveQueueItem]:
    """Get all leave requests with optional filters.

    Query params:
        - status: Optional status filter
        - employee_id: Optional employee_id filter

    Returns:
        List of LeaveQueueItem (for admin approval queue panel)
    """
    requests = get_all_leave_requests(
        db,
        status_filter=status,
        employee_id_filter=employee_id,
    )
    return requests


@router.get("/requests/pending", response_model=list[LeaveQueueItem])
def list_pending_leave_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leave", "view", "all")),
) -> list[LeaveQueueItem]:
    """Get all pending leave requests.

    Drives the Team Approvals Queue panel on the frontend.
    Ordered by created_at ascending (oldest first).

    Returns:
        List of pending LeaveQueueItem
    """
    requests = get_pending_requests(db)
    return requests


@router.get("/requests/pending-count", response_model=dict)
def get_pending_leave_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leave", "view", "all")),
) -> dict:
    """Get count of pending leave requests.

    Drives the pending badge number on the admin dashboard.

    Returns:
        Dict with "count" key
    """
    count = get_pending_count(db)
    return {"count": count}


@router.patch("/requests/{request_id}/approve", response_model=LeaveQueueItem)
def approve_leave(
    request_id: str,
    data: LeaveReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leave", "edit", "all")),
) -> LeaveQueueItem:
    """Approve a pending leave request.

    Body:
        - review_remarks: Optional remarks

    Returns:
        Updated LeaveQueueItem
    """
    request = approve_leave_request(
        db,
        request_id,
        current_user.id,
        data.review_remarks,
    )
    return request


@router.patch("/requests/{request_id}/reject", response_model=LeaveQueueItem)
def reject_leave(
    request_id: str,
    data: LeaveReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leave", "edit", "all")),
) -> LeaveQueueItem:
    """Reject a pending leave request.

    Body:
        - review_remarks: Optional remarks

    Returns:
        Updated LeaveQueueItem
    """
    request = reject_leave_request(
        db,
        request_id,
        current_user.id,
        data.review_remarks,
    )
    return request
