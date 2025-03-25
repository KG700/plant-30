from pydantic_settings import BaseSettings, SettingsConfigDict
import logging

logger = logging.getLogger("uvicorn.error")
logger.setLevel(logging.DEBUG)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(validate_default=False, env_file=".env")
    username: str
    password: str
    mongodb_uri: str


_settings = None


def get_settings():
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
