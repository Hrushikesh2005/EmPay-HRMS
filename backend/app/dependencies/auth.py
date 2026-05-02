from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise _unauthorized()

    user_id = payload.get("sub")
    if not user_id:
        raise _unauthorized()

    result = await db.execute(select(User).where(User.id == user_id))
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

    async def _checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
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
