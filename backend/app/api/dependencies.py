from collections.abc import Generator

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.models.core import User, UserRole
from app.services.auth import AuthService


def get_db(request: Request) -> Generator[Session, None, None]:
    with request.app.state.session_factory() as session:
        yield session


def get_auth_service(request: Request, session: Session = Depends(get_db)) -> AuthService:
    return AuthService(session, request.app.state.settings)


def current_user(
    request: Request, service: AuthService = Depends(get_auth_service)
) -> User:
    token = request.cookies.get(request.app.state.settings.session_cookie_name)
    user = service.user_for_token(token)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return user


def require_role(*roles: UserRole):
    def dependency(user: User = Depends(current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
        return user

    return dependency
