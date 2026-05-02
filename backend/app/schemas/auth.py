from pydantic import BaseModel, EmailStr, Field

from app.models.enums import UserRole


class RegisterRequest(BaseModel):
	email: EmailStr
	password: str = Field(min_length=8)
	full_name: str
	role: UserRole = UserRole.employee


class LoginRequest(BaseModel):
	email: EmailStr
	password: str


class TokenResponse(BaseModel):
	access_token: str
	token_type: str = "bearer"
	role: UserRole
	user_id: str
