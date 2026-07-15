from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    APP_NAME: str = "Assistly"

    APP_VERSION: str = "1.0.0"

    DEBUG: bool = True

    HOST: str = "127.0.0.1"

    PORT: int = 8000

    DATABASE_URL: str = ""

    GROQ_API_KEY: str = ""

    JWT_SECRET_KEY: str = (
        "assistly-demo-change-this-secret"
    )

    JWT_ALGORITHM: str = "HS256"

    JWT_ACCESS_TOKEN_MINUTES: int = 480

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
