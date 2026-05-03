from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_permission, get_current_user
from app.schemas.attendance import AttendanceCheckRequest
from app.services.attendance_service import (
	check_in,
	check_out,
	get_employee_attendance,
	get_all_attendance,
	list_my_attendance,
)
from app.models.user import User

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/checkin")
def mark_check_in(
	data: AttendanceCheckRequest,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	result = check_in(current_user, data.remarks, db)
	return {
		"id": result.id,
		"employee_id": result.employee_id,
		"work_date": result.work_date.isoformat(),
		"check_in": result.check_in.isoformat() if result.check_in else None,
		"check_out": result.check_out.isoformat() if result.check_out else None,
		"status": result.status.value if hasattr(result.status, "value") else str(result.status),
		"remarks": result.remarks,
	}


@router.post("/checkout")
def mark_check_out(
	data: AttendanceCheckRequest,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	result = check_out(current_user, data.remarks, db)
	return {
		"id": result.id,
		"employee_id": result.employee_id,
		"work_date": result.work_date.isoformat(),
		"check_in": result.check_in.isoformat() if result.check_in else None,
		"check_out": result.check_out.isoformat() if result.check_out else None,
		"status": result.status.value if hasattr(result.status, "value") else str(result.status),
		"remarks": result.remarks,
	}


@router.get("/history")
def get_my_history(
	start_date: Optional[date] = None,
	end_date: Optional[date] = None,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	logs = get_employee_attendance(current_user, db, start_date, end_date)
	return [
		{
			"id": log.id,
			"employee_id": log.employee_id,
			"full_name": None,
			"work_date": log.work_date.isoformat(),
			"check_in": log.check_in.isoformat() if log.check_in else None,
			"check_out": log.check_out.isoformat() if log.check_out else None,
			"status": log.status.value if hasattr(log.status, "value") else str(log.status),
			"remarks": log.remarks,
		}
		for log in logs
	]


@router.get("/all")
def get_all_history(
	start_date: Optional[date] = None,
	end_date: Optional[date] = None,
	employee_id: Optional[str] = None,
	db: Session = Depends(get_db),
	current_user: User = Depends(
		require_permission("attendance", "view", required_level="all")
	),
):
	results = get_all_attendance(db, start_date, end_date, employee_id)
	# Results are already dicts with full_name — return directly
	return [
		{
			"id": r["id"],
			"employee_id": r["employee_id"],
			"full_name": r["full_name"],
			"work_date": r["work_date"].isoformat() if hasattr(r["work_date"], "isoformat") else r["work_date"],
			"check_in": r["check_in"].isoformat() if r["check_in"] else None,
			"check_out": r["check_out"].isoformat() if r["check_out"] else None,
			"status": r["status"].value if hasattr(r["status"], "value") else str(r["status"]),
			"remarks": r["remarks"],
		}
		for r in results
	]


@router.get("/me")
def my_attendance(
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	logs = list_my_attendance(current_user, db)
	return [
		{
			"id": log.id,
			"employee_id": log.employee_id,
			"full_name": None,
			"work_date": log.work_date.isoformat(),
			"check_in": log.check_in.isoformat() if log.check_in else None,
			"check_out": log.check_out.isoformat() if log.check_out else None,
			"status": log.status.value if hasattr(log.status, "value") else str(log.status),
			"remarks": log.remarks,
		}
		for log in logs
	]
