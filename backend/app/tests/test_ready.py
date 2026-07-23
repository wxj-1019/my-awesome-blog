"""就绪探针 /ready 与存活探针 /health"""
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import status


def test_health_alive(client):
    response = client.get("/health")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data.get("status") == "healthy"
    assert "service" in data


def test_ready_ok_when_db_and_redis_up(client, monkeypatch):
    """DB 可用 + Redis ping 成功 → 200 ready"""
    from app.services import cache_service as cs_mod

    mock_redis = MagicMock()
    mock_redis.ping = AsyncMock(return_value=True)
    monkeypatch.setattr(cs_mod.cache_service, "redis", mock_redis, raising=False)

    response = client.get("/ready")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "ready"
    assert data["checks"]["database"]["status"] == "ok"
    assert data["checks"]["redis"]["status"] == "ok"


def test_ready_fails_when_redis_down(client, monkeypatch):
    """Redis 未连接 → 503 not_ready"""
    from app.services import cache_service as cs_mod

    monkeypatch.setattr(cs_mod.cache_service, "redis", None, raising=False)

    response = client.get("/ready")
    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    data = response.json()
    assert data["status"] == "not_ready"
    assert data["checks"]["redis"]["status"] == "error"
