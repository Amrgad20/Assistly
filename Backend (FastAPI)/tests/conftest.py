import os
import sys
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


TEST_DATABASE = (
    Path(tempfile.mkdtemp()) /
    "assistly-test.db"
)

PROJECT_ROOT = Path(
    __file__
).resolve().parents[1]

sys.path.insert(
    0,
    str(PROJECT_ROOT)
)

os.environ["ASSISTLY_DB_PATH"] = str(
    TEST_DATABASE
)
os.environ.pop("DEBUG", None)

from app.main import app  # noqa: E402


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def login_token(
    client: TestClient,
    email: str,
    password: str
) -> str:
    response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password
        }
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture()
def admin_headers(client):
    token = login_token(
        client,
        "admin@assistly.ai",
        "12345678"
    )
    return {
        "Authorization": f"Bearer {token}"
    }


@pytest.fixture()
def customer_headers(client):
    token = login_token(
        client,
        "customer@assistly.ai",
        "12345678"
    )
    return {
        "Authorization": f"Bearer {token}"
    }


@pytest.fixture()
def agent_headers(client):
    token = login_token(
        client,
        "agent@assistly.ai",
        "12345678"
    )
    return {
        "Authorization": f"Bearer {token}"
    }
