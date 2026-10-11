import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def uuid_string() -> str:
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    CLIENT = "client"
    LAWYER = "lawyer"
    ADMIN = "admin"


class AccountStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    PENDING = "pending"


class VerificationStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    CHANGES_REQUESTED = "changes_requested"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    public_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(512))
    full_name: Mapped[str] = mapped_column(String(120))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, native_enum=False), index=True)
    status: Mapped[AccountStatus] = mapped_column(
        Enum(AccountStatus, native_enum=False), default=AccountStatus.ACTIVE, index=True
    )
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class ClientProfile(Base):
    __tablename__ = "client_profiles"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    phone: Mapped[str | None] = mapped_column(String(32))
    city: Mapped[str | None] = mapped_column(String(120), index=True)
    preferred_language: Mapped[str | None] = mapped_column(String(64))
    notifications_email: Mapped[bool] = mapped_column(Boolean, default=True)
    notifications_in_app: Mapped[bool] = mapped_column(Boolean, default=True)
    user: Mapped[User] = relationship()


class LawyerProfile(Base):
    __tablename__ = "lawyer_profiles"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    bar_registration: Mapped[str | None] = mapped_column(String(128), unique=True)
    city: Mapped[str | None] = mapped_column(String(120), index=True)
    years_experience: Mapped[int | None] = mapped_column(Integer)
    bio: Mapped[str | None] = mapped_column(Text)
    languages_json: Mapped[str] = mapped_column(Text, default="[]")
    practice_areas_json: Mapped[str] = mapped_column(Text, default="[]")
    accepting_consultations: Mapped[bool] = mapped_column(Boolean, default=True)
    profile_visible: Mapped[bool] = mapped_column(Boolean, default=False)
    user: Mapped[User] = relationship()


class LawyerVerification(Base):
    __tablename__ = "lawyer_verifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    lawyer_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus, native_enum=False), default=VerificationStatus.DRAFT, index=True
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reviewed_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    review_note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    reference: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(240), index=True)
    case_type: Mapped[str] = mapped_column(String(100), index=True)
    jurisdiction: Mapped[str | None] = mapped_column(String(160), index=True)
    court_name: Mapped[str | None] = mapped_column(String(240))
    court_reference: Mapped[str | None] = mapped_column(String(160), index=True)
    status: Mapped[str] = mapped_column(String(40), index=True)
    matter_summary: Mapped[str] = mapped_column(Text)
    client_visible_summary: Mapped[str | None] = mapped_column(Text)
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_by_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class CaseParticipant(Base):
    __tablename__ = "case_participants"
    __table_args__ = (
        UniqueConstraint("case_id", "user_id", "participant_role"),
        Index("ix_case_participants_user_case", "user_id", "case_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    participant_role: Mapped[str] = mapped_column(String(32))
    can_view_shared_documents: Mapped[bool] = mapped_column(Boolean, default=True)
    can_message: Mapped[bool] = mapped_column(Boolean, default=True)
    linked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    actor_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True)
    action: Mapped[str] = mapped_column(String(100), index=True)
    target_type: Mapped[str | None] = mapped_column(String(60), index=True)
    target_id: Mapped[str | None] = mapped_column(String(64), index=True)
    details_json: Mapped[str] = mapped_column(Text, default="{}")
    ip_address: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
