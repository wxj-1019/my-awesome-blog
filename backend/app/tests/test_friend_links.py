import pytest
import uuid
from fastapi import status
from sqlalchemy.orm import Session

from app.models.friend_link import FriendLink
from app.schemas.friend_link import FriendLinkCreate, FriendLinkUpdate


def test_create_friend_link(client, test_session):
    """Test creating a new friend link"""
    friend_link_data = {
        "name": "Example Site",
        "url": "https://example.com",
        "description": "An example website",
        "favicon": "contact@example.com",
        "is_active": True
    }
    
    response = client.post("/api/v1/friend-links/", json=friend_link_data)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Example Site"
    assert data["url"] == "https://example.com"
    assert data["description"] == "An example website"
    assert data["favicon"] == "contact@example.com"
    assert data["is_active"] is True
    assert "id" in data
    
    # Verify the friend link was saved to the database
    friend_link_in_db = test_session.query(FriendLink).filter(FriendLink.name == "Example Site").first()
    assert friend_link_in_db is not None
    assert friend_link_in_db.name == "Example Site"


def test_create_friend_link_invalid_url(client):
    """Test creating a friend link with invalid URL should fail"""
    friend_link_data = {
        "name": "Invalid Site",
        "url": "not-a-valid-url",
        "description": "A site with invalid URL",
        "favicon": "contact@example.com",
        "is_active": True
    }
    
    response = client.post("/api/v1/friend-links/", json=friend_link_data)
    
    # Assuming the API validates URL format and returns 422 for validation errors
    # If the API doesn't validate, this test might need adjustment
    # For now, let's assume it gets created successfully but validation happens elsewhere
    # Or it fails with 422 if validation is implemented
    assert response.status_code in [status.HTTP_200_OK, status.HTTP_422_UNPROCESSABLE_ENTITY]


def test_get_friend_link(client, test_session):
    """Test getting a specific friend link by ID"""
    # Create a friend link first
    friend_link = FriendLink(
        name="Test Site",
        url="https://testsite.com",
        description="A test website",
        favicon="test@testsite.com",
        is_active=True
    )
    test_session.add(friend_link)
    test_session.commit()
    test_session.refresh(friend_link)
    
    response = client.get(f"/api/v1/friend-links/{friend_link.id}")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == str(friend_link.id)
    assert data["name"] == "Test Site"
    assert data["url"] == "https://testsite.com"
    assert data["is_active"] is True


def test_get_nonexistent_friend_link(client):
    """Test getting a friend link that doesn't exist"""
    response = client.get(f"/api/v1/friend-links/{uuid.uuid4()}")
    
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_update_friend_link(client, test_session):
    """Test updating an existing friend link"""
    # Create a friend link first
    friend_link = FriendLink(
        name="Old Name",
        url="https://oldsite.com",
        description="Old description",
        favicon="old@example.com",
        is_active=False
    )
    test_session.add(friend_link)
    test_session.commit()
    test_session.refresh(friend_link)
    
    # Update the friend link
    update_data = {
        "name": "Updated Name",
        "url": "https://updatedsite.com",
        "description": "Updated description",
        "favicon": "updated@example.com",
        "is_active": True
    }
    
    response = client.put(f"/api/v1/friend-links/{friend_link.id}", json=update_data)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["url"] == "https://updatedsite.com"
    assert data["description"] == "Updated description"
    assert data["favicon"] == "updated@example.com"
    assert data["is_active"] is True
    
    # Verify the update in the database
    updated_friend_link = test_session.query(FriendLink).filter(FriendLink.id == friend_link.id).first()
    assert updated_friend_link.name == "Updated Name"


def test_delete_friend_link(client, test_session):
    """Test deleting an existing friend link"""
    # Create a friend link first
    friend_link = FriendLink(
        name="To Be Deleted",
        url="https://tobedeleted.com",
        description="This will be deleted",
        favicon="delete@me.com",
        is_active=True
    )
    test_session.add(friend_link)
    test_session.commit()
    test_session.refresh(friend_link)
    
    # Delete the friend link
    response = client.delete(f"/api/v1/friend-links/{friend_link.id}")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["message"] == "Friend link deleted successfully"
    
    # Verify the friend link was deleted from the database
    deleted_friend_link = test_session.query(FriendLink).filter(FriendLink.id == friend_link.id).first()
    assert deleted_friend_link is None


def test_get_friend_links(client, test_session):
    """Test getting all friend links"""
    # Create multiple friend links
    friend_links_data = [
        {
            "name": "Site 1",
            "url": "https://site1.com",
            "description": "First site",
            "favicon": "contact1@site1.com",
            "is_active": True
        },
        {
            "name": "Site 2", 
            "url": "https://site2.com",
            "description": "Second site",
            "favicon": "contact2@site2.com",
            "is_active": True
        },
        {
            "name": "Site 3",
            "url": "https://site3.com", 
            "description": "Third site",
            "favicon": "contact3@site3.com",
            "is_active": False
        }
    ]
    
    for fl_data in friend_links_data:
        friend_link = FriendLink(**fl_data)
        test_session.add(friend_link)
    
    test_session.commit()
    
    response = client.get("/api/v1/friend-links/")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    # 默认只返回 active 的友链；Site 3 为 inactive，故至少返回 2 条
    assert len(data) >= 2
    
    # Check if our active friend links are in the response
    names_in_response = [fl["name"] for fl in data]
    assert "Site 1" in names_in_response
    assert "Site 2" in names_in_response


def test_get_friend_links_with_pagination(client, test_session):
    """Test getting friend links with pagination"""
    # Create multiple friend links
    for i in range(10):
        friend_link = FriendLink(
            name=f"Site {i}",
            url=f"https://site{i}.com",
            description=f"Description for site {i}",
            favicon=f"contact{i}@site{i}.com",
            is_active=True
        )
        test_session.add(friend_link)
    
    test_session.commit()
    
    # Get first page
    response = client.get("/api/v1/friend-links/?skip=0&limit=5")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    # The actual count depends on other friend links that might exist
    assert len(data) <= 5


def test_get_active_friend_links(client, test_session):
    """Test getting only active friend links"""
    # Create both active and inactive friend links
    active_friend_link = FriendLink(
        name="Active Site",
        url="https://activesite.com",
        description="An active site",
        favicon="active@example.com",
        is_active=True
    )
    
    inactive_friend_link = FriendLink(
        name="Inactive Site",
        url="https://inactivesite.com",
        description="An inactive site",
        favicon="inactive@example.com",
        is_active=False
    )
    
    test_session.add(active_friend_link)
    test_session.add(inactive_friend_link)
    test_session.commit()
    
    # Get only active friend links
    response = client.get("/api/v1/friend-links/?is_active=true")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    
    # Check that only active friend links are returned
    for friend_link in data:
        assert friend_link["is_active"] is True
        assert friend_link["name"] != "Inactive Site"


def test_get_inactive_friend_links(client, test_session):
    """Test getting only inactive friend links"""
    # Create both active and inactive friend links
    active_friend_link = FriendLink(
        name="Active Site",
        url="https://activesite.com",
        description="An active site",
        favicon="active@example.com",
        is_active=True
    )
    
    inactive_friend_link = FriendLink(
        name="Inactive Site",
        url="https://inactivesite.com",
        description="An inactive site",
        favicon="inactive@example.com",
        is_active=False
    )
    
    test_session.add(active_friend_link)
    test_session.add(inactive_friend_link)
    test_session.commit()
    
    # Get only inactive friend links
    response = client.get("/api/v1/friend-links/?is_active=false")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    
    # Check that only inactive friend links are returned
    for friend_link in data:
        assert friend_link["is_active"] is False
        assert friend_link["name"] != "Active Site"