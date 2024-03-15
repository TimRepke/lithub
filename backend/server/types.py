from pydantic import BaseModel


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


class AnnotatedDocument(Document):
    manual: bool  # True, iff labels are from manual annotation
    labels: dict[str, float]
