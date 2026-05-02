from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LeaveTypeResponse(BaseModel):
	id: str
	name: str
	default_days_per_year: int
	is_paid: bool
	created_at: datetime

	model_config = ConfigDict(from_attributes=True)
