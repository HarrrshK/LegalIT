from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import current_user, get_db, require_role
from app.models.core import User, UserRole
from app.models.domain import Appointment, ClientRecord, Message, Notification
from app.schemas.operations import (
    AppointmentCreate, AppointmentResponse, ClientRecordCreate, ClientRecordResponse,
    MessageCreate, MessageResponse, NotificationResponse,
)
from app.services.access import ResourceForbiddenError, ResourceNotFoundError, accessible_case, require_lawyer_case


router = APIRouter(tags=["operations"])


@router.get("/clients", response_model=list[ClientRecordResponse])
def list_client_records(lawyer: User = Depends(require_role(UserRole.LAWYER)), session: Session = Depends(get_db)):
    return list(session.scalars(select(ClientRecord).where(ClientRecord.lawyer_user_id == lawyer.id).order_by(ClientRecord.full_name)))


@router.post("/clients", response_model=ClientRecordResponse, status_code=201)
def create_client_record(
    payload: ClientRecordCreate,
    lawyer: User = Depends(require_role(UserRole.LAWYER)),
    session: Session = Depends(get_db),
):
    normalized = payload.email.lower() if payload.email else None
    duplicate = session.scalar(select(ClientRecord).where(ClientRecord.lawyer_user_id == lawyer.id, ClientRecord.email == normalized)) if normalized else None
    if duplicate:
        raise HTTPException(status_code=409, detail="A client record already uses that email")
    linked = session.scalar(select(User).where(User.email == normalized, User.role == UserRole.CLIENT)) if normalized else None
    record = ClientRecord(lawyer_user_id=lawyer.id, linked_user_id=linked.id if linked else None, **payload.model_dump(exclude={"email"}), email=normalized)
    session.add(record)
    session.commit()
    return record


@router.post("/clients/{record_id}/archive", response_model=ClientRecordResponse)
def archive_client_record(record_id: str, lawyer: User = Depends(require_role(UserRole.LAWYER)), session: Session = Depends(get_db)):
    record = session.get(ClientRecord, record_id)
    if record is None or record.lawyer_user_id != lawyer.id:
        raise HTTPException(status_code=404, detail="Client record not found")
    record.archived_at = datetime.now(timezone.utc)
    session.commit()
    return record


@router.get("/cases/{case_id}/messages", response_model=list[MessageResponse])
def list_messages(case_id: str, user: User = Depends(current_user), session: Session = Depends(get_db)):
    try:
        accessible_case(session, user, case_id)
    except ResourceNotFoundError as error:
        raise HTTPException(status_code=404, detail="Case not found") from error
    return list(session.scalars(select(Message).where(Message.case_id == case_id).order_by(Message.created_at)))


@router.post("/cases/{case_id}/messages", response_model=MessageResponse, status_code=201)
def create_message(case_id: str, payload: MessageCreate, user: User = Depends(current_user), session: Session = Depends(get_db)):
    try:
        _, participant = accessible_case(session, user, case_id)
    except ResourceNotFoundError as error:
        raise HTTPException(status_code=404, detail="Case not found") from error
    if participant is not None and not participant.can_message:
        raise HTTPException(status_code=403, detail="Messaging is disabled")
    message = Message(case_id=case_id, sender_user_id=user.id, body=payload.body.strip())
    session.add(message)
    session.commit()
    return message


@router.get("/appointments", response_model=list[AppointmentResponse])
def list_appointments(user: User = Depends(current_user), session: Session = Depends(get_db)):
    if user.role == UserRole.ADMIN:
        statement = select(Appointment)
    else:
        from app.models.core import CaseParticipant
        statement = select(Appointment).join(CaseParticipant, CaseParticipant.case_id == Appointment.case_id).where(CaseParticipant.user_id == user.id)
        if user.role == UserRole.CLIENT:
            statement = statement.where(Appointment.client_visible.is_(True))
    return list(session.scalars(statement.order_by(Appointment.starts_at)))


@router.post("/cases/{case_id}/appointments", response_model=AppointmentResponse, status_code=201)
def create_appointment(case_id: str, payload: AppointmentCreate, lawyer: User = Depends(require_role(UserRole.LAWYER)), session: Session = Depends(get_db)):
    try:
        require_lawyer_case(session, lawyer, case_id)
    except (ResourceNotFoundError, ResourceForbiddenError) as error:
        raise HTTPException(status_code=404, detail="Case not found") from error
    if payload.ends_at and payload.ends_at <= payload.starts_at:
        raise HTTPException(status_code=422, detail="Appointment end must be after its start")
    appointment = Appointment(case_id=case_id, created_by_user_id=lawyer.id, **payload.model_dump())
    session.add(appointment)
    session.commit()
    return appointment


@router.get("/notifications", response_model=list[NotificationResponse])
def list_notifications(user: User = Depends(current_user), session: Session = Depends(get_db)):
    return list(session.scalars(select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(200)))


@router.post("/notifications/{notification_id}/read", response_model=NotificationResponse)
def read_notification(notification_id: str, user: User = Depends(current_user), session: Session = Depends(get_db)):
    notification = session.get(Notification, notification_id)
    if notification is None or notification.user_id != user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.read_at = datetime.now(timezone.utc)
    session.commit()
    return notification
