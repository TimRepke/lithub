from fastapi import APIRouter
from . import ping
from . import datasets
from . import data
from . import tiles
from . import points

# this router proxies all /api endpoints
router = APIRouter()

router.include_router(ping.router, prefix='/ping', tags=['ping'])
router.include_router(datasets.router, prefix='/datasets', tags=['datasets'])
router.include_router(data.router, prefix='/data/{dataset}', tags=['data'])
router.include_router(points.router, prefix='/points', tags=['points'])
