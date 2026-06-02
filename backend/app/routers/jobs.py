"""
EngineerCopilot AI — Jobs Router.

Endpoints for job listing, searching, filtering, and matching.
Jobs are publicly readable (no auth required for listing).
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.dependencies import CurrentUser
from app.models.job import JobListResponse, MatchResponse, MatchScore
from app.utils.supabase import get_supabase_admin

from app.services.job_scraper import sync_jobs

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/jobs", tags=["jobs"])

db = get_supabase_admin


@router.post("/sync")
async def trigger_sync():
    """Trigger the background job scraper to fetch latest engineering jobs."""
    try:
        result = await sync_jobs()
        return result
    except Exception as e:
        logger.error(f"Sync failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to sync jobs")


@router.get("", response_model=JobListResponse)
def list_jobs(
    keyword: Optional[str] = None,
    location: Optional[str] = None,
    category: Optional[str] = None,
    source: Optional[str] = None,
    remote_only: bool = False,
    experience_level: Optional[str] = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    sort: str = Query(default="latest", pattern=r"^(latest|oldest)$"),
):
    """
    List jobs with optional filtering.
    No authentication required — jobs are public.
    """
    query = db().table("jobs").select("*, job_categories(category, confidence)", count="exact")
    query = query.eq("is_active", True)

    if keyword:
        # Use PostgreSQL text search on title and company
        query = query.or_(f"title.ilike.%{keyword}%,company.ilike.%{keyword}%,description.ilike.%{keyword}%")
    if location:
        query = query.ilike("location", f"%{location}%")
    if source:
        query = query.eq("source", source)
    if remote_only:
        query = query.eq("is_remote", True)
    if experience_level:
        query = query.eq("experience_level", experience_level)

    # Sorting
    if sort == "oldest":
        query = query.order("fetched_at", desc=False)
    else:
        query = query.order("fetched_at", desc=True)

    # Pagination
    query = query.range(offset, offset + limit - 1)

    result = query.execute()

    # If category filter is set, filter in Python (join-based filtering)
    items = result.data or []
    if category:
        items = [
            job for job in items
            if any(c.get("category") == category for c in (job.get("job_categories") or []))
        ]

    # Deduplicate by apply_url, keeping the most recently fetched entry
    seen_urls: dict[str, dict] = {}
    for job in items:
        url = job.get("apply_url", "")
        if url not in seen_urls or (job.get("fetched_at") or "") > (seen_urls[url].get("fetched_at") or ""):
            seen_urls[url] = job

    items = list(seen_urls.values())

    # Map categories into response format
    for item in items:
        cats = item.pop("job_categories", []) or []
        item["categories"] = cats

    return {
        "items": items,
        "total": len(items),
        "limit": limit,
        "offset": offset,
    }


@router.get("/categories")
def get_categories():
    """Get all available job categories with counts."""
    result = db().table("job_categories").select("category").execute()
    categories = {}
    for row in (result.data or []):
        cat = row.get("category", "")
        categories[cat] = categories.get(cat, 0) + 1
    return {
        "categories": [
            {"name": k, "count": v, "display_name": k.replace("_", " ").title()}
            for k, v in sorted(categories.items(), key=lambda x: x[1], reverse=True)
        ]
    }


@router.get("/sources")
def get_sources():
    """Get all available job sources with counts."""
    result = db().table("jobs").select("source").eq("is_active", True).execute()
    sources = {}
    for row in (result.data or []):
        src = row.get("source", "")
        sources[src] = sources.get(src, 0) + 1
    return {
        "sources": [
            {"name": k, "count": v}
            for k, v in sorted(sources.items(), key=lambda x: x[1], reverse=True)
        ]
    }


@router.get("/{job_id}")
def get_job(job_id: str):
    """Get a single job by ID."""
    result = (
        db()
        .table("jobs")
        .select("*, job_categories(category, confidence)")
        .eq("id", job_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")

    job = result.data
    job["categories"] = job.pop("job_categories", []) or []
    return job


@router.post("/match", response_model=MatchResponse)
async def match_job(job_id: str, user: CurrentUser):
    """
    Calculate match score between the current user's profile and a job.
    """
    # Fetch job
    job_result = (
        db()
        .table("jobs")
        .select("*, job_categories(category, confidence)")
        .eq("id", job_id)
        .single()
        .execute()
    )
    if not job_result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    job = job_result.data
    job["categories"] = job.pop("job_categories", []) or []

    # Fetch user profile + skills + projects
    profile = db().table("profiles").select("*").eq("id", user.user_id).single().execute()
    skills = db().table("user_skills").select("skill_name").eq("user_id", user.user_id).execute()
    projects = db().table("user_projects").select("technologies").eq("user_id", user.user_id).execute()
    education = db().table("user_education").select("field_of_study, degree").eq("user_id", user.user_id).execute()

    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found. Complete your profile first.")

    # Fallback to resume_parsed_data if DB tables are empty
    parsed = profile.data.get("resume_parsed_data") or {}
    
    # Safely extract skills
    skill_list = skills.data or []
    if not skill_list and parsed.get("skills"):
        # Ensure it's a list of strings and mapped correctly
        raw_skills = parsed.get("skills")
        if isinstance(raw_skills, list) and len(raw_skills) > 0 and isinstance(raw_skills[0], str):
            skill_list = [{"skill_name": s} for s in raw_skills]
        elif isinstance(raw_skills, list) and len(raw_skills) > 0 and isinstance(raw_skills[0], dict):
            # Already formatted somehow?
            skill_list = [{"skill_name": s.get("skill_name", str(s))} for s in raw_skills]
        
    project_list = projects.data or []
    if not project_list and (parsed.get("experience") or parsed.get("projects")):
        project_list = []
        # Safely extract from experience
        for exp in (parsed.get("experience") or []):
            techs = exp.get("technologies") or []
            desc = exp.get("description") or ""
            # If no tech, just use description as a project context fallback
            project_list.append({"technologies": techs, "description": desc, "title": exp.get("title", "")})
        # Safely extract from projects
        for proj in (parsed.get("projects") or []):
            techs = proj.get("technologies") or []
            desc = proj.get("description") or ""
            project_list.append({"technologies": techs, "description": desc, "title": proj.get("title", "")})
            
    edu_list = education.data or []
    if not edu_list and parsed.get("education"):
        edu_list = parsed["education"]

    # Calculate match scores via True AI
    from app.ai.matcher import generate_match_score
    ai_match = await generate_match_score(
        job=job,
        profile=profile.data,
        skills=skill_list,
        projects=project_list,
        education=edu_list
    )
    
    if ai_match:
        return {
            "job": job,
            "match": ai_match
        }

    # FALLBACK to heuristic if AI fails
    user_skills = {s.get("skill_name", "").lower() for s in skill_list}
    job_skills = {s.lower() for s in (job.get("required_skills") or [])}

    if user_skills or job_skills:
        intersection = user_skills & job_skills
        union = user_skills | job_skills
        skill_score = int((len(intersection) / len(union)) * 100) if union else 0
    else:
        skill_score = 50

    user_tech = set()
    for p in (projects.data or []):
        user_tech.update(t.lower() for t in (p.get("technologies") or []))
    if user_tech and job_skills:
        tech_overlap = user_tech & job_skills
        project_score = int((len(tech_overlap) / max(len(job_skills), 1)) * 100)
    else:
        project_score = 40

    education_score = 50
    job_desc = (job.get("description") or "").lower()
    for edu in (education.data or []):
        field = (edu.get("field_of_study") or "").lower()
        if field and any(word in job_desc for word in field.split()):
            education_score = 80
            break

    location_score = 50
    profile_data = profile.data
    preferred_locations = [loc.lower() for loc in (profile_data.get("preferred_locations") or [])]
    job_location = (job.get("location") or "").lower()
    if job.get("is_remote"):
        location_score = 90
    elif any(loc in job_location for loc in preferred_locations):
        location_score = 100
    elif profile_data.get("country", "").lower() in job_location:
        location_score = 70

    overall = int(skill_score * 0.40 + project_score * 0.25 + education_score * 0.15 + location_score * 0.20)

    explanation = []
    if user_skills & job_skills:
        matched = ", ".join(sorted(user_skills & job_skills)[:5])
        explanation.append(f"{skill_score}% skill overlap: {matched}")
    else:
        explanation.append(f"{skill_score}% skill match (add more skills to improve)")
    explanation.append(f"{project_score}% project relevance")
    if job.get("is_remote"):
        explanation.append("Remote position matches your preferences")
    elif location_score >= 70:
        explanation.append(f"Location '{job.get('location')}' matches your preferences")

    return {
        "job": job,
        "match": {
            "overall_score": min(overall, 100),
            "skill_match": skill_score,
            "project_match": project_score,
            "education_match": education_score,
            "location_match": location_score,
            "explanation": explanation,
        },
    }


@router.get("/recommendations/for-me")
def get_recommendations(user: CurrentUser, limit: int = Query(default=10, ge=1, le=50)):
    """
    Get job recommendations for the current user.
    Returns jobs sorted by match score.
    """
    # Fetch user profile and skills
    profile = db().table("profiles").select("*").eq("id", user.user_id).single().execute()
    skills = db().table("user_skills").select("skill_name").eq("user_id", user.user_id).execute()
    
    parsed = profile.data.get("resume_parsed_data") or {}
    skill_list = skills.data or []
    if not skill_list and parsed.get("skills"):
        raw_skills = parsed.get("skills")
        if isinstance(raw_skills, list) and len(raw_skills) > 0 and isinstance(raw_skills[0], str):
            skill_list = [{"skill_name": s} for s in raw_skills]
        elif isinstance(raw_skills, list) and len(raw_skills) > 0 and isinstance(raw_skills[0], dict):
            skill_list = [{"skill_name": s.get("skill_name", str(s))} for s in raw_skills]

    user_skills = [s.get("skill_name", "").lower() for s in skill_list]

    if not user_skills:
        # Fallback: return latest jobs
        result = (
            db()
            .table("jobs")
            .select("*, job_categories(category, confidence)")
            .eq("is_active", True)
            .order("fetched_at", desc=True)
            .limit(limit)
            .execute()
        )
        items = result.data or []
        for item in items:
            item["categories"] = item.pop("job_categories", []) or []
            item["match_score"] = None
        return {"items": items, "message": "Add skills to your profile for personalized recommendations"}

    # Fetch jobs that have overlapping skills
    # Use contains filter for array overlap
    result = (
        db()
        .table("jobs")
        .select("*, job_categories(category, confidence)")
        .eq("is_active", True)
        .order("fetched_at", desc=True)
        .limit(200)  # Fetch more, then rank
        .execute()
    )

    items = result.data or []
    scored = []
    for item in items:
        item["categories"] = item.pop("job_categories", []) or []
        job_skills = {s.lower() for s in (item.get("required_skills") or [])}
        if job_skills:
            overlap = len(set(user_skills) & job_skills)
            score = int((overlap / len(job_skills)) * 100)
        else:
            score = 30  # Low default for jobs with no listed skills
        item["match_score"] = score
        scored.append(item)

    # Sort by match score descending
    scored.sort(key=lambda x: x.get("match_score", 0), reverse=True)

    return {"items": scored[:limit]}
