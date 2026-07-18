from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_superuser
from app.models.user import User
from app.schemas.tenant import (
    Tenant,
    TenantCreate,
    TenantUpdate,
    TenantListResponse,
    TenantUsageStats,
    TenantConfig,
)
from app.services.tenant_service import TenantService
from app.utils.logger import app_logger

router = APIRouter()


@router.post("/", response_model=Tenant, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    *,
    db: Session = Depends(get_db),
    tenant_in: TenantCreate,
    current_user: User = Depends(get_current_superuser),
) -> Tenant:
    """创建租户（仅超级管理员）"""
    app_logger.info(f"User {current_user.id} creating tenant: {tenant_in.name}")
    service = TenantService(db)
    tenant = await service.create_tenant(tenant_in)
    return tenant


@router.get("/", response_model=TenantListResponse)
def list_tenants(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
) -> TenantListResponse:
    """分页列出租户（仅超级管理员）"""
    service = TenantService(db)
    tenants, total = service.list_tenants(
        skip=skip, limit=limit, search=search, status_filter=status
    )
    page = (skip // limit) + 1 if limit else 1
    return TenantListResponse(
        tenants=tenants,
        total=total,
        page=page,
        page_size=limit,
    )


@router.get("/slug/{slug}", response_model=Tenant)
def get_tenant_by_slug(
    slug: str,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Tenant:
    """按 slug 查询租户（原 /code 路径已废弃，与模型字段对齐）"""
    service = TenantService(db)
    tenant = service.get_tenant_by_slug(slug)
    if not tenant:
        app_logger.warning(f"Tenant not found by slug: {slug}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    return tenant


@router.get("/{tenant_id}", response_model=Tenant)
def get_tenant(
    tenant_id: str,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Tenant:
    """按 UUID 查询租户"""
    service = TenantService(db)
    tenant = service.get_tenant(tenant_id)
    if not tenant:
        app_logger.warning(f"Tenant not found: {tenant_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    return tenant


@router.put("/{tenant_id}", response_model=Tenant)
def update_tenant(
    tenant_id: str,
    *,
    db: Session = Depends(get_db),
    tenant_in: TenantUpdate,
    current_user: User = Depends(get_current_superuser),
) -> Tenant:
    """更新租户（仅超级管理员）"""
    app_logger.info(f"User {current_user.id} updating tenant: {tenant_id}")
    service = TenantService(db)
    tenant = service.update_tenant(tenant_id, tenant_in)
    if not tenant:
        app_logger.warning(f"Tenant not found: {tenant_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    return tenant


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tenant(
    tenant_id: str,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> None:
    """删除租户（仅超级管理员）"""
    app_logger.info(f"User {current_user.id} deleting tenant: {tenant_id}")
    service = TenantService(db)
    success = service.delete_tenant(tenant_id)
    if not success:
        app_logger.warning(f"Tenant not found: {tenant_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )


@router.get("/{tenant_id}/usage", response_model=TenantUsageStats)
def get_tenant_usage_stats(
    tenant_id: str,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> TenantUsageStats:
    """租户用量统计"""
    service = TenantService(db)
    stats = service.get_usage_stats(tenant_id)
    if not stats:
        app_logger.warning(f"Tenant not found: {tenant_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    return TenantUsageStats(
        tenant_id=str(stats.get("tenant_id", tenant_id)),
        user_count=int(stats.get("user_count", 0) or 0),
        conversation_count=int(stats.get("conversation_count", 0) or 0),
        message_count=int(stats.get("message_count", 0) or 0),
        memory_count=int(stats.get("memory_count", 0) or 0),
        storage_used_mb=float(stats.get("storage_used_mb", 0) or 0),
        storage_percentage=float(stats.get("storage_percentage", 0) or 0),
    )


@router.get("/{tenant_id}/config", response_model=TenantConfig)
def get_tenant_config(
    tenant_id: str,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> TenantConfig:
    """租户配置"""
    service = TenantService(db)
    config = service.get_tenant_config(tenant_id)
    if not config:
        app_logger.warning(f"Tenant not found: {tenant_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    return TenantConfig(tenant_id=str(tenant_id), config=config)


@router.get("/{tenant_id}/limits")
def check_tenant_limits(
    tenant_id: str,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """检查租户配额是否允许继续使用"""
    service = TenantService(db)
    limits = service.check_tenant_limits(tenant_id)
    if not limits.get("allowed"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=limits.get("reason", "Access denied"),
        )
    return limits
