from datetime import date, datetime, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.base import new_uuid
from app.models.employee import EmployeeProfile
from app.models.enums import LeaveRequestStatus
from app.models.leave_type import LeaveType
from app.models.leave_balance import LeaveBalance
from app.models.leave_request import LeaveRequest
from app.schemas.leave_request import LeaveRequestCreate


def calculate_working_days(start: date, end: date) -> Decimal:
    if end < start:
        raise AppException(400, "end_date must be greater than or equal to start_date")

    working_days = 0
    current_day = start
    while current_day <= end:
        if current_day.weekday() < 5:
            working_days += 1
        current_day += timedelta(days=1)

    return Decimal(working_days).quantize(Decimal("0.0"))


def _get_employee_profile(db: Session, employee_id: str) -> EmployeeProfile | None:
    return db.execute(select(EmployeeProfile).where(EmployeeProfile.id == employee_id)).scalar_one_or_none()


def _get_leave_balance(db: Session, employee_id: str, leave_type_id: str, year: int) -> LeaveBalance | None:
    stmt = select(LeaveBalance).where(
        LeaveBalance.employee_id == employee_id,
        LeaveBalance.leave_type_id == leave_type_id,
        LeaveBalance.year == year,
    )
    return db.execute(stmt).scalar_one_or_none()


def create_leave_request(db: Session, employee_id: str, data: LeaveRequestCreate) -> LeaveRequest:
    employee = _get_employee_profile(db, employee_id)
    if not employee:
        raise AppException(404, "Employee profile not found")

    leave_type = db.execute(select(LeaveType).where(LeaveType.id == data.leave_type_id)).scalar_one_or_none()
    if not leave_type:
        raise AppException(404, "Leave type not found")

    current_year = date.today().year
    balance = _get_leave_balance(db, employee_id, data.leave_type_id, current_year)
    total_days = calculate_working_days(data.start_date, data.end_date)

    if leave_type.is_paid:
        if not balance or balance.remaining_days < total_days:
            raise AppException(400, "Insufficient leave balance")

    overlap_stmt = select(LeaveRequest).where(
        LeaveRequest.employee_id == employee_id,
        LeaveRequest.status.in_([LeaveRequestStatus.pending, LeaveRequestStatus.approved]),
        LeaveRequest.start_date <= data.end_date,
        LeaveRequest.end_date >= data.start_date,
    )
    overlapping_request = db.execute(overlap_stmt).scalars().first()
    if overlapping_request:
        raise AppException(409, "An overlapping leave request already exists")

    leave_request = LeaveRequest(
        id=new_uuid(),
        employee_id=employee_id,
        leave_type_id=data.leave_type_id,
        start_date=data.start_date,
        end_date=data.end_date,
        total_days=total_days,
        reason=data.reason,
        status=LeaveRequestStatus.pending,
    )
    db.add(leave_request)
    db.commit()
    db.refresh(leave_request)
    return leave_request


def list_leave_requests_for_employee(
    db: Session,
    employee_id: str,
    status_filter: str | None = None,
) -> list[LeaveRequest]:
    stmt = select(LeaveRequest).where(LeaveRequest.employee_id == employee_id)
    if status_filter is not None:
        stmt = stmt.where(LeaveRequest.status == status_filter)
    stmt = stmt.order_by(LeaveRequest.created_at.desc())
    return db.execute(stmt).scalars().unique().all()


def cancel_leave_request(db: Session, request_id: str, employee_id: str) -> LeaveRequest:
    leave_request = db.execute(select(LeaveRequest).where(LeaveRequest.id == request_id)).scalar_one_or_none()
    if not leave_request:
        raise AppException(404, "Leave request not found")

    if leave_request.employee_id != employee_id:
        raise AppException(403, "You can only cancel your own leave request")

    if leave_request.status != LeaveRequestStatus.pending:
        raise AppException(400, "Only pending requests can be cancelled")

    leave_request.status = LeaveRequestStatus.cancelled
    db.commit()
    db.refresh(leave_request)
    return leave_request


# --- New additions for payroll review ---
def list_leave_requests(
    db: Session,
    request_status: LeaveRequestStatus | None = None,
    employee_id: str | None = None,
    leave_type_id: str | None = None,
) -> list[LeaveRequest]:
    stmt = select(LeaveRequest)
    if request_status is not None:
        stmt = stmt.where(LeaveRequest.status == request_status)
    if employee_id is not None:
        stmt = stmt.where(LeaveRequest.employee_id == employee_id)
    if leave_type_id is not None:
        stmt = stmt.where(LeaveRequest.leave_type_id == leave_type_id)
    stmt = stmt.order_by(LeaveRequest.created_at.desc())
    return db.execute(stmt).scalars().unique().all()


def review_leave_request(
    db: Session,
    request_id: str,
    reviewer_user_id: str,
    action: str,
    remarks: str | None,
) -> LeaveRequest:
    leave_request = db.execute(select(LeaveRequest).where(LeaveRequest.id == request_id)).scalar_one_or_none()
    if not leave_request:
        raise AppException(404, "Leave request not found")

    if leave_request.status != LeaveRequestStatus.pending:
        raise AppException(400, "Only pending requests can be reviewed")

    review_status = LeaveRequestStatus(action)

    if review_status == LeaveRequestStatus.approved:
        if leave_request.leave_type.is_paid:
            current_year = date.today().year
            balance = _get_leave_balance(db, leave_request.employee_id, leave_request.leave_type_id, current_year)
            if not balance:
                raise AppException(400, "Leave balance not found")

            new_used_days = Decimal(balance.used_days) + Decimal(leave_request.total_days)
            if new_used_days > Decimal(balance.allocated_days):
                raise AppException(400, "Approval would exceed allocated leave balance")

            balance.used_days = new_used_days

    leave_request.status = review_status
    leave_request.reviewed_by = reviewer_user_id
    leave_request.reviewed_at = datetime.utcnow()
    leave_request.review_remarks = remarks

    db.commit()
    db.refresh(leave_request)
    return leave_request


def get_my_leave_requests(
    db: Session,
    employee_id: str,
    status_filter: str | None = None,
) -> list[LeaveRequest]:
    """Get leave requests for the current employee.

    Alias for list_leave_requests_for_employee.

    Args:
        db: Database session
        employee_id: Employee ID to fetch requests for
        status_filter: Optional status filter

    Returns:
        List of LeaveRequest objects
    """
    return list_leave_requests_for_employee(db, employee_id, status_filter)
