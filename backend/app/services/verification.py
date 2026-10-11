from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.core import LawyerProfile, LawyerVerification, User, VerificationStatus


class VerificationNotFoundError(Exception):
    pass


class VerificationStateError(Exception):
    pass


class VerificationService:
    def __init__(self, session: Session):
        self.session = session

    def current_for_lawyer(self, lawyer_user_id: str) -> LawyerVerification:
        verification = self.session.scalar(
            select(LawyerVerification)
            .where(LawyerVerification.lawyer_user_id == lawyer_user_id)
            .order_by(LawyerVerification.created_at.desc())
        )
        if verification is None:
            raise VerificationNotFoundError
        return verification

    def submit(self, lawyer_user_id: str) -> LawyerVerification:
        verification = self.current_for_lawyer(lawyer_user_id)
        if verification.status not in {
            VerificationStatus.DRAFT,
            VerificationStatus.REJECTED,
            VerificationStatus.CHANGES_REQUESTED,
        }:
            raise VerificationStateError
        verification.status = VerificationStatus.SUBMITTED
        verification.submitted_at = datetime.now(timezone.utc)
        verification.reviewed_at = None
        verification.reviewed_by_user_id = None
        verification.review_note = None
        self.session.commit()
        return verification

    def pending(self) -> list[LawyerVerification]:
        return list(
            self.session.scalars(
                select(LawyerVerification)
                .where(LawyerVerification.status == VerificationStatus.SUBMITTED)
                .order_by(LawyerVerification.submitted_at.asc())
            )
        )

    def review(
        self,
        verification_id: str,
        reviewer: User,
        decision: VerificationStatus,
        note: str | None,
    ) -> LawyerVerification:
        verification = self.session.get(LawyerVerification, verification_id)
        if verification is None:
            raise VerificationNotFoundError
        if verification.status != VerificationStatus.SUBMITTED:
            raise VerificationStateError
        verification.status = decision
        verification.reviewed_at = datetime.now(timezone.utc)
        verification.reviewed_by_user_id = reviewer.id
        verification.review_note = note.strip() if note else None
        profile = self.session.get(LawyerProfile, verification.lawyer_user_id)
        if profile is not None:
            profile.profile_visible = decision == VerificationStatus.APPROVED
        self.session.commit()
        return verification
