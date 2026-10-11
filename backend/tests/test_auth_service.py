import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.db.base import Base
from app.models.core import (
    AccountStatus,
    ClientProfile,
    LawyerProfile,
    LawyerVerification,
    User,
    UserRole,
    VerificationStatus,
)
from app.services.auth import (
    AccountUnavailableError,
    AuthService,
    DuplicateEmailError,
    InvalidCredentialsError,
)


@pytest.fixture
def auth_service(tmp_path):
    database_path = tmp_path / "auth.db"
    engine = create_engine(f"sqlite:///{database_path}")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield AuthService(
            session,
            Settings(
                data_dir=tmp_path,
                upload_dir=tmp_path / "uploads",
                database_url=f"sqlite:///{database_path}",
            ),
        )
    engine.dispose()


def test_client_registration_login_and_logout(auth_service):
    user = auth_service.register(
        email=" Client@Example.com ",
        password="correct horse battery staple",
        full_name="Asha Client",
        role=UserRole.CLIENT,
    )

    assert user.email == "client@example.com"
    assert user.public_id.startswith("CLT-")
    assert auth_service.session.get(ClientProfile, user.id) is not None

    logged_in_user, token = auth_service.login(
        login=user.public_id.lower(), password="correct horse battery staple"
    )
    assert logged_in_user.id == user.id
    assert auth_service.user_for_token(token).id == user.id

    auth_service.logout(token)
    assert auth_service.user_for_token(token) is None


def test_lawyer_registration_creates_private_draft_verification(auth_service):
    user = auth_service.register(
        email="lawyer@example.com",
        password="correct horse battery staple",
        full_name="Ravi Lawyer",
        role=UserRole.LAWYER,
    )

    profile = auth_service.session.get(LawyerProfile, user.id)
    verification = auth_service.session.scalar(
        select(LawyerVerification).where(LawyerVerification.lawyer_user_id == user.id)
    )
    assert profile is not None
    assert profile.profile_visible is False
    assert verification is not None
    assert verification.status == VerificationStatus.DRAFT


def test_duplicate_and_invalid_credentials_are_rejected(auth_service):
    auth_service.register(
        email="same@example.com",
        password="correct horse battery staple",
        full_name="First User",
        role=UserRole.CLIENT,
    )
    with pytest.raises(DuplicateEmailError):
        auth_service.register(
            email="SAME@example.com",
            password="another secure password",
            full_name="Second User",
            role=UserRole.CLIENT,
        )
    with pytest.raises(InvalidCredentialsError):
        auth_service.login(login="same@example.com", password="wrong password")


def test_suspended_account_cannot_login_or_use_existing_session(auth_service):
    user = auth_service.register(
        email="suspended@example.com",
        password="correct horse battery staple",
        full_name="Suspended User",
        role=UserRole.CLIENT,
    )
    _, token = auth_service.login(
        login="suspended@example.com", password="correct horse battery staple"
    )
    stored_user = auth_service.session.get(User, user.id)
    stored_user.status = AccountStatus.SUSPENDED
    auth_service.session.commit()

    assert auth_service.user_for_token(token) is None
    with pytest.raises(AccountUnavailableError):
        auth_service.login(
            login="suspended@example.com", password="correct horse battery staple"
        )
