from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.api.routes import router
from backend.app.db.init_db import init_db

app = FastAPI(
    title="ThinkForge & SocraticLMS API",
    description="Anti-cheat learning platform that trains students to need AI less. 'Don't replace thinking. Forge it.'",
    version="1.0.0"
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local hackathon demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/")
def root():
    return {
        "platform": "ThinkForge",
        "tagline": "Don't replace thinking. Forge it.",
        "brand_line": "An AI that trains you to need it less.",
        "docs": "/docs"
    }
