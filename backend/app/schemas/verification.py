from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.core import VerificationStatus


class LawyerVerificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    lawyer_user_id: str
    status: VerificationStatus
    submitted_at: datetime | None
    reviewed_at: datetime | None
    reviewed_by_user_id: str | None
    review_note: str | None
    created_at: datetime


class VerificationReviewRequest(BaseModel):
    decision: Literal["approved", "rejected", "changes_requested"]
    note: str | None = Field(default=None, max_length=2_000)
