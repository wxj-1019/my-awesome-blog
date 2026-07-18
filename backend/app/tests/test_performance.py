import pytest
import time
import uuid
import asyncio
from concurrent.futures import ThreadPoolExecutor
import requests
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import text
import tracemalloc  # For memory profiling

from app.main import app
from app.models.user import User
from app.models.article import Article
from app.models.category import Category


def test_single_request_performance(client, test_session):
    """Test the performance of a single request"""
    start_time = time.time()
    
    response = client.get("/api/v1/categories/")
    
    end_time = time.time()
    duration = end_time - start_time
    
    # Assert that the response is successful
    assert response.status_code == 200
    
    # Performance requirement: single request should complete within 1 second
    assert duration < 1.0, f"Request took {duration:.3f}s, which is too slow"


def test_database_query_performance(client, test_session):
    """Test the performance of database queries"""
    # Measure time to create a category
    start_time = time.time()
    
    category_data = {
        "name": "Performance Test Category",
        "slug": "perf-test-cat",
        "description": "Category for performance testing"
    }
    response = client.post("/api/v1/categories/", json=category_data)
    
    create_duration = time.time() - start_time
    assert response.status_code == 200
    assert create_duration < 0.5, f"Category creation took {create_duration:.3f}s"
    
    # Measure time to retrieve categories
    start_time = time.time()
    response = client.get("/api/v1/categories/")
    read_duration = time.time() - start_time
    
    assert response.status_code == 200
    assert read_duration < 0.5, f"Category retrieval took {read_duration:.3f}s"


def test_multiple_requests_performance(client, test_session):
    """Test performance when making multiple sequential requests"""
    num_requests = 10
    
    start_time = time.time()
    
    for i in range(num_requests):
        response = client.get("/api/v1/categories/")
        assert response.status_code == 200
    
    total_duration = time.time() - start_time
    avg_duration = total_duration / num_requests
    
    assert avg_duration < 0.5, f"Average request time {avg_duration:.3f}s is too slow for {num_requests} requests"
    assert total_duration < 5.0, f"Total time {total_duration:.3f}s is too slow for {num_requests} requests"


def test_concurrent_requests_performance(test_engine, test_session):
    """Test performance under concurrent load"""
    from sqlalchemy.orm import sessionmaker
    from app.core.database import get_db

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    # 每个线程使用独立的 TestClient 和数据库会话，避免共享 Session 导致的并发问题
    def make_request(_):
        app.dependency_overrides[get_db] = override_get_db
        try:
            with TestClient(app) as test_client:
                response = test_client.get("/api/v1/categories/")
                return response.status_code == 200
        finally:
            app.dependency_overrides.pop(get_db, None)

    num_concurrent = 10
    start_time = time.time()

    with ThreadPoolExecutor(max_workers=5) as executor:
        results = list(executor.map(make_request, range(num_concurrent)))

    total_duration = time.time() - start_time

    # All requests should succeed
    assert all(results), "Not all concurrent requests succeeded"

    # Total time should be reasonable (less than 10 seconds for 10 concurrent requests)
    assert total_duration < 10.0, f"Concurrent requests took {total_duration:.3f}s"


def test_article_creation_performance(client, test_session):
    """Test performance of article creation with associated data"""
    # Create a user
    user = User(
        tenant_id=uuid.uuid4(),
        username="perf_test_user",
        email="perf_test@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    test_session.add(user)
    test_session.commit()
    
    # Create a category
    category_data = {
        "name": "Performance Articles",
        "slug": "perf-articles",
        "description": "Category for performance testing articles"
    }
    response = client.post("/api/v1/categories/", json=category_data)
    assert response.status_code == 200
    category = response.json()
    
    # Time the article creation
    start_time = time.time()
    
    article_data = {
        "title": "Performance Test Article",
        "slug": "performance-test-article",
        "content": "This is a performance test article with substantial content to measure how long it takes to create an article with realistic content length. The content should be long enough to simulate a real-world scenario where users create articles with meaningful content.",
        "excerpt": "Performance test article excerpt",
        "is_published": True,
        "category_id": category["id"]
    }
    response = client.post("/api/v1/articles/", json=article_data)
    
    creation_duration = time.time() - start_time
    
    assert response.status_code == 200
    assert creation_duration < 1.0, f"Article creation took {creation_duration:.3f}s"


def test_search_performance(client, test_session):
    """Test performance of search functionality with various data sizes"""
    # Create a user
    user = User(
        tenant_id=uuid.uuid4(),
        username="search_perf_user",
        email="search_perf@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    test_session.add(user)
    test_session.commit()
    
    # Create multiple articles to search through
    for i in range(20):
        article_data = {
            "title": f"Search Performance Test Article {i}",
            "slug": f"search-perf-article-{i}",
            "content": f"This is article {i} for search performance testing. It contains searchable content like Python, JavaScript, programming, development, and other relevant terms.",
            "excerpt": f"Excerpt for article {i}",
            "is_published": True
        }
        client.post("/api/v1/articles/", json=article_data)
    
    # Time the search operation
    start_time = time.time()
    response = client.get("/api/v1/articles/search", params={"q": "Python"})
    search_duration = time.time() - start_time
    
    assert response.status_code == 200
    assert search_duration < 1.0, f"Search operation took {search_duration:.3f}s for 20 articles"


def test_memory_usage_during_operations(client, test_session):
    """Test memory usage during operations"""
    # Start tracing memory
    tracemalloc.start()

    # Create a category
    category_data = {
        "name": "Memory Test Category",
        "slug": "memory-test",
        "description": "Category for memory usage testing"
    }
    response = client.post("/api/v1/categories/", json=category_data)
    assert response.status_code == 200

    # Retrieve categories
    response = client.get("/api/v1/categories/")
    assert response.status_code == 200

    # Take a snapshot
    current, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    # Memory usage should be reasonable (less than 100MB peak)
    assert peak < 100 * 1024 * 1024, f"Peak memory usage {peak / 1024 / 1024:.2f}MB is too high"


def test_pagination_performance(client, test_session):
    """Test performance of paginated results"""
    # Create a user
    user = User(
        tenant_id=uuid.uuid4(),
        username="pagination_user",
        email="pagination@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    test_session.add(user)
    test_session.commit()
    
    # Create multiple articles
    for i in range(50):
        article_data = {
            "title": f"Paged Article {i}",
            "slug": f"paged-article-{i}",
            "content": f"Content for paged article {i}",
            "excerpt": f"Excerpt {i}",
            "is_published": True
        }
        client.post("/api/v1/articles/", json=article_data)
    
    # Test performance with pagination
    start_time = time.time()
    response = client.get("/api/v1/articles/?skip=0&limit=10")
    pagination_duration = time.time() - start_time
    
    assert response.status_code == 200
    assert pagination_duration < 1.0, f"Paginated request took {pagination_duration:.3f}s"
    
    data = response.json()
    assert len(data) <= 10  # Should respect the limit


def test_cache_impact_on_performance(client, test_session):
    """Test performance with caching considerations (conceptual)"""
    # This test demonstrates where caching could be beneficial
    # In a real implementation, we would test actual cache hits/misses
    
    # Create a category
    category_data = {
        "name": "Cache Test Category",
        "slug": "cache-test",
        "description": "Category for cache performance testing"
    }
    response = client.post("/api/v1/categories/", json=category_data)
    assert response.status_code == 200
    category_id = response.json()["id"]
    
    # Make repeated requests for the same data
    start_time = time.time()
    for _ in range(5):
        response = client.get(f"/api/v1/categories/{category_id}")
        assert response.status_code == 200
    repeated_requests_duration = time.time() - start_time
    
    # Performance goal: repeated requests should be fast
    # In a real system with caching, subsequent requests would be faster
    assert repeated_requests_duration < 2.0, f"Repeated requests took {repeated_requests_duration:.3f}s"


def test_large_payload_handling(client, test_session):
    """Test how the system handles larger payloads"""
    # Create a user
    user = User(
        tenant_id=uuid.uuid4(),
        username="large_payload_user",
        email="large.payload@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    test_session.add(user)
    test_session.commit()
    
    # Create a large content payload
    large_content = "This is a large article content. " * 1000  # Repeat to create large content
    
    start_time = time.time()
    article_data = {
        "title": "Large Payload Article",
        "slug": "large-payload-article",
        "content": large_content,
        "excerpt": "Article with large content payload",
        "is_published": True
    }
    response = client.post("/api/v1/articles/", json=article_data)
    large_payload_duration = time.time() - start_time
    
    # Should handle large payloads reasonably
    assert response.status_code == 200
    assert large_payload_duration < 5.0, f"Large payload handling took {large_payload_duration:.3f}s"


def benchmark_endpoint_performance():
    """Run benchmarks on key endpoints"""
    results = {}
    
    with TestClient(app) as test_client:
        # Benchmark GET /categories
        times = []
        for _ in range(5):
            start = time.time()
            response = test_client.get("/api/v1/categories/")
            times.append(time.time() - start)
            assert response.status_code == 200
        results['get_categories_avg'] = sum(times) / len(times)
        results['get_categories_max'] = max(times)
        
        # Benchmark POST /categories
        times = []
        for i in range(5):
            start = time.time()
            category_data = {
                "name": f"Benchmark Category {i}",
                "slug": f"benchmark-cat-{i}",
                "description": "Category for benchmarking"
            }
            response = test_client.post("/api/v1/categories/", json=category_data)
            times.append(time.time() - start)
            if response.status_code == 200:
                # Clean up - delete the created category
                cat_id = response.json()['id']
                test_client.delete(f"/api/v1/categories/{cat_id}")
        results['post_categories_avg'] = sum(times) / len(times)
        results['post_categories_max'] = max(times)
    
    # Print results for analysis
    print("Performance Benchmark Results:")
    for key, value in results.items():
        print(f"  {key}: {value:.3f}s")
    
    # Assertions based on benchmark results
    assert results['get_categories_avg'] < 0.5, f"Avg GET categories time too slow: {results['get_categories_avg']:.3f}s"
    assert results['post_categories_avg'] < 1.0, f"Avg POST categories time too slow: {results['post_categories_avg']:.3f}s"
    
    return results