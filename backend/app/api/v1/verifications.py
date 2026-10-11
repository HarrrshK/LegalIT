from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_role
from app.models.core import User, UserRole, VerificationStatus
from app.schemas.verification import LawyerVerificationResponse, VerificationReviewRequest
from app.services.verification import (
    VerificationNotFoundError,
    VerificationService,
    VerificationStateError,
)


router = APIRouter(tags=["lawyer verification"])


def get_verification_service(session: Session = Depends(get_db)) -> VerificationService:
    return VerificationService(session)


@router.get("/lawyers/me/verification", response_model=LawyerVerificationResponse)
def my_verification(
    user: User = Depends(require_role(UserRole.LAWYER)),
    verification_service: VerificationService = Depends(get_verification_service),
):
    try:
        return verification_service.current_for_lawyer(user.id)
    except VerificationNotFoundError as error:
        raise HTTPException(status_code=404, detail="Verification record not found") from error


@router.post("/lawyers/me/verification/submit", response_model=LawyerVerificationResponse)
def submit_verification(
    user: User = Depends(require_role(UserRole.LAWYER)),
    verification_service: VerificationService = Depends(get_verification_service),
):
    try:
        return verification_service.submit(user.id)
    except VerificationStateError as error:
        raise HTTPException(status_code=409, detail="Verification cannot be submitted in its current state") from error


@router.get("/admin/lawyer-verifications", response_model=list[LawyerVerificationResponse])
def verification_queue(
    _: User = Depends(require_role(UserRole.ADMIN)),
    verification_service: VerificationService = Depends(get_verification_service),
):
    return verification_service.pending()


@router.post(
    "/admin/lawyer-verifications/{verification_id}/review",
    response_model=LawyerVerificationResponse,
)
def review_verification(
    verification_id: str,
    payload: VerificationReviewRequest,
    reviewer: User = Depends(require_role(UserRole.ADMIN)),
    verification_service: VerificationService = Depends(get_verification_service),
):
    try:
        return verification_service.review(
            verification_id,
            reviewer,
            VerificationStatus(payload.decision),
            payload.note,
        )
    except VerificationNotFoundError as error:
        raise HTTPException(status_code=404, detail="Verification record not found") from error
    except VerificationStateError as error:
        raise HTTPException(status_code=409, detail="Only submitted verifications can be reviewed") from error
