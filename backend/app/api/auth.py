from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.schemas.auth import RegisterRequest, LoginResponse, RefreshRequest, UserOut, ChangePasswordRequest
from app.services.auth_services import register_user, login_user, refresh_access_token, change_password
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserOut)
def register(data: RegisterRequest, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
	return register_user(data, db)


@router.post("/login", response_model=LoginResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
	access_token, refresh_token, user = login_user(form_data.username, form_data.password, db)
	return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "role": user.role, "user": user}


@router.post("/refresh", response_model=LoginResponse)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
	access_token, refresh_token, user = refresh_access_token(data.refresh_token, db)
	return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "role": user.role, "user": user}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
	return current_user


@router.post("/change-password")
def api_change_password(
	data: ChangePasswordRequest, 
	db: Session = Depends(get_db), 
	current_user: User = Depends(get_current_user)
):
	change_password(current_user, data.old_password, data.new_password, db)
	return {"message": "Password changed successfully"}
