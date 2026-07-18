import pytest
from fastapi import status


def test_register_user(client, test_user_data):
    """Test user registration"""
    response = client.post("/api/v1/auth/register", json=test_user_data)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "message" in data
    assert data["message"] == "User created successfully"
    assert "user_id" in data
    assert data["user_id"]


def test_login_user(client, test_user_data):
    """Test user login"""
    # First register the user
    client.post("/api/v1/auth/register", json=test_user_data)
    
    # Test login with username and password
    login_data = {
        "username": test_user_data["username"],
        "password": test_user_data["password"]
    }
    
    response = client.post("/api/v1/auth/login-json", json=login_data)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert "token_type" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 0


def test_login_invalid_credentials(client, test_user_data):
    """Test login with invalid credentials"""
    # Register user first
    client.post("/api/v1/auth/register", json=test_user_data)
    
    # Test with wrong password
    login_data = {
        "username": test_user_data["username"],
        "password": "wrongpassword"
    }
    
    response = client.post("/api/v1/auth/login-json", json=login_data)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    data = response.json()
    assert "error" in data
    assert data["error"]["message"] == "Incorrect username or password"


def test_register_duplicate_username(client, test_user_data):
    """Test registering with duplicate username"""
    # Register first user
    response1 = client.post("/api/v1/auth/register", json=test_user_data)
    assert response1.status_code == status.HTTP_200_OK
    
    # Try to register with same username but different email
    duplicate_data = test_user_data.copy()
    duplicate_data["email"] = "different@example.com"
    
    response2 = client.post("/api/v1/auth/register", json=duplicate_data)

    assert response2.status_code == status.HTTP_400_BAD_REQUEST
    data = response2.json()
    assert "error" in data
    assert "username" in data["error"]["message"].lower()


def test_register_duplicate_email(client, test_user_data):
    """Test registering with duplicate email"""
    # Register first user
    response1 = client.post("/api/v1/auth/register", json=test_user_data)
    assert response1.status_code == status.HTTP_200_OK

    # Try to register with same email but different username
    duplicate_data = test_user_data.copy()
    duplicate_data["username"] = "differentuser"

    response2 = client.post("/api/v1/auth/register", json=duplicate_data)

    assert response2.status_code == status.HTTP_400_BAD_REQUEST
    data = response2.json()
    assert "error" in data
    assert "email" in data["error"]["message"].lower()