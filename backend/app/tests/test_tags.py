import pytest
import uuid
from fastapi import status
from sqlalchemy.orm import Session

from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagUpdate


def test_create_tag(client, test_session):
    """Test creating a new tag"""
    tag_data = {
        "name": "Python",
        "slug": "python",
        "description": "Python programming language"
    }
    
    response = client.post("/api/v1/tags/", json=tag_data)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Python"
    assert data["slug"] == "python"
    assert data["description"] == "Python programming language"
    assert "id" in data
    
    # Verify the tag was saved to the database
    tag_in_db = test_session.query(Tag).filter(Tag.name == "Python").first()
    assert tag_in_db is not None
    assert tag_in_db.name == "Python"


def test_create_tag_duplicate_slug(client):
    """Test creating a tag with duplicate slug should fail"""
    # Create first tag
    tag_data = {
        "name": "Python",
        "slug": "python",
        "description": "Python programming language"
    }
    response = client.post("/api/v1/tags/", json=tag_data)
    assert response.status_code == status.HTTP_200_OK
    
    # Try to create another tag with same slug
    duplicate_data = {
        "name": "Python Framework",
        "slug": "python",
        "description": "Another python tag"
    }
    response = client.post("/api/v1/tags/", json=duplicate_data)
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_get_tag(client, test_session):
    """Test getting a specific tag by ID"""
    # Create a tag first
    tag = Tag(
        name="JavaScript",
        slug="javascript",
        description="JavaScript programming language"
    )
    test_session.add(tag)
    test_session.commit()
    test_session.refresh(tag)
    
    response = client.get(f"/api/v1/tags/{tag.id}")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == str(tag.id)
    assert data["name"] == "JavaScript"
    assert data["slug"] == "javascript"


def test_get_nonexistent_tag(client):
    """Test getting a tag that doesn't exist"""
    response = client.get(f"/api/v1/tags/{uuid.uuid4()}")
    
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_update_tag(client, test_session):
    """Test updating an existing tag"""
    # Create a tag first
    tag = Tag(
        name="Old Tag",
        slug="old-tag",
        description="Old description"
    )
    test_session.add(tag)
    test_session.commit()
    test_session.refresh(tag)
    
    # Update the tag
    update_data = {
        "name": "Updated Tag",
        "slug": "updated-tag",
        "description": "Updated description"
    }
    
    response = client.put(f"/api/v1/tags/{tag.id}", json=update_data)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Updated Tag"
    assert data["slug"] == "updated-tag"
    assert data["description"] == "Updated description"
    
    # Verify the update in the database
    updated_tag = test_session.query(Tag).filter(Tag.id == tag.id).first()
    assert updated_tag.name == "Updated Tag"


def test_delete_tag(client, test_session):
    """Test deleting an existing tag"""
    # Create a tag first
    tag = Tag(
        name="To Be Deleted",
        slug="to-be-deleted",
        description="This will be deleted"
    )
    test_session.add(tag)
    test_session.commit()
    test_session.refresh(tag)
    
    # Delete the tag
    response = client.delete(f"/api/v1/tags/{tag.id}")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["message"] == "Tag deleted successfully"
    
    # Verify the tag was deleted from the database
    deleted_tag = test_session.query(Tag).filter(Tag.id == tag.id).first()
    assert deleted_tag is None


def test_get_tags(client, test_session):
    """Test getting all tags"""
    # Create multiple tags
    tags_data = [
        {"name": "Tag 1", "slug": "tag1", "description": "First tag"},
        {"name": "Tag 2", "slug": "tag2", "description": "Second tag"},
        {"name": "Tag 3", "slug": "tag3", "description": "Third tag"}
    ]
    
    for tag_data in tags_data:
        tag = Tag(**tag_data)
        test_session.add(tag)
    
    test_session.commit()
    
    response = client.get("/api/v1/tags/")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3  # May have more from other tests
    
    # Check if our tags are in the response
    names_in_response = [tag["name"] for tag in data]
    for tag_data in tags_data:
        assert tag_data["name"] in names_in_response


def test_get_tags_with_pagination(client, test_session):
    """Test getting tags with pagination"""
    # Create multiple tags
    for i in range(10):
        tag = Tag(
            name=f"Tag {i}",
            slug=f"tag-{i}",
            description=f"Description for tag {i}"
        )
        test_session.add(tag)
    
    test_session.commit()
    
    # Get first page
    response = client.get("/api/v1/tags/?skip=0&limit=5")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    # The actual count depends on other tags that might exist
    assert len(data) <= 5


def test_get_tag_by_name(client, test_session):
    """Test getting a tag by name"""
    # Create a tag first
    tag = Tag(
        name="FastAPI",
        slug="fastapi",
        description="FastAPI framework"
    )
    test_session.add(tag)
    test_session.commit()
    test_session.refresh(tag)
    
    response = client.get(f"/api/v1/tags/name/{tag.name}")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == str(tag.id)
    assert data["name"] == "FastAPI"
    assert data["slug"] == "fastapi"


def test_get_tag_by_name_not_found(client):
    """Test getting a tag by name that doesn't exist"""
    response = client.get("/api/v1/tags/name/nonexistent")
    
    assert response.status_code == status.HTTP_404_NOT_FOUND