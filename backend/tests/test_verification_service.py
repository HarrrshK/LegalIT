from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.security import hash_password
from app.db.base import Base
from app.models.core import LawyerProfile, User, UserRole, VerificationStatus
from app.services.auth import AuthService
from app.services.verification import VerificationService


def test_lawyer_submission_and_admin_approval(tmp_path):
    database_path = tmp_path / "verification.db"
    engine = create_engine(f"sqlite:///{database_path}")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        settings = Settings(
            data_dir=tmp_path,
            upload_dir=tmp_path / "uploads",
            database_url=f"sqlite:///{database_path}",
        )
        lawyer = AuthService(session, settings).register(
            email="lawyer@example.com",
            password="correct horse battery staple",
            full_name="Ravi Lawyer",
            role=UserRole.LAWYER,
        )
        admin = User(
            public_id="ADM-TESTADMIN",
            email="admin@example.com",
            password_hash=hash_password("correct horse battery staple"),
            full_name="Platform Admin",
            role=UserRole.ADMIN,
        )
        session.add(admin)
        session.commit()

        service = VerificationService(session)
        submitted = service.submit(lawyer.id)
        assert submitted.status == VerificationStatus.SUBMITTED
        assert [item.id for item in service.pending()] == [submitted.id]

        approved = service.review(
            submitted.id,
            admin,
            VerificationStatus.APPROVED,
            "Bar registration checked",
        )
        assert approved.status == VerificationStatus.APPROVED
        assert approved.reviewed_by_user_id == admin.id
        assert session.get(LawyerProfile, lawyer.id).profile_visible is True
        assert service.pending() == []
    engine.dispose()
