"""
文件上传安全验证工具
提供MIME类型验证、文件大小限制、批量上传限制等功能
"""
import os
import tempfile
try:
    import puremagic
    PUREMAGIC_AVAILABLE = True
except ImportError:
    PUREMAGIC_AVAILABLE = False
from pathlib import Path
from typing import List, Tuple, Set
from fastapi import HTTPException, UploadFile, status
import aiofiles
import hashlib

from app.core.config import settings

# 允许的文件类型映射 (MIME类型 -> 扩展名列表)
# 注意：不接受 SVG。SVG 可内嵌 <script> 造成存储型 XSS，且位图处理链路（Pillow
# resize/WebP 转换）无法处理矢量图。如确需 SVG，须先引入 sanitize 再放开。
ALLOWED_MIME_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
}

# 允许的所有扩展名（含点，如 '.jpg'），由 MIME 映射派生，保持单一事实来源
ALLOWED_EXTENSIONS: Set[str] = set()
for exts in ALLOWED_MIME_TYPES.values():
    ALLOWED_EXTENSIONS.update(exts)

# 位图扩展名（带点），供位图专用端点（/images/、头像）复用，避免各处硬编码
ALLOWED_IMAGE_EXTENSIONS: List[str] = sorted(ALLOWED_EXTENSIONS)
# 位图扩展名（不带点，如 'jpg'），供按 split('.')[-1] 解析的端点复用
ALLOWED_IMAGE_EXTENSIONS_NO_DOT: List[str] = [e.lstrip('.') for e in ALLOWED_IMAGE_EXTENSIONS]


class FileValidationError(HTTPException):
    """文件验证错误"""
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


class BatchUploadLimitError(HTTPException):
    """批量上传限制错误"""
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=detail
        )


def validate_file_extension(filename: str) -> bool:
    """
    验证文件扩展名是否在允许列表中
    
    Args:
        filename: 原始文件名
        
    Returns:
        bool: 是否允许
    """
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_EXTENSIONS


def validate_mime_type(file_path: str) -> Tuple[bool, str]:
    """
    验证文件的MIME类型

    Args:
        file_path: 文件路径

    Returns:
        Tuple[bool, str]: (是否有效, MIME类型或错误信息)
    """
    if not PUREMAGIC_AVAILABLE:
        # 如果puremagic不可用，仅根据扩展名验证
        ext = Path(file_path).suffix.lower()
        for mime_type, extensions in ALLOWED_MIME_TYPES.items():
            if ext in extensions:
                return True, mime_type
        return False, f"不支持的文件类型: {ext}"

    try:
        mime_type = puremagic.from_file(file_path, mime=True)
        if mime_type not in ALLOWED_MIME_TYPES:
            return False, f"不支持的文件类型: {mime_type}"
        return True, mime_type
    except Exception as e:
        return False, f"无法检测文件类型: {str(e)}"


def validate_file_size(file_size: int) -> bool:
    """
    验证单个文件大小
    
    Args:
        file_size: 文件大小（字节）
        
    Returns:
        bool: 是否在限制范围内
    """
    return file_size <= settings.UPLOAD_MAX_FILE_SIZE


def validate_extension_matches_mime(file_path: str, original_filename: str) -> Tuple[bool, str]:
    """
    验证文件扩展名与MIME类型匹配
    
    Args:
        file_path: 文件路径
        original_filename: 原始文件名
        
    Returns:
        Tuple[bool, str]: (是否匹配, 错误信息)
    """
    ext = Path(original_filename).suffix.lower()
    
    valid, result = validate_mime_type(file_path)
    if not valid:
        return False, result
    
    mime_type = result
    allowed_exts = ALLOWED_MIME_TYPES.get(mime_type, [])
    
    if ext not in allowed_exts:
        return False, f"文件扩展名与MIME类型不匹配: 扩展名 {ext} 不匹配 MIME类型 {mime_type}"
    
    return True, ""


async def save_upload_file_temp(upload_file: UploadFile) -> str:
    """
    安全地保存上传文件到临时目录
    
    Args:
        upload_file: FastAPI UploadFile对象
        
    Returns:
        str: 临时文件路径
        
    Raises:
        FileValidationError: 验证失败
    """
    # 验证文件扩展名
    if not validate_file_extension(upload_file.filename):
        raise FileValidationError(
            f"不支持的文件类型。允许的类型: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # 创建安全的临时文件
    original_ext = Path(upload_file.filename).suffix.lower()
    fd, temp_path = tempfile.mkstemp(prefix="upload_", suffix=original_ext)
    os.close(fd)  # 关闭文件描述符
    
    try:
        # 保存文件内容
        async with aiofiles.open(temp_path, 'wb') as f:
            content = await upload_file.read()
            await f.write(content)
        
        # 验证文件大小
        file_size = os.path.getsize(temp_path)
        if not validate_file_size(file_size):
            os.remove(temp_path)
            raise FileValidationError(
                f"文件大小超过限制。最大允许: {settings.UPLOAD_MAX_FILE_SIZE / 1024 / 1024:.1f}MB, "
                f"当前: {file_size / 1024 / 1024:.1f}MB"
            )
        
        # 验证MIME类型和扩展名匹配
        valid, error = validate_extension_matches_mime(temp_path, upload_file.filename)
        if not valid:
            os.remove(temp_path)
            raise FileValidationError(error)
        
        return temp_path
        
    except Exception as e:
        # 清理临时文件
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if isinstance(e, FileValidationError):
            raise
        raise FileValidationError(f"文件处理失败: {str(e)}")


def validate_batch_upload(files: List[UploadFile]) -> None:
    """
    验证批量上传限制
    
    Args:
        files: 上传文件列表
        
    Raises:
        BatchUploadLimitError: 超出限制
    """
    # 检查文件数量
    if len(files) > settings.UPLOAD_MAX_FILES_PER_BATCH:
        raise BatchUploadLimitError(
            f"批量上传文件数量超过限制。最大允许: {settings.UPLOAD_MAX_FILES_PER_BATCH}, "
            f"当前: {len(files)}"
        )
    
    # 预估总大小（实际大小需要在保存后检查）
    # 这里只检查明显的过大请求
    total_estimated_size = 0
    for file in files:
        # 如果文件对象有size属性
        if hasattr(file, 'size') and file.size:
            total_estimated_size += file.size
    
    if total_estimated_size > settings.UPLOAD_MAX_BATCH_SIZE:
        raise BatchUploadLimitError(
            f"批量上传总大小超过限制。最大允许: {settings.UPLOAD_MAX_BATCH_SIZE / 1024 / 1024:.1f}MB, "
            f"预估: {total_estimated_size / 1024 / 1024:.1f}MB"
        )


async def process_batch_upload(
    files: List[UploadFile]
) -> List[Tuple[str, str, str]]:
    """
    处理批量文件上传
    
    Args:
        files: 上传文件列表
        
    Returns:
        List[Tuple[str, str, str]]: [(临时路径, 原始文件名, 内容类型), ...]
        
    Raises:
        BatchUploadLimitError: 超出批量限制
        FileValidationError: 单个文件验证失败
    """
    # 验证批量上传限制
    validate_batch_upload(files)
    
    results = []
    total_size = 0
    
    for upload_file in files:
        try:
            temp_path = await save_upload_file_temp(upload_file)
            file_size = os.path.getsize(temp_path)
            total_size += file_size
            
            # 检查累计大小
            if total_size > settings.UPLOAD_MAX_BATCH_SIZE:
                # 清理已保存的文件
                for saved_path, _, _ in results:
                    if os.path.exists(saved_path):
                        os.remove(saved_path)
                os.remove(temp_path)
                raise BatchUploadLimitError(
                    f"批量上传总大小超过限制。最大允许: {settings.UPLOAD_MAX_BATCH_SIZE / 1024 / 1024:.1f}MB, "
                    f"当前: {total_size / 1024 / 1024:.1f}MB"
                )
            
            results.append((temp_path, upload_file.filename, upload_file.content_type))
            
        except Exception as e:
            # 清理已保存的文件
            for saved_path, _, _ in results:
                if os.path.exists(saved_path):
                    os.remove(saved_path)
            raise
    
    return results


def cleanup_temp_file(file_path: str) -> None:
    """
    安全地清理临时文件
    
    Args:
        file_path: 临时文件路径
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception:
        pass  # 忽略清理错误


def generate_safe_filename(original_filename: str) -> str:
    """
    生成安全的文件名（去除路径遍历风险）
    
    Args:
        original_filename: 原始文件名
        
    Returns:
        str: 安全的文件名
    """
    # 只保留基本文件名，去除路径
    safe_name = Path(original_filename).name
    
    # 生成唯一的文件名前缀
    unique_prefix = hashlib.md5(os.urandom(16)).hexdigest()[:8]
    
    # 获取扩展名
    ext = Path(safe_name).suffix.lower()
    
    # 如果扩展名不在允许列表中，使用 .bin
    if ext not in ALLOWED_EXTENSIONS:
        ext = '.bin'
    
    return f"{unique_prefix}{ext}"


def get_file_hash(file_path: str) -> str:
    """
    计算文件哈希值（用于去重）
    
    Args:
        file_path: 文件路径
        
    Returns:
        str: MD5哈希值
    """
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()
