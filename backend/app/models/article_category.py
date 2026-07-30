from sqlalchemy import Column, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.types import UUIDType


class ArticleCategory(Base):
    __tablename__ = "article_categories"

    article_id = Column(UUIDType, ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True)
    # 复合主键最左列是 article_id，按 category_id 反查文章需要单列索引
    category_id = Column(UUIDType, ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True, index=True)
    is_primary = Column(Boolean, default=False)

    article = relationship("Article", back_populates="article_categories", overlaps="articles,categories")
    category = relationship("Category", back_populates="article_categories", overlaps="articles,categories")
