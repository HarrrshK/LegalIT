from datetime import datetime

from pydantic import BaseModel, Field


class LegalSearchResult(BaseModel):
    id: str
    title: str
    document_type: str
    jurisdiction: str | None
    authority: str | None
    act_identifier: str | None
    section_identifier: str | None
    publication_date: datetime | None
    source_name: str
    source_url: str
    excerpt: str
    score: float
    last_verified_at: datetime | None


class LegalSearchResponse(BaseModel):
    query: str
    results: list[LegalSearchResult]


class ResearchQuestion(BaseModel):
    question: str = Field(min_length=5, max_length=6_000)
    jurisdiction: str | None = Field(default="India", max_length=160)
    document_type: str | None = Field(default=None, max_length=80)


class ResearchCitation(BaseModel):
    source_id: str
    title: str
    excerpt: str
    source_url: str


class ResearchAnswer(BaseModel):
    answer: str
    citations: list[ResearchCitation]
    inference_used: bool
    insufficient_evidence: bool
    notice: str = "Legal information only. This does not replace advice from a qualified advocate."


class LegalSourceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    base_url: str = Field(min_length=8, max_length=500)
    authority_level: int = Field(default=50, ge=0, le=100)
    retrieval_method: str = Field(default="manual", pattern="^(manual|api|bulk)$")
    terms_note: str | None = Field(default=None, max_length=5_000)
