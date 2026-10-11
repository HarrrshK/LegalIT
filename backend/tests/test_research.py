import asyncio

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.db.base import Base
from app.models.domain import LegalDocument, LegalSource
from app.services.research import ResearchAssistant, legal_search


def test_fts_search_and_missing_key_fallback(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'research.db'}")
    Base.metadata.create_all(engine)
    with engine.begin() as connection:
        connection.execute(
            text("CREATE VIRTUAL TABLE legal_documents_fts USING fts5(id UNINDEXED, title, content, act_identifier, section_identifier)")
        )
    with Session(engine) as session:
        source = LegalSource(
            name="Official test source",
            base_url="https://example.invalid",
            authority_level=100,
            retrieval_method="manual",
        )
        session.add(source)
        session.flush()
        document = LegalDocument(
            source_id=source.id,
            external_id="act-1-section-10",
            title="Example Act Section 10",
            document_type="legislation",
            jurisdiction="India",
            authority="Parliament",
            act_identifier="Example Act",
            section_identifier="Section 10",
            source_url="https://example.invalid/act-1",
            content="Section 10 provides a statutory remedy for the affected person.",
            content_hash="a" * 64,
        )
        session.add(document)
        session.flush()
        session.execute(
            text("INSERT INTO legal_documents_fts(id,title,content,act_identifier,section_identifier) VALUES (:id,:title,:content,:act,:section)"),
            {"id": document.id, "title": document.title, "content": document.content, "act": document.act_identifier, "section": document.section_identifier},
        )
        session.commit()

        results = legal_search(session, "Example Act Section 10 remedy", jurisdiction="India")
        assert [item.id for item in results] == [document.id]
        answer = asyncio.run(
            ResearchAssistant(
                Settings(data_dir=tmp_path, upload_dir=tmp_path / "uploads", groq_api_key=None)
            ).answer("What remedy exists?", results)
        )
        assert answer.inference_used is False
        assert answer.insufficient_evidence is False
        assert answer.citations[0].source_id == document.id
    engine.dispose()
