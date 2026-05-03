from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel
from app.models.enums import AttendanceStatus, EmploymentType, UserRole


class EmployeeProfileCreate(BaseModel):
	user_id: str
	department_id: Optional[str] = None
	designation: Optional[str] = None
	phone: Optional[str] = None
	date_of_joining: Optional[date] = None
	employment_type: EmploymentType = EmploymentType.full_time

	date_of_birth: Optional[date] = None
	residing_address: Optional[str] = None
	nationality: Optional[str] = None
	personal_email: Optional[str] = None
	gender: Optional[str] = None
	marital_status: Optional[str] = None
	pan_number: Optional[str] = None
	uan_number: Optional[str] = None
	bank_details: Optional[dict] = None


class EmployeeProfileUpdate(BaseModel):
	department_id: Optional[str] = None
	designation: Optional[str] = None
	phone: Optional[str] = None
	date_of_joining: Optional[date] = None
	employment_type: Optional[EmploymentType] = None

	date_of_birth: Optional[date] = None
	residing_address: Optional[str] = None
	nationality: Optional[str] = None
	personal_email: Optional[str] = None
	gender: Optional[str] = None
	marital_status: Optional[str] = None
	pan_number: Optional[str] = None
	uan_number: Optional[str] = None
	bank_details: Optional[dict] = None


class EmployeeUserOut(BaseModel):
	id: str
	full_name: str
	email: str
	role: UserRole

	class Config:
		from_attributes = True


class EmployeeProfileOut(BaseModel):
	id: str
	employee_code: Optional[str]
	user_id: str
	department_id: Optional[str]
	designation: Optional[str]
	phone: Optional[str]
	date_of_joining: Optional[date]
	employment_type: EmploymentType
	attendance_status: AttendanceStatus = AttendanceStatus.absent

	date_of_birth: Optional[date] = None
	residing_address: Optional[str] = None
	nationality: Optional[str] = None
	personal_email: Optional[str] = None
	gender: Optional[str] = None
	marital_status: Optional[str] = None
	pan_number: Optional[str] = None
	uan_number: Optional[str] = None
	bank_details: Optional[dict] = None
	user: EmployeeUserOut

	class Config:
		from_attributes = True


class SalaryStructureOut(BaseModel):
	id: str
	employee_id: str
	basic_salary: Decimal
	hra: Decimal
	other_allowances: Decimal
	pf_employee_pct: Decimal
	pf_employer_pct: Decimal
	professional_tax: Decimal
	effective_from: date
	effective_to: Optional[date]
	is_active: bool

	class Config:
		from_attributes = True

class SalaryStructureCreate(BaseModel):
	basic_salary: Decimal
	hra: Decimal
	other_allowances: Decimal
	pf_employee_pct: Decimal = Decimal("12.0")
	pf_employer_pct: Decimal = Decimal("12.0")
	professional_tax: Decimal = Decimal("200.0")
	effective_from: Optional[date] = None
