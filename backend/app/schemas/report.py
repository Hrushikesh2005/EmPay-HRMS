from decimal import Decimal
from pydantic import BaseModel, ConfigDict


class LeaveReportRow(BaseModel):
    employee_id: str
    employee_name: str
    department: str | None
    leave_type: str
    allocated_days: Decimal
    used_days: Decimal
    remaining_days: Decimal
    pending_days: Decimal

    model_config = ConfigDict(from_attributes=True)


class LeaveSummaryStats(BaseModel):
    total_employees: int
    employees_on_leave_today: int
    total_pending_requests: int
    total_approved_this_month: int
