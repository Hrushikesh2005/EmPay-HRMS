from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin, get_current_user
from app.models.permission import Permission, AccessLevel
from app.schemas.permission import PermissionOut, PermissionUpdate, BulkPermissionUpdate
from typing import List
import uuid

router = APIRouter(prefix="/permissions", tags=["Permissions"])

@router.get("/me", response_model=List[PermissionOut])
def get_my_permissions(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(Permission).filter(Permission.role == current_user.role.value).all()

@router.get("", response_model=List[PermissionOut])
def list_all_permissions(
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    return db.query(Permission).all()

@router.patch("/{permission_id}", response_model=PermissionOut)
def update_permission(
    permission_id: str,
    data: PermissionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    permission.access_level = data.access_level
    permission.can_edit = data.can_edit
    permission.can_delete = data.can_delete
    
    db.commit()
    db.refresh(permission)
    return permission

@router.post("/bulk-update")
def bulk_update_permissions(
    data: BulkPermissionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    for item in data.items:
        perm = db.query(Permission).filter(Permission.id == item.id).first()
        if perm:
            perm.access_level = item.access_level
            perm.can_edit = item.can_edit
            perm.can_delete = item.can_delete
    db.commit()
    return {"message": "Permissions updated successfully"}

@router.post("/seed")
def seed_permissions_api(
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    # This is a one-time helper to fill defaults
    roles = ["admin", "hr_officer", "payroll_officer", "employee"]
    modules = ["dashboard", "directory", "attendance", "leave", "payroll", "reports", "settings"]
    
    existing = db.query(Permission).all()
    if existing:
        return {"message": "Permissions already exist"}

    for role in roles:
        for module in modules:
            # Defaults
            level = AccessLevel.NONE
            edit = False
            
            if role == "admin":
                level = AccessLevel.ALL
                edit = True
            elif role == "hr_officer":
                if module in ["directory", "attendance", "leave"]:
                    level = AccessLevel.ALL
                    edit = True
                elif module == "dashboard":
                    level = AccessLevel.ALL
            elif role == "payroll_officer":
                if module == "payroll":
                    level = AccessLevel.ALL
                    edit = True
                elif module in ["dashboard", "directory"]:
                    level = AccessLevel.ALL
            elif role == "employee":
                if module in ["attendance", "leave", "payroll"]:
                    level = AccessLevel.SELF
                elif module == "dashboard":
                    level = AccessLevel.ALL

            p = Permission(
                id=str(uuid.uuid4()),
                role=role,
                module=module,
                access_level=level,
                can_edit=edit
            )
            db.add(p)
    
    db.commit()
    return {"message": "Permissions seeded successfully"}
