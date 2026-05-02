from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, field_validator, model_validator
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
	leave_type_name: Optional[str] = None
	start_date: date
	end_date: date
	total_days: float
	reason: Optional[str]
	status: LeaveRequestStatus
	reviewed_by: Optional[str]
	reviewed_at: Optional[datetime]
	review_remarks: Optional[str]
	created_at: Optional[datetime] = None

	@classmethod
	def from_orm_with_name(cls, obj):
		data = {
			"id": obj.id,
			"employee_id": obj.employee_id,
			"leave_type_id": obj.leave_type_id,
			"leave_type_name": obj.leave_type.name if obj.leave_type else None,
			"start_date": obj.start_date,
			"end_date": obj.end_date,
			"total_days": float(obj.total_days),
			"reason": obj.reason,
			"status": obj.status,
			"reviewed_by": obj.reviewed_by,
			"reviewed_at": obj.reviewed_at,
			"review_remarks": obj.review_remarks,
			"created_at": obj.created_at,
		}
		return cls(**data)

	class Config:
		from_attributes = True
