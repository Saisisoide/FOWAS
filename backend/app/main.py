import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import Base, engine
from app.models import User, Organisation, OrganisationMembership, Workflow, Incident, Tag
from app.routes import auth, organisations, workflows, incidents, analytics

app = FastAPI(title="FOWAS API", version="1.0.0")


@app.on_event("startup")
def on_startup():
    # Use Alembic migrations in production: set RUN_MIGRATIONS=alembic
    # Default: create_all for dev/simple deployments
    if os.getenv("RUN_MIGRATIONS", "create_all") != "alembic":
        Base.metadata.create_all(bind=engine)

allowed_origins = [
    origin.strip()
    for origin in settings.CORS_ORIGINS.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(organisations.router)
app.include_router(workflows.router)
app.include_router(incidents.router)
app.include_router(analytics.router)

@app.get("/health")
def health():
    return {"status": "ok"}
@app.get("/")
def root():
    return {"message": "FOWAS backend running"}
@app.get("/debug-db")
def debug_db():
    from app.db.database import engine as db_engine
    try:
        with db_engine.connect() as conn:
            return {"db": "connected"}
    except Exception as e:
        return {"error": str(e)}
