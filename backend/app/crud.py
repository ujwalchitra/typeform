from sqlmodel import Session, select
import json

from app.models import Form, Question, QuestionOption
from app.schemas import QuestionCreate, QuestionUpdate, FormUpdate, OptionCreate, OptionUpdate


def update_form(
    session: Session,
    form_id: int,
    form_data: FormUpdate,
):
    form = session.get(Form, form_id)

    if not form:
        return None

    update_data = form_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(form, field, value)

    session.add(form)
    session.commit()
    session.refresh(form)

    return form


def create_form(session: Session, title: str):
    form = Form(title=title)

    session.add(form)
    session.commit()
    session.refresh(form)

    return form


def get_forms(session: Session):
    statement = select(Form)
    return session.exec(statement).all()


def get_form_by_id(session: Session, form_id: int):
    return session.get(Form, form_id)


def delete_form(session: Session, form_id: int):
    form = session.get(Form, form_id)

    if not form:
        return None

    session.delete(form)
    session.commit()

    return {"message": "Form deleted successfully"}


def get_questions(session: Session, form_id: int):
    statement = (
        select(Question)
        .where(Question.form_id == form_id)
        .order_by(Question.position)
    )

    return session.exec(statement).all()


def create_question(
    session: Session,
    form_id: int,
    question_data: QuestionCreate,
):
    form = session.get(Form, form_id)

    if not form:
        return None

    questions = get_questions(session, form_id)

    position = (
        question_data.position
        if question_data.position is not None
        else len(questions)
    )

    question = Question(
        form_id=form_id,
        title=question_data.title,
        question_type=question_data.question_type,
        description=question_data.description,
        required=question_data.required,
        position=position,
    )

    session.add(question)
    session.commit()
    session.refresh(question)

    return question


def get_question_by_id(
    session: Session,
    question_id: int,
):
    return session.get(Question, question_id)


def update_question(
    session: Session,
    question_id: int,
    question_data: QuestionUpdate,
):
    question = session.get(Question, question_id)

    if not question:
        return None

    update_data = question_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(question, field, value)

    session.add(question)
    session.commit()
    session.refresh(question)

    return question


def delete_question(
    session: Session,
    question_id: int,
):
    question = session.get(Question, question_id)

    if not question:
        return None

    session.delete(question)
    session.commit()

    return {"message": "Question deleted successfully"}


def get_options(
    session: Session,
    question_id: int,
):
    statement = (
        select(QuestionOption)
        .where(
            QuestionOption.question_id == question_id
        )
        .order_by(QuestionOption.position)
    )

    return session.exec(statement).all()


def create_option(
    session: Session,
    question_id: int,
    option_data: OptionCreate,
):
    question = session.get(Question, question_id)

    if not question:
        return None

    options = get_options(session, question_id)

    position = (
        option_data.position
        if option_data.position is not None
        else len(options)
    )

    option = QuestionOption(
        question_id=question_id,
        text=option_data.text,
        position=position,
    )

    session.add(option)
    session.commit()
    session.refresh(option)

    return option


def update_option(
    session: Session,
    option_id: int,
    option_data: OptionUpdate,
):
    option = session.get(QuestionOption, option_id)

    if not option:
        return None

    update_data = option_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(option, field, value)

    session.add(option)
    session.commit()
    session.refresh(option)

    return option


def delete_option(
    session: Session,
    option_id: int,
):
    option = session.get(QuestionOption, option_id)

    if not option:
        return None

    session.delete(option)
    session.commit()

    return {
        "message": "Option deleted successfully"
    }