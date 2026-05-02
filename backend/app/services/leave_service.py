from datetime import date
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.base import new_uuid
from app.models.employee import EmployeeProfile
from app.models.leave_request import LeaveRequest
from app.models.leave_type import LeaveType
from app.models.enums import LeaveRequestStatus
from app.models.user import User


def _get_employee_profile(user: User, db: Session) -> EmployeeProfile:
	profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == user.id).first()
	if not profile:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")
	return profile


def _calculate_total_days(start_date: date, end_date: date) -> float:
	if end_date < start_date:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date range")
	return float((end_date - start_date).days + 1)


def apply_leave(user: User, data, db: Session) -> LeaveRequest:
	profile = _get_employee_profile(user, db)

	leave_type = db.query(LeaveType).filter(LeaveType.id == data.leave_type_id).first()
	if not leave_type:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave type not found")

	total_days = _calculate_total_days(data.start_date, data.end_date)
	request = LeaveRequest(
		id=new_uuid(),
		employee_id=profile.id,
		leave_type_id=data.leave_type_id,
		start_date=data.start_date,
		end_date=data.end_date,
		total_days=total_days,
		reason=data.reason,
		status=LeaveRequestStatus.pending,
	)
	db.add(request)
	db.commit()
	db.refresh(request)
	# send realtime update to the requester (fire-and-forget)
	try:
		import asyncio
		from app.api.realtime import manager

		payload = {
			"type": "leave_request",
			"action": "created",
			"data": {
				"id": request.id,
				"employee_id": request.employee_id,
				"leave_type_id": request.leave_type_id,
				"start_date": request.start_date.isoformat(),
				"end_date": request.end_date.isoformat(),
				"total_days": request.total_days,
				"status": request.status.name if hasattr(request.status, 'name') else str(request.status),
				"reason": request.reason,
			},
		}
		# try send to the owner's connections
		asyncio.create_task(manager.send_personal_message(user.id, payload))
	except Exception:
		pass

	return request


def list_my_leaves(user: User, db: Session) -> list[LeaveRequest]:
	profile = _get_employee_profile(user, db)
	return (
		db.query(LeaveRequest)
		.filter(LeaveRequest.employee_id == profile.id)
		.order_by(LeaveRequest.created_at.desc())
		.all()
	)


def list_all_leaves(db: Session) -> list[LeaveRequest]:
	return db.query(LeaveRequest).order_by(LeaveRequest.created_at.desc()).all()
