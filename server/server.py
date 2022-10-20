from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.cors import CORSMiddleware

from .utils.logging import get_logger
from .utils.config import settings
from .utils.middlewares import ErrorHandlingMiddleware
from .api import router as api_router

import mimetypes

mimetypes.init()

logger = get_logger('server')

app = FastAPI()

logger.debug('Setting up server and middlewares')
mimetypes.add_type('application/javascript', '.js')

app.add_middleware(ErrorHandlingMiddleware)
if settings.HEADER_TRUSTED_HOST:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.TRUSTED_HOSTS)
    logger.info(f'TrustedHostMiddleware allows the following hosts: {settings.TRUSTED_HOSTS}')
if settings.HEADER_CORS:
    app.add_middleware(CORSMiddleware,
                       allow_origins=settings.CORS_ORIGINS,
                       allow_methods=['GET', 'POST', 'DELETE', 'POST', 'PUT', 'PATCH'],
                       allow_headers=['*'],
                       allow_credentials=True)
    logger.info(f'CORSMiddleware will accept the following origins: {settings.CORS_ORIGINS}')
app.add_middleware(GZipMiddleware, minimum_size=1000)

logger.debug('Setup routers')
app.include_router(api_router, prefix='/api')
app.mount('/tiles', StaticFiles(directory=settings.DATASETS_FOLDER, html=True), name='tiles')
app.mount('/', StaticFiles(directory=settings.STATIC_FILES, html=True), name='static')
