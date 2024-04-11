from datetime import date
from typing import Literal, Annotated

from pydantic import BaseModel, ConfigDict, AfterValidator


class SchemeLabelValue(BaseModel):
    name: str
    value: bool | int
    colour: tuple[float, float, float]  # label colour in HSL


class SchemeLabel(BaseModel):
    name: str
    key: str
    type: Literal['single', 'bool', 'multi']
    values: list[SchemeLabelValue]

    parent_key: str | None = None
    parent_val: bool | int | None = None


class DatasetInfoBase(BaseModel):
    model_config = ConfigDict(extra='ignore')

    name: str
    teaser: str

    authors: list[str] | None = None
    contributors: list[str] | None = None

    created_date: date
    last_update: date

    figure: str | None = None


class DatasetInfo(DatasetInfoBase):
    contact: list[str] | None = None


class DatasetInfoFull(DatasetInfoBase):
    model_config = ConfigDict(extra='ignore')
    db_filename: str
    arrow_filename: str
    keywords_filename: str | None = None

    slim_geo_filename: str | None = None
    full_geo_filename: str | None = None

    start_year: int = 1990
    end_year: int = 2024

    scheme: dict[str, SchemeLabel]
    default_colour: str


class DatasetInfoWeb(DatasetInfoFull):
    model_config = ConfigDict(extra='ignore')
    key: str
    total: int
    columns: set[str]


class Document(BaseModel):
    idx: int
    title: str | None = None
    abstract: str | None = None
    publication_year: int | None = None
    openalex_id: str | None = None
    nacsos_id: str | None = None
    doi: str | None = None
    authors: str | None = None
    institutions: str | None = None


# This way, floats are rounded to two decimals to save space in transit
RoundedFloat = Annotated[float, AfterValidator(lambda f: round(f, 2))]


class AnnotatedDocument(Document):
    manual: bool = False  # True, iff labels are from manual annotation
    labels: dict[str, RoundedFloat]
