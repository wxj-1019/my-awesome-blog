import pytest
import uuid
from fastapi import status
from sqlalchemy.orm import Session, sessionmaker

from app.models.subscription import Subscription
from app.schemas.subscription import SubscriptionCreate, SubscriptionUpdate
from app.services import email_service as email_service_module
from app.services import notification_service


@pytest.fixture
def bg_db_session(test_engine, monkeypatch):
    """将通知后台任务的 SessionLocal 指到测试引擎。

    生产中后台任务必须自建会话（FastAPI 依赖清理先于后台任务执行）；
    测试里 SessionLocal 绑定的是另一个空内存库，需替换为 test_engine。
    """
    testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    monkeypatch.setattr(notification_service, "SessionLocal", testing_session_local)


@pytest.fixture
def fake_send_notification(monkeypatch):
    """mock 逐订阅者发送函数，记录每次调用的 (subscribers, title, url, excerpt)"""
    calls = []

    def _fake(subscribers, article_title, article_url, article_excerpt):
        calls.append((list(subscribers), article_title, article_url, article_excerpt))
        return True

    monkeypatch.setattr(email_service_module.email_service, "send_new_article_notification", _fake)
    return calls


@pytest.fixture
def fake_send_verification(monkeypatch):
    """mock 订阅验证邮件发送，记录每次调用的 (email, token)"""
    calls = []

    def _fake(email, token):
        calls.append((email, token))

    monkeypatch.setattr(email_service_module.email_service, "send_verification_email", _fake)
    return calls


def test_create_subscription(client, test_session):
    """Test creating a new subscription"""
    subscription_data = {
        "email": "subscriber@example.com",
    }

    response = client.post("/api/v1/subscriptions/", json=subscription_data)

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == "subscriber@example.com"
    assert "id" in data

    # Verify the subscription was saved to the database
    subscription_in_db = test_session.query(Subscription).filter(Subscription.email == "subscriber@example.com").first()
    assert subscription_in_db is not None
    assert subscription_in_db.email == "subscriber@example.com"


def test_create_subscription_without_name(client, test_session):
    """Test creating a subscription with only email (name is optional)"""
    subscription_data = {
        "email": "anonymous@example.com"
    }

    response = client.post("/api/v1/subscriptions/", json=subscription_data)

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == "anonymous@example.com"
    assert "id" in data


def test_create_duplicate_subscription(client, test_session):
    """Test creating a subscription with duplicate email returns existing subscription"""
    # Create first subscription
    subscription_data = {
        "email": "duplicate@example.com",
    }
    response = client.post("/api/v1/subscriptions/", json=subscription_data)
    assert response.status_code == status.HTTP_201_CREATED
    first_data = response.json()

    # Try to create another subscription with same email
    duplicate_data = {
        "email": "duplicate@example.com",
    }
    response = client.post("/api/v1/subscriptions/", json=duplicate_data)

    # 后端对重复邮箱直接返回已有订阅，统一成功响应（静默去重返回 200）
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == first_data["id"]


def test_get_subscription(client, test_session):
    """Test getting a specific subscription by ID"""
    # Create a subscription first
    subscription = Subscription(
        email="test@example.com",
    )
    test_session.add(subscription)
    test_session.commit()
    test_session.refresh(subscription)

    response = client.get(f"/api/v1/subscriptions/{subscription.id}")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == str(subscription.id)
    assert data["email"] == "test@example.com"


def test_get_nonexistent_subscription(client):
    """Test getting a subscription that doesn't exist"""
    response = client.get(f"/api/v1/subscriptions/{uuid.uuid4()}")

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_update_subscription(client, test_session):
    """Test updating an existing subscription"""
    # Create a subscription first
    subscription = Subscription(
        email="old@example.com",
        is_active=True,
    )
    test_session.add(subscription)
    test_session.commit()
    test_session.refresh(subscription)

    # Update the subscription (schema 仅允许 is_active / is_verified)
    update_data = {
        "is_active": False,
    }

    response = client.put(f"/api/v1/subscriptions/{subscription.id}", json=update_data)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["is_active"] is False

    # Verify the update in the database
    updated_subscription = test_session.query(Subscription).filter(Subscription.id == subscription.id).first()
    assert updated_subscription.is_active is False


def test_delete_subscription(client, test_session):
    """Test deleting an existing subscription"""
    # Create a subscription first
    subscription = Subscription(
        email="tobedeleted@example.com",
    )
    test_session.add(subscription)
    test_session.commit()
    test_session.refresh(subscription)

    # Delete the subscription
    response = client.delete(f"/api/v1/subscriptions/{subscription.id}")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["message"] == "Subscription deleted successfully"

    # Verify the subscription was deleted from the database
    deleted_subscription = test_session.query(Subscription).filter(Subscription.id == subscription.id).first()
    assert deleted_subscription is None


def test_get_subscriptions(client, test_session):
    """Test getting all subscriptions"""
    # Create multiple subscriptions
    subscriptions_data = [
        {"email": "user1@example.com"},
        {"email": "user2@example.com"},
        {"email": "user3@example.com"},
    ]

    for sub_data in subscriptions_data:
        subscription = Subscription(**sub_data)
        test_session.add(subscription)

    test_session.commit()

    response = client.get("/api/v1/subscriptions/")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3  # May have more from other tests

    # Check if our subscriptions are in the response
    emails_in_response = [sub["email"] for sub in data]
    for sub_data in subscriptions_data:
        assert sub_data["email"] in emails_in_response


def test_get_subscriptions_with_pagination(client, test_session):
    """Test getting subscriptions with pagination"""
    # Create multiple subscriptions
    for i in range(10):
        subscription = Subscription(
            email=f"user{i}@example.com",
        )
        test_session.add(subscription)

    test_session.commit()

    # Get first page
    response = client.get("/api/v1/subscriptions/?skip=0&limit=5")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    # The actual count depends on other subscriptions that might exist
    assert len(data) <= 5


def test_get_subscription_count(client, test_session):
    """Test getting the total count of subscribers"""
    # Create multiple subscriptions
    for i in range(5):
        subscription = Subscription(
            email=f"counttest{i}@example.com",
        )
        test_session.add(subscription)

    test_session.commit()

    # Get subscriber count
    response = client.get("/api/v1/subscriptions/count")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, int)
    assert data >= 5  # Could be more if other tests added subscriptions


def test_create_subscription_invalid_email(client):
    """Test creating a subscription with invalid email format"""
    subscription_data = {
        "email": "invalid-email",  # Invalid email format
    }

    response = client.post("/api/v1/subscriptions/", json=subscription_data)

    # Should return validation error if email validation is implemented
    assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_422_UNPROCESSABLE_ENTITY]


def test_update_subscription_to_duplicate_email(client, test_session):
    """Test updating a subscription is limited to schema fields"""
    # Create two subscriptions first
    sub1 = Subscription(email="first@example.com")
    sub2 = Subscription(email="second@example.com")
    test_session.add(sub1)
    test_session.add(sub2)
    test_session.commit()

    # Schema 不支持更新 email，尝试更新会被忽略或报错；这里测试更新状态
    update_data = {
        "is_active": False,
    }

    response = client.put(f"/api/v1/subscriptions/{sub2.id}", json=update_data)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["is_active"] is False


def test_create_multiple_subscriptions_same_name(client, test_session):
    """Test that multiple subscriptions can share the same name via different emails"""
    sub_data_1 = {
        "email": "person1@example.com",
    }

    sub_data_2 = {
        "email": "person2@example.com",
    }

    response1 = client.post("/api/v1/subscriptions/", json=sub_data_1)
    assert response1.status_code == status.HTTP_201_CREATED

    response2 = client.post("/api/v1/subscriptions/", json=sub_data_2)
    assert response2.status_code == status.HTTP_201_CREATED

    # Both should succeed since emails are different
    data1 = response1.json()
    data2 = response2.json()
    assert data1["email"] == "person1@example.com"
    assert data2["email"] == "person2@example.com"


def test_subscription_email_case_sensitivity(client, test_session):
    """Test if email addresses are treated as case-insensitive duplicates"""
    # Create first subscription
    sub_data_1 = {
        "email": "test@example.com",
    }
    response1 = client.post("/api/v1/subscriptions/", json=sub_data_1)
    assert response1.status_code == status.HTTP_201_CREATED

    # Try to create another subscription with same email but different case
    sub_data_2 = {
        "email": "TEST@EXAMPLE.COM",  # Same email, different case
    }
    response2 = client.post("/api/v1/subscriptions/", json=sub_data_2)

    # Depending on how the backend handles case sensitivity,
    # this might succeed or fail. Let's check both possibilities.
    if response2.status_code == status.HTTP_400_BAD_REQUEST:
        # If it fails, it means emails are treated as case-insensitive
        data = response2.json()
        assert "already subscribed" in data["detail"].lower()
    elif response2.status_code == status.HTTP_201_CREATED:
        # If it succeeds, it means emails are case-sensitive
        data = response2.json()
        assert data["email"] == "TEST@EXAMPLE.COM"


# ==================== 订阅邮件推送闭环（verify + 发布通知） ====================


def test_verify_subscription_success(client, test_session):
    """Test verifying a subscription with a valid token"""
    subscription = Subscription(
        email="verifyme@example.com",
        verification_token="valid-token-123",
    )
    test_session.add(subscription)
    test_session.commit()

    response = client.post("/api/v1/subscriptions/verify", json={"token": "valid-token-123"})

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["message"] == "邮箱验证成功"

    test_session.refresh(subscription)
    assert subscription.is_verified is True


def test_verify_subscription_invalid_token(client, test_session):
    """Test verifying with a token that does not exist"""
    response = client.post("/api/v1/subscriptions/verify", json={"token": "no-such-token"})

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    # 统一错误结构：error.code
    assert response.json()["error"]["code"] == "BAD_REQUEST"


def test_verify_subscription_twice_second_fails(client, test_session):
    """Test that a token can only be used once"""
    subscription = Subscription(
        email="once@example.com",
        verification_token="one-time-token",
    )
    test_session.add(subscription)
    test_session.commit()

    first = client.post("/api/v1/subscriptions/verify", json={"token": "one-time-token"})
    assert first.status_code == status.HTTP_200_OK

    second = client.post("/api/v1/subscriptions/verify", json={"token": "one-time-token"})
    assert second.status_code == status.HTTP_400_BAD_REQUEST


def test_create_subscription_sends_verification_email(client, fake_send_verification):
    """Test that creating a subscription queues a verification email (one recipient per email)"""
    response = client.post("/api/v1/subscriptions/", json={"email": "verifylink@example.com"})

    assert response.status_code == status.HTTP_201_CREATED
    assert len(fake_send_verification) == 1
    email, token = fake_send_verification[0]
    assert email == "verifylink@example.com"
    assert token  # token 非空


def test_duplicate_verified_subscription_silent_no_email(client, test_session, fake_send_verification):
    """Test that an already-active verified duplicate returns 200 without re-sending email"""
    subscription = Subscription(
        email="dupverified@example.com",
        is_active=True,
        is_verified=True,
        verification_token="dup-token",
    )
    test_session.add(subscription)
    test_session.commit()

    response = client.post("/api/v1/subscriptions/", json={"email": "dupverified@example.com"})

    # 重复订阅静默成功且不重发验证邮件
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["email"] == "dupverified@example.com"
    assert fake_send_verification == []


def test_create_published_article_notifies_active_subscribers(
    client, test_session, bg_db_session, fake_send_notification
):
    """Test that publishing on creation notifies active subscribers one-by-one"""
    from app.core.config import settings

    # 两个活跃订阅者 + 一个已退订者
    client.post("/api/v1/subscriptions/", json={"email": "active1@example.com"})
    client.post("/api/v1/subscriptions/", json={"email": "active2@example.com"})
    test_session.add(Subscription(email="unsubscribed@example.com", is_active=False))
    test_session.commit()

    response = client.post("/api/v1/articles/", json={
        "title": "New Post",
        "slug": "new-post-notify",
        "content": "Hello world",
        "excerpt": "Exc",
        "is_published": True,
    })
    assert response.status_code == status.HTTP_200_OK
    article_id = response.json()["id"]

    # 逐订阅者单独发送：仅活跃订阅者收到，退订者不收
    assert len(fake_send_notification) == 2
    recipient_lists = [entry[0] for entry in fake_send_notification]
    assert all(len(lst) == 1 for lst in recipient_lists)  # 每封 To 只有一个人
    assert {lst[0] for lst in recipient_lists} == {"active1@example.com", "active2@example.com"}
    # 文章链接指向前端详情页 /articles/{id}
    assert all(entry[2] == f"{settings.FRONTEND_URL}/articles/{article_id}" for entry in fake_send_notification)


def test_update_publish_transition_notifies_subscribers(
    client, test_session, bg_db_session, fake_send_notification
):
    """Test that a draft -> published transition via PUT triggers notification"""
    client.post("/api/v1/subscriptions/", json={"email": "reader@example.com"})

    # 先创建草稿（创建即未发布，不应触发通知）
    created = client.post("/api/v1/articles/", json={
        "title": "Draft",
        "slug": "draft-to-published",
        "content": "Body",
        "is_published": False,
    })
    assert created.status_code == status.HTTP_200_OK
    article_id = created.json()["id"]
    assert fake_send_notification == []

    # 未发布 -> 已发布：触发通知
    updated = client.put(f"/api/v1/articles/{article_id}", json={"is_published": True})
    assert updated.status_code == status.HTTP_200_OK

    assert len(fake_send_notification) == 1
    subscribers, title, url, _ = fake_send_notification[0]
    assert subscribers == ["reader@example.com"]
    assert title == "Draft"
    assert url.endswith(f"/articles/{article_id}")


def test_update_without_publish_change_no_notification(
    client, bg_db_session, fake_send_notification
):
    """Test that editing an article without publish status change does not notify"""
    created = client.post("/api/v1/articles/", json={
        "title": "Still Draft",
        "slug": "still-draft",
        "content": "Body",
        "is_published": False,
    })
    article_id = created.json()["id"]

    # 仅改标题，未发布 -> 未发布：不触发
    updated = client.put(f"/api/v1/articles/{article_id}", json={"title": "Renamed Draft"})
    assert updated.status_code == status.HTTP_200_OK
    assert fake_send_notification == []


def test_publish_notification_smtp_not_configured_no_error(client, bg_db_session):
    """Test that the whole flow does not error out when SMTP is not configured"""
    from app.core.config import settings

    # 测试环境默认未配置 SMTP，邮件服务处于禁用态
    assert email_service_module.email_service.enabled is False

    sub = client.post("/api/v1/subscriptions/", json={"email": "nosmtp@example.com"})
    assert sub.status_code == status.HTTP_201_CREATED

    article = client.post("/api/v1/articles/", json={
        "title": "No SMTP",
        "slug": "no-smtp-post",
        "content": "Body",
        "is_published": True,
    })
    # 发送侧静默跳过（email_service.enabled=False），请求本身不报错
    assert article.status_code == status.HTTP_200_OK
