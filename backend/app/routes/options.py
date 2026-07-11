from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.crud import (
    create_option,
    delete_option,
    get_options,
    update_option,
)
from app.database import get_session
from app.schemas import (
    OptionCreate,
    OptionRead,
    OptionUpdate,
)

router = APIRouter(tags=["Options"])


@router.get(
    "/questions/{question_id}/options",
    response_model=list[OptionRead],
)
def list_options(
    question_id: int,
    session: Session = Depends(get_session),
):
    return get_options(
        session,
        question_id,
    )


@router.post(
    "/questions/{question_id}/options",
    response_model=OptionRead,
)
def add_option(
    question_id: int,
    option_data: OptionCreate,
    session: Session = Depends(get_session),
):
    option = create_option(
        session,
        question_id,
        option_data,
    )

    if not option:
        raise HTTPException(
            status_code=404,
            detail="Question not found",
        )

    return option


@router.patch(
    "/options/{option_id}",
    response_model=OptionRead,
)
def edit_option(
    option_id: int,
    option_data: OptionUpdate,
    session: Session = Depends(get_session),
):
    option = update_option(
        session,
        option_id,
        option_data,
    )

    if not option:
        raise HTTPException(
            status_code=404,
            detail="Option not found",
        )

    return option


@router.delete("/options/{option_id}")
def remove_option(
    option_id: int,
    session: Session = Depends(get_session),
):
    result = delete_option(
        session,
        option_id,
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Option not found",
        )

    return result