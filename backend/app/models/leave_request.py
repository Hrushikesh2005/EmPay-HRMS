from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, new_uuid
from app.models.enums import LeaveRequestStatus


class LeaveRequest(Base, TimestampMixin):
    __tablename__ = "leave_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employee_profiles.id", ondelete="CASCADE"), nullable=False
    )
    leave_type_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("leave_types.id", ondelete="RESTRICT"), nullable=False
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    total_days: Mapped[Decimal] = mapped_column(Numeric(4, 1), nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[LeaveRequestStatus] = mapped_column(
        Enum(LeaveRequestStatus), nullable=False, default=LeaveRequestStatus.pending
    )
    reviewed_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    review_remarks: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    employee = relationship("EmployeeProfile", back_populates="leave_requests", lazy="joined")
    leave_type = relationship("LeaveType", back_populates="requests", lazy="joined")
    reviewer = relationship("User", foreign_keys=[reviewed_by], lazy="joined")

    @property
    def leave_type_name(self) -> str:
        return self.leave_type.name if self.leave_type else ""

    @property
    def employee_name(self) -> str:
        if self.employee and self.employee.user:
            return self.employee.user.full_name
        return ""

    def __repr__(self) -> str:
        return f"<LeaveRequest id={self.id!s} employee_id={self.employee_id!s} status={self.status!r}>"
