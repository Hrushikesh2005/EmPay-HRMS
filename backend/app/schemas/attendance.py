from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel
from app.models.enums import AttendanceStatus


class AttendanceCheckRequest(BaseModel):
	remarks: Optional[str] = None


class AttendanceOut(BaseModel):
	id: str
	employee_id: str
	full_name: Optional[str] = None
	work_date: date
	check_in: Optional[datetime]
	check_out: Optional[datetime]
	status: AttendanceStatus
	remarks: Optional[str]

	class Config:
		from_attributes = True
