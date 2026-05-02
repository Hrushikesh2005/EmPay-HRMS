from typing import Optional
from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, new_uuid

class SalaryStructure(Base, TimestampMixin):
    __tablename__ = "salary_structures"
    __table_args__ = {"extend_existing": True}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employee_profiles.id", ondelete="CASCADE"), nullable=False)
    basic_salary: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    hra: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    other_allowances: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    pf_employee_pct: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=12)
    pf_employer_pct: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=12)
    professional_tax: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False, default=200)
    effective_from: Mapped[Date] = mapped_column(Date, nullable=False)
    effective_to: Mapped[Optional[Date]] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    employee = relationship("EmployeeProfile", back_populates="salary_structures")