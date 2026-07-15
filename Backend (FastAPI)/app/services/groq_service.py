from app.core.config import settings


def ask_groq(
    question: str,
    knowledge_context: str,
    crm_context: str,
    conversation_history: list[
        dict
    ] | None = None
) -> str:

    try:

        if not settings.GROQ_API_KEY:
            return (
                "Groq Error: "
                "GROQ_API_KEY is missing."
            )

        from groq import Groq

        client = Groq(
            api_key=settings.GROQ_API_KEY
        )

        system_prompt = """
You are Assistly AI, a professional customer support assistant.

Use the conversation history to understand references such as:
- it
- that order
- the previous problem
- المنتج
- الطلب
- المشكلة السابقة

Rules:
1. Do not invent information.
2. Use CRM data only when relevant.
3. Use Knowledge Base policies for policy questions.
4. Follow the existing conversation context.
5. If information is unavailable, clearly say so.
6. Reply in the same language used by the customer.
7. Support Arabic, English, and mixed Arabic-English messages.
8. Do not expose private internal notes.
9. Keep responses clear and professional.
"""

        context_message = f"""
Knowledge Base Context:
{knowledge_context}

CRM Customer Context:
{crm_context}
"""

        messages: list[dict] = [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "system",
                "content": context_message
            }
        ]

        for item in (
            conversation_history or []
        )[-12:]:

            role = item.get(
                "role",
                "customer"
            )

            content = str(
                item.get(
                    "content",
                    ""
                )
            ).strip()

            if not content:
                continue

            groq_role = (
                "user"
                if role == "customer"
                else "assistant"
            )

            messages.append({
                "role": groq_role,
                "content": content
            })

        messages.append({
            "role": "user",
            "content": question
        })

        response = (
            client.chat.completions.create(
                model=(
                    "llama-3.3-70b-versatile"
                ),
                messages=messages,
                temperature=0.3,
                max_tokens=600
            )
        )

        answer = (
            response
            .choices[0]
            .message
            .content
        )

        return (
            answer or
            "No response was generated."
        )

    except Exception as error:

        return (
            f"Groq Error: {str(error)}"
        )
