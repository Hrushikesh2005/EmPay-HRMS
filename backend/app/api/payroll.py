from datetime import date
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.dependencies.auth import require_roles
from app.models.enums import UserRole, PayrunStatus
from app.models.user import User
from app.models.employee import EmployeeProfile
from app.models.payroll import Payrun
from app.services.payroll_service import count_working_days_in_period, calculate_payslip, process_payrun

router = APIRouter(prefix="/payroll", tags=["Payroll Wizard"])

class PayrunDateRequest(BaseModel):
    period_start: date
    period_end: date
    period_label: str = ""

@router.post("/preview")
def preview_payrun(
    data: PayrunDateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.payroll_officer)),
):
    stmt = select(EmployeeProfile).join(User).where(User.is_active == True)
    active_employees = db.execute(stmt).scalars().all()
    working_days = count_working_days_in_period(data.period_start, data.period_end)
    
    results = []
    for emp in active_employees:
        try:
            vals = calculate_payslip(db, emp.id, data.period_start, data.period_end, working_days)
            vals["employee_name"] = emp.user.full_name
            results.append(vals)
        except Exception:
            pass
    return results

@router.post("/commit")
def commit_payrun_route(
    data: PayrunDateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.payroll_officer)),
):
    payrun = Payrun(
        period_label=data.period_label or f"Payrun {data.period_start.strftime('%b %Y')}",
        period_start=data.period_start,
        period_end=data.period_end,
        status=PayrunStatus.draft,
        created_by=current_user.id,
    )
    db.add(payrun)
    db.commit()
    db.refresh(payrun)
    
    process_payrun(db, payrun.id)
    return {"message": "Payrun committed successfully", "payrun_id": payrun.id}
