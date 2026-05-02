from datetime import date

import bcrypt
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.base import new_uuid
from app.models.employee import EmployeeProfile
from app.models.enums import EmploymentType, UserRole
from app.models.leave import LeaveType
from app.models.user import User


def hash_password(password: str) -> str:
    """Hash password using bcrypt directly (avoids passlib compatibility issues)."""
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def seed_users(db: Session) -> None:
    users = [
        {"full_name": "Admin One", "email": "admin@empay.com", "role": UserRole.admin},
        {"full_name": "HR Officer One", "email": "hr1@empay.com", "role": UserRole.hr_officer},
        {"full_name": "HR Officer Two", "email": "hr2@empay.com", "role": UserRole.hr_officer},
        {"full_name": "Payroll Officer One", "email": "payroll1@empay.com", "role": UserRole.payroll_officer},
        {"full_name": "Payroll Officer Two", "email": "payroll2@empay.com", "role": UserRole.payroll_officer},
        {"full_name": "Employee One", "email": "emp1@empay.com", "role": UserRole.employee},
        {"full_name": "Employee Two", "email": "emp2@empay.com", "role": UserRole.employee},
        {"full_name": "Employee Three", "email": "emp3@empay.com", "role": UserRole.employee},
        {"full_name": "Employee Four", "email": "emp4@empay.com", "role": UserRole.employee},
        {"full_name": "Employee Five", "email": "emp5@empay.com", "role": UserRole.employee},
        {"full_name": "Employee Six", "email": "emp6@empay.com", "role": UserRole.employee},
        {"full_name": "Employee Seven", "email": "emp7@empay.com", "role": UserRole.employee},
        {"full_name": "Employee Eight", "email": "emp8@empay.com", "role": UserRole.employee},
    ]

    default_password = "Password123!"

    for item in users:
        existing = db.query(User).filter(User.email == item["email"]).first()
        if existing:
            continue

        user = User(
            id=new_uuid(),
            full_name=item["full_name"],
            email=item["email"],
            role=item["role"],
            hashed_password=hash_password(default_password),
            is_active=True,
        )
        db.add(user)
        db.flush()

        if user.role != UserRole.admin:
            profile = EmployeeProfile(
                id=new_uuid(),
                user_id=user.id,
                department="Operations",
                designation="Staff",
                phone=None,
                date_of_joining=date.today(),
                employment_type=EmploymentType.full_time,
            )
            db.add(profile)

    db.commit()


def seed_leave_types(db: Session) -> None:
    leave_types = [
        {"name": "Paid Leave", "default_days_per_year": 20, "is_paid": True},
        {"name": "Sick Leave", "default_days_per_year": 10, "is_paid": True},
        {"name": "Unpaid Leave", "default_days_per_year": 30, "is_paid": False},
    ]

    for item in leave_types:
        existing = db.query(LeaveType).filter(LeaveType.name == item["name"]).first()
        if existing:
            print(f"[EXISTS] {item['name']}")
            continue

        leave_type = LeaveType(
            id=new_uuid(),
            name=item["name"],
            default_days_per_year=item["default_days_per_year"],
            is_paid=item["is_paid"],
        )
        db.add(leave_type)
        print(f"[SEEDED] {item['name']}")

    db.commit()


def main() -> None:
    load_dotenv()
    db = SessionLocal()
    try:
        seed_users(db)
        seed_leave_types(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
