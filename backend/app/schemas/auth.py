from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.core import AccountStatus, UserRole


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=12, max_length=256)
    role: Literal[UserRole.CLIENT, UserRole.LAWYER]


class LoginRequest(BaseModel):
    login: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=256)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    public_id: str
    full_name: str
    email: str
    role: UserRole
    status: AccountStatus
    email_verified: bool
    must_change_password: bool


class AuthResponse(BaseModel):
    user: UserResponse


class PasswordChangeRequest(BaseModel):
    password: str = Field(min_length=12, max_length=256)
