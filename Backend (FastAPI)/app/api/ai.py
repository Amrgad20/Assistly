from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.services.crm_service import (
    build_customer_context,
    format_crm_context
)
from app.services.dialogue_manager import process_dialogue
from app.services.llm_service import generate_ai_reply
from app.services.rag_service import answer_with_rag
from app.core.security import require_roles


router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


class ConversationMessage(BaseModel):
    role: Literal[
        "customer",
        "ai",
        "agent"
    ]

    content: str = Field(
        min_length=1,
        max_length=5000
    )


class ChatRequest(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=5000
    )

    conversation_history: list[
        ConversationMessage
    ] = Field(
        default_factory=list,
        max_length=20
    )


@router.post("/chat")
def chat(
    request: ChatRequest,
    user: dict = Depends(
        require_roles("customer")
    )
):

    analysis = process_dialogue(
        request.message
    )

    rag_result = answer_with_rag(
        request.message
    )

    crm_data = build_customer_context(
        customer_id=user["id"],
        email=user["email"]
    )

    crm_context = format_crm_context(
        crm_data
    )

    conversation_history = [
        {
            "role": item.role,
            "content": item.content
        }
        for item in request.conversation_history[-12:]
    ]

    reply = generate_ai_reply(
        message=request.message,
        analysis=analysis,
        rag_result=rag_result,
        crm_context=crm_context,
        conversation_history=conversation_history
    )

    return {
        "message": request.message,
        "reply": reply,
        "analysis": analysis,
        "memory": {
            "messages_used": len(
                conversation_history
            )
        },
        "rag": {
            "used_rag": rag_result.get(
                "used_rag",
                False
            ),
            "sources": rag_result.get(
                "sources",
                []
            )
        },
        "crm": {
            "customer_found": crm_data.get(
                "found",
                False
            ),
            "customer": crm_data.get(
                "customer"
            ),
            "latest_order": crm_data.get(
                "latest_order"
            ),
            "open_tickets": crm_data.get(
                "open_tickets",
                []
            )
        }
    }
