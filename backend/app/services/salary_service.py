from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.salary import SalaryStructure


def get_active_salary(db: Session, employee_id: str) -> SalaryStructure | None:
    stmt = (
        select(SalaryStructure)
        .where(SalaryStructure.employee_id == employee_id, SalaryStructure.is_active == True)
        .order_by(SalaryStructure.effective_from.desc())
    )
    return db.execute(stmt).scalars().first()
