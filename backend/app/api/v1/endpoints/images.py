from typing import Any, List
from fastapi import APIRouter, Query, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
import os
import uuid
from pathlib import Path
from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_superuser
from app import crud
from app.schemas.image import Image, ImageCreate, ImageUpdate
from app.models.user import User
from app.services.image_service import ImageService
from app.services.oss_service import oss_service
from app.core.config import settings
from app.utils.file_validation import ALLOWED_IMAGE_EXTENSIONS

router = APIRouter()


@router.get("/", response_model=List[Image])
def read_images(
    skip: int = 0,
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Retrieve images
    """
    images = crud.get_images(
        db, 
        skip=skip, 
        limit=limit
    )
    return images


@router.post("/", response_model=Image)
def upload_image(
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
    # Check if file is an allowed image type（复用 file_validation 统一白名单）
    allowed_extensions = ALLOWED_IMAGE_EXTENSIONS
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file_extension} not allowed. Allowed types: {allowed_extensions}"
        )
    
    # Use ImageService to process the image
    image_service = ImageService()
    
    # Save uploaded file temporarily with safe filename
    temp_file_path = f"temp_{uuid.uuid4().hex}{Path(file.filename).suffix}"
    with open(temp_file_path, "wb") as buffer:
        buffer.write(file.file.read())
    
    try:
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
        
        # Clean up temporary file
        os.remove(temp_file_path)
        
        return image
    except Exception as e:
        # Clean up temporary file in case of error
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing image: {str(e)}"
        )


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