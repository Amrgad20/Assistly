from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile
)

from app.core.security import require_roles
from app.services.speech_service import transcribe_audio


router = APIRouter(
    prefix="/speech",
    tags=["Speech Recognition"]
)


@router.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    _user: dict = Depends(
        require_roles(
            "admin",
            "agent",
            "customer"
        )
    )
):

    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid audio file."
        )

    file_bytes = await file.read()

    suffix = ".webm"

    if file.filename and "." in file.filename:
        suffix = "." + file.filename.rsplit(".", 1)[-1]

    try:
        return transcribe_audio(
            file_bytes=file_bytes,
            suffix=suffix
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "The audio could not be transcribed. "
                "Please try another recording."
            )
        ) from exc
