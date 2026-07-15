from typing import Any

def analyze_image_bytes(file_bytes: bytes) -> dict[str, Any]:
    """
    Analyze an uploaded product image using OpenCV.

    The result is heuristic-based and looks at:
    - image brightness
    - image sharpness
    - edge density
    - long line density that may indicate cracks
    """
    import cv2
    import numpy as np

    image_array = np.frombuffer(file_bytes, dtype=np.uint8)

    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    if image is None:
        raise ValueError("The uploaded file could not be decoded as an image.")

    height, width = image.shape[:2]

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )

    # Average brightness: 0 means black, 255 means white.
    brightness = float(np.mean(gray))

    # Variance of Laplacian is commonly used as a blur indicator.
    sharpness = float(
        cv2.Laplacian(
            gray,
            cv2.CV_64F
        ).var()
    )

    edges = cv2.Canny(
        gray,
        threshold1=70,
        threshold2=160
    )

    edge_pixels = int(np.count_nonzero(edges))

    total_pixels = int(width * height)

    edge_density = (
        edge_pixels / total_pixels
        if total_pixels
        else 0.0
    )

    # Detect prominent straight lines that may represent cracks or breaks.
    lines = cv2.HoughLinesP(
        edges,
        rho=1,
        theta=np.pi / 180,
        threshold=45,
        minLineLength=max(20, min(width, height) // 8),
        maxLineGap=12
    )

    detected_lines = (
        len(lines)
        if lines is not None
        else 0
    )

    is_too_dark = brightness < 45
    is_too_bright = brightness > 225
    is_blurry = sharpness < 70

    damage_score = 0.0

    if edge_density > 0.12:
        damage_score += 0.35

    if detected_lines >= 12:
        damage_score += 0.35
    elif detected_lines >= 6:
        damage_score += 0.20

    if sharpness > 350 and edge_density > 0.08:
        damage_score += 0.20

    if is_too_dark or is_too_bright or is_blurry:
        damage_score -= 0.10

    damage_score = max(
        0.0,
        min(1.0, damage_score)
    )

    possible_damage = damage_score >= 0.45

    if is_too_dark:
        image_quality = "too_dark"
    elif is_too_bright:
        image_quality = "too_bright"
    elif is_blurry:
        image_quality = "blurry"
    else:
        image_quality = "good"

    if possible_damage:
        intent = "damaged_product"
        sentiment = "negative"
        description = (
            "The image contains visual patterns that may indicate "
            "a damaged, cracked, or broken product."
        )
        recommendation = (
            "Please review the image with a support agent and ask "
            "the customer for the order number."
        )
    else:
        intent = "image_review"
        sentiment = "neutral"
        description = (
            "No strong visual indicators of product damage were detected."
        )
        recommendation = (
            "A support agent may review the image manually if the customer "
            "still reports a problem."
        )

    confidence = round(
        0.55 + abs(damage_score - 0.45),
        2
    )

    confidence = min(
        confidence,
        0.95
    )

    return {
        "intent": intent,
        "sentiment": sentiment,
        "confidence": confidence,
        "possible_damage": possible_damage,
        "damage_score": round(damage_score, 3),
        "description": description,
        "recommendation": recommendation,
        "image": {
            "width": width,
            "height": height,
            "quality": image_quality,
            "brightness": round(brightness, 2),
            "sharpness": round(sharpness, 2),
            "edge_density": round(edge_density, 4),
            "detected_lines": detected_lines
        }
    }
