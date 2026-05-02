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
from app.schemas.report import LeaveReportRow, LeaveSummaryStats
from app.services.report_service import (
    get_leave_report,
    get_leave_summary_stats,
    export_leave_report_csv,
)
from datetime import date

router = APIRouter(prefix="/admin/reports", tags=["Admin - Reports"])


@router.get("/leave", response_model=list[LeaveReportRow])
def get_leave_report_endpoint(
    year: int = Query(default_factory=lambda: date.today().year, description="Year to report on"),
    department: str | None = Query(None, description="Filter by department"),
    leave_type_id: str | None = Query(None, description="Filter by leave type ID"),
    employee_id: str | None = Query(None, description="Filter by employee ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
) -> list[LeaveReportRow]:
    """Get detailed leave report with filters.

    Query params:
        - year: Year to report on (default: current year)
        - department: Optional department filter
        - leave_type_id: Optional leave type ID filter
        - employee_id: Optional employee ID filter

    Returns:
        List of LeaveReportRow with breakdown by employee, leave type, and balances
    """
    return get_leave_report(
        db,
        year,
        department=department,
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
    department: str | None = Query(None, description="Filter by department"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
) -> Response:
    """Export leave report as CSV file.

    Query params:
        - year: Year to export (default: current year)
        - department: Optional department filter

    Returns:
        StreamingResponse with CSV file download
    """
    csv_content = export_leave_report_csv(db, year, department=department)

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=\"leave_report_{year}.csv\""
        },
    )
