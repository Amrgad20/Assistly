import sqlite3
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.database.database import get_connection
from app.core.security import require_roles


router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"]
)


class AutomaticTicketPayload(BaseModel):
    id: str
    conversation_id: str
    issue_key: str
    subject: str
    customer: str
    description: str
    category: str
    priority: Literal["low", "medium", "high"]
    status: Literal["open", "pending", "resolved"]
    assigned_agent_id: str
    order_number: str | None = None
    created_at: datetime
    updated_at: datetime


@router.get("")
def list_tickets(
    user: dict = Depends(
        require_roles(
            "admin",
            "agent",
            "customer"
        )
    )
):
    with get_connection() as connection:
        if user["role"] == "admin":
            rows = connection.execute(
                """
                SELECT * FROM tickets
                ORDER BY created_at DESC
                """
            ).fetchall()
        elif user["role"] == "agent":
            rows = connection.execute(
                """
                SELECT * FROM tickets
                WHERE assigned_agent_id = ?
                ORDER BY created_at DESC
                """,
                (user["id"],)
            ).fetchall()
        else:
            rows = connection.execute(
                """
                SELECT * FROM tickets
                WHERE customer_id = ?
                ORDER BY created_at DESC
                """,
                (user["id"],)
            ).fetchall()

        return [
            _serialize_ticket(row)
            for row in rows
        ]


@router.get("/{ticket_id}")
def get_ticket(
    ticket_id: str,
    user: dict = Depends(
        require_roles(
            "admin",
            "agent",
            "customer"
        )
    )
):
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT * FROM tickets
            WHERE id = ?
            """,
            (ticket_id,)
        ).fetchone()

        if (
            row is None or
            not _can_access_ticket(
                row,
                user
            )
        ):
            raise HTTPException(
                status_code=404,
                detail="Ticket not found."
            )

        return _serialize_ticket(row)


@router.post("/auto")
def create_automatic_ticket(
    payload: AutomaticTicketPayload,
    user: dict = Depends(
        require_roles("customer")
    )
):
    created = True
    now = datetime.now(
        timezone.utc
    ).isoformat()

    with get_connection() as connection:
        conversation = connection.execute(
            """
            SELECT * FROM conversations
            WHERE id = ?
              AND customer_id = ?
            """,
            (
                payload.conversation_id,
                user["id"]
            )
        ).fetchone()

        if conversation is None:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found."
            )

        assigned_agent_id = conversation[
            "assigned_agent_id"
        ]

        if not assigned_agent_id:
            agent = connection.execute(
                """
                SELECT id FROM users
                WHERE role = 'agent'
                ORDER BY created_at ASC
                LIMIT 1
                """
            ).fetchone()

            if agent is None:
                raise HTTPException(
                    status_code=409,
                    detail="No support agent is available."
                )

            assigned_agent_id = agent["id"]

        try:
            connection.execute(
                """
                INSERT INTO tickets (
                    id,
                    conversation_id,
                    customer_id,
                    issue_key,
                    subject,
                    customer,
                    description,
                    category,
                    priority,
                    status,
                    assigned_agent_id,
                    order_number,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    payload.id,
                    payload.conversation_id,
                    user["id"],
                    payload.issue_key,
                    payload.subject,
                    user["name"],
                    payload.description,
                    payload.category,
                    payload.priority,
                    payload.status,
                    assigned_agent_id,
                    payload.order_number,
                    now,
                    now
                )
            )
        except sqlite3.IntegrityError:
            created = False

        connection.execute(
            """
            UPDATE conversations
            SET assigned_agent_id = ?,
                status = 'agent',
                updated_at = ?
            WHERE id = ?
            """,
            (
                assigned_agent_id,
                now,
                payload.conversation_id
            )
        )

        row = connection.execute(
            """
            SELECT * FROM tickets
            WHERE conversation_id = ?
              AND issue_key = ?
            """,
            (
                payload.conversation_id,
                payload.issue_key
            )
        ).fetchone()

        if row is None:
            raise HTTPException(
                status_code=409,
                detail="The ticket ID is already in use."
            )

        return {
            "created": created,
            "ticket": _serialize_ticket(row)
        }


def _serialize_ticket(row) -> dict:
    return {
        "id": row["id"],
        "conversationId": row["conversation_id"],
        "customerId": row["customer_id"],
        "issueKey": row["issue_key"],
        "subject": row["subject"],
        "customer": row["customer"],
        "description": row["description"],
        "category": row["category"],
        "priority": row["priority"],
        "status": row["status"],
        "assignedAgentId": row[
            "assigned_agent_id"
        ],
        "orderNumber": row["order_number"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"]
    }


def _can_access_ticket(
    row,
    user: dict
) -> bool:
    if user["role"] == "admin":
        return True

    if user["role"] == "agent":
        return (
            row["assigned_agent_id"] ==
            user["id"]
        )

    return row["customer_id"] == user["id"]
