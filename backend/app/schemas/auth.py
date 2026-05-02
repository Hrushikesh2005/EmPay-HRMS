from pydantic import BaseModel, EmailStr, Field
from app.models.enums import UserRole


class RegisterRequest(BaseModel):
	email: EmailStr
	password: str = Field(min_length=8)
	full_name: str
	role: UserRole = UserRole.employee


class LoginResponse(BaseModel):
	access_token: str
	refresh_token: str
	token_type: str = "bearer"


class RefreshRequest(BaseModel):
	refresh_token: str


class UserOut(BaseModel):
	id: str
	full_name: str
	email: EmailStr
	role: UserRole
	is_active: bool

	class Config:
		from_attributes = True
