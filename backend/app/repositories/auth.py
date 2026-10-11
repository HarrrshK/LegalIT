from datetime import datetime, timezone

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.core import User, UserSession


class UserRepository:
    def __init__(self, session: Session):
        self.session = session

    def by_email(self, email: str) -> User | None:
        return self.session.scalar(select(User).where(User.email == email))

    def by_login(self, login: str) -> User | None:
        return self.session.scalar(
            select(User).where(or_(User.email == login, User.public_id == login.upper()))
        )

    def add(self, user: User) -> User:
        self.session.add(user)
        self.session.flush()
        return user


class SessionRepository:
    def __init__(self, session: Session):
        self.session = session

    def add(self, user_session: UserSession) -> UserSession:
        self.session.add(user_session)
        self.session.flush()
        return user_session

    def active_by_hash(self, token_hash: str) -> UserSession | None:
        now = datetime.now(timezone.utc)
        return self.session.scalar(
            select(UserSession).where(
                UserSession.token_hash == token_hash,
                UserSession.revoked_at.is_(None),
                UserSession.expires_at > now,
            )
        )

    def revoke(self, token_hash: str) -> None:
        user_session = self.active_by_hash(token_hash)
        if user_session:
            user_session.revoked_at = datetime.now(timezone.utc)
