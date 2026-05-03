from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.employee import EmployeeProfile
from app.models.attendance import AttendanceLog
from app.models.leave_request import LeaveRequest
from app.models.enums import AttendanceStatus, LeaveRequestStatus
from app.models.salary import SalaryStructure
from app.models.user import User
from app.models.base import new_uuid


def _attach_attendance_status(employee: EmployeeProfile, db: Session) -> EmployeeProfile:
	today = date.today()
	attendance = (
		db.query(AttendanceLog)
		.filter(AttendanceLog.employee_id == employee.id, AttendanceLog.work_date == today)
		.first()
	)
	on_leave = (
		db.query(LeaveRequest.id)
		.filter(
			LeaveRequest.employee_id == employee.id,
			LeaveRequest.status == LeaveRequestStatus.approved,
			LeaveRequest.start_date <= today,
			LeaveRequest.end_date >= today,
		)
		.first()
		is not None
	)

	status = AttendanceStatus.absent
	if attendance and attendance.check_in:
		status = AttendanceStatus.present
	elif on_leave:
		status = AttendanceStatus.on_leave

	setattr(employee, "attendance_status", status)
	return employee


def list_employees(db: Session) -> list[EmployeeProfile]:
	employees = db.query(EmployeeProfile).join(User).order_by(User.full_name.asc()).all()
	return [_attach_attendance_status(employee, db) for employee in employees]


def get_employee(employee_id: str, db: Session) -> EmployeeProfile:
	employee = db.query(EmployeeProfile).filter(EmployeeProfile.id == employee_id).first()
	if not employee:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
	return _attach_attendance_status(employee, db)


def create_employee_profile(data, db: Session) -> EmployeeProfile:
	user = db.query(User).filter(User.id == data.user_id).first()
	if not user:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

	existing = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == data.user_id).first()
	if existing:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profile already exists")

	employee = EmployeeProfile(
		id=new_uuid(),
		user_id=data.user_id,
		department_id=data.department_id,
		designation=data.designation,
		phone=data.phone,
		date_of_joining=data.date_of_joining,
		employment_type=data.employment_type,
		date_of_birth=data.date_of_birth,
		residing_address=data.residing_address,
		nationality=data.nationality,
		personal_email=data.personal_email,
		gender=data.gender,
		marital_status=data.marital_status,
		pan_number=data.pan_number,
		uan_number=data.uan_number,
		bank_details=data.bank_details,
	)
	db.add(employee)
	db.commit()
	db.refresh(employee)
	return employee


def update_employee(employee_id: str, data, db: Session) -> EmployeeProfile:
	employee = get_employee(employee_id, db)

	if data.department_id is not None:
		employee.department_id = data.department_id
	if data.designation is not None:
		employee.designation = data.designation
	if data.phone is not None:
		employee.phone = data.phone
	if data.date_of_joining is not None:
		employee.date_of_joining = data.date_of_joining
	if data.employment_type is not None:
		employee.employment_type = data.employment_type
	if data.date_of_birth is not None:
		employee.date_of_birth = data.date_of_birth
	if data.residing_address is not None:
		employee.residing_address = data.residing_address
	if data.nationality is not None:
		employee.nationality = data.nationality
	if data.personal_email is not None:
		employee.personal_email = data.personal_email
	if data.gender is not None:
		employee.gender = data.gender
	if data.marital_status is not None:
		employee.marital_status = data.marital_status
	if data.pan_number is not None:
		employee.pan_number = data.pan_number
	if data.uan_number is not None:
		employee.uan_number = data.uan_number
	if data.bank_details is not None:
		employee.bank_details = data.bank_details

	db.commit()
	db.refresh(employee)
	return employee


def get_employee_salary(employee_id: str, db: Session) -> SalaryStructure:
	salary = (
		db.query(SalaryStructure)
		.filter(SalaryStructure.employee_id == employee_id, SalaryStructure.is_active == True)
		.order_by(SalaryStructure.effective_from.desc())
		.first()
	)
	if not salary:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active salary structure found")
	return salary

def set_employee_salary(employee_id: str, data, db: Session) -> SalaryStructure:
	from datetime import date
	
	# Mark existing active as inactive
	existing = db.query(SalaryStructure).filter(
		SalaryStructure.employee_id == employee_id, 
		SalaryStructure.is_active == True
	).all()
	
	for s in existing:
		s.is_active = False
		if not s.effective_to:
			s.effective_to = date.today()

	salary = SalaryStructure(
		employee_id=employee_id,
		basic_salary=data.basic_salary,
		hra=data.hra,
		other_allowances=data.other_allowances,
		pf_employee_pct=data.pf_employee_pct,
		pf_employer_pct=data.pf_employer_pct,
		professional_tax=data.professional_tax,
		effective_from=data.effective_from or date.today(),
		is_active=True
	)
	db.add(salary)
	db.commit()
	db.refresh(salary)
	return salary
