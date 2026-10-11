from datetime import datetime, timezone

from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlalchemy import text


router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    database: str
    timestamp: datetime


@router.get("/health", response_model=HealthResponse)
def health(request: Request) -> HealthResponse:
    database = "ok"
    status = "ok"
    try:
        with request.app.state.session_factory() as session:
            session.execute(text("SELECT 1"))
    except Exception:
        database = "unavailable"
        status = "degraded"
    return HealthResponse(status=status, database=database, timestamp=datetime.now(timezone.utc))
