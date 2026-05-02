from fastapi import APIRouter, Depends

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.enums import UserRole
from app.schemas.dashboard import AdminDashboardStats
from app.services.dashboard_service import get_admin_dashboard_stats

router = APIRouter(
    prefix="/admin/dashboard",
    tags=["Admin - Dashboard"],
)


@router.get("/stats", response_model=AdminDashboardStats)
def get_dashboard_stats(
    db=Depends(get_db),
    user=Depends(require_roles(UserRole.admin)),
):
    """
    Get admin dashboard statistics.
    
    Aggregates data across all modules:
    - Employee counts (total, active, without salary structure)
    - Attendance today (present, absent, on leave)
    - Leave requests (pending count)
    - Last payrun (label, status, date)
    
    Requires: Admin role
    Returns: AdminDashboardStats
    """
    return get_admin_dashboard_stats(db)
