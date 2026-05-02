from typing import Optional
from datetime import datetime
from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, new_uuid
from app.models.enums import PayrunStatus, PayslipStatus

class Payrun(Base, TimestampMixin):
    __tablename__ = "payruns"
    __table_args__ = {"extend_existing": True}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    period_label: Mapped[str] = mapped_column(String(20), nullable=False)
    period_start: Mapped[Date] = mapped_column(Date, nullable=False)
    period_end: Mapped[Date] = mapped_column(Date, nullable=False)
    status: Mapped[PayrunStatus] = mapped_column(Enum(PayrunStatus), nullable=False, default=PayrunStatus.draft)
    created_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    finalized_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    payslips = relationship("Payslip", back_populates="payrun")
    creator = relationship("User", foreign_keys=[created_by])

class Payslip(Base):
    __tablename__ = "payslips"
    __table_args__ = {"extend_existing": True}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    payrun_id: Mapped[str] = mapped_column(String(36), ForeignKey("payruns.id", ondelete="RESTRICT"), nullable=False)
    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employee_profiles.id", ondelete="RESTRICT"), nullable=False)
    basic_salary: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    hra: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    other_allowances: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    gross_salary: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    pf_employee: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    pf_employer: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    professional_tax: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False, default=0)
    total_deductions: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    net_pay: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    working_days: Mapped[int] = mapped_column(Integer, nullable=False)
    present_days: Mapped[int] = mapped_column(Integer, nullable=False)
    leave_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    lop_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[PayslipStatus] = mapped_column(Enum(PayslipStatus), nullable=False, default=PayslipStatus.draft)
    generated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    payrun = relationship("Payrun", back_populates="payslips")
    employee = relationship("EmployeeProfile", back_populates="payslips")