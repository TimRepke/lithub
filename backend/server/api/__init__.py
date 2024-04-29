from fastapi import APIRouter, HTTPException, status as http_status
from starlette.staticfiles import StaticFiles
import logging

from . import basic

logger = logging.getLogger('api')

# this router proxies all /api endpoints
router = APIRouter()

router.include_router(basic.router, prefix='/basic', tags=['basic'])


class FilteredStaticFiles(StaticFiles):
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    async def __call__(self, scope, receive, send) -> None:
        assert scope["type"] == "http"

        path = scope.get('path', '')[len(scope.get('root_path', '')) + 1:]
        if path.endswith('info.toml') or path.count('/') > 1:
            logger.warning(f'Someone tried to access: {path}, which is forbidden.')
            raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN)

        await super().__call__(scope, receive, send)
