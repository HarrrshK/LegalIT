import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.api.v1.consultations import cancel_consultation, complete_consultation, create_consultation, decide_consultation
from app.core.config import Settings
from app.db.base import Base
from app.models.core import UserRole
from app.models.domain import ConsultationStatusEvent
from app.schemas.domain import ConsultationCreate, ConsultationDecision
from app.services.auth import AuthService


def test_consultation_permissions_and_terminal_states(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'consultations.db'}")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        service = AuthService(session, Settings(data_dir=tmp_path, upload_dir=tmp_path / 'uploads'))
        accounts = [service.register(email=f'{name}@example.com', password='correct horse battery staple', full_name=name, role=role)
                    for name, role in [('client', UserRole.CLIENT), ('lawyer', UserRole.LAWYER), ('stranger', UserRole.LAWYER)]]
        client, lawyer, stranger = accounts
        consultation = create_consultation(ConsultationCreate(lawyer_user_id=lawyer.id, subject='Property dispute', issue_description='Please help me understand my property dispute.'), client, session)
        with pytest.raises(HTTPException) as denied:
            complete_consultation(consultation.id, stranger, session)
        assert denied.value.status_code == 404
        decide_consultation(consultation.id, ConsultationDecision(decision='accepted'), lawyer, session)
        assert complete_consultation(consultation.id, lawyer, session).status == 'completed'
        with pytest.raises(HTTPException) as terminal:
            cancel_consultation(consultation.id, client, session)
        assert terminal.value.status_code == 409
        assert len(list(session.scalars(select(ConsultationStatusEvent)))) == 3
    engine.dispose()
