from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.leave_type import LeaveType
from app.models.user import User
from app.schemas.leave_type import LeaveTypeResponse

router = APIRouter(prefix="/leave-types", tags=["Leave Types"])


@router.get("/", response_model=list[LeaveTypeResponse])
def list_leave_types(
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
) -> list[LeaveTypeResponse]:
	"""Get all leave types."""
	leave_types = db.query(LeaveType).order_by(LeaveType.name).all()
	return leave_types
