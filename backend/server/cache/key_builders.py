import hashlib
from typing import Any, Callable, Dict, Optional, Tuple, Protocol, Union, Awaitable

from starlette.requests import Request
from starlette.responses import Response

_Func = Callable[..., Any]


class KeyBuilder(Protocol):
    def __call__(
            self,
            __function: _Func,
            __namespace: str = ...,
            *,
            request: Optional[Request] = ...,
            response: Optional[Response] = ...,
            args: Tuple[Any, ...],
            kwargs: Dict[str, Any],
    ) -> Union[Awaitable[str], str]:
        ...


def default_key_builder(
        func: Callable[..., Any],
        namespace: str = '',
        *,
        request: Optional[Request] = None,
        response: Optional[Response] = None,
        args: Tuple[Any, ...],
        kwargs: Dict[str, Any],
) -> str:
    cache_key = hashlib.md5(  # noqa: S324
        f'{func.__module__}:{func.__name__}:{args}:{kwargs}'.encode()
    ).hexdigest()
    return f'{namespace}:{cache_key}'
