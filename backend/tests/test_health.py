from pathlib import Path
from types import SimpleNamespace

from app.api.v1.health import health
from app.db.session import build_engine, build_session_factory
from app.main import create_app


def test_health_reports_database_available(test_settings):
    app = create_app(test_settings)
    engine = build_engine(test_settings)
    app.state.session_factory = build_session_factory(engine)
    response = health(SimpleNamespace(app=app))
    assert response.status == "ok"
    assert response.database == "ok"
    engine.dispose()


def test_settings_create_private_storage_directories(test_settings):
    test_settings.ensure_directories()
    assert Path(test_settings.data_dir).is_dir()
    assert Path(test_settings.upload_dir).is_dir()
