from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
import json
from ..database import get_session
from ..models import Form
from ..schemas import FormCreate, FormUpdate, FormRead
from app.crud import (
    create_form,
    delete_form,
    get_form_by_id,
    get_forms,
    update_form,
)

router = APIRouter(
    prefix="/forms",
    tags=["Forms"],
)

# --- CREATE FORM ---
@router.post(
    "/",
    response_model=FormRead,
)
def add_form(
    form: FormCreate,
    session: Session = Depends(get_session),
):
    return create_form(
        session,
        form.title,
    )

# --- LIST ALL FORMS ---
@router.get(
    "/",
    response_model=list[FormRead],
)
def list_forms(
    session: Session = Depends(get_session),
):
    return get_forms(session)

# ============================================================
# SPECIFIC PATCH ROUTES (must come before generic /{form_id})
# ============================================================

# PUBLISH
@router.patch("/{form_id}/publish")
def publish_form(
    form_id: int,
    session: Session = Depends(get_session),
):
    form = get_form_by_id(session, form_id)
    if not form:
        raise HTTPException(
            status_code=404,
            detail="Form not found",
        )
    
    form.status = "published"
    session.commit()
    session.refresh(form)
    return {"message": "Form published", "form": form}

# UNPUBLISH
@router.patch("/{form_id}/unpublish")
def unpublish_form(
    form_id: int,
    session: Session = Depends(get_session),
):
    form = get_form_by_id(session, form_id)
    if not form:
        raise HTTPException(
            status_code=404,
            detail="Form not found",
        )
    
    form.status = "draft"
    session.commit()
    session.refresh(form)
    return {"message": "Form unpublished", "form": form}

# SETTINGS - MUST COME BEFORE GENERIC /{form_id}
@router.patch("/{form_id}/settings")
def update_form_settings(
    form_id: int,
    settings: dict,
    session: Session = Depends(get_session),
):
    form = session.get(Form, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    form.settings = json.dumps(settings)
    session.commit()
    session.refresh(form)
    return {"message": "Settings updated successfully", "settings": json.loads(form.settings)}

# ============================================================
# GENERIC /{form_id} ROUTES (must come LAST)
# ============================================================

# GET SINGLE FORM
@router.get(
    "/{form_id}",
    response_model=FormRead,
)
def get_single_form(
    form_id: int,
    session: Session = Depends(get_session),
):
    form = get_form_by_id(
        session,
        form_id,
    )
    if not form:
        raise HTTPException(
            status_code=404,
            detail="Form not found",
        )
    return form

# UPDATE FORM (GENERIC)
@router.patch(
    "/{form_id}",
    response_model=FormRead,
)
def edit_form(
    form_id: int,
    form_data: FormUpdate,
    session: Session = Depends(get_session),
):
    form = update_form(
        session,
        form_id,
        form_data,
    )
    if not form:
        raise HTTPException(
            status_code=404,
            detail="Form not found",
        )
    return form

# DELETE FORM
@router.delete("/{form_id}")
def remove_form(
    form_id: int,
    session: Session = Depends(get_session),
):
    result = delete_form(
        session,
        form_id,
    )
    if not result:
        raise HTTPException(
            status_code=404,
            detail="Form not found",
        )
    return result