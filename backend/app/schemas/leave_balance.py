from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class LeaveBalanceCreate(BaseModel):
	employee_id: str
	leave_type_id: str
	year: int = Field(ge=2020, le=2100)
	allocated_days: Decimal = Field(ge=Decimal("0"))


class LeaveBalanceUpdate(BaseModel):
	allocated_days: Decimal = Field(ge=Decimal("0"))


class LeaveBalanceResponse(BaseModel):
	id: str
	employee_id: str
	leave_type_id: str
	year: int
	allocated_days: Decimal
	used_days: Decimal
	remaining_days: Decimal
	leave_type_name: str

	model_config = ConfigDict(from_attributes=True)
