from datetime import datetime
from typing import Any, Optional

from sqlmodel import SQLModel


class FormCreate(SQLModel):
    title: str


class FormUpdate(SQLModel):
    title: Optional[str] = None
    status: Optional[str] = None
    settings: Optional[dict[str, Any]] = None


class FormRead(SQLModel):
    id: int
    title: str
    status: str
    settings: dict[str, Any]


class QuestionCreate(SQLModel):
    title: str
    question_type: str = "short_text"
    description: str = ""
    required: bool = False
    position: Optional[int] = None


class QuestionUpdate(SQLModel):
    title: Optional[str] = None
    question_type: Optional[str] = None
    description: Optional[str] = None
    required: Optional[bool] = None
    position: Optional[int] = None


class QuestionRead(SQLModel):
    id: int
    form_id: int
    title: str
    question_type: str
    description: str
    required: bool
    position: int


class OptionCreate(SQLModel):
    text: str
    position: Optional[int] = None


class OptionUpdate(SQLModel):
    text: Optional[str] = None
    position: Optional[int] = None


class OptionRead(SQLModel):
    id: int
    question_id: int
    text: str
    position: int


class ResponseCreate(SQLModel):
    form_id: int
    answers: dict[int, str]


class ResponseRead(SQLModel):
    id: int
    form_id: int
    submitted_at: datetime


class AnswerRead(SQLModel):
    id: int
    response_id: int
    question_id: int
    value: str