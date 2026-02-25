from typing import Any, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_superuser
from app import crud
from app.schemas.category import Category, CategoryCreate, CategoryUpdate, CategoryWithArticleCount
from app.schemas.article import ArticleWithAuthor
from app.models.user import User
from app.utils.logger import app_logger

router = APIRouter()


@router.get("/", response_model=List[CategoryWithArticleCount])
def read_categories(
    skip: int = 0,
    limit: int = 100,
    is_active: bool = True,
    db: Session = Depends(get_db)
) -> Any:
    """
    Retrieve categories with article counts
    """
    categories = crud.get_categories_with_article_count(
        db, 
        skip=skip, 
        limit=limit, 
        is_active=is_active
    )
    return categories


@router.post("/", response_model=Category)
def create_category(
    *,
    db: Session = Depends(get_db),
    category_in: CategoryCreate,
    current_user: User = Depends(get_current_superuser)
) -> Any:
    """
    Create new category
    """
    existing_category_by_name = crud.get_category_by_name(db, category_in.name)
    if existing_category_by_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A category with this name already exists",
        )

    existing_category_by_slug = crud.get_category_by_slug(db, category_in.slug)
    if existing_category_by_slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A category with this slug already exists",
        )

    category = crud.create_category(db, category=category_in)
    app_logger.info(f"创建分类成功: {category.name} (ID: {category.id}), 操作者: {current_user.username}")
    return category


@router.get("/{category_id}", response_model=CategoryWithArticleCount)
def read_category_by_id(
    category_id: UUID,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get a specific category by id
    """
    category = crud.get_category(db, category_id=category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    article_count = len(category.articles)
    category.article_count = article_count

    return category


@router.put("/{category_id}", response_model=Category)
def update_category(
    *,
    db: Session = Depends(get_db),
    category_id: UUID,
    category_in: CategoryUpdate,
    current_user: User = Depends(get_current_superuser)
) -> Any:
    """
    Update a category
    """
    category = crud.get_category(db, category_id=category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    if category_in.slug and category_in.slug != category.slug:
        existing_category = crud.get_category_by_slug(db, category_in.slug)
        if existing_category and existing_category.id != category.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A category with this slug already exists",
            )

    if category_in.name and category_in.name != category.name:
        existing_category = crud.get_category_by_name(db, category_in.name)
        if existing_category and existing_category.id != category.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A category with this name already exists",
            )

    category = crud.update_category(db, category_id=category_id, category_update=category_in)
    app_logger.info(f"更新分类: {category.name} (ID: {category_id}), 操作者: {current_user.username}")
    return category


@router.delete("/{category_id}", response_model=dict)
def delete_category(
    *,
    db: Session = Depends(get_db),
    category_id: UUID,
    current_user: User = Depends(get_current_superuser)
) -> Any:
    """
    Delete a category
    """
    category = crud.get_category(db, category_id=category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    if category.articles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete category that has associated articles",
        )

    deleted = crud.delete_category(db, category_id=category_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    app_logger.info(f"删除分类: {category.name} (ID: {category_id}), 操作者: {current_user.username}")
    return {"message": "Category deleted successfully"}


@router.get("/{category_id}/articles", response_model=List[ArticleWithAuthor])
def read_articles_by_category(
    category_id: UUID,
    skip: int = 0,
    limit: int = 100,
    published_only: bool = True,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get articles in a specific category
    """
    category = crud.get_category(db, category_id=category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    articles = crud.get_articles(
        db,
        skip=skip,
        limit=limit,
        published_only=published_only,
        category_id=category_id
    )

    return articles
