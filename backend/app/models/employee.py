from typing import Optional
from datetime import date
from sqlalchemy import Date, Enum, ForeignKey, String, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, new_uuid
from app.models.enums import EmploymentType

class EmployeeProfile(Base, TimestampMixin):
    __tablename__ = "employee_profiles"
    __table_args__ = {"extend_existing": True}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    employee_code: Mapped[Optional[str]] = mapped_column(String(20), unique=True, nullable=True, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Replaced department string with relationship
    department_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    
    designation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    date_of_joining: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    employment_type: Mapped[EmploymentType] = mapped_column(Enum(EmploymentType), nullable=False, default=EmploymentType.full_time)

    # Private Info
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    residing_address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    nationality: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    personal_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    marital_status: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Salary / Bank Info
    pan_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    uan_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    bank_details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    user = relationship("User", back_populates="profile")
    department_rel = relationship("Department", back_populates="employees")
    salary_structures = relationship("SalaryStructure", back_populates="employee")
    attendance_logs = relationship("AttendanceLog", back_populates="employee")
    leave_balances = relationship("LeaveBalance", back_populates="employee")
    leave_requests = relationship("LeaveRequest", back_populates="employee", foreign_keys="LeaveRequest.employee_id")
    payslips = relationship("Payslip", back_populates="employee")