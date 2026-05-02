from datetime import date, datetime, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.attendance import AttendanceLog
from app.models.employee import EmployeeProfile
from app.models.enums import AttendanceStatus, LeaveRequestStatus, PayslipStatus
from app.models.leave import LeaveType
from app.models.leave_balance import LeaveBalance
from app.models.leave_request import LeaveRequest
from app.models.payroll import Payslip
from app.models.salary import SalaryStructure
from app.services.salary_service import get_active_salary


def _decimal(value: Decimal | int | float | str) -> Decimal:
    return Decimal(str(value))


def _money(value: Decimal | int | float | str) -> Decimal:
    return _decimal(value).quantize(Decimal("0.01"))


def _days(value: Decimal | int | float | str) -> Decimal:
    return _decimal(value).quantize(Decimal("0.0"))


def _count_working_days(start: date, end: date) -> Decimal:
    current_day = start
    working_days = 0
    while current_day <= end:
        if current_day.weekday() < 5:
            working_days += 1
        current_day += timedelta(days=1)
    return _days(working_days)


def _attendance_present_days(db: Session, employee_id: str, period_start: date, period_end: date) -> int:
    stmt = select(AttendanceLog).where(
        AttendanceLog.employee_id == employee_id,
        AttendanceLog.work_date >= period_start,
        AttendanceLog.work_date <= period_end,
        AttendanceLog.status.in_([AttendanceStatus.present, AttendanceStatus.half_day, AttendanceStatus.on_leave]),
    )
    logs = db.execute(stmt).scalars().all()
    return len(logs)


def get_approved_leaves_for_period(
    db: Session,
    employee_id: str,
    period_start: date,
    period_end: date,
) -> list[LeaveRequest]:
    stmt = select(LeaveRequest).where(
        LeaveRequest.employee_id == employee_id,
        LeaveRequest.status == LeaveRequestStatus.approved,
        LeaveRequest.start_date <= period_end,
        LeaveRequest.end_date >= period_start,
    )
    return db.execute(stmt).scalars().unique().all()


def calculate_leave_days_in_period(
    leave_requests: list[LeaveRequest],
    period_start: date,
    period_end: date,
) -> dict:
    paid_leave_days = Decimal("0.0")
    unpaid_leave_days = Decimal("0.0")

    for leave_request in leave_requests:
        clipped_start = max(leave_request.start_date, period_start)
        clipped_end = min(leave_request.end_date, period_end)
        if clipped_end < clipped_start:
            continue

        current_day = clipped_start
        working_days = Decimal("0.0")
        while current_day <= clipped_end:
            if current_day.weekday() < 5:
                working_days += Decimal("1.0")
            current_day += timedelta(days=1)

        leave_type = leave_request.leave_type
        if leave_type and leave_type.is_paid:
            paid_leave_days += working_days
        else:
            unpaid_leave_days += working_days

    return {
        "paid_leave_days": _days(paid_leave_days),
        "unpaid_leave_days": _days(unpaid_leave_days),
    }


def calculate_payslip(
    db: Session,
    employee_id: str,
    period_start: date,
    period_end: date,
    working_days: int,
) -> dict:
    salary = get_active_salary(db, employee_id)
    if not salary:
        raise AppException(400, "Active salary structure not found")

    attendance_present_days = _attendance_present_days(db, employee_id, period_start, period_end)
    approved_leaves = get_approved_leaves_for_period(db, employee_id, period_start, period_end)
    leave_summary = calculate_leave_days_in_period(approved_leaves, period_start, period_end)

    paid_leave_days = leave_summary["paid_leave_days"]
    unpaid_leave_days = leave_summary["unpaid_leave_days"]
    leave_days = _days(paid_leave_days + unpaid_leave_days)

    basic_salary = _money(salary.basic_salary)
    hra = _money(salary.hra)
    other_allowances = _money(salary.other_allowances)
    professional_tax = _money(salary.professional_tax)
    gross = _money(basic_salary + hra + other_allowances)

    if working_days <= 0:
        raise AppException(400, "working_days must be greater than zero")

    daily_rate = _money(gross / Decimal(str(working_days)))
    lop_days = _days(unpaid_leave_days)
    lop_deduction = _money(daily_rate * lop_days)
    pf_employee = _money(basic_salary * _decimal(salary.pf_employee_pct) / Decimal("100"))
    pf_employer = _money(basic_salary * _decimal(salary.pf_employer_pct) / Decimal("100"))
    total_deductions = _money(pf_employee + professional_tax + lop_deduction)
    net_pay = _money(gross - total_deductions)

    return {
        "basic_salary": basic_salary,
        "hra": hra,
        "other_allowances": other_allowances,
        "gross_salary": gross,
        "daily_rate": daily_rate,
        "pf_employee": pf_employee,
        "pf_employer": pf_employer,
        "professional_tax": professional_tax,
        "total_deductions": total_deductions,
        "net_pay": net_pay,
        "working_days": working_days,
        "present_days": attendance_present_days,
        "leave_days": leave_days,
        "paid_leave_days": paid_leave_days,
        "unpaid_leave_days": unpaid_leave_days,
        "lop_days": lop_days,
    }


def generate_payslip_for_employee(
    db: Session,
    payrun_id: str,
    employee_id: str,
    period_start: date,
    period_end: date,
    working_days: int,
) -> Payslip:
    values = calculate_payslip(db, employee_id, period_start, period_end, working_days)

    payslip = Payslip(
        payrun_id=payrun_id,
        employee_id=employee_id,
        basic_salary=values["basic_salary"],
        hra=values["hra"],
        other_allowances=values["other_allowances"],
        gross_salary=values["gross_salary"],
        pf_employee=values["pf_employee"],
        pf_employer=values["pf_employer"],
        professional_tax=values["professional_tax"],
        total_deductions=values["total_deductions"],
        net_pay=values["net_pay"],
        working_days=values["working_days"],
        present_days=values["present_days"],
        leave_days=int(values["leave_days"]),
        lop_days=int(values["lop_days"]),
        status=PayslipStatus.generated,
        generated_at=datetime.utcnow(),
    )
    db.add(payslip)
    db.commit()
    db.refresh(payslip)
    return payslip
