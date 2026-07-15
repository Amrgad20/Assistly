def detect_intent(message: str) -> str:
    text = message.lower()

    if "refund" in text or "return" in text:
        return "refund_request"

    if "damaged" in text or "broken" in text or "image" in text:
        return "damaged_product"

    if "late" in text or "shipping" in text or "delivery" in text:
        return "shipping_issue"

    if "login" in text or "password" in text:
        return "account_issue"

    return "general_support"


def detect_sentiment(message: str) -> str:
    text = message.lower()

    negative_words = ["angry", "bad", "late", "broken", "problem", "refund", "not working"]

    if any(word in text for word in negative_words):
        return "negative"

    return "neutral"


def should_escalate(intent: str, sentiment: str, confidence: float) -> bool:
    if confidence < 0.6:
        return True

    if sentiment == "negative":
        return True

    if intent in ["refund_request", "damaged_product"]:
        return True

    return False


def process_dialogue(message: str) -> dict:
    intent = detect_intent(message)
    sentiment = detect_sentiment(message)

    confidence = 0.85

    escalate = should_escalate(intent, sentiment, confidence)

    return {
        "intent": intent,
        "sentiment": sentiment,
        "confidence": confidence,
        "escalate": escalate
    }