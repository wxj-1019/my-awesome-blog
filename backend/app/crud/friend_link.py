from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.friend_link import FriendLink
from app.schemas.friend_link import FriendLinkCreate, FriendLinkUpdate


def get_friend_link(db: Session, friend_link_id: UUID) -> Optional[FriendLink]:
    """获取单个友情链接"""
    return db.query(FriendLink).filter(FriendLink.id == friend_link_id).first()


def get_friend_link_by_url(db: Session, url: str) -> Optional[FriendLink]:
    """通过URL获取友情链接"""
    return db.query(FriendLink).filter(FriendLink.url == url).first()


def get_friend_links(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    is_active: Optional[bool] = True,
    is_featured: Optional[bool] = None
) -> List[FriendLink]:
    """获取友情链接列表"""
    query = db.query(FriendLink)
    
    if is_active is not None:
        query = query.filter(FriendLink.is_active == is_active)
    
    if is_featured is not None:
        query = query.filter(FriendLink.is_featured == is_featured)
        
    query = query.order_by(FriendLink.sort_order.asc())
    
    return query.offset(skip).limit(limit).all()


def get_active_friend_links(db: Session) -> List[FriendLink]:
    """获取所有活跃的友情链接"""
    return db.query(FriendLink).filter(FriendLink.is_active == True).order_by(FriendLink.sort_order.asc()).all()


def get_featured_friend_links(db: Session, limit: int = 10) -> List[FriendLink]:
    """获取精选友情链接"""
    return (
        db.query(FriendLink)
        .filter(FriendLink.is_active == True, FriendLink.is_featured == True)
        .order_by(FriendLink.sort_order.asc())
        .limit(limit)
        .all()
    )


def create_friend_link(db: Session, friend_link: FriendLinkCreate) -> FriendLink:
    """创建新的友情链接"""
    db_friend_link = FriendLink(**friend_link.model_dump())
    db.add(db_friend_link)
    db.commit()
    db.refresh(db_friend_link)
    return db_friend_link


def update_friend_link(
    db: Session, friend_link_id: UUID, friend_link_update: FriendLinkUpdate
) -> Optional[FriendLink]:
    """更新友情链接"""
    db_friend_link = get_friend_link(db, friend_link_id)
    if db_friend_link:
        update_data = friend_link_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_friend_link, field, value)
        db.commit()
        db.refresh(db_friend_link)
    return db_friend_link


def delete_friend_link(db: Session, friend_link_id: UUID) -> bool:
    """删除友情链接"""
    db_friend_link = get_friend_link(db, friend_link_id)
    if db_friend_link:
        db.delete(db_friend_link)
        db.commit()
        return True
    return False


def increment_click_count(db: Session, friend_link_id: UUID) -> bool:
    """增加友情链接点击次数"""
    count = db.query(FriendLink).filter(FriendLink.id == friend_link_id).update(
        {FriendLink.click_count: FriendLink.click_count + 1}
    )
    db.commit()
    return count > 0


def batch_create_friend_links(db: Session, friend_links: List[FriendLinkCreate]) -> List[FriendLink]:
    """批量创建友情链接"""
    db_friend_links = [FriendLink(**fl.model_dump()) for fl in friend_links]
    db.add_all(db_friend_links)
    db.commit()
    for fl in db_friend_links:
        db.refresh(fl)
    return db_friend_links