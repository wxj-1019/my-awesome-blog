from typing import Any, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_superuser
from app import crud
from app.schemas.tag import Tag, TagCreate, TagUpdate, TagWithArticleCount
from app.schemas.article import ArticleWithAuthor
from app.models.user import User
from app.utils.logger import app_logger

router = APIRouter()


@router.get("/", response_model=List[TagWithArticleCount])
def read_tags(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> Any:
    """
    Retrieve tags with article counts
    """
    tags = crud.get_tags_with_article_count(
        db, 
        skip=skip, 
        limit=limit
    )
    return tags


@router.post("/", response_model=Tag)
def create_tag(
    *,
    db: Session = Depends(get_db),
    tag_in: TagCreate,
    current_user: User = Depends(get_current_superuser)
) -> Any:
    """
    Create new tag
    """
    existing_tag_by_name = crud.get_tag_by_name(db, tag_in.name)
    if existing_tag_by_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A tag with this name already exists",
        )
    
    existing_tag_by_slug = crud.get_tag_by_slug(db, tag_in.slug)
    if existing_tag_by_slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A tag with this slug already exists",
        )
    
    tag = crud.create_tag(db, tag=tag_in)
    app_logger.info(f"创建标签成功: {tag.name} (ID: {tag.id}), 操作者: {current_user.username}")
    return tag


@router.get("/{tag_id}", response_model=TagWithArticleCount)
def read_tag_by_id(
    tag_id: UUID,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get a specific tag by id
    """
    tag = crud.get_tag(db, tag_id=tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )

    article_count = len(tag.articles)
    tag.article_count = article_count

    return tag


@router.put("/{tag_id}", response_model=Tag)
def update_tag(
    *,
    db: Session = Depends(get_db),
    tag_id: UUID,
    tag_in: TagUpdate,
    current_user: User = Depends(get_current_superuser)
) -> Any:
    """
    Update a tag
    """
    tag = crud.get_tag(db, tag_id=tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )

    if tag_in.slug and tag_in.slug != tag.slug:
        existing_tag = crud.get_tag_by_slug(db, tag_in.slug)
        if existing_tag and existing_tag.id != tag.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A tag with this slug already exists",
            )

    if tag_in.name and tag_in.name != tag.name:
        existing_tag = crud.get_tag_by_name(db, tag_in.name)
        if existing_tag and existing_tag.id != tag.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A tag with this name already exists",
            )

    tag = crud.update_tag(db, tag_id=tag_id, tag_update=tag_in)
    app_logger.info(f"更新标签: {tag.name} (ID: {tag_id}), 操作者: {current_user.username}")
    return tag


@router.delete("/{tag_id}", response_model=dict)
def delete_tag(
    *,
    db: Session = Depends(get_db),
    tag_id: UUID,
    current_user: User = Depends(get_current_superuser)
) -> Any:
    """
    Delete a tag
    """
    tag = crud.get_tag(db, tag_id=tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )

    if tag.articles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete tag that has associated articles",
        )

    deleted = crud.delete_tag(db, tag_id=tag_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )

    app_logger.info(f"删除标签: {tag.name} (ID: {tag_id}), 操作者: {current_user.username}")
    return {"message": "Tag deleted successfully"}


@router.get("/{tag_id}/articles", response_model=List[ArticleWithAuthor])
def read_articles_by_tag(
    tag_id: UUID,
    skip: int = 0,
    limit: int = 100,
    published_only: bool = True,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get articles with a specific tag
    """
    tag = crud.get_tag(db, tag_id=tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )

    articles = crud.get_articles(
        db,
        skip=skip,
        limit=limit,
        published_only=published_only,
        tag_id=tag_id
    )

    return articles
