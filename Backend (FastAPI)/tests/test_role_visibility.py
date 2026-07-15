from datetime import datetime, timezone
from uuid import uuid4

import pytest

from app.core.security import hash_password
from app.database.database import get_connection


def _register_customer(client, label: str) -> tuple[dict, dict]:
    suffix = uuid4().hex
    email = f"{label}-{suffix}@example.com"
    password = "Customer@2026"

    response = client.post(
        "/auth/register",
        json={
            "name": f"Customer {label}",
            "email": email,
            "password": password
        }
    )
    assert response.status_code == 201

    login = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password
        }
    )
    assert login.status_code == 200

    body = login.json()
    return (
        body["user"],
        {
            "Authorization": (
                f"Bearer {body['access_token']}"
            )
        }
    )


def _create_conversation(
    client,
    headers: dict,
    conversation_id: str,
    spoofed_customer_id: str
) -> dict:
    now = datetime.now(
        timezone.utc
    ).isoformat()

    response = client.post(
        f"/conversations/{conversation_id}/messages",
        json={
            "message_id": f"message-{uuid4()}",
            "sender": "customer",
            "text": "I need help with my order.",
            "timestamp": now,
            "attachments": [],
            "customer_id": spoofed_customer_id,
            "customer_name": "Spoofed Name",
            "customer_email": "spoofed@example.com",
            "customer_phone": "+1 555 0100",
            "status": "ai",
            "assigned_agent_id": "other-agent",
            "crm": {},
            "ai_analysis": {},
            "ticket": None
        },
        headers=headers
    )
    assert response.status_code == 200
    return response.json()


def _create_ticket(
    client,
    headers: dict,
    conversation_id: str,
    ticket_id: str
) -> dict:
    now = datetime.now(
        timezone.utc
    ).isoformat()
    response = client.post(
        "/tickets/auto",
        json={
            "id": ticket_id,
            "conversation_id": conversation_id,
            "issue_key": "test-order-issue",
            "subject": "Order support",
            "customer": "Spoofed Ticket Customer",
            "description": "The order needs support.",
            "category": "Order",
            "priority": "high",
            "status": "open",
            "assigned_agent_id": "other-agent",
            "order_number": "ORD-TEST",
            "created_at": now,
            "updated_at": now
        },
        headers=headers
    )
    assert response.status_code == 200
    return response.json()["ticket"]


@pytest.fixture()
def role_records(client):
    user_a, headers_a = _register_customer(
        client,
        "A"
    )
    user_b, headers_b = _register_customer(
        client,
        "B"
    )

    with get_connection() as connection:
        connection.execute(
            """
            INSERT OR IGNORE INTO users (
                id,
                name,
                email,
                password_hash,
                role,
                created_at
            ) VALUES (?, ?, ?, ?, 'agent', ?)
            """,
            (
                "other-agent",
                "Other Agent",
                "other-agent@assistly.ai",
                hash_password("OtherAgent@2026"),
                datetime.now(
                    timezone.utc
                ).isoformat()
            )
        )

    conversation_a = f"conversation-a-{uuid4()}"
    conversation_b = f"conversation-b-{uuid4()}"
    ticket_a = f"TK-A-{uuid4()}"
    ticket_b = f"TK-B-{uuid4()}"

    created_a = _create_conversation(
        client,
        headers_a,
        conversation_a,
        user_b["id"]
    )
    created_b = _create_conversation(
        client,
        headers_b,
        conversation_b,
        user_a["id"]
    )
    created_ticket_a = _create_ticket(
        client,
        headers_a,
        conversation_a,
        ticket_a
    )
    created_ticket_b = _create_ticket(
        client,
        headers_b,
        conversation_b,
        ticket_b
    )

    with get_connection() as connection:
        connection.execute(
            """
            UPDATE conversations
            SET assigned_agent_id = 'other-agent'
            WHERE id = ?
            """,
            (conversation_b,)
        )
        connection.execute(
            """
            UPDATE tickets
            SET assigned_agent_id = 'other-agent'
            WHERE id = ?
            """,
            (ticket_b,)
        )

    return {
        "user_a": user_a,
        "user_b": user_b,
        "headers_a": headers_a,
        "headers_b": headers_b,
        "conversation_a": conversation_a,
        "conversation_b": conversation_b,
        "ticket_a": ticket_a,
        "ticket_b": ticket_b,
        "created_a": created_a,
        "created_b": created_b,
        "created_ticket_a": created_ticket_a,
        "created_ticket_b": created_ticket_b
    }


def test_customer_a_cannot_see_customer_b_conversations(
    client,
    role_records
):
    response = client.get(
        "/conversations",
        headers=role_records["headers_a"]
    )

    assert response.status_code == 200
    assert {
        item["id"]
        for item in response.json()
    } == {role_records["conversation_a"]}
    assert (
        role_records["created_a"]["customer"]["id"] ==
        role_records["user_a"]["id"]
    )


def test_customer_a_cannot_see_customer_b_tickets(
    client,
    role_records
):
    response = client.get(
        "/tickets",
        headers=role_records["headers_a"]
    )

    assert response.status_code == 200
    assert {
        item["id"]
        for item in response.json()
    } == {role_records["ticket_a"]}
    assert (
        role_records["created_ticket_a"]["customerId"] ==
        role_records["user_a"]["id"]
    )


def test_admin_can_see_all_customer_records(
    client,
    admin_headers,
    role_records
):
    conversations = client.get(
        "/conversations",
        headers=admin_headers
    )
    tickets = client.get(
        "/tickets",
        headers=admin_headers
    )
    customers = client.get(
        "/crm/customers",
        headers=admin_headers
    )

    assert conversations.status_code == 200
    assert tickets.status_code == 200
    assert customers.status_code == 200
    assert {
        role_records["conversation_a"],
        role_records["conversation_b"]
    }.issubset({
        item["id"]
        for item in conversations.json()
    })
    assert {
        role_records["ticket_a"],
        role_records["ticket_b"]
    }.issubset({
        item["id"]
        for item in tickets.json()
    })
    assert {
        role_records["user_a"]["id"],
        role_records["user_b"]["id"]
    }.issubset({
        item["id"]
        for item in customers.json()
    })


def test_agent_sees_only_assigned_records(
    client,
    agent_headers,
    role_records
):
    conversations = client.get(
        "/conversations",
        headers=agent_headers
    )
    tickets = client.get(
        "/tickets",
        headers=agent_headers
    )

    conversation_ids = {
        item["id"]
        for item in conversations.json()
    }
    ticket_ids = {
        item["id"]
        for item in tickets.json()
    }

    assert role_records["conversation_a"] in conversation_ids
    assert role_records["conversation_b"] not in conversation_ids
    assert role_records["ticket_a"] in ticket_ids
    assert role_records["ticket_b"] not in ticket_ids


def test_direct_access_to_another_customer_record_is_rejected(
    client,
    role_records
):
    conversation = client.get(
        (
            "/conversations/" +
            role_records["conversation_a"]
        ),
        headers=role_records["headers_b"]
    )
    ticket = client.get(
        f"/tickets/{role_records['ticket_a']}",
        headers=role_records["headers_b"]
    )
    crm = client.get(
        (
            "/crm/customers/" +
            role_records["user_a"]["id"]
        ),
        headers=role_records["headers_b"]
    )

    assert conversation.status_code == 404
    assert ticket.status_code == 404
    assert crm.status_code == 404
