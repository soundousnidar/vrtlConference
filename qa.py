from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
from database import get_db
from sqlalchemy.orm import Session
from models.users import User
from auth import get_current_user
import json

router = APIRouter()

# Connexions actives par conférence
active_connections: Dict[int, List[WebSocket]] = {}

@router.websocket("/ws/conference/{conf_id}/qa")
async def websocket_qa(websocket: WebSocket, conf_id: int):
    await websocket.accept()
    if conf_id not in active_connections:
        active_connections[conf_id] = []
    active_connections[conf_id].append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Broadcast à tous les clients de la même conférence
            for conn in active_connections[conf_id]:
                await conn.send_text(data)
    except WebSocketDisconnect:
        active_connections[conf_id].remove(websocket) 