from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile
)
from pydantic import BaseModel

from app.services.rag_service import (
    DuplicateDocumentError,
    add_document,
    answer_with_rag,
    rebuild_index
)
from app.core.security import require_roles


router = APIRouter(
    tags=["RAG"]
)

MAX_UPLOAD_SIZE = 10 * 1024 * 1024
ALLOWED_TYPES = {
    ".pdf": {
        "application/pdf",
        "application/octet-stream"
    },
    ".txt": {
        "text/plain",
        "application/octet-stream"
    }
}


class RagQuestion(BaseModel):
    question: str


@router.post("/rag/rebuild")
def rebuild():
    return rebuild_index()


@router.post("/rag/ask")
def ask(request: RagQuestion):
    return answer_with_rag(request.question)


@router.post("/knowledge/upload")
async def upload_knowledge_document(
    file: UploadFile = File(...),
    _user: dict = Depends(
        require_roles("admin")
    )
):
    from pathlib import Path

    filename = Path(file.filename or "").name
    suffix = Path(filename).suffix.lower()

    if suffix not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and TXT files are supported."
        )

    if (
        file.content_type
        and file.content_type
        not in ALLOWED_TYPES[suffix]
    ):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file type does not match its extension."
        )

    content = await file.read(
        MAX_UPLOAD_SIZE + 1
    )

    if not content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty."
        )

    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail="The uploaded file must be 10 MB or smaller."
        )

    if suffix == ".pdf" and not content.startswith(b"%PDF"):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid PDF."
        )

    if suffix == ".txt":
        try:
            content.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise HTTPException(
                status_code=400,
                detail="TXT files must use UTF-8 encoding."
            ) from exc

    try:
        return add_document(
            filename,
            content
        )
    except DuplicateDocumentError as exc:
        raise HTTPException(
            status_code=409,
            detail=str(exc)
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        ) from exc
