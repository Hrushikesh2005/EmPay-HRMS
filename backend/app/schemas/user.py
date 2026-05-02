from pydantic import BaseModel

from app.models.enums import UserRole


class UserAdminOut(BaseModel):
	id: str
	full_name: str
	email: str
	role: UserRole
	is_active: bool

	class Config:
		from_attributes = True


class UserStatusUpdate(BaseModel):
	is_active: bool


class UserRoleUpdate(BaseModel):
	role: UserRole
