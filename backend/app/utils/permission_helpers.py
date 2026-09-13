"""
权限检查辅助函数模块
提供通用的权限检查逻辑，减少重复代码
"""
from typing import Type, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.exceptions import ForbiddenException
from app.models.user import User


def check_ownership(
    resource_obj: Optional[object],
    user: User,
    superuser_bypass: bool = True,
    resource_name: str = "资源"
) -> None:
    """
    检查资源所有权

    Args:
        resource_obj: 资源对象（需要包含author_id属性）
        user: 当前用户
        superuser_bypass: 超级用户是否绕过权限检查，默认True
        resource_name: 资源名称，用于错误消息

    Raises:
        HTTPException: 资源不存在时抛出404错误；ForbiddenException: 权限不足时抛出403错误
    """
    if not resource_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_name}不存在"
        )

    # 超级用户可以跳过所有权检查
    if superuser_bypass and user.is_superuser:
        return

    # 检查所有权
    if getattr(resource_obj, 'author_id', None) != user.id:
        raise ForbiddenException(message=f"没有权限操作此{resource_name}")


def check_edit_permission(
    resource_obj: Optional[object],
    user: User,
    superuser_bypass: bool = True,
    resource_name: str = "资源"
) -> None:
    """
    检查编辑权限

    Args:
        resource_obj: 资源对象（需要包含author_id属性）
        user: 当前用户
        superuser_bypass: 超级用户是否绕过权限检查，默认True
        resource_name: 资源名称，用于错误消息

    Raises:
        HTTPException: 资源不存在时抛出404错误；ForbiddenException: 权限不足时抛出403错误
    """
    if not resource_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_name}不存在"
        )

    # 超级用户可以跳过权限检查
    if superuser_bypass and user.is_superuser:
        return

    # 检查编辑权限（仅作者可编辑）
    if getattr(resource_obj, 'author_id', None) != user.id:
        raise ForbiddenException(message=f"没有权限编辑此{resource_name}")


def check_delete_permission(
    resource_obj: Optional[object],
    user: User,
    superuser_bypass: bool = True,
    resource_name: str = "资源"
) -> None:
    """
    检查删除权限

    Args:
        resource_obj: 资源对象（需要包含author_id属性）
        user: 当前用户
        superuser_bypass: 超级用户是否绕过权限检查，默认True
        resource_name: 资源名称，用于错误消息

    Raises:
        HTTPException: 资源不存在时抛出404错误；ForbiddenException: 权限不足时抛出403错误
    """
    if not resource_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_name}不存在"
        )

    # 超级用户可以跳过权限检查
    if superuser_bypass and user.is_superuser:
        return

    # 检查删除权限（仅作者可删除）
    if getattr(resource_obj, 'author_id', None) != user.id:
        raise ForbiddenException(message=f"没有权限删除此{resource_name}")


def check_comment_delete_permission(
    comment_obj: Optional[object],
    article_obj: Optional[object],
    user: User,
    resource_name: str = "评论"
) -> None:
    """
    检查评论删除权限（作者或文章作者可删除）

    Args:
        comment_obj: 评论对象（需要包含author_id属性）
        article_obj: 文章对象（需要包含author_id属性）
        user: 当前用户
        resource_name: 资源名称，用于错误消息

    Raises:
        HTTPException: 资源不存在时抛出404错误；ForbiddenException: 权限不足时抛出403错误
    """
    if not comment_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_name}不存在"
        )

    # 超级用户可以删除任何评论
    if user.is_superuser:
        return

    # 评论作者或文章作者可以删除评论
    comment_author_id = getattr(comment_obj, 'author_id', None)
    article_author_id = getattr(article_obj, 'author_id', None) if article_obj else None

    if comment_author_id != user.id and article_author_id != user.id:
        raise ForbiddenException(message=f"没有权限删除此{resource_name}")


def check_approve_permission(
    resource_obj: Optional[object],
    user: User,
    resource_name: str = "评论"
) -> None:
    """
    检查审核权限（文章作者或超级用户）

    Args:
        resource_obj: 关联的资源对象（如评论关联的文章，需要包含author_id属性）
        user: 当前用户
        resource_name: 资源名称，用于错误消息

    Raises:
        HTTPException: 资源不存在时抛出404错误；ForbiddenException: 权限不足时抛出403错误
    """
    if not resource_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_name}不存在"
        )

    # 超级用户可以审核
    if user.is_superuser:
        return

    # 资源作者可以审核
    if getattr(resource_obj, 'author_id', None) != user.id:
        raise ForbiddenException(message=f"没有权限审核此{resource_name}")


def check_superuser(
    user: User,
    detail: str = "此操作需要超级管理员权限"
) -> None:
    """
    检查是否为超级用户

    Args:
        user: 当前用户
        detail: 错误消息，默认为"此操作需要超级管理员权限"

    Raises:
        ForbiddenException: 非超级用户时抛出403错误
    """
    if not user.is_superuser:
        raise ForbiddenException(message=detail)


def check_active_user(
    user: User,
    detail: str = "用户已被禁用"
) -> None:
    """
    检查用户是否活跃

    Args:
        user: 当前用户
        detail: 错误消息，默认为"用户已被禁用"

    Raises:
        HTTPException: 用户未激活时抛出400错误
    """
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )
