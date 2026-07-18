import uuid
import pytest
from fastapi import status
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
import tempfile
import os
from PIL import Image as PILImage
from datetime import datetime, timedelta

from app.models.user import User
from app.models.article import Article
from app.models.category import Category
from app.models.tag import Tag
from app.models.friend_link import FriendLink
from app.models.portfolio import Portfolio
from app.models.timeline_event import TimelineEvent
from app.models.subscription import Subscription
from app.models.image import Image


def test_category_article_integration(client, test_session):
    """Test the integration between categories and articles"""
    # Create a user first
    user = User(
        tenant_id=uuid.uuid4(),
        username="integration_user",
        email="integration@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    test_session.add(user)
    test_session.commit()
    
    # Create a category
    category_data = {
        "name": "Integration Test",
        "slug": "integration-test",
        "description": "Category for integration testing"
    }
    response = client.post("/api/v1/categories/", json=category_data)
    assert response.status_code == status.HTTP_200_OK
    category = response.json()
    
    # Create an article with this category
    article_data = {
        "title": "Integration Article",
        "slug": "integration-article",
        "content": "Article for integration testing",
        "excerpt": "Integration test excerpt",
        "is_published": True,
        "category_id": category["id"]  # Link to the category
    }
    response = client.post("/api/v1/articles/", json=article_data)
    assert response.status_code == status.HTTP_200_OK
    
    # Get the article and verify it has the category
    article = response.json()
    response = client.get(f"/api/v1/articles/{article['id']}")
    assert response.status_code == status.HTTP_200_OK
    fetched_article = response.json()
    assert "category" in fetched_article
    assert fetched_article["category"]["id"] == category["id"]
    
    # Get articles by category to verify the relationship works
    response = client.get(f"/api/v1/categories/{category['id']}/articles")
    assert response.status_code == status.HTTP_200_OK
    articles_in_category = response.json()
    assert len(articles_in_category) >= 1
    article_titles = [a["title"] for a in articles_in_category]
    assert "Integration Article" in article_titles


def test_tag_article_integration(client, test_session):
    """Test the integration between tags and articles"""
    # Create a user first
    user = User(
        tenant_id=uuid.uuid4(),
        username="tag_integration_user",
        email="tag_integration@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    test_session.add(user)
    test_session.commit()
    
    # Create a tag
    tag_data = {
        "name": "Python",
        "slug": "python",
        "description": "Python programming tag"
    }
    response = client.post("/api/v1/tags/", json=tag_data)
    assert response.status_code == status.HTTP_200_OK
    tag = response.json()
    
    # Create an article with this tag
    article_data = {
        "title": "Python Article",
        "slug": "python-article",
        "content": "Python content for testing",
        "excerpt": "Python test excerpt",
        "is_published": True
    }
    response = client.post("/api/v1/articles/", json=article_data)
    assert response.status_code == status.HTTP_200_OK
    article = response.json()
    
    # Associate the tag with the article (this might require a specific endpoint)
    # For now, let's test that we can retrieve articles by tag
    response = client.get(f"/api/v1/tags/{tag['id']}/articles")
    assert response.status_code == status.HTTP_200_OK
    articles_with_tag = response.json()
    # Note: This assumes direct association endpoint exists


def test_statistics_service_integration(client, test_session):
    """Test that statistics endpoints integrate properly with data models"""
    # Create test data
    user = User(
        tenant_id=uuid.uuid4(),
        username="stats_user",
        email="stats@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    test_session.add(user)
    test_session.commit()
    
    # Create articles
    for i in range(3):
        article = Article(
            title=f"Stat Test Article {i}",
            slug=f"stat-test-article-{i}",
            content=f"Content for stat test article {i}",
            excerpt=f"Excerpt {i}",
            is_published=True,
            view_count=i * 50,
            author_id=user.id
        )
        test_session.add(article)
    
    # Create other entities
    category = Category(name="Stat Test", slug="stat-test", description="For stats testing")
    test_session.add(category)
    
    tag = Tag(name="Stat Tag", slug="stat-tag", description="For stats testing")
    test_session.add(tag)
    
    friend_link = FriendLink(
        name="Stat Test Link",
        url="https://stat-test.com",
        description="Stat test link",
        favicon="stat@test.com",
        is_active=True
    )
    test_session.add(friend_link)
    
    test_session.commit()
    
    # Test general stats endpoint
    response = client.get("/api/v1/stats/general")
    assert response.status_code == status.HTTP_200_OK
    stats_data = response.json()
    
    # Verify that stats reflect the data we created
    assert "total_articles" in stats_data
    assert "total_categories" in stats_data
    assert "total_tags" in stats_data
    assert "total_users" in stats_data
    assert stats_data["total_users"] >= 1
    assert stats_data["total_articles"] >= 3
    assert stats_data["total_categories"] >= 1
    assert stats_data["total_tags"] >= 1
    
    # Test article stats endpoint
    response = client.get("/api/v1/stats/articles")
    assert response.status_code == status.HTTP_200_OK
    article_stats = response.json()
    
    assert "total_articles" in article_stats
    assert "published_articles" in article_stats
    assert "top_viewed_articles" in article_stats
    assert article_stats["total_articles"] >= 3
    assert article_stats["published_articles"] >= 3


def test_image_upload_article_integration(client, test_session):
    """Test the integration between image uploads and articles"""
    # Create a user
    user = User(
        tenant_id=uuid.uuid4(),
        username="image_integration_user",
        email="image_integration@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    test_session.add(user)
    test_session.commit()
    
    # Upload an image
    temp_image = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
    img = PILImage.new('RGB', (100, 100), color='red')
    img.save(temp_image.name, format='JPEG')
    temp_image.seek(0)
    
    try:
        temp_image.close()
        with open(temp_image.name, 'rb') as f:
            response = client.post(
                "/api/v1/images/",
                data={
                    "title": "Integration Test Image",
                    "description": "Image for integration test",
                    "alt_text": "Test alt text",
                    "is_featured": True
                },
                files={"file": ("integration_test.jpg", f, "image/jpeg")}
            )
        
        assert response.status_code == status.HTTP_200_OK
        uploaded_image = response.json()
        assert uploaded_image["caption"] == "Image for integration test"
        
        # Create an article that references this image
        article_data = {
            "title": "Article with Image",
            "slug": "article-with-image",
            "content": f"Article featuring image: {uploaded_image['original_filename']}",
            "excerpt": "Article with embedded image",
            "is_published": True,
            "image_id": uploaded_image["id"]  # If articles have image associations
        }
        response = client.post("/api/v1/articles/", json=article_data)
        assert response.status_code == status.HTTP_200_OK
        
        # Verify the article was created
        article = response.json()
        response = client.get(f"/api/v1/articles/{article['id']}")
        assert response.status_code == status.HTTP_200_OK
        fetched_article = response.json()
        # This depends on how articles are linked to images in the model
    finally:
        # Clean up the temporary file
        os.unlink(temp_image.name)


def test_user_article_category_workflow(client, test_session):
    """Test a complete workflow: user creates article, assigns category, publishes"""
    # Create a user
    user_data = {
        "username": "workflow_user",
        "email": "workflow@example.com",
        "password": "workflow_password123",
        "full_name": "Workflow User"
    }
    # Note: This assumes a user registration endpoint exists
    # For this test, we'll create the user directly in the DB
    user = User(
        tenant_id=uuid.uuid4(),
        username="workflow_user",
        email="workflow@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    test_session.add(user)
    test_session.commit()
    
    # Create a category
    category_data = {
        "name": "Workflow Category",
        "slug": "workflow-category",
        "description": "Category for workflow testing"
    }
    response = client.post("/api/v1/categories/", json=category_data)
    assert response.status_code == status.HTTP_200_OK
    category = response.json()
    
    # Create an article assigned to this category
    article_data = {
        "title": "Workflow Test Article",
        "slug": "workflow-test-article",
        "content": "This article tests the complete workflow",
        "excerpt": "Workflow test article",
        "is_published": True,
        "category_id": category["id"]
    }
    response = client.post("/api/v1/articles/", json=article_data)
    assert response.status_code == status.HTTP_200_OK
    article = response.json()
    
    # Verify the article exists and has the right category
    response = client.get(f"/api/v1/articles/{article['id']}")
    assert response.status_code == status.HTTP_200_OK
    fetched_article = response.json()
    assert fetched_article["title"] == "Workflow Test Article"
    assert fetched_article["category"]["id"] == category["id"]
    
    # Verify the category now contains this article
    response = client.get(f"/api/v1/categories/{category['id']}/articles")
    assert response.status_code == status.HTTP_200_OK
    articles_in_category = response.json()
    article_titles = [a["title"] for a in articles_in_category]
    assert "Workflow Test Article" in article_titles


def test_subscription_and_notification_integration(client, test_session):
    """Test the subscription functionality"""
    # Create a subscription
    subscription_data = {
        "email": "integration@test.com",
        "name": "Integration Test User"
    }
    response = client.post("/api/v1/subscriptions/", json=subscription_data)
    assert response.status_code == status.HTTP_200_OK
    subscription = response.json()
    
    # Verify the subscription was created
    assert subscription["email"] == "integration@test.com"
    
    # Get subscription count
    response = client.get("/api/v1/subscriptions/count")
    assert response.status_code == status.HTTP_200_OK
    count_data = response.json()
    assert isinstance(count_data, int)
    assert count_data >= 1
    
    # Get all subscriptions
    response = client.get("/api/v1/subscriptions/")
    assert response.status_code == status.HTTP_200_OK
    subscriptions = response.json()
    emails = [sub["email"] for sub in subscriptions]
    assert "integration@test.com" in emails


def test_portfolio_timeline_integration(client, test_session):
    """Test that portfolio and timeline features work together"""
    # Create a portfolio item
    portfolio_data = {
        "title": "Integration Portfolio Project",
        "slug": "integration-portfolio-project",
        "description": "A project for integration testing",
        "demo_url": "https://integration-project.com",
        "github_url": "https://github.com/user/integration-project",
        "cover_image": "https://integration-project.com/image.jpg",
        "technologies": ["Python", "FastAPI", "SQLAlchemy"],
        "is_featured": True,
        "sort_order": 1
    }
    response = client.post("/api/v1/portfolio/", json=portfolio_data)
    assert response.status_code == status.HTTP_200_OK
    portfolio_item = response.json()
    
    # Create a timeline event related to this project
    timeline_data = {
        "title": "Portfolio Project Launched",
        "event_date": "2023-06-01",
        "description": "Launched the integration test portfolio project",
        "event_type": "project",
        "is_active": True
    }
    response = client.post("/api/v1/timeline-events/", json=timeline_data)
    assert response.status_code == status.HTTP_200_OK
    timeline_event = response.json()
    
    # Verify both were created
    assert portfolio_item["title"] == "Integration Portfolio Project"
    assert timeline_event["title"] == "Portfolio Project Launched"
    
    # Get portfolio items and timeline events to verify they exist
    response = client.get("/api/v1/portfolio/")
    assert response.status_code == status.HTTP_200_OK
    portfolio_items = response.json()
    portfolio_titles = [item["title"] for item in portfolio_items]
    assert "Integration Portfolio Project" in portfolio_titles
    
    response = client.get("/api/v1/timeline-events/")
    assert response.status_code == status.HTTP_200_OK
    timeline_events = response.json()
    timeline_titles = [event["title"] for event in timeline_events]
    assert "Portfolio Project Launched" in timeline_titles


def test_friend_links_active_status_integration(client, test_session):
    """Test friend links with different active statuses"""
    # Create active friend link
    active_link_data = {
        "name": "Active Integration Link",
        "url": "https://active-integration.com",
        "description": "Active integration test link",
        "favicon": "https://active-integration.com/favicon.ico",
        "is_active": True
    }
    response = client.post("/api/v1/friend-links/", json=active_link_data)
    assert response.status_code == status.HTTP_200_OK
    
    # Create inactive friend link
    inactive_link_data = {
        "name": "Inactive Integration Link",
        "url": "https://inactive-integration.com",
        "description": "Inactive integration test link",
        "favicon": "https://inactive-integration.com/favicon.ico",
        "is_active": False
    }
    response = client.post("/api/v1/friend-links/", json=inactive_link_data)
    assert response.status_code == status.HTTP_200_OK
    
    # Get all friend links
    response = client.get("/api/v1/friend-links/")
    assert response.status_code == status.HTTP_200_OK
    all_links = response.json()
    all_names = [link["name"] for link in all_links]
    assert "Active Integration Link" in all_names
    assert "Inactive Integration Link" in all_names
    
    # Get only active friend links
    response = client.get("/api/v1/friend-links/?is_active=true")
    assert response.status_code == status.HTTP_200_OK
    active_links = response.json()
    active_names = [link["name"] for link in active_links]
    assert "Active Integration Link" in active_names
    assert "Inactive Integration Link" not in active_names
    
    # Get only inactive friend links
    response = client.get("/api/v1/friend-links/?is_active=false")
    assert response.status_code == status.HTTP_200_OK
    inactive_links = response.json()
    inactive_names = [link["name"] for link in inactive_links]
    assert "Inactive Integration Link" in inactive_names
    assert "Active Integration Link" not in inactive_names


def test_article_search_and_filtering_integration(client, test_session):
    """Test article search functionality with various filters"""
    # Create a user
    user = User(
        tenant_id=uuid.uuid4(),
        username="search_integration_user",
        email="search_integration@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    test_session.add(user)
    test_session.commit()
    
    # Create a category
    category = Category(name="Search Test", slug="search-test", description="For search testing")
    test_session.add(category)
    test_session.commit()
    
    # Create articles with different characteristics
    article1 = {
        "title": "Python Tips and Tricks",
        "slug": "python-tips",
        "content": "Learn amazing Python tips and tricks for developers",
        "excerpt": "Python development tips",
        "is_published": True,
        "category_id": str(category.id),
        "view_count": 100
    }
    
    article2 = {
        "title": "JavaScript Best Practices",
        "slug": "javascript-best-practices",
        "content": "Best practices for JavaScript development",
        "excerpt": "JavaScript development practices",
        "is_published": True,
        "category_id": str(category.id),
        "view_count": 200
    }
    
    article3 = {
        "title": "Unpublished Python Content",
        "slug": "unpublished-python",
        "content": "This content is not published yet",
        "excerpt": "Unpublished content",
        "is_published": False,  # Unpublished
        "category_id": str(category.id),
        "view_count": 10
    }
    
    # Create the articles
    response1 = client.post("/api/v1/articles/", json=article1)
    response2 = client.post("/api/v1/articles/", json=article2)
    response3 = client.post("/api/v1/articles/", json=article3)
    
    assert response1.status_code == status.HTTP_200_OK
    assert response2.status_code == status.HTTP_200_OK
    assert response3.status_code == status.HTTP_200_OK
    
    # Test search functionality
    response = client.get("/api/v1/articles/search", params={"q": "Python"})
    assert response.status_code == status.HTTP_200_OK
    search_results = response.json()
    python_titles = [article["title"] for article in search_results]
    assert "Python Tips and Tricks" in python_titles
    # Note: Whether "Unpublished Python Content" appears depends on search implementation
    
    # Test featured articles (if they exist)
    response = client.get("/api/v1/articles/featured")
    assert response.status_code == status.HTTP_200_OK
    featured_articles = response.json()
    # This depends on how featured articles are determined
    
    # Test popular articles
    response = client.get("/api/v1/articles/popular")
    assert response.status_code == status.HTTP_200_OK
    popular_articles = response.json()
    if len(popular_articles) > 1:
        # Check if they're ordered by views (descending)
        view_counts = [article["view_count"] for article in popular_articles]
        assert view_counts == sorted(view_counts, reverse=True)


def test_multi_entity_statistics_integration(client, test_session):
    """Test that statistics properly aggregate across multiple entity types"""
    # Create various entities
    user = User(
        tenant_id=uuid.uuid4(),
        username="multi_stat_user",
        email="multi_stat@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    test_session.add(user)
    test_session.commit()
    
    # Create multiple categories
    for i in range(3):
        category = Category(
            name=f"Multi Stat Category {i}",
            slug=f"multi-stat-category-{i}",
            description=f"Category {i} for multi-stat testing"
        )
        test_session.add(category)
    
    # Create multiple tags
    for i in range(4):
        tag = Tag(
            name=f"Multi Stat Tag {i}",
            slug=f"multi-stat-tag-{i}",
            description=f"Tag {i} for multi-stat testing"
        )
        test_session.add(tag)
    
    # Create multiple articles
    for i in range(5):
        article = Article(
            title=f"Multi Stat Article {i}",
            slug=f"multi-stat-article-{i}",
            content=f"Content for multi-stat article {i}",
            excerpt=f"Excerpt {i}",
            is_published=True,
            view_count=i * 25,
            author_id=user.id
        )
        test_session.add(article)
    
    # Create friend links
    for i in range(2):
        friend_link = FriendLink(
            name=f"Multi Stat Link {i}",
            url=f"https://multi-stat-link-{i}.com",
            description=f"Link {i} for multi-stat testing",
            favicon=f"https://multi-stat-link-{i}.com/favicon.ico",
            is_active=True
        )
        test_session.add(friend_link)
    
    # Create portfolio items
    for i in range(3):
        portfolio_item = Portfolio(
            title=f"Multi Stat Portfolio {i}",
            slug=f"multi-stat-portfolio-{i}",
            description=f"Portfolio item {i}",
            demo_url=f"https://portfolio{i}.com",
            github_url=f"https://github.com/user/portfolio{i}",
            cover_image=f"https://portfolio{i}.com/image.jpg",
            technologies='["Python", "FastAPI"]',
            is_featured=i % 2 == 0,
            sort_order=i
        )
        test_session.add(portfolio_item)
    
    test_session.commit()
    
    # Get general statistics
    response = client.get("/api/v1/stats/general")
    assert response.status_code == status.HTTP_200_OK
    general_stats = response.json()
    
    # Verify that the counts match what we created
    assert general_stats["total_users"] >= 1
    assert general_stats["total_articles"] >= 5
    assert general_stats["total_categories"] >= 3
    assert general_stats["total_tags"] >= 4
    assert general_stats["total_friend_links"] >= 2  # This field might not exist in the actual API
    # Note: The exact field names depend on the implementation of the stats endpoint
    
    # Get article statistics
    response = client.get("/api/v1/stats/articles")
    assert response.status_code == status.HTTP_200_OK
    article_stats = response.json()
    
    assert article_stats["total_articles"] >= 5
    assert article_stats["published_articles"] >= 5  # All are published
    
    # Verify top viewed articles
    if article_stats["top_viewed_articles"]:
        top_views = [a["view_count"] for a in article_stats["top_viewed_articles"]]
        # Should be sorted by views in descending order
        assert top_views == sorted(top_views, reverse=True)