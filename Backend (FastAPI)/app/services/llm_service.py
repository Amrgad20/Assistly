from app.services.groq_service import ask_groq


def generate_ai_reply(
    message: str,
    analysis: dict,
    rag_result: dict | None = None,
    crm_context: str = (
        "No CRM customer data was found."
    ),
    conversation_history: list[
        dict
    ] | None = None
) -> str:

    knowledge_context = (
        "No relevant knowledge base "
        "information was found."
    )

    if (
        rag_result and
        rag_result.get("used_rag")
    ):
        knowledge_context = "\n\n".join(
            rag_result.get(
                "sources",
                []
            )
        )

    return ask_groq(
        question=message,
        knowledge_context=knowledge_context,
        crm_context=crm_context,
        conversation_history=(
            conversation_history or []
        )
    )