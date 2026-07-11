# backend/app/routes/questions.py

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.crud import (
    create_question,
    delete_question,
    get_question_by_id,
    get_questions,
    update_question,
)
from app.database import get_session
from app.schemas import (
    QuestionCreate,
    QuestionRead,
    QuestionUpdate,
)

router = APIRouter(tags=["Questions"])


@router.get(
    "/forms/{form_id}/questions",
    response_model=list[QuestionRead],
)
def list_questions(
    form_id: int,
    session: Session = Depends(get_session),
):
    return get_questions(session, form_id)


@router.post(
    "/forms/{form_id}/questions",
    response_model=QuestionRead,
)
def add_question(
    form_id: int,
    question_data: QuestionCreate,
    session: Session = Depends(get_session),
):
    question = create_question(
        session,
        form_id,
        question_data,
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Form not found",
        )

    return question


@router.get(
    "/questions/{question_id}",
    response_model=QuestionRead,
)
def get_single_question(
    question_id: int,
    session: Session = Depends(get_session),
):
    question = get_question_by_id(
        session,
        question_id,
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found",
        )

    return question


@router.patch(
    "/questions/{question_id}",
    response_model=QuestionRead,
)
def edit_question(
    question_id: int,
    question_data: QuestionUpdate,
    session: Session = Depends(get_session),
):
    question = update_question(
        session,
        question_id,
        question_data,
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found",
        )

    return question


@router.delete("/questions/{question_id}")
def remove_question(
    question_id: int,
    session: Session = Depends(get_session),
):
    result = delete_question(
        session,
        question_id,
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Question not found",
        )

    return result