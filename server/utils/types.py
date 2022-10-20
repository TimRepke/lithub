from pydantic import BaseModel


class BaseItem(BaseModel):
    doc_id: int
    nacsos_id: str | None
    doi: str | None
    title: str
    abstract: str | None
    year: int | None
    authors: list[str] | None

    x: float
    y: float

    # for internal use
    RowNum: int | None = None


class Document(BaseItem):
    pass


DocumentAnnotation = dict[str, list[str]]


class AnnotatedDocument(Document):
    annotations: DocumentAnnotation | None


class Scheme(BaseModel):
    scheme_id: int
    label: str
    choices: list[str]
    description: str | None


class Label(BaseModel):
    label_id: int
    doc_id: int
    label: int
    choice: int
    confidence: float | None


class SchemeInfo(BaseModel):
    scheme_id: int
    label: str
    description: str | None
    choices: dict[str, int]  # same as in Schema but with num of docs
    s2i: dict[str, int]  # lookup map (string to int)
    i2s: list[str]  # lookup map (int to string)


class UnknownDatatypeError(ValueError):
    pass
