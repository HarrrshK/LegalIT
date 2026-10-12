from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import current_user, get_db, require_role
from app.models.core import AccountStatus, LawyerProfile, User, UserRole
from app.models.domain import ConsultationRequest, ConsultationStatus, ConsultationStatusEvent, Notification
from app.schemas.domain import ConsultationCreate, ConsultationDecision, ConsultationResponse


router = APIRouter(prefix="/consultations", tags=["consultations"])


def record_event(
    session: Session,
    consultation: ConsultationRequest,
    actor: User,
    previous: str | None,
    note: str | None = None,
) -> None:
    session.add(
        ConsultationStatusEvent(
            consultation_id=consultation.id,
            from_status=previous,
            to_status=consultation.status,
            changed_by_user_id=actor.id,
            note=note,
        )
    )


@router.get("", response_model=list[ConsultationResponse])
def list_consultations(user: User = Depends(current_user), session: Session = Depends(get_db)):
    statement = select(ConsultationRequest)
    if user.role == UserRole.CLIENT:
        statement = statement.where(ConsultationRequest.client_user_id == user.id)
    elif user.role == UserRole.LAWYER:
        statement = statement.where(ConsultationRequest.lawyer_user_id == user.id)
    elif user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Permission denied")
    return list(session.scalars(statement.order_by(ConsultationRequest.created_at.desc())))


@router.post("", response_model=ConsultationResponse, status_code=status.HTTP_201_CREATED)
def create_consultation(
    payload: ConsultationCreate,
    client: User = Depends(require_role(UserRole.CLIENT)),
    session: Session = Depends(get_db),
):
    lawyer = session.get(User, payload.lawyer_user_id)
    profile = session.get(LawyerProfile, payload.lawyer_user_id)
    if (
        lawyer is None
        or lawyer.role != UserRole.LAWYER
        or lawyer.status != AccountStatus.ACTIVE
        or profile is None
        or not profile.accepting_consultations
    ):
        raise HTTPException(status_code=404, detail="Available lawyer not found")
    now = datetime.now(timezone.utc)
    consultation = ConsultationRequest(
        client_user_id=client.id,
        lawyer_user_id=lawyer.id,
        subject=payload.subject.strip(),
        issue_description=payload.issue_description.strip(),
        status=ConsultationStatus.SUBMITTED.value,
        submitted_at=now,
    )
    session.add(consultation)
    session.flush()
    record_event(session, consultation, client, None)
    session.add(
        Notification(
            user_id=lawyer.id,
            kind="consultation_submitted",
            title="New consultation request",
            body=f"{client.full_name} requested a consultation about {consultation.subject}.",
            link=f"/lawyer/consultations/{consultation.id}",
        )
    )
    session.commit()
    return consultation


@router.patch("/{consultation_id}/decision", response_model=ConsultationResponse)
def decide_consultation(
    consultation_id: str,
    payload: ConsultationDecision,
    lawyer: User = Depends(require_role(UserRole.LAWYER)),
    session: Session = Depends(get_db),
):
    consultation = session.get(ConsultationRequest, consultation_id)
    if consultation is None or consultation.lawyer_user_id != lawyer.id:
        raise HTTPException(status_code=404, detail="Consultation not found")
    if consultation.status != ConsultationStatus.SUBMITTED.value:
        raise HTTPException(status_code=409, detail="Only submitted consultations can be decided")
    if payload.decision not in {"accepted", "declined"}:
        raise HTTPException(status_code=422, detail="Decision must be accepted or declined")
    previous = consultation.status
    consultation.status = payload.decision
    consultation.lawyer_response = payload.response.strip() if payload.response else None
    if payload.decision == "accepted" and payload.scheduled_at:
        consultation.status = ConsultationStatus.SCHEDULED.value
        consultation.scheduled_at = payload.scheduled_at
    record_event(session, consultation, lawyer, previous, consultation.lawyer_response)
    session.add(
        Notification(
            user_id=consultation.client_user_id,
            kind="consultation_decision",
            title=f"Consultation {consultation.status}",
            body=consultation.lawyer_response or f"Your consultation is now {consultation.status}.",
            link=f"/client/consultations/{consultation.id}",
        )
    )
    session.commit()
    return consultation


@router.patch("/{consultation_id}/cancel", response_model=ConsultationResponse)
def cancel_consultation(
    consultation_id: str,
    user: User = Depends(current_user),
    session: Session = Depends(get_db),
):
    consultation = session.get(ConsultationRequest, consultation_id)
    if consultation is None or user.id not in {consultation.client_user_id, consultation.lawyer_user_id}:
        raise HTTPException(status_code=404, detail="Consultation not found")
    if consultation.status not in {ConsultationStatus.SUBMITTED.value, ConsultationStatus.ACCEPTED.value, ConsultationStatus.SCHEDULED.value}:
        raise HTTPException(status_code=409, detail="Consultation cannot be cancelled")
    previous = consultation.status
    consultation.status = ConsultationStatus.CANCELLED.value
    record_event(session, consultation, user, previous)
    session.commit()
    return consultation


@router.patch("/{consultation_id}/complete", response_model=ConsultationResponse)
def complete_consultation(
    consultation_id: str,
    lawyer: User = Depends(require_role(UserRole.LAWYER)),
    session: Session = Depends(get_db),
):
    consultation = session.get(ConsultationRequest, consultation_id)
    if consultation is None or consultation.lawyer_user_id != lawyer.id:
        raise HTTPException(status_code=404, detail="Consultation not found")
    if consultation.status not in {ConsultationStatus.ACCEPTED.value, ConsultationStatus.SCHEDULED.value}:
        raise HTTPException(status_code=409, detail="Only accepted or scheduled consultations can be completed")
    previous = consultation.status
    consultation.status = ConsultationStatus.COMPLETED.value
    record_event(session, consultation, lawyer, previous)
    session.add(Notification(
        user_id=consultation.client_user_id,
        kind="consultation_completed",
        title="Consultation completed",
        body=f"Your consultation about {consultation.subject} has been marked completed.",
        link=f"/client/consultations/{consultation.id}",
    ))
    session.commit()
    return consultation
