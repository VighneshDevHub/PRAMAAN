from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import (
    analytics,
    auth,
    cases,
    devices,
    evidence,
    jobs,
    ledger,
    notifications,
    operations,
    public,
    reports,
    search,
    settings as settings_router,
    system_logs,
    users,
    verify,
    ws,
)
from app.core.config import get_settings
from app.core.logging import system_log_buffer
from app.db.session import init_models

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_models()
    system_log_buffer.start()
    yield
    await system_log_buffer.stop()


from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

app = FastAPI(title=settings.APP_NAME, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.onrender\.com|http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    origin = request.headers.get("origin")
    if not origin or origin == "*":
        origin = "https://pramaan-ntro.vercel.app"
    headers = dict(exc.headers or {})
    headers["Access-Control-Allow-Origin"] = origin
    headers["Access-Control-Allow-Credentials"] = "true"
    headers["Access-Control-Allow-Headers"] = "*"
    headers["Access-Control-Allow-Methods"] = "*"
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers,
    )


@app.exception_handler(Exception)
async def custom_general_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin")
    if not origin or origin == "*":
        origin = "https://pramaan-ntro.vercel.app"
    headers = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
    }
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers=headers,
    )

app.include_router(operations.router, prefix="/api/v1")
app.include_router(verify.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(cases.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(devices.router, prefix="/api/v1")
app.include_router(jobs.router, prefix="/api/v1")
app.include_router(ws.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(public.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(evidence.router, prefix="/api/v1")
app.include_router(ledger.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(settings_router.router, prefix="/api/v1")
app.include_router(system_logs.router, prefix="/api/v1")


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}
