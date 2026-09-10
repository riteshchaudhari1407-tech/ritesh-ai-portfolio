import os
import time
from collections import defaultdict
from typing import Any, List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

# Load environment variables
load_dotenv()

from services.chat_service import chat_service

app = FastAPI(
    title="Ritesh AI API",
    description="AI backend for Ritesh.AI portfolio",
    version="1.0.0",
)


# ---------------------------------------------------------
# CORS HARDENING
# ---------------------------------------------------------

raw_origins = os.getenv("FRONTEND_ORIGINS") or os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip() and o.strip() != "*"]
if not allowed_origins:
    allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# RATE LIMITING / ABUSE PROTECTION
# ---------------------------------------------------------

CHAT_RATE_LIMIT_PER_MINUTE = int(os.getenv("CHAT_RATE_LIMIT_PER_MINUTE", "20"))
request_timestamps_per_ip: defaultdict = defaultdict(list)


def check_rate_limit(client_ip: str) -> None:
    now = time.time()
    window_start = now - 60.0
    # Clean up timestamps older than 60 seconds
    request_timestamps_per_ip[client_ip] = [
        t for t in request_timestamps_per_ip[client_ip] if t > window_start
    ]
    if len(request_timestamps_per_ip[client_ip]) >= CHAT_RATE_LIMIT_PER_MINUTE:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please wait a minute before asking another question.",
        )
    request_timestamps_per_ip[client_ip].append(now)


# ---------------------------------------------------------
# REQUEST / RESPONSE MODELS
# ---------------------------------------------------------

class MessageItem(BaseModel):
    role: str = Field(..., description="Role of message sender: 'user' or 'assistant'")
    content: str = Field(..., max_length=1000, description="Message text content")

    @field_validator("role", mode="before")
    @classmethod
    def validate_role(cls, v: Any) -> str:
        if not isinstance(v, str):
            raise ValueError("Role must be a string")
        role_clean = v.lower().strip()
        if role_clean in ["ai", "assistant"]:
            return "assistant"
        if role_clean == "user":
            return "user"
        raise ValueError("Role must be 'user' or 'assistant'")


class ChatRequest(BaseModel):
    message: str = Field(..., max_length=500, description="Chat input message from user")
    history: Optional[List[MessageItem]] = Field(default=[], description="Recent conversation history")


class ChatResponse(BaseModel):
    reply: str


# ---------------------------------------------------------
# ROUTES
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Ritesh AI API",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
    }


@app.post("/chat", response_model=ChatResponse)
def chat(request_data: ChatRequest, http_request: Request):
    try:
        # Rate limit enforcement by client IP
        client_ip = http_request.client.host if http_request.client else "unknown"
        check_rate_limit(client_ip)

        history_list = [item.model_dump() for item in request_data.history] if request_data.history else []
        reply = chat_service.process_chat(request_data.message, history_list)
        return ChatResponse(reply=reply)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error handling /chat request: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sorry, I couldn't process that request right now.",
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)