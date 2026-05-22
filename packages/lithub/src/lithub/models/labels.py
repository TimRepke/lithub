from typing import Literal
from pydantic import BaseModel, Field
from colorsys import rgb_to_hls
from ..util.colours import hsv_to_hex, hsv_to_rgb


class _Label(BaseModel):
    name: str  # Human-readable name
    desc: str | None = None  # Description

    # All colours in HSV
    colour: tuple[float, float, float]
    # optional, if not set, will be set based on colour
    shade1: tuple[float, float, float] = Field(default_factory=lambda data: (data['colour'][0], data['colour'][1] * 0.2, data['colour'][2]))
    shade2: tuple[float, float, float] = Field(default_factory=lambda data: (data['colour'][0], data['colour'][1] * 0.4, data['colour'][2]))

    colour_hex: str = Field(default_factory=lambda data: hsv_to_hex(data['colour']) + 'ff')
    shade1_hex: str = Field(default_factory=lambda data: hsv_to_hex(data['shade1']) + 'ff')
    shade2_hex: str = Field(default_factory=lambda data: hsv_to_hex(data['shade2']) + 'ff')

    colour_rgb: tuple[float, float, float] = Field(default_factory=lambda data: hsv_to_rgb(*data['colour']))
    shade1_rgb: tuple[float, float, float] = Field(default_factory=lambda data: hsv_to_rgb(*data['shade1']))
    shade2_rgb: tuple[float, float, float] = Field(default_factory=lambda data: hsv_to_rgb(*data['shade2']))

    colour_hls: tuple[float, float, float] = Field(default_factory=lambda data: rgb_to_hls(*data['colour_rgb']))
    shade1_hls: tuple[float, float, float] = Field(default_factory=lambda data: rgb_to_hls(*data['shade1_rgb']))
    shade2_hls: tuple[float, float, float] = Field(default_factory=lambda data: rgb_to_hls(*data['shade2_rgb']))

    # Should this group or label be included on the literature hub
    incl_lithub: bool = True


class Label(_Label):
    parent: str  # Group name (typically Group.key)
    value: int  # label value (e.g. technology = 1)
    column: str  # Column in the database (typically {parent}|{value})
    hf_name: str | None = None  # corresponding name in huggingface model (from `label2id` field)


class Group(_Label):
    key: str
    nacsos_key: str | None = None
    type: Literal['single', 'bool', 'multi', 'str']
    collection: str
    labels: list[Label]

    def __str__(self) -> str:
        return f'{self.key} ({self.nacsos_key}) | {self.type} -> {[lab.column for lab in self.labels]}'
