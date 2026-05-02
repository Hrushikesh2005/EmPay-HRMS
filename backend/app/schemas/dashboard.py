from pydantic import BaseModel
from datetime import datetime


class AdminDashboardStats(BaseModel):
    """Admin dashboard statistics aggregating data across all modules."""
    
    total_employees: int
    active_employees: int
    present_today: int
    absent_today: int
    on_leave_today: int
    pending_leave_requests: int
    last_payrun_label: str | None
    last_payrun_status: str | None
    last_payrun_date: datetime | None
    employees_without_salary_structure: int

    class Config:
        from_attributes = True
