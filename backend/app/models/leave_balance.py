from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, new_uuid


class LeaveBalance(Base):
	__tablename__ = "leave_balances"
	__table_args__ = (
		UniqueConstraint("employee_id", "leave_type_id", "year", name="uq_balance_employee_type_year"),
	)

	id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
	employee_id: Mapped[str] = mapped_column(
		String(36), ForeignKey("employee_profiles.id", ondelete="CASCADE"), nullable=False
	)
	leave_type_id: Mapped[str] = mapped_column(
		String(36), ForeignKey("leave_types.id", ondelete="CASCADE"), nullable=False
	)
	year: Mapped[int] = mapped_column(Integer, nullable=False)
	allocated_days: Mapped[Decimal] = mapped_column(Numeric(5, 1), nullable=False, default=Decimal("0.0"))
	used_days: Mapped[Decimal] = mapped_column(Numeric(5, 1), nullable=False, default=Decimal("0.0"))

	employee = relationship("EmployeeProfile", back_populates="leave_balances", lazy="joined")
	leave_type = relationship("LeaveType", back_populates="balances", lazy="joined")

	@property
	def remaining_days(self) -> Decimal:
		return Decimal(self.allocated_days) - Decimal(self.used_days)

	@property
	def leave_type_name(self) -> str:
		return self.leave_type.name if self.leave_type else ""

	def __repr__(self) -> str:
		return f"<LeaveBalance id={self.id!s} employee_id={self.employee_id!s} year={self.year!r}>"
