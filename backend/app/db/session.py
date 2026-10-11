from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import Settings


def build_engine(settings: Settings):
    connect_args = {"check_same_thread": False} if settings.resolved_database_url.startswith("sqlite") else {}
    engine = create_engine(settings.resolved_database_url, connect_args=connect_args, pool_pre_ping=True)
    if settings.resolved_database_url.startswith("sqlite"):
        @event.listens_for(engine, "connect")
        def enable_sqlite_foreign_keys(dbapi_connection, _connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
    return engine


def build_session_factory(engine):
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False, class_=Session)


def get_db() -> Generator[Session, None, None]:
    from app.main import app

    with app.state.session_factory() as session:
        yield session
