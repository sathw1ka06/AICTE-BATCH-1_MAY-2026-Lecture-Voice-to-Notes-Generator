from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.lecture import Lecture
from app.schemas.user import UserResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/profile", response_model=UserResponse)
def get_profile(current_user=Depends(get_current_user)):
    return current_user


@router.get("/stats")
def get_stats(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    total_lectures = (
        db.query(Lecture).filter(Lecture.user_id == current_user.id).count()
    )
    return {
        "total_lectures": total_lectures,
        "total_notes": 0,
        "total_flashcards": 0,
        "total_quizzes": 0,
    }
