from pydantic_settings import BaseSettings, SettingsConfigDict
import logging

logger = logging.getLogger("uvicorn.error")
logger.setLevel(logging.DEBUG)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        validate_default=False, env_file=".env", extra="allow"
    )
    username: str
    password: str
    mongodb_uri: str
    login_url: str
    token_url: str
    user_url: str
    redirect_url: str
    google_client_id: str


_settings = None


def get_settings():
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
