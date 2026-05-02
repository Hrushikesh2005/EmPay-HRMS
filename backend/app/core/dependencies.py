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

	user = db.query(User).filter(User.id == user_id).first()
	if not user:
		print(f"DEBUG AUTH: User ID {user_id} from token NOT FOUND in DB")
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

	if not user.is_active:
		print(f"DEBUG AUTH: User {user.email} is INACTIVE. Rejecting request.")
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is inactive")

	return user


def require_roles(*roles: str):
	allowed = set(roles)

	def _checker(current_user: User = Depends(get_current_user)) -> User:
		role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
		if role_str not in allowed:
			raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
		return current_user

	return _checker


def require_admin(current_user: User = Depends(require_roles("admin"))) -> User:
	return current_user


def require_hr(current_user: User = Depends(require_roles("hr_officer", "admin"))) -> User:
	return current_user


def require_payroll(current_user: User = Depends(require_roles("payroll_officer", "admin"))) -> User:
	return current_user


def require_permission(
	module: str, action: str = "view", required_level: str = "self"
):
	from app.models.permission import Permission, AccessLevel

	def _checker(
		current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
	) -> User:
		# Extract the plain string value from the enum (e.g. "hr_officer")
		role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)

		# Admins have full access to everything
		if role_str == "admin":
			return current_user

		perm = (
			db.query(Permission)
			.filter(Permission.role == role_str, Permission.module == module)
			.first()
		)

		if not perm:
			raise HTTPException(
				status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied"
			)

		# Check Access Level (none < self < all)
		level_map = {"none": 0, "self": 1, "all": 2}
		user_level = level_map.get(perm.access_level.value, 0)
		required_lvl = level_map.get(required_level, 1)

		if user_level < required_lvl:
			raise HTTPException(
				status_code=status.HTTP_403_FORBIDDEN,
				detail=f"Insufficient access level for {module}",
			)

		if action == "edit" and not perm.can_edit:
			raise HTTPException(
				status_code=status.HTTP_403_FORBIDDEN,
				detail="You do not have permission to edit this module",
			)
		if action == "delete" and not perm.can_delete:
			raise HTTPException(
				status_code=status.HTTP_403_FORBIDDEN,
				detail="You do not have permission to delete from this module",
			)

		return current_user

	return _checker
