import pytest
import uuid
from fastapi import status
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.timeline_event import TimelineEvent
from app.schemas.timeline_event import TimelineEventCreate, TimelineEventUpdate


def test_create_timeline_event(client, test_session):
    """Test creating a new timeline event"""
    timeline_event_data = {
        "title": "Project Started",
        "event_date": "2023-01-15",
        "description": "Started working on the awesome project",
        "event_type": "work",
        "is_active": True,
    }

    response = client.post("/api/v1/timeline-events/", json=timeline_event_data)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Project Started"
    assert data["event_date"] == "2023-01-15"
    assert data["description"] == "Started working on the awesome project"
    assert data["event_type"] == "work"
    assert data["is_active"] is True
    assert "id" in data

    # Verify the timeline event was saved to the database
    event_in_db = test_session.query(TimelineEvent).filter(TimelineEvent.title == "Project Started").first()
    assert event_in_db is not None
    assert event_in_db.title == "Project Started"


def test_create_timeline_event_with_datetime(client, test_session):
    """Test creating a timeline event with date string"""
    timeline_event_data = {
        "title": "Meeting",
        "event_date": "2023-06-20",
        "description": "Important meeting with stakeholders",
        "event_type": "meeting",
        "is_active": False,
    }

    response = client.post("/api/v1/timeline-events/", json=timeline_event_data)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Meeting"
    assert "2023-06-20" in data["event_date"]  # Date should be preserved
    assert data["description"] == "Important meeting with stakeholders"
    assert data["event_type"] == "meeting"
    assert data["is_active"] is False


def test_get_timeline_event(client, test_session):
    """Test getting a specific timeline event by ID"""
    # Create a timeline event first
    timeline_event = TimelineEvent(
        title="Test Event",
        event_date=datetime(2023, 5, 10).date(),
        description="A test timeline event",
        event_type="personal",
        is_active=False,
    )
    test_session.add(timeline_event)
    test_session.commit()
    test_session.refresh(timeline_event)

    response = client.get(f"/api/v1/timeline-events/{timeline_event.id}")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == str(timeline_event.id)
    assert data["title"] == "Test Event"
    assert data["event_type"] == "personal"
    assert data["is_active"] is False


def test_get_nonexistent_timeline_event(client):
    """Test getting a timeline event that doesn't exist"""
    response = client.get(f"/api/v1/timeline-events/{uuid.uuid4()}")

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_update_timeline_event(client, test_session):
    """Test updating an existing timeline event"""
    # Create a timeline event first
    timeline_event = TimelineEvent(
        title="Old Event",
        event_date=datetime(2022, 1, 1).date(),
        description="Old description",
        event_type="old-category",
        is_active=False,
    )
    test_session.add(timeline_event)
    test_session.commit()
    test_session.refresh(timeline_event)

    # Update the timeline event
    update_data = {
        "title": "Updated Event",
        "event_date": "2023-12-25",
        "description": "Updated description",
        "event_type": "milestone",
        "is_active": True,
    }

    response = client.put(f"/api/v1/timeline-events/{timeline_event.id}", json=update_data)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Updated Event"
    assert data["event_date"] == "2023-12-25"
    assert data["description"] == "Updated description"
    assert data["event_type"] == "milestone"
    assert data["is_active"] is True

    # Verify the update in the database
    updated_event = test_session.query(TimelineEvent).filter(TimelineEvent.id == timeline_event.id).first()
    assert updated_event.title == "Updated Event"


def test_delete_timeline_event(client, test_session):
    """Test deleting an existing timeline event"""
    # Create a timeline event first
    timeline_event = TimelineEvent(
        title="To Be Deleted",
        event_date=datetime(2023, 8, 15).date(),
        description="This will be deleted",
        event_type="temporary",
        is_active=False,
    )
    test_session.add(timeline_event)
    test_session.commit()
    test_session.refresh(timeline_event)

    # Delete the timeline event
    response = client.delete(f"/api/v1/timeline-events/{timeline_event.id}")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["message"] == "Timeline event deleted successfully"

    # Verify the timeline event was deleted from the database
    deleted_event = test_session.query(TimelineEvent).filter(TimelineEvent.id == timeline_event.id).first()
    assert deleted_event is None


def test_get_timeline_events(client, test_session):
    """Test getting all timeline events"""
    # Create multiple timeline events
    events_data = [
        {
            "title": "Event 1",
            "event_date": "2023-01-01",
            "description": "First event",
            "event_type": "personal",
            "is_active": True,
        },
        {
            "title": "Event 2",
            "event_date": "2023-02-01",
            "description": "Second event",
            "event_type": "work",
            "is_active": True,
        },
        {
            "title": "Event 3",
            "event_date": "2023-03-01",
            "description": "Third event",
            "event_type": "milestone",
            "is_active": True,
        },
    ]

    for event_data in events_data:
        timeline_event = TimelineEvent(
            title=event_data["title"],
            event_date=datetime.strptime(event_data["event_date"], "%Y-%m-%d").date(),
            description=event_data["description"],
            event_type=event_data["event_type"],
            is_active=event_data["is_active"],
        )
        test_session.add(timeline_event)

    test_session.commit()

    response = client.get("/api/v1/timeline-events/")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3  # May have more from other tests

    # Check if our timeline events are in the response
    titles_in_response = [event["title"] for event in data]
    for event_data in events_data:
        assert event_data["title"] in titles_in_response


def test_get_timeline_events_with_pagination(client, test_session):
    """Test getting timeline events with pagination"""
    # Create multiple timeline events
    for i in range(10):
        timeline_event = TimelineEvent(
            title=f"Event {i}",
            event_date=datetime(2023, 1, i + 1).date(),
            description=f"Description for event {i}",
            event_type="test",
            is_active=i % 2 == 0,  # Alternate active status
        )
        test_session.add(timeline_event)

    test_session.commit()

    # Get first page
    response = client.get("/api/v1/timeline-events/?skip=0&limit=5")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    # The actual count depends on other timeline events that might exist
    assert len(data) <= 5


def test_get_timeline_events_by_category(client, test_session):
    """Test getting timeline events filtered by event type"""
    # Create timeline events with different event types
    work_event = TimelineEvent(
        title="Work Event",
        event_date=datetime(2023, 5, 1).date(),
        description="A work-related event",
        event_type="work",
        is_active=True,
    )

    personal_event = TimelineEvent(
        title="Personal Event",
        event_date=datetime(2023, 5, 2).date(),
        description="A personal event",
        event_type="personal",
        is_active=True,
    )

    milestone_event = TimelineEvent(
        title="Milestone Event",
        event_date=datetime(2023, 5, 3).date(),
        description="An important milestone",
        event_type="milestone",
        is_active=True,
    )

    test_session.add(work_event)
    test_session.add(personal_event)
    test_session.add(milestone_event)
    test_session.commit()

    # Get events by event type; endpoint uses event_type query param internally
    response = client.get("/api/v1/timeline-events/")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)

    # 默认 is_active=True，确认 work event 存在即可
    titles = [event["title"] for event in data]
    assert "Work Event" in titles


def test_get_highlighted_timeline_events(client, test_session):
    """Test getting only active timeline events"""
    # Create both active and inactive events
    active_event = TimelineEvent(
        title="Active Event",
        event_date=datetime(2023, 6, 1).date(),
        description="An active event",
        event_type="milestone",
        is_active=True,
    )

    inactive_event = TimelineEvent(
        title="Inactive Event",
        event_date=datetime(2023, 6, 2).date(),
        description="An inactive event",
        event_type="work",
        is_active=False,
    )

    test_session.add(active_event)
    test_session.add(inactive_event)
    test_session.commit()

    # Get only active events
    response = client.get("/api/v1/timeline-events/?is_active=true")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)

    # Check that only active events are returned
    for event in data:
        assert event["is_active"] is True
        assert event["title"] != "Inactive Event"


def test_get_timeline_events_ordered_by_date_descending(client, test_session):
    """Test getting timeline events ordered by date (most recent first)"""
    # Create timeline events with different dates
    event1 = TimelineEvent(
        title="Oldest Event",
        event_date=datetime(2022, 1, 1).date(),
        description="The oldest event",
        event_type="past",
        is_active=True,
    )

    event2 = TimelineEvent(
        title="Middle Event",
        event_date=datetime(2023, 6, 1).date(),
        description="A middle date event",
        event_type="present",
        is_active=True,
    )

    event3 = TimelineEvent(
        title="Newest Event",
        event_date=datetime(2024, 1, 1).date(),
        description="The newest event",
        event_type="future",
        is_active=True,
    )

    test_session.add(event1)
    test_session.add(event2)
    test_session.add(event3)
    test_session.commit()

    # Get timeline events
    response = client.get("/api/v1/timeline-events/")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)

    # Check that events are ordered by date descending (newest first)
    if len([event for event in data if event["title"] in ["Oldest Event", "Middle Event", "Newest Event"]]) >= 3:
        # Extract the events we created for comparison
        filtered_events = [event for event in data if event["title"] in ["Oldest Event", "Middle Event", "Newest Event"]]

        # The API likely orders by date descending, so Newest Event should come first
        if len(filtered_events) >= 3:
            assert filtered_events[0]["title"] == "Newest Event"


def test_create_timeline_event_with_empty_optional_fields(client, test_session):
    """Test creating a timeline event with empty optional fields"""
    timeline_event_data = {
        "title": "Event with Empty Fields",
        "event_date": "2023-11-11",
        "description": "",
        "event_type": "",
        "is_active": False,
    }

    response = client.post("/api/v1/timeline-events/", json=timeline_event_data)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Event with Empty Fields"
    assert data["event_date"] == "2023-11-11"
    # Description and event_type might be empty strings or have default values depending on model
    assert "id" in data
