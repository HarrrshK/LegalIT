import time
from collections import defaultdict, deque

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.requests: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        limits = {
            f"{request.app.state.settings.api_v1_prefix}/auth/login": request.app.state.settings.login_rate_limit,
            f"{request.app.state.settings.api_v1_prefix}/research/ask": request.app.state.settings.ai_rate_limit,
        }
        limit = limits.get(request.url.path) if request.method == "POST" else None
        if limit:
            now = time.monotonic()
            window = request.app.state.settings.rate_limit_window_seconds
            client = request.client.host if request.client else "unknown"
            key = f"{client}:{request.url.path}"
            bucket = self.requests[key]
            while bucket and bucket[0] <= now - window:
                bucket.popleft()
            if len(bucket) >= limit:
                return JSONResponse(
                    status_code=429,
                    headers={"Retry-After": str(window)},
                    content={"detail": "Too many requests. Try again later."},
                )
            bucket.append(now)
        return await call_next(request)
