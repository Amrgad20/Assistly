import hashlib
import json
import re
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import List

BASE_DIR = Path(__file__).resolve().parents[2]
KNOWLEDGE_DIR = BASE_DIR / "knowledge"
VECTOR_DIR = BASE_DIR / "vector_store"

INDEX_PATH = VECTOR_DIR / "assistly.index"
CHUNKS_PATH = VECTOR_DIR / "chunks.txt"
UPLOADS_PATH = KNOWLEDGE_DIR / "uploads.json"

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

_model: object | None = None
_model_lock = threading.Lock()
_index_lock = threading.Lock()


class DuplicateDocumentError(ValueError):
    pass


def get_embedding_model():
    global _model

    if _model is None:
        with _model_lock:
            if _model is None:
                from sentence_transformers import (
                    SentenceTransformer
                )

                _model = SentenceTransformer(MODEL_NAME)

    return _model


def read_pdf(path: Path) -> str:
    from pypdf import PdfReader

    text = ""
    reader = PdfReader(str(path))

    for page in reader.pages:
        text += page.extract_text() or ""

    return text


def read_txt(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def load_documents() -> str:
    KNOWLEDGE_DIR.mkdir(exist_ok=True)

    content = ""

    for file in KNOWLEDGE_DIR.iterdir():

        if file.suffix.lower() == ".pdf":
            content += read_pdf(file) + "\n"

        elif file.suffix.lower() == ".txt":
            content += read_txt(file) + "\n"

    return content


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap

    return [chunk.strip() for chunk in chunks if chunk.strip()]


def rebuild_index() -> dict:
    with _index_lock:
        return _rebuild_index()


def _rebuild_index() -> dict:
    import faiss
    import numpy as np

    VECTOR_DIR.mkdir(exist_ok=True)

    text = load_documents()

    if not text.strip():
        return {
            "status": "empty",
            "message": "No knowledge documents found."
        }

    chunks = chunk_text(text)

    embeddings = get_embedding_model().encode(chunks)
    embeddings = np.array(embeddings).astype("float32")

    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)

    faiss.write_index(index, str(INDEX_PATH))

    CHUNKS_PATH.write_text(
        "\n---CHUNK---\n".join(chunks),
        encoding="utf-8"
    )

    return {
        "status": "success",
        "chunks": len(chunks)
    }


def search_knowledge(question: str, top_k: int = 3) -> List[str]:
    import faiss
    import numpy as np

    if not INDEX_PATH.exists() or not CHUNKS_PATH.exists():
        rebuild_index()

    if not INDEX_PATH.exists():
        return []

    index = faiss.read_index(str(INDEX_PATH))

    chunks = CHUNKS_PATH.read_text(encoding="utf-8").split("\n---CHUNK---\n")

    question_embedding = get_embedding_model().encode([question])
    question_embedding = np.array(question_embedding).astype("float32")

    distances, indices = index.search(question_embedding, top_k)

    results = []

    for index_id in indices[0]:
        if 0 <= index_id < len(chunks):
            results.append(chunks[index_id])

    return results


def answer_with_rag(question: str) -> dict:
    contexts = search_knowledge(question)

    if not contexts:
        return {
            "question": question,
            "answer": "I could not find relevant information in the knowledge base.",
            "sources": [],
            "used_rag": False
        }

    context_text = "\n\n".join(contexts)

    answer = (
        "Based on the knowledge base, here is the most relevant information:\n\n"
        f"{context_text[:1200]}"
    )

    return {
        "question": question,
        "answer": answer,
        "sources": contexts,
        "used_rag": True
    }


def add_document(filename: str, content: bytes) -> dict:
    KNOWLEDGE_DIR.mkdir(exist_ok=True)

    original_name = Path(filename).name.strip()
    suffix = Path(original_name).suffix.lower()

    if not original_name or suffix not in {".pdf", ".txt"}:
        raise ValueError("Only PDF and TXT files are supported.")

    content_hash = hashlib.sha256(content).hexdigest()
    uploads = _load_uploads()

    normalized_name = original_name.casefold()

    existing_documents = [
        path
        for path in KNOWLEDGE_DIR.iterdir()
        if path.is_file()
        and path.suffix.lower() in {".pdf", ".txt"}
    ]

    if any(
        item.get("filename", "").casefold() == normalized_name
        or item.get("content_hash") == content_hash
        for item in uploads
    ) or any(
        path.name.casefold() == normalized_name
        or hashlib.sha256(
            path.read_bytes()
        ).hexdigest() == content_hash
        for path in existing_documents
    ):
        raise DuplicateDocumentError(
            "A document with the same filename or content already exists."
        )

    document_id = content_hash[:16]
    safe_stem = re.sub(
        r"[^A-Za-z0-9_-]+",
        "-",
        Path(original_name).stem
    ).strip("-") or "document"

    stored_path = KNOWLEDGE_DIR / (
        f"{safe_stem}-{document_id}{suffix}"
    )

    stored_path.write_bytes(content)

    try:
        extracted_text = (
            read_pdf(stored_path)
            if suffix == ".pdf"
            else read_txt(stored_path)
        )
    except Exception:
        stored_path.unlink(missing_ok=True)
        raise ValueError(
            "The uploaded document could not be read."
        )

    if not extracted_text.strip():
        stored_path.unlink(missing_ok=True)
        raise ValueError(
            "The uploaded document does not contain extractable text."
        )

    document_chunks = chunk_text(extracted_text)

    uploads.append({
        "document_id": document_id,
        "filename": original_name,
        "stored_name": stored_path.name,
        "content_hash": content_hash,
        "chunks": len(document_chunks),
        "uploaded_at": datetime.now(
            timezone.utc
        ).isoformat()
    })

    _save_uploads(uploads)

    try:
        rebuild_index()
    except Exception:
        uploads.pop()
        _save_uploads(uploads)
        stored_path.unlink(missing_ok=True)
        raise

    return {
        "filename": original_name,
        "document_id": document_id,
        "chunks": len(document_chunks),
        "status": "success"
    }


def _load_uploads() -> list[dict]:
    if not UPLOADS_PATH.exists():
        return []

    try:
        data = json.loads(
            UPLOADS_PATH.read_text(
                encoding="utf-8"
            )
        )
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def _save_uploads(uploads: list[dict]) -> None:
    UPLOADS_PATH.write_text(
        json.dumps(
            uploads,
            ensure_ascii=False,
            indent=2
        ),
        encoding="utf-8"
    )
