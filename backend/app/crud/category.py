from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.category import Category
from app.models.article_category import ArticleCategory
from app.schemas.category import CategoryCreate, CategoryUpdate


def get_category(db: Session, category_id: UUID) -> Optional[Category]:
    """获取单个分类"""
    return db.query(Category).filter(Category.id == category_id).first()


def get_category_by_slug(db: Session, slug: str) -> Optional[Category]:
    """通过slug获取分类"""
    return db.query(Category).filter(Category.slug == slug).first()


def get_category_by_name(db: Session, name: str) -> Optional[Category]:
    """通过名称获取分类"""
    return db.query(Category).filter(Category.name == name).first()


def get_categories(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    is_active: Optional[bool] = True
) -> List[Category]:
    """获取分类列表"""
    query = db.query(Category)
    if is_active is not None:
        query = query.filter(Category.is_active == is_active)
    return query.offset(skip).limit(limit).all()


def get_categories_with_article_count(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    is_active: Optional[bool] = True
) -> List[Category]:
    """获取分类列表及其文章数量"""
    query = (
        db.query(
            Category,
            func.count(ArticleCategory.article_id).label('article_count')
        )
        .outerjoin(ArticleCategory, Category.id == ArticleCategory.category_id)
        .group_by(Category.id)
    )
    
    if is_active is not None:
        query = query.filter(Category.is_active == is_active)
    
    result = query.offset(skip).limit(limit).all()
    categories = []
    for category, article_count in result:
        category.article_count = article_count
        categories.append(category)
    
    return categories


def create_category(db: Session, category: CategoryCreate) -> Category:
    """创建新分类"""
    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def update_category(db: Session, category_id: UUID, category_update: CategoryUpdate) -> Optional[Category]:
    """更新分类"""
    db_category = get_category(db, category_id=category_id)
    if db_category:
        update_data = category_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_category, field, value)
        db.commit()
        db.refresh(db_category)
    return db_category


def delete_category(db: Session, category_id: UUID) -> bool:
    """删除分类"""
    db_category = get_category(db, category_id=category_id)
    if db_category:
        db.delete(db_category)
        db.commit()
        return True
    return False


def get_or_create_category_by_slug(db: Session, slug: str, name: str) -> Category:
    """获取或创建分类（如果不存在则创建）"""
    category = get_category_by_slug(db, slug)
    if not category:
        category = Category(name=name, slug=slug)
        db.add(category)
        db.commit()
        db.refresh(category)
    return category
