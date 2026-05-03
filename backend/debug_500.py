import sys
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.models.enums import UserRole
from app.core.database import SessionLocal
from app.models.user import User

def test():
    db = SessionLocal()
    user = db.query(User).filter(User.role == UserRole.admin).first()
    if not user:
        print("No admin user found")
        return
    client = TestClient(app)
    token = create_access_token({"sub": user.id, "role": user.role.value})
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/api/v1/permissions/seed", headers=headers)
    print("STATUS:", response.status_code)
    print("BODY:", response.text)

if __name__ == "__main__":
    test()
