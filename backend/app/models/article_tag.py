from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class ArticleTag(Base):
    __tablename__ = "article_tags"

    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)

    article = relationship("Article", back_populates="article_tags", overlaps="articles,tags")
    tag = relationship("Tag", back_populates="article_tags", overlaps="articles,tags")
