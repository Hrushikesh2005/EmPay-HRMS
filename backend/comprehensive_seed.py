import enum
import random
import uuid
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal

import bcrypt
from dotenv import load_dotenv
from faker import Faker
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.base import new_uuid
from app.models.employee import EmployeeProfile
from app.models.enums import EmploymentType, UserRole, AttendanceStatus, LeaveRequestStatus
from app.models.leave_type import LeaveType
from app.models.leave_balance import LeaveBalance
from app.models.leave_request import LeaveRequest
from app.models.user import User
from app.models.attendance import AttendanceLog

# Configuration
N_ADMINS = 1
N_HR_OFFICERS = 5
N_PAYROLL_OFFICERS = 5
N_EMPLOYEES = 500  # Reduced for stability, can be increased later
DEFAULT_PASSWORD = "Password123!"
ATTENDANCE_MONTHS = 2
LEAVE_REQUEST_TARGET = 500

FAKE = Faker("en_IN")
random.seed(42)
Faker.seed(42)

DEPARTMENTS = ["Engineering", "Product", "Design", "Sales", "Marketing", "Operations", "Finance", "HR"]

def hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=10))
    return hashed.decode("utf-8")

def seed_users_and_profiles(db: Session, password_hash: str):
    print("[1/5] Seeding users and profiles...")
    existing_emails = {u.email for u in db.query(User.email).all()}
    
    roles = (
        [(UserRole.admin, "admin")] * N_ADMINS +
        [(UserRole.hr_officer, "hr")] * N_HR_OFFICERS +
        [(UserRole.payroll_officer, "payroll")] * N_PAYROLL_OFFICERS +
        [(UserRole.employee, "emp")] * N_EMPLOYEES
    )
    
    new_users = []
    for i, (role, prefix) in enumerate(roles):
        email = f"{prefix}{i+100}@empay_seed.local"
        if email in existing_emails: continue
        
        user = User(
            id=new_uuid(),
            email=email,
            full_name=FAKE.name(),
            role=role,
            hashed_password=password_hash,
            is_active=True
        )
        db.add(user)
        db.flush()
        
        if role != UserRole.admin:
            profile = EmployeeProfile(
                id=new_uuid(),
                user_id=user.id,
                employee_code=f"SEED-{1000+i}-{random.randint(1000, 9999)}",
                department=random.choice(DEPARTMENTS),
                designation="Staff",
                phone=FAKE.phone_number()[:20],
                date_of_joining=date.today() - timedelta(days=random.randint(30, 1000)),
                employment_type=random.choice(list(EmploymentType))
            )
            db.add(profile)
        
        if i % 100 == 0:
            db.commit()
    db.commit()

def seed_leave_types_and_balances(db: Session):
    print("[2/5] Seeding leave types and balances...")
    leave_types_data = [
        {"name": "Paid Leave", "days": 20, "paid": True},
        {"name": "Sick Leave", "days": 10, "paid": True},
        {"name": "Unpaid Leave", "days": 30, "paid": False},
    ]
    
    types = []
    for data in leave_types_data:
        lt = db.query(LeaveType).filter(LeaveType.name == data["name"]).first()
        if not lt:
            lt = LeaveType(id=new_uuid(), name=data["name"], default_days_per_year=data["days"], is_paid=data["paid"])
            db.add(lt)
            db.flush()
        types.append(lt)
    
    profiles = db.query(EmployeeProfile).all()
    current_year = date.today().year
    
    existing_balances = {(b.employee_id, b.leave_type_id) for b in db.query(LeaveBalance.employee_id, LeaveBalance.leave_type_id).filter(LeaveBalance.year == current_year).all()}
    
    for i, profile in enumerate(profiles):
        for lt in types:
            if (profile.id, lt.id) in existing_balances: continue
            db.add(LeaveBalance(
                id=new_uuid(), employee_id=profile.id, leave_type_id=lt.id, year=current_year,
                allocated_days=lt.default_days_per_year, used_days=Decimal("0.0")
            ))
        if i % 100 == 0: db.commit()
    db.commit()

def seed_leave_requests(db: Session):
    print("[3/5] Seeding leave requests...")
    profiles = db.query(EmployeeProfile).all()
    leave_types = db.query(LeaveType).all()
    hr_users = db.query(User).filter(User.role == UserRole.hr_officer).all()
    
    for i in range(LEAVE_REQUEST_TARGET):
        profile = random.choice(profiles)
        lt = random.choice(leave_types)
        start_date = date.today() - timedelta(days=random.randint(1, 60))
        end_date = start_date + timedelta(days=random.randint(0, 3))
        
        request = LeaveRequest(
            id=new_uuid(), employee_id=profile.id, leave_type_id=lt.id,
            start_date=start_date, end_date=end_date, total_days=(end_date - start_date).days + 1,
            reason=FAKE.sentence(), status=random.choice(list(LeaveRequestStatus))
        )
        if request.status in [LeaveRequestStatus.approved, LeaveRequestStatus.rejected] and hr_users:
            request.reviewed_by = random.choice(hr_users).id
            request.reviewed_at = datetime.now(timezone.utc)
        db.add(request)
        if i % 100 == 0: db.commit()
    db.commit()

def seed_attendance_logs(db: Session):
    print("[4/5] Seeding attendance logs...")
    profiles = db.query(EmployeeProfile).all()
    start_date = date.today() - timedelta(days=30 * ATTENDANCE_MONTHS)
    
    # Pre-fetch existing entries to skip
    existing_entries = {(log.employee_id, log.work_date) for log in db.query(AttendanceLog.employee_id, AttendanceLog.work_date).filter(AttendanceLog.work_date >= start_date).all()}
    
    current_date = start_date
    while current_date <= date.today():
        if current_date.weekday() < 5:
            day_logs = []
            for profile in random.sample(profiles, int(len(profiles) * 0.9)):
                if (profile.id, current_date) in existing_entries: continue
                
                scenario = random.random()
                check_in, check_out, status = None, None, AttendanceStatus.absent
                if scenario < 0.85:
                    check_in = datetime.combine(current_date, time(9, 0)) + timedelta(minutes=random.randint(-15, 20))
                    check_out = datetime.combine(current_date, time(18, 0)) + timedelta(minutes=random.randint(-10, 15))
                    status = AttendanceStatus.present
                elif scenario < 0.95:
                    check_in = datetime.combine(current_date, time(13, 0))
                    check_out = datetime.combine(current_date, time(18, 0))
                    status = AttendanceStatus.half_day
                
                day_logs.append(AttendanceLog(
                    id=new_uuid(), employee_id=profile.id, work_date=current_date,
                    check_in=check_in, check_out=check_out, status=status
                ))
            
            db.bulk_save_objects(day_logs)
            db.commit()
            print(f"  Done: {current_date}")
        current_date += timedelta(days=1)

def main():
    load_dotenv()
    db = SessionLocal()
    try:
        pw_hash = hash_password(DEFAULT_PASSWORD)
        seed_users_and_profiles(db, pw_hash)
        seed_leave_types_and_balances(db)
        seed_leave_requests(db)
        seed_attendance_logs(db)
        print("\nSUCCESS: Seeding complete.")
    except Exception as e:
        print(f"\nERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
