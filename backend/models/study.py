"""Pydantic models for the Hindi Grammar study app (mirrors frontend/src/lib/types.ts)."""

from typing import Literal

from pydantic import BaseModel, Field


class Block(BaseModel):
    """One content block inside a section."""

    kind: Literal[
        "paragraph",
        "points",
        "numbered",
        "table",
        "definition",
        "example",
        "tip",
        "highlight",
    ]
    heading: str | None = None
    text: str | None = None
    items: list[str] | None = None
    headers: list[str] | None = None
    rows: list[list[str]] | None = None


class Section(BaseModel):
    heading: str
    blocks: list[Block]


class TopicSummary(BaseModel):
    id: str
    slug: str
    unit: int
    title: str
    subtitle: str
    icon: str
    read_minutes: int
    order: int
    tags: list[str] = Field(default_factory=list)


class Topic(TopicSummary):
    sections: list[Section]


class Question(BaseModel):
    id: str
    qtype: Literal["mcq", "short", "descriptive"]
    topic_slug: str
    unit: int
    question: str
    options: list[str] | None = None
    answer_index: int | None = None
    explanation: str | None = None
    answer: str | None = None
    marks: int = 1


class Stats(BaseModel):
    topics: int
    mcqs: int
    shorts: int
    descriptives: int
