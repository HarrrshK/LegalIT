import io

import pytest
from docx import Document as DocxDocument
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.api.v1.cases import case_response
from app.core.security import hash_password
from app.db.base import Base
from app.models.core import Case, CaseParticipant, User, UserRole
from app.services.access import ResourceNotFoundError, accessible_case
from app.services.documents import InvalidDocumentError, detect_document, extract_text


def user(email: str, role: UserRole) -> User:
    return User(
        public_id=f"{role.value[:3].upper()}-{email[:8]}",
        email=email,
        password_hash=hash_password("correct horse battery staple"),
        full_name=email.split("@")[0],
        role=role,
    )


def test_cross_user_case_access_and_private_summary(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'access.db'}")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        lawyer = user("lawyer@example.com", UserRole.LAWYER)
        linked_client = user("linked@example.com", UserRole.CLIENT)
        stranger = user("stranger@example.com", UserRole.CLIENT)
        session.add_all([lawyer, linked_client, stranger])
        session.flush()
        case = Case(
            reference="LIT-TEST-1",
            title="Private matter",
            case_type="Civil",
            status="open",
            matter_summary="private legal assessment",
            client_visible_summary="shared update",
            created_by_user_id=lawyer.id,
        )
        session.add(case)
        session.flush()
        session.add_all(
            [
                CaseParticipant(case_id=case.id, user_id=lawyer.id, participant_role="lawyer"),
                CaseParticipant(case_id=case.id, user_id=linked_client.id, participant_role="client"),
            ]
        )
        session.commit()

        accessible, _ = accessible_case(session, linked_client, case.id)
        assert accessible.id == case.id
        assert case_response(case, linked_client).summary == "shared update"
        assert case_response(case, lawyer).summary == "private legal assessment"
        with pytest.raises(ResourceNotFoundError):
            accessible_case(session, stranger, case.id)
    engine.dispose()


def test_document_signature_validation_and_docx_extraction():
    document = DocxDocument()
    document.add_paragraph("Client supplied evidence")
    output = io.BytesIO()
    document.save(output)
    data = output.getvalue()

    extension, content_type = detect_document(data)
    text, status = extract_text(data, extension)
    assert extension == "docx"
    assert "officedocument" in content_type
    assert text == "Client supplied evidence"
    assert status == "complete"

    with pytest.raises(InvalidDocumentError):
        detect_document(b"../../etc/passwd")
