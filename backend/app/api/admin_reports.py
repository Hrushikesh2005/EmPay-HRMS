"""Admin report API routes.

Endpoints for leave reports, summaries, and CSV exports.
All routes are sync (no async/await).
"""

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import require_roles
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.report import LeaveReportRow, LeaveSummaryStats, AttendanceReportRow
from app.services.report_service import (
    get_leave_report,
    get_leave_summary_stats,
    export_leave_report_csv,
    get_attendance_report,
)
from datetime import date

router = APIRouter(prefix="/admin/reports", tags=["Admin - Reports"])

@router.get("/attendance", response_model=list[AttendanceReportRow])
def get_attendance_report_endpoint(
    month: int = Query(default_factory=lambda: date.today().month, description="Month to report on"),
    year: int = Query(default_factory=lambda: date.today().year, description="Year to report on"),
    department_id: str | None = Query(None, description="Filter by department ID"),
    employee_id: str | None = Query(None, description="Filter by employee ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
) -> list[AttendanceReportRow]:
    """Get monthly attendance report with filters.

    Query params:
        - month: Month to report on (default: current month)
        - year: Year to report on (default: current year)
        - department_id: Optional department filter
        - employee_id: Optional employee filter

    Returns:
        List of AttendanceReportRow
    """
    return get_attendance_report(
        db,
        month,
        year,
        department_id=department_id,
        employee_id=employee_id,
    )


@router.get("/leave", response_model=list[LeaveReportRow])
def get_leave_report_endpoint(
    year: int = Query(default_factory=lambda: date.today().year, description="Year to report on"),
    department_id: str | None = Query(None, description="Filter by department ID"),
    leave_type_id: str | None = Query(None, description="Filter by leave type ID"),
    employee_id: str | None = Query(None, description="Filter by employee ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
) -> list[LeaveReportRow]:
    """Get detailed leave report with filters.

    Query params:
        - year: Year to report on (default: current year)
        - department_id: Optional department filter
        - leave_type_id: Optional leave type ID filter
        - employee_id: Optional employee ID filter

    Returns:
        List of LeaveReportRow with breakdown by employee, leave type, and balances
    """
    return get_leave_report(
        db,
        year,
        department_id=department_id,
        leave_type_id=leave_type_id,
        employee_id=employee_id,
    )


@router.get("/leave/summary", response_model=LeaveSummaryStats)
def get_leave_summary_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
) -> LeaveSummaryStats:
    """Get leave management summary statistics.

    Used for dashboard stat cards.

    Returns:
        LeaveSummaryStats with:
        - total_employees: Active employees
        - employees_on_leave_today: Employees with approved leave today
        - total_pending_requests: All pending leave requests
        - total_approved_this_month: Approved leaves this month
    """
    return get_leave_summary_stats(db)


@router.get("/leave/export")
def export_leave_report_endpoint(
    year: int = Query(default_factory=lambda: date.today().year, description="Year to export"),
    department_id: str | None = Query(None, description="Filter by department ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
) -> Response:
    """Export leave report as CSV file.

    Query params:
        - year: Year to export (default: current year)
        - department_id: Optional department filter

    Returns:
        StreamingResponse with CSV file download
    """
    csv_content = export_leave_report_csv(db, year, department_id=department_id)

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=\"leave_report_{year}.csv\""
        },
    )
