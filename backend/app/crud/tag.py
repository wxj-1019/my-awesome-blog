from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.tag import Tag
from app.models.article_tag import ArticleTag
from app.schemas.tag import TagCreate, TagUpdate


def get_tag(db: Session, tag_id: UUID) -> Optional[Tag]:
    """获取单个标签"""
    return db.query(Tag).filter(Tag.id == tag_id).first()


def get_tag_by_slug(db: Session, slug: str) -> Optional[Tag]:
    """通过slug获取标签"""
    return db.query(Tag).filter(Tag.slug == slug).first()


def get_tag_by_name(db: Session, name: str) -> Optional[Tag]:
    """通过名称获取标签"""
    return db.query(Tag).filter(Tag.name == name).first()


def get_tags(
    db: Session, 
    skip: int = 0, 
    limit: int = 100
) -> List[Tag]:
    """获取标签列表"""
    return db.query(Tag).offset(skip).limit(limit).all()


def get_tags_with_article_count(
    db: Session, 
    skip: int = 0, 
    limit: int = 100
) -> List[Tag]:
    """获取标签列表及其文章数量"""
    query = (
        db.query(
            Tag,
            func.count(ArticleTag.article_id).label('article_count')
        )
        .outerjoin(ArticleTag, Tag.id == ArticleTag.tag_id)
        .group_by(Tag.id)
    )
    
    result = query.offset(skip).limit(limit).all()
    tags = []
    for tag, article_count in result:
        tag.article_count = article_count
        tags.append(tag)
    
    return tags


def get_popular_tags(
    db: Session, 
    limit: int = 10
) -> List[Tag]:
    """获取热门标签（按文章数量排序）"""
    query = (
        db.query(
            Tag,
            func.count(ArticleTag.article_id).label('article_count')
        )
        .join(ArticleTag, Tag.id == ArticleTag.tag_id)
        .group_by(Tag.id)
        .order_by(func.count(ArticleTag.article_id).desc())
        .limit(limit)
    )
    
    result = query.all()
    tags = []
    for tag, article_count in result:
        tag.article_count = article_count
        tags.append(tag)
    
    return tags


def create_tag(db: Session, tag: TagCreate) -> Tag:
    """创建新标签"""
    db_tag = Tag(**tag.model_dump())
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag


def update_tag(db: Session, tag_id: UUID, tag_update: TagUpdate) -> Optional[Tag]:
    """更新标签"""
    db_tag = get_tag(db, tag_id)
    if db_tag:
        update_data = tag_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_tag, field, value)
        db.commit()
        db.refresh(db_tag)
    return db_tag


def delete_tag(db: Session, tag_id: UUID) -> bool:
    """删除标签"""
    db_tag = get_tag(db, tag_id)
    if db_tag:
        db.delete(db_tag)
        db.commit()
        return True
    return False


def get_or_create_tag_by_slug(db: Session, slug: str, name: str) -> Tag:
    """获取或创建标签（如果不存在则创建）"""
    tag = get_tag_by_slug(db, slug)
    if not tag:
        tag = Tag(name=name, slug=slug)
        db.add(tag)
        db.commit()
        db.refresh(tag)
    return tag
