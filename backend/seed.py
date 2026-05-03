import random
from datetime import date, datetime, time, timedelta, timezone

import bcrypt
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.base import new_uuid
from app.models.enums import (
    AttendanceStatus,
    EmploymentType,
    LeaveRequestStatus,
    PayrunStatus,
    PayslipStatus,
    UserRole,
)
from app.models.permission import AccessLevel, Permission
from app.models.user import User
from app.models.employee import EmployeeProfile
from app.models.department import Department
from app.models.leave_type import LeaveType
from app.models.leave_balance import LeaveBalance
from app.models.leave_request import LeaveRequest
from app.models.attendance import AttendanceLog
from app.models.salary import SalaryStructure
from app.models.payroll import Payrun, Payslip


def hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def is_working_day(day: date) -> bool:
    return day.weekday() < 5


def count_working_days(start_date: date, end_date: date) -> int:
    current_day = start_date
    total_days = 0
    while current_day <= end_date:
        if is_working_day(current_day):
            total_days += 1
        current_day += timedelta(days=1)
    return total_days


def build_attendance_times(work_date: date, status: AttendanceStatus) -> tuple[datetime | None, datetime | None]:
    if status == AttendanceStatus.present:
        return (
            datetime.combine(work_date, time(9, 30), tzinfo=timezone.utc),
            datetime.combine(work_date, time(18, 0), tzinfo=timezone.utc),
        )
    if status == AttendanceStatus.half_day:
        return (
            datetime.combine(work_date, time(10, 0), tzinfo=timezone.utc),
            datetime.combine(work_date, time(14, 0), tzinfo=timezone.utc),
        )
    return None, None


def clear_database(db: Session):
    print("Clearing database...")
    db.query(Payslip).delete()
    db.query(Payrun).delete()
    db.query(AttendanceLog).delete()
    db.query(LeaveRequest).delete()
    db.query(LeaveBalance).delete()
    db.query(SalaryStructure).delete()
    db.query(Permission).delete()
    db.query(EmployeeProfile).delete()
    db.query(LeaveType).delete()
    db.query(User).delete()
    db.query(Department).delete()
    db.commit()


def seed_database(db: Session):
    random.seed(42)

    print("Seeding Departments...")
    depts = [
        Department(id=new_uuid(), name="Engineering", description="Software Development"),
        Department(id=new_uuid(), name="HR", description="Human Resources"),
        Department(id=new_uuid(), name="Sales", description="Sales & Marketing"),
    ]
    db.add_all(depts)
    db.commit()

    print("Seeding Leave Types...")
    leave_types = [
        LeaveType(id=new_uuid(), name="Paid Leave", default_days_per_year=20, is_paid=True),
        LeaveType(id=new_uuid(), name="Sick Leave", default_days_per_year=10, is_paid=True),
        LeaveType(id=new_uuid(), name="Unpaid Leave", default_days_per_year=30, is_paid=False),
    ]
    db.add_all(leave_types)
    db.commit()

    print("Seeding Users & Profiles...")
    default_password = hash_password("Password123!")
    users_data = [
        {"full_name": "Admin User", "email": "admin@empay.com", "role": UserRole.admin, "create_profile": False},
        {
            "full_name": "HR Officer",
            "email": "hr@empay.com",
            "role": UserRole.hr_officer,
            "dept": depts[1],
            "desig": "HR Manager",
            "create_profile": True,
        },
        {
            "full_name": "Payroll Officer",
            "email": "payroll@empay.com",
            "role": UserRole.payroll_officer,
            "dept": depts[1],
            "desig": "Payroll Specialist",
            "create_profile": True,
        },
        {
            "full_name": "Dev Nair",
            "email": "emp1@empay.com",
            "role": UserRole.employee,
            "dept": depts[0],
            "desig": "SDE II",
            "create_profile": True,
        },
        {
            "full_name": "Priya Kapoor",
            "email": "emp2@empay.com",
            "role": UserRole.employee,
            "dept": depts[2],
            "desig": "Senior Analyst",
            "create_profile": True,
        },
        {
            "full_name": "Rohan Joshi",
            "email": "emp3@empay.com",
            "role": UserRole.employee,
            "dept": depts[0],
            "desig": "UI Designer",
            "create_profile": True,
        },
    ]

    users_by_email = {}
    employees = []
    for u_data in users_data:
        user = User(
            id=new_uuid(),
            full_name=u_data["full_name"],
            email=u_data["email"],
            role=u_data["role"],
            hashed_password=default_password,
            is_active=True,
        )
        db.add(user)
        db.flush()
        users_by_email[user.email] = user

        if u_data.get("create_profile", True):
            profile_index = len(employees)
            profile = EmployeeProfile(
                id=new_uuid(),
                user_id=user.id,
                employee_code=f"EMP-100{profile_index + 1}",
                department_id=u_data["dept"].id,
                designation=u_data["desig"],
                phone=f"+91 98765432{profile_index:02d}",
                date_of_joining=date(2023, 1, 15),
                employment_type=EmploymentType.full_time,
                date_of_birth=date(1990 + profile_index, 5, 20),
                pan_number=f"ABCDE1234{profile_index}",
                uan_number=f"10000000000{profile_index}",
                bank_details={
                    "bank_name": "HDFC Bank",
                    "account_number": f"5010000000000{profile_index}",
                    "ifsc_code": "HDFC0001234",
                    "account_name": u_data["full_name"],
                },
            )
            db.add(profile)
            employees.append({"user": user, "profile": profile})

    db.commit()

    print("Seeding Role Permissions...")
    permission_templates = {
        "admin": {
            "dashboard": (AccessLevel.ALL, True, True),
            "directory": (AccessLevel.ALL, True, True),
            "attendance": (AccessLevel.ALL, True, True),
            "leave": (AccessLevel.ALL, True, True),
            "payroll": (AccessLevel.ALL, True, True),
            "reports": (AccessLevel.ALL, True, True),
            "settings": (AccessLevel.ALL, True, True),
        },
        "hr_officer": {
            "dashboard": (AccessLevel.ALL, False, False),
            "directory": (AccessLevel.ALL, True, False),
            "attendance": (AccessLevel.ALL, True, False),
            "leave": (AccessLevel.ALL, True, False),
            "payroll": (AccessLevel.SELF, False, False),
            "reports": (AccessLevel.ALL, False, False),
            "settings": (AccessLevel.NONE, False, False),
        },
        "payroll_officer": {
            "dashboard": (AccessLevel.ALL, False, False),
            "directory": (AccessLevel.SELF, False, False),
            "attendance": (AccessLevel.SELF, False, False),
            "leave": (AccessLevel.SELF, True, False),
            "payroll": (AccessLevel.ALL, True, False),
            "reports": (AccessLevel.ALL, False, False),
            "settings": (AccessLevel.NONE, False, False),
        },
        "employee": {
            "dashboard": (AccessLevel.SELF, False, False),
            "directory": (AccessLevel.SELF, False, False),
            "attendance": (AccessLevel.SELF, True, False),
            "leave": (AccessLevel.SELF, True, False),
            "payroll": (AccessLevel.SELF, False, False),
            "reports": (AccessLevel.NONE, False, False),
            "settings": (AccessLevel.NONE, False, False),
        },
    }

    permissions = []
    for role_name, module_map in permission_templates.items():
        for module_name, (access_level, can_edit, can_delete) in module_map.items():
            permissions.append(
                Permission(
                    id=new_uuid(),
                    role=role_name,
                    module=module_name,
                    access_level=access_level,
                    can_edit=can_edit,
                    can_delete=can_delete,
                )
            )

    db.add_all(permissions)
    db.commit()

    print("Seeding Leave Requests...")
    leave_request_specs = [
        {
            "employee_email": "emp1@empay.com",
            "leave_type_name": "Paid Leave",
            "start_date": date(2026, 4, 10),
            "end_date": date(2026, 4, 13),
            "status": LeaveRequestStatus.approved,
            "reviewed_by": "hr@empay.com",
            "review_remarks": "Approved for planned travel.",
        },
        {
            "employee_email": "emp2@empay.com",
            "leave_type_name": "Sick Leave",
            "start_date": date(2026, 5, 1),
            "end_date": date(2026, 5, 4),
            "status": LeaveRequestStatus.approved,
            "reviewed_by": "hr@empay.com",
            "review_remarks": "Medical leave approved.",
        },
        {
            "employee_email": "emp3@empay.com",
            "leave_type_name": "Unpaid Leave",
            "start_date": date(2026, 5, 8),
            "end_date": date(2026, 5, 12),
            "status": LeaveRequestStatus.pending,
            "reviewed_by": None,
            "review_remarks": None,
        },
        {
            "employee_email": "payroll@empay.com",
            "leave_type_name": "Paid Leave",
            "start_date": date(2026, 4, 21),
            "end_date": date(2026, 4, 23),
            "status": LeaveRequestStatus.rejected,
            "reviewed_by": "hr@empay.com",
            "review_remarks": "Rejected during payroll close.",
        },
    ]

    leave_requests = []
    for spec in leave_request_specs:
        employee = next(item["profile"] for item in employees if item["user"].email == spec["employee_email"])
        leave_type = next(item for item in leave_types if item.name == spec["leave_type_name"])
        reviewer = users_by_email.get(spec["reviewed_by"])
        leave_request = LeaveRequest(
            id=new_uuid(),
            employee_id=employee.id,
            leave_type_id=leave_type.id,
            start_date=spec["start_date"],
            end_date=spec["end_date"],
            total_days=count_working_days(spec["start_date"], spec["end_date"]),
            reason=f"{leave_type.name} sample request for testing",
            status=spec["status"],
            reviewed_by=reviewer.id if reviewer else None,
            reviewed_at=datetime(2026, 4, 12, 12, 0, tzinfo=timezone.utc)
            if reviewer and spec["status"] != LeaveRequestStatus.pending
            else None,
            review_remarks=spec["review_remarks"],
        )
        db.add(leave_request)
        leave_requests.append(leave_request)

    db.commit()

    approved_leave_ranges_by_employee = {}
    used_days_by_employee_type = {}
    for leave_request in leave_requests:
        if leave_request.status != LeaveRequestStatus.approved:
            continue
        approved_leave_ranges_by_employee.setdefault(leave_request.employee_id, []).append(
            (leave_request.start_date, leave_request.end_date)
        )
        key = (leave_request.employee_id, leave_request.leave_type_id)
        used_days_by_employee_type[key] = used_days_by_employee_type.get(key, 0) + int(leave_request.total_days)

    print("Seeding Leave Balances...")
    balances = []
    for item in employees:
        profile = item["profile"]
        for lt in leave_types:
            balances.append(
                LeaveBalance(
                    id=new_uuid(),
                    employee_id=profile.id,
                    leave_type_id=lt.id,
                    year=2026,
                    allocated_days=lt.default_days_per_year,
                    used_days=used_days_by_employee_type.get((profile.id, lt.id), 0),
                )
            )

    db.add_all(balances)
    db.commit()

    today = date.today()
    previous_month_start = (today.replace(day=1) - timedelta(days=1)).replace(day=1)
    print("Seeding Attendance Logs for the current and previous month...")
    attendance_logs = []
    for item in employees:
        profile = item["profile"]
        current_day = previous_month_start
        while current_day <= today:
            if any(window_start <= current_day <= window_end for window_start, window_end in approved_leave_ranges_by_employee.get(profile.id, [])):
                status = AttendanceStatus.on_leave
            elif current_day == today and item["user"].email == "emp2@empay.com":
                status = AttendanceStatus.on_leave
            elif not is_working_day(current_day):
                status = AttendanceStatus.weekend
            else:
                roll = random.random()
                if roll < 0.78:
                    status = AttendanceStatus.present
                elif roll < 0.9:
                    status = AttendanceStatus.half_day
                else:
                    status = AttendanceStatus.absent

            check_in, check_out = build_attendance_times(current_day, status)
            attendance_logs.append(
                AttendanceLog(
                    id=new_uuid(),
                    employee_id=profile.id,
                    work_date=current_day,
                    status=status,
                    check_in=check_in,
                    check_out=check_out,
                    remarks="Seeded sample attendance" if status == AttendanceStatus.absent else None,
                )
            )
            current_day += timedelta(days=1)

    db.add_all(attendance_logs)
    db.commit()

    print("Seeding Salary Structures & Payruns...")
    salary_templates = [
        {"email": "hr@empay.com", "basic": 60000, "hra": 25000, "allowances": 12000},
        {"email": "payroll@empay.com", "basic": 65000, "hra": 24000, "allowances": 15000},
        {"email": "emp1@empay.com", "basic": 50000, "hra": 20000, "allowances": 10000},
        {"email": "emp2@empay.com", "basic": 55000, "hra": 22000, "allowances": 12000},
        {"email": "emp3@empay.com", "basic": 45000, "hra": 18000, "allowances": 8000},
    ]

    for item in salary_templates:
        profile = next(entry["profile"] for entry in employees if entry["user"].email == item["email"])
        struct = SalaryStructure(
            id=new_uuid(),
            employee_id=profile.id,
            effective_from=date(2025, 1, 1),
            basic_salary=item["basic"],
            hra=item["hra"],
            other_allowances=item["allowances"],
            pf_employee_pct=12,
            pf_employer_pct=12,
            professional_tax=200,
            is_active=True,
        )
        db.add(struct)

    db.commit()

    prev_month_period_start = previous_month_start
    prev_month_period_end = (today.replace(day=1) - timedelta(days=1))
    payrun = Payrun(
        id=new_uuid(),
        period_label=prev_month_period_start.strftime("%B %Y"),
        period_start=prev_month_period_start,
        period_end=prev_month_period_end,
        status=PayrunStatus.paid,
        created_by=users_by_email["admin@empay.com"].id,
        finalized_at=datetime(2026, 4, 30, 18, 0, tzinfo=timezone.utc),
    )
    db.add(payrun)
    db.flush()

    for item in salary_templates:
        profile = next(entry["profile"] for entry in employees if entry["user"].email == item["email"])
        gross_salary = item["basic"] + item["hra"] + item["allowances"]
        pf_employee = round(item["basic"] * 0.12, 2)
        pf_employer = round(item["basic"] * 0.12, 2)
        total_deductions = round(pf_employee + 200, 2)
        payslip = Payslip(
            id=new_uuid(),
            payrun_id=payrun.id,
            employee_id=profile.id,
            basic_salary=item["basic"],
            hra=item["hra"],
            other_allowances=item["allowances"],
            pf_employee=pf_employee,
            pf_employer=pf_employer,
            professional_tax=200,
            gross_salary=gross_salary,
            total_deductions=total_deductions,
            net_pay=round(gross_salary - total_deductions, 2),
            working_days=count_working_days(prev_month_period_start, prev_month_period_end),
            present_days=20,
            leave_days=2 if item["email"] in {"emp1@empay.com", "emp2@empay.com"} else 0,
            lop_days=0,
            status=PayslipStatus.sent,
            generated_at=datetime(2026, 4, 30, 18, 0, tzinfo=timezone.utc),
        )
        db.add(payslip)

    db.commit()
    print("Demo data seeded successfully!")


def main():
    load_dotenv()
    db = SessionLocal()
    try:
        clear_database(db)
        seed_database(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
