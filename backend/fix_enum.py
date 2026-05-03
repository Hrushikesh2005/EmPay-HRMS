import sys
from app.core.database import SessionLocal
from sqlalchemy import text

def fix_enum():
    db = SessionLocal()
    db.execute(text("UPDATE role_permissions SET access_level = LOWER(access_level::text)::accesslevel"))
    db.commit()
    print("Fixed enum casing")

if __name__ == "__main__":
    fix_enum()
