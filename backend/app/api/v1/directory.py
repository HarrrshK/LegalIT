import json

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models.core import LawyerProfile, LawyerVerification, User, UserRole, VerificationStatus
from app.schemas.domain import LawyerDirectoryItem


router = APIRouter(prefix="/lawyers", tags=["lawyer directory"])


@router.get("", response_model=list[LawyerDirectoryItem])
def list_lawyers(
    search: str | None = Query(default=None, max_length=120),
    city: str | None = Query(default=None, max_length=120),
    practice_area: str | None = Query(default=None, max_length=100),
    language: str | None = Query(default=None, max_length=64),
    session: Session = Depends(get_db),
):
    statement = (
        select(User, LawyerProfile)
        .join(LawyerProfile, LawyerProfile.user_id == User.id)
        .join(LawyerVerification, LawyerVerification.lawyer_user_id == User.id)
        .where(
            User.role == UserRole.LAWYER,
            LawyerProfile.profile_visible.is_(True),
            LawyerVerification.status == VerificationStatus.APPROVED,
        )
        .order_by(User.full_name)
    )
    if search:
        statement = statement.where(User.full_name.ilike(f"%{search}%"))
    if city:
        statement = statement.where(LawyerProfile.city.ilike(city))
    if practice_area:
        statement = statement.where(LawyerProfile.practice_areas_json.ilike(f'%"{practice_area}"%'))
    if language:
        statement = statement.where(LawyerProfile.languages_json.ilike(f'%"{language}"%'))
    return [
        LawyerDirectoryItem(
            user_id=user.id,
            public_id=user.public_id,
            full_name=user.full_name,
            city=profile.city,
            years_experience=profile.years_experience,
            bio=profile.bio,
            languages=json.loads(profile.languages_json),
            practice_areas=json.loads(profile.practice_areas_json),
            accepting_consultations=profile.accepting_consultations,
            verified=True,
        )
        for user, profile in session.execute(statement)
    ]
