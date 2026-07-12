from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Answer, Form, Question, Response
from ..schemas import AnswerDetail, ResponseDetail, ResponseListItem

router = APIRouter(prefix="/api/forms", tags=["responses"])


@router.get("/{form_id}/responses", response_model=list[ResponseListItem])
def list_responses(form_id: str, db: Session = Depends(get_db)):
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    responses = (
        db.query(Response)
        .filter(Response.form_id == form_id)
        .order_by(Response.submitted_at.desc())
        .all()
    )

    result = []
    for r in responses:
        answer_count = db.query(func.count(Answer.id)).filter(
            Answer.response_id == r.id
        ).scalar()
        result.append(
            ResponseListItem(
                id=r.id,
                form_id=r.form_id,
                submitted_at=r.submitted_at,
                answer_count=answer_count or 0,
            )
        )
    return result


@router.get("/{form_id}/responses/{response_id}", response_model=ResponseDetail)
def get_response(form_id: str, response_id: str, db: Session = Depends(get_db)):
    response = (
        db.query(Response)
        .options(joinedload(Response.answers).joinedload(Answer.question))
        .filter(Response.id == response_id, Response.form_id == form_id)
        .first()
    )
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")

    answers = []
    for a in response.answers:
        answers.append(
            AnswerDetail(
                id=a.id,
                question_id=a.question_id,
                value=a.value,
                question_title=a.question.title if a.question else None,
                question_type=a.question.type if a.question else None,
            )
        )

    return ResponseDetail(
        id=response.id,
        form_id=response.form_id,
        submitted_at=response.submitted_at,
        answers=answers,
    )
