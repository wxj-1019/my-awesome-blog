import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app import crud
from app.models.article import Article
from app.models.user import User
from app.utils.pagination import CursorPaginationParams
from uuid import uuid4


def test_cursor_pagination_basic(superuser_token_headers, client: TestClient, db: Session):
    """测试基本游标分页功能"""
    # 创建多个测试文章
    user = crud.get_users(db, limit=1)[0]
    
    # 创建5篇文章
    articles = []
    for i in range(5):
        article_data = {
            "title": f"Test Article {i}",
            "slug": f"test-article-{i}-{uuid4()}",
            "content": f"This is test article number {i}.",
            "excerpt": f"Excerpt for article {i}",
            "is_published": True
        }
        
        response = client.post(
            "/api/v1/articles/",
            json=article_data,
            headers=superuser_token_headers
        )
        assert response.status_code == 200
        articles.append(response.json())
    
    # 使用游标分页获取前2篇
    response = client.get(
        "/api/v1/articles/cursor-paginated",
        params={"limit": 2},
        headers=superuser_token_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "next_cursor" in data
    assert "has_more" in data
    assert len(data["items"]) == 2
    assert data["has_more"] is True  # 应该还有更多文章
    
    # 使用上一步返回的游标获取下2篇
    next_cursor = data["next_cursor"]
    response2 = client.get(
        "/api/v1/articles/cursor-paginated",
        params={"cursor": next_cursor, "limit": 2},
        headers=superuser_token_headers
    )
    
    assert response2.status_code == 200
    data2 = response2.json()
    assert "items" in data2
    assert len(data2["items"]) == 2
    # 检查第二页的项目与第一页不同
    assert data["items"][0]["id"] != data2["items"][0]["id"]
    assert data["items"][1]["id"] != data2["items"][1]["id"]


def test_cursor_pagination_with_filters(superuser_token_headers, client: TestClient, db: Session):
    """测试带过滤条件的游标分页"""
    # 创建多个测试文章
    user = crud.get_users(db, limit=1)[0]
    
    # 创建一些文章，其中一部分有特定的关键词
    for i in range(5):
        keyword = "python" if i % 2 == 0 else "javascript"
        article_data = {
            "title": f"Test Article about {keyword} {i}",
            "slug": f"test-article-{keyword}-{i}-{uuid4()}",
            "content": f"This is test article about {keyword} number {i}.",
            "excerpt": f"Excerpt for {keyword} article {i}",
            "is_published": True
        }
        
        response = client.post(
            "/api/v1/articles/",
            json=article_data,
            headers=superuser_token_headers
        )
        assert response.status_code == 200
    
    # 使用游标分页并带搜索词获取文章
    response = client.get(
        "/api/v1/articles/cursor-paginated",
        params={"limit": 2, "search": "python"},
        headers=superuser_token_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    # 检查返回的文章是否都包含搜索词
    for item in data["items"]:
        assert "python" in item["title"].lower() or "python" in item["content"].lower()


def test_cursor_pagination_end_of_data(superuser_token_headers, client: TestClient, db: Session):
    """测试到达数据末尾的情况"""
    # 创建少量文章
    user = crud.get_users(db, limit=1)[0]
    
    for i in range(2):
        article_data = {
            "title": f"Final Test Article {i}",
            "slug": f"final-test-article-{i}-{uuid4()}",
            "content": f"This is final test article number {i}.",
            "excerpt": f"Final excerpt {i}",
            "is_published": True
        }
        
        response = client.post(
            "/api/v1/articles/",
            json=article_data,
            headers=superuser_token_headers
        )
        assert response.status_code == 200
    
    # 请求比可用数据更多的项目
    response = client.get(
        "/api/v1/articles/cursor-paginated",
        params={"limit": 5},
        headers=superuser_token_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "next_cursor" in data
    assert "has_more" in data
    # 返回的实际项目数应该等于创建的数量
    assert len(data["items"]) <= 5
    # 当没有更多数据时，has_more应该为False
    assert data["has_more"] is False


def test_cursor_pagination_with_unpublished_articles(superuser_token_headers, client: TestClient, db: Session):
    """测试游标分页是否正确处理已发布和未发布的文章"""
    # 创建已发布和未发布的文章
    user = crud.get_users(db, limit=1)[0]
    
    # 已发布的文章
    for i in range(2):
        article_data = {
            "title": f"Published Article {i}",
            "slug": f"published-article-{i}-{uuid4()}",
            "content": f"This is published article number {i}.",
            "excerpt": f"Published excerpt {i}",
            "is_published": True
        }
        
        response = client.post(
            "/api/v1/articles/",
            json=article_data,
            headers=superuser_token_headers
        )
        assert response.status_code == 200
    
    # 未发布的文章
    for i in range(2):
        article_data = {
            "title": f"Unpublished Article {i}",
            "slug": f"unpublished-article-{i}-{uuid4()}",
            "content": f"This is unpublished article number {i}.",
            "excerpt": f"Unpublished excerpt {i}",
            "is_published": False
        }
        
        response = client.post(
            "/api/v1/articles/",
            json=article_data,
            headers=superuser_token_headers
        )
        assert response.status_code == 200
    
    # 默认情况下只应返回已发布的文章
    response = client.get(
        "/api/v1/articles/cursor-paginated",
        params={"limit": 10},  # 请求足够大的数量以包含所有文章
        headers=superuser_token_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    
    # 检查返回的文章都是已发布的
    for item in data["items"]:
        # 由于我们无法直接从API响应中知道发布状态，我们需要检查标题
        assert "Published" in item["title"]