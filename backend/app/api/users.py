from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.schemas.user import UserAdminOut, UserStatusUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=list[UserAdminOut])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
	return db.query(User).order_by(User.full_name.asc()).all()


@router.patch("/{user_id}/status", response_model=UserAdminOut)
def update_user_status(
	user_id: str,
	data: UserStatusUpdate,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_admin),
):
	user = db.query(User).filter(User.id == user_id).first()
	if not user:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

	user.is_active = data.is_active
	db.commit()
	db.refresh(user)
	return user