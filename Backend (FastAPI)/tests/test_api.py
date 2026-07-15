from datetime import datetime, timezone
from uuid import uuid4


def test_health_returns_200(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_ai_chat_validates_input(
    client,
    customer_headers
):
    response = client.post(
        "/ai/chat",
        json={"message": ""},
        headers=customer_headers
    )

    assert response.status_code == 422


def test_automatic_ticket_avoids_duplicates(
    client,
    customer_headers
):
    conversation_id = f"test-{uuid4()}"
    now = datetime.now(
        timezone.utc
    ).isoformat()

    payload = {
        "id": f"TK-{uuid4()}",
        "conversation_id": conversation_id,
        "issue_key": "order-resolution",
        "subject": "Damaged product refund request",
        "customer": "Test Customer",
        "description": (
            "My order arrived damaged and I need a refund."
        ),
        "category": "Refund",
        "priority": "high",
        "status": "open",
        "assigned_agent_id": "2",
        "order_number": "ORD-1001",
        "created_at": now,
        "updated_at": now
    }

    conversation = client.post(
        f"/conversations/{conversation_id}/messages",
        json={
            "message_id": f"message-{uuid4()}",
            "sender": "customer",
            "text": "My order arrived damaged.",
            "timestamp": now,
            "attachments": [],
            "customer_id": "spoofed-customer",
            "customer_name": "Spoofed Customer",
            "customer_email": "spoofed@example.com",
            "customer_phone": "",
            "status": "ai",
            "assigned_agent_id": None,
            "crm": {},
            "ai_analysis": {},
            "ticket": None
        },
        headers=customer_headers
    )

    assert conversation.status_code == 200
    assert conversation.json()["customer"]["id"] == "3"

    first = client.post(
        "/tickets/auto",
        json=payload,
        headers=customer_headers
    )

    second = client.post(
        "/tickets/auto",
        json={
            **payload,
            "id": f"TK-{uuid4()}",
            "description": "I still need that refund."
        },
        headers=customer_headers
    )

    assert first.status_code == 200
    assert first.json()["created"] is True
    assert second.status_code == 200
    assert second.json()["created"] is False
    assert (
        second.json()["ticket"]["id"] ==
        first.json()["ticket"]["id"]
    )


def test_knowledge_upload_rejects_invalid_type(
    client,
    admin_headers
):
    response = client.post(
        "/knowledge/upload",
        files={
            "file": (
                "malware.exe",
                b"not a document",
                "application/octet-stream"
            )
        },
        headers=admin_headers
    )

    assert response.status_code == 400
    assert "PDF and TXT" in response.json()["detail"]


def test_auth_login_success(client):
    response = client.post(
        "/auth/login",
        json={
            "email": "admin@assistly.ai",
            "password": "12345678"
        }
    )

    assert response.status_code == 200
    assert response.json()["user"]["role"] == "admin"
    assert response.json()["access_token"]


def test_auth_login_failure(client):
    response = client.post(
        "/auth/login",
        json={
            "email": "admin@assistly.ai",
            "password": "wrong-password"
        }
    )

    assert response.status_code == 401
