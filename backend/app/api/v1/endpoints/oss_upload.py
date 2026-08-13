from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from datetime import datetime
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_superuser
from app import crud
from app.schemas.image import Image, ImageCreate
from app.models.user import User
from app.services.oss_service import oss_service
from app.services.image_service import ImageService
from app.core.config import settings
from app.utils.logger import app_logger
from app.schemas.oss import OssFileUploadResponse, OssBatchUploadResponse, OssDeleteResponse
from app.utils.file_validation import (
    save_upload_file_temp,
    process_batch_upload,
    cleanup_temp_file,
    FileValidationError,
    BatchUploadLimitError,
    validate_batch_upload,
    ALLOWED_IMAGE_EXTENSIONS_NO_DOT,
    ALLOWED_ATTACHMENT_MIME_TYPES,
)

router = APIRouter()


@router.post("/upload", response_model=OssFileUploadResponse)
async def upload_file_to_oss(
    *,
    file: UploadFile = File(...),
    folder: str = "general",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    上传文件到OSS - 使用安全的文件验证
    :param file: 上传的文件
    :param folder: 存储的文件夹，默认为general
    :param db: 数据库会话
    :param current_user: 当前登录用户
    :return: 包含文件URL的响应
    """
    temp_file_path = None
    
    try:
        # 使用安全的文件验证保存（通用端点：图片/视频/音频/文档均可）
        temp_file_path = await save_upload_file_temp(file, ALLOWED_ATTACHMENT_MIME_TYPES)
        app_logger.info(f"File saved temporarily: {temp_file_path}")
        
        # 对于图片，使用ImageService进行验证
        file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
        if file_extension in ALLOWED_IMAGE_EXTENSIONS_NO_DOT:
            image_service = ImageService()
            if not image_service.validate_image_format(temp_file_path):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid image format. Supported formats: JPEG, PNG, WEBP, GIF"
                )
        
        # 读取文件内容
        with open(temp_file_path, "rb") as f:
            file_data = f.read()
        
        # 上传到OSS
        file_url = oss_service.upload_file(
            file_data=file_data,
            file_name=file.filename,
            folder=f"uploads/{folder}"
        )
        
        if not file_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload file to cloud storage"
            )
        
        # 记录日志
        app_logger.info(f"File uploaded to OSS: {file_url} by user {current_user.id}")
        
        response = OssFileUploadResponse(
            file_url=file_url,
            file_name=file.filename,
            file_size=len(file_data),
            folder=folder,
            message="File uploaded successfully",
            upload_time=datetime.utcnow()
        )
        
        return response
        
    except FileValidationError as e:
        app_logger.error(f"File validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e.detail)
        )
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Error uploading file to OSS: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading file: {str(e)}"
        )
    finally:
        # 确保临时文件被清理
        if temp_file_path:
            cleanup_temp_file(temp_file_path)


@router.post("/batch-upload", response_model=OssBatchUploadResponse)
async def batch_upload_files_to_oss(
    *,
    files: List[UploadFile] = File(...),
    folder: str = "general",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    批量上传文件到OSS - 使用安全的文件验证
    :param files: 上传的文件列表
    :param folder: 存储的文件夹，默认为general
    :param db: 数据库会话
    :param current_user: 当前登录用户
    :return: 包含文件URL列表的响应
    """
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files provided for upload"
        )

    temp_files = []
    
    try:
        # 使用安全的批量文件处理（通用端点：图片/视频/音频/文档均可）
        processed_files = await process_batch_upload(files, ALLOWED_ATTACHMENT_MIME_TYPES)
        temp_files = [path for path, _, _ in processed_files]
        
        # 对于图片，使用ImageService进行验证
        for temp_path, original_name, _ in processed_files:
            file_extension = original_name.split('.')[-1].lower() if '.' in original_name else ''
            if file_extension in ALLOWED_IMAGE_EXTENSIONS_NO_DOT:
                image_service = ImageService()
                if not image_service.validate_image_format(temp_path):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid image format for {original_name}. Supported formats: JPEG, PNG, WEBP, GIF"
                    )
        
        # 准备批量上传数据
        files_data = []
        for temp_path, original_name, _ in processed_files:
            with open(temp_path, "rb") as f:
                file_data = f.read()
            files_data.append({
                'data': file_data,
                'name': original_name
            })

        # 批量上传到OSS
        uploaded_urls = oss_service.upload_multiple_files(
            files_data=files_data,
            folder=f"uploads/{folder}"
        )

        if not uploaded_urls:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload files to cloud storage"
            )

        # 记录日志
        app_logger.info(f"Batch uploaded {len(uploaded_urls)} files to OSS by user {current_user.id}")

        response = OssBatchUploadResponse(
            file_urls=uploaded_urls,
            file_count=len(uploaded_urls),
            folder=folder,
            message=f"{len(uploaded_urls)} files uploaded successfully",
            upload_time=datetime.utcnow()
        )
        
        return response

    except BatchUploadLimitError as e:
        app_logger.error(f"Batch upload limit exceeded: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=str(e.detail)
        )
    except FileValidationError as e:
        app_logger.error(f"File validation error in batch upload: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e.detail)
        )
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Error batch uploading files to OSS: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading files: {str(e)}"
        )
    finally:
        # 确保所有临时文件被清理
        for temp_file in temp_files:
            cleanup_temp_file(temp_file)


@router.delete("/delete", response_model=OssDeleteResponse)
async def delete_file_from_oss(
    *,
    file_url: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    从OSS删除文件
    :param file_url: 要删除的文件URL
    :param db: 数据库会话
    :param current_user: 当前登录用户
    :return: 删除结果
    """
    if not file_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File URL is required"
        )

    try:
        # 删除文件
        delete_result = oss_service.delete_file(file_url)
        
        if delete_result:
            app_logger.info(f"File deleted from OSS: {file_url} by user {current_user.id}")
            response = OssDeleteResponse(
                file_url=file_url,
                deleted=True,
                message="File deleted successfully",
                delete_time=datetime.utcnow()
            )
            
            return response
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete file from cloud storage"
            )
            
    except Exception as e:
        app_logger.error(f"Error deleting file from OSS: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting file: {str(e)}"
        )
