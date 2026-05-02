import os
import sys

# Add the parent directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine
from sqlalchemy import text

def update_perms():
    with engine.begin() as conn:
        conn.execute(text("UPDATE role_permissions SET can_edit = true WHERE module IN ('attendance', 'leave')"))
        print("Permissions updated successfully!")

if __name__ == "__main__":
    update_perms()
