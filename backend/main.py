# !/usr/bin/env python3
from server.logging import get_logger

logger = get_logger('server')

logger.info('Starting up server')
from server.__main__ import app  # noqa: E402


@app.on_event('startup')
async def init_system() -> None:
    logger.info('[startup hook] Collecting models...')
    # TODO cache models stored in /data

