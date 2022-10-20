import json
from typing import Literal, Any, TypeVar
import logging
from pydantic import BaseModel
from fastapi import HTTPException, status as http_status
from fastapi.exception_handlers import http_exception_handler
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger('middlewares')


class ErrorDetail(BaseModel):
    # The type of exception
    type: str
    # Whether it was a warning or Error/Exception
    level: Literal['WARNING', 'ERROR']
    # The message/cause of the Warning/Exception
    message: str
    # attached args
    args: list[Any]


Error = TypeVar('Error', bound=Warning | Exception)


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    @classmethod
    def _resolve_args(cls, ew: Error) -> list[Any]:
        if hasattr(ew, 'args') and ew.args is not None and len(ew.args) > 0:
            ret = []
            for arg in ew.args:
                try:
                    json.dumps(arg)  # test if this is json-serializable
                    ret.append(arg)
                except TypeError:
                    ret.append(repr(arg))
            return ret
        return [repr(ew)]

    @classmethod
    def _resolve_status(cls, ew: Error) -> int:
        if hasattr(ew, 'status'):
            error_status = getattr(ew, 'status')
            if type(error_status) == int:
                return error_status
        return http_status.HTTP_400_BAD_REQUEST

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        try:
            response = await call_next(request)
            return response
        except (Exception, Warning) as ew:
            logger.exception(ew)
            return await http_exception_handler(
                request,
                exc=HTTPException(
                    status_code=self._resolve_status(ew),
                    detail=ErrorDetail(level='WARNING' if isinstance(ew, Warning) else 'ERROR',
                                       type=ew.__class__.__name__,
                                       message=str(ew),
                                       args=self._resolve_args(ew)).dict()
                ))
