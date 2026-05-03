from datetime import datetime, date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class PayslipResponse(BaseModel):
    id: str
    payrun_id: str
    employee_id: str
    employee_name: str
    employee_code: str | None = None
    department: str | None = None
    designation: str | None = None
    date_of_joining: date | None = None
    pan_number: str | None = None
    uan_number: str | None = None
    bank_details: dict | None = None
    pay_period: str | None = None
    pay_date: datetime | None = None
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
