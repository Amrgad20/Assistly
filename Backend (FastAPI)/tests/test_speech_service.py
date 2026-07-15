from app.services import speech_service


class _FakeSegment:
    start = 0.0
    end = 1.25
    text = "الأوردر محتاج ريفند"


class _FakeInfo:
    language = "ar"
    language_probability = 0.91


class _FakeModel:
    def __init__(self):
        self.options = {}

    def transcribe(self, _path, **options):
        self.options = options
        return iter([_FakeSegment()]), _FakeInfo()


def _disable_groq(monkeypatch):
    monkeypatch.setattr(
        speech_service.settings,
        "GROQ_API_KEY",
        ""
    )


def test_restores_mixed_support_terms(
    monkeypatch
):
    _disable_groq(monkeypatch)

    result = speech_service.correct_transcription(
        "الأوردر بتاعي وصل مكسور ومحتاج ريفند"
    )

    assert result == (
        "الـ order بتاعي وصل مكسور ومحتاج refund"
    )


def test_preserves_fully_arabic_sentence(
    monkeypatch
):
    _disable_groq(monkeypatch)
    text = "الطلب بتاعي وصل مكسور ومحتاج استرجاع"

    assert (
        speech_service.correct_transcription(text) ==
        text
    )


def test_preserves_fully_english_sentence(
    monkeypatch
):
    _disable_groq(monkeypatch)
    text = "My order arrived damaged and I need a refund."

    assert (
        speech_service.correct_transcription(text) ==
        text
    )


def test_does_not_replace_unrelated_arabic_words(
    monkeypatch
):
    _disable_groq(monkeypatch)
    text = "الأوراق بتاعتي وصلت مع المنتج"

    assert (
        speech_service.correct_transcription(text) ==
        text
    )


def test_returns_original_when_correction_fails(
    monkeypatch
):
    _disable_groq(monkeypatch)
    text = "الأوردر وصل"

    def fail_correction(_text: str) -> str:
        raise RuntimeError("correction failed")

    monkeypatch.setattr(
        speech_service,
        "_restore_support_terms",
        fail_correction
    )

    assert (
        speech_service.correct_transcription(text) ==
        text
    )


def test_transcription_uses_multilingual_contract(
    monkeypatch
):
    _disable_groq(monkeypatch)
    model = _FakeModel()
    monkeypatch.setattr(
        speech_service,
        "get_speech_model",
        lambda: model
    )

    result = speech_service.transcribe_audio(
        b"fake audio",
        suffix=".webm"
    )

    assert model.options["language"] is None
    assert model.options["multilingual"] is True
    assert "order" in model.options["initial_prompt"]
    assert result == {
        "raw_text": "الأوردر محتاج ريفند",
        "corrected_text": "الـ order محتاج refund",
        "detected_language": "ar",
        "language_probability": 0.91,
        "segments": [
            {
                "start": 0.0,
                "end": 1.25,
                "text": "الأوردر محتاج ريفند"
            }
        ]
    }
