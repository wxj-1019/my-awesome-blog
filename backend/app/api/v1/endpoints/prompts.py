"""
Prompts API Endpoints
Prompt 管理相关的 API 接口
"""

from typing import Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_superuser
from app.schemas.prompt import (
    PromptCreate,
    PromptUpdate,
    Prompt,
    PromptListResponse,
    PromptVersionsResponse,
    PromptABTestResult,
)
from app.schemas.llm import LLMMessage
from app.models.user import User
from app.services.prompt_service import prompt_service
from app.utils.logger import app_logger

router = APIRouter()


@router.post("/", response_model=Prompt, status_code=status.HTTP_201_CREATED)
def create_prompt(
    *,
    db: Session = Depends(get_db),
    prompt_in: PromptCreate,
    current_user: User = Depends(get_current_superuser),
) -> Prompt:
    """
    创建新 Prompt
    
    - **name**: Prompt 名称
    - **version**: 版本号
    - **content**: Prompt 内容
    - **variables**: 变量定义（可选）
    - **description**: 描述（可选）
    - **category**: 分类（可选）
    - **is_system**: 是否系统 Prompt（默认为 False）
    - **ab_test_group**: A/B 测试分组（可选）
    - **ab_test_percentage**: A/B 测试分配百分比（默认为 50）
    """
    from app.services.prompt_service import PromptOptimizer
    
    prompt_content = PromptOptimizer.optimize_structure(prompt_in.content)
    
    prompt = prompt_service.create_prompt(
        db=db,
        prompt_in=PromptCreate(**prompt_in.dict(), content=prompt_content),
        tenant_id=str(current_user.tenant_id)
    )
    
    app_logger.info(f"User {current_user.username} created prompt: {prompt.name} v{prompt.version}")
    return prompt


@router.get("/", response_model=PromptListResponse, status_code=status.HTTP_200_OK)
def list_prompts(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    is_system: Optional[bool] = Query(None),
) -> PromptListResponse:
    """
    获取 Prompt 列表
    
    - **skip**: 跳过数量（分页）
    - **limit**: 限制数量（分页）
    - **category**: 分类筛选（可选）
    - **is_active**: 是否激活筛选（可选）
    - **is_system**: 是否系统 Prompt 筛选（可选）
    """
    return prompt_service.get_prompts(
        db=db,
        tenant_id=str(current_user.tenant_id),
        skip=skip,
        limit=limit,
        category=category,
        is_active=is_active,
        is_system=is_system,
    )


@router.get("/default", response_model=Optional[Prompt], status_code=status.HTTP_200_OK)
def get_default_prompt(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Optional[Prompt]:
    """
    获取用户的默认提示词
    """
    from app.crud.prompt import get_user_default_prompt
    
    prompt = get_user_default_prompt(db, str(current_user.id))
    return prompt


@router.get("/folders", response_model=list, status_code=status.HTTP_200_OK)
def list_folders(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list:
    """
    获取提示词文件夹列表
    """
    from app.crud.prompt import get_prompt_folders
    
    folders = get_prompt_folders(db, str(current_user.tenant_id))
    return folders


@router.post("/folders", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_folder(
    *,
    db: Session = Depends(get_db),
    folder_in: dict,
    current_user: User = Depends(get_current_superuser),
) -> dict:
    """
    创建提示词文件夹
    
    - **name**: 文件夹名称
    - **parent_id**: 父文件夹ID（可选）
    - **color**: 颜色（可选）
    - **icon**: 图标（可选）
    """
    from app.crud.prompt import create_prompt_folder
    
    folder = create_prompt_folder(
        db=db,
        tenant_id=str(current_user.tenant_id),
        name=folder_in.get("name", "New Folder"),
        parent_id=folder_in.get("parent_id"),
        color=folder_in.get("color"),
        icon=folder_in.get("icon"),
    )
    
    app_logger.info(f"User {current_user.username} created folder: {folder.get('name')}")
    return folder


@router.put("/folders/{folder_id}", response_model=dict, status_code=status.HTTP_200_OK)
def update_folder(
    *,
    db: Session = Depends(get_db),
    folder_id: str,
    folder_in: dict,
    current_user: User = Depends(get_current_superuser),
) -> dict:
    """
    更新提示词文件夹
    
    - **folder_id**: 文件夹ID
    - **name**: 新名称（可选）
    - **color**: 新颜色（可选）
    - **icon**: 新图标（可选）
    """
    from app.crud.prompt import update_prompt_folder
    
    folder = update_prompt_folder(
        db=db,
        folder_id=folder_id,
        tenant_id=str(current_user.tenant_id),
        name=folder_in.get("name"),
        color=folder_in.get("color"),
        icon=folder_in.get("icon"),
    )
    
    if not folder:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
    
    app_logger.info(f"User {current_user.username} updated folder: {folder_id}")
    return folder


@router.delete("/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(
    *,
    db: Session = Depends(get_db),
    folder_id: str,
    move_to: Optional[str] = Query(None),
    current_user: User = Depends(get_current_superuser),
):
    """
    删除提示词文件夹
    
    - **folder_id**: 文件夹ID
    - **move_to**: 移动提示词到指定文件夹（可选）
    """
    from app.crud.prompt import delete_prompt_folder
    
    success = delete_prompt_folder(
        db=db,
        folder_id=folder_id,
        tenant_id=str(current_user.tenant_id),
        move_to_folder_id=move_to,
    )
    
    if not success:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
    
    app_logger.info(f"User {current_user.username} deleted folder: {folder_id}")


@router.get("/stats", response_model=dict, status_code=status.HTTP_200_OK)
def get_prompt_stats(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """
    获取提示词统计信息
    """
    from app.crud.prompt import get_prompt_stats as crud_get_stats
    
    stats = crud_get_stats(db, str(current_user.tenant_id))
    return stats


@router.get("/export", response_model=dict, status_code=status.HTTP_200_OK)
def export_prompts(
    *,
    db: Session = Depends(get_db),
    ids: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """
    导出提示词
    
    - **ids**: 要导出的提示词ID列表（逗号分隔，可选，不传则导出全部）
    """
    from app.crud.prompt import export_prompts as crud_export
    
    prompt_ids = ids.split(",") if ids else None
    
    data = crud_export(
        db=db,
        tenant_id=str(current_user.tenant_id),
        prompt_ids=prompt_ids,
    )
    
    app_logger.info(f"User {current_user.username} exported prompts")
    return data


@router.post("/import", response_model=dict, status_code=status.HTTP_200_OK)
def import_prompts(
    *,
    db: Session = Depends(get_db),
    data: dict,
    current_user: User = Depends(get_current_superuser),
) -> dict:
    """
    导入提示词
    
    - **version**: 导入文件版本
    - **prompts**: 提示词列表
    - **folders**: 文件夹列表（可选）
    """
    from app.crud.prompt import import_prompts as crud_import
    
    result = crud_import(
        db=db,
        tenant_id=str(current_user.tenant_id),
        user_id=str(current_user.id),
        data=data,
    )
    
    app_logger.info(f"User {current_user.username} imported prompts: {result}")
    return result


@router.post("/optimize", response_model=dict, status_code=status.HTTP_200_OK)
def optimize_prompt(
    *,
    content: str = Query(..., min_length=1),
    max_length: Optional[int] = Query(None, ge=100),
    current_user: User = Depends(get_current_active_user),
):
    """
    优化 Prompt 内容
    
    - **content**: 要优化的 Prompt 内容
    - **max_length**: 最大长度限制（可选）
    """
    from app.services.prompt_service import PromptOptimizer
    
    from app.prompts.optimizer import PromptOptimizer as Optimizer
    
    optimized = Optimizer.optimize_structure(content)
    
    if max_length:
        optimized = Optimizer.compress(optimized, max_length)
    
    issues = Optimizer.validate_syntax(optimized)
    
    variables = Optimizer.extract_variables(optimized)
    
    app_logger.info(f"User {current_user.username} optimized prompt content")
    
    return {
        "original": content,
        "optimized": optimized,
        "issues": issues,
        "variables": variables,
        "length": len(optimized),
    }


@router.post("/ab-test/{group}/select", response_model=Prompt, status_code=status.HTTP_200_OK)
def select_ab_test_prompt(
    *,
    db: Session = Depends(get_db),
    group: str,
    current_user: User = Depends(get_current_active_user),
) -> Prompt:
    """
    为 A/B 测试选择 Prompt
    
    - **group**: A/B 测试分组名称
    """
    prompt = prompt_service.select_prompt_for_ab_test(
        db=db,
        group=group,
        tenant_id=str(current_user.tenant_id)
    )
    
    if not prompt:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"A/B test group '{group}' not found or invalid configuration"
        )
    
    app_logger.info(f"User {current_user.username} selected A/B test prompt: {prompt.name} v{prompt.version}")
    return prompt


@router.post("/ab-test/{group}/result", response_model=PromptABTestResult, status_code=status.HTTP_200_OK)
def record_ab_test_result(
    *,
    db: Session = Depends(get_db),
    group: str,
    winner: str,
    current_user: User = Depends(get_current_superuser),
):
    """
    记录 A/B 测试结果
    
    - **group**: A/B 测试分组名称
    - **winner**: 获胜的 Prompt 名称
    """
    from app.crud.prompt import get_ab_test_prompts
    
    prompts = get_ab_test_prompts(db, group, str(current_user.tenant_id))
    
    if not prompts or len(prompts) != 2:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid A/B test configuration for group: {group}"
        )
    
    app_logger.info(f"User {current_user.username} recorded A/B test result: {group} winner: {winner}")
    
    return PromptABTestResult(
        group_a=prompts[0],
        group_b=prompts[1],
        stats_a={"position": "A", "is_winner": prompts[0].name == winner},
        stats_b={"position": "B", "is_winner": prompts[1].name == winner},
    )


@router.get("/{prompt_id}", response_model=Prompt, status_code=status.HTTP_200_OK)
def get_prompt(
    *,
    db: Session = Depends(get_db),
    prompt_id: str,
    current_user: User = Depends(get_current_active_user),
) -> Prompt:
    """
    获取指定 Prompt
    
    - **prompt_id**: Prompt ID
    """
    prompt = prompt_service.get_prompt(db, prompt_id, str(current_user.tenant_id))
    
    if not prompt:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    return prompt


@router.put("/{prompt_id}", response_model=Prompt, status_code=status.HTTP_200_OK)
def update_prompt(
    *,
    db: Session = Depends(get_db),
    prompt_id: str,
    prompt_in: PromptUpdate,
    current_user: User = Depends(get_current_superuser),
) -> Prompt:
    """
    更新 Prompt
    
    - **prompt_id**: Prompt ID
    - **name**: 新名称（可选）
    - **version**: 新版本号（可选）
    - **content**: 新内容（可选）
    - **variables**: 新变量定义（可选）
    - **description**: 新描述（可选）
    - **category**: 新分类（可选）
    - **is_active**: 是否激活（可选）
    - **ab_test_group**: A/B 测试分组（可选）
    - **ab_test_percentage**: A/B 测试分配百分比（可选）
    """
    prompt = prompt_service.update_prompt(
        db=db,
        prompt_id=prompt_id,
        prompt_in=prompt_in,
        tenant_id=str(current_user.tenant_id)
    )
    
    if not prompt:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    app_logger.info(f"User {current_user.username} updated prompt: {prompt_id}")
    return prompt


@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prompt(
    *,
    db: Session = Depends(get_db),
    prompt_id: str,
    current_user: User = Depends(get_current_superuser),
):
    """
    删除 Prompt
    
    - **prompt_id**: Prompt ID
    """
    prompt = prompt_service.delete_prompt(
        db=db,
        prompt_id=prompt_id,
        tenant_id=str(current_user.tenant_id)
    )
    
    if not prompt:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    app_logger.info(f"User {current_user.username} deleted prompt: {prompt_id}")


@router.get("/{name}/versions", response_model=PromptVersionsResponse, status_code=status.HTTP_200_OK)
def get_prompt_versions(
    *,
    db: Session = Depends(get_db),
    name: str,
    current_user: User = Depends(get_current_active_user),
) -> PromptVersionsResponse:
    """
    获取某个 Prompt 的所有版本
    
    - **name**: Prompt 名称
    """
    return prompt_service.get_prompt_versions(
        db=db,
        name=name,
        tenant_id=str(current_user.tenant_id)
    )


@router.post("/{prompt_id}/preview", response_model=dict, status_code=status.HTTP_200_OK)
def preview_prompt(
    *,
    prompt_in: PromptCreate,
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """
    预览 Prompt 渲染结果
    
    - **name**: Prompt 名称
    - **content**: Prompt 内容
    - **variables**: 变量定义
    - **example_values**: 示例变量值（可选）
    """
    from app.prompts.base import PromptTemplate, PromptVariable
    
    variables_dict = {}
    if prompt_in.variables:
        variables_dict = {
            name: PromptVariable(**var).dict()
            for name, var in prompt_in.variables.items()
        }
    
    template = PromptTemplate(template=prompt_in.content, variables=variables_dict)
    
    example_values = prompt_in.dict().get("example_values", {})
    
    try:
        rendered = template.render(**example_values)
        return {
            "rendered": rendered,
            "variables": list(variables_dict.keys()),
        }
    except ValueError as e:
        return {
            "error": str(e),
            "variables": list(variables_dict.keys()),
        }


@router.post("/{prompt_id}/duplicate", response_model=Prompt, status_code=status.HTTP_201_CREATED)
def duplicate_prompt(
    *,
    db: Session = Depends(get_db),
    prompt_id: str,
    current_user: User = Depends(get_current_superuser),
) -> Prompt:
    """
    复制 Prompt
    
    - **prompt_id**: 要复制的 Prompt ID
    """
    original = prompt_service.get_prompt(db, prompt_id, str(current_user.tenant_id))
    
    if not original:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    duplicated = PromptCreate(
        name=f"{original.name} (副本)",
        version="1.0.0",
        content=original.content,
        variables=original.variables,
        description=original.description,
        category=original.category,
        is_system=False,
    )
    
    prompt = prompt_service.create_prompt(
        db=db,
        prompt_in=duplicated,
        tenant_id=str(current_user.tenant_id)
    )
    
    app_logger.info(f"User {current_user.username} duplicated prompt: {prompt_id} -> {prompt.id}")
    return prompt


@router.post("/{prompt_id}/default", response_model=Prompt, status_code=status.HTTP_200_OK)
def set_default_prompt(
    *,
    db: Session = Depends(get_db),
    prompt_id: str,
    current_user: User = Depends(get_current_superuser),
) -> Prompt:
    """
    设置默认提示词
    
    - **prompt_id**: 要设为默认的 Prompt ID
    """
    prompt = prompt_service.get_prompt(db, prompt_id, str(current_user.tenant_id))
    
    if not prompt:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    from app.crud.prompt import set_user_default_prompt
    set_user_default_prompt(db, str(current_user.id), prompt_id)
    
    app_logger.info(f"User {current_user.username} set default prompt: {prompt_id}")
    return prompt


@router.post("/{prompt_id}/usage", status_code=status.HTTP_200_OK)
def increment_prompt_usage(
    *,
    db: Session = Depends(get_db),
    prompt_id: str,
    current_user: User = Depends(get_current_superuser),
):
    """
    增加提示词使用次数
    
    - **prompt_id**: Prompt ID
    """
    from app.crud.prompt import increment_prompt_usage
    
    prompt = prompt_service.get_prompt(db, prompt_id, str(current_user.tenant_id))
    if not prompt:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    increment_prompt_usage(db, prompt_id)
    return {"status": "ok"}
