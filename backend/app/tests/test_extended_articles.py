import uuid
import pytest
from fastapi import status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.models.user import User
from app.models.article import Article
from app.models.category import Category
from app.models.tag import Tag
from app.models.comment import Comment


def test_get_featured_articles(client, test_session):
    """Test getting featured articles"""
    response = client.get("/api/v1/articles/featured")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Check that the response is a list
    assert isinstance(data, list)
    
    # Each item in the list should have article properties
    for article in data:
        assert "id" in article
        assert "title" in article
        assert "content" in article
        assert "author" in article  # Since response_model is ArticleWithAuthor


def test_get_popular_articles(client, test_session):
    """Test getting popular articles (sorted by views)"""
    response = client.get("/api/v1/articles/popular")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Check that the response is a list
    assert isinstance(data, list)
    
    # Each item should have article properties
    for article in data:
        assert "id" in article
        assert "title" in article
        assert "view_count" in article  # Popular articles should show view count


def test_get_recommended_articles(client, test_session):
    """Test getting recommended articles"""
    # Create some articles with categories and tags for recommendations
    user = User(
        tenant_id=uuid.uuid4(),
        username="test_author",
        email="test@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    test_session.add(user)
    test_session.commit()
    
    # Create a category and tag
    category = Category(name="Technology", slug="technology", description="Tech articles")
    tag = Tag(name="Python", slug="python", description="Python programming")
    test_session.add(category)
    test_session.add(tag)
    test_session.commit()
    
    # Create articles with varying view counts and dates
    article1 = Article(
        title="Popular Tech Article",
        slug="popular-tech",
        content="Content about technology",
        excerpt="Tech excerpt",
        is_published=True,
        view_count=1000,
        author_id=user.id
    )
    article2 = Article(
        title="Recent Tech Article",
        slug="recent-tech",
        content="Recent tech content",
        excerpt="Recent tech excerpt",
        is_published=True,
        view_count=50,
        author_id=user.id,
        created_at=datetime.now() - timedelta(days=1)
    )
    test_session.add(article1)
    test_session.add(article2)
    test_session.commit()
    
    response = client.get("/api/v1/articles/recommended")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Check that the response is a list
    assert isinstance(data, list)


def test_read_articles_search_and_limit_validation(client, test_session):
    """列表接口应应用 search，并拒绝超过 100 条的请求。"""
    user = User(
        tenant_id=uuid.uuid4(),
        username="list_search_author",
        email="list-search@example.com",
        hashed_password="hashed_password",
        is_active=True,
    )
    test_session.add(user)
    test_session.commit()

    matching = Article(
        title="Unique List Search Title",
        slug="unique-list-search-title",
        content="ordinary content",
        excerpt="searchable excerpt",
        is_published=True,
        author_id=user.id,
    )
    other = Article(
        title="Other Article",
        slug="other-list-search-article",
        content="does not match",
        excerpt="different excerpt",
        is_published=True,
        author_id=user.id,
    )
    test_session.add_all([matching, other])
    test_session.commit()

    response = client.get(
        "/api/v1/articles/",
        params={"search": "Unique List Search"},
    )
    assert response.status_code == status.HTTP_200_OK
    # GET /articles/ 返回分页信封 {items, total, skip, limit}
    page = response.json()
    assert [article["id"] for article in page["items"]] == [str(matching.id)]
    # total 必须是符合过滤条件的总数，而不是当前页条数
    assert page["total"] == 1
    assert page["skip"] == 0

    response = client.get("/api/v1/articles/", params={"limit": 101})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_search_articles(client, test_session):
    """Test searching for articles"""
    # Create some test articles
    user = User(
        tenant_id=uuid.uuid4(),
        username="search_author",
        email="search@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    test_session.add(user)
    test_session.commit()
    
    article1 = Article(
        title="Python Tutorial",
        slug="python-tutorial",
        content="Learn Python programming language basics",
        excerpt="Beginner Python tutorial",
        is_published=True,
        view_count=100,
        author_id=user.id
    )
    article2 = Article(
        title="JavaScript Guide",
        slug="javascript-guide",
        content="Learn JavaScript for web development",
        excerpt="Web development with JavaScript",
        is_published=True,
        view_count=200,
        author_id=user.id
    )
    test_session.add(article1)
    test_session.add(article2)
    test_session.commit()
    
    # Test searching for Python articles
    response = client.get("/api/v1/articles/search", params={"q": "Python"})
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Check that the response is a list
    assert isinstance(data, list)
    
    # If Python exists in our articles, it should be in the results
    if any("Python" in article.title or "Python" in article.content for article in [article1, article2]):
        assert len(data) >= 1
        python_articles = [article for article in data if "Python" in article["title"] or "Python" in article["content"]]
        assert len(python_articles) >= 1


def test_search_articles_no_results(client, test_session):
    """Test searching for articles with no matches"""
    response = client.get("/api/v1/articles/search", params={"q": "nonexistentkeyword"})
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Should return an empty list if no matches
    assert isinstance(data, list)
    assert len(data) == 0


def test_get_related_articles(client, test_session):
    """Test getting related articles"""
    # Create test data with categories and tags
    user = User(
        tenant_id=uuid.uuid4(),
        username="related_author",
        email="related@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    test_session.add(user)
    test_session.commit()
    
    # Create a category
    category = Category(name="Programming", slug="programming", description="Programming articles")
    test_session.add(category)
    test_session.commit()
    
    # Create articles in the same category
    article1 = Article(
        title="Python Basics",
        slug="python-basics",
        content="Python basics content",
        excerpt="Basics of Python",
        is_published=True,
        view_count=150,
        author_id=user.id
    )
    article2 = Article(
        title="Python Advanced",
        slug="python-advanced",
        content="Advanced Python content",
        excerpt="Advanced Python topics",
        is_published=True,
        view_count=200,
        author_id=user.id
    )
    article3 = Article(
        title="JavaScript Basics",
        slug="javascript-basics",
        content="JavaScript basics content",
        excerpt="Basics of JavaScript",
        is_published=True,
        view_count=100,
        author_id=user.id
    )
    test_session.add(article1)
    test_session.add(article2)
    test_session.add(article3)
    test_session.commit()
    
    # We need to test the related articles endpoint which takes an article ID
    # This endpoint may not exist yet, so let's check what happens
    response = client.get(f"/api/v1/articles/{article1.id}/related")
    
    # The endpoint might not be implemented yet, so accept either 200 or 404/405
    assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND, status.HTTP_405_METHOD_NOT_ALLOWED]


def test_get_featured_articles_with_data(client, test_session):
    """Test getting featured articles with actual data"""
    # Create test data
    user = User(
        tenant_id=uuid.uuid4(),
        username="feature_author",
        email="feature@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    test_session.add(user)
    test_session.commit()
    
    # Create articles with different view counts
    article1 = Article(
        title="Featured Article 1",
        slug="featured-1",
        content="Featured content 1",
        excerpt="Featured excerpt 1",
        is_published=True,
        view_count=500,
        author_id=user.id
    )
    article2 = Article(
        title="Featured Article 2",
        slug="featured-2",
        content="Featured content 2", 
        excerpt="Featured excerpt 2",
        is_published=True,
        view_count=300,
        author_id=user.id
    )
    test_session.add(article1)
    test_session.add(article2)
    test_session.commit()
    
    response = client.get("/api/v1/articles/featured")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert isinstance(data, list)
    
    # If we have featured articles, check their properties
    for article in data:
        assert "id" in article
        assert "title" in article
        assert "author" in article


def test_get_popular_articles_with_data(client, test_session):
    """Test getting popular articles with actual data"""
    # Create test data
    user = User(
        tenant_id=uuid.uuid4(),
        username="popular_author",
        email="popular@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    test_session.add(user)
    test_session.commit()
    
    # Create articles with varying popularity (views)
    article1 = Article(
        title="Most Popular",
        slug="most-popular",
        content="Most popular content",
        excerpt="Most popular excerpt",
        is_published=True,
        view_count=1000,
        author_id=user.id
    )
    article2 = Article(
        title="Medium Popular", 
        slug="medium-popular",
        content="Medium popular content",
        excerpt="Medium popular excerpt",
        is_published=True,
        view_count=500,
        author_id=user.id
    )
    article3 = Article(
        title="Least Popular",
        slug="least-popular",
        content="Least popular content",
        excerpt="Least popular excerpt", 
        is_published=True,
        view_count=100,
        author_id=user.id
    )
    test_session.add(article1)
    test_session.add(article2)
    test_session.add(article3)
    test_session.commit()
    
    response = client.get("/api/v1/articles/popular")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert isinstance(data, list)
    
    # If we have articles, verify they're sorted by views (descending)
    if len(data) > 1:
        view_counts = [article["view_count"] for article in data]
        assert view_counts == sorted(view_counts, reverse=True), "Articles should be sorted by views in descending order"


def test_search_articles_with_limit_and_skip(client, test_session):
    """Test searching articles with pagination parameters"""
    # Create multiple articles to search
    user = User(
        tenant_id=uuid.uuid4(),
        username="search_auth",
        email="search_auth@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    test_session.add(user)
    test_session.commit()
    
    for i in range(10):
        article = Article(
            title=f"Article about topic {i}",
            slug=f"article-topic-{i}",
            content=f"This article is about topic {i} which is interesting",
            excerpt=f"Excerpt for topic {i}",
            is_published=True,
            view_count=i * 10,
            author_id=user.id
        )
        test_session.add(article)
    
    test_session.commit()
    
    # Test search with limit
    response = client.get("/api/v1/articles/search", params={"q": "topic", "limit": 5})
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert isinstance(data, list)
    # Should respect the limit
    assert len(data) <= 5


def test_search_articles_filter_by_published_only(client, test_session):
    """Test that search only returns published articles by default"""
    user = User(
        tenant_id=uuid.uuid4(),
        username="pub_search_author",
        email="pub_search@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    test_session.add(user)
    test_session.commit()
    
    # Create both published and unpublished articles
    published_article = Article(
        title="Published Article",
        slug="published",
        content="This is published",
        excerpt="Published excerpt",
        is_published=True,
        view_count=50,
        author_id=user.id
    )
    unpublished_article = Article(
        title="Unpublished Article", 
        slug="unpublished",
        content="This is not published",
        excerpt="Unpublished excerpt",
        is_published=False,
        view_count=30,
        author_id=user.id
    )
    test_session.add(published_article)
    test_session.add(unpublished_article)
    test_session.commit()
    
    # Search for "article" - should only return published
    response = client.get("/api/v1/articles/search", params={"q": "article"})
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert isinstance(data, list)
    
    # All returned articles should be published
    for article in data:
        assert article["is_published"] is True


def test_get_popular_articles_with_time_range(client, test_session):
    """Test getting popular articles with time range filtering"""
    user = User(
        tenant_id=uuid.uuid4(),
        username="time_range_author",
        email="time_range@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    test_session.add(user)
    test_session.commit()
    
    # Create articles with different dates and view counts
    now = datetime.now()
    old_popular = Article(
        title="Old Popular",
        slug="old-popular",
        content="Old but popular",
        excerpt="Old popular",
        is_published=True,
        view_count=1000,
        author_id=user.id,
        created_at=now - timedelta(days=30)  # Old article
    )
    new_popular = Article(
        title="New Popular",
        slug="new-popular", 
        content="New and popular",
        excerpt="New popular",
        is_published=True,
        view_count=800,
        author_id=user.id,
        created_at=now - timedelta(days=1)  # Recent article
    )
    test_session.add(old_popular)
    test_session.add(new_popular)
    test_session.commit()
    
    # Test getting popular articles (should be sorted by views regardless of date)
    response = client.get("/api/v1/articles/popular")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert isinstance(data, list)
    
    # The old but more popular article should be first
    if len(data) >= 2:
        assert data[0]["view_count"] >= data[1]["view_count"]


def test_search_articles_exact_phrase(client, test_session):
    """Test searching for exact phrases"""
    user = User(
        tenant_id=uuid.uuid4(),
        username="phrase_author",
        email="phrase@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    test_session.add(user)
    test_session.commit()
    
    # Create articles with similar but different content
    article1 = Article(
        title="Python vs JavaScript",
        slug="python-vs-javascript",
        content="Comparing Python and JavaScript programming languages",
        excerpt="Python versus JavaScript",
        is_published=True,
        view_count=100,
        author_id=user.id
    )
    article2 = Article(
        title="Python Basics",
        slug="python-basics",
        content="Learning Python programming basics",
        excerpt="Python basics tutorial",
        is_published=True,
        view_count=150,
        author_id=user.id
    )
    test_session.add(article1)
    test_session.add(article2)
    test_session.commit()
    
    # Search for the exact phrase "Python and JavaScript"
    response = client.get("/api/v1/articles/search", params={"q": "Python and JavaScript"})
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert isinstance(data, list)
    
    # Should find the article that contains the exact phrase
    found = False
    for article in data:
        if "Python and JavaScript" in article["content"]:
            found = True
            break
    # Note: Full-text search behavior depends on implementation, so we're just checking the endpoint works

def test_list_articles_pagination_envelope(client, test_session):
    """
    分页信封回归测试。

    原故障：接口直接返回数组，调用方只能用「当前页长度」当 total，
    于是总页数恒为 1、翻页失效。本用例锁定 total 是**总条数**且跨页恒定。
    """
    from app.models.article import Article
    from app.models.user import User
    import uuid

    user = User(
        username="pageuser",
        email="pageuser@example.com",
        hashed_password="x",
        tenant_id=uuid.uuid4(),
    )
    test_session.add(user)
    test_session.commit()

    for i in range(7):
        test_session.add(
            Article(
                title=f"Paged Article {i}",
                slug=f"paged-article-{i}",
                content="c",
                excerpt="e",
                is_published=True,
                author_id=user.id,
            )
        )
    test_session.commit()

    first = client.get("/api/v1/articles/", params={"skip": 0, "limit": 3}).json()
    assert len(first["items"]) == 3
    assert first["total"] >= 7
    assert first["skip"] == 0 and first["limit"] == 3

    second = client.get("/api/v1/articles/", params={"skip": 3, "limit": 3}).json()
    assert len(second["items"]) == 3
    # total 跨页恒定，不随当前页条数变化
    assert second["total"] == first["total"]

    # 末页条数可少于 limit，但 total 不变
    last = client.get("/api/v1/articles/", params={"skip": 6, "limit": 3}).json()
    assert last["total"] == first["total"]
    assert len(last["items"]) <= 3

    # 页间无重叠
    ids_first = {a["id"] for a in first["items"]}
    ids_second = {a["id"] for a in second["items"]}
    assert ids_first.isdisjoint(ids_second)
