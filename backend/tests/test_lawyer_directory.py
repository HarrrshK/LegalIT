from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.api.v1.directory import lawyer_options, list_lawyers
from app.core.config import Settings
from app.db.base import Base
from app.models.core import UserRole
from app.services.auth import AuthService


def test_registered_lawyer_is_available_as_unverified_option(tmp_path):
    database_path = tmp_path / "directory.db"
    engine = create_engine(f"sqlite:///{database_path}")
    Base.metadata.create_all(engine)
    settings = Settings(
        data_dir=tmp_path,
        upload_dir=tmp_path / "uploads",
        database_url=f"sqlite:///{database_path}",
    )

    with Session(engine) as session:
        service = AuthService(session, settings)
        client = service.register(
            email="client@example.com",
            password="correct horse battery staple",
            full_name="Asha Client",
            role=UserRole.CLIENT,
        )
        lawyer = service.register(
            email="lawyer@example.com",
            password="correct horse battery staple",
            full_name="Ravi Lawyer",
            role=UserRole.LAWYER,
        )

        options = lawyer_options(client, session)
        assert [(item.user_id, item.verified) for item in options] == [(lawyer.id, False)]
        assert list_lawyers(None, None, None, None, session) == []

    engine.dispose()
