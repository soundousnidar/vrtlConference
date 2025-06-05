from fastapi import FastAPI
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
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Set-Cookie", "Access-Control-Allow-Headers", "Access-Control-Allow-Origin",
                  "Authorization", "X-Requested-With", "Accept", "Origin", "Access-Control-Request-Method",
                  "Access-Control-Request-Headers"],
    expose_headers=["Set-Cookie"],
    max_age=3600,
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Inscription"])
app.include_router(authn_router, prefix="/auth", tags=["Authentification"])
app.include_router(profile_router, prefix="/profile", tags=["Profil"])
app.include_router(conference_router, tags=["Conferences"])  # Remove the prefix
app.include_router(abstracts_router, prefix="/abstracts", tags=["Abstracts"])
app.include_router(review_router, prefix="/reviews", tags=["Reviews"])
app.include_router(stats_router, prefix="/stats", tags=["Statistiques"])

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
