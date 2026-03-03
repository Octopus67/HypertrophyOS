---
inclusion: always
---

# Repwise — Agent Steering Guide

> This is the master steering file for AI agents working on the Repwise codebase.
> Read this FIRST, then drill into specific docs as needed.

## What Is Repwise?

A full-stack fitness platform for serious lifters. Adaptive nutrition tracking, intelligent training logging with Weekly Net Stimulus (WNS) volume tracking, evidence-based coaching, and micronutrient analysis.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python 3.12), SQLAlchemy async, PostgreSQL (prod) / SQLite (dev) |
| Frontend | React Native (Expo SDK 55), TypeScript, Zustand, React Navigation |
| Auth | JWT (access + refresh tokens), OAuth (Google, Apple) |
| Payments | Stripe + Razorpay, freemium gating |
| Monitoring | Sentry |
| Testing | pytest + Hypothesis (backend), Jest + fast-check (frontend) |

## Project Structure

```
/Users/manavmht/Documents/HOS/
├── src/                    # Backend (FastAPI)
│   ├── main.py             # App entry point, router registration
│   ├── config/             # Settings, database config
│   ├── modules/            # 25 feature modules (see below)
│   ├── middleware/          # Auth, freemium gate, logging
│   ├── shared/             # Base models, errors, pagination, soft delete
│   └── database/           # Alembic migrations
├── app/                    # Frontend (React Native)
│   ├── App.tsx             # Root component, auth flow
│   ├── navigation/         # BottomTabNavigator with 4 tabs
│   ├── screens/            # 17 screen directories
│   ├── components/         # 20 component categories
│   ├── hooks/              # 11 custom hooks
│   ├── utils/              # 70+ utility modules
│   ├── store/              # Zustand state management
│   ├── types/              # TypeScript type definitions
│   ├── services/           # API client (axios)
│   └── theme/              # Design tokens
├── tests/                  # Backend tests (pytest)
├── scripts/                # Seed scripts, data imports
├── docs/                   # Design docs, plans
├── static/                 # Exercise images
└── data/                   # USDA/OFF cache
```

## Detailed Documentation (drill into these)

| Doc | When to Read | Path |
|-----|-------------|------|
| **Backend Architecture** | Modifying any backend module | `.kiro/steering/backend-architecture.md` |
| **Frontend Architecture** | Modifying any frontend component | `.kiro/steering/frontend-architecture.md` |
| **API Reference** | Adding/modifying endpoints | `.kiro/steering/api-reference.md` |
| **Testing Guide** | Writing or running tests | `.kiro/steering/testing-guide.md` |
| **Key Algorithms** | WNS, fatigue, adaptive engine | `.kiro/steering/algorithms.md` |

## Critical Patterns to Follow

### Backend Module Pattern
Every module in `src/modules/<name>/` follows:
```
router.py      → FastAPI endpoints
models.py      → SQLAlchemy ORM models
schemas.py     → Pydantic request/response validation
service.py     → Business logic (async, takes AsyncSession)
```

### Frontend Component Pattern
- Screens in `app/screens/<feature>/`
- Reusable components in `app/components/<category>/`
- Business logic in `app/utils/` (pure functions, no React deps)
- Data fetching in `app/hooks/` (custom hooks with loading/error states)
- State in `app/store/` (Zustand slices)

### Database
- Dev: SQLite at `./dev.db` (auto-created from models)
- Prod: PostgreSQL via `DATABASE_URL` env var
- JSONB columns for extensible data (exercises, micro_nutrients, tags)
- Soft deletes via `SoftDeleteMixin` (deleted_at column)
- Audit logging via `AuditLogMixin`

### Feature Flags
- Model: `src/modules/feature_flags/models.py`
- Service: `src/modules/feature_flags/service.py` (with TTL cache)
- Check: `FeatureFlagService(db).is_feature_enabled("flag_name", user)`
- Frontend: `useFeatureFlag("flag_name")` hook

### Error Handling
- Backend: Custom `ApiError` classes in `src/shared/errors.py`
- Consistent JSON error format: `{status, code, message, details}`
- Frontend: try/catch with `err?.response?.data?.detail` pattern

## Running the App

```bash
# Quick start — opens two Terminal windows (backend + frontend)
./dev.sh

# Or manually:

# Backend
.venv/bin/python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (needs Node 22 via mise)
export PATH="$HOME/.local/share/mise/installs/node/22.22.0/bin:$PATH"
cd app && npx expo start --web --port 8081

# Tests
.venv/bin/python -m pytest tests/ -v          # Backend
cd app && npx jest                              # Frontend
```

## Environment Variables (.env)
```
DATABASE_URL=sqlite+aiosqlite:///./dev.db
JWT_SECRET=local-dev-secret-change-in-prod
DEBUG=true
USDA_API_KEY=DEMO_KEY
```

## DO NOT
- Delete or modify existing tests without explicit request
- Use `as any`, `@ts-ignore`, `# type: ignore` unless absolutely necessary
- Commit secrets or API keys
- Modify the database schema without considering migration impact
- Break backward compatibility on API responses (add fields, don't remove)
