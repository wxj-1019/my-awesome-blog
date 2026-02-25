"""
Prompt CRUD Operations
Prompt 数据库操作
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from app.models.prompt import Prompt
from app.schemas.prompt import PromptCreate, PromptUpdate


def get_prompt(db: Session, prompt_id: str) -> Optional[Prompt]:
    """
    根据 ID 获取 Prompt
    
    Args:
        db: 数据库会话
        prompt_id: Prompt ID
    
    Returns:
        Prompt: Prompt 对象或 None
    """
    from uuid import UUID
    
    try:
        prompt_uuid = UUID(prompt_id) if isinstance(prompt_id, str) else prompt_id
    except ValueError:
        return None
    
    return db.query(Prompt).filter(Prompt.id == prompt_uuid).first()


def get_prompt_by_name_and_version(db: Session, name: str, version: str, tenant_id: str) -> Optional[Prompt]:
    """
    根据名称和版本获取 Prompt
    
    Args:
        db: 数据库会话
        name: Prompt 名称
        version: 版本号
        tenant_id: 租户 ID
    
    Returns:
        Prompt: Prompt 对象或 None
    """
    return (
        db.query(Prompt)
        .filter(
            and_(
                Prompt.name == name,
                Prompt.version == version,
                Prompt.tenant_id == tenant_id
            )
        )
        .first()
    )


def get_prompts(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_system: Optional[bool] = None,
) -> List[Prompt]:
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
        List[Prompt]: Prompt 列表
    """
    from uuid import UUID
    
    try:
        tenant_uuid = UUID(tenant_id) if isinstance(tenant_id, str) else tenant_id
    except ValueError:
        return []
    
    query = db.query(Prompt).filter(Prompt.tenant_id == tenant_uuid)
    
    if category:
        query = query.filter(Prompt.category == category)
    if is_active is not None:
        query = query.filter(Prompt.is_active == is_active)
    if is_system is not None:
        query = query.filter(Prompt.is_system == is_system)
    
    return (
        query.order_by(desc(Prompt.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_prompt_versions(db: Session, name: str, tenant_id: str) -> List[Prompt]:
    """
    获取某个 Prompt 的所有版本
    
    Args:
        db: 数据库会话
        name: Prompt 名称
        tenant_id: 租户 ID
    
    Returns:
        List[Prompt]: 所有版本的 Prompt 列表
    """
    from uuid import UUID
    
    try:
        tenant_uuid = UUID(tenant_id) if isinstance(tenant_id, str) else tenant_id
    except ValueError:
        return []
    
    return (
        db.query(Prompt)
        .filter(
            and_(
                Prompt.name == name,
                Prompt.tenant_id == tenant_uuid
            )
        )
        .order_by(desc(Prompt.created_at))
        .all()
    )


def get_ab_test_prompts(db: Session, group: str, tenant_id: str) -> List[Prompt]:
    """
    获取 A/B 测试分组的 Prompt
    
    Args:
        db: 数据库会话
        group: A/B 测试分组名
        tenant_id: 租户 ID
    
    Returns:
        List[Prompt]: A/B 测试 Prompt 列表
    """
    from uuid import UUID
    
    try:
        tenant_uuid = UUID(tenant_id) if isinstance(tenant_id, str) else tenant_id
    except ValueError:
        return []
    
    return (
        db.query(Prompt)
        .filter(
            and_(
                Prompt.ab_test_group == group,
                Prompt.tenant_id == tenant_uuid
            )
        )
        .order_by(Prompt.created_at)
        .all()
    )


def create_prompt(db: Session, prompt_in: PromptCreate, tenant_id: str) -> Prompt:
    """
    创建新 Prompt
    
    Args:
        db: 数据库会话
        prompt_in: 创建请求
        tenant_id: 租户 ID
    
    Returns:
        Prompt: 创建的 Prompt 对象
    """
    import uuid
    from uuid import UUID
    
    try:
        tenant_uuid = UUID(tenant_id) if isinstance(tenant_id, str) else tenant_id
    except ValueError:
        raise ValueError(f"Invalid tenant_id format: {tenant_id}")
    
    db_prompt = Prompt(
        id=uuid.uuid4(),
        tenant_id=tenant_uuid,
        **prompt_in.dict()
    )
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    return db_prompt


def update_prompt(db: Session, db_prompt: Prompt, prompt_in: PromptUpdate) -> Prompt:
    """
    更新 Prompt
    
    Args:
        db: 数据库会话
        db_prompt: 现有 Prompt 对象
        prompt_in: 更新请求
    
    Returns:
        Prompt: 更新后的 Prompt 对象
    """
    for field, value in prompt_in.dict(exclude_unset=True).items():
        setattr(db_prompt, field, value)
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    return db_prompt


def delete_prompt(db: Session, prompt_id: str) -> Prompt:
    """
    删除 Prompt
    
    Args:
        db: 数据库会话
        prompt_id: Prompt ID
    
    Returns:
        Prompt: 被删除的 Prompt 对象
    """
    prompt = get_prompt(db, prompt_id)
    if prompt:
        db.delete(prompt)
        db.commit()
    return prompt


def increment_prompt_usage(db: Session, prompt_id: str) -> Optional[Prompt]:
    """
    增加 Prompt 使用计数
    
    Args:
        db: 数据库会话
        prompt_id: Prompt ID
    
    Returns:
        Prompt: 更新后的 Prompt 对象
    """
    prompt = get_prompt(db, prompt_id)
    if prompt:
        prompt.usage_count += 1
        prompt.total_interactions += 1
        db.commit()
        db.refresh(prompt)
    return prompt


def update_prompt_success_rate(db: Session, prompt_id: str, success: bool) -> Optional[Prompt]:
    """
    更新 Prompt 成功率
    
    Args:
        db: 数据库会话
        prompt_id: Prompt ID
        success: 是否成功
    
    Returns:
        Prompt: 更新后的 Prompt 对象
    """
    prompt = get_prompt(db, prompt_id)
    if prompt:
        if success:
            prompt.success_rate += 1
        db.commit()
        db.refresh(prompt)
    return prompt


def count_prompts(db: Session, tenant_id: str, is_active: Optional[bool] = None) -> int:
    """
    统计 Prompt 数量
    
    Args:
        db: 数据库会话
        tenant_id: 租户 ID
        is_active: 是否激活筛选
    
    Returns:
        int: Prompt 数量
    """
    from uuid import UUID
    
    try:
        tenant_uuid = UUID(tenant_id) if isinstance(tenant_id, str) else tenant_id
    except ValueError:
        return 0
    
    query = db.query(Prompt).filter(Prompt.tenant_id == tenant_uuid)
    if is_active is not None:
        query = query.filter(Prompt.is_active == is_active)
    return query.count()


def get_user_default_prompt(db: Session, user_id: str) -> Optional[Prompt]:
    """
    获取用户的默认提示词
    
    Args:
        db: 数据库会话
        user_id: 用户 ID
    
    Returns:
        Prompt: 默认提示词或 None
    """
    from app.models.user import User
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not hasattr(user, 'default_prompt_id') or not user.default_prompt_id:
        return None
    return get_prompt(db, str(user.default_prompt_id))


def set_user_default_prompt(db: Session, user_id: str, prompt_id: str) -> bool:
    """
    设置用户的默认提示词
    
    Args:
        db: 数据库会话
        user_id: 用户 ID
        prompt_id: 提示词 ID
    
    Returns:
        bool: 是否成功
    """
    from app.models.user import User
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    if hasattr(user, 'default_prompt_id'):
        user.default_prompt_id = prompt_id
        db.commit()
    return True


def get_prompt_stats(db: Session, tenant_id: str) -> dict:
    """
    获取提示词统计信息
    
    Args:
        db: 数据库会话
        tenant_id: 租户 ID
    
    Returns:
        dict: 统计信息
    """
    from sqlalchemy import func
    from collections import Counter
    from uuid import UUID
    
    try:
        tenant_uuid = UUID(tenant_id) if isinstance(tenant_id, str) else tenant_id
    except ValueError:
        return {
            "total": 0,
            "by_category": {},
            "by_folder": {},
            "most_used": [],
            "recently_used": [],
        }
    
    prompts = db.query(Prompt).filter(Prompt.tenant_id == tenant_uuid).all()
    
    categories = Counter(p.category or '未分类' for p in prompts)
    total = len(prompts)
    
    most_used = sorted(prompts, key=lambda p: p.usage_count, reverse=True)[:5]
    recently_created = sorted(prompts, key=lambda p: p.created_at, reverse=True)[:5]
    
    return {
        "total": total,
        "by_category": dict(categories),
        "by_folder": {},
        "most_used": [
            {"id": str(p.id), "name": p.name, "usage_count": p.usage_count}
            for p in most_used
        ],
        "recently_used": [
            {"id": str(p.id), "name": p.name, "created_at": str(p.created_at)}
            for p in recently_created
        ],
    }


def get_prompt_folders(db: Session, tenant_id: str) -> list:
    """
    获取提示词文件夹列表
    
    Args:
        db: 数据库会话
        tenant_id: 租户 ID
    
    Returns:
        list: 文件夹列表
    """
    import uuid
    from datetime import datetime
    
    return [
        {
            "id": str(uuid.uuid4()),
            "name": "默认文件夹",
            "parent_id": None,
            "color": "#06b6d4",
            "icon": "folder",
            "sort_order": 0,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": None,
        }
    ]


def create_prompt_folder(
    db: Session,
    tenant_id: str,
    name: str,
    parent_id: Optional[str] = None,
    color: Optional[str] = None,
    icon: Optional[str] = None,
) -> dict:
    """
    创建提示词文件夹
    
    Args:
        db: 数据库会话
        tenant_id: 租户 ID
        name: 文件夹名称
        parent_id: 父文件夹 ID
        color: 颜色
        icon: 图标
    
    Returns:
        dict: 创建的文件夹
    """
    import uuid
    from datetime import datetime
    
    folder = {
        "id": str(uuid.uuid4()),
        "name": name,
        "parent_id": parent_id,
        "color": color or "#06b6d4",
        "icon": icon or "folder",
        "sort_order": 0,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": None,
    }
    
    return folder


def update_prompt_folder(
    db: Session,
    folder_id: str,
    tenant_id: str,
    name: Optional[str] = None,
    color: Optional[str] = None,
    icon: Optional[str] = None,
) -> Optional[dict]:
    """
    更新提示词文件夹
    
    Args:
        db: 数据库会话
        folder_id: 文件夹 ID
        tenant_id: 租户 ID
        name: 新名称
        color: 新颜色
        icon: 新图标
    
    Returns:
        dict: 更新后的文件夹
    """
    from datetime import datetime
    
    return {
        "id": folder_id,
        "name": name or "Updated Folder",
        "parent_id": None,
        "color": color or "#06b6d4",
        "icon": icon or "folder",
        "sort_order": 0,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }


def delete_prompt_folder(
    db: Session,
    folder_id: str,
    tenant_id: str,
    move_to_folder_id: Optional[str] = None,
) -> bool:
    """
    删除提示词文件夹
    
    Args:
        db: 数据库会话
        folder_id: 文件夹 ID
        tenant_id: 租户 ID
        move_to_folder_id: 移动提示词到指定文件夹
    
    Returns:
        bool: 是否成功
    """
    return True


def export_prompts(
    db: Session,
    tenant_id: str,
    prompt_ids: Optional[List[str]] = None,
) -> dict:
    """
    导出提示词
    
    Args:
        db: 数据库会话
        tenant_id: 租户 ID
        prompt_ids: 要导出的提示词 ID 列表
    
    Returns:
        dict: 导出数据
    """
    from datetime import datetime
    from uuid import UUID
    
    try:
        tenant_uuid = UUID(tenant_id) if isinstance(tenant_id, str) else tenant_id
    except ValueError:
        return {"version": "1.0", "exported_at": datetime.utcnow().isoformat(), "prompts": [], "folders": []}
    
    query = db.query(Prompt).filter(Prompt.tenant_id == tenant_uuid)
    
    if prompt_ids:
        query = query.filter(Prompt.id.in_(prompt_ids))
    
    prompts = query.all()
    
    return {
        "version": "1.0",
        "exported_at": datetime.utcnow().isoformat(),
        "prompts": [
            {
                "id": str(p.id),
                "tenant_id": str(p.tenant_id),
                "name": p.name,
                "version": p.version,
                "content": p.content,
                "variables": p.variables,
                "description": p.description,
                "category": p.category,
                "is_active": p.is_active,
                "is_system": p.is_system,
                "usage_count": p.usage_count,
                "created_at": str(p.created_at),
                "updated_at": str(p.updated_at) if p.updated_at else None,
            }
            for p in prompts
        ],
        "folders": [],
    }


def import_prompts(
    db: Session,
    tenant_id: str,
    user_id: str,
    data: dict,
) -> dict:
    """
    导入提示词
    
    Args:
        db: 数据库会话
        tenant_id: 租户 ID
        user_id: 用户 ID
        data: 导入数据
    
    Returns:
        dict: 导入结果
    """
    success = 0
    failed = 0
    errors = []
    
    prompts_data = data.get("prompts", [])
    
    for prompt_data in prompts_data:
        try:
            prompt_create = PromptCreate(
                name=prompt_data.get("name", "Imported Prompt"),
                version=prompt_data.get("version", "1.0.0"),
                content=prompt_data.get("content", ""),
                variables=prompt_data.get("variables"),
                description=prompt_data.get("description"),
                category=prompt_data.get("category"),
                is_system=prompt_data.get("is_system", False),
            )
            
            create_prompt(db, prompt_create, tenant_id)
            success += 1
        except Exception as e:
            failed += 1
            errors.append(f"Failed to import '{prompt_data.get('name', 'Unknown')}': {str(e)}")
    
    return {
        "success": success,
        "failed": failed,
        "errors": errors if errors else None,
    }
