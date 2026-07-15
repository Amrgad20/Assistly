from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    ai,
    auth,
    conversations,
    crm,
    knowledge,
    speech,
    tickets,
    vision
)
from app.core.config import settings
from app.database.database import init_database
from app.database.seed import (
    seed_demo_support_data,
    seed_demo_users
)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai.router)
app.include_router(knowledge.router)
app.include_router(speech.router)
app.include_router(vision.router)
app.include_router(conversations.router)
app.include_router(tickets.router)
app.include_router(auth.router)
app.include_router(crm.router)


@app.on_event("startup")
def initialize_application():
    init_database()
    seed_demo_users()
    seed_demo_support_data()


@app.get("/")
def root():
    return {
        "project": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }
