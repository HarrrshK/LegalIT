import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.core import utcnow, uuid_string


class ConsultationStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ClientRecord(Base):
    __tablename__ = "client_records"
    __table_args__ = (Index("ix_client_records_lawyer_name", "lawyer_user_id", "full_name"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    lawyer_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    linked_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str | None] = mapped_column(String(320), index=True)
    phone: Mapped[str | None] = mapped_column(String(32))
    city: Mapped[str | None] = mapped_column(String(120))
    professional_notes: Mapped[str | None] = mapped_column(Text)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class ConsultationRequest(Base):
    __tablename__ = "consultation_requests"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    client_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    lawyer_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    subject: Mapped[str] = mapped_column(String(240))
    issue_description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default=ConsultationStatus.DRAFT.value, index=True)
    lawyer_response: Mapped[str | None] = mapped_column(Text)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class ConsultationStatusEvent(Base):
    __tablename__ = "consultation_status_events"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    consultation_id: Mapped[str] = mapped_column(ForeignKey("consultation_requests.id", ondelete="CASCADE"), index=True)
    from_status: Mapped[str | None] = mapped_column(String(32))
    to_status: Mapped[str] = mapped_column(String(32))
    changed_by_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class CaseNote(Base):
    __tablename__ = "case_notes"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    author_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    content: Mapped[str] = mapped_column(Text)
    client_visible: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class CaseTask(Base):
    __tablename__ = "case_tasks"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(240))
    description: Mapped[str | None] = mapped_column(Text)
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    priority: Mapped[str] = mapped_column(String(20), default="normal")
    assigned_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    client_visible: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Appointment(Base):
    __tablename__ = "appointments"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    case_id: Mapped[str | None] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    consultation_id: Mapped[str | None] = mapped_column(ForeignKey("consultation_requests.id", ondelete="CASCADE"), index=True)
    created_by_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    title: Mapped[str] = mapped_column(String(240))
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    location: Mapped[str | None] = mapped_column(String(240))
    client_visible: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class CaseDocument(Base):
    __tablename__ = "case_documents"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    uploaded_by_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    storage_key: Mapped[str] = mapped_column(String(200), unique=True)
    original_filename: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(100))
    size_bytes: Mapped[int] = mapped_column(Integer)
    sha256: Mapped[str] = mapped_column(String(64), index=True)
    category: Mapped[str | None] = mapped_column(String(100), index=True)
    description: Mapped[str | None] = mapped_column(Text)
    client_visible: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    extraction_status: Mapped[str] = mapped_column(String(32), default="pending", index=True)
    extracted_text: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Message(Base):
    __tablename__ = "messages"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    sender_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(80), index=True)
    title: Mapped[str] = mapped_column(String(240))
    body: Mapped[str] = mapped_column(Text)
    link: Mapped[str | None] = mapped_column(String(500))
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)


class LegalSource(Base):
    __tablename__ = "legal_sources"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    name: Mapped[str] = mapped_column(String(200), unique=True)
    base_url: Mapped[str] = mapped_column(String(500))
    authority_level: Mapped[int] = mapped_column(Integer, default=50)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    retrieval_method: Mapped[str] = mapped_column(String(40), default="manual")
    terms_note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class LegalDocument(Base):
    __tablename__ = "legal_documents"
    __table_args__ = (UniqueConstraint("source_id", "external_id"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    source_id: Mapped[str] = mapped_column(ForeignKey("legal_sources.id", ondelete="RESTRICT"), index=True)
    external_id: Mapped[str] = mapped_column(String(200))
    title: Mapped[str] = mapped_column(String(500), index=True)
    document_type: Mapped[str] = mapped_column(String(80), index=True)
    jurisdiction: Mapped[str | None] = mapped_column(String(160), index=True)
    authority: Mapped[str | None] = mapped_column(String(240), index=True)
    act_identifier: Mapped[str | None] = mapped_column(String(200), index=True)
    section_identifier: Mapped[str | None] = mapped_column(String(100), index=True)
    publication_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    source_url: Mapped[str] = mapped_column(String(1000))
    content: Mapped[str] = mapped_column(Text)
    content_hash: Mapped[str] = mapped_column(String(64), index=True)
    retrieved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    processing_status: Mapped[str] = mapped_column(String(32), default="indexed", index=True)


class LegalNews(Base):
    __tablename__ = "legal_news"
    __table_args__ = (UniqueConstraint("source_url"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    headline: Mapped[str] = mapped_column(String(500))
    source_name: Mapped[str] = mapped_column(String(200))
    source_url: Mapped[str] = mapped_column(String(1000))
    summary: Mapped[str | None] = mapped_column(Text)
    jurisdiction: Mapped[str | None] = mapped_column(String(160), index=True)
    practice_areas_json: Mapped[str] = mapped_column(Text, default="[]")
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    retrieved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class SavedLegalReference(Base):
    __tablename__ = "saved_legal_references"
    __table_args__ = (UniqueConstraint("user_id", "legal_document_id", "case_id"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    legal_document_id: Mapped[str] = mapped_column(ForeignKey("legal_documents.id", ondelete="CASCADE"), index=True)
    case_id: Mapped[str | None] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AiConversation(Base):
    __tablename__ = "ai_conversations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str | None] = mapped_column(String(240))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AiMessage(Base):
    __tablename__ = "ai_messages"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("ai_conversations.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AiCitation(Base):
    __tablename__ = "ai_citations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    ai_message_id: Mapped[str] = mapped_column(ForeignKey("ai_messages.id", ondelete="CASCADE"), index=True)
    legal_document_id: Mapped[str] = mapped_column(ForeignKey("legal_documents.id", ondelete="RESTRICT"), index=True)
    excerpt: Mapped[str] = mapped_column(Text)
    rank: Mapped[int] = mapped_column(Integer)


class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    source_id: Mapped[str | None] = mapped_column(ForeignKey("legal_sources.id", ondelete="SET NULL"), index=True)
    status: Mapped[str] = mapped_column(String(32), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    records_processed: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[str | None] = mapped_column(Text)
