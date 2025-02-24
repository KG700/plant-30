from pydantic_settings import BaseSettings, SettingsConfigDict
import logging

logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)

class Settings(BaseSettings):
    username: str
    password: str
    
    model_config = SettingsConfigDict(env_file=".env")