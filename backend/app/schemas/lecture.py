from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any


class LectureResponse(BaseModel):
    id: int
    user_id: int
    title: str
    filename: str
    duration: Optional[float] = None
    status: str
    progress: int = 0
    error_message: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class LectureDetailResponse(BaseModel):
    id: int
    title: str
    status: str
    progress: int
    duration: Optional[float] = None
    error_message: Optional[str] = None

    model_config = {"from_attributes": True}


class TranscriptResponse(BaseModel):
    id: int
    lecture_id: int
    transcript_text: str
    created_at: datetime

    model_config = {"from_attributes": True}


class NotesResponse(BaseModel):
    id: int
    lecture_id: int
    notes_json: Any
    created_at: datetime

    model_config = {"from_attributes": True}


class FlashcardResponse(BaseModel):
    id: int
    lecture_id: int
    question: str
    answer: str
    created_at: datetime

    model_config = {"from_attributes": True}


class QuizQuestionResponse(BaseModel):
    id: int
    lecture_id: int
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    created_at: datetime

    model_config = {"from_attributes": True}
