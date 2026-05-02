from typing import Optional
from sqlalchemy import Date, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, new_uuid
from app.models.enums import EmploymentType

class EmployeeProfile(Base, TimestampMixin):
    __tablename__ = "employee_profiles"
    __table_args__ = {"extend_existing": True}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    employee_code: Mapped[Optional[str]] = mapped_column(String(20), unique=True, nullable=True, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    designation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    date_of_joining: Mapped[Optional[Date]] = mapped_column(Date, nullable=True)
    employment_type: Mapped[EmploymentType] = mapped_column(Enum(EmploymentType), nullable=False, default=EmploymentType.full_time)

    user = relationship("User", back_populates="profile")
    salary_structures = relationship("SalaryStructure", back_populates="employee")
    attendance_logs = relationship("AttendanceLog", back_populates="employee")
    leave_balances = relationship("LeaveBalance", back_populates="employee")
    leave_requests = relationship("LeaveRequest", back_populates="employee", foreign_keys="LeaveRequest.employee_id")
    payslips = relationship("Payslip", back_populates="employee")