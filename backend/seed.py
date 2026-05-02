from datetime import date
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.base import new_uuid
from app.models.employee import EmployeeProfile
from app.models.enums import EmploymentType, UserRole
from app.models.user import User
from app.services.auth_services import hash_password


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


def main() -> None:
    load_dotenv()
    db = SessionLocal()
    try:
        seed_users(db)
        print("Seed complete")
    finally:
        db.close()


if __name__ == "__main__":
    main()
