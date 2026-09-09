from pydantic import BaseModel, field_serializer
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class ImageBase(BaseModel):
    original_filename: str
    file_path: str
    file_size: int  # 字节
    mime_type: str
    width: Optional[int] = None
    height: Optional[int] = None
    alt_text: Optional[str] = None
    caption: Optional[str] = None
    is_optimized: Optional[bool] = False


class ImageCreate(ImageBase):
    original_filename: str
    file_path: str
    file_size: int
    mime_type: str


class ImageUpdate(BaseModel):
    alt_text: Optional[str] = None
    caption: Optional[str] = None


class ImageInDBBase(ImageBase):
    id: UUID
    created_at: datetime

    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    model_config = {'from_attributes': True}


class Image(ImageInDBBase):
    # 被多少篇文章用作封面（Article.used_in_articles column_property 自动带出）
    used_in_articles: int = 0
    pass


class ImageVariantBase(BaseModel):
    variant_name: str  # thumbnail, small, medium, large, hero
    file_path: str
    width: int
    height: int
    file_size: int
    quality: Optional[int] = 85
    format: Optional[str] = 'webp'  # webp, jpeg, png


class ImageVariantCreate(ImageVariantBase):
    variant_name: str
    file_path: str
    width: int
    height: int
    file_size: int


class ImageVariantUpdate(BaseModel):
    quality: Optional[int] = None
    format: Optional[str] = None


class ImageVariantInDBBase(ImageVariantBase):
    id: UUID
    created_at: datetime

    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    model_config = {'from_attributes': True}


class ImageVariant(ImageVariantInDBBase):
    pass


class ImageUploadResponse(ImageInDBBase):
    variants: List[ImageVariant] = []


class ImageWithVariants(Image):
    variants: List[ImageVariant] = []