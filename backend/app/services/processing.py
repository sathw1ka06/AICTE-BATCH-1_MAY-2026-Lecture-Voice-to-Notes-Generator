import os
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.lecture import Lecture
from app.models.transcript import Transcript
from app.models.notes import Notes
from app.models.flashcard import Flashcard
from app.models.quiz_question import QuizQuestion
from app.services import whisper_service, gemini_service


def _get_duration(file_path: str):
    try:
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".mp3":
            from mutagen.mp3 import MP3
            return float(MP3(file_path).info.length)
        elif ext == ".wav":
            from mutagen.wave import WAVE
            return float(WAVE(file_path).info.length)
        elif ext == ".m4a":
            from mutagen.mp4 import MP4
            return float(MP4(file_path).info.length)
    except Exception:
        pass
    return None


def _update_status(db: Session, lecture: Lecture, status: str, progress: int) -> None:
    lecture.status = status
    lecture.progress = progress
    db.commit()


def process_lecture(lecture_id: int, file_path: str) -> None:
    """
    Synchronous pipeline — runs in FastAPI BackgroundTasks threadpool.
    Each step updates the lecture status before executing, so the frontend
    can poll for live progress.
    """
    db = SessionLocal()
    lecture = None
    try:
        lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
        if not lecture:
            return

        duration = _get_duration(file_path)
        if duration is not None:
            lecture.duration = duration
            db.commit()

        # ── Step 1: Transcribe ────────────────────────────────────────────
        _update_status(db, lecture, "Transcribing", 25)
        transcript_text = whisper_service.transcribe_audio(file_path)

        existing = db.query(Transcript).filter(Transcript.lecture_id == lecture_id).first()
        if existing:
            existing.transcript_text = transcript_text
        else:
            db.add(Transcript(lecture_id=lecture_id, transcript_text=transcript_text))
        db.commit()

        # ── Step 2: Generate Notes ────────────────────────────────────────
        _update_status(db, lecture, "Generating Notes", 50)
        notes_data = gemini_service.generate_notes(transcript_text)

        existing_notes = db.query(Notes).filter(Notes.lecture_id == lecture_id).first()
        if existing_notes:
            existing_notes.notes_json = notes_data
        else:
            db.add(Notes(lecture_id=lecture_id, notes_json=notes_data))
        db.commit()

        # ── Step 3: Generate Flashcards ───────────────────────────────────
        _update_status(db, lecture, "Generating Flashcards", 70)
        flashcards_data = gemini_service.generate_flashcards(transcript_text)

        db.query(Flashcard).filter(Flashcard.lecture_id == lecture_id).delete()
        for fc in flashcards_data:
            db.add(Flashcard(
                lecture_id=lecture_id,
                question=fc["question"],
                answer=fc["answer"],
            ))
        db.commit()

        # ── Step 4: Generate Quiz ─────────────────────────────────────────
        _update_status(db, lecture, "Generating Quiz", 85)
        quiz_data = gemini_service.generate_quiz(transcript_text)

        db.query(QuizQuestion).filter(QuizQuestion.lecture_id == lecture_id).delete()
        for q in quiz_data:
            db.add(QuizQuestion(
                lecture_id=lecture_id,
                question=q["question"],
                option_a=q["option_a"],
                option_b=q["option_b"],
                option_c=q["option_c"],
                option_d=q["option_d"],
                correct_answer=q["correct_answer"],
            ))
        db.commit()

        _update_status(db, lecture, "Completed", 100)

    except Exception as exc:
        if lecture is not None:
            lecture.status = "Failed"
            lecture.error_message = str(exc)
            db.commit()
    finally:
        db.close()
