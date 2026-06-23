from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.lecture import Lecture
from app.models.notes import Notes
from app.models.flashcard import Flashcard
from app.models.quiz_question import QuizQuestion
from app.schemas.user import UserResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/profile", response_model=UserResponse)
def get_profile(current_user=Depends(get_current_user)):
    return current_user


@router.get("/stats")
def get_stats(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.id

    total_lectures = db.query(Lecture).filter(Lecture.user_id == user_id).count()

    total_notes = (
        db.query(Notes)
        .join(Lecture, Notes.lecture_id == Lecture.id)
        .filter(Lecture.user_id == user_id)
        .count()
    )

    total_flashcards = (
        db.query(Flashcard)
        .join(Lecture, Flashcard.lecture_id == Lecture.id)
        .filter(Lecture.user_id == user_id)
        .count()
    )

    total_quizzes = (
        db.query(QuizQuestion)
        .join(Lecture, QuizQuestion.lecture_id == Lecture.id)
        .filter(Lecture.user_id == user_id)
        .count()
    )

    return {
        "total_lectures": total_lectures,
        "total_notes": total_notes,
        "total_flashcards": total_flashcards,
        "total_quizzes": total_quizzes,
    }
