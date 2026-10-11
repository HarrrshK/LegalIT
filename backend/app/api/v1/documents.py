from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import current_user, get_db, require_role
from app.models.core import CaseParticipant, User, UserRole
from app.models.domain import CaseDocument
from app.schemas.documents import DocumentResponse, DocumentSharingUpdate
from app.services.access import ResourceForbiddenError, ResourceNotFoundError, accessible_case, require_lawyer_case
from app.services.documents import InvalidDocumentError, detect_document, extract_text, store_document


router = APIRouter(tags=["documents"])


def authorized_document(session: Session, user: User, document_id: str) -> CaseDocument:
    document = session.get(CaseDocument, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        _, participant = accessible_case(session, user, document.case_id)
    except ResourceNotFoundError as error:
        raise HTTPException(status_code=404, detail="Document not found") from error
    if user.role == UserRole.CLIENT and not document.client_visible:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.get("/cases/{case_id}/documents", response_model=list[DocumentResponse])
def list_documents(case_id: str, user: User = Depends(current_user), session: Session = Depends(get_db)):
    try:
        accessible_case(session, user, case_id)
    except ResourceNotFoundError as error:
        raise HTTPException(status_code=404, detail="Case not found") from error
    statement = select(CaseDocument).where(CaseDocument.case_id == case_id)
    if user.role == UserRole.CLIENT:
        statement = statement.where(CaseDocument.client_visible.is_(True))
    return list(session.scalars(statement.order_by(CaseDocument.created_at.desc())))


@router.post("/cases/{case_id}/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    case_id: str,
    request: Request,
    file: UploadFile = File(...),
    category: str | None = Form(default=None),
    description: str | None = Form(default=None),
    client_visible: bool = Form(default=False),
    user: User = Depends(current_user),
    session: Session = Depends(get_db),
):
    try:
        _, participant = accessible_case(session, user, case_id)
    except ResourceNotFoundError as error:
        raise HTTPException(status_code=404, detail="Case not found") from error
    if user.role == UserRole.CLIENT:
        client_visible = True
    elif user.role != UserRole.LAWYER or participant is None or participant.participant_role != "lawyer":
        raise HTTPException(status_code=403, detail="Permission denied")
    data = await file.read(request.app.state.settings.max_upload_bytes + 1)
    if len(data) > request.app.state.settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="Document exceeds the upload size limit")
    if not data:
        raise HTTPException(status_code=422, detail="Document is empty")
    try:
        extension, content_type = detect_document(data)
    except InvalidDocumentError as error:
        raise HTTPException(status_code=415, detail=str(error)) from error
    storage_key, digest = store_document(request.app.state.settings.upload_dir, data, extension)
    extracted_text, extraction_status = extract_text(data, extension)
    document = CaseDocument(
        case_id=case_id,
        uploaded_by_user_id=user.id,
        storage_key=storage_key,
        original_filename=Path(file.filename or f"document.{extension}").name[:255],
        content_type=content_type,
        size_bytes=len(data),
        sha256=digest,
        category=category.strip()[:100] if category else None,
        description=description.strip()[:5000] if description else None,
        client_visible=client_visible,
        extraction_status=extraction_status,
        extracted_text=extracted_text,
    )
    session.add(document)
    session.commit()
    return document


@router.get("/documents/{document_id}/download")
def download_document(
    document_id: str,
    request: Request,
    user: User = Depends(current_user),
    session: Session = Depends(get_db),
):
    document = authorized_document(session, user, document_id)
    root = request.app.state.settings.upload_dir.resolve()
    path = (root / document.storage_key).resolve()
    if root not in path.parents or not path.is_file():
        raise HTTPException(status_code=404, detail="Document file is unavailable")
    return FileResponse(path, media_type=document.content_type, filename=document.original_filename)


@router.patch("/documents/{document_id}/sharing", response_model=DocumentResponse)
def update_sharing(
    document_id: str,
    payload: DocumentSharingUpdate,
    lawyer: User = Depends(require_role(UserRole.LAWYER)),
    session: Session = Depends(get_db),
):
    document = session.get(CaseDocument, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        require_lawyer_case(session, lawyer, document.case_id)
    except (ResourceNotFoundError, ResourceForbiddenError) as error:
        raise HTTPException(status_code=404, detail="Document not found") from error
    document.client_visible = payload.client_visible
    session.commit()
    return document
