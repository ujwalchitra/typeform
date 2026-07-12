import re
from collections import Counter
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Answer, Form, FormStatus, Question, QuestionType, Response, generate_id, generate_slug
from ..schemas import (
    FormCreate,
    FormDetail,
    FormListItem,
    FormStats,
    FormUpdate,
    PublishUpdate,
    QuestionCreate,
    QuestionReorderItem,
    QuestionResponse,
    QuestionStat,
    QuestionUpdate,
)

router = APIRouter(prefix="/api/forms", tags=["forms"])


def _form_to_detail(form: Form) -> FormDetail:
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


@router.get("", response_model=list[FormListItem])
def list_forms(db: Session = Depends(get_db)):
    forms = db.query(Form).order_by(Form.updated_at.desc()).all()
    result = []
    for form in forms:
        response_count = db.query(func.count(Response.id)).filter(
            Response.form_id == form.id
        ).scalar()
        result.append(
            FormListItem(
                id=form.id,
                title=form.title,
                description=form.description,
                status=form.status,
                share_slug=form.share_slug,
                response_count=response_count or 0,
                question_count=len(form.questions),
                created_at=form.created_at,
                updated_at=form.updated_at,
            )
        )
    return result


@router.post("", response_model=FormDetail, status_code=201)
def create_form(data: FormCreate, db: Session = Depends(get_db)):
    form = Form(title=data.title, description=data.description)
    db.add(form)
    db.commit()
    db.refresh(form)
    return _form_to_detail(form)


@router.get("/{form_id}", response_model=FormDetail)
def get_form(form_id: str, db: Session = Depends(get_db)):
    form = (
        db.query(Form)
        .options(joinedload(Form.questions))
        .filter(Form.id == form_id)
        .first()
    )
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return _form_to_detail(form)


@router.put("/{form_id}", response_model=FormDetail)
def update_form(form_id: str, data: FormUpdate, db: Session = Depends(get_db)):
    form = (
        db.query(Form)
        .options(joinedload(Form.questions))
        .filter(Form.id == form_id)
        .first()
    )
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    if data.title is not None:
        form.title = data.title
    if data.description is not None:
        form.description = data.description
    if data.thank_you_title is not None:
        form.thank_you_title = data.thank_you_title
    if data.thank_you_message is not None:
        form.thank_you_message = data.thank_you_message
    form.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(form)
    return _form_to_detail(form)


@router.delete("/{form_id}", status_code=204)
def delete_form(form_id: str, db: Session = Depends(get_db)):
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    db.delete(form)
    db.commit()


@router.post("/{form_id}/duplicate", response_model=FormDetail, status_code=201)
def duplicate_form(form_id: str, db: Session = Depends(get_db)):
    form = (
        db.query(Form)
        .options(joinedload(Form.questions))
        .filter(Form.id == form_id)
        .first()
    )
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    new_form = Form(
        title=f"{form.title} (Copy)",
        description=form.description,
        status=FormStatus.DRAFT,
        share_slug=generate_slug(),
        thank_you_title=form.thank_you_title,
        thank_you_message=form.thank_you_message,
    )
    db.add(new_form)
    db.flush()

    for q in form.questions:
        new_q = Question(
            form_id=new_form.id,
            type=q.type,
            title=q.title,
            description=q.description,
            required=q.required,
            order=q.order,
            options=q.options,
            settings=q.settings,
        )
        db.add(new_q)

    db.commit()
    db.refresh(new_form)
    new_form = (
        db.query(Form)
        .options(joinedload(Form.questions))
        .filter(Form.id == new_form.id)
        .first()
    )
    return _form_to_detail(new_form)


@router.patch("/{form_id}/publish", response_model=FormDetail)
def publish_form(form_id: str, data: PublishUpdate, db: Session = Depends(get_db)):
    form = (
        db.query(Form)
        .options(joinedload(Form.questions))
        .filter(Form.id == form_id)
        .first()
    )
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    if data.publish and len(form.questions) == 0:
        raise HTTPException(status_code=400, detail="Cannot publish a form with no questions")

    form.status = FormStatus.PUBLISHED if data.publish else FormStatus.DRAFT
    form.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(form)
    return _form_to_detail(form)


@router.post("/{form_id}/questions", response_model=QuestionResponse, status_code=201)
def add_question(form_id: str, data: QuestionCreate, db: Session = Depends(get_db)):
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    max_order = db.query(func.max(Question.order)).filter(
        Question.form_id == form_id
    ).scalar() or -1

    options = data.options
    if data.type in (QuestionType.MULTIPLE_CHOICE, QuestionType.DROPDOWN) and not options:
        options = ["Option 1", "Option 2", "Option 3"]

    question = Question(
        form_id=form_id,
        type=data.type,
        title=data.title,
        description=data.description,
        required=data.required,
        order=max_order + 1,
        options=options,
        settings=data.settings,
    )
    db.add(question)
    form.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(question)
    return QuestionResponse.model_validate(question)


@router.put("/{form_id}/questions/{question_id}", response_model=QuestionResponse)
def update_question(
    form_id: str,
    question_id: str,
    data: QuestionUpdate,
    db: Session = Depends(get_db),
):
    question = (
        db.query(Question)
        .filter(Question.id == question_id, Question.form_id == form_id)
        .first()
    )
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    if data.type is not None:
        question.type = data.type
    if data.title is not None:
        question.title = data.title
    if data.description is not None:
        question.description = data.description
    if data.required is not None:
        question.required = data.required
    if data.options is not None:
        question.options = data.options
    if data.settings is not None:
        question.settings = data.settings

    form = db.query(Form).filter(Form.id == form_id).first()
    if form:
        form.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(question)
    return QuestionResponse.model_validate(question)


@router.delete("/{form_id}/questions/{question_id}", status_code=204)
def delete_question(form_id: str, question_id: str, db: Session = Depends(get_db)):
    question = (
        db.query(Question)
        .filter(Question.id == question_id, Question.form_id == form_id)
        .first()
    )
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(question)
    db.commit()


@router.put("/{form_id}/questions/reorder", response_model=list[QuestionResponse])
def reorder_questions(
    form_id: str,
    items: list[QuestionReorderItem],
    db: Session = Depends(get_db),
):
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    for item in items:
        question = (
            db.query(Question)
            .filter(Question.id == item.id, Question.form_id == form_id)
            .first()
        )
        if question:
            question.order = item.order

    form.updated_at = datetime.utcnow()
    db.commit()

    questions = (
        db.query(Question)
        .filter(Question.form_id == form_id)
        .order_by(Question.order)
        .all()
    )
    return [QuestionResponse.model_validate(q) for q in questions]


@router.get("/{form_id}/stats", response_model=FormStats)
def get_form_stats(form_id: str, db: Session = Depends(get_db)):
    form = (
        db.query(Form)
        .options(joinedload(Form.questions))
        .filter(Form.id == form_id)
        .first()
    )
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    total_responses = db.query(func.count(Response.id)).filter(
        Response.form_id == form_id
    ).scalar() or 0

    question_stats = []
    for q in form.questions:
        answers = (
            db.query(Answer.value)
            .join(Response)
            .filter(Answer.question_id == q.id, Response.form_id == form_id)
            .all()
        )
        values = [a[0] for a in answers if a[0] is not None and a[0] != ""]
        stat = QuestionStat(
            question_id=q.id,
            question_title=q.title,
            question_type=q.type,
            total_answers=len(values),
        )

        if q.type in (QuestionType.MULTIPLE_CHOICE, QuestionType.DROPDOWN, QuestionType.YES_NO):
            counter = Counter(values)
            stat.distribution = dict(counter)
        elif q.type == QuestionType.RATING:
            nums = [float(v) for v in values if v and v.replace(".", "", 1).isdigit()]
            if nums:
                stat.average = round(sum(nums) / len(nums), 2)
                counter = Counter(values)
                stat.distribution = dict(counter)
        elif q.type == QuestionType.NUMBER:
            nums = []
            for v in values:
                try:
                    nums.append(float(v))
                except ValueError:
                    pass
            if nums:
                stat.average = round(sum(nums) / len(nums), 2)

        question_stats.append(stat)

    return FormStats(total_responses=total_responses, question_stats=question_stats)
