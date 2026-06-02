"""
EngineerCopilot AI — Cover Letter Router.

Endpoints for AI-powered cover letter generation.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.dependencies import CurrentUser
from app.models.application import CoverLetterGenerateRequest, CoverLetterResponse
from app.services.ai_client import generate_cover_letter_text
from app.utils.supabase import get_supabase_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/cover-letter", tags=["cover-letter"])

db = get_supabase_admin


@router.post("/generate", response_model=CoverLetterResponse)
def generate_cover_letter(data: CoverLetterGenerateRequest, user: CurrentUser):
    """
    Generate a tailored cover letter using the user's profile
    and a job description.
    """
    # Fetch user profile
    profile = db().table("profiles").select("*").eq("id", user.user_id).single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Fetch user data for personalization
    skills = db().table("user_skills").select("skill_name").eq("user_id", user.user_id).execute()
    experience = db().table("user_experience").select("company, title, description").eq("user_id", user.user_id).limit(3).execute()
    projects = db().table("user_projects").select("title, description, technologies").eq("user_id", user.user_id).limit(3).execute()

    # Fetch job details if job_id provided
    job_title = data.job_title or ""
    company_name = data.company_name or ""
    job_description = data.job_description or ""

    if data.job_id:
        job_result = db().table("jobs").select("*").eq("id", data.job_id).single().execute()
        if job_result.data:
            job_title = job_result.data.get("title", job_title)
            company_name = job_result.data.get("company", company_name)
            job_description = job_result.data.get("description", job_description)

    if not job_title and not company_name:
        raise HTTPException(
            status_code=400,
            detail="Either job_id or (job_title + company_name) must be provided",
        )

    # Build user context
    user_context = {
        "name": profile.data.get("full_name", "Applicant"),
        "email": profile.data.get("email", ""),
        "skills": [s["skill_name"] for s in (skills.data or [])],
        "experience": experience.data or [],
        "projects": projects.data or [],
        "resume_text": profile.data.get("resume_parsed_data", {}).get("raw_text", ""),
    }

    # Generate cover letter
    try:
        content = generate_cover_letter_text(
            job_title=job_title,
            company_name=company_name,
            job_description=job_description,
            user_context=user_context,
        )
    except Exception as exc:
        logger.error("Cover letter generation failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"AI generation failed: {exc}")

    # Store in database
    record = {
        "user_id": user.user_id,
        "job_id": data.job_id,
        "content": content,
        "ai_model": "gemini",
    }
    result = db().table("generated_cover_letters").insert(record).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save cover letter")

    return result.data[0]


@router.get("/history", response_model=list[CoverLetterResponse])
def get_history(user: CurrentUser):
    """Get all generated cover letters for the current user."""
    result = (
        db()
        .table("generated_cover_letters")
        .select("*")
        .eq("user_id", user.user_id)
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )
    return result.data or []
