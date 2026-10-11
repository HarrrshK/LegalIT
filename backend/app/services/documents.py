import hashlib
import io
import secrets
import zipfile
from pathlib import Path

import pymupdf
from docx import Document as DocxDocument


class InvalidDocumentError(Exception):
    pass


def detect_document(data: bytes) -> tuple[str, str]:
    if data.startswith(b"%PDF-"):
        return "pdf", "application/pdf"
    if data.startswith(b"PK\x03\x04"):
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                if "word/document.xml" in archive.namelist():
                    return "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        except zipfile.BadZipFile as error:
            raise InvalidDocumentError("Invalid DOCX archive") from error
    raise InvalidDocumentError("Only valid PDF and DOCX documents are accepted")


def extract_text(data: bytes, extension: str) -> tuple[str | None, str]:
    try:
        if extension == "pdf":
            with pymupdf.open(stream=data, filetype="pdf") as document:
                text = "\n".join(page.get_text() for page in document)
        else:
            document = DocxDocument(io.BytesIO(data))
            text = "\n".join(paragraph.text for paragraph in document.paragraphs)
        cleaned = text.strip()
        return (cleaned or None), ("complete" if cleaned else "needs_ocr")
    except Exception:
        return None, "failed"


def store_document(upload_dir: Path, data: bytes, extension: str) -> tuple[str, str]:
    digest = hashlib.sha256(data).hexdigest()
    storage_key = f"{digest[:2]}/{secrets.token_hex(20)}.{extension}"
    destination = upload_dir / storage_key
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".tmp")
    temporary.write_bytes(data)
    temporary.replace(destination)
    return storage_key, digest
