from fastapi import APIRouter
from fastapi.responses import PlainTextResponse
import logging

logger = logging.getLogger('api.ping')
router = APIRouter()


@router.get('/', response_class=PlainTextResponse)
async def _pong() -> str:
    print('test')
    logger.debug('ping test DEBUG log')
    logger.info('ping test INFO log')
    logger.warning('ping test WARNING log')
    logger.error('ping test ERROR log')
    logger.fatal('ping test FATAL log')
    return 'pong'


class ExampleError(Exception):
    pass


@router.get('/error', response_class=PlainTextResponse)
async def _err() -> str:
    raise ExampleError('Error in your face!')


class ExampleWarning(Warning):
    pass


class Example2Warning(Warning):
    def __str__(self) -> str:
        return self.args[0]


@router.get('/warn', response_class=PlainTextResponse)
async def _warn() -> str:
    raise ExampleWarning('Warning in your face!', {'a': 'test'})


@router.get('/warn2', response_class=PlainTextResponse)
async def _warn2() -> str:
    raise Example2Warning('Warning in your face!', {'a': 'test'})


@router.post('/{name}', response_class=PlainTextResponse)
async def _ping(name: str) -> str:
    return f'Hello {name}'
