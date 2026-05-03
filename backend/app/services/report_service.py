"""Report service for leave analytics and exports.

All functions are plain def (no async/await).
"""

import csv
from datetime import date
from decimal import Decimal
from io import StringIO

from sqlalchemy import and_, extract, func, select
from sqlalchemy.orm import Session

from app.models.employee import EmployeeProfile
from app.models.enums import LeaveRequestStatus
from app.models.leave_balance import LeaveBalance
from app.models.leave_request import LeaveRequest
from app.models.leave_type import LeaveType
from app.models.user import User
from app.models.department import Department
from app.schemas.report import LeaveReportRow, LeaveSummaryStats, AttendanceReportRow


def get_leave_report(
    db: Session,
    year: int,
    department_id: str | None = None,
    leave_type_id: str | None = None,
    employee_id: str | None = None,
) -> list[LeaveReportRow]:
    """Get detailed leave report with filters.

    Joins leave_balances → employee_profiles → users → leave_types.
    For each row, calculates pending_days from pending leave requests.

    Args:
        db: Database session
        year: Year to filter balances by
        department_id: Optional department ID filter
        leave_type_id: Optional leave type filter
        employee_id: Optional employee filter

    Returns:
        List of LeaveReportRow with all calculated fields
    """
    # Main query: join leave_balances with related tables
    stmt = (
        select(
            LeaveBalance.employee_id,
            User.full_name,
            Department.name,
            LeaveType.name,
            LeaveBalance.allocated_days,
            LeaveBalance.used_days,
            LeaveBalance.year,
            LeaveBalance.leave_type_id,
        )
        .join(
            EmployeeProfile,
            LeaveBalance.employee_id == EmployeeProfile.id,
        )
        .join(User, EmployeeProfile.user_id == User.id)
        .outerjoin(Department, EmployeeProfile.department_id == Department.id)
        .join(LeaveType, LeaveBalance.leave_type_id == LeaveType.id)
        .where(LeaveBalance.year == year)
    )

    # Apply optional filters
    if department_id:
        stmt = stmt.where(EmployeeProfile.department_id == department_id)

    if leave_type_id:
        stmt = stmt.where(LeaveBalance.leave_type_id == leave_type_id)

    if employee_id:
        stmt = stmt.where(LeaveBalance.employee_id == employee_id)

    results = db.execute(stmt).all()

    # Build report rows
    report_rows = []
    for row in results:
        emp_id = row[0]
        emp_name = row[1]
        dept = row[2]
        leave_type_name = row[3]
        allocated = Decimal(str(row[4]))
        used = Decimal(str(row[5]))
        lt_id = row[7]

        # Calculate remaining days
        remaining = allocated - used

        # Calculate pending days: sum of pending leave requests for this employee/type/year
        pending_stmt = select(func.sum(LeaveRequest.total_days)).where(
            LeaveRequest.employee_id == emp_id,
            LeaveRequest.leave_type_id == lt_id,
            LeaveRequest.status == LeaveRequestStatus.pending,
            extract("year", LeaveRequest.start_date) == year,
        )
        pending_result = db.execute(pending_stmt).scalar()
        pending = Decimal(str(pending_result)) if pending_result else Decimal("0")

        report_row = LeaveReportRow(
            employee_id=emp_id,
            employee_name=emp_name,
            department=dept,
            leave_type=leave_type_name,
            allocated_days=allocated,
            used_days=used,
            remaining_days=remaining,
            pending_days=pending,
        )
        report_rows.append(report_row)

    return report_rows


def get_leave_summary_stats(db: Session) -> LeaveSummaryStats:
    """Get summary statistics for leave management dashboard.

    Calculates:
    - total_employees: Active users
    - employees_on_leave_today: Approved leaves covering today
    - total_pending_requests: All pending leave requests
    - total_approved_this_month: Approved in current month/year

    Args:
        db: Database session

    Returns:
        LeaveSummaryStats object
    """
    today = date.today()

    # Total active employees
    total_employees_stmt = select(func.count(User.id)).where(User.is_active == True)
    total_employees = db.execute(total_employees_stmt).scalar() or 0

    # Employees on leave today
    employees_on_leave_stmt = select(
        func.count(func.distinct(LeaveRequest.employee_id))
    ).where(
        LeaveRequest.status == LeaveRequestStatus.approved,
        LeaveRequest.start_date <= today,
        LeaveRequest.end_date >= today,
    )
    employees_on_leave_today = db.execute(employees_on_leave_stmt).scalar() or 0

    # Total pending requests
    total_pending_stmt = select(func.count(LeaveRequest.id)).where(
        LeaveRequest.status == LeaveRequestStatus.pending
    )
    total_pending_requests = db.execute(total_pending_stmt).scalar() or 0

    # Total approved this month
    current_month = today.month
    current_year = today.year
    total_approved_stmt = select(func.count(LeaveRequest.id)).where(
        LeaveRequest.status == LeaveRequestStatus.approved,
        extract("month", LeaveRequest.start_date) == current_month,
        extract("year", LeaveRequest.start_date) == current_year,
    )
    total_approved_this_month = db.execute(total_approved_stmt).scalar() or 0

    return LeaveSummaryStats(
        total_employees=total_employees,
        employees_on_leave_today=employees_on_leave_today,
        total_pending_requests=total_pending_requests,
        total_approved_this_month=total_approved_this_month,
    )


def export_leave_report_csv(
    db: Session,
    year: int,
    department_id: str | None = None,
) -> str:
    """Export leave report as CSV string.

    Calls get_leave_report() and formats as CSV with headers.

    Args:
        db: Database session
        year: Year to report on
        department_id: Optional department ID filter

    Returns:
        CSV string
    """
    # Get report data
    report_rows = get_leave_report(db, year, department_id=department_id)

    # Create CSV in memory
    output = StringIO()
    writer = csv.writer(output)

    # Write headers
    writer.writerow(
        [
            "Employee Name",
            "Department",
            "Leave Type",
            "Allocated Days",
            "Used Days",
            "Remaining Days",
            "Pending Days",
        ]
    )

    # Write data rows
    for row in report_rows:
        writer.writerow(
            [
                row.employee_name,
                row.department or "",
                row.leave_type,
                str(row.allocated_days),
                str(row.used_days),
                str(row.remaining_days),
                str(row.pending_days),
            ]
        )

    return output.getvalue()


def get_attendance_report(
    db: Session,
    month: int,
    year: int,
    department_id: str | None = None,
    employee_id: str | None = None,
) -> list[AttendanceReportRow]:
    """Get detailed attendance report for a specific month and year.

    Args:
        db: Database session
        month: Month to filter
        year: Year to filter
        department_id: Optional department ID filter
        employee_id: Optional employee filter

    Returns:
        List of AttendanceReportRow
    """
    from app.models.attendance import AttendanceLog
    from app.models.enums import AttendanceStatus
    from sqlalchemy import case
    
    # Calculate counts using conditional aggregation
    present_count = func.sum(case((AttendanceLog.status == AttendanceStatus.present, 1), else_=0))
    absent_count = func.sum(case((AttendanceLog.status == AttendanceStatus.absent, 1), else_=0))
    half_day_count = func.sum(case((AttendanceLog.status == AttendanceStatus.half_day, 1), else_=0))
    
    stmt = (
        select(
            EmployeeProfile.id,
            User.full_name,
            Department.name,
            present_count.label("present_days"),
            absent_count.label("absent_days"),
            half_day_count.label("half_days"),
        )
        .join(User, EmployeeProfile.user_id == User.id)
        .outerjoin(Department, EmployeeProfile.department_id == Department.id)
        .outerjoin(
            AttendanceLog, 
            and_(
                AttendanceLog.employee_id == EmployeeProfile.id,
                extract("month", AttendanceLog.work_date) == month,
                extract("year", AttendanceLog.work_date) == year
            )
        )
        .group_by(EmployeeProfile.id, User.full_name, Department.name)
        .order_by(User.full_name)
    )

    if department_id:
        stmt = stmt.where(EmployeeProfile.department_id == department_id)

    if employee_id:
        stmt = stmt.where(EmployeeProfile.id == employee_id)

    results = db.execute(stmt).all()

    report_rows = []
    for row in results:
        report_rows.append(
            AttendanceReportRow(
                employee_id=row.id,
                employee_name=row.full_name,
                department=row.name,
                present_days=int(row.present_days or 0),
                absent_days=int(row.absent_days or 0),
                late_days=0, # Late tracking can be added in the future based on check_in time
                half_days=int(row.half_days or 0),
            )
        )

    return report_rows
