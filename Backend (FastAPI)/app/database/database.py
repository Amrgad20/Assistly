import os
import sqlite3
from pathlib import Path

from app.core.config import settings


BASE_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE_PATH = BASE_DIR / "data" / "assistly.db"


def get_database_path() -> Path:
    explicit_path = os.getenv(
        "ASSISTLY_DB_PATH"
    )

    if explicit_path:
        return Path(explicit_path)

    if settings.DATABASE_URL.startswith(
        "sqlite:///"
    ):
        return Path(
            settings.DATABASE_URL.removeprefix(
                "sqlite:///"
            )
        )

    return DEFAULT_DATABASE_PATH


def get_connection() -> sqlite3.Connection:
    database_path = get_database_path()
    database_path.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    connection = sqlite3.connect(
        database_path,
        timeout=10,
        check_same_thread=False
    )
    connection.row_factory = sqlite3.Row
    connection.execute(
        "PRAGMA foreign_keys = ON"
    )
    return connection


def init_database() -> None:
    with get_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK (
                    role IN ('admin', 'agent', 'customer')
                ),
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                customer_id TEXT NOT NULL,
                customer_name TEXT NOT NULL,
                customer_email TEXT NOT NULL DEFAULT '',
                customer_phone TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'ai' CHECK (
                    status IN ('ai', 'agent', 'resolved')
                ),
                assigned_agent_id TEXT,
                crm_json TEXT NOT NULL DEFAULT '{}',
                ai_analysis_json TEXT NOT NULL DEFAULT '{}',
                ticket_json TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                sender TEXT NOT NULL CHECK (
                    sender IN ('customer', 'agent', 'ai')
                ),
                text TEXT NOT NULL DEFAULT '',
                timestamp TEXT NOT NULL,
                attachments_json TEXT NOT NULL DEFAULT '[]',
                FOREIGN KEY (conversation_id)
                    REFERENCES conversations(id)
                    ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS
                idx_messages_conversation_timestamp
                ON messages(conversation_id, timestamp);

            CREATE TABLE IF NOT EXISTS tickets (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                customer_id TEXT NOT NULL DEFAULT '',
                issue_key TEXT NOT NULL,
                subject TEXT NOT NULL,
                customer TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                priority TEXT NOT NULL,
                status TEXT NOT NULL,
                assigned_agent_id TEXT NOT NULL,
                order_number TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE (conversation_id, issue_key)
            );
            """
        )

        ticket_columns = {
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(tickets)"
            ).fetchall()
        }

        if "customer_id" not in ticket_columns:
            connection.execute(
                """
                ALTER TABLE tickets
                ADD COLUMN customer_id TEXT NOT NULL DEFAULT ''
                """
            )

        connection.executescript(
            """
            UPDATE tickets
            SET customer_id = COALESCE(
                (
                    SELECT users.id
                    FROM users
                    WHERE users.role = 'customer'
                      AND lower(users.name) = lower(tickets.customer)
                    LIMIT 1
                ),
                (
                    SELECT conversations.customer_id
                    FROM conversations
                    WHERE conversations.id = tickets.conversation_id
                ),
                ''
            )
            WHERE customer_id = '';

            CREATE INDEX IF NOT EXISTS
                idx_conversations_customer_updated
                ON conversations(customer_id, updated_at);

            CREATE INDEX IF NOT EXISTS
                idx_conversations_agent_updated
                ON conversations(assigned_agent_id, updated_at);

            CREATE INDEX IF NOT EXISTS
                idx_tickets_customer_created
                ON tickets(customer_id, created_at);

            CREATE INDEX IF NOT EXISTS
                idx_tickets_agent_created
                ON tickets(assigned_agent_id, created_at);
            """
        )
