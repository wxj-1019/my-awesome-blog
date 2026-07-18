from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.crud.tenant import tenant as crud_tenant
from app.crud.prompt import get_prompts
from app.crud.memory import get_memories
from app.crud.conversation import get_conversations
from app.schemas.tenant import TenantCreate, TenantUpdate
from app.models.tenant import Tenant
from app.models.conversation import Conversation, ConversationMessage
from app.models.prompt import Prompt
from app.models.memory import Memory
from app.utils.logger import app_logger


class TenantService:
    def __init__(self, db: Session):
        self.db = db

    async def create_tenant(self, tenant_in: TenantCreate) -> Tenant:
        app_logger.info(f"Creating tenant: {tenant_in.name}")
        tenant = crud_tenant.create(db=self.db, obj_in=tenant_in)
        app_logger.success(f"Tenant created with ID: {tenant.id}")
        return tenant

    def get_tenant(self, tenant_id: str) -> Optional[Tenant]:
        return crud_tenant.get(db=self.db, id=tenant_id)

    def get_tenant_by_slug(self, slug: str) -> Optional[Tenant]:
        return crud_tenant.get_by_slug(db=self.db, slug=slug)

    def list_tenants(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> tuple[List[Tenant], int]:
        query = self.db.query(Tenant)
        
        if search:
            query = query.filter(
                Tenant.name.ilike(f"%{search}%") | 
                Tenant.slug.ilike(f"%{search}%")
            )
        
        if status_filter:
            if status_filter.lower() == "active":
                query = query.filter(Tenant.is_active == True)
            elif status_filter.lower() == "inactive":
                query = query.filter(Tenant.is_active == False)
        
        total = query.count()
        tenants = query.offset(skip).limit(limit).all()
        return tenants, total

    def update_tenant(self, tenant_id: str, tenant_in: TenantUpdate) -> Optional[Tenant]:
        app_logger.info(f"Updating tenant: {tenant_id}")
        tenant = crud_tenant.get(db=self.db, id=tenant_id)
        if not tenant:
            app_logger.warning(f"Tenant not found: {tenant_id}")
            return None
        
        tenant = crud_tenant.update(db=self.db, db_obj=tenant, obj_in=tenant_in)
        app_logger.success(f"Tenant updated: {tenant_id}")
        return tenant

    def delete_tenant(self, tenant_id: str) -> bool:
        app_logger.info(f"Deleting tenant: {tenant_id}")
        success = crud_tenant.delete(db=self.db, id=tenant_id)
        if success:
            app_logger.success(f"Tenant deleted: {tenant_id}")
        else:
            app_logger.warning(f"Tenant not found: {tenant_id}")
        return success

    def get_usage_stats(self, tenant_id: str) -> Dict[str, Any]:
        tenant = crud_tenant.get(db=self.db, id=tenant_id)
        if not tenant:
            return {}
        
        app_logger.info(f"Calculating usage stats for tenant: {tenant_id}")
        
        prompt_count = self.db.query(func.count(Prompt.id)).filter(
            Prompt.tenant_id == tenant_id
        ).scalar() or 0

        memory_count = self.db.query(func.count(Memory.id)).filter(
            Memory.tenant_id == tenant_id
        ).scalar() or 0

        conversation_count = self.db.query(func.count(Conversation.id)).filter(
            Conversation.tenant_id == tenant_id
        ).scalar() or 0

        message_count = self.db.query(func.count(ConversationMessage.id)).join(
            Conversation, ConversationMessage.conversation_id == Conversation.id
        ).filter(Conversation.tenant_id == tenant_id).scalar() or 0
        
        storage_used_mb = 0.0
        if tenant.max_storage_mb > 0:
            storage_percentage = min(100.0, storage_used_mb / tenant.max_storage_mb * 100)
        else:
            storage_percentage = 0.0
        
        stats = {
            "tenant_id": str(tenant.id),
            "prompt_count": prompt_count,
            "memory_count": memory_count,
            "conversation_count": conversation_count,
            "message_count": message_count,
            "storage_used_mb": storage_used_mb,
            "storage_percentage": storage_percentage,
            "storage_limit_mb": tenant.max_storage_mb,
            "status": "active" if tenant.is_active else "inactive"
        }
        
        app_logger.info(f"Usage stats for tenant {tenant_id}: {stats}")
        return stats

    def get_tenant_config(self, tenant_id: str) -> Dict[str, Any]:
        tenant = crud_tenant.get(db=self.db, id=tenant_id)
        if not tenant:
            return {}
        
        config = {
            "id": str(tenant.id),
            "name": tenant.name,
            "slug": tenant.slug,
            "description": tenant.description,
            "max_users": tenant.max_users,
            "max_conversations": tenant.max_conversations,
            "max_storage_mb": tenant.max_storage_mb,
            "is_active": tenant.is_active,
            "created_at": tenant.created_at,
            "updated_at": tenant.updated_at
        }
        
        return config

    def check_tenant_limits(self, tenant_id: str) -> Dict[str, Any]:
        tenant = crud_tenant.get(db=self.db, id=tenant_id)
        if not tenant:
            return {"allowed": False, "reason": "Tenant not found"}
        
        if not tenant.is_active:
            return {"allowed": False, "reason": "Tenant is not active"}
        
        return {
            "allowed": True,
            "tenant_id": str(tenant.id),
            "limits": {
                "max_users": tenant.max_users,
                "max_conversations": tenant.max_conversations,
                "max_storage_mb": tenant.max_storage_mb
            }
        }
