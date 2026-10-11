from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import Settings, get_settings
from app.db.session import build_engine, build_session_factory
from app.middleware.origin import TrustedOriginMiddleware
from app.middleware.rate_limit import RateLimitMiddleware


def create_app(settings: Settings | None = None) -> FastAPI:
    app_settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app_settings.ensure_directories()
        engine = build_engine(app_settings)
        app.state.settings = app_settings
        app.state.engine = engine
        app.state.session_factory = build_session_factory(engine)
        yield
        engine.dispose()

    application = FastAPI(
        title=app_settings.app_name,
        version="0.1.0",
        docs_url=f"{app_settings.api_v1_prefix}/docs",
        openapi_url=f"{app_settings.api_v1_prefix}/openapi.json",
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "X-CSRF-Token"],
    )
    application.add_middleware(TrustedOriginMiddleware)
    application.add_middleware(RateLimitMiddleware)
    application.include_router(api_router, prefix=app_settings.api_v1_prefix)
    return application


app = create_app()
