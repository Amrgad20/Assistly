# Contributing to Assistly

Thank you for helping improve Assistly. Keep contributions focused, documented, and easy to review.

## Setup

1. Fork the repository and clone your fork.
2. Create and activate a Python virtual environment in `Backend (FastAPI)`.
3. Install backend dependencies with `python -m pip install -r requirements.txt`.
4. Copy `Backend (FastAPI)/.env.example` to `.env` and add local-only values.
5. Install frontend dependencies in `Frontend (Angular)` with `npm ci`.
6. Run the backend tests and frontend checks before opening a pull request.

See [README.md](README.md) for the complete local startup instructions.

## Branch Naming

Use a short, descriptive branch name with one of these prefixes:

- `feature/<description>` for new functionality
- `fix/<description>` for bug fixes
- `docs/<description>` for documentation
- `chore/<description>` for maintenance
- `test/<description>` for test changes

Use lowercase words separated by hyphens, for example `docs/improve-installation-guide`.

## Pull Request Process

1. Keep each pull request limited to one clear purpose.
2. Explain what changed, why it changed, and how it was verified.
3. Add or update tests when behavior changes.
4. Confirm the Angular production build, TypeScript compilation, FastAPI import, and backend tests pass.
5. Do not commit `.env` files, credentials, generated output, dependency directories, or local editor settings.
6. Update documentation when setup, configuration, or public behavior changes.
7. Address review feedback and keep the branch current before merge.

## Coding Style

### Python

- Follow PEP 8 and the existing FastAPI project structure.
- Use clear names and type hints where they improve readability.
- Keep route handlers thin and place reusable work in the appropriate service.
- Avoid unrelated refactoring in focused changes.

### Angular and TypeScript

- Follow the existing standalone-component and feature-folder conventions.
- Keep TypeScript strict-mode compatible.
- Use the repository's Prettier settings and existing naming patterns.
- Keep templates, component styles, and component logic together.

### General

- Write concise comments that explain intent rather than restating the code.
- Remove unused imports and temporary debugging output.
- Never include secrets, personal data, or production credentials.

