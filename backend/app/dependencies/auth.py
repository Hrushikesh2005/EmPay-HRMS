from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.models.enums import UserRole


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise _unauthorized()

    user_id = payload.get("sub")
    if not user_id:
        raise _unauthorized()

    result = db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise _unauthorized()

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    return user


get_current_active_user = get_current_user


def require_roles(*roles: UserRole):
    allowed = set(roles)

    def _checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user

    return _checker


def require_permission(module: str, action: str = "view", required_level: str = "self"):
    from app.models.permission import Permission, AccessLevel

    def _checker(
        current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
    ) -> User:
        # Admins have full access to everything
        if current_user.role == UserRole.admin:
            return current_user

        perm = (
            db.query(Permission)
            .filter(Permission.role == current_user.role.value, Permission.module == module)
            .first()
        )

        if not perm:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied"
            )

        # Check Access Level (none < self < all)
        level_map = {"none": 0, "self": 1, "all": 2}
        user_level = level_map.get(perm.access_level.value, 0)
        required_lvl = level_map.get(required_level, 1)

        if user_level < required_lvl:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient access level for {module}",
            )

        if action == "edit" and not perm.can_edit:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to edit this module",
            )
        if action == "delete" and not perm.can_delete:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete from this module",
            )

        return current_user

    return _checker


# Usage examples:
# Admin only
# current_user: User = Depends(require_roles(UserRole.admin))
# HR Officer only
# current_user: User = Depends(require_roles(UserRole.hr_officer))
# Payroll Officer only
# current_user: User = Depends(require_roles(UserRole.payroll_officer))
# HR Officer OR Admin
# current_user: User = Depends(require_roles(UserRole.hr_officer, UserRole.admin))
