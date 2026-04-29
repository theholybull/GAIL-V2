from fastapi import FastAPI

from app.routers import health, sessions


app = FastAPI(
    title="Gail Hub",
    version="0.1.0",
    description="Backend hub for the Unity avatar host, local LLM routing, and remote device sessions.",
)

app.include_router(health.router)
app.include_router(sessions.router)
