from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_role
from app.models.core import AuditLog, Case, CaseParticipant, User, UserRole
from app.models.domain import ConsultationRequest, IngestionJob, LegalSource
from app.schemas.profiles import AccountStatusUpdate, AdminCaseCreate, AdminUserCreate, AdminUserResponse, IssuedAccountResponse
from app.services.audit import add_audit
from app.services.auth import AuthService, DuplicateEmailError
from app.core.security import hash_password
import secrets
import string
from datetime import datetime, timezone
from app.schemas.research import LegalSourceCreate


router = APIRouter(prefix="/admin", tags=["administration"])


@router.get("/legal-sources")
def legal_sources(_: User = Depends(require_role(UserRole.ADMIN)), session: Session = Depends(get_db)):
    return list(session.scalars(select(LegalSource).order_by(LegalSource.name)))


@router.post("/legal-sources", status_code=201)
def create_legal_source(payload: LegalSourceCreate, admin: User = Depends(require_role(UserRole.ADMIN)), session: Session = Depends(get_db)):
    if session.scalar(select(LegalSource).where(LegalSource.name == payload.name.strip())):
        raise HTTPException(status_code=409, detail="A legal source already uses that name")
    source = LegalSource(**payload.model_dump())
    session.add(source)
    session.flush()
    add_audit(session, action="legal_source_created", actor_user_id=admin.id, target_type="legal_source", target_id=source.id)
    session.commit()
    return source


@router.get("/ingestion-jobs")
def ingestion_jobs(_: User = Depends(require_role(UserRole.ADMIN)), session: Session = Depends(get_db)):
    return list(session.scalars(select(IngestionJob).order_by(IngestionJob.started_at.desc()).limit(200)))


@router.post("/cases", status_code=201)
def create_case(
    payload: AdminCaseCreate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    session: Session = Depends(get_db),
):
    client = session.get(User, payload.client_user_id)
    lawyer = session.get(User, payload.lawyer_user_id)
    if client is None or client.role != UserRole.CLIENT or lawyer is None or lawyer.role != UserRole.LAWYER:
        raise HTTPException(status_code=404, detail="Client or lawyer account not found")
    case = Case(
        reference=f"LIT-{datetime.now(timezone.utc):%Y}-{secrets.token_hex(3).upper()}",
        title=payload.title.strip(),
        case_type=payload.case_type.strip(),
        court_reference=payload.court_reference,
        court_name=payload.court_name,
        status="open",
        matter_summary=payload.matter_summary.strip(),
        client_visible_summary=payload.matter_summary.strip(),
        created_by_user_id=admin.id,
    )
    session.add(case)
    session.flush()
    session.add_all([
        CaseParticipant(case_id=case.id, user_id=lawyer.id, participant_role="lawyer"),
        CaseParticipant(case_id=case.id, user_id=client.id, participant_role="client"),
    ])
    add_audit(session, action="case_created", actor_user_id=admin.id, target_type="case", target_id=case.id)
    session.commit()
    return {"case_id": case.id}


@router.post("/users", response_model=IssuedAccountResponse, status_code=201)
def create_user(
    payload: AdminUserCreate,
    request: Request,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    session: Session = Depends(get_db),
):
    if payload.role not in {UserRole.CLIENT, UserRole.LAWYER}:
        raise HTTPException(status_code=422, detail="Administrators may issue only client or lawyer accounts")
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    password = "".join(secrets.choice(alphabet) for _ in range(20))
    try:
        user = AuthService(session, request.app.state.settings).register(
            email=payload.email,
            password=password,
            full_name=payload.full_name,
            role=payload.role,
        )
    except DuplicateEmailError as error:
        raise HTTPException(status_code=409, detail="An account already uses that email") from error
    user.must_change_password = True
    add_audit(session, action="account_created", actor_user_id=admin.id, target_type="user", target_id=user.id)
    session.commit()
    return IssuedAccountResponse(user=AdminUserResponse.model_validate(user), temporary_password=password)


@router.get("/dashboard")
def dashboard(_: User = Depends(require_role(UserRole.ADMIN)), session: Session = Depends(get_db)):
    def count(model):
        return session.scalar(select(func.count()).select_from(model)) or 0
    return {
        "users": count(User),
        "clients": session.scalar(select(func.count()).select_from(User).where(User.role == UserRole.CLIENT)) or 0,
        "lawyers": session.scalar(select(func.count()).select_from(User).where(User.role == UserRole.LAWYER)) or 0,
        "cases": count(Case),
        "consultations": count(ConsultationRequest),
        "ingestion_jobs": count(IngestionJob),
    }


@router.get("/users", response_model=list[AdminUserResponse])
def list_users(_: User = Depends(require_role(UserRole.ADMIN)), session: Session = Depends(get_db)):
    return list(session.scalars(select(User).order_by(User.created_at.desc()).limit(500)))


@router.patch("/users/{user_id}/status", response_model=AdminUserResponse)
def update_user_status(
    user_id: str,
    payload: AccountStatusUpdate,
    request: Request,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    session: Session = Depends(get_db),
):
    target = session.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == admin.id:
        raise HTTPException(status_code=409, detail="Administrators cannot change their own status")
    previous = target.status
    target.status = payload.status
    add_audit(
        session,
        action="account_status_changed",
        actor_user_id=admin.id,
        target_type="user",
        target_id=target.id,
        details={"from": previous.value, "to": payload.status.value},
        ip_address=request.client.host if request.client else None,
    )
    session.commit()
    return target


@router.get("/audit")
def audit_log(_: User = Depends(require_role(UserRole.ADMIN)), session: Session = Depends(get_db)):
    entries = session.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(500))
    return [
        {
            "id": item.id,
            "actor_user_id": item.actor_user_id,
            "action": item.action,
            "target_type": item.target_type,
            "target_id": item.target_id,
            "details_json": item.details_json,
            "ip_address": item.ip_address,
            "created_at": item.created_at,
        }
        for item in entries
    ]
