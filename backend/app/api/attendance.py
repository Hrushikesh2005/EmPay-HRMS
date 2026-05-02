from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_roles
from app.schemas.attendance import AttendanceCheckRequest, AttendanceOut
from app.services.attendance_service import check_in, check_out, get_employee_attendance, get_all_attendance
from datetime import date
from typing import Optional
from app.services.attendance_service import list_my_attendance
from app.models.user import User

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/checkin", response_model=AttendanceOut)
def mark_check_in(
	data: AttendanceCheckRequest,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_roles("employee", "admin")),
):
	return check_in(current_user, data.remarks, db)


@router.post("/checkout", response_model=AttendanceOut)
def mark_check_out(
	data: AttendanceCheckRequest,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_roles("employee", "admin")),
):
	return check_out(current_user, data.remarks, db)


@router.get("/history", response_model=list[AttendanceOut])
def get_my_history(
	start_date: Optional[date] = None,
	end_date: Optional[date] = None,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_roles("employee", "admin")),
):
	return get_employee_attendance(current_user, db, start_date, end_date)


@router.get("/all", response_model=list[AttendanceOut])
def get_all_history(
	start_date: Optional[date] = None,
	end_date: Optional[date] = None,
	employee_id: Optional[str] = None,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_roles("hr_officer", "admin")),
):
	return get_all_attendance(db, start_date, end_date, employee_id)


@router.get("/me", response_model=list[AttendanceOut])
def my_attendance(
	db: Session = Depends(get_db),
	current_user: User = Depends(require_roles("employee", "admin")),
):
	return list_my_attendance(current_user, db)
