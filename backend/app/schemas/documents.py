from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    case_id: str
    uploaded_by_user_id: str
    original_filename: str
    content_type: str
    size_bytes: int
    sha256: str
    category: str | None
    description: str | None
    client_visible: bool
    extraction_status: str
    created_at: datetime


class DocumentSharingUpdate(BaseModel):
    client_visible: bool
