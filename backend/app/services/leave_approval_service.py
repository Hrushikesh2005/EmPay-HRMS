"""Admin leave approval service.

Handles leave request approvals, rejections, and retrieval for admin dashboard.
All functions are plain def (no async/await).
"""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.leave_request import LeaveRequest
from app.models.leave_balance import LeaveBalance
from app.models.enums import LeaveRequestStatus


def get_all_leave_requests(
    db: Session,
    status_filter: str | None = None,
    employee_id_filter: str | None = None,
) -> list[LeaveRequest]:
    """Get all leave requests with optional filters.

    Joins leave_requests → employee_profiles → users → leave_types.
    Applies status and employee_id filters if provided.
    Orders by created_at descending (newest first).

    Args:
        db: Database session
        status_filter: Optional status filter (e.g., "pending", "approved")
        employee_id_filter: Optional employee_id filter

    Returns:
        List of LeaveRequest objects with relationships loaded
    """
    stmt = select(LeaveRequest)

    if status_filter is not None:
        stmt = stmt.where(LeaveRequest.status == status_filter)

    if employee_id_filter is not None:
        stmt = stmt.where(LeaveRequest.employee_id == employee_id_filter)

    stmt = stmt.order_by(LeaveRequest.created_at.desc())
    return db.execute(stmt).scalars().unique().all()


def get_pending_requests(db: Session) -> list[LeaveRequest]:
    """Get all pending leave requests.

    Returns requests where status = "pending".
    Orders by created_at ascending (oldest first in queue).

    Args:
        db: Database session

    Returns:
        List of pending LeaveRequest objects
    """
    stmt = (
        select(LeaveRequest)
        .where(LeaveRequest.status == LeaveRequestStatus.pending)
        .order_by(LeaveRequest.created_at.asc())
    )
    return db.execute(stmt).scalars().unique().all()


def get_pending_count(db: Session) -> int:
    """Get count of pending leave requests.

    Args:
        db: Database session

    Returns:
        Count of pending leave requests
    """
    stmt = select(LeaveRequest).where(LeaveRequest.status == LeaveRequestStatus.pending)
    result = db.execute(stmt).scalars().all()
    return len(result)


def approve_leave_request(
    db: Session,
    request_id: str,
    reviewer_user_id: str,
    remarks: str | None = None,
) -> LeaveRequest:
    """Approve a pending leave request.

    - Finds the request by id; raises AppException 404 if not found
    - Raises AppException 400 if status != "pending"
    - Finds the leave balance for employee/leave_type/current_year
    - Raises AppException 400 if balance not found
    - Guards against exceeding allocated leave balance
    - In a single transaction:
        * Updates request status to "approved"
        * Sets reviewed_by and reviewed_at
        * Sets review_remarks if provided
        * Increments balance.used_days by request.total_days
    - Commits and returns updated request

    Args:
        db: Database session
        request_id: ID of the leave request to approve
        reviewer_user_id: ID of the user approving the request
        remarks: Optional review remarks

    Returns:
        Updated LeaveRequest object

    Raises:
        AppException: If request not found (404), status invalid (400),
                     balance not found (400), or approval would exceed balance (400)
    """
    leave_request = db.execute(
        select(LeaveRequest).where(LeaveRequest.id == request_id)
    ).scalar_one_or_none()

    if not leave_request:
        raise AppException(404, "Leave request not found")

    if leave_request.status != LeaveRequestStatus.pending:
        raise AppException(400, "Only pending requests can be reviewed")

    current_year = date.today().year
    balance = db.execute(
        select(LeaveBalance).where(
            LeaveBalance.employee_id == leave_request.employee_id,
            LeaveBalance.leave_type_id == leave_request.leave_type_id,
            LeaveBalance.year == current_year,
        )
    ).scalar_one_or_none()

    if not balance:
        raise AppException(
            400, "Leave balance not found for this employee and leave type"
        )

    new_used_days = Decimal(balance.used_days) + Decimal(
        leave_request.total_days
    )
    if new_used_days > Decimal(balance.allocated_days):
        raise AppException(400, "Approval would exceed allocated leave balance")

    # Transaction: update both request and balance
    leave_request.status = LeaveRequestStatus.approved
    leave_request.reviewed_by = reviewer_user_id
    leave_request.reviewed_at = datetime.utcnow()
    leave_request.review_remarks = remarks

    balance.used_days = new_used_days

    db.commit()
    db.refresh(leave_request)

    return leave_request


def reject_leave_request(
    db: Session,
    request_id: str,
    reviewer_user_id: str,
    remarks: str | None = None,
) -> LeaveRequest:
    """Reject a pending leave request.

    - Finds the request by id; raises AppException 404 if not found
    - Raises AppException 400 if status != "pending"
    - In a single transaction:
        * Updates request status to "rejected"
        * Sets reviewed_by and reviewed_at
        * Sets review_remarks if provided
    - Note: leave_balances is NOT touched on rejection
    - Commits and returns updated request

    Args:
        db: Database session
        request_id: ID of the leave request to reject
        reviewer_user_id: ID of the user rejecting the request
        remarks: Optional review remarks

    Returns:
        Updated LeaveRequest object

    Raises:
        AppException: If request not found (404) or status invalid (400)
    """
    leave_request = db.execute(
        select(LeaveRequest).where(LeaveRequest.id == request_id)
    ).scalar_one_or_none()

    if not leave_request:
        raise AppException(404, "Leave request not found")

    if leave_request.status != LeaveRequestStatus.pending:
        raise AppException(400, "Only pending requests can be reviewed")

    # Transaction: update request only (balance NOT touched)
    leave_request.status = LeaveRequestStatus.rejected
    leave_request.reviewed_by = reviewer_user_id
    leave_request.reviewed_at = datetime.utcnow()
    leave_request.review_remarks = remarks

    db.commit()
    db.refresh(leave_request)

    return leave_request
