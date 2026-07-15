from fastapi import WebSocket


class ConversationConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict[
            WebSocket,
            dict
        ] = {}

    async def connect(
        self,
        websocket: WebSocket,
        user: dict
    ) -> None:
        await websocket.accept()
        self.active_connections[
            websocket
        ] = user

    def disconnect(
        self,
        websocket: WebSocket
    ) -> None:
        self.active_connections.pop(
            websocket,
            None
        )

    async def broadcast_conversation(
        self,
        conversation: dict
    ) -> None:
        stale_connections = []

        for websocket, user in list(
            self.active_connections.items()
        ):
            if not self._can_receive(
                user,
                conversation
            ):
                continue

            try:
                await websocket.send_json({
                    "type": "conversation-updated",
                    "conversation": conversation
                })
            except Exception:
                stale_connections.append(
                    websocket
                )

        for websocket in stale_connections:
            self.disconnect(websocket)

    @staticmethod
    def _can_receive(
        user: dict,
        conversation: dict
    ) -> bool:
        if user["role"] == "admin":
            return True

        if user["role"] == "agent":
            return (
                conversation.get(
                    "assignedAgentId"
                ) == user["id"]
            )

        return (
            conversation.get(
                "customer",
                {}
            ).get("id") == user["id"]
        )


conversation_manager = (
    ConversationConnectionManager()
)
