from typing import Any
import secrets
import json
import toml
import os

from pydantic import BaseSettings, AnyHttpUrl, validator


class Settings(BaseSettings):
    API_URL: str = 'http://localhost:8000/api'
    HOST: str = 'localhost'  # host to run this server on
    PORT: int = 8080  # port for this serve to listen at
    DEBUG_MODE: bool = False  # set this to true in order to get more detailed logs
    WORKERS: int = 2  # number of worker processes
    STATIC_FILES: str = './frontend/dist/'  # path to the static files to be served
    DATASETS_FOLDER: str = './data/'

    HASH_ALGORITHM: str = 'HS256'
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # = 8 days

    HEADER_CORS: bool = False  # set to true to allow CORS
    HEADER_TRUSTED_HOST: bool = False  # set to true to allow hosts from any origin
    CORS_ORIGINS: list[AnyHttpUrl] = []  # list of trusted hosts

    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: str | list[str]) -> str | list[str]:
        if isinstance(v, str) and not v.startswith('['):
            return [i.strip() for i in v.split(',')]
        if isinstance(v, str) and v.startswith('['):
            ret = json.loads(v)
            if type(ret) == list:
                return [AnyHttpUrl(r) for r in ret]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    LOG_CONF_FILE: str = 'config/logging.conf'
    LOGGING_CONF: dict[str, Any] | None = None

    @validator('LOGGING_CONF', pre=True)
    def read_logging_config(cls, v: dict[str, Any] | None, values: dict[str, str]) -> dict[str, Any]:
        if isinstance(v, dict):
            return v
        filename = values.get('LOG_CONF_FILE', None)
        if filename is not None:
            with open(filename, 'r') as f:
                ret = toml.loads(f.read())
                if type(ret) == dict:
                    return ret
        raise ValueError('Logging config invalid!')

    class Config:
        case_sensitive = True


conf_file = os.environ.get('NACSOS_TE_CONFIG', 'config/default.env')
settings = Settings(_env_file=conf_file, _env_file_encoding='utf-8')

__all__ = ['settings']
