from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    app_name: str = "LegalIt"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    data_dir: Path = PROJECT_ROOT / "data"
    upload_dir: Path = PROJECT_ROOT / "data" / "uploads"
    database_url: str | None = None
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    session_cookie_name: str = "legalit_session"
    session_ttl_seconds: int = 43_200
    groq_api_key: str | None = None
    groq_model: str = "llama-3.3-70b-versatile"
    groq_timeout_seconds: float = 30.0
    max_ai_input_chars: int = 6_000
    max_ai_output_tokens: int = 1_200
    retrieval_result_count: int = 8
    max_upload_bytes: int = 15 * 1024 * 1024
    login_rate_limit: int = 10
    ai_rate_limit: int = 30
    rate_limit_window_seconds: int = 60

    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @property
    def resolved_database_url(self) -> str:
        return self.database_url or f"sqlite:///{(self.data_dir / 'legalit.db').as_posix()}"

    def ensure_directories(self) -> None:
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.upload_dir.mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    return Settings()
