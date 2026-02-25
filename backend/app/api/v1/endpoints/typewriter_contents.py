from typing import Any, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_superuser
from app import crud
from app.schemas.typewriter_content import (
    TypewriterContent,
    TypewriterContentCreate,
    TypewriterContentUpdate,
    TypewriterContentList,
)
from app.models.user import User
from app.utils.logger import app_logger

router = APIRouter()


@router.get("/", response_model=List[TypewriterContent])
def read_typewriter_contents(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=100, description="Number of records to return"),
    active_only: bool = Query(True, description="Only return active contents"),
    db: Session = Depends(get_db),
) -> Any:
    """
    Retrieve typewriter contents
    """
    contents = crud.get_typewriter_contents(
        db, skip=skip, limit=limit, active_only=active_only
    )
    return contents


@router.get("/active", response_model=List[TypewriterContent])
def read_active_typewriter_contents(
    db: Session = Depends(get_db),
) -> Any:
    """
    Retrieve all active typewriter contents ordered by priority
    """
    contents = crud.get_active_typewriter_contents(db)
    return contents


@router.get("/{content_id}", response_model=TypewriterContent)
def read_typewriter_content(
    content_id: UUID,
    db: Session = Depends(get_db),
) -> Any:
    """
    Get a specific typewriter content by ID
    """
    content = crud.get_typewriter_content(db, content_id=content_id)
    if not content:
        app_logger.warning(f"Attempt to access non-existent typewriter content ID: {content_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Typewriter content not found",
        )
    return content


@router.post("/", response_model=TypewriterContent, status_code=status.HTTP_201_CREATED)
def create_typewriter_content(
    *,
    db: Session = Depends(get_db),
    content_in: TypewriterContentCreate,
    current_user: User = Depends(get_current_superuser),
) -> Any:
    """
    Create a new typewriter content
    """
    content = crud.create_typewriter_content(db, content=content_in)
    return content


@router.put("/{content_id}", response_model=TypewriterContent)
def update_typewriter_content(
    content_id: UUID,
    content_update: TypewriterContentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> Any:
    """
    Update an existing typewriter content
    """
    content = crud.get_typewriter_content(db, content_id=content_id)
    if not content:
        app_logger.warning(f"Attempt to update non-existent typewriter content ID: {content_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Typewriter content not found",
        )

    updated_content = crud.update_typewriter_content(
        db, content_id=content_id, content_update=content_update
    )
    if not updated_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update typewriter content",
        )
    return updated_content


@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_typewriter_content(
    content_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> None:
    """
    Delete a typewriter content
    """
    content = crud.get_typewriter_content(db, content_id=content_id)
    if not content:
        app_logger.warning(f"Attempt to delete non-existent typewriter content ID: {content_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Typewriter content not found",
        )

    success = crud.delete_typewriter_content(db, content_id=content_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete typewriter content",
        )


@router.post("/{content_id}/deactivate", response_model=TypewriterContent)
def deactivate_typewriter_content(
    content_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> Any:
    """
    Soft delete a typewriter content by setting is_active to False
    """
    content = crud.deactivate_typewriter_content(db, content_id=content_id)
    if not content:
        app_logger.warning(f"Attempt to deactivate non-existent typewriter content ID: {content_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Typewriter content not found",
        )
    return content
