import json
from datetime import datetime, timezone
from typing import Any, Literal

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect
)
from pydantic import BaseModel, Field

from app.database.database import get_connection
from app.core.security import (
    decode_access_token,
    require_roles
)
from app.services.websocket_manager import (
    conversation_manager
)


router = APIRouter(
    prefix="/conversations",
    tags=["Conversations"]
)


class AttachmentPayload(BaseModel):
    id: str
    type: Literal["image", "voice", "file"]
    name: str
    url: str = ""


class MessagePayload(BaseModel):
    message_id: str
    sender: Literal["customer", "agent", "ai"]
    text: str = Field(default="", max_length=5000)
    timestamp: datetime
    attachments: list[AttachmentPayload] = Field(
        default_factory=list
    )
    customer_id: str
    customer_name: str
    customer_email: str = ""
    customer_phone: str = ""
    status: Literal["ai", "agent", "resolved"] = "ai"
    assigned_agent_id: str | None = None
    crm: dict[str, Any] = Field(default_factory=dict)
    ai_analysis: dict[str, Any] = Field(default_factory=dict)
    ticket: dict[str, Any] | None = None


@router.get("")
def list_conversations(
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
                SELECT * FROM conversations
                ORDER BY updated_at DESC
                """
            ).fetchall()
        elif user["role"] == "agent":
            rows = connection.execute(
                """
                SELECT * FROM conversations
                WHERE assigned_agent_id = ?
                ORDER BY updated_at DESC
                """,
                (user["id"],)
            ).fetchall()
        else:
            rows = connection.execute(
                """
                SELECT * FROM conversations
                WHERE customer_id = ?
                ORDER BY updated_at DESC
                """,
                (user["id"],)
            ).fetchall()

        return [
            _serialize_conversation(
                connection,
                row
            )
            for row in rows
        ]


@router.get("/{conversation_id}")
def get_conversation(
    conversation_id: str,
    user: dict = Depends(
        require_roles(
            "admin",
            "agent",
            "customer"
        )
    )
):
    with get_connection() as connection:
        row = _get_authorized_conversation(
            connection,
            conversation_id,
            user
        )

        if row is None:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found."
            )

        return _serialize_conversation(
            connection,
            row
        )


@router.post("/{conversation_id}/messages")
async def add_message(
    conversation_id: str,
    payload: MessagePayload,
    user: dict = Depends(
        require_roles(
            "admin",
            "agent",
            "customer"
        )
    )
):
    if (
        user["role"] in {"admin", "agent"}
        and payload.sender != "agent"
    ):
        raise HTTPException(
            status_code=403,
            detail="Admin and agent users may only send agent messages."
        )

    if (
        user["role"] == "customer"
        and payload.sender == "agent"
    ):
        raise HTTPException(
            status_code=403,
            detail="Customer users may not send agent messages."
        )

    now = datetime.now(
        timezone.utc
    ).isoformat()

    with get_connection() as connection:
        existing = connection.execute(
            """
            SELECT * FROM conversations
            WHERE id = ?
            """,
            (conversation_id,)
        ).fetchone()

        if existing is None:
            if user["role"] != "customer":
                raise HTTPException(
                    status_code=404,
                    detail="Conversation not found."
                )

            connection.execute(
                """
                INSERT INTO conversations (
                    id,
                    customer_id,
                    customer_name,
                    customer_email,
                    customer_phone,
                    status,
                    assigned_agent_id,
                    crm_json,
                    ai_analysis_json,
                    ticket_json,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, '', ?, NULL, ?, ?, ?, ?, ?)
                """,
                (
                    conversation_id,
                    user["id"],
                    user["name"],
                    user["email"],
                    payload.status,
                    json.dumps(payload.crm),
                    json.dumps(payload.ai_analysis),
                    json.dumps(payload.ticket)
                        if payload.ticket
                        else None,
                    now,
                    now
                )
            )
        else:
            if not _can_access_conversation(
                existing,
                user
            ):
                raise HTTPException(
                    status_code=404,
                    detail="Conversation not found."
                )

            assigned_agent_id = existing[
                "assigned_agent_id"
            ]

            if user["role"] == "admin":
                assigned_agent_id = (
                    payload.assigned_agent_id
                )

            connection.execute(
                """
                UPDATE conversations
                SET status = ?,
                    assigned_agent_id = ?,
                    crm_json = ?,
                    ai_analysis_json = ?,
                    ticket_json = ?,
                    updated_at = ?
                WHERE id = ?
                """,
                (
                    payload.status,
                    assigned_agent_id,
                    json.dumps(payload.crm),
                    json.dumps(payload.ai_analysis),
                    json.dumps(payload.ticket)
                        if payload.ticket
                        else None,
                    now,
                    conversation_id
                )
            )

        connection.execute(
            """
            INSERT OR IGNORE INTO messages (
                id,
                conversation_id,
                sender,
                text,
                timestamp,
                attachments_json
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                payload.message_id,
                conversation_id,
                payload.sender,
                payload.text,
                payload.timestamp.isoformat(),
                json.dumps([
                    item.model_dump()
                    for item in payload.attachments
                ])
            )
        )

        row = connection.execute(
            """
            SELECT * FROM conversations
            WHERE id = ?
            """,
            (conversation_id,)
        ).fetchone()

        conversation = _serialize_conversation(
            connection,
            row
        )

    await conversation_manager.broadcast_conversation(
        conversation
    )

    return conversation


@router.websocket("/ws/live")
async def conversation_websocket(
    websocket: WebSocket,
    token: str
):
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")

        with get_connection() as connection:
            user = connection.execute(
                """
                SELECT id, name, email, role
                FROM users
                WHERE id = ?
                """,
                (user_id,)
            ).fetchone()

        if user is None:
            await websocket.close(code=4401)
            return

    except HTTPException:
        await websocket.close(code=4401)
        return

    await conversation_manager.connect(
        websocket,
        dict(user)
    )

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        conversation_manager.disconnect(
            websocket
        )


def _serialize_conversation(
    connection,
    row
) -> dict:
    message_rows = connection.execute(
        """
        SELECT * FROM messages
        WHERE conversation_id = ?
        ORDER BY timestamp ASC
        """,
        (row["id"],)
    ).fetchall()

    return {
        "id": row["id"],
        "customer": {
            "id": row["customer_id"],
            "name": row["customer_name"],
            "email": row["customer_email"],
            "phone": row["customer_phone"]
        },
        "messages": [
            {
                "id": message["id"],
                "sender": message["sender"],
                "text": message["text"],
                "createdAt": message["timestamp"],
                "attachments": json.loads(
                    message["attachments_json"]
                )
            }
            for message in message_rows
        ],
        "crm": json.loads(row["crm_json"]),
        "aiAnalysis": json.loads(
            row["ai_analysis_json"]
        ),
        "ticket": (
            json.loads(row["ticket_json"])
            if row["ticket_json"]
            else None
        ),
        "assignedAgentId": row[
            "assigned_agent_id"
        ],
        "status": row["status"]
    }


def _get_authorized_conversation(
    connection,
    conversation_id: str,
    user: dict
):
    row = connection.execute(
        """
        SELECT * FROM conversations
        WHERE id = ?
        """,
        (conversation_id,)
    ).fetchone()

    if (
        row is None or
        not _can_access_conversation(
            row,
            user
        )
    ):
        return None

    return row


def _can_access_conversation(
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
