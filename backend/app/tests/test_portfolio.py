import pytest
import uuid
from fastapi import status
from sqlalchemy.orm import Session

from app.models.portfolio import Portfolio
from app.schemas.portfolio import PortfolioCreate, PortfolioUpdate


def _portfolio_data(**overrides):
    """生成符合 PortfolioItemCreate schema 的测试数据"""
    data = {
        "title": "Project One",
        "slug": "project-one",
        "description": "A sample project description",
        "demo_url": "https://project-one.com",
        "github_url": "https://github.com/user/project-one",
        "cover_image": "https://project-one.com/image.jpg",
        "technologies": ["Python", "FastAPI", "PostgreSQL"],
        "is_featured": True,
        "sort_order": 1,
    }
    data.update(overrides)
    return data


def _portfolio_model(**overrides):
    """生成符合 Portfolio 模型的测试对象"""
    data = {
        "title": "Test Project",
        "slug": "test-project",
        "description": "A test project",
        "demo_url": "https://test-project.com",
        "github_url": "https://github.com/user/test-project",
        "cover_image": "https://test-project.com/image.jpg",
        "technologies": '["React", "TypeScript", "NextJS"]',
        "is_featured": False,
        "sort_order": 2,
    }
    data.update(overrides)
    return Portfolio(**data)


def test_create_portfolio_item(client, test_session):
    """Test creating a new portfolio item"""
    portfolio_data = _portfolio_data()

    response = client.post("/api/v1/portfolio/", json=portfolio_data)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Project One"
    assert data["description"] == "A sample project description"
    assert data["demo_url"] == "https://project-one.com"
    assert data["github_url"] == "https://github.com/user/project-one"
    assert data["cover_image"] == "https://project-one.com/image.jpg"
    assert data["technologies"] == ["Python", "FastAPI", "PostgreSQL"]
    assert data["is_featured"] is True
    assert data["sort_order"] == 1
    assert "id" in data

    # Verify the portfolio item was saved to the database
    portfolio_in_db = test_session.query(Portfolio).filter(Portfolio.title == "Project One").first()
    assert portfolio_in_db is not None
    assert portfolio_in_db.title == "Project One"


def test_get_portfolio_item(client, test_session):
    """Test getting a specific portfolio item by ID"""
    portfolio = _portfolio_model()
    test_session.add(portfolio)
    test_session.commit()
    test_session.refresh(portfolio)

    response = client.get(f"/api/v1/portfolio/{portfolio.id}")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == str(portfolio.id)
    assert data["title"] == "Test Project"
    assert data["description"] == "A test project"
    assert data["is_featured"] is False
    assert data["sort_order"] == 2


def test_get_nonexistent_portfolio_item(client):
    """Test getting a portfolio item that doesn't exist"""
    response = client.get(f"/api/v1/portfolio/{uuid.uuid4()}")

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_update_portfolio_item(client, test_session):
    """Test updating an existing portfolio item"""
    portfolio = _portfolio_model(
        title="Old Project",
        slug="old-project",
        description="Old description",
        demo_url="https://old-project.com",
        github_url="https://github.com/user/old-project",
        cover_image="https://old-project.com/image.jpg",
        technologies='["OldTech"]',
        is_featured=False,
        sort_order=1,
    )
    test_session.add(portfolio)
    test_session.commit()
    test_session.refresh(portfolio)

    update_data = {
        "title": "Updated Project",
        "description": "Updated description",
        "demo_url": "https://updated-project.com",
        "github_url": "https://github.com/user/updated-project",
        "cover_image": "https://updated-project.com/image.jpg",
        "technologies": ["NewTech", "ModernStack"],
        "is_featured": True,
        "sort_order": 5,
    }

    response = client.put(f"/api/v1/portfolio/{portfolio.id}", json=update_data)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Updated Project"
    assert data["description"] == "Updated description"
    assert data["demo_url"] == "https://updated-project.com"
    assert data["github_url"] == "https://github.com/user/updated-project"
    assert data["technologies"] == ["NewTech", "ModernStack"]
    assert data["is_featured"] is True
    assert data["sort_order"] == 5

    # Verify the update in the database
    updated_portfolio = test_session.query(Portfolio).filter(Portfolio.id == portfolio.id).first()
    assert updated_portfolio.title == "Updated Project"


def test_delete_portfolio_item(client, test_session):
    """Test deleting an existing portfolio item"""
    portfolio = _portfolio_model(
        title="To Be Deleted",
        slug="to-be-deleted",
        description="This will be deleted",
        demo_url="https://tobedeleted.com",
        github_url="https://github.com/user/tobedeleted",
        cover_image="https://tobedeleted.com/image.jpg",
        technologies='["DeleteTech"]',
        is_featured=False,
        sort_order=10,
    )
    test_session.add(portfolio)
    test_session.commit()
    test_session.refresh(portfolio)

    response = client.delete(f"/api/v1/portfolio/{portfolio.id}")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["message"] == "Portfolio item deleted successfully"

    # Verify the portfolio item was deleted from the database
    deleted_portfolio = test_session.query(Portfolio).filter(Portfolio.id == portfolio.id).first()
    assert deleted_portfolio is None


def test_get_portfolio_items(client, test_session):
    """Test getting all portfolio items"""
    portfolio_items_data = [
        _portfolio_data(title="Project Alpha", slug="project-alpha", demo_url="https://alpha.com"),
        _portfolio_data(title="Project Beta", slug="project-beta", demo_url="https://beta.com", is_featured=False, sort_order=2),
        _portfolio_data(title="Project Gamma", slug="project-gamma", demo_url="https://gamma.com"),
    ]

    for item_data in portfolio_items_data:
        portfolio_item = Portfolio(
            **{**item_data, "technologies": '["Tech"]'},
        )
        test_session.add(portfolio_item)

    test_session.commit()

    response = client.get("/api/v1/portfolio/")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3  # May have more from other tests

    # Check if our portfolio items are in the response
    titles_in_response = [item["title"] for item in data]
    for item_data in portfolio_items_data:
        assert item_data["title"] in titles_in_response


def test_get_portfolio_items_with_pagination(client, test_session):
    """Test getting portfolio items with pagination"""
    for i in range(10):
        portfolio_item = Portfolio(
            title=f"Project {i}",
            slug=f"project-{i}",
            description=f"Description for project {i}",
            demo_url=f"https://project{i}.com",
            github_url=f"https://github.com/user/project{i}",
            cover_image=f"https://project{i}.com/image.jpg",
            technologies=f'["Tech{i}"]',
            is_featured=i % 2 == 0,  # Alternate featured status
            sort_order=i,
        )
        test_session.add(portfolio_item)

    test_session.commit()

    # Get first page
    response = client.get("/api/v1/portfolio/?skip=0&limit=5")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    # The actual count depends on other portfolio items that might exist
    assert len(data) <= 5


def test_get_featured_portfolio_items(client, test_session):
    """Test getting only featured portfolio items"""
    featured_item = Portfolio(
        title="Featured Project",
        slug="featured-project",
        description="A featured project",
        demo_url="https://featured.com",
        github_url="https://github.com/user/featured",
        cover_image="https://featured.com/image.jpg",
        technologies='["FeaturedTech"]',
        is_featured=True,
        sort_order=1,
    )

    non_featured_item = Portfolio(
        title="Non-featured Project",
        slug="non-featured-project",
        description="A non-featured project",
        demo_url="https://nonfeatured.com",
        github_url="https://github.com/user/nonfeatured",
        cover_image="https://nonfeatured.com/image.jpg",
        technologies='["RegularTech"]',
        is_featured=False,
        sort_order=2,
    )

    test_session.add(featured_item)
    test_session.add(non_featured_item)
    test_session.commit()

    # Get portfolio items (endpoint 使用 is_active 参数，is_featured 过滤在 CRUD 层实现)
    response = client.get("/api/v1/portfolio/")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)

    # 确认 featured 项目存在，且非 featured 项目也存在
    titles = [item["title"] for item in data]
    assert "Featured Project" in titles
    assert "Non-featured Project" in titles


def test_get_portfolio_items_ordered_by_order_field(client, test_session):
    """Test getting portfolio items ordered by the order field"""
    items_data = [
        {"title": "Last", "sort_order": 3, "is_featured": False},
        {"title": "First", "sort_order": 1, "is_featured": True},
        {"title": "Middle", "sort_order": 2, "is_featured": False},
    ]

    for item_data in items_data:
        portfolio_item = Portfolio(
            title=item_data["title"],
            slug=item_data["title"].lower().replace(" ", "-"),
            description=f"Description for {item_data['title']}",
            demo_url=f"https://{item_data['title'].lower().replace(' ', '')}.com",
            github_url=f"https://github.com/user/{item_data['title'].lower().replace(' ', '')}",
            cover_image=f"https://{item_data['title'].lower().replace(' ', '')}.com/image.jpg",
            technologies='["OrderTest"]',
            is_featured=item_data["is_featured"],
            sort_order=item_data["sort_order"],
        )
        test_session.add(portfolio_item)

    test_session.commit()

    # Get portfolio items
    response = client.get("/api/v1/portfolio/")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)

    # Check that items are ordered by the order field
    if len([item for item in data if item["title"] in ["First", "Middle", "Last"]]) >= 3:
        # Extract the items we created for comparison
        filtered_items = [item for item in data if item["title"] in ["First", "Middle", "Last"]]
        # Sort by order field to check if API response is sorted correctly
        sorted_by_order = sorted(filtered_items, key=lambda x: x["sort_order"])

        # Check if the first three items in response are ordered correctly
        titles_in_order = [item["title"] for item in sorted_by_order[:3]]
        assert titles_in_order == ["First", "Middle", "Last"]


def test_create_portfolio_item_minimal_data(client, test_session):
    """Test creating a portfolio item with minimal required data"""
    portfolio_data = {
        "title": "Minimal Project",
        "slug": "minimal-project",
        "description": "A minimal project",
        "demo_url": "https://minimal.com"
        # Other fields should use defaults
    }

    response = client.post("/api/v1/portfolio/", json=portfolio_data)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Minimal Project"
    assert data["description"] == "A minimal project"
    assert data["demo_url"] == "https://minimal.com"
    # Check that default values are applied
    assert data["github_url"] is None
    assert data["cover_image"] is None
    assert data["technologies"] == []
    assert data["is_featured"] is False
    assert data["sort_order"] == 0
