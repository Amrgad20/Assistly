from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.vision_service import analyze_image_bytes


router = APIRouter(
    prefix="/vision",
    tags=["Computer Vision"]
)


ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/bmp"
}


@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...)
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid image type. "
                "Please upload JPG, PNG, WEBP, or BMP."
            )
        )

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image is empty."
        )

    # 10 MB maximum.
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="The image must be smaller than 10 MB."
        )

    try:
        result = analyze_image_bytes(file_bytes)

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Image analysis failed: {str(error)}"
        ) from error

    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "analysis": result
    }