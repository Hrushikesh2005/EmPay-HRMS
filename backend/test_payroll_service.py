import pytest
from decimal import Decimal
from datetime import date

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base
from app.models.user import User
from app.models.employee import EmployeeProfile
from app.models.salary import SalaryStructure
from app.models.attendance import AttendanceLog
from app.models.leave_type import LeaveType
from app.models.leave_request import LeaveRequest
from app.models.enums import UserRole, AttendanceStatus, LeaveRequestStatus
from app.services.payroll_service import calculate_payslip, count_working_days_in_period

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db():
    # Create all tables in the test database
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    # 1. Create Mock Employees
    user_a = User(email="empa@test.com", hashed_password="pw", full_name="Employee A", role=UserRole.employee, is_active=True)
    user_b = User(email="empb@test.com", hashed_password="pw", full_name="Employee B", role=UserRole.employee, is_active=True)
    session.add(user_a)
    session.add(user_b)
    session.commit()
    
    emp_a = EmployeeProfile(user_id=user_a.id)
    emp_b = EmployeeProfile(user_id=user_b.id)
    session.add(emp_a)
    session.add(emp_b)
    session.commit()
    
    # 2. Salary Structures
    # Employee A: Basic: 30000, HRA: 15000, Other: 5000. PT: 200. PF: 12%
    sal_a = SalaryStructure(
        employee_id=emp_a.id,
        basic_salary=30000,
        hra=15000,
        other_allowances=5000,
        pf_employee_pct=12.0,
        pf_employer_pct=12.0,
        professional_tax=200,
        effective_from=date(2026, 1, 1),
        is_active=True
    )
    # Employee B: Basic: 40000, HRA: 20000, Other: 6000. PT: 200. PF: 12%
    sal_b = SalaryStructure(
        employee_id=emp_b.id,
        basic_salary=40000,
        hra=20000,
        other_allowances=6000,
        pf_employee_pct=12.0,
        pf_employer_pct=12.0,
        professional_tax=200,
        effective_from=date(2026, 1, 1),
        is_active=True
    )
    session.add(sal_a)
    session.add(sal_b)
    session.commit()
    
    # 3. Attendance Logs
    # Emulate 21 days present for A
    for i in range(1, 32):
        d = date(2026, 5, i)
        if d.weekday() < 5:  # Mon-Fri
            session.add(AttendanceLog(employee_id=emp_a.id, work_date=d, status=AttendanceStatus.present))
            
    # For B: 17 days present. (Out of 21 working days, 4 are leaves. So 17 present)
    present_days_added = 0
    for i in range(1, 32):
        d = date(2026, 5, i)
        if d.weekday() < 5 and present_days_added < 17:
            session.add(AttendanceLog(employee_id=emp_b.id, work_date=d, status=AttendanceStatus.present))
            present_days_added += 1
            
    # 4. Leave Types & Requests
    paid_type = LeaveType(name="Paid", is_paid=True, default_days_per_year=12)
    unpaid_type = LeaveType(name="Unpaid", is_paid=False, default_days_per_year=30)
    session.add(paid_type)
    session.add(unpaid_type)
    session.commit()
    
    # Employee B: 1 Paid Leave, 3 Unpaid Leaves
    # Let's say Paid leave is May 25 (Monday)
    session.add(LeaveRequest(
        employee_id=emp_b.id,
        leave_type_id=paid_type.id,
        start_date=date(2026, 5, 25),
        end_date=date(2026, 5, 25),
        total_days=1,
        status=LeaveRequestStatus.approved
    ))
    
    # Unpaid Leaves spanning weekend: Thursday May 14 to Tuesday May 19
    # Working days: 14 (Thu), 15 (Fri), 18 (Mon), 19 (Tue) -> 4 days overlap total
    # Wait, user said 3 unpaid leaves spanning over weekend, e.g. Thursday to Monday (14, 15, 18).
    session.add(LeaveRequest(
        employee_id=emp_b.id,
        leave_type_id=unpaid_type.id,
        start_date=date(2026, 5, 14),
        end_date=date(2026, 5, 18),
        total_days=3,
        status=LeaveRequestStatus.approved
    ))
    session.commit()
    
    yield session
    
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_payrun_generation(db):
    period_start = date(2026, 5, 1)
    period_end = date(2026, 5, 31)
    
    # 1. Assert Working Days
    working_days = count_working_days_in_period(period_start, period_end)
    assert working_days == 21, f"Expected 21 working days, got {working_days}"
    
    # Fetch Employees
    emp_a = db.query(EmployeeProfile).join(User).filter(User.full_name == "Employee A").first()
    emp_b = db.query(EmployeeProfile).join(User).filter(User.full_name == "Employee B").first()
    
    # 2. Assert Employee A
    payslip_a = calculate_payslip(db, emp_a.id, period_start, period_end, working_days)
    assert payslip_a["lop_days"] == Decimal("0.0")
    assert payslip_a["pf_employee"] == Decimal("3600.00")
    assert payslip_a["net_pay"] == Decimal("46200.00")
    
    # 3. Assert Employee B
    payslip_b = calculate_payslip(db, emp_b.id, period_start, period_end, working_days)
    
    # User's expected values with slight rounding drift allowed
    expected_daily_rate = Decimal("3142.86")
    assert payslip_b["daily_rate"] == expected_daily_rate, f"Got daily_rate: {payslip_b['daily_rate']}"
    
    expected_lop_days = Decimal("3.0")
    assert payslip_b["lop_days"] == expected_lop_days, f"Got lop_days: {payslip_b['lop_days']}"
    
    expected_lop_deduction = Decimal("9428.58")
    actual_lop_deduction = payslip_b["total_deductions"] - payslip_b["pf_employee"] - payslip_b["professional_tax"]
    assert actual_lop_deduction == expected_lop_deduction, f"Got lop deduction: {actual_lop_deduction}"
    
    assert payslip_b["pf_employee"] == Decimal("4800.00")
    
    expected_net_pay = Decimal("51571.42")
    assert payslip_b["net_pay"] == expected_net_pay, f"Got net_pay: {payslip_b['net_pay']}"
