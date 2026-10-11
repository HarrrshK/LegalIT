import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import current_user, get_db, require_role
from app.models.core import Case, CaseParticipant, User, UserRole
from app.models.domain import CaseNote, CaseTask, Notification
from app.schemas.domain import (
    CaseCreate,
    CaseDecision,
    CaseResponse,
    CaseUpdate,
    ClientCaseIntake,
    IntakeDraftRequest,
    NoteCreate,
    NoteResponse,
    TaskCreate,
    TaskResponse,
)
from app.services.access import ResourceForbiddenError, ResourceNotFoundError, accessible_case, require_lawyer_case


router = APIRouter(prefix="/cases", tags=["cases"])


@router.post("/intake/draft")
def intake_draft(
    payload: IntakeDraftRequest,
    _: User = Depends(require_role(UserRole.CLIENT)),
):
    description = payload.description.strip()
    first_sentence = description.split(".", 1)[0].strip()
    title = first_sentence[:100] if len(first_sentence) >= 3 else "New legal matter"
    return {
        "draft": {
            "title": title,
            "case_type": "Civil Dispute",
            "court_name": None,
            "matter_summary": description,
        },
        "inference_used": False,
        "notice": "Review and edit this organizational draft before submitting it to a lawyer.",
    }


@router.post("/intake", response_model=CaseResponse, status_code=201)
def client_case_intake(
    payload: ClientCaseIntake,
    client: User = Depends(require_role(UserRole.CLIENT)),
    session: Session = Depends(get_db),
):
    lawyer = session.get(User, payload.lawyer_user_id)
    if lawyer is None or lawyer.role != UserRole.LAWYER:
        raise HTTPException(status_code=404, detail="Lawyer not found")
    case = Case(
        reference=f"LIT-{datetime.now(timezone.utc):%Y}-{secrets.token_hex(3).upper()}",
        title=payload.title.strip(),
        case_type=payload.case_type.strip(),
        court_name=payload.court_name,
        status="pending_review",
        matter_summary=payload.matter_summary.strip(),
        client_visible_summary=payload.matter_summary.strip(),
        created_by_user_id=client.id,
    )
    session.add(case)
    session.flush()
    session.add_all([
        CaseParticipant(case_id=case.id, user_id=lawyer.id, participant_role="lawyer"),
        CaseParticipant(case_id=case.id, user_id=client.id, participant_role="client"),
        Notification(user_id=lawyer.id, kind="case_intake", title="New case request", body=f"{client.full_name} submitted {case.title}.", link=f"/lawyer/cases/{case.id}"),
    ])
    session.commit()
    return case_response(case, client)


@router.patch("/{case_id}/decision", response_model=CaseResponse)
def decide_case(
    case_id: str,
    payload: CaseDecision,
    lawyer: User = Depends(require_role(UserRole.LAWYER)),
    session: Session = Depends(get_db),
):
    try:
        case = require_lawyer_case(session, lawyer, case_id)
    except (ResourceNotFoundError, ResourceForbiddenError) as error:
        raise HTTPException(status_code=404, detail="Case not found") from error
    if case.status != "pending_review":
        raise HTTPException(status_code=409, detail="Only pending case requests can be decided")
    if payload.decision not in {"accepted", "rejected"}:
        raise HTTPException(status_code=422, detail="Decision must be accepted or rejected")
    case.status = payload.decision
    client_id = session.scalar(select(CaseParticipant.user_id).where(CaseParticipant.case_id == case.id, CaseParticipant.participant_role == "client"))
    if client_id:
        session.add(Notification(user_id=client_id, kind="case_decision", title=f"Case request {payload.decision}", body=f"{lawyer.full_name} {payload.decision} {case.title}.", link=f"/client/cases/{case.id}"))
    session.commit()
    return case_response(case, lawyer)


def case_response(case: Case, user: User) -> CaseResponse:
    return CaseResponse(
        id=case.id,
        reference=case.reference,
        title=case.title,
        case_type=case.case_type,
        jurisdiction=case.jurisdiction,
        court_name=case.court_name,
        court_reference=case.court_reference,
        status=case.status,
        summary=case.client_visible_summary if user.role == UserRole.CLIENT else case.matter_summary,
        opened_at=case.opened_at,
        archived_at=case.archived_at,
        created_at=case.created_at,
        updated_at=case.updated_at,
    )


@router.get("", response_model=list[CaseResponse])
def list_cases(user: User = Depends(current_user), session: Session = Depends(get_db)):
    if user.role == UserRole.ADMIN:
        cases = session.scalars(select(Case).order_by(Case.updated_at.desc()))
    else:
        cases = session.scalars(
            select(Case)
            .join(CaseParticipant, CaseParticipant.case_id == Case.id)
            .where(CaseParticipant.user_id == user.id)
            .order_by(Case.updated_at.desc())
        )
    return [case_response(item, user) for item in cases]


@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def create_case(
    payload: CaseCreate,
    lawyer: User = Depends(require_role(UserRole.LAWYER)),
    session: Session = Depends(get_db),
):
    client = session.get(User, payload.client_user_id)
    if client is None or client.role != UserRole.CLIENT:
        raise HTTPException(status_code=404, detail="Client not found")
    case = Case(
        reference=f"LIT-{datetime.now(timezone.utc):%Y}-{secrets.token_hex(3).upper()}",
        title=payload.title.strip(),
        case_type=payload.case_type.strip(),
        jurisdiction=payload.jurisdiction,
        court_name=payload.court_name,
        court_reference=payload.court_reference,
        status="open",
        matter_summary=payload.matter_summary.strip(),
        client_visible_summary=(payload.client_visible_summary or payload.matter_summary).strip(),
        created_by_user_id=lawyer.id,
    )
    session.add(case)
    session.flush()
    session.add_all(
        [
            CaseParticipant(case_id=case.id, user_id=lawyer.id, participant_role="lawyer"),
            CaseParticipant(case_id=case.id, user_id=client.id, participant_role="client"),
            Notification(
                user_id=client.id,
                kind="case_linked",
                title="A case was shared with you",
                body=f"{lawyer.full_name} linked you to {case.title}.",
                link=f"/client/cases/{case.id}",
            ),
        ]
    )
    session.commit()
    return case_response(case, lawyer)


@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: str, user: User = Depends(current_user), session: Session = Depends(get_db)):
    try:
        case, _ = accessible_case(session, user, case_id)
    except ResourceNotFoundError as error:
        raise HTTPException(status_code=404, detail="Case not found") from error
    return case_response(case, user)


@router.patch("/{case_id}", response_model=CaseResponse)
def update_case(
    case_id: str,
    payload: CaseUpdate,
    lawyer: User = Depends(require_role(UserRole.LAWYER)),
    session: Session = Depends(get_db),
):
    try:
        case = require_lawyer_case(session, lawyer, case_id)
    except ResourceNotFoundError as error:
        raise HTTPException(status_code=404, detail="Case not found") from error
    except ResourceForbiddenError as error:
        raise HTTPException(status_code=403, detail="Permission denied") from error
    for name, value in payload.model_dump(exclude_unset=True).items():
        setattr(case, name, value.strip() if isinstance(value, str) else value)
    session.commit()
    return case_response(case, lawyer)


@router.post("/{case_id}/archive", response_model=CaseResponse)
def archive_case(
    case_id: str,
    lawyer: User = Depends(require_role(UserRole.LAWYER)),
    session: Session = Depends(get_db),
):
    try:
        case = require_lawyer_case(session, lawyer, case_id)
    except (ResourceNotFoundError, ResourceForbiddenError) as error:
        raise HTTPException(status_code=404, detail="Case not found") from error
    case.archived_at = datetime.now(timezone.utc)
    case.status = "archived"
    session.commit()
    return case_response(case, lawyer)


@router.get("/{case_id}/notes", response_model=list[NoteResponse])
def list_notes(case_id: str, user: User = Depends(current_user), session: Session = Depends(get_db)):
    try:
        accessible_case(session, user, case_id)
    except ResourceNotFoundError as error:
        raise HTTPException(status_code=404, detail="Case not found") from error
    statement = select(CaseNote).where(CaseNote.case_id == case_id)
    if user.role == UserRole.CLIENT:
        statement = statement.where(CaseNote.client_visible.is_(True))
    return list(session.scalars(statement.order_by(CaseNote.created_at)))


@router.post("/{case_id}/notes", response_model=NoteResponse, status_code=201)
def create_note(
    case_id: str,
    payload: NoteCreate,
    lawyer: User = Depends(require_role(UserRole.LAWYER)),
    session: Session = Depends(get_db),
):
    try:
        require_lawyer_case(session, lawyer, case_id)
    except (ResourceNotFoundError, ResourceForbiddenError) as error:
        raise HTTPException(status_code=404, detail="Case not found") from error
    note = CaseNote(case_id=case_id, author_user_id=lawyer.id, **payload.model_dump())
    session.add(note)
    session.commit()
    return note


@router.get("/{case_id}/tasks", response_model=list[TaskResponse])
def list_tasks(case_id: str, user: User = Depends(current_user), session: Session = Depends(get_db)):
    try:
        accessible_case(session, user, case_id)
    except ResourceNotFoundError as error:
        raise HTTPException(status_code=404, detail="Case not found") from error
    statement = select(CaseTask).where(CaseTask.case_id == case_id)
    if user.role == UserRole.CLIENT:
        statement = statement.where(CaseTask.client_visible.is_(True))
    return list(session.scalars(statement.order_by(CaseTask.due_at)))


@router.post("/{case_id}/tasks", response_model=TaskResponse, status_code=201)
def create_task(
    case_id: str,
    payload: TaskCreate,
    lawyer: User = Depends(require_role(UserRole.LAWYER)),
    session: Session = Depends(get_db),
):
    try:
        require_lawyer_case(session, lawyer, case_id)
    except (ResourceNotFoundError, ResourceForbiddenError) as error:
        raise HTTPException(status_code=404, detail="Case not found") from error
    task = CaseTask(case_id=case_id, **payload.model_dump())
    session.add(task)
    session.commit()
    return task


@router.post("/{case_id}/tasks/{task_id}/complete", response_model=TaskResponse)
def complete_task(
    case_id: str,
    task_id: str,
    lawyer: User = Depends(require_role(UserRole.LAWYER)),
    session: Session = Depends(get_db),
):
    try:
        require_lawyer_case(session, lawyer, case_id)
    except (ResourceNotFoundError, ResourceForbiddenError) as error:
        raise HTTPException(status_code=404, detail="Case not found") from error
    task = session.get(CaseTask, task_id)
    if task is None or task.case_id != case_id:
        raise HTTPException(status_code=404, detail="Task not found")
    task.completed_at = datetime.now(timezone.utc)
    session.commit()
    return task
