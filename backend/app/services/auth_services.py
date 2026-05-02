from datetime import datetime, timedelta

import bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.base import new_uuid
from app.models.user import User


def hash_password(password: str) -> str:
	"""Hash password using bcrypt directly."""
	hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
	return hashed.decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
	"""Verify password using bcrypt directly."""
	return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def _create_token(user: User, expires_minutes: int, token_type: str) -> str:
	payload = {
		"sub": user.id,
		"role": user.role,
		"type": token_type,
		"exp": datetime.utcnow() + timedelta(minutes=expires_minutes),
	}
	return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(user: User) -> str:
	return _create_token(user, settings.ACCESS_TOKEN_EXPIRE_MINUTES, "access")


def create_refresh_token(user: User) -> str:
	return _create_token(user, settings.REFRESH_TOKEN_EXPIRE_MINUTES, "refresh")


def register_user(data, db: Session) -> User:
	if db.query(User).filter(User.email == data.email).first():
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

	user = User(
		id=new_uuid(),
		email=data.email,
		full_name=data.full_name,
		hashed_password=hash_password(data.password),
		role=data.role,
	)
	db.add(user)
	db.commit()
	db.refresh(user)
	return user


def login_user(email: str, password: str, db: Session) -> tuple[str, str, User]:
	user = db.query(User).filter(User.email == email).first()
	if not user or not verify_password(password, user.hashed_password):
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
	if not user.is_active:
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")

	return create_access_token(user), create_refresh_token(user), user


def refresh_access_token(refresh_token: str, db: Session) -> tuple[str, str, User]:
	try:
		payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
	except JWTError:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

	if payload.get("type") != "refresh":
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

	user_id = payload.get("sub")
	if not user_id:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

	user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
	if not user:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

	return create_access_token(user), create_refresh_token(user), user
