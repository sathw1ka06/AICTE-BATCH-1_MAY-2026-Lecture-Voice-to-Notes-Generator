import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.lecture import Lecture
from app.models.transcript import Transcript
from app.models.notes import Notes
from app.models.flashcard import Flashcard
from app.models.quiz_question import QuizQuestion
from app.schemas.lecture import (
    LectureResponse,
    LectureDetailResponse,
    TranscriptResponse,
    NotesResponse,
    FlashcardResponse,
    QuizQuestionResponse,
)
from app.utils.auth import get_current_user
from app.config import settings
from app.services.processing import process_lecture

router = APIRouter(prefix="/lecture", tags=["lecture"])

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a"}
MAX_BYTES = settings.max_file_size_mb * 1024 * 1024


# ── Upload ────────────────────────────────────────────────────────────────────

@router.post("/upload", response_model=LectureResponse)
async def upload_lecture(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only MP3, WAV, and M4A files are allowed")

    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the {settings.max_file_size_mb} MB limit",
        )

    os.makedirs(settings.upload_dir, exist_ok=True)
    unique_name = f"{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(settings.upload_dir, unique_name)

    with open(file_path, "wb") as buffer:
        buffer.write(content)

    raw_name = os.path.splitext(file.filename)[0]
    title = raw_name.replace("_", " ").replace("-", " ").title()

    lecture = Lecture(
        user_id=current_user.id,
        title=title,
        filename=unique_name,
        status="Uploaded",
        progress=0,
    )
    db.add(lecture)
    db.commit()
    db.refresh(lecture)

    background_tasks.add_task(process_lecture, lecture.id, file_path)

    return lecture


# ── History ───────────────────────────────────────────────────────────────────

@router.get("/history", response_model=List[LectureResponse])
def get_history(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Lecture)
        .filter(Lecture.user_id == current_user.id)
        .order_by(Lecture.created_at.desc())
        .all()
    )


# ── Lecture detail (status + progress) ───────────────────────────────────────

@router.get("/{lecture_id}", response_model=LectureDetailResponse)
def get_lecture(
    lecture_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lecture = _get_owned_lecture(lecture_id, current_user.id, db)
    return lecture


# ── Content endpoints ─────────────────────────────────────────────────────────

@router.get("/{lecture_id}/transcript", response_model=TranscriptResponse)
def get_transcript(
    lecture_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_owned_lecture(lecture_id, current_user.id, db)
    row = db.query(Transcript).filter(Transcript.lecture_id == lecture_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Transcript not available yet")
    return row


@router.get("/{lecture_id}/notes", response_model=NotesResponse)
def get_notes(
    lecture_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_owned_lecture(lecture_id, current_user.id, db)
    row = db.query(Notes).filter(Notes.lecture_id == lecture_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Notes not available yet")
    return row


@router.get("/{lecture_id}/flashcards", response_model=List[FlashcardResponse])
def get_flashcards(
    lecture_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_owned_lecture(lecture_id, current_user.id, db)
    return db.query(Flashcard).filter(Flashcard.lecture_id == lecture_id).all()


@router.get("/{lecture_id}/quiz", response_model=List[QuizQuestionResponse])
def get_quiz(
    lecture_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_owned_lecture(lecture_id, current_user.id, db)
    return db.query(QuizQuestion).filter(QuizQuestion.lecture_id == lecture_id).all()


# ── Regeneration endpoints (testing / debugging) ──────────────────────────────

@router.post("/{lecture_id}/transcribe", response_model=LectureDetailResponse)
def retranscribe(
    lecture_id: int,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lecture = _get_owned_lecture(lecture_id, current_user.id, db)
    file_path = os.path.join(settings.upload_dir, lecture.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found on server")
    lecture.status = "Uploaded"
    lecture.progress = 0
    lecture.error_message = None
    db.commit()
    db.refresh(lecture)
    background_tasks.add_task(process_lecture, lecture.id, file_path)
    return lecture


@router.post("/{lecture_id}/generate-notes", response_model=LectureDetailResponse)
def regenerate_notes(
    lecture_id: int,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lecture = _get_owned_lecture(lecture_id, current_user.id, db)
    transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture_id).first()
    if not transcript:
        raise HTTPException(status_code=400, detail="Transcript required before generating notes")

    def _regen():
        _db = __import__("app.database", fromlist=["SessionLocal"]).SessionLocal()
        try:
            lec = _db.query(Lecture).filter(Lecture.id == lecture_id).first()
            lec.status = "Generating Notes"
            lec.progress = 50
            _db.commit()
            from app.services.gemini_service import generate_notes as _gn
            data = _gn(transcript.transcript_text)
            existing = _db.query(Notes).filter(Notes.lecture_id == lecture_id).first()
            if existing:
                existing.notes_json = data
            else:
                _db.add(Notes(lecture_id=lecture_id, notes_json=data))
            lec.status = "Completed"
            lec.progress = 100
            _db.commit()
        except Exception as e:
            lec = _db.query(Lecture).filter(Lecture.id == lecture_id).first()
            if lec:
                lec.status = "Failed"
                lec.error_message = str(e)
                _db.commit()
        finally:
            _db.close()

    background_tasks.add_task(_regen)
    return lecture


@router.post("/{lecture_id}/generate-flashcards", response_model=LectureDetailResponse)
def regenerate_flashcards(
    lecture_id: int,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lecture = _get_owned_lecture(lecture_id, current_user.id, db)
    transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture_id).first()
    if not transcript:
        raise HTTPException(status_code=400, detail="Transcript required before generating flashcards")

    def _regen():
        _db = __import__("app.database", fromlist=["SessionLocal"]).SessionLocal()
        try:
            lec = _db.query(Lecture).filter(Lecture.id == lecture_id).first()
            lec.status = "Generating Flashcards"
            lec.progress = 70
            _db.commit()
            from app.services.gemini_service import generate_flashcards as _gf
            data = _gf(transcript.transcript_text)
            _db.query(Flashcard).filter(Flashcard.lecture_id == lecture_id).delete()
            for fc in data:
                _db.add(Flashcard(lecture_id=lecture_id, question=fc["question"], answer=fc["answer"]))
            lec.status = "Completed"
            lec.progress = 100
            _db.commit()
        except Exception as e:
            lec = _db.query(Lecture).filter(Lecture.id == lecture_id).first()
            if lec:
                lec.status = "Failed"
                lec.error_message = str(e)
                _db.commit()
        finally:
            _db.close()

    background_tasks.add_task(_regen)
    return lecture


@router.post("/{lecture_id}/generate-quiz", response_model=LectureDetailResponse)
def regenerate_quiz(
    lecture_id: int,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lecture = _get_owned_lecture(lecture_id, current_user.id, db)
    transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture_id).first()
    if not transcript:
        raise HTTPException(status_code=400, detail="Transcript required before generating quiz")

    def _regen():
        _db = __import__("app.database", fromlist=["SessionLocal"]).SessionLocal()
        try:
            lec = _db.query(Lecture).filter(Lecture.id == lecture_id).first()
            lec.status = "Generating Quiz"
            lec.progress = 85
            _db.commit()
            from app.services.gemini_service import generate_quiz as _gq
            data = _gq(transcript.transcript_text)
            _db.query(QuizQuestion).filter(QuizQuestion.lecture_id == lecture_id).delete()
            for q in data:
                _db.add(QuizQuestion(lecture_id=lecture_id, **q))
            lec.status = "Completed"
            lec.progress = 100
            _db.commit()
        except Exception as e:
            lec = _db.query(Lecture).filter(Lecture.id == lecture_id).first()
            if lec:
                lec.status = "Failed"
                lec.error_message = str(e)
                _db.commit()
        finally:
            _db.close()

    background_tasks.add_task(_regen)
    return lecture


# ── Helper ────────────────────────────────────────────────────────────────────

def _get_owned_lecture(lecture_id: int, user_id: int, db: Session) -> Lecture:
    lecture = db.query(Lecture).filter(
        Lecture.id == lecture_id,
        Lecture.user_id == user_id,
    ).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return lecture
