from datetime import datetime, timedelta, timezone
from typing import Callable

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError

from app.core.config import settings
from app.database.database import get_connection


bearer_scheme = HTTPBearer(
    auto_error=False
)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(
    password: str,
    password_hash: str
) -> bool:
    try:
        return bcrypt.checkpw(
            password.encode("utf-8"),
            password_hash.encode("utf-8")
        )
    except ValueError:
        return False


def create_access_token(
    user_id: str,
    role: str
) -> str:
    now = datetime.now(
        timezone.utc
    )

    payload = {
        "sub": user_id,
        "role": role,
        "iat": now,
        "exp": now + timedelta(
            minutes=(
                settings
                .JWT_ACCESS_TOKEN_MINUTES
            )
        )
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )


def decode_access_token(
    token: str
) -> dict:
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[
                settings.JWT_ALGORITHM
            ]
        )
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token."
        ) from exc


def get_current_user(
    credentials:
        HTTPAuthorizationCredentials | None =
        Depends(bearer_scheme)
) -> dict:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is required."
        )

    payload = decode_access_token(
        credentials.credentials
    )

    user_id = payload.get("sub")

    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT id, name, email, role
            FROM users
            WHERE id = ?
            """,
            (user_id,)
        ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The authenticated user no longer exists."
        )

    return dict(row)


def require_roles(
    *roles: str
) -> Callable:
    def role_dependency(
        user: dict = Depends(
            get_current_user
        )
    ) -> dict:
        if user["role"] not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource."
            )

        return user

    return role_dependency
