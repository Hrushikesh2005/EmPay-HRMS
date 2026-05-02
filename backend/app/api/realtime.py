from typing import Dict, List
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from jose import jwt

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

router = APIRouter(prefix="/realtime", tags=["Realtime"])


class ConnectionManager:
    def __init__(self) -> None:
        # user_id -> list[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        conns = self.active_connections.setdefault(user_id, [])
        conns.append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        conns = self.active_connections.get(user_id)
        if not conns:
            return
        try:
            conns.remove(websocket)
        except ValueError:
            pass
        if not conns:
            self.active_connections.pop(user_id, None)

    async def send_personal_message(self, user_id: str, message: dict) -> None:
        conns = self.active_connections.get(user_id) or []
        for ws in list(conns):
            try:
                await ws.send_json(message)
            except Exception:
                # ignore send errors; disconnect will prune
                pass

    async def broadcast(self, message: dict) -> None:
        for user_id, conns in list(self.active_connections.items()):
            for ws in list(conns):
                try:
                    await ws.send_json(message)
                except Exception:
                    pass


manager = ConnectionManager()


def _validate_token_get_user(token: str, db: Session) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str | None = payload.get("sub")
        if not user_id:
            return None
    except Exception:
        return None

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    return user


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    # token passed as query param: ?token=Bearer%20...
    from app.core.database import SessionLocal

    raw_token = token or ""
    if raw_token.startswith("Bearer "):
        raw_token = raw_token[len("Bearer "):]

    db = SessionLocal()
    try:
        user = _validate_token_get_user(raw_token, db)
        if not user:
            await websocket.close(code=4401)
            return

        user_id = user.id
        await manager.connect(user_id, websocket)
        try:
            while True:
                # keep connection alive; accept pings from client
                await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(user_id, websocket)
        except Exception:
            manager.disconnect(user_id, websocket)
    finally:
        db.close()
