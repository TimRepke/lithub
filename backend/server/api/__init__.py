from fastapi import APIRouter

from . import basic

# this router proxies all /api endpoints
router = APIRouter()

router.include_router(basic.router, prefix='/basic', tags=['basic'])

# router.include_router(datasets.router, prefix='/datasets', tags=['datasets'])
