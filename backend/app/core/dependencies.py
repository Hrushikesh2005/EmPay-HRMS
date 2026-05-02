from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
	try:
		payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
		user_id: str | None = payload.get("sub")
		if not user_id:
			raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
	except JWTError:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

	user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
	if not user:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
	return user


def require_roles(*roles: str):
	allowed = set(roles)

	def _checker(current_user: User = Depends(get_current_user)) -> User:
		if current_user.role not in allowed:
			raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
		return current_user

	return _checker


def require_admin(current_user: User = Depends(require_roles("admin"))) -> User:
	return current_user


def require_hr(current_user: User = Depends(require_roles("hr_officer", "admin"))) -> User:
	return current_user


def require_payroll(current_user: User = Depends(require_roles("payroll_officer", "admin"))) -> User:
	return current_user
