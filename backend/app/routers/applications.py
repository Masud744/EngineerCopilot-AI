"""
EngineerCopilot AI — Applications Router.

Endpoints for application tracking with Kanban-style status management.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query, status

from app.dependencies import CurrentUser
from app.models.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationStats,
    ApplicationUpdate,
)
from app.utils.supabase import get_supabase_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/applications", tags=["applications"])

db = get_supabase_admin


@router.get("", response_model=list[ApplicationResponse])
def list_applications(
    user: CurrentUser,
    status_filter: str | None = Query(None, alias="status"),
):
    """Get all applications for the current user, with optional status filter."""
    query = (
        db()
        .table("applications")
        .select("*, jobs(title, company, location)")
        .eq("user_id", user.user_id)
        .order("updated_at", desc=True)
    )

    if status_filter:
        query = query.eq("status", status_filter)

    result = query.execute()
    items = result.data or []

    # Flatten joined job data
    for item in items:
        job = item.pop("jobs", None) or {}
        item["job_title"] = job.get("title")
        item["job_company"] = job.get("company")
        item["job_location"] = job.get("location")

    return items


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(data: ApplicationCreate, user: CurrentUser):
    """
    Track a job application (saved, applied, etc.)
    """
    record = {
        **data.model_dump(exclude_none=True),
        "user_id": user.user_id,
    }
    if record.get("applied_date"):
        record["applied_date"] = str(record["applied_date"])

    try:
        result = db().table("applications").insert(record).execute()
    except Exception as exc:
        if "duplicate" in str(exc).lower() or "unique" in str(exc).lower():
            raise HTTPException(
                status_code=409,
                detail="You have already tracked this job",
            )
        raise HTTPException(status_code=500, detail=f"Failed to track application: {exc}")

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to track application")
    return result.data[0]


@router.patch("/{application_id}", response_model=ApplicationResponse)
def update_application(application_id: str, data: ApplicationUpdate, user: CurrentUser):
    """Update application status or notes."""
    update_data = data.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "applied_date" in update_data and update_data["applied_date"]:
        update_data["applied_date"] = str(update_data["applied_date"])

    result = (
        db()
        .table("applications")
        .update(update_data)
        .eq("id", application_id)
        .eq("user_id", user.user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Application not found")
    return result.data[0]


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(application_id: str, user: CurrentUser):
    """Delete an application."""
    db().table("applications").delete().eq("id", application_id).eq("user_id", user.user_id).execute()


@router.get("/stats", response_model=ApplicationStats)
def get_stats(user: CurrentUser):
    """Get application statistics for the dashboard."""
    result = (
        db()
        .table("applications")
        .select("status")
        .eq("user_id", user.user_id)
        .execute()
    )
    items = result.data or []

    stats = {
        "total": len(items),
        "saved": 0,
        "applied": 0,
        "assessment": 0,
        "interview": 0,
        "final_interview": 0,
        "offer": 0,
        "rejected": 0,
        "withdrawn": 0,
    }

    for item in items:
        s = item.get("status", "")
        if s in stats:
            stats[s] += 1

    return stats
