from datetime import date, datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.attendance import AttendanceLog
from app.models.employee import EmployeeProfile
from app.models.enums import AttendanceStatus
from app.models.base import new_uuid
from app.models.user import User


def _dispatch_realtime_payload(user_id: str, payload: dict) -> None:
	try:
		from anyio import from_thread

		from_thread.run(manager.send_personal_message, user_id, payload)
		from_thread.run(manager.broadcast, payload)
		return
	except Exception:
		pass

	try:
		loop = asyncio.get_running_loop()
		loop.create_task(manager.send_personal_message(user_id, payload))
		loop.create_task(manager.broadcast(payload))
	except Exception:
		pass


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
			check_in=datetime.now(timezone.utc),
			status=AttendanceStatus.present,
			remarks=remarks,
		)
		db.add(attendance)
	else:
		attendance.check_in = datetime.now(timezone.utc)
		attendance.status = AttendanceStatus.present
		if remarks is not None:
			attendance.remarks = remarks

	db.commit()
	db.refresh(attendance)
	# send realtime update (fire-and-forget)
	try:
		import asyncio
		from app.api.realtime import manager

		payload = {
			"type": "attendance",
			"action": "check_in",
			"data": {
				"id": attendance.id,
				"employee_id": attendance.employee_id,
				"work_date": attendance.work_date.isoformat(),
				"check_in": attendance.check_in.isoformat() if attendance.check_in else None,
				"check_out": attendance.check_out.isoformat() if attendance.check_out else None,
				"status": attendance.status.name if hasattr(attendance.status, 'name') else str(attendance.status),
				"remarks": attendance.remarks,
			},
		}
		_dispatch_realtime_payload(user.id, payload)
	except Exception:
		# don't let realtime errors break attendance flow
		pass

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

	attendance.check_out = datetime.now(timezone.utc)
	if remarks is not None:
		attendance.remarks = remarks

	db.commit()
	db.refresh(attendance)
	# send realtime update (fire-and-forget)
	try:
		import asyncio
		from app.api.realtime import manager

		payload = {
			"type": "attendance",
			"action": "check_out",
			"data": {
				"id": attendance.id,
				"employee_id": attendance.employee_id,
				"work_date": attendance.work_date.isoformat(),
				"check_in": attendance.check_in.isoformat() if attendance.check_in else None,
				"check_out": attendance.check_out.isoformat() if attendance.check_out else None,
				"status": attendance.status.name if hasattr(attendance.status, 'name') else str(attendance.status),
				"remarks": attendance.remarks,
			},
		}
		_dispatch_realtime_payload(user.id, payload)
	except Exception:
		pass

	return attendance

def list_my_attendance(user: User, db: Session) -> list[AttendanceLog]:
	profile = _get_employee_profile(user, db)
	return (
		db.query(AttendanceLog)
		.filter(AttendanceLog.employee_id == profile.id)
		.order_by(AttendanceLog.work_date.desc())
		.all()
	)


def get_employee_attendance(user: User, db: Session, start_date: date | None = None, end_date: date | None = None) -> list[AttendanceLog]:
	profile = _get_employee_profile(user, db)
	query = db.query(AttendanceLog).filter(AttendanceLog.employee_id == profile.id)
	if start_date:
		query = query.filter(AttendanceLog.work_date >= start_date)
	if end_date:
		query = query.filter(AttendanceLog.work_date <= end_date)
	return query.order_by(AttendanceLog.work_date.desc()).all()


def get_all_attendance(db: Session, start_date: date | None = None, end_date: date | None = None, employee_id: str | None = None) -> list[dict]:
	query = db.query(
		AttendanceLog,
		User.full_name
	).join(
		EmployeeProfile, AttendanceLog.employee_id == EmployeeProfile.id
	).join(
		User, EmployeeProfile.user_id == User.id
	)
	
	if employee_id:
		query = query.filter(AttendanceLog.employee_id == employee_id)
	if start_date:
		query = query.filter(AttendanceLog.work_date >= start_date)
	if end_date:
		query = query.filter(AttendanceLog.work_date <= end_date)
	
	results = query.order_by(AttendanceLog.work_date.desc()).all()
	
	output = []
	for log, name in results:
		# Map to a dict that matches AttendanceOut schema
		log_dict = {
			"id": log.id,
			"employee_id": log.employee_id,
			"full_name": name,
			"work_date": log.work_date,
			"check_in": log.check_in,
			"check_out": log.check_out,
			"status": log.status,
			"remarks": log.remarks
		}
		output.append(log_dict)
	return output
