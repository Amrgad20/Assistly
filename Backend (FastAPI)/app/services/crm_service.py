from typing import Any


CUSTOMERS = [
    {
        "id": "3",
        "name": "Ahmed Hassan",
        "email": "customer@assistly.ai",
        "phone": "+20 100 000 0000",
        "status": "active",
        "orders": [
            {
                "order_id": "ORD-54821",
                "product": "Wireless Headphones",
                "status": "shipped",
                "tracking_number": "TRK-54821",
                "estimated_delivery": "Tomorrow",
                "purchase_date": "2026-07-05",
                "price": 149.99
            },
            {
                "order_id": "ORD-54210",
                "product": "Smart Watch",
                "status": "delivered",
                "tracking_number": "TRK-54210",
                "estimated_delivery": None,
                "purchase_date": "2026-06-20",
                "price": 199.99
            }
        ],
        "tickets": [
            {
                "ticket_id": "TKT-1001",
                "subject": "Damaged product",
                "status": "open",
                "priority": "high",
                "created_at": "2026-07-09"
            },
            {
                "ticket_id": "TKT-0988",
                "subject": "Shipping delay",
                "status": "resolved",
                "priority": "medium",
                "created_at": "2026-06-18"
            }
        ],
        "notes": [
            "Customer prefers email communication.",
            "Customer previously reported a damaged product."
        ]
    }
]


def get_customer_by_id(customer_id: str) -> dict[str, Any] | None:
    return next(
        (
            customer
            for customer in CUSTOMERS
            if customer["id"] == customer_id
        ),
        None
    )


def get_customer_by_email(email: str) -> dict[str, Any] | None:
    normalized_email = email.strip().lower()

    return next(
        (
            customer
            for customer in CUSTOMERS
            if customer["email"].lower() == normalized_email
        ),
        None
    )


def get_latest_order(customer: dict[str, Any]) -> dict[str, Any] | None:
    orders = customer.get("orders", [])

    if not orders:
        return None

    return max(
        orders,
        key=lambda order: order.get("purchase_date", "")
    )


def get_open_tickets(customer: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        ticket
        for ticket in customer.get("tickets", [])
        if ticket.get("status", "").lower() != "resolved"
    ]


def build_customer_context(
    customer_id: str | None = None,
    email: str | None = None
) -> dict[str, Any]:

    customer = None

    if customer_id:
        customer = get_customer_by_id(customer_id)

    if not customer and email:
        customer = get_customer_by_email(email)

    if not customer:
        return {
            "found": False,
            "customer": None,
            "latest_order": None,
            "open_tickets": []
        }

    return {
        "found": True,
        "customer": {
            "id": customer["id"],
            "name": customer["name"],
            "email": customer["email"],
            "phone": customer["phone"],
            "status": customer["status"],
            "notes": customer.get("notes", [])
        },
        "latest_order": get_latest_order(customer),
        "open_tickets": get_open_tickets(customer),
        "orders": customer.get("orders", []),
        "tickets": customer.get("tickets", [])
    }


def format_crm_context(crm_data: dict[str, Any]) -> str:

    if not crm_data.get("found"):
        return "No CRM customer data was found."

    customer = crm_data["customer"]
    latest_order = crm_data.get("latest_order")
    open_tickets = crm_data.get("open_tickets", [])

    lines = [
        f"Customer name: {customer['name']}",
        f"Customer email: {customer['email']}",
        f"Customer status: {customer['status']}"
    ]

    if latest_order:
        lines.extend([
            "",
            "Latest order:",
            f"- Order ID: {latest_order['order_id']}",
            f"- Product: {latest_order['product']}",
            f"- Status: {latest_order['status']}",
            f"- Tracking number: {latest_order['tracking_number']}",
            f"- Estimated delivery: {latest_order['estimated_delivery']}",
            f"- Purchase date: {latest_order['purchase_date']}"
        ])

    if open_tickets:
        lines.append("")
        lines.append("Open tickets:")

        for ticket in open_tickets:
            lines.extend([
                f"- Ticket ID: {ticket['ticket_id']}",
                f"  Subject: {ticket['subject']}",
                f"  Status: {ticket['status']}",
                f"  Priority: {ticket['priority']}"
            ])
    else:
        lines.extend([
            "",
            "Open tickets: None"
        ])

    notes = customer.get("notes", [])

    if notes:
        lines.append("")
        lines.append("Customer notes:")

        for note in notes:
            lines.append(f"- {note}")

    return "\n".join(lines)
