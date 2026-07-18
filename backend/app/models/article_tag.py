from sqlalchemy import Column, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.types import UUIDType


class ArticleTag(Base):
    __tablename__ = "article_tags"

    article_id = Column(UUIDType, ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(UUIDType, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)

    article = relationship("Article", back_populates="article_tags", overlaps="articles,tags")
    tag = relationship("Tag", back_populates="article_tags", overlaps="articles,tags")
