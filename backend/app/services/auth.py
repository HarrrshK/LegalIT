import secrets

from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.security import (
    hash_password,
    hash_session_token,
    new_session_token,
    session_expiry,
    verify_password,
)
from app.models.core import (
    AccountStatus,
    ClientProfile,
    LawyerProfile,
    LawyerVerification,
    User,
    UserRole,
    UserSession,
    VerificationStatus,
)
from app.repositories.auth import SessionRepository, UserRepository


class DuplicateEmailError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class AccountUnavailableError(Exception):
    pass


class AuthService:
    def __init__(self, session: Session, settings: Settings):
        self.session = session
        self.settings = settings
        self.users = UserRepository(session)
        self.sessions = SessionRepository(session)

    def register(self, *, email: str, password: str, full_name: str, role: UserRole) -> User:
        normalized_email = email.strip().lower()
        if self.users.by_email(normalized_email):
            raise DuplicateEmailError
        prefix = "CLT" if role == UserRole.CLIENT else "LAW"
        user = self.users.add(
            User(
                public_id=f"{prefix}-{secrets.token_hex(5).upper()}",
                email=normalized_email,
                password_hash=hash_password(password),
                full_name=full_name.strip(),
                role=role,
                status=AccountStatus.ACTIVE,
            )
        )
        if role == UserRole.CLIENT:
            self.session.add(ClientProfile(user_id=user.id))
        else:
            self.session.add(LawyerProfile(user_id=user.id, profile_visible=False))
            self.session.add(
                LawyerVerification(lawyer_user_id=user.id, status=VerificationStatus.DRAFT)
            )
        self.session.commit()
        return user

    def login(self, *, login: str, password: str) -> tuple[User, str]:
        user = self.users.by_login(login.strip().lower())
        if user is None or not verify_password(password, user.password_hash):
            raise InvalidCredentialsError
        if user.status != AccountStatus.ACTIVE:
            raise AccountUnavailableError
        token = new_session_token()
        self.sessions.add(
            UserSession(
                user_id=user.id,
                token_hash=hash_session_token(token),
                expires_at=session_expiry(self.settings.session_ttl_seconds),
            )
        )
        self.session.commit()
        return user, token

    def user_for_token(self, token: str | None) -> User | None:
        if not token:
            return None
        user_session = self.sessions.active_by_hash(hash_session_token(token))
        if user_session is None:
            return None
        user = self.session.get(User, user_session.user_id)
        if user is None or user.status != AccountStatus.ACTIVE:
            return None
        return user

    def logout(self, token: str | None) -> None:
        if token:
            self.sessions.revoke(hash_session_token(token))
            self.session.commit()
