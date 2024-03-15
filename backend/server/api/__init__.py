from fastapi import APIRouter

from . import datasets
from . import data

# this router proxies all /api endpoints
router = APIRouter()

router.include_router(datasets.router, prefix='/datasets', tags=['datasets'])
router.include_router(data.router, prefix='/data', tags=['data'])
