from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.core import Case, CaseParticipant, User, UserRole


class ResourceNotFoundError(Exception):
    pass


class ResourceForbiddenError(Exception):
    pass


def accessible_case(session: Session, user: User, case_id: str) -> tuple[Case, CaseParticipant | None]:
    case = session.get(Case, case_id)
    if case is None:
        raise ResourceNotFoundError
    if user.role == UserRole.ADMIN:
        return case, None
    participant = session.scalar(
        select(CaseParticipant).where(
            CaseParticipant.case_id == case_id,
            CaseParticipant.user_id == user.id,
        )
    )
    if participant is None:
        raise ResourceNotFoundError
    return case, participant


def require_lawyer_case(session: Session, user: User, case_id: str) -> Case:
    case, participant = accessible_case(session, user, case_id)
    if user.role != UserRole.LAWYER or participant is None or participant.participant_role != "lawyer":
        raise ResourceForbiddenError
    return case
