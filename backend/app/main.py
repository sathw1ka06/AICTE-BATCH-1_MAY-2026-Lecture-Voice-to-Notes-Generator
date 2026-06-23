import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import Base, engine
from app.config import settings

# Import all models so SQLAlchemy registers them before create_all
from app.models import user, lecture, transcript, notes, flashcard, quiz_question  # noqa: F401
from app.routers import auth, lecture as lecture_router, user as user_router
from app.services import whisper_service


def _run_migrations() -> None:
    """Add new columns to existing tables without touching fresh ones."""
    with engine.begin() as conn:
        # lectures: progress
        conn.execute(text(
            "ALTER TABLE lectures ADD COLUMN IF NOT EXISTS progress INTEGER NOT NULL DEFAULT 0"
        ))
        # lectures: error_message
        conn.execute(text(
            "ALTER TABLE lectures ADD COLUMN IF NOT EXISTS error_message TEXT"
        ))
        # lectures: duration — convert from varchar to float if needed
        result = conn.execute(text(
            "SELECT data_type FROM information_schema.columns "
            "WHERE table_name='lectures' AND column_name='duration'"
        )).fetchone()
        if result and result[0] == "character varying":
            # All existing duration values are NULL, safe to drop and re-add
            conn.execute(text("ALTER TABLE lectures DROP COLUMN duration"))
            conn.execute(text("ALTER TABLE lectures ADD COLUMN duration FLOAT"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create new tables; existing tables are untouched by create_all
    Base.metadata.create_all(bind=engine)

    # Migrate columns on pre-existing tables
    _run_migrations()

    os.makedirs(settings.upload_dir, exist_ok=True)

    # Load Whisper once at startup so the first request is fast
    whisper_service.load_model()

    yield


app = FastAPI(title="EduScribe AI API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(lecture_router.router)
app.include_router(user_router.router)


@app.get("/")
def root():
    return {"message": "EduScribe AI API v2"}
