import os
import uuid

import bcrypt
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError


DEFAULT_PASSWORD = "Test@1234"
SEED_USERS = [
    {
        "email": "admin@empay.local",
        "full_name": "Admin User",
        "role": "admin",
    },
    {
        "email": "hr@empay.local",
        "full_name": "HR Officer",
        "role": "hr_officer",
    },
    {
        "email": "payroll@empay.local",
        "full_name": "Payroll Officer",
        "role": "payroll_officer",
    },
    {
        "email": "employee@empay.local",
        "full_name": "Employee User",
        "role": "employee",
    },
]


def get_password_hash(password: str) -> str:
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def main() -> None:
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set in the environment.")

    engine = create_engine(database_url, future=True)
    password_hash = get_password_hash(DEFAULT_PASSWORD)

    try:
        with engine.begin() as connection:
            for user in SEED_USERS:
                exists = connection.execute(
                    text("SELECT 1 FROM users WHERE email = :email"),
                    {"email": user["email"]},
                ).scalar()
                if exists:
                    print(f"Skipping {user['email']}: already exists")
                    continue

                connection.execute(
                    text(
                        """
                        INSERT INTO users (
                            id,
                            email,
                            hashed_password,
                            full_name,
                            role,
                            is_active
                        )
                        VALUES (
                            :id,
                            :email,
                            :hashed_password,
                            :full_name,
                            :role,
                            :is_active
                        )
                        """
                    ),
                    {
                        "id": str(uuid.uuid4()),
                        "email": user["email"],
                        "hashed_password": password_hash,
                        "full_name": user["full_name"],
                        "role": user["role"],
                        "is_active": True,
                    },
                )
                print(f"Inserted {user['email']}")
    except SQLAlchemyError as exc:
        raise SystemExit(f"Seed failed: {exc}") from exc


if __name__ == "__main__":
    main()
