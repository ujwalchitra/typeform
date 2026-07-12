from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from .models import FormStatus, QuestionType


class QuestionCreate(BaseModel):
    type: QuestionType
    title: str = ""
    description: str | None = None
    required: bool = False
    options: list[str] | None = None
    settings: dict[str, Any] | None = None


class QuestionUpdate(BaseModel):
    type: QuestionType | None = None
    title: str | None = None
    description: str | None = None
    required: bool | None = None
    options: list[str] | None = None
    settings: dict[str, Any] | None = None


class QuestionResponse(BaseModel):
    id: str
    form_id: str
    type: QuestionType
    title: str
    description: str | None
    required: bool
    order: int
    options: list[str] | None
    settings: dict[str, Any] | None

    model_config = {"from_attributes": True}


class QuestionReorderItem(BaseModel):
    id: str
    order: int


class FormCreate(BaseModel):
    title: str = "Untitled Form"
    description: str | None = None


class FormUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    thank_you_title: str | None = None
    thank_you_message: str | None = None


class FormListItem(BaseModel):
    id: str
    title: str
    description: str | None
    status: FormStatus
    share_slug: str
    response_count: int
    question_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FormDetail(BaseModel):
    id: str
    title: str
    description: str | None
    status: FormStatus
    share_slug: str
    thank_you_title: str
    thank_you_message: str
    created_at: datetime
    updated_at: datetime
    questions: list[QuestionResponse]

    model_config = {"from_attributes": True}


class PublishUpdate(BaseModel):
    publish: bool


class AnswerSubmit(BaseModel):
    question_id: str
    value: str | None = None


class ResponseSubmit(BaseModel):
    answers: list[AnswerSubmit]


class AnswerDetail(BaseModel):
    id: str
    question_id: str
    value: str | None
    question_title: str | None = None
    question_type: QuestionType | None = None

    model_config = {"from_attributes": True}


class ResponseListItem(BaseModel):
    id: str
    form_id: str
    submitted_at: datetime
    answer_count: int

    model_config = {"from_attributes": True}


class ResponseDetail(BaseModel):
    id: str
    form_id: str
    submitted_at: datetime
    answers: list[AnswerDetail]

    model_config = {"from_attributes": True}


class QuestionStat(BaseModel):
    question_id: str
    question_title: str
    question_type: QuestionType
    total_answers: int
    distribution: dict[str, int] | None = None
    average: float | None = None


class FormStats(BaseModel):
    total_responses: int
    question_stats: list[QuestionStat]
