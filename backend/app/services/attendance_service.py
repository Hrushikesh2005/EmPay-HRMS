from datetime import date, datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.attendance import AttendanceLog
from app.models.employee import EmployeeProfile
from app.models.enums import AttendanceStatus
from app.models.base import new_uuid
from app.models.user import User


def _get_employee_profile(user: User, db: Session) -> EmployeeProfile:
	profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == user.id).first()
	if not profile:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")
	return profile


def check_in(user: User, remarks: str | None, db: Session) -> AttendanceLog:
	profile = _get_employee_profile(user, db)
	today = date.today()
	attendance = (
		db.query(AttendanceLog)
		.filter(AttendanceLog.employee_id == profile.id, AttendanceLog.work_date == today)
		.first()
	)

	if attendance and attendance.check_in:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already checked in")

	if not attendance:
		attendance = AttendanceLog(
			id=new_uuid(),
			employee_id=profile.id,
			work_date=today,
			check_in=datetime.utcnow(),
			status=AttendanceStatus.present,
			remarks=remarks,
		)
		db.add(attendance)
	else:
		attendance.check_in = datetime.utcnow()
		attendance.status = AttendanceStatus.present
		if remarks is not None:
			attendance.remarks = remarks

	db.commit()
	db.refresh(attendance)
	return attendance


def check_out(user: User, remarks: str | None, db: Session) -> AttendanceLog:
	profile = _get_employee_profile(user, db)
	today = date.today()
	attendance = (
		db.query(AttendanceLog)
		.filter(AttendanceLog.employee_id == profile.id, AttendanceLog.work_date == today)
		.first()
	)
	if not attendance or not attendance.check_in:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Check-in required")
	if attendance.check_out:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already checked out")

	attendance.check_out = datetime.utcnow()
	if remarks is not None:
		attendance.remarks = remarks

	db.commit()
	db.refresh(attendance)
	return attendance
