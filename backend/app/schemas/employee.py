from datetime import date
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.enums import EmploymentType, UserRole


class EmployeeProfileCreate(BaseModel):
	user_id: str
	manager_id: Optional[str] = None
	department: Optional[str] = None
	designation: Optional[str] = None
	phone: Optional[str] = None
	date_of_joining: Optional[date] = None
	employment_type: EmploymentType = EmploymentType.full_time


class EmployeeProfileUpdate(BaseModel):
	manager_id: Optional[str] = None
	department: Optional[str] = None
	designation: Optional[str] = None
	phone: Optional[str] = None
	date_of_joining: Optional[date] = None
	employment_type: Optional[EmploymentType] = None


class EmployeeUserOut(BaseModel):
	id: str
	full_name: str
	email: EmailStr
	role: UserRole

	class Config:
		from_attributes = True


class EmployeeProfileOut(BaseModel):
	id: str
	user_id: str
	manager_id: Optional[str]
	department: Optional[str]
	designation: Optional[str]
	phone: Optional[str]
	date_of_joining: Optional[date]
	employment_type: EmploymentType
	user: EmployeeUserOut

	class Config:
		from_attributes = True
