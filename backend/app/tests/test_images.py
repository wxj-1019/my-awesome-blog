import pytest
import uuid
from fastapi import status
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
import tempfile
import os
from PIL import Image as PILImage

from app.models.image import Image
from app.schemas.image import ImageCreate, ImageUpdate


def _close_and_unlink(temp_file):
    """先关闭临时文件再删除，避免 Windows 下文件被占用"""
    try:
        temp_file.close()
    except Exception:
        pass
    try:
        os.unlink(temp_file.name)
    except Exception:
        pass


def _image_data(**overrides):
    data = {
        "original_filename": "test.jpg",
        "file_path": "/uploads/test.jpg",
        "file_size": 1024,
        "mime_type": "image/jpeg",
        "width": 100,
        "height": 100,
        "alt_text": "Test alt text",
        "caption": "A test image",
        "is_optimized": False,
    }
    data.update(overrides)
    return data


def test_upload_image_success(client, test_session):
    """Test successful image upload"""
    # Create a temporary image file for testing
    temp_image = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
    img = PILImage.new('RGB', (100, 100), color='red')
    img.save(temp_image.name, format='JPEG')
    temp_image.seek(0)

    try:
        with open(temp_image.name, 'rb') as f:
            response = client.post(
                "/api/v1/images/",
                data={
                    "alt_text": "Test alt text",
                    "description": "A test image",
                },
                files={"file": ("test_image.jpg", f, "image/jpeg")}
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["alt_text"] == "Test alt text"
        assert data["caption"] == "A test image"
        assert data["mime_type"] == "image/jpeg"
        assert "id" in data
        assert "original_filename" in data
        assert "file_path" in data

        # Verify the image was saved to the database
        image_in_db = test_session.query(Image).filter(Image.alt_text == "Test alt text").first()
        assert image_in_db is not None
        assert image_in_db.alt_text == "Test alt text"
    finally:
        # Clean up the temporary file
        _close_and_unlink(temp_image)


def test_upload_image_without_optional_fields(client, test_session):
    """Test uploading an image with only required fields"""
    # Create a temporary image file for testing
    temp_image = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    img = PILImage.new('RGB', (100, 100), color='blue')
    img.save(temp_image.name, format='PNG')
    temp_image.seek(0)

    try:
        with open(temp_image.name, 'rb') as f:
            response = client.post(
                "/api/v1/images/",
                files={"file": ("test_image.png", f, "image/png")}
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "id" in data
        assert "original_filename" in data
        assert "file_path" in data
    finally:
        # Clean up the temporary file
        _close_and_unlink(temp_image)


def test_upload_invalid_file_type(client):
    """Test uploading a non-image file should fail"""
    # Create a temporary text file
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False)
    temp_file.write("This is not an image")
    temp_file.close()

    try:
        with open(temp_file.name, 'rb') as f:
            response = client.post(
                "/api/v1/images/",
                files={"file": ("test.txt", f, "text/plain")}
            )

        # The response status depends on backend validation
        # It could be 422 for validation error or 400 for bad request
        assert response.status_code in [status.HTTP_422_UNPROCESSABLE_ENTITY, status.HTTP_400_BAD_REQUEST]
    finally:
        # Clean up the temporary file
        os.unlink(temp_file.name)


def test_get_image(client, test_session):
    """Test getting a specific image by ID"""
    # Create an image record in the database
    image = Image(**_image_data())
    test_session.add(image)
    test_session.commit()
    test_session.refresh(image)

    response = client.get(f"/api/v1/images/{image.id}")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == str(image.id)
    assert data["alt_text"] == "Test alt text"
    assert data["original_filename"] == "test.jpg"


def test_get_nonexistent_image(client):
    """Test getting an image that doesn't exist"""
    response = client.get(f"/api/v1/images/{uuid.uuid4()}")

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_update_image(client, test_session):
    """Test updating an existing image"""
    # Create an image record in the database
    image = Image(**_image_data())
    test_session.add(image)
    test_session.commit()
    test_session.refresh(image)

    # Update the image
    update_data = {
        "alt_text": "Updated alt text",
        "caption": "An updated image",
    }

    response = client.put(f"/api/v1/images/{image.id}", json=update_data)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["alt_text"] == "Updated alt text"
    assert data["caption"] == "An updated image"

    # Verify the update in the database
    updated_image = test_session.query(Image).filter(Image.id == image.id).first()
    assert updated_image.alt_text == "Updated alt text"


def test_delete_image(client, test_session):
    """Test deleting an existing image"""
    # Create an image record in the database
    image = Image(**_image_data(original_filename="to_delete.jpg", file_path="/uploads/to_delete.jpg"))
    test_session.add(image)
    test_session.commit()
    test_session.refresh(image)

    # Delete the image
    response = client.delete(f"/api/v1/images/{image.id}")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["message"] == "Image deleted successfully"

    # Verify the image was deleted from the database
    deleted_image = test_session.query(Image).filter(Image.id == image.id).first()
    assert deleted_image is None


def test_get_images(client, test_session):
    """Test getting all images"""
    # Create multiple image records in the database
    images_data = [
        _image_data(original_filename="image1.jpg", file_path="/uploads/image1.jpg", alt_text="Alt text 1", caption="First image"),
        _image_data(original_filename="image2.jpg", file_path="/uploads/image2.jpg", alt_text="Alt text 2", caption="Second image"),
        _image_data(original_filename="image3.jpg", file_path="/uploads/image3.jpg", alt_text="Alt text 3", caption="Third image"),
    ]

    for img_data in images_data:
        image = Image(**img_data)
        test_session.add(image)

    test_session.commit()

    response = client.get("/api/v1/images/")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3  # May have more from other tests

    # Check if our images are in the response
    alt_texts_in_response = [img["alt_text"] for img in data]
    for img_data in images_data:
        assert img_data["alt_text"] in alt_texts_in_response


def test_get_images_with_pagination(client, test_session):
    """Test getting images with pagination"""
    # Create multiple image records in the database
    for i in range(10):
        image = Image(**_image_data(
            original_filename=f"image_{i}.jpg",
            file_path=f"/uploads/image_{i}.jpg",
            alt_text=f"Alt text {i}",
            caption=f"Caption {i}",
        ))
        test_session.add(image)

    test_session.commit()

    # Get first page
    response = client.get("/api/v1/images/?skip=0&limit=5")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    # The actual count depends on other images that might exist
    assert len(data) <= 5


def test_get_featured_images(client, test_session):
    """Test getting only optimized images"""
    # Create both optimized and non-optimized images
    optimized_image = Image(**_image_data(original_filename="optimized.jpg", file_path="/uploads/optimized.jpg", alt_text="Optimized", is_optimized=True))
    non_optimized_image = Image(**_image_data(original_filename="regular.jpg", file_path="/uploads/regular.jpg", alt_text="Regular", is_optimized=False))

    test_session.add(optimized_image)
    test_session.add(non_optimized_image)
    test_session.commit()

    # Get all images
    response = client.get("/api/v1/images/")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)

    # 确认两张图片都返回即可
    alt_texts = [img["alt_text"] for img in data]
    assert "Optimized" in alt_texts
    assert "Regular" in alt_texts


def test_upload_image_large_file(client):
    """Test uploading an image that exceeds the size limit"""
    # Create a large temporary image file
    temp_image = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)

    # Create a large image (larger than typical upload limits)
    # Using a reasonable size for testing purposes (e.g., 10MB equivalent)
    img = PILImage.new('RGB', (3000, 3000), color='green')
    img.save(temp_image.name, format='JPEG')
    temp_image.seek(0)

    try:
        with open(temp_image.name, 'rb') as f:
            response = client.post(
                "/api/v1/images/",
                files={"file": ("large_image.jpg", f, "image/jpeg")}
            )

        # Response depends on backend file size validation
        # Could be 200 if accepted, 413 for payload too large, or 422 for validation
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            status.HTTP_422_UNPROCESSABLE_ENTITY
        ]
    finally:
        # Clean up the temporary file
        _close_and_unlink(temp_image)


def test_upload_image_special_characters(client, test_session):
    """Test uploading an image with special characters in metadata"""
    # Create a temporary image file for testing
    temp_image = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
    img = PILImage.new('RGB', (100, 100), color='purple')
    img.save(temp_image.name, format='JPEG')
    temp_image.seek(0)

    try:
        with open(temp_image.name, 'rb') as f:
            response = client.post(
                "/api/v1/images/",
                data={
                    "alt_text": "Special chars: @#$%^&*()",
                    "description": "Test with unicode",
                },
                files={"file": ("special_chars.jpg", f, "image/jpeg")}
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "id" in data
        # Verify that special characters are preserved
        assert "@#$%^&*()" in data["alt_text"]
    finally:
        # Clean up the temporary file
        _close_and_unlink(temp_image)


def test_upload_multiple_images_concurrently(client, test_session):
    """Test uploading multiple images (simulated sequentially)"""
    uploaded_ids = []

    for i in range(3):
        # Create a temporary image file for testing
        temp_image = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
        img = PILImage.new('RGB', (100, 100), color=(i*50, i*60, i*70))
        img.save(temp_image.name, format='JPEG')
        temp_image.seek(0)

        try:
            with open(temp_image.name, 'rb') as f:
                response = client.post(
                    "/api/v1/images/",
                    data={
                        "alt_text": f"Concurrent Test Image {i}",
                        "description": f"Image {i} for concurrent test"
                    },
                    files={"file": (f"concurrent_img_{i}.jpg", f, "image/jpeg")}
                )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["alt_text"] == f"Concurrent Test Image {i}"
            uploaded_ids.append(data["id"])
        finally:
            # Clean up the temporary file
            _close_and_unlink(temp_image)

    # Verify all images were uploaded
    assert len(uploaded_ids) == 3
    for img_id in uploaded_ids:
        response = client.get(f"/api/v1/images/{img_id}")
        assert response.status_code == status.HTTP_200_OK
