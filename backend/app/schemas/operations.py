from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ClientRecordCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=32)
    city: str | None = Field(default=None, max_length=120)
    professional_notes: str | None = Field(default=None, max_length=10_000)


class ClientRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    lawyer_user_id: str
    linked_user_id: str | None
    full_name: str
    email: str | None
    phone: str | None
    city: str | None
    professional_notes: str | None
    archived_at: datetime | None
    created_at: datetime


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=10_000)


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    case_id: str
    sender_user_id: str
    body: str
    created_at: datetime


class AppointmentCreate(BaseModel):
    title: str = Field(min_length=2, max_length=240)
    starts_at: datetime
    ends_at: datetime | None = None
    location: str | None = Field(default=None, max_length=240)
    client_visible: bool = True


class AppointmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    case_id: str | None
    consultation_id: str | None
    created_by_user_id: str
    title: str
    starts_at: datetime
    ends_at: datetime | None
    location: str | None
    client_visible: bool


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    kind: str
    title: str
    body: str
    link: str | None
    read_at: datetime | None
    created_at: datetime
