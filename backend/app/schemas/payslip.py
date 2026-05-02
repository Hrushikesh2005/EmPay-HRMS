from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class PayslipResponse(BaseModel):
    id: str
    payrun_id: str
    employee_id: str
    employee_name: str
    basic_salary: Decimal
    hra: Decimal
    other_allowances: Decimal
    gross_salary: Decimal
    pf_employee: Decimal
    pf_employer: Decimal
    professional_tax: Decimal
    total_deductions: Decimal
    net_pay: Decimal
    working_days: int
    present_days: int
    leave_days: Decimal
    lop_days: Decimal
    status: str
    generated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
