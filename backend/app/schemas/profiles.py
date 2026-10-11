from pydantic import BaseModel, ConfigDict, Field

from app.models.core import AccountStatus, UserRole


class ClientProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=32)
    city: str | None = Field(default=None, max_length=120)
    preferred_language: str | None = Field(default=None, max_length=64)
    notifications_email: bool | None = None
    notifications_in_app: bool | None = None


class LawyerProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    bar_registration: str | None = Field(default=None, max_length=128)
    city: str | None = Field(default=None, max_length=120)
    years_experience: int | None = Field(default=None, ge=0, le=80)
    bio: str | None = Field(default=None, max_length=5_000)
    languages: list[str] | None = Field(default=None, max_length=20)
    practice_areas: list[str] | None = Field(default=None, max_length=30)
    accepting_consultations: bool | None = None


class ProfileResponse(BaseModel):
    user_id: str
    public_id: str
    role: UserRole
    full_name: str
    email: str
    fields: dict


class AdminUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    public_id: str
    full_name: str
    email: str
    role: UserRole
    status: AccountStatus
    email_verified: bool


class AccountStatusUpdate(BaseModel):
    status: AccountStatus


class AdminUserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=3, max_length=320)
    role: UserRole


class IssuedAccountResponse(BaseModel):
    user: AdminUserResponse
    temporary_password: str


class AdminCaseCreate(BaseModel):
    client_user_id: str
    lawyer_user_id: str
    title: str = Field(min_length=3, max_length=240)
    case_type: str = Field(min_length=2, max_length=100)
    court_reference: str | None = Field(default=None, max_length=160)
    court_name: str | None = Field(default=None, max_length=240)
    matter_summary: str = Field(min_length=3, max_length=20_000)
