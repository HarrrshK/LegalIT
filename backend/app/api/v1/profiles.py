import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_role
from app.models.core import ClientProfile, LawyerProfile, User, UserRole
from app.schemas.profiles import ClientProfileUpdate, LawyerProfileUpdate, ProfileResponse
from app.services.audit import add_audit


router = APIRouter(prefix="/profiles", tags=["profiles"])


def clean_list(values: list[str]) -> list[str]:
    return list(dict.fromkeys(item.strip() for item in values if item.strip()))


@router.get("/me", response_model=ProfileResponse)
def my_profile(user: User = Depends(require_role(UserRole.CLIENT, UserRole.LAWYER)), session: Session = Depends(get_db)):
    if user.role == UserRole.CLIENT:
        profile = session.get(ClientProfile, user.id)
        fields = {
            "phone": profile.phone,
            "city": profile.city,
            "preferred_language": profile.preferred_language,
            "notifications_email": profile.notifications_email,
            "notifications_in_app": profile.notifications_in_app,
        }
    else:
        profile = session.get(LawyerProfile, user.id)
        fields = {
            "bar_registration": profile.bar_registration,
            "city": profile.city,
            "years_experience": profile.years_experience,
            "bio": profile.bio,
            "languages": json.loads(profile.languages_json),
            "practice_areas": json.loads(profile.practice_areas_json),
            "accepting_consultations": profile.accepting_consultations,
            "profile_visible": profile.profile_visible,
        }
    return ProfileResponse(
        user_id=user.id,
        public_id=user.public_id,
        role=user.role,
        full_name=user.full_name,
        email=user.email,
        fields=fields,
    )


@router.patch("/me/client", response_model=ProfileResponse)
def update_client_profile(
    payload: ClientProfileUpdate,
    user: User = Depends(require_role(UserRole.CLIENT)),
    session: Session = Depends(get_db),
):
    profile = session.get(ClientProfile, user.id)
    values = payload.model_dump(exclude_unset=True)
    if "full_name" in values:
        user.full_name = values.pop("full_name").strip()
    for key, value in values.items():
        setattr(profile, key, value.strip() if isinstance(value, str) else value)
    add_audit(session, action="client_profile_updated", actor_user_id=user.id, target_type="user", target_id=user.id)
    session.commit()
    return my_profile(user, session)


@router.patch("/me/lawyer", response_model=ProfileResponse)
def update_lawyer_profile(
    payload: LawyerProfileUpdate,
    user: User = Depends(require_role(UserRole.LAWYER)),
    session: Session = Depends(get_db),
):
    profile = session.get(LawyerProfile, user.id)
    values = payload.model_dump(exclude_unset=True)
    if "full_name" in values:
        user.full_name = values.pop("full_name").strip()
    if "languages" in values:
        profile.languages_json = json.dumps(clean_list(values.pop("languages")))
    if "practice_areas" in values:
        profile.practice_areas_json = json.dumps(clean_list(values.pop("practice_areas")))
    for key, value in values.items():
        setattr(profile, key, value.strip() if isinstance(value, str) else value)
    add_audit(session, action="lawyer_profile_updated", actor_user_id=user.id, target_type="user", target_id=user.id)
    session.commit()
    return my_profile(user, session)
