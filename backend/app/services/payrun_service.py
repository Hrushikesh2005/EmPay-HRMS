from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.employee import EmployeeProfile
from app.models.enums import PayrunStatus
from app.models.payroll import Payrun
from app.models.user import User
from app.services.payroll_service import generate_payslip_for_employee


def process_payrun(db: Session, payrun_id: str) -> Payrun:
    payrun = db.execute(select(Payrun).where(Payrun.id == payrun_id)).scalar_one_or_none()
    if not payrun:
        raise AppException(404, "Payrun not found")

    if payrun.status != PayrunStatus.draft:
        raise AppException(400, "Only draft payruns can be processed")

    employees = (
        db.execute(
            select(EmployeeProfile)
            .join(EmployeeProfile.user)
            .where(User.is_active == True)
            .order_by(EmployeeProfile.id)
        )
        .scalars()
        .all()
    )

    payrun.status = PayrunStatus.processing
    db.commit()
    db.refresh(payrun)

    for employee in employees:
        generate_payslip_for_employee(
            db=db,
            payrun_id=payrun.id,
            employee_id=employee.id,
            period_start=payrun.period_start,
            period_end=payrun.period_end,
            working_days=(payrun.period_end - payrun.period_start).days + 1,
        )

    payrun.status = PayrunStatus.finalized
    payrun.finalized_at = datetime.utcnow()
    db.commit()
    db.refresh(payrun)
    return payrun
