from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from ..database import get_session
from ..models import Response, Answer, Form, Question
from ..schemas import ResponseCreate, ResponseRead

router = APIRouter(
    prefix="/responses",
    tags=["Responses"],
)

@router.post("/")
def submit_response(
    response_data: ResponseCreate,
    session: Session = Depends(get_session),
):
    # Check if form exists
    form = session.get(Form, response_data.form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    # Create response
    db_response = Response(form_id=response_data.form_id)
    session.add(db_response)
    session.commit()
    session.refresh(db_response)
    
    # Create answers
    for question_id, value in response_data.answers.items():
        question = session.get(Question, int(question_id))
        if not question:
            continue
        
        answer = Answer(
            response_id=db_response.id,
            question_id=int(question_id),
            value=str(value),
        )
        session.add(answer)
    
    session.commit()
    
    return {"message": "Response submitted successfully", "id": db_response.id}

@router.get("/form/{form_id}")
def get_form_responses(
    form_id: int,
    session: Session = Depends(get_session),
):
    responses = session.exec(
        select(Response).where(Response.form_id == form_id)
    ).all()
    return responses

@router.get("/answers/response/{response_id}")
def get_response_answers(
    response_id: int,
    session: Session = Depends(get_session),
):
    answers = session.exec(
        select(Answer).where(Answer.response_id == response_id)
    ).all()
    return answers