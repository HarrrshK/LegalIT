from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LawyerDirectoryItem(BaseModel):
    user_id: str
    public_id: str
    full_name: str
    city: str | None
    years_experience: int | None
    bio: str | None
    languages: list[str]
    practice_areas: list[str]
    accepting_consultations: bool
    verified: bool


class ConsultationCreate(BaseModel):
    lawyer_user_id: str
    subject: str = Field(min_length=3, max_length=240)
    issue_description: str = Field(min_length=20, max_length=10_000)


class ConsultationDecision(BaseModel):
    decision: str
    response: str | None = Field(default=None, max_length=4_000)
    scheduled_at: datetime | None = None


class ConsultationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    client_user_id: str
    lawyer_user_id: str
    subject: str
    issue_description: str
    status: str
    lawyer_response: str | None
    scheduled_at: datetime | None
    submitted_at: datetime | None
    created_at: datetime
    updated_at: datetime


class CaseCreate(BaseModel):
    client_user_id: str
    title: str = Field(min_length=3, max_length=240)
    case_type: str = Field(min_length=2, max_length=100)
    jurisdiction: str | None = Field(default=None, max_length=160)
    court_name: str | None = Field(default=None, max_length=240)
    court_reference: str | None = Field(default=None, max_length=160)
    matter_summary: str = Field(min_length=3, max_length=20_000)
    client_visible_summary: str | None = Field(default=None, max_length=20_000)


class ClientCaseIntake(BaseModel):
    lawyer_user_id: str
    title: str = Field(min_length=3, max_length=240)
    case_type: str = Field(min_length=2, max_length=100)
    court_name: str | None = Field(default=None, max_length=240)
    matter_summary: str = Field(min_length=20, max_length=20_000)


class IntakeDraftRequest(BaseModel):
    description: str = Field(min_length=20, max_length=10_000)


class CaseDecision(BaseModel):
    decision: str


class CaseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=240)
    status: str | None = Field(default=None, max_length=40)
    jurisdiction: str | None = Field(default=None, max_length=160)
    court_name: str | None = Field(default=None, max_length=240)
    court_reference: str | None = Field(default=None, max_length=160)
    matter_summary: str | None = Field(default=None, max_length=20_000)
    client_visible_summary: str | None = Field(default=None, max_length=20_000)


class CaseResponse(BaseModel):
    id: str
    reference: str
    title: str
    case_type: str
    jurisdiction: str | None
    court_name: str | None
    court_reference: str | None
    status: str
    summary: str | None
    opened_at: datetime
    archived_at: datetime | None
    created_at: datetime
    updated_at: datetime


class NoteCreate(BaseModel):
    content: str = Field(min_length=1, max_length=20_000)
    client_visible: bool = False


class NoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    case_id: str
    author_user_id: str
    content: str
    client_visible: bool
    created_at: datetime
    updated_at: datetime


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    description: str | None = Field(default=None, max_length=5_000)
    due_at: datetime | None = None
    priority: str = Field(default="normal", pattern="^(low|normal|high|urgent)$")
    assigned_user_id: str | None = None
    client_visible: bool = False


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    case_id: str
    title: str
    description: str | None
    due_at: datetime | None
    priority: str
    assigned_user_id: str | None
    completed_at: datetime | None
    client_visible: bool
    created_at: datetime
