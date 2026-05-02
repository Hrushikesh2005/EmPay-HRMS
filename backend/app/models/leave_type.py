from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.base import Base, TimestampMixin, new_uuid


class LeaveType(Base, TimestampMixin):
	__tablename__ = "leave_types"
	__table_args__ = {"extend_existing": True}

	id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
	name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
	default_days_per_year: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
	is_paid: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

	balances = relationship("LeaveBalance", back_populates="leave_type")
	requests = relationship("LeaveRequest", back_populates="leave_type")

	def __repr__(self) -> str:
		return f"<LeaveType id={self.id!s} name={self.name!r}>"