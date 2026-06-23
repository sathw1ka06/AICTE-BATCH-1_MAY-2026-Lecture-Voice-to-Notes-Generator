from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:password@localhost:5432/eduscribe"
    secret_key: str = "change-this-to-a-long-random-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    upload_dir: str = "uploads"
    max_file_size_mb: int = 25

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    class Config:
        env_file = ".env"


settings = Settings()
