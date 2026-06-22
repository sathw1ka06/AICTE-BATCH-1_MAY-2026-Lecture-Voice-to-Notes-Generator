import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.lecture import Lecture
from app.schemas.lecture import LectureResponse
from app.utils.auth import get_current_user
from app.config import settings

router = APIRouter(prefix="/lecture", tags=["lecture"])

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a"}


@router.post("/upload", response_model=LectureResponse)
async def upload_lecture(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only MP3, WAV, and M4A files are allowed")

    os.makedirs(settings.upload_dir, exist_ok=True)

    unique_name = f"{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(settings.upload_dir, unique_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    raw_name = os.path.splitext(file.filename)[0]
    title = raw_name.replace("_", " ").replace("-", " ").title()

    lecture = Lecture(
        user_id=current_user.id,
        title=title,
        filename=unique_name,
        status="Uploaded",
    )
    db.add(lecture)
    db.commit()
    db.refresh(lecture)
    return lecture


@router.get("/history", response_model=List[LectureResponse])
def get_history(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Lecture)
        .filter(Lecture.user_id == current_user.id)
        .order_by(Lecture.created_at.desc())
        .all()
    )
