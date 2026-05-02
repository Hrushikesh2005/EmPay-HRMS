from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, model_validator

from app.models.enums import LeaveRequestStatus


class LeaveRequestCreate(BaseModel):
    leave_type_id: str
    start_date: date
    end_date: date
    reason: str | None = None
    employee_id: str | None = None

    @model_validator(mode="after")
    def validate_date_range(self):
        if self.end_date < self.start_date:
            raise ValueError("End date must be on or after start date")
        return self


class LeaveRequestResponse(BaseModel):
    id: str
    employee_id: str
    employee_name: str
    leave_type_id: str
    leave_type_name: str
    start_date: date
    end_date: date
    total_days: Decimal
    reason: str | None
    status: str
    reviewed_by: str | None
    reviewed_at: datetime | None
    review_remarks: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- New additions for payroll review ---
class LeaveReviewRequest(BaseModel):
    action: Literal["approved", "rejected"]
    review_remarks: str | None = None
