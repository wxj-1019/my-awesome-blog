from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_superuser
from app import crud
from app.crud.user import get_user_stats
from app.schemas.user import User, UserCreate, UserUpdate, UserStats, AvatarResponse, PasswordUpdate
from app.models.user import User as UserModel
# Temporarily commented out due to missing oss2 module
# from app.services.oss_service import oss_service
oss_service = None
from app.utils.file_validation import (
    save_upload_file_temp, 
    cleanup_temp_file, 
    FileValidationError
)
from app.utils.logger import app_logger

try:
    from app.services.image_service import ImageService
    IMAGE_SERVICE_AVAILABLE = True
except ImportError:
    IMAGE_SERVICE_AVAILABLE = False

router = APIRouter()


@router.get("/admin")
def get_admin_user(
    db: Session = Depends(get_db),
) -> Any:
    """
    Get admin/superuser information for public display
    Returns the first superuser found
    Public endpoint - no authentication required
    """
    app_logger.info("Admin endpoint called")
    admin = db.query(UserModel).filter(UserModel.is_superuser == True).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin user not found"
        )
    app_logger.info(f"Admin user found: {admin.username}")
    return {
        "id": str(admin.id),
        "username": admin.username,
        "avatar": admin.avatar,
        "bio": admin.bio,
        "full_name": admin.full_name,
    }


@router.get("/public-info")
def get_public_info():
    """
    Test public endpoint - no authentication required
    """
    return {"message": "This is a public endpoint", "status": "success"}


@router.get("/", response_model=List[User])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_superuser)  # 添加管理员权限要求
) -> Any:
    """
    Retrieve users (admin only)
    """
    users = crud.get_users(db, skip=skip, limit=limit)
    return users


@router.post("/", response_model=User)
async def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
    current_user: UserModel = Depends(get_current_superuser)  # 添加管理员权限要求
) -> Any:
    """
    Create new user (admin only)
    """
    # Check if user exists
    user = crud.get_user_by_username(db, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username already exists",
        )

    user = crud.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001"
    user = await crud.create_user(db, user=user_in, tenant_id=DEFAULT_TENANT_ID)
    app_logger.info(f"Admin created new user: {user.username} (ID: {user.id})")
    return user


# /me endpoints for current user operations


@router.get("/me", response_model=User)
def read_current_user(
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Get current user's profile
    """
    return current_user


@router.put("/me", response_model=User)
async def update_current_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserUpdate,
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Update current user's profile
    """
    user = await crud.update_user(db, user_id=current_user.id, user_update=user_in)
    app_logger.info(f"User updated profile: {current_user.username} (ID: {current_user.id})")
    return user


@router.post("/me/avatar", response_model=AvatarResponse)
async def upload_current_user_avatar(
    *,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Upload current user's avatar
    使用安全的文件验证流程
    """
    app_logger.info(f"Starting avatar upload for user: {current_user.id}, file: {file.filename}")
    
    # Check if ImageService is available
    if not IMAGE_SERVICE_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Avatar upload is currently unavailable due to missing image processing library. Please contact administrator."
        )
    
    temp_file_path = None
    try:
        # 使用安全的文件验证保存
        temp_file_path = await save_upload_file_temp(file)
        app_logger.info(f"File saved temporarily: {temp_file_path}")
        
        # Use ImageService to process avatar
        image_service = ImageService()
        
        # Validate image format
        if not image_service.validate_image_format(temp_file_path):
            app_logger.error(f"Invalid image format for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image format. Supported formats: JPEG, PNG, WEBP, GIF"
            )
        
        # Get image info
        image_info = image_service.get_image_info(temp_file_path)
        app_logger.info(f"Image info: {image_info}")
        
        # Upload avatar to OSS
        if oss_service is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Cloud storage service is currently unavailable. Please contact administrator."
            )
        with open(temp_file_path, "rb") as f:
            file_data = f.read()
        avatar_url = oss_service.upload_file(file_data, file.filename, f"avatars/user_{current_user.id}")
        
        if not avatar_url:
            app_logger.error(f"Failed to upload avatar to OSS for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload avatar to cloud storage"
            )

        # Update user's avatar in database
        updated_user = await crud.update_user(db, user_id=current_user.id, user_update=UserUpdate(avatar=avatar_url))
        
        if not updated_user:
            app_logger.error(f"Failed to update user avatar in database for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user avatar in database"
            )

        app_logger.info(f"Avatar uploaded successfully for user {current_user.id}, URL: {avatar_url}")

        return AvatarResponse(
            avatar_url=avatar_url,
            message="Avatar uploaded successfully"
        )
        
    except FileValidationError as e:
        app_logger.error(f"File validation error for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e.detail)
        )
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Unexpected error processing avatar for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing avatar: {str(e)}"
        )
    finally:
        # 确保临时文件被清理
        if temp_file_path:
            cleanup_temp_file(temp_file_path)


@router.get("/me/stats", response_model=UserStats)
def read_current_user_stats(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Get current user's statistics
    """
    stats = get_user_stats(db, user_id=current_user.id)
    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User statistics not found"
        )
    return stats


@router.put("/me/password", response_model=dict)
async def update_password(
    *,
    db: Session = Depends(get_db),
    password_data: PasswordUpdate,
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Update current user's password
    """
    from app.crud.user import update_user_password
    
    result = await update_user_password(
        db, 
        user_id=current_user.id, 
        old_password=password_data.old_password,
        new_password=password_data.new_password
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="旧密码错误或密码更新失败"
        )
    
    app_logger.info(f"User updated password: {current_user.username} (ID: {current_user.id})")
    return {"message": "密码更新成功"}


@router.get("/{user_id}", response_model=User)
def read_user_by_id(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)  # 添加认证要求
) -> Any:
    """
    Get a specific user by id
    Requires authentication
    """
    from uuid import UUID
    user_uuid = UUID(user_id)
    user = crud.get_user(db, user_id=user_uuid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.put("/{user_id}", response_model=User)
async def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: str,
    user_in: UserUpdate,
    current_user: UserModel = Depends(get_current_superuser)  # 添加管理员权限要求
) -> Any:
    """
    Update a user (admin only)
    """
    from uuid import UUID
    user_uuid = UUID(user_id)
    user = crud.get_user(db, user_id=user_uuid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user = await crud.update_user(db, user_id=user_uuid, user_update=user_in)
    app_logger.info(f"Admin updated user: {user.username} (ID: {user.id})")
    return user


@router.delete("/{user_id}", response_model=dict)
def delete_user(
    *,
    db: Session = Depends(get_db),
    user_id: str,
    current_user: UserModel = Depends(get_current_superuser)  # 添加管理员权限要求
) -> Any:
    """
    Delete a user (admin only)
    """
    from uuid import UUID
    user_uuid = UUID(user_id)
    
    # 防止删除自己
    if str(current_user.id) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user = crud.get_user(db, user_id=user_uuid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    deleted = crud.delete_user(db, user_id=user_uuid)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    app_logger.info(f"Admin deleted user: {user.username} (ID: {user.id})")
    return {"message": "User deleted successfully"}
