import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app import crud
from app.models.user import User
from app.models.logs.audit_log import AuditLog
from app.schemas.audit_log import AuditLogCreate
from uuid import UUID
import json


def test_create_audit_log(superuser_token_headers, db: Session):
    """测试创建审计日志"""
    # 准备测试数据
    user = crud.get_users(db, limit=1)[0]  # 获取第一个用户
    
    audit_log_data = {
        "user_id": str(user.id),
        "action": "CREATE_ARTICLE",
        "resource_type": "article",
        "resource_id": "test-article-id",
        "old_values": json.dumps({"title": "", "content": ""}),
        "new_values": json.dumps({"title": "Test Article", "content": "Test Content"}),
        "ip_address": "127.0.0.1",
        "user_agent": "Test Agent"
    }
    
    # 创建审计日志
    audit_log = crud.create_audit_log(
        db=db,
        user_id=user.id,
        action=audit_log_data["action"],
        resource_type=audit_log_data["resource_type"],
        resource_id=audit_log_data["resource_id"],
        old_values=json.loads(audit_log_data["old_values"]),
        new_values=json.loads(audit_log_data["new_values"]),
        ip_address=audit_log_data["ip_address"],
        user_agent=audit_log_data["user_agent"]
    )
    
    # 验证审计日志被正确创建
    assert audit_log is not None
    assert audit_log.action == audit_log_data["action"]
    assert audit_log.resource_type == audit_log_data["resource_type"]
    assert audit_log.resource_id == audit_log_data["resource_id"]
    assert audit_log.user_id == user.id


def test_get_audit_log(superuser_token_headers, client: TestClient, db: Session):
    """测试获取审计日志"""
    # 创建一个审计日志
    user = crud.get_users(db, limit=1)[0]
    audit_log = crud.create_audit_log(
        db=db,
        user_id=user.id,
        action="TEST_ACTION",
        resource_type="test_resource",
        resource_id="test-resource-id"
    )
    
    # 通过API获取审计日志（需要超级用户权限）
    response = client.get(
        f"/api/v1/audit-logs/",
        headers=superuser_token_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    # 由于审计日志端点需要超级用户权限，检查返回的数据结构
    assert isinstance(data, list)


def test_get_audit_logs_pagination(superuser_token_headers, client: TestClient, db: Session):
    """测试审计日志分页功能"""
    # 创建多个审计日志
    user = crud.get_users(db, limit=1)[0]
    for i in range(5):
        crud.create_audit_log(
            db=db,
            user_id=user.id,
            action=f"TEST_ACTION_{i}",
            resource_type="test_resource",
            resource_id=f"test-resource-id-{i}"
        )
    
    # 测试分页
    response = client.get(
        "/api/v1/audit-logs/?skip=0&limit=3",
        headers=superuser_token_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 3  # 应该最多返回3个项目


def test_get_audit_logs_by_user(superuser_token_headers, client: TestClient, db: Session):
    """测试按用户获取审计日志"""
    # 创建一个用户和相关的审计日志
    user = crud.get_users(db, limit=1)[0]
    audit_log = crud.create_audit_log(
        db=db,
        user_id=user.id,
        action="USER_ACTION",
        resource_type="user_resource",
        resource_id="user-resource-id"
    )
    
    # 通过API获取特定用户的审计日志
    response = client.get(
        f"/api/v1/audit-logs/user/{user.id}?skip=0&limit=10",
        headers=superuser_token_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    # 至少应该返回我们刚创建的那个审计日志
    found_log = next((log for log in data if log["id"] == str(audit_log.id)), None)
    assert found_log is not None
    assert found_log["user_id"] == str(user.id)


def test_get_audit_logs_by_action(superuser_token_headers, client: TestClient, db: Session):
    """测试按操作类型获取审计日志"""
    # 创建一个审计日志
    user = crud.get_users(db, limit=1)[0]
    action_name = "SPECIAL_ACTION"
    audit_log = crud.create_audit_log(
        db=db,
        user_id=user.id,
        action=action_name,
        resource_type="test_resource",
        resource_id="special-resource-id"
    )
    
    # 通过API获取特定操作类型的审计日志
    response = client.get(
        f"/api/v1/audit-logs/action/{action_name}?skip=0&limit=10",
        headers=superuser_token_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    # 至少应该返回我们刚创建的那个审计日志
    found_log = next((log for log in data if log["id"] == str(audit_log.id)), None)
    assert found_log is not None
    assert found_log["action"] == action_name