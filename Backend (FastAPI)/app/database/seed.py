import json
from datetime import datetime, timedelta, timezone

from app.core.security import hash_password
from app.database.database import get_connection


DEMO_PASSWORD = "12345678"
DEMO_START = datetime(
    2026,
    6,
    1,
    9,
    0,
    tzinfo=timezone.utc
)

DEMO_USERS = [
    {
        "id": "1",
        "name": "Sarah Mitchell",
        "email": "admin@assistly.ai",
        "role": "admin"
    },
    {
        "id": "admin-2",
        "name": "Omar Khalil",
        "email": "omar.khalil@assistly.ai",
        "role": "admin"
    },
    {
        "id": "2",
        "name": "Daniel Carter",
        "email": "agent@assistly.ai",
        "role": "agent"
    },
    {
        "id": "agent-2",
        "name": "Layla Mansour",
        "email": "layla.mansour@assistly.ai",
        "role": "agent"
    },
    {
        "id": "agent-3",
        "name": "Yusuf Ali",
        "email": "yusuf.ali@assistly.ai",
        "role": "agent"
    },
    {
        "id": "agent-4",
        "name": "Emma Collins",
        "email": "emma.collins@assistly.ai",
        "role": "agent"
    },
    {
        "id": "agent-5",
        "name": "Karim Nassar",
        "email": "karim.nassar@assistly.ai",
        "role": "agent"
    },
    {
        "id": "3",
        "name": "Ahmed Hassan",
        "email": "customer@assistly.ai",
        "role": "customer"
    },
    {
        "id": "customer-2",
        "name": "Mariam Adel",
        "email": "mariam.adel@example.com",
        "role": "customer"
    },
    {
        "id": "customer-3",
        "name": "Nour El-Sayed",
        "email": "nour.elsayed@example.com",
        "role": "customer"
    },
    {
        "id": "customer-4",
        "name": "James Wilson",
        "email": "james.wilson@example.com",
        "role": "customer"
    },
    {
        "id": "customer-5",
        "name": "Fatma Ibrahim",
        "email": "fatma.ibrahim@example.com",
        "role": "customer"
    },
    {
        "id": "customer-6",
        "name": "Lina Haddad",
        "email": "lina.haddad@example.com",
        "role": "customer"
    },
    {
        "id": "customer-7",
        "name": "Michael Brown",
        "email": "michael.brown@example.com",
        "role": "customer"
    },
    {
        "id": "customer-8",
        "name": "Salma Mostafa",
        "email": "salma.mostafa@example.com",
        "role": "customer"
    },
    {
        "id": "customer-9",
        "name": "David Chen",
        "email": "david.chen@example.com",
        "role": "customer"
    },
    {
        "id": "customer-10",
        "name": "Huda Farouk",
        "email": "huda.farouk@example.com",
        "role": "customer"
    },
    {
        "id": "customer-11",
        "name": "Adam Lewis",
        "email": "adam.lewis@example.com",
        "role": "customer"
    },
    {
        "id": "customer-12",
        "name": "Rana Samir",
        "email": "rana.samir@example.com",
        "role": "customer"
    },
    {
        "id": "customer-13",
        "name": "Peter Morgan",
        "email": "peter.morgan@example.com",
        "role": "customer"
    },
    {
        "id": "customer-14",
        "name": "Yasmin Tarek",
        "email": "yasmin.tarek@example.com",
        "role": "customer"
    },
    {
        "id": "customer-15",
        "name": "Khaled Mahmoud",
        "email": "khaled.mahmoud@example.com",
        "role": "customer"
    }
]

AGENT_IDS = [
    "2",
    "agent-2",
    "agent-3",
    "agent-4",
    "agent-5"
]

CONVERSATION_SPECS = [
    {
        "id": "demo-conversation-ahmed",
        "customer_id": "3",
        "topic": "Refund Request",
        "sentiment": "Negative",
        "status": "agent",
        "phone": "+20 100 555 0101",
        "messages": [
            ("customer", "وصلني الـ Order مكسور ومحتاج Refund."),
            ("ai", "آسف إن الطلب وصل تالف. هل يمكنك تأكيد رقم الطلب؟"),
            ("customer", "رقم الطلب ORD-26001 والصندوق كان مفتوح."),
            ("agent", "تم تسجيل طلب الاسترداد وسأتابع معك خلال يوم عمل.")
        ]
    },
    {
        "id": "demo-conversation-02",
        "customer_id": "customer-2",
        "topic": "Product Damaged",
        "sentiment": "Negative",
        "status": "agent",
        "phone": "+20 101 555 0102",
        "messages": [
            ("customer", "المنتج وصل وفيه كسر واضح في الغطاء."),
            ("ai", "أعتذر عن ذلك. يمكنك إرفاق صورة للجزء التالف."),
            ("customer", "رفعت صورتين، وأفضل Replacement بدل Refund."),
            ("agent", "تمت مراجعة الصور والموافقة على إرسال بديل."),
            ("customer", "شكراً، منتظرة رقم الشحنة الجديدة.")
        ]
    },
    {
        "id": "demo-conversation-03",
        "customer_id": "customer-3",
        "topic": "Wrong Item",
        "sentiment": "Neutral",
        "status": "resolved",
        "phone": "+20 102 555 0103",
        "messages": [
            ("customer", "طلبت سماعات سوداء لكن وصلني اللون الأبيض."),
            ("ai", "يمكننا مساعدتك في استبدال المنتج باللون الصحيح."),
            ("customer", "تمام، المنتج ما زال مغلقاً."),
            ("agent", "أنشأنا طلب استبدال مجاني وسيصل المندوب غداً."),
            ("customer", "ممتاز، شكراً على سرعة الحل.")
        ]
    },
    {
        "id": "demo-conversation-04",
        "customer_id": "customer-4",
        "topic": "Missing Package",
        "sentiment": "Concerned",
        "status": "agent",
        "phone": "+1 202 555 0104",
        "messages": [
            ("customer", "The courier marked my package delivered, but it is not here."),
            ("ai", "I can help investigate. Have you checked with neighbors or reception?"),
            ("customer", "Yes, the building reception did not receive it."),
            ("agent", "I opened a carrier investigation and will update you within 48 hours.")
        ]
    },
    {
        "id": "demo-conversation-05",
        "customer_id": "customer-5",
        "topic": "Delivery Delay",
        "sentiment": "Negative",
        "status": "agent",
        "phone": "+20 106 555 0105",
        "messages": [
            ("customer", "الشحنة متأخرة خمسة أيام والـ Tracking ثابت."),
            ("ai", "سأراجع آخر تحديث متاح من شركة الشحن."),
            ("customer", "محتاجاها قبل نهاية الأسبوع لو سمحت."),
            ("agent", "تم تصعيد الشحنة للتوصيل العاجل والمتابعة مستمرة."),
            ("customer", "هل يمكن إرسال التحديث على الإيميل؟"),
            ("agent", "بالتأكيد، سنرسل كل تحديث جديد تلقائياً.")
        ]
    },
    {
        "id": "demo-conversation-06",
        "customer_id": "customer-6",
        "topic": "Login Issue",
        "sentiment": "Neutral",
        "status": "resolved",
        "phone": "+962 79 555 0106",
        "messages": [
            ("customer", "I cannot log in after changing my email address."),
            ("ai", "Please confirm whether you are using the new email on the login page."),
            ("customer", "Yes, but I still receive an invalid account message."),
            ("agent", "I refreshed the account email mapping. Please try again."),
            ("customer", "It works now. Thank you!")
        ]
    },
    {
        "id": "demo-conversation-07",
        "customer_id": "customer-7",
        "topic": "Password Reset",
        "sentiment": "Neutral",
        "status": "resolved",
        "phone": "+1 303 555 0107",
        "messages": [
            ("customer", "My password reset email has not arrived."),
            ("ai", "Please check your spam folder while I verify the email status."),
            ("customer", "It is not in spam either."),
            ("agent", "I sent a fresh secure reset link. It will expire in 30 minutes.")
        ]
    },
    {
        "id": "demo-conversation-08",
        "customer_id": "customer-8",
        "topic": "Payment Failed",
        "sentiment": "Concerned",
        "status": "agent",
        "phone": "+20 109 555 0108",
        "messages": [
            ("customer", "كل مرة أضغط Pay تظهر رسالة Payment Failed."),
            ("ai", "هل تم خصم أي مبلغ من البطاقة؟"),
            ("customer", "لا، وجربت بطاقتين مختلفتين."),
            ("agent", "وجدنا حظراً مؤقتاً من بوابة الدفع وتمت إزالته."),
            ("customer", "سأجرب مرة أخرى الآن، شكراً.")
        ]
    },
    {
        "id": "demo-conversation-09",
        "customer_id": "customer-9",
        "topic": "Charged Twice",
        "sentiment": "Negative",
        "status": "agent",
        "phone": "+1 415 555 0109",
        "messages": [
            ("customer", "My card was charged twice for the same order."),
            ("ai", "I am sorry about the duplicate charge. I will collect the transaction details."),
            ("customer", "Both charges show order ORD-26009."),
            ("agent", "The duplicate payment is confirmed and the reversal has been initiated."),
            ("customer", "When should it appear on my statement?"),
            ("agent", "Most banks post the reversal within three to five business days.")
        ]
    },
    {
        "id": "demo-conversation-10",
        "customer_id": "customer-10",
        "topic": "Update Shipping Address",
        "sentiment": "Neutral",
        "status": "resolved",
        "phone": "+20 110 555 0110",
        "messages": [
            ("customer", "محتاجة أغير Shipping Address قبل خروج الطلب."),
            ("ai", "يمكن تعديل العنوان طالما الطلب لم يُسلّم لشركة الشحن."),
            ("customer", "العنوان الجديد في مدينة نصر بدل المعادي."),
            ("agent", "تم تحديث العنوان وتأكيده في تفاصيل الطلب.")
        ]
    },
    {
        "id": "demo-conversation-11",
        "customer_id": "customer-11",
        "topic": "Cancel Order",
        "sentiment": "Neutral",
        "status": "resolved",
        "phone": "+44 20 5550 0111",
        "messages": [
            ("customer", "I placed an order by mistake and need to cancel it."),
            ("ai", "I can check whether fulfillment has started."),
            ("customer", "The order number is ORD-26011."),
            ("agent", "The order was still processing, so I cancelled it successfully."),
            ("customer", "Great, thank you for confirming.")
        ]
    },
    {
        "id": "demo-conversation-12",
        "customer_id": "customer-12",
        "topic": "Exchange Product",
        "sentiment": "Positive",
        "status": "agent",
        "phone": "+20 111 555 0112",
        "messages": [
            ("customer", "المقاس صغير وعايزة أعمل Exchange لمقاس أكبر."),
            ("ai", "بالطبع. هل المنتج بحالته الأصلية ومعه الملصقات؟"),
            ("customer", "أيوه، لم يتم استخدامه نهائياً."),
            ("agent", "تم حجز المقاس الأكبر وترتيب الاستبدال يوم الثلاثاء."),
            ("customer", "Perfect، الموعد مناسب جداً.")
        ]
    },
    {
        "id": "demo-conversation-13",
        "customer_id": "customer-13",
        "topic": "Invoice Request",
        "sentiment": "Neutral",
        "status": "resolved",
        "phone": "+1 617 555 0113",
        "messages": [
            ("customer", "Could you send a VAT invoice for my business purchase?"),
            ("ai", "Yes. Please confirm the company name and tax registration number."),
            ("customer", "The details are already saved under my billing profile."),
            ("agent", "I generated the invoice and sent it to your registered email.")
        ]
    },
    {
        "id": "demo-conversation-14",
        "customer_id": "customer-14",
        "topic": "Tracking Problem",
        "sentiment": "Concerned",
        "status": "agent",
        "phone": "+20 112 555 0114",
        "messages": [
            ("customer", "رابط الـ Tracking يفتح صفحة فاضية من امبارح."),
            ("ai", "سأتحقق من رقم التتبع لدى شركة الشحن."),
            ("customer", "الرقم TRK-88114 ومحتاج أعرف مكان الشحنة."),
            ("agent", "أرسلت لك رابطاً محدثاً؛ الشحنة حالياً في مركز التوزيع."),
            ("customer", "الرابط الجديد شغال، شكراً.")
        ]
    },
    {
        "id": "demo-conversation-15",
        "customer_id": "customer-15",
        "topic": "Technical Issue",
        "sentiment": "Neutral",
        "status": "agent",
        "phone": "+20 115 555 0115",
        "messages": [
            ("customer", "The mobile app closes whenever I open order history."),
            ("ai", "Please share your phone model and app version."),
            ("customer", "Android 15, app version 3.8.1."),
            ("agent", "This matches a known issue. Please install version 3.8.2 from the store."),
            ("customer", "حدثت الـ App والمشكلة اتحلت. شكراً."),
            ("agent", "Glad it is working. I will keep the ticket open briefly for monitoring.")
        ]
    }
]

TICKET_SPECS = [
    ("Refund for damaged order", "Refund the damaged item after photo verification.", "Refund", "high", "open", "ORD-26001"),
    ("Return label required", "Provide a prepaid label for the approved return.", "General Support", "medium", "pending", "ORD-26001"),
    ("Cracked product replacement", "Replace the item with a cracked outer cover.", "Product Damage", "high", "pending", "ORD-26002"),
    ("Replacement shipment update", "Share the dispatch date for the approved replacement.", "Shipping", "medium", "open", "ORD-26002"),
    ("Incorrect color received", "Exchange the unopened item for the ordered black color.", "General Support", "medium", "resolved", "ORD-26003"),
    ("Pickup confirmation", "Confirm the courier pickup window for the wrong item.", "Shipping", "low", "resolved", "ORD-26003"),
    ("Delivered package missing", "Investigate a shipment marked delivered but not received.", "Shipping", "high", "open", "ORD-26004"),
    ("Carrier proof of delivery", "Request proof of delivery and courier scan details.", "Shipping", "medium", "pending", "ORD-26004"),
    ("Delayed shipment escalation", "Escalate a shipment delayed for five days.", "Shipping", "high", "open", "ORD-26005"),
    ("Tracking notification request", "Email the customer whenever the delayed shipment moves.", "General Support", "low", "pending", "ORD-26005"),
    ("Updated email login failure", "Restore login access after an account email change.", "Account", "high", "resolved", None),
    ("Account email verification", "Verify that the new email is linked to the customer profile.", "Account", "medium", "resolved", None),
    ("Password reset email missing", "Issue a fresh password reset link to the verified email.", "Account", "medium", "resolved", None),
    ("Reset link delivery check", "Confirm successful delivery of the secure reset email.", "Technical", "low", "resolved", None),
    ("Checkout payment failure", "Resolve repeated payment gateway failures on two cards.", "Payment", "high", "open", "ORD-26008"),
    ("Payment gateway review", "Review gateway logs for the customer's failed checkout attempts.", "Technical", "medium", "pending", "ORD-26008"),
    ("Duplicate card charge", "Reverse the second charge posted for the same order.", "Payment", "high", "pending", "ORD-26009"),
    ("Bank reversal timeline", "Provide the expected posting window for the reversal.", "Payment", "low", "open", "ORD-26009"),
    ("Shipping address correction", "Change the destination before carrier handoff.", "Shipping", "high", "resolved", "ORD-26010"),
    ("Address confirmation email", "Send confirmation of the revised delivery address.", "General Support", "low", "resolved", "ORD-26010"),
    ("Order cancellation", "Cancel an order placed by mistake before fulfillment.", "General Support", "medium", "resolved", "ORD-26011"),
    ("Cancellation refund status", "Confirm release of the pending card authorization.", "Refund", "medium", "pending", "ORD-26011"),
    ("Product size exchange", "Exchange the unused item for the next available size.", "General Support", "medium", "open", "ORD-26012"),
    ("Exchange pickup booking", "Arrange courier pickup for the original-size item.", "Shipping", "low", "pending", "ORD-26012"),
    ("VAT invoice request", "Generate a tax invoice using the saved billing profile.", "General Support", "medium", "resolved", "ORD-26013"),
    ("Invoice email delivery", "Confirm the invoice PDF reached the registered email.", "Technical", "low", "resolved", "ORD-26013"),
    ("Broken tracking link", "Replace a blank carrier tracking link with a valid URL.", "Technical", "medium", "open", "ORD-26014"),
    ("Shipment location check", "Confirm the parcel's current distribution center.", "Shipping", "medium", "pending", "ORD-26014"),
    ("Order history app crash", "Resolve the Android crash when order history opens.", "Technical", "high", "open", None),
    ("Mobile update monitoring", "Monitor stability after the customer installs version 3.8.2.", "Technical", "low", "pending", None)
]


def seed_demo_users() -> None:
    password_hash = hash_password(
        DEMO_PASSWORD
    )

    with get_connection() as connection:
        for index, user in enumerate(
            DEMO_USERS
        ):
            created_at = (
                DEMO_START + timedelta(
                    minutes=index
                )
            ).isoformat()

            connection.execute(
                """
                INSERT INTO users (
                    id,
                    name,
                    email,
                    password_hash,
                    role,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    email = excluded.email,
                    password_hash = excluded.password_hash,
                    role = excluded.role,
                    created_at = excluded.created_at
                """,
                (
                    user["id"],
                    user["name"],
                    user["email"],
                    password_hash,
                    user["role"],
                    created_at
                )
            )


def seed_demo_support_data() -> None:
    _validate_demo_data()
    users_by_id = {
        user["id"]: user
        for user in DEMO_USERS
    }

    with get_connection() as connection:
        for index, spec in enumerate(
            CONVERSATION_SPECS
        ):
            customer = users_by_id[
                spec["customer_id"]
            ]
            assigned_agent_id = AGENT_IDS[
                index % len(AGENT_IDS)
            ]
            created_at = (
                DEMO_START + timedelta(
                    days=index * 2
                )
            )
            updated_at = created_at + timedelta(
                minutes=(
                    len(spec["messages"]) - 1
                ) * 7
            )
            order_number = f"ORD-{26001 + index}"

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
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    customer_id = excluded.customer_id,
                    customer_name = excluded.customer_name,
                    customer_email = excluded.customer_email,
                    customer_phone = excluded.customer_phone,
                    status = excluded.status,
                    assigned_agent_id = excluded.assigned_agent_id,
                    crm_json = excluded.crm_json,
                    ai_analysis_json = excluded.ai_analysis_json,
                    created_at = excluded.created_at,
                    updated_at = excluded.updated_at
                """,
                (
                    spec["id"],
                    customer["id"],
                    customer["name"],
                    customer["email"],
                    spec["phone"],
                    spec["status"],
                    assigned_agent_id,
                    json.dumps({
                        "totalOrders": 2 + (index % 6),
                        "totalSpent": round(
                            189.50 + index * 73.25,
                            2
                        ),
                        "lastOrder": order_number
                    }),
                    json.dumps({
                        "intent": spec["topic"],
                        "confidence": round(
                            0.89 + (index % 7) * 0.01,
                            2
                        ),
                        "sentiment": spec["sentiment"],
                        "ragSources": []
                    }),
                    created_at.isoformat(),
                    updated_at.isoformat()
                )
            )

            for message_index, (
                sender,
                message_text
            ) in enumerate(spec["messages"]):
                message_id = (
                    "demo-message-ahmed-1"
                    if index == 0 and message_index == 0
                    else (
                        f"demo-message-{index + 1:02d}-"
                        f"{message_index + 1:02d}"
                    )
                )
                timestamp = created_at + timedelta(
                    minutes=message_index * 7
                )

                connection.execute(
                    """
                    INSERT INTO messages (
                        id,
                        conversation_id,
                        sender,
                        text,
                        timestamp,
                        attachments_json
                    ) VALUES (?, ?, ?, ?, ?, '[]')
                    ON CONFLICT(id) DO UPDATE SET
                        conversation_id = excluded.conversation_id,
                        sender = excluded.sender,
                        text = excluded.text,
                        timestamp = excluded.timestamp,
                        attachments_json = excluded.attachments_json
                    """,
                    (
                        message_id,
                        spec["id"],
                        sender,
                        message_text,
                        timestamp.isoformat()
                    )
                )

        for index, ticket in enumerate(
            TICKET_SPECS
        ):
            conversation_index = index // 2
            conversation = CONVERSATION_SPECS[
                conversation_index
            ]
            customer = users_by_id[
                conversation["customer_id"]
            ]
            assigned_agent_id = AGENT_IDS[
                index % len(AGENT_IDS)
            ]
            ticket_id = f"TK-DEMO-{1001 + index}"
            created_at = DEMO_START + timedelta(
                days=conversation_index * 2 + 1,
                hours=index % 4
            )
            (
                subject,
                description,
                category,
                priority,
                status,
                order_number
            ) = ticket

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
                ON CONFLICT(id) DO UPDATE SET
                    conversation_id = excluded.conversation_id,
                    customer_id = excluded.customer_id,
                    issue_key = excluded.issue_key,
                    subject = excluded.subject,
                    customer = excluded.customer,
                    description = excluded.description,
                    category = excluded.category,
                    priority = excluded.priority,
                    status = excluded.status,
                    assigned_agent_id = excluded.assigned_agent_id,
                    order_number = excluded.order_number,
                    created_at = excluded.created_at,
                    updated_at = excluded.updated_at
                """,
                (
                    ticket_id,
                    conversation["id"],
                    customer["id"],
                    f"demo-issue-{1001 + index}",
                    subject,
                    customer["name"],
                    description,
                    category,
                    priority,
                    status,
                    assigned_agent_id,
                    order_number,
                    created_at.isoformat(),
                    created_at.isoformat()
                )
            )


def _validate_demo_data() -> None:
    role_counts = {
        role: sum(
            user["role"] == role
            for user in DEMO_USERS
        )
        for role in (
            "admin",
            "agent",
            "customer"
        )
    }

    if role_counts != {
        "admin": 2,
        "agent": 5,
        "customer": 15
    }:
        raise ValueError(
            "Demo users must contain 2 admins, "
            "5 agents, and 15 customers."
        )

    if len(CONVERSATION_SPECS) != 15:
        raise ValueError(
            "The demo must contain 15 conversations."
        )

    if len(TICKET_SPECS) != 30:
        raise ValueError(
            "The demo must contain 30 tickets."
        )

    customer_ids = {
        user["id"]
        for user in DEMO_USERS
        if user["role"] == "customer"
    }
    conversation_customer_ids = {
        spec["customer_id"]
        for spec in CONVERSATION_SPECS
    }

    if conversation_customer_ids != customer_ids:
        raise ValueError(
            "Every demo customer must own one conversation."
        )

    if any(
        not 4 <= len(spec["messages"]) <= 10
        for spec in CONVERSATION_SPECS
    ):
        raise ValueError(
            "Demo conversations require 4 to 10 messages."
        )
