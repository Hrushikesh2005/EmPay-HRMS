from datetime import date
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.employee import EmployeeProfile
from app.models.attendance import AttendanceLog
from app.models.leave_request import LeaveRequest
from app.models.payroll import Payrun
from app.models.salary import SalaryStructure
from app.schemas.dashboard import AdminDashboardStats


def get_admin_dashboard_stats(db: Session) -> AdminDashboardStats:
    """
    Aggregate dashboard statistics across all modules.
    
    Returns:
        AdminDashboardStats with all key metrics
    """
    
    # Count total active employees
    total_employees = db.query(func.count(User.id)).filter(
        User.is_active == True
    ).scalar() or 0
    
    # Active employees (same as total_employees currently)
    active_employees = total_employees
    
    # Count attendance today by status
    today = date.today()
    
    present_today = db.query(func.count(AttendanceLog.id)).filter(
        AttendanceLog.work_date == today,
        AttendanceLog.status == "present"
    ).scalar() or 0
    
    absent_today = db.query(func.count(AttendanceLog.id)).filter(
        AttendanceLog.work_date == today,
        AttendanceLog.status == "absent"
    ).scalar() or 0
    
    on_leave_today = db.query(func.count(AttendanceLog.id)).filter(
        AttendanceLog.work_date == today,
        AttendanceLog.status == "on_leave"
    ).scalar() or 0
    
    # Count pending leave requests
    pending_leave_requests = db.query(func.count(LeaveRequest.id)).filter(
        LeaveRequest.status == "pending"
    ).scalar() or 0
    
    # Get last payrun (most recent by created_at)
    last_payrun = db.query(Payrun).order_by(
        Payrun.created_at.desc()
    ).first()
    
    last_payrun_label = last_payrun.label if last_payrun else None
    last_payrun_status = last_payrun.status.value if last_payrun else None
    last_payrun_date = last_payrun.created_at if last_payrun else None
    
    # Count employees without active salary structure
    # LEFT JOIN to find employees with no active salary structure
    employees_without_salary_structure = db.query(
        func.count(EmployeeProfile.id)
    ).outerjoin(
        SalaryStructure,
        (SalaryStructure.employee_id == EmployeeProfile.id) &
        (SalaryStructure.is_active == True)
    ).filter(
        SalaryStructure.id.is_(None)
    ).scalar() or 0
    
    return AdminDashboardStats(
        total_employees=total_employees,
        active_employees=active_employees,
        present_today=present_today,
        absent_today=absent_today,
        on_leave_today=on_leave_today,
        pending_leave_requests=pending_leave_requests,
        last_payrun_label=last_payrun_label,
        last_payrun_status=last_payrun_status,
        last_payrun_date=last_payrun_date,
        employees_without_salary_structure=employees_without_salary_structure,
    )
