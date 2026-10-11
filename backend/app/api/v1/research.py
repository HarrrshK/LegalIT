from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.dependencies import current_user, get_db
from app.models.core import User
from app.schemas.research import LegalSearchResponse, ResearchAnswer, ResearchQuestion
from app.services.research import ResearchAssistant, legal_search


router = APIRouter(prefix="/research", tags=["legal research"])


@router.get("/search", response_model=LegalSearchResponse)
def search(
    q: str = Query(min_length=2, max_length=500),
    jurisdiction: str | None = Query(default=None, max_length=160),
    document_type: str | None = Query(default=None, max_length=80),
    limit: int = Query(default=10, ge=1, le=50),
    _: User = Depends(current_user),
    session: Session = Depends(get_db),
):
    return LegalSearchResponse(
        query=q,
        results=legal_search(session, q, jurisdiction=jurisdiction, document_type=document_type, limit=limit),
    )


@router.post("/ask", response_model=ResearchAnswer)
async def ask(
    payload: ResearchQuestion,
    request: Request,
    _: User = Depends(current_user),
    session: Session = Depends(get_db),
):
    evidence = legal_search(
        session,
        payload.question,
        jurisdiction=payload.jurisdiction,
        document_type=payload.document_type,
        limit=request.app.state.settings.retrieval_result_count,
    )
    return await ResearchAssistant(request.app.state.settings).answer(payload.question, evidence)
