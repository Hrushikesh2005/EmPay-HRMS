from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel
from app.models.enums import LeaveRequestStatus


class LeaveApplyRequest(BaseModel):
	leave_type_id: str
	start_date: date
	end_date: date
	reason: Optional[str] = None


class LeaveRequestOut(BaseModel):
	id: str
	employee_id: str
	leave_type_id: str
	start_date: date
	end_date: date
	total_days: float
	reason: Optional[str]
	status: LeaveRequestStatus
	reviewed_by: Optional[str]
	reviewed_at: Optional[datetime]
	review_remarks: Optional[str]

	class Config:
		from_attributes = True
