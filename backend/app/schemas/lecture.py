from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class LectureResponse(BaseModel):
    id: int
    user_id: int
    title: str
    filename: str
    duration: Optional[str] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
