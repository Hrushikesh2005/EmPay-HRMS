from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, Time
from datetime import date, timedelta, time
from app.core.database import get_db
from app.core.dependencies import require_permission
from app.models.employee import EmployeeProfile
from app.models.attendance import AttendanceLog
from app.models.leave_request import LeaveRequest
from app.models.enums import LeaveRequestStatus
from app.models.department import Department

router = APIRouter(prefix="/stats", tags=["Statistics"])

@router.get("/dashboard")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("dashboard", "view"))
):
    today = date.today()
    
    # 1. Total Headcount
    total_headcount = db.query(func.count(EmployeeProfile.id)).scalar()
    
    # 2. Present Today
    present_today = db.query(func.count(AttendanceLog.id)).filter(
        AttendanceLog.work_date == today
    ).scalar()
    
    # 3. Pending Leaves
    pending_leaves = db.query(func.count(LeaveRequest.id)).filter(
        LeaveRequest.status == LeaveRequestStatus.pending
    ).scalar()
    
    # 4. Late Arrivals (Today - after 09:15)
    late_arrivals = db.query(func.count(AttendanceLog.id)).filter(
        AttendanceLog.work_date == today,
        func.cast(AttendanceLog.check_in, Time) > time(9, 15)
    ).scalar()

    # 5. Attendance Trends (Last 7 Days)
    chart_data = []
    payroll_data = []
    employee_counts = []
    
    for i in range(5, -1, -1):
        d = today - timedelta(days=i*30) # Monthly snapshots
        month_label = d.strftime("%b %Y")
        
        # Mocking payroll for now as we don't have a full payroll table yet, 
        # but we use employee count from that time
        count = db.query(func.count(EmployeeProfile.id)).scalar() 
        payroll_data.append({"month": month_label, "value": count * 50000}) # Assume 50k avg
        employee_counts.append({"month": month_label, "value": count})

    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        count = db.query(func.count(AttendanceLog.id)).filter(
            AttendanceLog.work_date == d
        ).scalar()
        chart_data.append({
            "name": d.strftime("%a"),
            "present": count,
            "absent": total_headcount - count
        })
        
    dept_rows = db.query(
        func.coalesce(Department.name, "Unassigned"),
        func.count(EmployeeProfile.id).label("total")
    ).outerjoin(Department, EmployeeProfile.department_id == Department.id).group_by(func.coalesce(Department.name, "Unassigned")).all()

    return {
        "total_headcount": total_headcount,
        "present_today": present_today,
        "pending_leaves": pending_leaves,
        "late_arrivals": late_arrivals,
        "attendance_trends": chart_data,
        "employer_cost": payroll_data,
        "employee_counts": employee_counts,
        "dept_stats": [[row[0], row[1]] for row in dept_rows],
    }
