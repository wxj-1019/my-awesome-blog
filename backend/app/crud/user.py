from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


def get_user(db: Session, user_id: UUID) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_with_relations(db: Session, user_id: UUID) -> Optional[User]:
    from sqlalchemy.orm import joinedload
    return (
        db.query(User)
        .options(joinedload(User.articles))
        .options(joinedload(User.comments))
        .filter(User.id == user_id)
        .first()
    )


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()


async def create_user(db: Session, user: UserCreate, tenant_id: Optional[str] = None) -> User:
    hashed_password = await get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        avatar=user.avatar,
        bio=user.bio,
        website=user.website,
        twitter=user.twitter,
        github=user.github,
        linkedin=user.linkedin,
        tenant_id=tenant_id,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


async def update_user(db: Session, user_id: UUID, user_update: UserUpdate) -> Optional[User]:
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Handle password update
    if "password" in update_data:
        update_data["hashed_password"] = await get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: UUID) -> bool:
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    
    db.delete(db_user)
    db.commit()
    return True


from app.core.security import verify_password

async def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not await verify_password(password, str(user.hashed_password)):
        return None
    return user


def get_authors_with_article_count(db: Session):
    """
    获取所有作者及其发布的文章数量
    """
    from sqlalchemy import func
    from app.models.article import Article
    
    from sqlalchemy import and_
    # 查询每个作者及其发布的文章数量
    # 将 is_published 过滤条件放在 ON 子句中，保留没有发布文章的用户
    result = (
        db.query(
            User,
            func.count(Article.id).label('article_count')
        )
        .outerjoin(Article, and_(User.id == Article.author_id, Article.is_published == True))
        .group_by(User.id)
        .all()
    )
    
    return result


def get_user_stats(db: Session, user_id: UUID):
    """
    获取指定用户的统计数据
    包括文章数、评论数、加入日期和总浏览量
    """
    from sqlalchemy import func
    from app.models.article import Article
    from app.models.comment import Comment
    
    # 获取用户基本信息
    user = get_user(db, user_id)
    if not user:
        return None
    
    # 查询统计数据
    article_count = db.query(func.count(Article.id)).filter(
        Article.author_id == user_id,
        Article.is_published == True
    ).scalar()
    
    comment_count = db.query(func.count(Comment.id)).filter(
        Comment.author_id == user_id
    ).scalar()
    
    total_views = db.query(func.sum(Article.view_count)).filter(
        Article.author_id == user_id,
        Article.is_published == True
    ).scalar()
    
    # 格式化加入日期
    joined_date = user.created_at.strftime('%Y-%m-%d') if user.created_at else ''
    
    from app.schemas.user import UserStats
    return UserStats(
        article_count=article_count or 0,
        comment_count=comment_count or 0,
        joined_date=joined_date,
        total_views=total_views or 0
    )


async def update_user_password(db: Session, user_id: UUID, old_password: str, new_password: str) -> bool:
    """
    更新用户密码
    验证旧密码后更新为新密码
    """
    user = get_user(db, user_id)
    if not user:
        return False
    
    # 验证旧密码
    if not await verify_password(old_password, str(user.hashed_password)):
        return False
    
    # 更新为新密码
    user.hashed_password = await get_password_hash(new_password)
    db.commit()
    return True