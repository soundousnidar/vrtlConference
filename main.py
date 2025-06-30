from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi  
from auth import router as auth_router
from authentification import router as authn_router
from abstracts import router as abstracts_router
import os
os.environ["PYTHONIOENCODING"] = "utf-8"
from stats import router as stats_router
from reviewers import router as review_router 
from conference import router as conference_router
from profile import router as profile_router
from database import Base, engine  # Ajout de l'import de Base et engine
from registration import router as registration_router
from payment import router as payment_router
from certificate import router as certificate_router
from qa import router as qa_router  # <-- Ajout du router Q&A
from live_sessions import router as live_sessions_router  # <-- Ajout du router des sessions live
from typing import List
from pywebpush import webpush, WebPushException

# Créer les tables au démarrage
Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
    "http://localhost:5174",  # Add Vite's default port
    "http://localhost:8001",
    "http://127.0.0.1:8001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Set-Cookie"],
    max_age=3600,
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Inscription"])
app.include_router(authn_router, prefix="/auth", tags=["Authentification"])
app.include_router(profile_router, prefix="/profile", tags=["Profil"])
app.include_router(conference_router, tags=["Conferences"])  # Remove the prefix
app.include_router(abstracts_router, prefix="/abstracts", tags=["Abstracts"])
app.include_router(review_router, tags=["Reviews"])  # Include without prefix to expose endpoints at root
app.include_router(stats_router, prefix="/stats", tags=["Statistiques"])
app.include_router(registration_router, tags=["Registration"])
app.include_router(payment_router, tags=["Payment"])
app.include_router(certificate_router, tags=["Certificates"])
app.include_router(qa_router, tags=["Q&A"])
app.include_router(live_sessions_router, tags=["Live Sessions"])  # <-- Ajout du router des sessions live

# Custom OpenAPI schema for JWT
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version="1.0.0",
        description="API avec authentification JWT",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    # Add security requirement to all routes except GET /conferences
    for path, path_item in openapi_schema["paths"].items():
        for method, operation in path_item.items():
            # Skip adding security for GET /conferences
            if not (path == "/conferences" and method.lower() == "get"):
                operation.setdefault("security", []).append({"BearerAuth": []})
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

@app.get("/")
async def root():
    return {"message": "Bienvenue sur l'API d'authentification"}

subscriptions: List[dict] = []

@app.post("/api/save-subscription")
async def save_subscription(request: Request):
    data = await request.json()
    subscriptions.append(data)
    return {"message": "Subscription saved"}

@app.post("/api/send-notification")
async def send_notification():
    for sub in subscriptions:
        try:
            webpush(
                subscription_info=sub,
                data="Ceci est une notification push !",
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={"sub": "mailto:admin@example.com"}
            )
        except WebPushException as ex:
            print("Erreur d'envoi:", ex)
    return {"message": "Notifications envoyées"}

VAPID_PUBLIC_KEY = "BD-3sYib-nb1LbZtOBDj7fwoAIRXwGgIcG_gNDfmCdA5pWrAN0rQmjTdUG3MJjPKN-1P2dBslItR-67AbCeq0sI"
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=False)
