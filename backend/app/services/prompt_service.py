"""
Prompt Service
Prompt 管理服务层，处理业务逻辑
"""

from typing import List, Optional, Dict, Any
import random
from sqlalchemy.orm import Session
from app.models.prompt import Prompt
from app.schemas.prompt import (
    PromptCreate,
    PromptUpdate,
    PromptListResponse,
    PromptVersionsResponse,
    PromptVersionInfo,
    PromptABTestResult,
)
from app.crud import prompt as prompt_crud
from app.utils.logger import app_logger


class PromptService:
    """
    Prompt 服务类
    """

    def __init__(self):
        pass

    def create_prompt(
        self,
        db: Session,
        prompt_in: PromptCreate,
        tenant_id: str
    ) -> Prompt:
        """
        创建新 Prompt
        
        Args:
            db: 数据库会话
            prompt_in: 创建请求
            tenant_id: 租户 ID
        
        Returns:
            Prompt: 创建的 Prompt 对象
        """
        app_logger.info(f"Creating prompt: {prompt_in.name} v{prompt_in.version}")
        return prompt_crud.create_prompt(db, prompt_in, tenant_id)

    def get_prompt(
        self,
        db: Session,
        prompt_id: str,
        tenant_id: str
    ) -> Optional[Prompt]:
        """
        获取 Prompt
        
        Args:
            db: 数据库会话
            prompt_id: Prompt ID
            tenant_id: 租户 ID
        
        Returns:
            Prompt: Prompt 对象或 None
        """
        from uuid import UUID
        
        prompt = prompt_crud.get_prompt(db, prompt_id)
        if prompt:
            try:
                tenant_uuid = UUID(tenant_id) if isinstance(tenant_id, str) else tenant_id
                if prompt.tenant_id != tenant_uuid:
                    app_logger.warning(f"Prompt {prompt_id} does not belong to tenant {tenant_id}")
                    return None
            except ValueError:
                app_logger.warning(f"Invalid tenant_id format: {tenant_id}")
                return None
        return prompt

    def get_prompts(
        self,
        db: Session,
        tenant_id: str,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        is_active: Optional[bool] = None,
        is_system: Optional[bool] = None,
    ) -> PromptListResponse:
        """
        获取 Prompt 列表
        
        Args:
            db: 数据库会话
            tenant_id: 租户 ID
            skip: 跳过数量
            limit: 限制数量
            category: 分类筛选
            is_active: 是否激活筛选
            is_system: 是否系统 Prompt 筛选
        
        Returns:
            PromptListResponse: Prompt 列表响应
        """
        prompts = prompt_crud.get_prompts(
            db, tenant_id, skip, limit, category, is_active, is_system
        )
        total = prompt_crud.count_prompts(db, tenant_id, is_active)
        
        return PromptListResponse(
            prompts=prompts,
            total=total,
            page=skip // limit + 1,
            page_size=limit
        )

    def get_prompt_versions(
        self,
        db: Session,
        name: str,
        tenant_id: str
    ) -> PromptVersionsResponse:
        """
        获取某个 Prompt 的所有版本
        
        Args:
            db: 数据库会话
            name: Prompt 名称
            tenant_id: 租户 ID
        
        Returns:
            PromptVersionsResponse: 版本列表响应
        """
        prompts = prompt_crud.get_prompt_versions(db, name, tenant_id)
        
        versions = [
            PromptVersionInfo(
                version=p.version,
                created_at=p.created_at,
                is_active=p.is_active,
                usage_count=p.usage_count
            )
            for p in prompts
        ]
        
        return PromptVersionsResponse(name=name, versions=versions)

    def get_ab_test_prompts(
        self,
        db: Session,
        group: str,
        tenant_id: str
    ) -> List[Prompt]:
        """
        获取 A/B 测试分组的 Prompt
        
        Args:
            db: 数据库会话
            group: A/B 测试分组名
            tenant_id: 租户 ID
        
        Returns:
            List[Prompt]: A/B 测试 Prompt 列表
        """
        return prompt_crud.get_ab_test_prompts(db, group, tenant_id)

    def select_prompt_for_ab_test(
        self,
        db: Session,
        group: str,
        tenant_id: str
    ) -> Optional[Prompt]:
        """
        为 A/B 测试选择 Prompt
        
        根据配置的百分比随机选择
        
        Args:
            db: 数据库会话
            group: A/B 测试分组名
            tenant_id: 租户 ID
        
        Returns:
            Prompt: 选中的 Prompt 对象或 None
        """
        prompts = prompt_crud.get_ab_test_prompts(db, group, tenant_id)
        
        if not prompts or len(prompts) != 2:
            app_logger.warning(f"Invalid A/B test configuration for group: {group}")
            return None
        
        prompt_a, prompt_b = prompts
        percentage_a = prompt_a.ab_test_percentage or 50
        
        selected = prompt_a if random.random() < (percentage_a / 100) else prompt_b
        
        app_logger.info(
            f"Selected prompt for A/B test: {selected.name} v{selected.version} "
            f"(group: {group}, percentage: {percentage_a}%)"
        )
        
        return selected

    def update_prompt(
        self,
        db: Session,
        prompt_id: str,
        prompt_in: PromptUpdate,
        tenant_id: str
    ) -> Optional[Prompt]:
        """
        更新 Prompt
        
        Args:
            db: 数据库会话
            prompt_id: Prompt ID
            prompt_in: 更新请求
            tenant_id: 租户 ID
        
        Returns:
            Prompt: 更新后的 Prompt 对象或 None
        """
        prompt = self.get_prompt(db, prompt_id, tenant_id)
        if not prompt:
            return None
        
        app_logger.info(f"Updating prompt: {prompt_id}")
        return prompt_crud.update_prompt(db, prompt, prompt_in)

    def delete_prompt(
        self,
        db: Session,
        prompt_id: str,
        tenant_id: str
    ) -> Optional[Prompt]:
        """
        删除 Prompt
        
        Args:
            db: 数据库会话
            prompt_id: Prompt ID
            tenant_id: 租户 ID
        
        Returns:
            Prompt: 被删除的 Prompt 对象或 None
        """
        prompt = self.get_prompt(db, prompt_id, tenant_id)
        if not prompt:
            return None
        
        app_logger.info(f"Deleting prompt: {prompt_id}")
        return prompt_crud.delete_prompt(db, prompt_id)

    def track_prompt_usage(
        self,
        db: Session,
        prompt_id: str,
        success: bool = True
    ) -> Optional[Prompt]:
        """
        跟踪 Prompt 使用情况
        
        Args:
            db: 数据库会话
            prompt_id: Prompt ID
            success: 是否成功
        
        Returns:
            Prompt: 更新后的 Prompt 对象或 None
        """
        prompt = prompt_crud.get_prompt(db, prompt_id)
        if not prompt:
            return None
        
        prompt_crud.increment_prompt_usage(db, prompt_id)
        prompt_crud.update_prompt_success_rate(db, prompt_id, success)
        
        app_logger.debug(
            f"Tracked prompt usage: {prompt_id}, success: {success}"
        )
        
        return prompt_crud.get_prompt(db, prompt_id)

    def optimize_prompt_content(
        self,
        content: str,
        max_length: int = 2000
    ) -> str:
        """
        优化 Prompt 内容
        
        去除冗余空格、合并重复空行等
        
        Args:
            content: 原始内容
            max_length: 最大长度限制
        
        Returns:
            str: 优化后的内容
        """
        import re
        
        content = re.sub(r'\n{3,}', '\n\n', content)
        content = re.sub(r'[ \t]+', ' ', content)
        lines = content.split('\n')
        lines = [line.strip() for line in lines if line.strip()]
        
        if max_length:
            total = 0
            result = []
            for line in lines:
                if total + len(line) > max_length:
                    break
                result.append(line)
                total += len(line)
            lines = result
        
        return '\n'.join(lines)


prompt_service = PromptService()
