"""
EngineerCopilot AI — Main FastAPI Application.

Entrypoint for the API server, configuring middleware, routers, and exception handlers.
"""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import (
    applications,
    cover_letter,
    health,
    jobs,
    profile,
    resume,
    saved_jobs,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def _run_daily_cleanup():
    """Background task: run stale-job cleanup once per day on server startup."""
    from app.scripts.cleanup_jobs import main as cleanup_main
    while True:
        try:
            logger.info("Running scheduled job cleanup (older than %d days)...", 14)
            cleanup_main()
        except Exception as exc:
            logger.error("Scheduled cleanup failed: %s", exc, exc_info=True)
        await asyncio.sleep(86400)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for application startup and shutdown events."""
    logger.info("Starting up EngineerCopilot AI API...")
    cleanup_task = asyncio.create_task(_run_daily_cleanup())
    yield
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    logger.info("Shutting down EngineerCopilot AI API...")


# Initialize settings
settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="A zero-cost AI-powered engineering career assistant backend API.",
    version="1.0.0",
    debug=settings.debug,
    lifespan=lifespan,
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled exceptions to return a standardized JSON error response."""
    logger.error("Unhandled error occurred at %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Our engineering team has been notified."},
    )


# Include health check (unprefixed)
app.include_router(health.router)

# Include API Routers under /api/v1 prefix
api_prefix = "/api/v1"
app.include_router(jobs.router, prefix=api_prefix)
app.include_router(profile.router, prefix=api_prefix)
app.include_router(resume.router, prefix=api_prefix)
app.include_router(cover_letter.router, prefix=api_prefix)
app.include_router(applications.router, prefix=api_prefix)
app.include_router(saved_jobs.router, prefix=api_prefix)


if __name__ == "__main__":
    import uvicorn
    # Local dev runner helper
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
