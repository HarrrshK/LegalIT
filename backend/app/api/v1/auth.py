from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.api.dependencies import current_user, get_auth_service
from app.models.core import User
from app.schemas.auth import AuthResponse, LoginRequest, PasswordChangeRequest, RegisterRequest, UserResponse
from app.core.security import hash_password
from app.services.auth import (
    AccountUnavailableError,
    AuthService,
    DuplicateEmailError,
    InvalidCredentialsError,
)


router = APIRouter(prefix="/auth", tags=["authentication"])


def set_session_cookie(response: Response, request: Request, token: str) -> None:
    settings = request.app.state.settings
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=settings.session_ttl_seconds,
        httponly=True,
        secure=settings.environment == "production",
        samesite="lax",
        path="/",
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    try:
        user = service.register(**payload.model_dump())
        user, token = service.login(login=user.email, password=payload.password)
    except DuplicateEmailError as error:
        raise HTTPException(status_code=409, detail="An account already uses that email") from error
    set_session_cookie(response, request, token)
    return AuthResponse(user=UserResponse.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    try:
        user, token = service.login(**payload.model_dump())
    except InvalidCredentialsError as error:
        raise HTTPException(status_code=401, detail="Invalid email, user ID, or password") from error
    except AccountUnavailableError as error:
        raise HTTPException(status_code=403, detail="Account access is unavailable") from error
    set_session_cookie(response, request, token)
    return AuthResponse(user=UserResponse.model_validate(user))


@router.get("/me", response_model=AuthResponse)
def me(user: User = Depends(current_user)) -> AuthResponse:
    return AuthResponse(user=UserResponse.model_validate(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    service: AuthService = Depends(get_auth_service),
) -> None:
    cookie_name = request.app.state.settings.session_cookie_name
    service.logout(request.cookies.get(cookie_name))
    response.delete_cookie(cookie_name, path="/")


@router.put("/password", response_model=AuthResponse)
def change_password(
    payload: PasswordChangeRequest,
    user: User = Depends(current_user),
    service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    user.password_hash = hash_password(payload.password)
    user.must_change_password = False
    service.session.commit()
    return AuthResponse(user=UserResponse.model_validate(user))
