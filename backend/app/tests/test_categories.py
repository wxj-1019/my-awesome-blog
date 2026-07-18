import uuid

import pytest
from fastapi import status
from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


def test_create_category(client, test_session):
    """Test creating a new category"""
    category_data = {
        "name": "Technology",
        "slug": "technology",
        "description": "Technology related articles"
    }
    
    response = client.post("/api/v1/categories/", json=category_data)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Technology"
    assert data["slug"] == "technology"
    assert data["description"] == "Technology related articles"
    assert "id" in data
    
    # Verify the category was saved to the database
    category_in_db = test_session.query(Category).filter(Category.name == "Technology").first()
    assert category_in_db is not None
    assert category_in_db.name == "Technology"


def test_create_category_duplicate_slug(client):
    """Test creating a category with duplicate slug should fail"""
    # Create first category
    category_data = {
        "name": "Technology",
        "slug": "technology",
        "description": "Technology related articles"
    }
    response = client.post("/api/v1/categories/", json=category_data)
    assert response.status_code == status.HTTP_200_OK
    
    # Try to create another category with same slug
    duplicate_data = {
        "name": "Tech",
        "slug": "technology",
        "description": "Another tech category"
    }
    response = client.post("/api/v1/categories/", json=duplicate_data)
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_get_category(client, test_session):
    """Test getting a specific category by ID"""
    # Create a category first
    category = Category(
        name="Sports",
        slug="sports",
        description="Sports related articles"
    )
    test_session.add(category)
    test_session.commit()
    test_session.refresh(category)
    
    response = client.get(f"/api/v1/categories/{category.id}")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == str(category.id)
    assert data["name"] == "Sports"
    assert data["slug"] == "sports"


def test_get_nonexistent_category(client):
    """Test getting a category that doesn't exist"""
    response = client.get(f"/api/v1/categories/{uuid.uuid4()}")
    
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_update_category(client, test_session):
    """Test updating an existing category"""
    # Create a category first
    category = Category(
        name="Old Name",
        slug="old-name",
        description="Old description"
    )
    test_session.add(category)
    test_session.commit()
    test_session.refresh(category)
    
    # Update the category
    update_data = {
        "name": "Updated Name",
        "slug": "updated-name",
        "description": "Updated description"
    }
    
    response = client.put(f"/api/v1/categories/{category.id}", json=update_data)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["slug"] == "updated-name"
    assert data["description"] == "Updated description"
    
    # Verify the update in the database
    updated_category = test_session.query(Category).filter(Category.id == category.id).first()
    assert updated_category.name == "Updated Name"


def test_delete_category(client, test_session):
    """Test deleting an existing category"""
    # Create a category first
    category = Category(
        name="To Be Deleted",
        slug="to-be-deleted",
        description="This will be deleted"
    )
    test_session.add(category)
    test_session.commit()
    test_session.refresh(category)
    
    # Delete the category
    response = client.delete(f"/api/v1/categories/{category.id}")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["message"] == "Category deleted successfully"
    
    # Verify the category was deleted from the database
    deleted_category = test_session.query(Category).filter(Category.id == category.id).first()
    assert deleted_category is None


def test_get_categories(client, test_session):
    """Test getting all categories"""
    # Create multiple categories
    categories_data = [
        {"name": "Category 1", "slug": "cat1", "description": "First category"},
        {"name": "Category 2", "slug": "cat2", "description": "Second category"},
        {"name": "Category 3", "slug": "cat3", "description": "Third category"}
    ]
    
    for cat_data in categories_data:
        category = Category(**cat_data)
        test_session.add(category)
    
    test_session.commit()
    
    response = client.get("/api/v1/categories/")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3  # May have more from other tests
    
    # Check if our categories are in the response
    names_in_response = [cat["name"] for cat in data]
    for cat_data in categories_data:
        assert cat_data["name"] in names_in_response


def test_get_categories_with_pagination(client, test_session):
    """Test getting categories with pagination"""
    # Create multiple categories
    for i in range(10):
        category = Category(
            name=f"Category {i}",
            slug=f"category-{i}",
            description=f"Description for category {i}"
        )
        test_session.add(category)
    
    test_session.commit()
    
    # Get first page
    response = client.get("/api/v1/categories/?skip=0&limit=5")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    # The actual count depends on other categories that might exist
    assert len(data) <= 5


def test_get_category_by_name(client, test_session):
    """Test getting a category by name"""
    # Create a category first
    category = Category(
        name="Programming",
        slug="programming",
        description="Programming related articles"
    )
    test_session.add(category)
    test_session.commit()
    test_session.refresh(category)
    
    response = client.get(f"/api/v1/categories/name/{category.name}")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == str(category.id)
    assert data["name"] == "Programming"
    assert data["slug"] == "programming"


def test_get_category_by_name_not_found(client):
    """Test getting a category by name that doesn't exist"""
    response = client.get("/api/v1/categories/name/nonexistent")
    
    assert response.status_code == status.HTTP_404_NOT_FOUND