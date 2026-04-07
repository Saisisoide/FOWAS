# FOWAS — Failure-Oriented Workflow Analysis System
website - <href>https://fowas.up.railway.app</href>
> A multi-tenant reliability intelligence platform that transforms structured failure logging into quantitative operational analytics.

Built as a Computer Science Software Engineering project, FOWAS addresses a real architectural gap in engineering workflows: the absence of structured failure intelligence. Unlike generic task trackers, FOWAS treats every incident as a quantifiable data point — computing deterministic risk scores, SRE-standard reliability metrics, and surfacing systemic failure patterns through an interactive analytics dashboard.

---

## What it does

Most engineering teams log failures in Jira or Notion — tools optimised for task completion, not reliability modelling. The result is recurring failures, untracked resolution times, and no mechanism to evaluate whether corrective actions actually worked.

FOWAS replaces that informal process with:

- **Deterministic risk scoring** — every incident receives a computed risk score `R = Sₙ × I` (severity × impact), classified into LOW / MODERATE / HIGH bands
- **SRE metrics** — MTTR, MTBF, and availability ratio computed directly from the incident lifecycle
- **Hierarchical failure taxonomy** — five root cause categories (Technical, Operational, Human, External, Systemic) with subcategories, enabling Pareto analysis across the incident population
- **Cause-chain linking** — incidents can reference a parent incident via a self-referential foreign key, modelling failure propagation as a directed acyclic graph
- **Multi-tenant RBAC** — organisations, roles (OWNER / ADMIN / MEMBER / VIEWER), and three-tier visibility (PRIVATE / ORGANISATION / PUBLIC) enforced exclusively at the server query layer
- **Interactive analytics dashboard** — global filter-driven charts: severity distribution, risk histogram, incident trend, workflow risk comparison, impact vs. severity scatter

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Next.js 14 (TypeScript) | File-system routing, SSR, type safety at the API boundary |
| Backend API | FastAPI (Python 3.11) | Pydantic validation, auto OpenAPI docs, async support, ML-ready Python ecosystem |
| ORM | SQLAlchemy 2.0 | Complex joins and aggregations required by the analytics layer |
| Database | PostgreSQL 16 | Window functions for MTTR, relational integrity across the incident graph |
| Migrations | Alembic | Version-controlled schema with rollback capability |
| Auth | JWT (python-jose) + bcrypt | Stateless, signed tokens; passwords never persisted in plaintext |
| Containerisation | Docker Compose | Single-command startup, environment isolation |
| Charts | Recharts / Plotly | Interactive hover, zoom, filter-driven re-render |

---

## Architecture

```
fowas/
├── backend/
│   └── app/
│       ├── core/          # Config, JWT, bcrypt, FastAPI dependencies
│       ├── db/            # SQLAlchemy engine + SessionLocal
│       ├── models/        # ORM table definitions (User, Org, Workflow, Incident, Tag)
│       ├── schemas/       # Pydantic request/response schemas
│       ├── routes/        # HTTP route handlers
│       ├── services/      # Business logic decoupled from HTTP layer
│       └── utils/
│           ├── risk_engine.py          # Pure functions — risk score + classification
│           └── reliability_metrics.py  # MTTR, MTBF, availability ratio
├── frontend/
│   └── src/
│       ├── app/           # Next.js App Router pages
│       ├── components/    # Charts, dashboard panels, UI primitives
│       ├── services/      # Typed API client
│       └── hooks/         # useAuth and other custom hooks
└── docker-compose.yml
```

The risk engine (`risk_engine.py`) is intentionally a module of stateless pure functions with no database imports. This isolation makes it directly callable by a future ML pipeline without modification.

---

## Reliability Model

**Risk Score**

```
R = Sₙ × I     where Sₙ ∈ {1, 2, 3},  I ∈ [1, 10],  R ∈ [1, 30]
```

Multiplicative structure (not additive) preserves proportional escalation — a HIGH severity incident with maximum impact scores 30, not 13.

**Risk Classification**

| Band | Range | Interpretation |
|---|---|---|
| LOW | R ≤ 5 | Operational noise |
| MODERATE | 6 ≤ R ≤ 15 | Requires investigation |
| HIGH | R > 15 | Priority queue — immediate escalation |

**SRE Metrics**

```
MTTR        = Σ(resolved_at - created_at) / |resolved incidents|       [hours]
MTBF        = Σ(t_{k+1} - t_k) / (N - 1)                             [hours]
Availability = |resolved| / |total|
```

---

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 16

### 1. Clone

```bash
git clone https://github.com/anubhav-amol/FOWAS.git
cd FOWAS
```

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Environment variables

Create `.env` in the repo root **and** copy it into `backend/`:

```env
DATABASE_URL=postgresql://fowas:fowas@localhost/fowas
SECRET_KEY=your-secret-key-here
POSTGRES_USER=fowas
POSTGRES_PASSWORD=fowas
POSTGRES_DB=fowas
```

### 4. Database

```bash
sudo service postgresql start
sudo -u postgres psql -c "CREATE USER fowas WITH PASSWORD 'fowas';"
sudo -u postgres psql -c "CREATE DATABASE fowas OWNER fowas;"
```

### 5. Migrations

```bash
alembic upgrade head
```

### 6. Run backend

```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`

### 7. Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend available at `http://localhost:3000`

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create user account |
| POST | `/auth/login` | Authenticate — returns JWT |
| GET | `/auth/me` | Current user |
| POST | `/organisations` | Create organisation |
| POST | `/organisations/{id}/invite` | Invite member with role |
| GET | `/workflows` | List visible workflows |
| POST | `/workflows` | Create workflow |
| GET | `/incidents` | List incidents (visibility-filtered) |
| POST | `/incidents` | Log new incident |
| PATCH | `/incidents/{id}` | Update status, severity, notes |
| GET | `/analytics/summary` | KPIs: total, high-risk count, MTTR, resolved |
| GET | `/analytics/trend` | Daily incident count time series |
| GET | `/analytics/risk-distribution` | Risk band histogram |
| GET | `/analytics/workflow-risk` | Average risk score per workflow |
| GET | `/analytics/severity` | Severity breakdown counts |

Full interactive documentation: `http://localhost:8000/docs`

---

## Testing the API (Swagger UI flow)

```
1. POST /auth/register    → create user
2. POST /auth/login       → copy access_token
3. Click Authorize        → paste token → confirm
4. POST /organisations    → create org, copy id
5. POST /workflows        → create workflow with org id
6. POST /incidents        → log incident with workflow id
7. GET  /analytics/summary → verify metrics compute correctly
```

---

## Data Model

Five core entities: `users`, `organisations`, `organisation_memberships`, `workflows`, `incidents`, linked by `tags` (many-to-many via `incident_tags`). Incidents support self-referential cause-chain linking via `linked_to`.

Visibility access is enforced at the query layer — a user reads an incident only if:
- `visibility = PUBLIC`, or
- `visibility = ORGANISATION` and the user is a member of the incident's organisation, or
- `visibility = PRIVATE` and the user is the creator

---

## Failure Taxonomy

| Category | Subcategories |
|---|---|
| Technical | Code Bug · Infrastructure Failure · Hardware Fault |
| Operational | Deployment Error · Process Gap · Configuration Mismatch |
| Human | Manual Error · Misconfiguration · Knowledge Gap |
| External | Vendor Issue · Network Outage · Third-Party Dependency |
| Systemic | Design Flaw · Architecture Limitation · Unhandled Edge Case |

---

## Roadmap

| Version | Scope |
|---|---|
| V1.0 *(current)* | Multi-tenant auth, incident logging, risk engine, SRE metrics, analytics dashboard |
| V1.x | Redis caching, CSV/PDF export, reliability maturity score |
| V2.0 | ML-based failure similarity detection, recurrence-weighted risk formula, error budget tracking |
| V2.x | Public knowledge sharing — incidents publishable as learning artefacts with community upvoting |
| V3.0 | Graph-based cause chain traversal, predictive MTTR, Kubernetes scaling |

---

## Author

**Anubhav Amol Jha** 
**Sharayu Siside**

[github.com/anubhav-amol](https://github.com/anubhav-amol)
