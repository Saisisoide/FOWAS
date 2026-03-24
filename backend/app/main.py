from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, organisations, workflows, incidents, analytics

from app.db.database import Base, engine
from app.models import user, organisation, workflow, incident  # import all model files

app = FastAPI(title="FOWAS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(organisations.router)
app.include_router(workflows.router)
app.include_router(incidents.router)
app.include_router(analytics.router)

@app.get("/health")
def health():
    return {"status": "ok"}