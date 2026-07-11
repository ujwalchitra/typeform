from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import Column, JSON
from sqlmodel import Field, Relationship, SQLModel


class Form(SQLModel, table=True):
    id: Optional[int] = Field(
        default=None,
        primary_key=True,
    )

    title: str
    status: str = "draft"

    # Stores theme/settings as JSON in SQLite.
    settings: dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSON, nullable=False),
    )

    questions: list["Question"] = Relationship(
        back_populates="form",
        cascade_delete=True,
    )


class Question(SQLModel, table=True):
    id: Optional[int] = Field(
        default=None,
        primary_key=True,
    )

    form_id: int = Field(
        foreign_key="form.id",
        index=True,
    )

    title: str
    question_type: str = "short_text"
    description: str = ""
    required: bool = False
    position: int = 0

    form: Optional[Form] = Relationship(
        back_populates="questions",
    )

    options: list["QuestionOption"] = Relationship(
        back_populates="question",
        cascade_delete=True,
    )


class QuestionOption(SQLModel, table=True):
    id: Optional[int] = Field(
        default=None,
        primary_key=True,
    )

    question_id: int = Field(
        foreign_key="question.id",
        index=True,
    )

    text: str
    position: int = 0

    question: Optional[Question] = Relationship(
        back_populates="options",
    )


class Response(SQLModel, table=True):
    id: Optional[int] = Field(
        default=None,
        primary_key=True,
    )

    form_id: int = Field(
        foreign_key="form.id",
        index=True,
    )

    submitted_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class Answer(SQLModel, table=True):
    id: Optional[int] = Field(
        default=None,
        primary_key=True,
    )

    response_id: int = Field(
        foreign_key="response.id",
        index=True,
    )

    question_id: int = Field(
        foreign_key="question.id",
        index=True,
    )

    value: str