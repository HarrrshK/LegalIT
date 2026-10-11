from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response


class TrustedOriginMiddleware(BaseHTTPMiddleware):
    """Reject cross-origin cookie mutations before they reach a route."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method not in {"GET", "HEAD", "OPTIONS"}:
            origin = request.headers.get("origin")
            allowed = {item.rstrip("/") for item in request.app.state.settings.cors_origins}
            if origin and origin.rstrip("/") not in allowed:
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Request origin is not allowed"},
                )
        return await call_next(request)
