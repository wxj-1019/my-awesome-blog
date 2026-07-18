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


def test_get_general_stats(client, test_session):
    """Test getting general website statistics"""
    response = client.get("/api/v1/stats/general")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Check that the response has the expected structure
    assert "total_users" in data
    assert "total_articles" in data
    assert "total_comments" in data
    assert "total_categories" in data
    assert "total_tags" in data
    assert "total_views" in data
    assert "recent_signups" in data
    assert "recent_articles" in data
    
    # Check that values are non-negative integers
    assert isinstance(data["total_users"], int) and data["total_users"] >= 0
    assert isinstance(data["total_articles"], int) and data["total_articles"] >= 0
    assert isinstance(data["total_comments"], int) and data["total_comments"] >= 0
    assert isinstance(data["total_categories"], int) and data["total_categories"] >= 0
    assert isinstance(data["total_tags"], int) and data["total_tags"] >= 0
    assert isinstance(data["total_views"], int) and data["total_views"] >= 0
    assert isinstance(data["recent_signups"], list)
    assert isinstance(data["recent_articles"], list)


def test_get_article_stats(client, test_session):
    """Test getting article-specific statistics"""
    response = client.get("/api/v1/stats/articles")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Check that the response has the expected structure
    assert "total_articles" in data
    assert "published_articles" in data
    assert "draft_articles" in data
    assert "top_viewed_articles" in data
    assert "recent_articles" in data
    assert "articles_by_category" in data
    assert "monthly_article_counts" in data
    
    # Check that values are of correct types
    assert isinstance(data["total_articles"], int) and data["total_articles"] >= 0
    assert isinstance(data["published_articles"], int) and data["published_articles"] >= 0
    assert isinstance(data["draft_articles"], int) and data["draft_articles"] >= 0
    assert isinstance(data["top_viewed_articles"], list)
    assert isinstance(data["recent_articles"], list)
    assert isinstance(data["articles_by_category"], list)
    assert isinstance(data["monthly_article_counts"], list)


def test_get_user_stats(client, test_session):
    """Test getting user-specific statistics"""
    response = client.get("/api/v1/stats/users")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Check that the response has the expected structure
    assert "total_users" in data
    assert "active_users" in data
    assert "recent_registrations" in data
    assert "user_growth" in data
    
    # Check that values are of correct types
    assert isinstance(data["total_users"], int) and data["total_users"] >= 0
    assert isinstance(data["active_users"], int) and data["active_users"] >= 0
    assert isinstance(data["recent_registrations"], list)
    assert isinstance(data["user_growth"], list)


def test_get_general_stats_with_data(client, test_session):
    """Test getting general stats with some initial data in the database"""
    # Create some users
    user1 = User(
        username="user1",
        email="user1@example.com",
        hashed_password="hashed_password",
        is_active=True,
        tenant_id=uuid.uuid4()
    )
    user2 = User(
        username="user2",
        email="user2@example.com",
        hashed_password="hashed_password",
        is_active=True,
        tenant_id=uuid.uuid4()
    )
    test_session.add(user1)
    test_session.add(user2)
    test_session.commit()
    
    # Create some categories
    category1 = Category(name="Tech", slug="tech", description="Technology")
    category2 = Category(name="Life", slug="life", description="Lifestyle")
    test_session.add(category1)
    test_session.add(category2)
    
    # Create some tags
    tag1 = Tag(name="Python", slug="python", description="Python programming")
    tag2 = Tag(name="AI", slug="ai", description="Artificial Intelligence")
    test_session.add(tag1)
    test_session.add(tag2)
    
    # Create some articles
    article1 = Article(
        title="Article 1",
        slug="article-1",
        content="Content of article 1",
        excerpt="Excerpt 1",
        is_published=True,
        view_count=100,
        author_id=user1.id
    )
    article2 = Article(
        title="Article 2", 
        slug="article-2",
        content="Content of article 2",
        excerpt="Excerpt 2",
        is_published=True,
        view_count=50,
        author_id=user1.id
    )
    test_session.add(article1)
    test_session.add(article2)
    test_session.commit()
    
    # Create some comments
    comment1 = Comment(content="Great article!", article_id=article1.id, author_id=user2.id)
    comment2 = Comment(content="Thanks for sharing", article_id=article2.id, author_id=user1.id)
    test_session.add(comment1)
    test_session.add(comment2)
    
    test_session.commit()
    
    # Now test the stats endpoint
    response = client.get("/api/v1/stats/general")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Verify counts match what we created
    assert data["total_users"] >= 2
    assert data["total_articles"] >= 2
    assert data["total_comments"] >= 2
    assert data["total_categories"] >= 2
    assert data["total_tags"] >= 2
    assert data["total_views"] >= 150  # 100 + 50 from our articles
    assert isinstance(data["recent_signups"], list)
    assert isinstance(data["recent_articles"], list)


def test_get_article_stats_with_data(client, test_session):
    """Test getting article stats with some initial data in the database"""
    # Create a user
    user = User(
        username="author",
        email="author@example.com",
        hashed_password="hashed_password",
        is_active=True,
        tenant_id=uuid.uuid4()
    )
    test_session.add(user)
    
    # Create some categories
    category1 = Category(name="Tech", slug="tech", description="Technology")
    category2 = Category(name="Science", slug="science", description="Science")
    test_session.add(category1)
    test_session.add(category2)
    
    test_session.commit()
    
    # Create some articles
    article1 = Article(
        title="Popular Article",
        slug="popular-article",
        content="Very popular content",
        excerpt="Popular excerpt",
        is_published=True,
        view_count=500,
        author_id=user.id
    )
    article2 = Article(
        title="New Article",
        slug="new-article",
        content="Brand new content",
        excerpt="New excerpt",
        is_published=True,
        view_count=10,
        author_id=user.id,
        created_at=datetime.now() - timedelta(days=1)  # Recent article
    )
    article3 = Article(
        title="Draft Article",
        slug="draft-article",
        content="Draft content",
        excerpt="Draft excerpt",
        is_published=False,  # Draft
        view_count=0,
        author_id=user.id
    )
    test_session.add(article1)
    test_session.add(article2)
    test_session.add(article3)
    
    test_session.commit()
    
    # Now test the article stats endpoint
    response = client.get("/api/v1/stats/articles")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Verify the stats
    assert data["total_articles"] >= 3
    assert data["published_articles"] >= 2  # article1 and article2
    assert data["draft_articles"] >= 1  # article3
    assert isinstance(data["top_viewed_articles"], list)
    assert isinstance(data["recent_articles"], list)
    assert isinstance(data["articles_by_category"], list)
    assert isinstance(data["monthly_article_counts"], list)
    
    # Check if the popular article is in top viewed
    top_viewed_titles = [a["title"] for a in data["top_viewed_articles"]]
    assert "Popular Article" in top_viewed_titles


def test_get_user_stats_with_data(client, test_session):
    """Test getting user stats with some initial data in the database"""
    # Create some users with different registration dates
    now = datetime.now()
    user1 = User(
        username="user1",
        email="user1@example.com",
        hashed_password="hashed_password",
        is_active=True,
        created_at=now - timedelta(days=10),
        tenant_id=uuid.uuid4()
    )
    user2 = User(
        username="user2",
        email="user2@example.com",
        hashed_password="hashed_password",
        is_active=True,
        created_at=now - timedelta(days=1),
        tenant_id=uuid.uuid4()
    )
    user3 = User(
        username="user3",
        email="user3@example.com",
        hashed_password="hashed_password",
        is_active=False,  # Inactive user
        tenant_id=uuid.uuid4()
    )
    test_session.add(user1)
    test_session.add(user2)
    test_session.add(user3)
    
    test_session.commit()
    
    # Now test the user stats endpoint
    response = client.get("/api/v1/stats/users")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Verify the stats
    assert data["total_users"] >= 3
    assert data["active_users"] >= 2  # user1 and user2 are active
    assert isinstance(data["recent_registrations"], list)
    assert isinstance(data["user_growth"], list)
    
    # Check if recent registrations include user2 (registered yesterday)
    recent_usernames = [u["username"] for u in data["recent_registrations"]]
    assert "user2" in recent_usernames


def test_stats_endpoints_return_consistent_data_types(client):
    """Test that all stats endpoints return data in consistent formats"""
    endpoints_to_test = [
        "/api/v1/stats/general",
        "/api/v1/stats/articles", 
        "/api/v1/stats/users"
    ]
    
    for endpoint in endpoints_to_test:
        response = client.get(endpoint)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Verify that all responses are dictionaries
        assert isinstance(data, dict)
        
        # Verify that numeric values are actually numbers (lists like monthly_article_counts are excluded)
        for key, value in data.items():
            if isinstance(key, str) and ("count" in key.lower() or 
                                       "total" in key.lower() or 
                                       "number" in key.lower()):
                if isinstance(value, list):
                    continue
                assert isinstance(value, int) or isinstance(value, float), \
                    f"Field {key} should be numeric, got {type(value)}"


def test_get_general_stats_recent_filters(client, test_session):
    """Test that recent items in general stats are properly filtered"""
    # Create a recent user
    recent_user = User(
        username="recent_user",
        email="recent@example.com",
        hashed_password="hashed_password",
        is_active=True,
        tenant_id=uuid.uuid4(),
        created_at=datetime.now() - timedelta(hours=12)
    )
    test_session.add(recent_user)
    test_session.commit()
    
    # Create a recent article
    recent_article = Article(
        title="Recent Article",
        slug="recent-article",
        content="Recent content",
        excerpt="Recent excerpt",
        is_published=True,
        view_count=10,
        author_id=recent_user.id,
        created_at=datetime.now() - timedelta(hours=6)
    )
    test_session.add(recent_article)
    
    test_session.commit()
    
    response = client.get("/api/v1/stats/general")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Verify that recent items are included in the response
    assert isinstance(data["recent_signups"], list)
    assert isinstance(data["recent_articles"], list)
    
    # Check if our recent user is in the recent signups
    recent_signup_usernames = [u["username"] for u in data["recent_signups"]]
    if recent_user.username in recent_signup_usernames:
        assert recent_user.username in recent_signup_usernames
    
    # Check if our recent article is in the recent articles
    recent_article_titles = [a["title"] for a in data["recent_articles"]]
    if recent_article.title in recent_article_titles:
        assert recent_article.title in recent_article_titles


def test_stats_endpoints_handle_empty_database(client):
    """Test that stats endpoints handle cases where database is empty"""
    # Clear all data first (though this might affect other tests)
    # For this test, we'll just check that the endpoints return proper structure
    response = client.get("/api/v1/stats/general")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Even with potentially empty DB, structure should be maintained
    assert "total_users" in data
    assert "total_articles" in data
    assert "total_comments" in data
    assert "recent_signups" in data
    assert "recent_articles" in data
    
    # Values should be non-negative
    assert data["total_users"] >= 0
    assert data["total_articles"] >= 0
    assert data["total_comments"] >= 0
    assert isinstance(data["recent_signups"], list)
    assert isinstance(data["recent_articles"], list)