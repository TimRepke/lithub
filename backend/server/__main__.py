from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.cors import CORSMiddleware

from .logging import get_logger
from .config import settings
from .middlewares import ErrorHandlingMiddleware, TimingMiddleware
from .api import router as api_router

import mimetypes

mimetypes.init()

logger = get_logger('server')

app = FastAPI(openapi_url=settings.OPENAPI_FILE,
              openapi_prefix=settings.OPENAPI_PREFIX,
              root_path=settings.ROOT_PATH)

logger.debug('Setting up server and middlewares')
mimetypes.add_type('application/javascript', '.js')

app.add_middleware(ErrorHandlingMiddleware)
if settings.HEADER_TRUSTED_HOST:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.TRUSTED_HOSTS)
    logger.info(f'TrustedHostMiddleware allows the following hosts: {settings.TRUSTED_HOSTS}')
if settings.HEADER_CORS:
    app.add_middleware(CORSMiddleware,
                       allow_origins=['*'],
                       allow_methods=['GET', 'POST', 'DELETE', 'POST', 'PUT', 'PATCH'],
                       allow_headers=['*'],
                       allow_credentials=True)
    logger.info(f'CORSMiddleware will accept the following origins: {settings.CORS_ORIGINS}')
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(TimingMiddleware)

logger.debug('Setup routers')
app.include_router(api_router, prefix='/api')

logger.info(f'Dataset files to {settings.DATASETS_FOLDER}')
app.mount('/data', StaticFiles(directory=Path(settings.DATASETS_FOLDER).absolute()), name='data')

logger.info(f'Static files to {settings.STATIC_FILES}')
app.mount('/', StaticFiles(directory=settings.STATIC_FILES, html=True), name='static')
