import os
import sys
from datetime import date, timedelta
from decimal import Decimal

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import select
from app.db.session import SessionLocal
from app.models.user import User
from app.models.employee import EmployeeProfile
from app.models.salary import SalaryStructure
from app.models.attendance import AttendanceLog
from app.models.enums import EmploymentType, AttendanceStatus, LeaveRequestStatus
from app.models.leave_type import LeaveType
from app.models.leave_request import LeaveRequest
from app.models.leave_balance import LeaveBalance

def seed_payroll_test():
    with SessionLocal() as db:
        print("Starting seed process for payroll test data...")

        # 1. Get the employee user
        user = db.execute(
            select(User).where(User.email == "employee@empay.local")
        ).scalar_one_or_none()

        if not user:
            print("Error: User employee@empay.local not found. Run seed.py first.")
            return

        print(f"Found user: {user.email} (ID: {user.id})")

        # 2. Create Employee Profile
        profile = db.execute(
            select(EmployeeProfile).where(EmployeeProfile.user_id == user.id)
        ).scalar_one_or_none()

        if not profile:
            profile = EmployeeProfile(
                user_id=user.id,
                employee_code="EMP-001",
                department="Engineering",
                designation="Software Engineer",
                date_of_joining=date(2024, 1, 15),
                employment_type=EmploymentType.full_time,
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)
            print("Created EmployeeProfile.")
        else:
            print("EmployeeProfile already exists.")

        # 3. Create Salary Structure
        salary = db.execute(
            select(SalaryStructure).where(SalaryStructure.employee_id == profile.id)
        ).scalar_one_or_none()

        if not salary:
            salary = SalaryStructure(
                employee_id=profile.id,
                basic_salary=30000.00,
                hra=15000.00,
                other_allowances=5000.00,
                pf_employee_pct=12.0,
                pf_employer_pct=12.0,
                professional_tax=200.00,
                effective_from=date(2024, 1, 1),
                is_active=True,
            )
            db.add(salary)
            db.commit()
            print("Created SalaryStructure.")
        else:
            print("SalaryStructure already exists.")

        # 4. Give them Leave Balances
        leave_types = db.execute(select(LeaveType)).scalars().all()
        for lt in leave_types:
            balance = db.execute(
                select(LeaveBalance).where(
                    LeaveBalance.employee_id == profile.id,
                    LeaveBalance.leave_type_id == lt.id,
                    LeaveBalance.year == 2026
                )
            ).scalar_one_or_none()
            if not balance:
                db.add(LeaveBalance(
                    employee_id=profile.id,
                    leave_type_id=lt.id,
                    year=2026,
                    allocated_days=lt.default_days_per_year,
                    used_days=0
                ))
        db.commit()
        print("Ensured LeaveBalances for 2026.")

        # 5. Create a Pending Leave Request for May 2026
        paid_leave = next((lt for lt in leave_types if lt.is_paid), None)
        if paid_leave:
            existing_leave = db.execute(
                select(LeaveRequest).where(
                    LeaveRequest.employee_id == profile.id,
                    LeaveRequest.start_date == date(2026, 5, 10)
                )
            ).scalar_one_or_none()

            if not existing_leave:
                leave_req = LeaveRequest(
                    employee_id=profile.id,
                    leave_type_id=paid_leave.id,
                    start_date=date(2026, 5, 10),
                    end_date=date(2026, 5, 12),
                    total_days=Decimal("3.0"),
                    reason="Vacation",
                    status=LeaveRequestStatus.pending
                )
                db.add(leave_req)
                db.commit()
                print("Created Pending Leave Request (May 10 - May 12).")
            else:
                print("Leave Request already exists.")

        # 6. Generate Attendance Logs for May 2026
        # Start May 1, 2026 to May 31, 2026
        start_date = date(2026, 5, 1)
        end_date = date(2026, 5, 31)
        current_date = start_date

        logs_added = 0
        while current_date <= end_date:
            existing_log = db.execute(
                select(AttendanceLog).where(
                    AttendanceLog.employee_id == profile.id,
                    AttendanceLog.work_date == current_date
                )
            ).scalar_one_or_none()

            if not existing_log:
                # Mon-Fri: Present, Sat-Sun: Weekend
                if current_date.weekday() < 5:
                    status = AttendanceStatus.present
                else:
                    status = AttendanceStatus.weekend

                db.add(AttendanceLog(
                    employee_id=profile.id,
                    work_date=current_date,
                    status=status
                ))
                logs_added += 1

            current_date += timedelta(days=1)
        
        if logs_added > 0:
            db.commit()
            print(f"Created {logs_added} Attendance Logs for May 2026.")
        else:
            print("Attendance logs already exist.")

        print("Done!")

if __name__ == "__main__":
    seed_payroll_test()
