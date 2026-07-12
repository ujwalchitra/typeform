import re
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Answer, Form, FormStatus, Question, QuestionType, Response
from ..schemas import (
    AnswerDetail,
    FormDetail,
    QuestionResponse,
    ResponseDetail,
    ResponseListItem,
    ResponseSubmit,
)

router = APIRouter(prefix="/api/public", tags=["public"])


def _validate_answer(question: Question, value: str | None) -> str | None:
    if question.required and (value is None or value.strip() == ""):
        raise HTTPException(
            status_code=400,
            detail=f"Question '{question.title}' is required",
        )

    if value is None or value.strip() == "":
        return None

    value = value.strip()

    if question.type == QuestionType.EMAIL:
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, value):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid email format for '{question.title}'",
            )

    if question.type == QuestionType.NUMBER:
        try:
            float(value)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid number for '{question.title}'",
            )

    if question.type == QuestionType.RATING:
        try:
            rating = int(value)
            max_rating = (question.settings or {}).get("max_rating", 5)
            if rating < 1 or rating > max_rating:
                raise HTTPException(
                    status_code=400,
                    detail=f"Rating must be between 1 and {max_rating}",
                )
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid rating for '{question.title}'",
            )

    if question.type in (QuestionType.MULTIPLE_CHOICE, QuestionType.DROPDOWN):
        if question.options and value not in question.options:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid option for '{question.title}'",
            )

    if question.type == QuestionType.YES_NO:
        if value not in ("Yes", "No"):
            raise HTTPException(
                status_code=400,
                detail=f"Answer must be Yes or No for '{question.title}'",
            )

    return value


@router.get("/forms/{slug}", response_model=FormDetail)
def get_public_form(slug: str, db: Session = Depends(get_db)):
    form = (
        db.query(Form)
        .options(joinedload(Form.questions))
        .filter(Form.share_slug == slug, Form.status == FormStatus.PUBLISHED)
        .first()
    )
    if not form:
        raise HTTPException(status_code=404, detail="Form not found or not published")
    return FormDetail(
        id=form.id,
        title=form.title,
        description=form.description,
        status=form.status,
        share_slug=form.share_slug,
        thank_you_title=form.thank_you_title,
        thank_you_message=form.thank_you_message,
        created_at=form.created_at,
        updated_at=form.updated_at,
        questions=[QuestionResponse.model_validate(q) for q in form.questions],
    )


@router.post("/forms/{slug}/responses", response_model=ResponseDetail, status_code=201)
def submit_response(slug: str, data: ResponseSubmit, db: Session = Depends(get_db)):
    form = (
        db.query(Form)
        .options(joinedload(Form.questions))
        .filter(Form.share_slug == slug, Form.status == FormStatus.PUBLISHED)
        .first()
    )
    if not form:
        raise HTTPException(status_code=404, detail="Form not found or not published")

    question_map = {q.id: q for q in form.questions}
    answer_map = {a.question_id: a.value for a in data.answers}

    for q in form.questions:
        if q.required and q.id not in answer_map:
            raise HTTPException(
                status_code=400,
                detail=f"Question '{q.title}' is required",
            )

    validated_answers = []
    for answer in data.answers:
        question = question_map.get(answer.question_id)
        if not question:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown question ID: {answer.question_id}",
            )
        validated_value = _validate_answer(question, answer.value)
        validated_answers.append((question, validated_value))

    response = Response(form_id=form.id)
    db.add(response)
    db.flush()

    created_answers: list[tuple[Answer, Question, str | None]] = []
    for question, value in validated_answers:
        answer = Answer(
            response_id=response.id,
            question_id=question.id,
            value=value,
        )
        db.add(answer)
        created_answers.append((answer, question, value))

    db.flush()

    answer_details = [
        AnswerDetail(
            id=answer.id,
            question_id=question.id,
            value=value,
            question_title=question.title,
            question_type=question.type,
        )
        for answer, question, value in created_answers
    ]

    db.commit()
    db.refresh(response)

    return ResponseDetail(
        id=response.id,
        form_id=form.id,
        submitted_at=response.submitted_at,
        answers=answer_details,
    )
