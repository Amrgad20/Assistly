import re
from pathlib import Path
from tempfile import NamedTemporaryFile

from app.core.config import settings


_model = None


SUPPORT_VOCABULARY = (
    "order",
    "refund",
    "replacement",
    "damaged",
    "shipping",
    "tracking",
    "ticket",
    "agent",
    "customer",
    "product",
    "account",
    "password",
    "delivery"
)


CODE_SWITCHING_PROMPT = """
Transcribe the speaker exactly as spoken. The audio may switch between
Arabic and English within the same sentence. Preserve Arabic speech in
Arabic script and clearly spoken English terms in English script. Common
customer-support vocabulary includes: order, refund, replacement, damaged,
shipping, tracking, ticket, agent, customer, product, account, password,
and delivery. Example: النهارده وصلني الـ order وكان مكسور محتاج أعمله refund.
Do not translate, paraphrase, or add words.
""".strip()


ARABIC_SUPPORT_TERMS = {
    "الأوردر": "الـ order",
    "الاوردر": "الـ order",
    "أوردر": "order",
    "اوردر": "order",
    "الريفند": "الـ refund",
    "ريفند": "refund",
    "الريبليسمنت": "الـ replacement",
    "ريبليسمنت": "replacement",
    "الدامجد": "الـ damaged",
    "دامجد": "damaged",
    "الشيبنج": "الـ shipping",
    "شيبنج": "shipping",
    "التراكينج": "الـ tracking",
    "تراكينج": "tracking",
    "التيكت": "الـ ticket",
    "تيكت": "ticket",
    "الإيجنت": "الـ agent",
    "الايجنت": "الـ agent",
    "إيجنت": "agent",
    "ايجنت": "agent",
    "الكاستمر": "الـ customer",
    "كاستمر": "customer",
    "البرودكت": "الـ product",
    "برودكت": "product",
    "الأكونت": "الـ account",
    "الاكونت": "الـ account",
    "أكونت": "account",
    "اكونت": "account",
    "الباسورد": "الـ password",
    "باسورد": "password",
    "الديليفري": "الـ delivery",
    "ديليفري": "delivery"
}


def get_speech_model():
    global _model

    if _model is None:
        from faster_whisper import WhisperModel

        _model = WhisperModel(
            "medium",
            device="cpu",
            compute_type="int8"
        )

    return _model


def transcribe_audio(
    file_bytes: bytes,
    suffix: str = ".webm"
) -> dict:
    if not file_bytes:
        raise ValueError(
            "The uploaded audio file is empty."
        )

    model = get_speech_model()

    with NamedTemporaryFile(
        delete=False,
        suffix=suffix
    ) as temp_file:
        temp_file.write(file_bytes)
        temp_path = Path(temp_file.name)

    try:
        segments, info = model.transcribe(
            str(temp_path),
            language=None,
            task="transcribe",
            beam_size=5,
            best_of=5,
            patience=1.2,
            temperature=0.0,
            compression_ratio_threshold=2.4,
            log_prob_threshold=-1.0,
            no_speech_threshold=0.6,
            vad_filter=True,
            vad_parameters={
                "min_silence_duration_ms": 350,
                "speech_pad_ms": 250
            },
            initial_prompt=CODE_SWITCHING_PROMPT,
            hotwords=", ".join(
                SUPPORT_VOCABULARY
            ),
            multilingual=True,
            language_detection_threshold=0.5,
            language_detection_segments=2,
            condition_on_previous_text=False
        )

        segment_list = list(segments)
        raw_text = " ".join(
            segment.text.strip()
            for segment in segment_list
            if segment.text.strip()
        ).strip()

        corrected_text = correct_transcription(
            raw_text
        )

        probability = getattr(
            info,
            "language_probability",
            0.0
        ) or 0.0

        return {
            "raw_text": raw_text,
            "corrected_text": corrected_text,
            "detected_language": (
                getattr(
                    info,
                    "language",
                    None
                ) or "unknown"
            ),
            "language_probability": round(
                probability,
                4
            ),
            "segments": [
                {
                    "start": round(
                        segment.start,
                        2
                    ),
                    "end": round(
                        segment.end,
                        2
                    ),
                    "text": segment.text.strip()
                }
                for segment in segment_list
            ]
        }

    finally:
        if temp_path.exists():
            temp_path.unlink()


def correct_transcription(
    raw_text: str
) -> str:
    """Restore only known support loanwords without rewriting the sentence.

    Mixed-language acoustic recognition cannot be guaranteed at 100% accuracy.
    Any failed or unsafe correction falls back to Whisper's original text.
    """
    if not raw_text:
        return raw_text

    try:
        corrected = _restore_support_terms(
            raw_text
        )
    except Exception:
        return raw_text

    if (
        not settings.GROQ_API_KEY or
        corrected == raw_text or
        not _contains_arabic(raw_text)
    ):
        return corrected

    try:
        candidate = _correct_with_groq(
            raw_text,
            corrected
        )

        if _is_safe_correction(
            raw_text,
            candidate
        ):
            return _normalize_spacing(
                candidate
            )
    except Exception:
        pass

    return corrected


def _restore_support_terms(
    text: str
) -> str:
    corrected = text

    for arabic_term in sorted(
        ARABIC_SUPPORT_TERMS,
        key=len,
        reverse=True
    ):
        english_term = ARABIC_SUPPORT_TERMS[
            arabic_term
        ]
        corrected = re.sub(
            (
                r"(?<![\w\u0640])" +
                re.escape(arabic_term) +
                r"(?![\w\u0640])"
            ),
            english_term,
            corrected
        )

    return _normalize_spacing(corrected)


def _normalize_spacing(text: str) -> str:
    normalized = re.sub(
        r"\s+",
        " ",
        text
    ).strip()

    return re.sub(
        r"\s+([،,.!?؟:;])",
        r"\1",
        normalized
    )


def _correct_with_groq(
    raw_text: str,
    deterministic_text: str
) -> str:
    from groq import Groq

    client = Groq(
        api_key=settings.GROQ_API_KEY
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "You correct mixed Arabic-English speech transcripts. "
                    "Only restore clearly transliterated English customer-"
                    "support terms to English script. Preserve every other "
                    "word, its order, and punctuation. Never translate, "
                    "paraphrase, explain, or invent words. Return only the "
                    "corrected transcript."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Whisper text: {raw_text}\n"
                    f"Safe baseline: {deterministic_text}"
                )
            }
        ],
        temperature=0,
        max_tokens=250
    )

    content = (
        response.choices[0].message.content or ""
    ).strip()

    return content.strip("\"'")


def _is_safe_correction(
    raw_text: str,
    candidate: str
) -> bool:
    if not candidate:
        return False

    return (
        _canonicalize_support_terms(raw_text) ==
        _canonicalize_support_terms(candidate)
    )


def _canonicalize_support_terms(
    text: str
) -> str:
    canonical = _restore_support_terms(text)

    for term in SUPPORT_VOCABULARY:
        canonical = re.sub(
            rf"(?<!\w){re.escape(term)}(?!\w)",
            f"{{{{{term}}}}}",
            canonical,
            flags=re.IGNORECASE
        )

    return _normalize_spacing(canonical)


def _contains_arabic(text: str) -> bool:
    return bool(
        re.search(
            r"[\u0600-\u06FF]",
            text
        )
    )
