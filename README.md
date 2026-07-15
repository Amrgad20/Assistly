# Assistly AI Customer Support Platform

Assistly is a full-stack customer support platform that brings AI-assisted conversations, knowledge retrieval, ticket workflows, CRM data, and role-specific dashboards into one application.

## Features

- AI Customer Support
- RAG Knowledge Base
- Speech Recognition
- Image Analysis
- Ticket Management
- CRM
- Authentication
- Role-Based Authorization
- Real-Time Chat
- WebSocket Synchronization
- Admin Dashboard
- Agent Dashboard
- Customer Dashboard

## Tech Stack

### Frontend

- Angular
- TypeScript
- SCSS

### Backend

- FastAPI
- SQLite
- WebSocket
- JWT
- bcrypt

### AI

- Groq
- FAISS

## Installation

### Prerequisites

- Python 3.12 or newer
- Node.js 20 or newer
- npm

### Backend

From the repository root:

```powershell
cd "Backend (FastAPI)"
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

On macOS or Linux, activate the environment with `source .venv/bin/activate` and copy the environment file with `cp .env.example .env`.

The API is available at `http://127.0.0.1:8000`. Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### Frontend

In a second terminal, from the repository root:

```powershell
cd "Frontend (Angular)"
npm ci
npm start
```

The frontend is available at `http://localhost:4200`.

## Environment Variables

The backend loads configuration from `Backend (FastAPI)/.env`. Copy `.env.example` to `.env`, then replace placeholders with local values. Never commit the `.env` file or real credentials.

| Variable | Purpose |
| --- | --- |
| `APP_NAME` | Application name exposed by the API. |
| `APP_VERSION` | Application version exposed by the API. |
| `DEBUG` | Enables or disables backend debug mode (`true` or `false`). |
| `HOST` | Backend bind host. |
| `PORT` | Backend port. |
| `DATABASE_URL` | SQLite database URL. |
| `ASSISTLY_DB_PATH` | Optional direct override for the SQLite database file path. |
| `GROQ_API_KEY` | API key used by Groq-backed AI services. |
| `JWT_SECRET_KEY` | Secret used to sign authentication tokens. Use a long, random value. |
| `JWT_ALGORITHM` | JWT signing algorithm. |
| `JWT_ACCESS_TOKEN_MINUTES` | Access-token lifetime in minutes. |

## Demo Accounts

Demo users, credentials, seeded statistics, and a suggested walkthrough are documented in [README_DEMO.md](README_DEMO.md).

The published demo credentials are intended only for local demonstration. Replace them before deploying to a shared or public environment.

## Project Structure

```text
Assistly/
|-- Backend (FastAPI)/
|   |-- app/
|   |   |-- api/          # FastAPI route modules
|   |   |-- core/         # Configuration and security
|   |   |-- database/     # SQLite access and demo seed data
|   |   `-- services/     # AI, RAG, CRM, speech, vision, and WebSocket services
|   |-- data/             # Local application data
|   |-- knowledge/        # Knowledge-base source content
|   |-- tests/            # Backend test suite
|   |-- vector_store/     # FAISS index data
|   `-- requirements.txt
|-- Frontend (Angular)/
|   |-- public/            # Static assets
|   |-- src/
|   |   |-- app/           # Angular features, layouts, services, and shared UI
|   |   `-- styles/        # Global styles and theme tokens
|   |-- angular.json
|   `-- package.json
|-- CONTRIBUTING.md
|-- LICENSE
|-- README.md
`-- README_DEMO.md
```

## Screenshots

Screenshots will be added here to highlight the admin, agent, and customer experiences.

## Future Improvements

- Add continuous integration for builds and automated tests.
- Provide containerized local and production deployment options.
- Expand automated coverage and operational observability.
- Add deployment and architecture documentation.

## License

This project is licensed under the [MIT License](LICENSE).

