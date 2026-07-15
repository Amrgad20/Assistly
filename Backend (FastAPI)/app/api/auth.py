import sqlite3
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field

from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password
)
from app.database.database import get_connection


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


@router.post("/register", status_code=201)
def register(request: RegisterRequest):
    user_id = f"customer-{uuid.uuid4().hex[:12]}"
    normalized_email = request.email.lower()

    try:
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO users (
                    id,
                    name,
                    email,
                    password_hash,
                    role,
                    created_at
                ) VALUES (?, ?, ?, ?, 'customer', ?)
                """,
                (
                    user_id,
                    request.name.strip(),
                    normalized_email,
                    hash_password(request.password),
                    datetime.now(
                        timezone.utc
                    ).isoformat()
                )
            )
    except sqlite3.IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        ) from exc

    return {
        "success": True,
        "message": "Account created successfully."
    }


@router.post("/login")
def login(request: LoginRequest):
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT * FROM users
            WHERE lower(email) = lower(?)
            """,
            (request.email,)
        ).fetchone()

    if (
        row is None or
        not verify_password(
            request.password,
            row["password_hash"]
        )
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    user = {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "role": row["role"]
    }

    return {
        "access_token": create_access_token(
            row["id"],
            row["role"]
        ),
        "token_type": "bearer",
        "user": user
    }


@router.get("/me")
def me(
    user: dict = Depends(
        get_current_user
    )
):
    return user
