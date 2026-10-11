import json

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import current_user, get_db
from app.models.core import User
from app.models.domain import LegalNews


router = APIRouter(prefix="/news", tags=["legal news"])


@router.get("")
def list_news(
    jurisdiction: str | None = Query(default=None, max_length=160),
    _: User = Depends(current_user),
    session: Session = Depends(get_db),
):
    statement = select(LegalNews)
    if jurisdiction:
        statement = statement.where(LegalNews.jurisdiction.ilike(jurisdiction))
    return [
        {
            "id": item.id, "headline": item.headline, "source_name": item.source_name,
            "source_url": item.source_url, "summary": item.summary, "jurisdiction": item.jurisdiction,
            "practice_areas": json.loads(item.practice_areas_json), "published_at": item.published_at,
            "retrieved_at": item.retrieved_at,
        }
        for item in session.scalars(statement.order_by(LegalNews.published_at.desc()).limit(200))
    ]
