import os
import json

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    HOST: str = 'localhost'  # host to run this server on
    PORT: int = 8080  # port for this serve to listen at
    WORKERS: int = 2  # number of worker processes

    API_URL: str = 'http://localhost:8000/api'
    WEB_URL: str = 'http://localhost'  # URL to the web frontend (without trailing /)

    STATIC_FILES: str = './frontend/dist/'  # path to the static files to be served
    DATASETS_FOLDER: str = './data/'

    OPENAPI_FILE: str = '/openapi.json'  # absolute URL path to openapi.json file
    OPENAPI_PREFIX: str = ''  # see https://fastapi.tiangolo.com/advanced/behind-a-proxy/
    ROOT_PATH: str = ''  # see https://fastapi.tiangolo.com/advanced/behind-a-proxy/

    HEADER_CORS: bool = False  # set to true to allow CORS
    HEADER_TRUSTED_HOST: bool = False  # set to true to allow hosts from any origin
    CORS_ORIGINS: list[str] = []  # list of trusted hosts

    CACHE_LIMIT: int = 1024 * 1024 * 128  # Maximum cache size is 128MB
    DOWNLOAD_BUFFER: int = 10240

    MAILING_ENABLED: bool = False
    MAILING_SENDER: str | None = 'Literature Hub <noreply@climateliterature.org>'
    SMTP_TLS: bool = True
    SMTP_START_TLS: bool | None = None
    SMTP_CHECK_CERT: bool = True
    SMTP_PORT: int | None = None
    SMTP_HOST: str | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None

    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> str | list[str]:
        if isinstance(v, str) and not v.startswith('['):
            return [i.strip() for i in v.split(',')]
        if isinstance(v, str) and v.startswith('['):
            ret = json.loads(v)
            if type(ret) is list:
                return ret
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    LOG_CONF_FILE: str = 'config/logging.conf'

    class Config:
        case_sensitive = True


conf_file = os.environ.get('LITHUB_CONFIG')
if not conf_file:
    print('Config file not specified!')

settings = Settings(_env_file=conf_file or 'config/default.env', _env_file_encoding='utf-8')

__all__ = ['settings']
