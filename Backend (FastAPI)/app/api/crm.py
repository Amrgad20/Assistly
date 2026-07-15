from fastapi import APIRouter, Depends, HTTPException

from app.core.security import require_roles
from app.database.database import get_connection
from app.services.crm_service import build_customer_context


router = APIRouter(
    prefix="/crm",
    tags=["CRM"]
)


@router.get("/me")
def get_my_crm(
    user: dict = Depends(
        require_roles("customer")
    )
):
    return _get_customer_details(
        user["id"],
        user
    )


@router.get("/customers")
def list_customers(
    user: dict = Depends(
        require_roles(
            "admin",
            "agent"
        )
    )
):
    with get_connection() as connection:
        if user["role"] == "admin":
            rows = connection.execute(
                """
                SELECT
                    users.id,
                    users.name,
                    users.email,
                    MAX(conversations.updated_at) AS last_contact
                FROM users
                LEFT JOIN conversations
                    ON conversations.customer_id = users.id
                WHERE users.role = 'customer'
                GROUP BY users.id, users.name, users.email
                ORDER BY users.created_at DESC
                """
            ).fetchall()
        else:
            rows = connection.execute(
                """
                SELECT DISTINCT
                    users.id,
                    users.name,
                    users.email,
                    MAX(conversations.updated_at) AS last_contact
                FROM users
                LEFT JOIN conversations
                    ON conversations.customer_id = users.id
                LEFT JOIN tickets
                    ON tickets.customer_id = users.id
                WHERE users.role = 'customer'
                  AND (
                    conversations.assigned_agent_id = ?
                    OR tickets.assigned_agent_id = ?
                  )
                GROUP BY users.id, users.name, users.email
                ORDER BY last_contact DESC
                """,
                (
                    user["id"],
                    user["id"]
                )
            ).fetchall()

    return [
        {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "status": "active",
            "lastContact": (
                row["last_contact"] or
                "No conversations yet"
            )
        }
        for row in rows
    ]


@router.get("/customers/{customer_id}")
def get_customer_crm(
    customer_id: str,
    user: dict = Depends(
        require_roles(
            "admin",
            "agent",
            "customer"
        )
    )
):
    return _get_customer_details(
        customer_id,
        user
    )


def _get_customer_details(
    customer_id: str,
    user: dict
) -> dict:
    with get_connection() as connection:
        customer = connection.execute(
            """
            SELECT id, name, email
            FROM users
            WHERE id = ?
              AND role = 'customer'
            """,
            (customer_id,)
        ).fetchone()

        allowed = False

        if customer is not None:
            if user["role"] == "admin":
                allowed = True
            elif user["role"] == "customer":
                allowed = user["id"] == customer_id
            else:
                assigned = connection.execute(
                    """
                    SELECT 1
                    FROM conversations
                    WHERE customer_id = ?
                      AND assigned_agent_id = ?
                    UNION
                    SELECT 1
                    FROM tickets
                    WHERE customer_id = ?
                      AND assigned_agent_id = ?
                    LIMIT 1
                    """,
                    (
                        customer_id,
                        user["id"],
                        customer_id,
                        user["id"]
                    )
                ).fetchone()
                allowed = assigned is not None

    if customer is None or not allowed:
        raise HTTPException(
            status_code=404,
            detail="Customer not found."
        )

    crm_data = build_customer_context(
        customer_id=customer_id,
        email=customer["email"]
    )

    if not crm_data["found"]:
        return {
            "found": True,
            "customer": {
                "id": customer["id"],
                "name": customer["name"],
                "email": customer["email"],
                "phone": "",
                "status": "active",
                "notes": []
            },
            "latest_order": None,
            "open_tickets": [],
            "orders": [],
            "tickets": []
        }

    return crm_data
