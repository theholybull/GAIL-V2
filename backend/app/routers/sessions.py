from fastapi import APIRouter


router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("/active")
def list_active_sessions() -> dict[str, list[dict[str, str]]]:
    return {
        "sessions": [
            {
                "id": "primary",
                "mode": "local",
                "avatar_state": "idle",
            }
        ]
    }
