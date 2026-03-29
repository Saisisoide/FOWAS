# FOWAS Integration Analysis — Bug Report & Fixes

## Executive Summary

After full-stack analysis (reading every file, booting backend with SQLite, running all 17 API endpoints, building frontend), the **API contracts are correctly aligned** — routes match, response shapes match TypeScript types, auth flow works end-to-end. 

The issues are **setup/config blockers** and **code robustness gaps**, not architectural mismatches.

---

## Bug List (Priority Order)

### BUG 1 — BLOCKER: Missing `.env` file
**Impact:** Backend crashes on startup with `pydantic_settings.ValidationError`  
**Root cause:** `app/core/config.py` requires `DATABASE_URL` and `SECRET_KEY` from environment  
**File:** `backend/.env` (missing)  
**Fix:** Create `.env` — see fix below

### BUG 2 — BLOCKER: Missing `docker-compose.yml`
**Impact:** Cannot run containerized stack as documented in report and README  
**Root cause:** File referenced everywhere but not committed to repo  
**File:** `docker-compose.yml` (missing at repo root)  
**Fix:** Create `docker-compose.yml` — see fix below

### BUG 3 — MODERATE: Visibility filter uses raw strings instead of enum members
**Impact:** Works today but will break if SQLAlchemy tightens enum comparison  
**Root cause:** `incident_service.py` compares `Incident.visibility == "PUBLIC"` instead of enum  
**File:** `backend/app/services/incident_service.py`  
**Fix:** Use `IncidentVisibilityEnum.PUBLIC` etc.

### BUG 4 — MINOR: `compute_risk` receives enum but type-hints `str`
**Impact:** Works via str inheritance but confusing for maintainers  
**Root cause:** `analytics_service.py` passes `i.severity` (enum) to `compute_risk(severity: str, ...)`  
**File:** `backend/app/services/analytics_service.py`  
**Fix:** Pass `i.severity.value` explicitly

### BUG 5 — BLOCKER: Missing `Dockerfile` for backend and frontend
**Impact:** `docker-compose build` fails immediately  
**Root cause:** Both Dockerfiles referenced in report/docker-compose but never committed  
**Files:** `backend/Dockerfile`, `frontend/Dockerfile` (both missing)  
**Fix:** Created both — see repo

### BUG 6 — MINOR: Alembic migration uses `sa.UUID()` — PostgreSQL only
**Impact:** `alembic upgrade head` fails on SQLite; doesn't block local dev since `create_all` works  
**Root cause:** Auto-generated migration doesn't use the custom `GUID` type  
**File:** `backend/alembic/versions/33dc97ff6dcb_initial_schema.py`  
**Fix:** Not blocking — `Base.metadata.create_all()` in `main.py` handles table creation correctly

### BUG 7 — MINOR: `.gitignore` missing `*.db` for SQLite dev databases
**Impact:** SQLite dev database could get committed to repo  
**File:** `.gitignore`  
**Fix:** Added `*.db` pattern

---

## Verified Working (No Fix Needed)

| Area | Status |
|------|--------|
| `POST /auth/register` → frontend `register()` | ✅ Shapes match |
| `POST /auth/login` → frontend `login()` | ✅ `access_token` + `token_type` |
| `GET /auth/me` → frontend `getCurrentUser()` | ✅ `UserOut` matches `User` type |
| `GET /incidents` → `getIncidents()` | ✅ All 18 fields present including `risk_score`, `risk_level`, `tags` |
| `POST /incidents` → `createIncident()` | ✅ Pydantic validates, risk enrichment works |
| `PATCH /incidents/{id}` → `updateIncident()` | ✅ Status transitions + `resolved_at` auto-set |
| `GET /workflows` → `getWorkflows()` | ✅ Visibility filter applied |
| `POST /workflows` → `createWorkflow()` | ✅ `organisation_id: null` for personal workflows |
| `GET /organisations` → `getOrganisations()` | ✅ Membership-scoped |
| `POST /organisations` → `createOrganisation()` | ✅ Auto OWNER membership |
| `GET /analytics/*` endpoints | ✅ All 5 return correct shapes |
| CORS configuration | ✅ `localhost:3000` allowed |
| JWT auth header flow | ✅ `Bearer` token via `HTTPBearer` |
| Client-side analytics (lib/fowas.ts) | ✅ Risk computation matches backend formula |
| Incident modal form validation | ✅ Workflow required, visibility fallback for personal WFs |
| Global filter system | ✅ Client-side filtering over API data |

---

## Execution Order

```
1. Create  backend/.env                              (BUG 1 — unblocks startup)
2. Create  backend/.env.example                      (documentation)
3. Create  docker-compose.yml                        (BUG 2 — unblocks Docker)
4. Create  backend/Dockerfile                        (BUG 5 — unblocks Docker build)
5. Create  frontend/Dockerfile                       (BUG 5 — unblocks Docker build)
6. Patch   backend/app/services/incident_service.py  (BUG 3 — enum safety)
7. Patch   backend/app/services/analytics_service.py (BUG 4 — explicit .value)
8. Patch   .gitignore                                (BUG 7 — exclude *.db)
9. Test    full flow: register → login → org → workflow → incident → dashboard
```

## Quick-Start (Local, no Docker)

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env          # edit if needed
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

## Quick-Start (Docker)

```bash
docker compose up --build
# Backend: http://localhost:8000/docs
# Frontend: http://localhost:3000
```
