from typing import Any, List, Optional
from fastapi import APIRouter, Query, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_superuser
from app import crud
from app.schemas.image import Image, ImageCreate, ImageUpdate
from app.models.user import User
from app.services.image_service import ImageService
from app.services.oss_service import oss_service
from app.core.config import settings
from app.models.image import Image as ImageModel
from app.utils.file_validation import save_upload_file_temp, cleanup_temp_file

router = APIRouter()


def _escape_like(text: str) -> str:
    """转义 LIKE 通配符（反斜杠 / % / _），防止用户输入改变匹配语义"""
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@router.get("/count", response_model=dict)
def count_images(
    q: str = Query(None, description="Search in title/description/original filename"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """图片计数（管理端分页 total 使用），支持与列表相同的搜索条件"""
    from sqlalchemy import func
    query = db.query(func.count(ImageModel.id))
    if q:
        pattern = f"%{_escape_like(q.strip())}%"
        # 模型实际字段为 alt_text/caption（原 title/description 不存在，任意搜索都会 500）
        query = query.filter(
            ImageModel.alt_text.ilike(pattern, escape="\\")
            | ImageModel.caption.ilike(pattern, escape="\\")
            | ImageModel.original_filename.ilike(pattern, escape="\\")
        )
    return {"total": query.scalar() or 0}


@router.get("/", response_model=List[Image])
def read_images(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    q: str = Query(None, description="Search in title/description/original filename"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Retrieve images（used_in_articles 为被文章用作封面的计数）
    """
    query = db.query(ImageModel)
    if q:
        pattern = f"%{_escape_like(q.strip())}%"
        # 模型实际字段为 alt_text/caption（原 title/description 不存在，任意搜索都会 500）
        query = query.filter(
            ImageModel.alt_text.ilike(pattern, escape="\\")
            | ImageModel.caption.ilike(pattern, escape="\\")
            | ImageModel.original_filename.ilike(pattern, escape="\\")
        )
    images = query.order_by(ImageModel.created_at.desc()).offset(skip).limit(limit).all()
    return images


@router.post("/", response_model=Image)
async def upload_image(
    *,
    file: UploadFile = File(...),
    title: str = Form(None),
    description: str = Form(None),
    alt_text: str = Form(None),
    is_featured: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Upload a new image
    """
    # Use ImageService to process the image
    image_service = ImageService()

    temp_file_path: Optional[str] = None
    try:
        # 使用统一文件校验工具落盘（扩展名/MIME/大小校验），不直接整读进内存
        temp_file_path = await save_upload_file_temp(file)

        # Validate image format
        if not image_service.validate_image_format(temp_file_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image format. Supported formats: JPEG, PNG, WEBP, GIF"
            )

        # Process image using ImageService
        # Get image info for the database record
        image_info = image_service.get_image_info(temp_file_path)

        # Upload original file to OSS
        with open(temp_file_path, "rb") as f:
            file_data = f.read()
        original_file_url = oss_service.upload_file(file_data, file.filename, "images/original")

        if not original_file_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload image to cloud storage"
            )

        # Create image record in database
        image_in = ImageCreate(
            original_filename=file.filename,
            file_path=original_file_url,  # Store the OSS URL
            file_size=len(file_data),
            mime_type=file.content_type,
            width=image_info['width'],
            height=image_info['height'],
            alt_text=alt_text,
            caption=description
        )

        image = crud.create_image(db, image=image_in)

        return image
    except HTTPException:
        # 自己抛出的 HTTPException（如 400 格式错误）原样透传，不能被包成 500
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing image: {str(e)}"
        )
    finally:
        # Clean up temporary file
        if temp_file_path:
            cleanup_temp_file(temp_file_path)


@router.get("/{image_id}", response_model=Image)
def read_image_by_id(
    image_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get a specific image by id
    """
    from uuid import UUID
    try:
        image_uuid = UUID(image_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image ID format",
        )
    
    image = crud.get_image(db, image_id=image_uuid)
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    
    return image


@router.put("/{image_id}", response_model=Image)
def update_image(
    *,
    image_id: str,
    image_in: ImageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
) -> Any:
    """
    Update an image
    """
    from uuid import UUID
    try:
        image_uuid = UUID(image_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image ID format",
        )
    
    image = crud.get_image(db, image_id=image_uuid)
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    
    image = crud.update_image(
        db, 
        image_id=image_uuid, 
        image_update=image_in
    )
    return image


@router.delete("/{image_id}", response_model=dict)
def delete_image(
    *,
    image_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
) -> Any:
    """
    Delete an image
    """
    from uuid import UUID
    try:
        image_uuid = UUID(image_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image ID format",
        )
    
    image = crud.get_image(db, image_id=image_uuid)
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    
    # Delete the file from OSS
    if image.file_path:
        oss_service.delete_file(image.file_path)
    
    deleted = crud.delete_image(db, image_id=image_uuid)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    
    return {"message": "Image deleted successfully"}