"""
Prompt Repository
Prompt 存储库，处理数据库操作
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.prompt import Prompt as PromptModel
from app.prompts.base import PromptTemplate, PromptVariable
from app.utils.logger import app_logger


class PromptRepository:
    """
    Prompt 存储库
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(
        self,
        name: str,
        version: str,
        content: str,
        tenant_id: str,
        variables: Optional[dict] = None,
        description: Optional[str] = None,
        category: Optional[str] = None,
        is_system: bool = False,
        ab_test_group: Optional[str] = None,
        ab_test_percentage: int = 50,
    ) -> PromptModel:
        """
        创建 Prompt
        
        Args:
            name: 名称
            version: 版本号
            content: 内容
            tenant_id: 租户 ID
            variables: 变量定义
            description: 描述
            category: 分类
            is_system: 是否系统 Prompt
            ab_test_group: A/B 测试分组
            ab_test_percentage: A/B 测试分配百分比
        
        Returns:
            PromptModel: 创建的 Prompt 对象
        """
        import uuid
        prompt = PromptModel(
            id=uuid.uuid4(),
            name=name,
            version=version,
            content=content,
            tenant_id=tenant_id,
            variables=variables or {},
            description=description,
            category=category,
            is_system=is_system,
            ab_test_group=ab_test_group,
            ab_test_percentage=ab_test_percentage,
        )
        self.db.add(prompt)
        self.db.commit()
        self.db.refresh(prompt)
        app_logger.info(f"Created prompt: {name} v{version}")
        return prompt
    
    def get_by_id(self, prompt_id: str, tenant_id: str) -> Optional[PromptModel]:
        """
        根据 ID 获取 Prompt
        
        Args:
            prompt_id: Prompt ID
            tenant_id: 租户 ID
        
        Returns:
            PromptModel: Prompt 对象或 None
        """
        return (
            self.db.query(PromptModel)
            .filter(
                PromptModel.id == prompt_id,
                PromptModel.tenant_id == tenant_id
            )
            .first()
        )
    
    def get_by_name_and_version(
        self,
        name: str,
        version: str,
        tenant_id: str
    ) -> Optional[PromptModel]:
        """
        根据名称和版本获取 Prompt
        
        Args:
            name: Prompt 名称
            version: 版本号
            tenant_id: 租户 ID
        
        Returns:
            PromptModel: Prompt 对象或 None
        """
        return (
            self.db.query(PromptModel)
            .filter(
                PromptModel.name == name,
                PromptModel.version == version,
                PromptModel.tenant_id == tenant_id
            )
            .first()
        )
    
    def list(
        self,
        tenant_id: str,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        is_active: Optional[bool] = None,
        is_system: Optional[bool] = None,
    ) -> List[PromptModel]:
        """
        获取 Prompt 列表
        
        Args:
            tenant_id: 租户 ID
            skip: 跳过数量
            limit: 限制数量
            category: 分类筛选
            is_active: 是否激活筛选
            is_system: 是否系统 Prompt 筛选
        
        Returns:
            List[PromptModel]: Prompt 列表
        """
        from sqlalchemy import desc
        
        query = self.db.query(PromptModel).filter(PromptModel.tenant_id == tenant_id)
        
        if category:
            query = query.filter(PromptModel.category == category)
        if is_active is not None:
            query = query.filter(PromptModel.is_active == is_active)
        if is_system is not None:
            query = query.filter(PromptModel.is_system == is_system)
        
        return query.order_by(desc(PromptModel.created_at)).offset(skip).limit(limit).all()
    
    def get_versions(self, name: str, tenant_id: str) -> List[PromptModel]:
        """
        获取某个 Prompt 的所有版本
        
        Args:
            name: Prompt 名称
            tenant_id: 租户 ID
        
        Returns:
            List[PromptModel]: 所有版本的 Prompt 列表
        """
        from sqlalchemy import desc
        
        return (
            self.db.query(PromptModel)
            .filter(
                PromptModel.name == name,
                PromptModel.tenant_id == tenant_id
            )
            .order_by(desc(PromptModel.created_at))
            .all()
        )
    
    def get_ab_test_group(
        self,
        group: str,
        tenant_id: str
    ) -> List[PromptModel]:
        """
        获取 A/B 测试分组
        
        Args:
            group: A/B 测试分组名
            tenant_id: 租户 ID
        
        Returns:
            List[PromptModel]: A/B 测试 Prompt 列表
        """
        return (
            self.db.query(PromptModel)
            .filter(
                PromptModel.ab_test_group == group,
                PromptModel.tenant_id == tenant_id
            )
            .order_by(PromptModel.created_at)
            .all()
        )
    
    def update(
        self,
        prompt: PromptModel,
        **kwargs
    ) -> PromptModel:
        """
        更新 Prompt
        
        Args:
            prompt: Prompt 对象
            **kwargs: 更新字段
        
        Returns:
            PromptModel: 更新后的 Prompt 对象
        """
        for field, value in kwargs.items():
            setattr(prompt, field, value)
        self.db.add(prompt)
        self.db.commit()
        self.db.refresh(prompt)
        app_logger.info(f"Updated prompt: {prompt.id}")
        return prompt
    
    def delete(self, prompt_id: str) -> bool:
        """
        删除 Prompt
        
        Args:
            prompt_id: Prompt ID
        
        Returns:
            bool: 是否成功删除
        """
        prompt = self.get_by_id(prompt_id, prompt_id)
        if prompt:
            self.db.delete(prompt)
            self.db.commit()
            app_logger.info(f"Deleted prompt: {prompt_id}")
            return True
        return False
    
    def increment_usage(self, prompt_id: str) -> bool:
        """
        原子增加使用计数
        
        Args:
            prompt_id: Prompt ID
        
        Returns:
            bool: 是否更新成功
        """
        from app.models.prompt import Prompt
        result = self.db.query(Prompt).filter(Prompt.id == prompt_id).update(
            {
                Prompt.usage_count: Prompt.usage_count + 1,
                Prompt.total_interactions: Prompt.total_interactions + 1,
            },
            synchronize_session=False,
        )
        self.db.commit()
        return result > 0
    
    def update_success_rate(self, prompt_id: str, success: bool) -> bool:
        """
        原子更新成功率计数
        
        Args:
            prompt_id: Prompt ID
            success: 是否成功
        
        Returns:
            bool: 是否更新成功
        """
        from app.models.prompt import Prompt
        updates = {Prompt.total_interactions: Prompt.total_interactions + 1}
        if success:
            updates[Prompt.success_rate] = Prompt.success_rate + 1
        result = self.db.query(Prompt).filter(Prompt.id == prompt_id).update(
            updates,
            synchronize_session=False,
        )
        self.db.commit()
        return result > 0
