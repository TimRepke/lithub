from fastapi import APIRouter
import logging

from ..utils.datasets import Dataset, dataset_cache

logger = logging.getLogger('api.datasets')
router = APIRouter()


@router.get('/{dataset}', response_model=Dataset)
async def get_dataset(dataset: str) -> list[Dataset]:
    return dataset_cache.datasets[dataset]


@router.get('/', response_model=list[Dataset])
async def get_datasets() -> list[Dataset]:
    return list(dataset_cache.datasets.values())


@router.put('/', response_model=list[Dataset])
async def reload_datasets() -> list[Dataset]:
    dataset_cache.reload()
    return list(dataset_cache.datasets.values())
