"""Admin payroll API routes.

Handles payrun creation, processing, and payslip retrieval.
All endpoints are sync (no async/await).
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import require_roles, require_permission
from app.models.enums import UserRole, PayrunStatus
from app.models.user import User
from app.models.payroll import Payrun, Payslip
from app.models.employee import EmployeeProfile
from app.schemas.payrun import PayrunCreate, PayrunResponse
from app.schemas.payslip import PayslipResponse
from app.services.payroll_service import process_payrun
from app.core.exceptions import AppException

router = APIRouter(prefix="/admin/payroll", tags=["Admin - Payroll"])


@router.post("/payruns", response_model=PayrunResponse, status_code=status.HTTP_201_CREATED)
def create_payrun(
    data: PayrunCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("payroll", "edit", "all")),
) -> PayrunResponse:
    """Create a new payrun in draft status.

    Body:
        - period_label: str (e.g., "May 2026")
        - period_start: date
        - period_end: date (must be > period_start)

    Returns:
        Created PayrunResponse with status="draft"
    """
    payrun = Payrun(
        period_label=data.period_label,
        period_start=data.period_start,
        period_end=data.period_end,
        status=PayrunStatus.draft,
        created_by=current_user.id,
    )
    db.add(payrun)
    db.commit()
    db.refresh(payrun)
    return payrun


@router.get("/payruns", response_model=list[PayrunResponse])
def list_payruns(
    status: str | None = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("payroll", "view", "all")),
) -> list[PayrunResponse]:
    """Get all payruns with optional status filter.

    Query params:
        - status: Optional status filter (draft, processing, finalized, paid)

    Returns:
        List of PayrunResponse
    """
    stmt = select(Payrun)
    if status:
        stmt = stmt.where(Payrun.status == status)
    stmt = stmt.order_by(Payrun.created_at.desc())
    payruns = db.execute(stmt).scalars().all()
    return payruns


@router.get("/payruns/{payrun_id}", response_model=PayrunResponse)
def get_payrun(
    payrun_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("payroll", "view", "all")),
) -> PayrunResponse:
    """Get a specific payrun by ID.

    Returns:
        PayrunResponse
    """
    payrun = db.execute(
        select(Payrun).where(Payrun.id == payrun_id)
    ).scalar_one_or_none()

    if not payrun:
        raise AppException(404, "Payrun not found")

    return payrun


@router.post("/payruns/{payrun_id}/process", response_model=PayrunResponse)
def process_payrun_route(
    payrun_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("payroll", "edit", "all")),
) -> PayrunResponse:
    """Process a payrun: generate payslips for all active employees.

    This endpoint:
    - Changes payrun status from "draft" to "processing"
    - Gets all active employees
    - Generates a payslip for each employee
    - Skips employees without active salary structure
    - Finalizes payrun with status="finalized"
    - Sets finalized_at timestamp

    Returns:
        PayrunResponse with status="finalized"
    """
    payrun = process_payrun(db, payrun_id)
    return payrun


@router.get("/payruns/{payrun_id}/payslips", response_model=list[PayslipResponse])
def list_payslips_for_payrun(
    payrun_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("payroll", "view", "all")),
) -> list[PayslipResponse]:
    """Get all payslips for a specific payrun.

    Returns:
        List of PayslipResponse for the payrun
    """
    payrun = db.execute(
        select(Payrun).where(Payrun.id == payrun_id)
    ).scalar_one_or_none()

    if not payrun:
        raise AppException(404, "Payrun not found")

    stmt = select(Payslip).where(Payslip.payrun_id == payrun_id)
    payslips = db.execute(stmt).scalars().all()

    # Enrich payslips with employee_name
    result = []
    for payslip in payslips:
        # Employee name is stored as a property, but we need it from the relationship
        employee = db.execute(
            select(EmployeeProfile).where(EmployeeProfile.id == payslip.employee_id)
        ).scalar_one_or_none()

        payslip_dict = {
            "id": payslip.id,
            "payrun_id": payslip.payrun_id,
            "employee_id": payslip.employee_id,
            "employee_name": employee.user.full_name if employee and employee.user else "",
            "employee_code": employee.employee_code if employee else None,
            "department": employee.department_rel.name if employee and employee.department_rel else None,
            "designation": employee.designation if employee else None,
            "date_of_joining": employee.date_of_joining if employee else None,
            "pan_number": employee.pan_number if employee else None,
            "uan_number": employee.uan_number if employee else None,
            "bank_details": employee.bank_details if employee else None,
            "pay_period": payrun.period_label if payrun else None,
            "pay_date": payrun.created_at if payrun else None,
            "basic_salary": payslip.basic_salary,
            "hra": payslip.hra,
            "other_allowances": payslip.other_allowances,
            "gross_salary": payslip.gross_salary,
            "pf_employee": payslip.pf_employee,
            "pf_employer": payslip.pf_employer,
            "professional_tax": payslip.professional_tax,
            "total_deductions": payslip.total_deductions,
            "net_pay": payslip.net_pay,
            "working_days": payslip.working_days,
            "present_days": payslip.present_days,
            "leave_days": payslip.leave_days,
            "lop_days": payslip.lop_days,
            "status": payslip.status.value,
            "generated_at": payslip.generated_at,
        }
        result.append(PayslipResponse(**payslip_dict))

    return result


@router.get("/payslips/{payslip_id}", response_model=PayslipResponse)
def get_payslip(
    payslip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("payroll", "view", "all")),
) -> PayslipResponse:
    """Get a specific payslip by ID.

    Returns:
        PayslipResponse
    """
    payslip = db.execute(
        select(Payslip).where(Payslip.id == payslip_id)
    ).scalar_one_or_none()

    if not payslip:
        raise AppException(404, "Payslip not found")

    # Get employee name
    employee = db.execute(
        select(EmployeeProfile).where(EmployeeProfile.id == payslip.employee_id)
    ).scalar_one_or_none()

    # Get payrun for extra info
    payrun = db.execute(
        select(Payrun).where(Payrun.id == payslip.payrun_id)
    ).scalar_one_or_none()

    # Create a dict to serialize
    payslip_dict = {
        "id": payslip.id,
        "payrun_id": payslip.payrun_id,
        "employee_id": payslip.employee_id,
        "employee_name": employee.user.full_name if employee and employee.user else "",
        "employee_code": employee.employee_code if employee else None,
        "department": employee.department_rel.name if employee and employee.department_rel else None,
        "designation": employee.designation if employee else None,
        "date_of_joining": employee.date_of_joining if employee else None,
        "pan_number": employee.pan_number if employee else None,
        "uan_number": employee.uan_number if employee else None,
        "bank_details": employee.bank_details if employee else None,
        "pay_period": payrun.period_label if payrun else None,
        "pay_date": payrun.created_at if payrun else None,
        "basic_salary": payslip.basic_salary,
        "hra": payslip.hra,
        "other_allowances": payslip.other_allowances,
        "gross_salary": payslip.gross_salary,
        "pf_employee": payslip.pf_employee,
        "pf_employer": payslip.pf_employer,
        "professional_tax": payslip.professional_tax,
        "total_deductions": payslip.total_deductions,
        "net_pay": payslip.net_pay,
        "working_days": payslip.working_days,
        "present_days": payslip.present_days,
        "leave_days": payslip.leave_days,
        "lop_days": payslip.lop_days,
        "status": payslip.status.value,
        "generated_at": payslip.generated_at,
    }

    return PayslipResponse(**payslip_dict)
