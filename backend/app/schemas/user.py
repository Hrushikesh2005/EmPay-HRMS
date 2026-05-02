from pydantic import BaseModel, EmailStr

from app.models.enums import UserRole


class UserAdminOut(BaseModel):
	id: str
	full_name: str
	email: EmailStr
	role: UserRole
	is_active: bool

	class Config:
		from_attributes = True


class UserStatusUpdate(BaseModel):
	is_active: bool
