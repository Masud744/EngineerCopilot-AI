"""
EngineerCopilot AI — Resume Router.

Endpoints for resume upload, parsing, and ATS-optimized generation.
"""

from __future__ import annotations

import io
import json
import logging
import uuid
from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.dependencies import CurrentUser
from app.models.application import ResumeGenerateRequest, ResumeGenerateResponse, ResumeParseResponse
from app.services.resume_parser import parse_resume_file
from app.utils.resume_pdf import generate_ats_resume_pdf, ResumeContext

from app.utils.supabase import get_supabase_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/resume", tags=["resume"])

db = get_supabase_admin

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...), user: CurrentUser = None):
    """
    Upload a resume file (PDF or DOCX).
    Stores the file in Supabase Storage and parses it.
    """
    # Validate file type
    if file.content_type not in ("application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are accepted",
        )

    # Read file content
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")

    # Upload to Supabase Storage
    file_ext = "pdf" if "pdf" in file.content_type else "docx"
    storage_path = f"{user.user_id}/resume.{file_ext}"

    try:
        client = db()
        # Remove existing file if any
        try:
            client.storage.from_("resumes").remove([storage_path])
        except Exception:
            pass  # File might not exist yet

        client.storage.from_("resumes").upload(
            storage_path,
            content,
            file_options={"content-type": file.content_type},
        )
    except Exception as exc:
        logger.error("Storage upload failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"File upload failed: {exc}")

    # Update profile with file path
    db().table("profiles").update({"resume_file_path": storage_path}).eq("id", user.user_id).execute()

    # Parse the resume
    try:
        parsed = await parse_resume_file(content, file_ext)
        # Store parsed data in profile
        db().table("profiles").update(
            {"resume_parsed_data": parsed.model_dump()}
        ).eq("id", user.user_id).execute()
    except Exception as exc:
        logger.warning("Resume parsing failed: %s", exc)
        parsed = None

    return {
        "message": "Resume uploaded successfully",
        "file_path": storage_path,
        "parsed": parsed.model_dump() if parsed else None,
    }


@router.post("/parse", response_model=ResumeParseResponse)
async def parse_resume(file: UploadFile = File(...), user: CurrentUser = None):
    """
    Parse a resume file and return structured data without storing.
    """
    if file.content_type not in ("application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are accepted")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")

    file_ext = "pdf" if "pdf" in file.content_type else "docx"

    try:
        return await parse_resume_file(content, file_ext)
    except Exception as exc:
        logger.error("Resume parsing failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Resume parsing failed: {exc}")


@router.get("/templates")
def get_templates():
    """List available resume templates."""
    # Import inside handler so it never depends on module-level reload state.
    from app.utils.resume_pdf import list_templates as templates_fn
    return {"templates": templates_fn()}


@router.post("/generate", response_model=ResumeGenerateResponse)
def generate_resume(data: ResumeGenerateRequest, user: CurrentUser):
    """
    Generate an ATS-optimized resume as PDF.

    Uses the user's profile data + a specific job description
    to create a tailored resume.
    """
    # Fetch user profile
    profile = db().table("profiles").select("*").eq("id", user.user_id).single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Fetch user data
    skills = db().table("user_skills").select("*").eq("user_id", user.user_id).execute()
    education = db().table("user_education").select("*").eq("user_id", user.user_id).order("start_date", desc=True).execute()
    experience = db().table("user_experience").select("*").eq("user_id", user.user_id).order("start_date", desc=True).execute()
    projects = db().table("user_projects").select("*").eq("user_id", user.user_id).order("created_at", desc=True).execute()
    certifications = db().table("user_certifications").select("*").eq("user_id", user.user_id).execute()

    # Fetch job if specified
    job_data = None
    if data.job_id:
        job_result = db().table("jobs").select("*").eq("id", data.job_id).single().execute()
        job_data = job_result.data

    # Build resume context (handle NULL DB values gracefully)
    ctx = ResumeContext(
        name=profile.data.get("full_name") or "",
        email=profile.data.get("email") or "",
        phone=profile.data.get("phone") or "",
        location=f"{profile.data.get('city') or ''}, {profile.data.get('country') or ''}".strip(", "),
        linkedin=profile.data.get("linkedin_url") or "",
        github=profile.data.get("github_url") or "",
        portfolio=profile.data.get("portfolio_url") or "",
        skills=[s.get("skill_name", "") for s in (skills.data or [])],
        experience=[
            {
                "title": e.get("title") or "",
                "company": e.get("company") or "",
                "location": e.get("location") or "",
                "description": e.get("description") or "",
                "technologies": e.get("technologies") or [],
                "dates": f"{e.get('start_date', '') or ''} - {e.get('end_date', '') or 'Present'}",
            }
            for e in (experience.data or [])
        ],
        projects=[
            {
                "title": p.get("title") or "",
                "description": p.get("description") or "",
                "technologies": p.get("technologies") or [],
            }
            for p in (projects.data or [])
        ],
        education=[
            {
                "institution": e.get("institution") or "",
                "degree": e.get("degree") or "",
                "field_of_study": e.get("field_of_study") or "",
                "start_date": str(e.get("start_date")) if e.get("start_date") else "",
                "end_date": str(e.get("end_date")) if e.get("end_date") else "",
            }
            for e in (education.data or [])
        ],
        certifications=[
            {
                "name": c.get("name") or "",
                "issuing_organization": c.get("issuing_organization") or "",
                "issue_date": str(c.get("issue_date")) if c.get("issue_date") else "",
            }
            for c in (certifications.data or [])
        ],
        title=job_data.get("title", "") if job_data else (data.custom_job_description or "")[:60],
    )

    # Generate PDF using FPDF2
    try:
        pdf_bytes = generate_ats_resume_pdf(ctx, template=data.template_name)
    except Exception as exc:
        logger.error("PDF generation failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {exc}")

    pdf_url = None
    if pdf_bytes:
        pdf_filename = f"{user.user_id}/generated/{uuid.uuid4().hex[:8]}.pdf"
        try:
            db().storage.from_("generated-pdfs").upload(
                pdf_filename,
                pdf_bytes,
                file_options={"content-type": "application/pdf"},
            )
            pdf_url = pdf_filename
        except Exception as exc:
            logger.warning("PDF upload failed: %s", exc)

    # Store record
    record = {
        "user_id": user.user_id,
        "job_id": data.job_id,
        "template_name": data.template_name,
        "resume_data": ctx.__dict__,
        "pdf_file_path": pdf_url,
    }

    result = db().table("generated_resumes").insert(record).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save generated resume")

    row = result.data[0]
    return {
        "id": row["id"],
        "template_name": row["template_name"],
        "match_score": row.get("match_score"),
        "optimization_notes": row.get("optimization_notes"),
        "pdf_url": pdf_url,
        "tex_content": None,
        "created_at": row["created_at"],
    }


@router.get("/generated")
def list_generated(user: CurrentUser):
    """List all generated resumes for the current user."""
    result = (
        db()
        .table("generated_resumes")
        .select("id, template_name, match_score, pdf_file_path, created_at")
        .eq("user_id", user.user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"items": result.data or []}


@router.get("/generated/{resume_id}/download")
def download_resume(resume_id: str, user: CurrentUser):
    """Get download URL for a generated resume PDF."""
    result = (
        db()
        .table("generated_resumes")
        .select("pdf_file_path, tex_content")
        .eq("id", resume_id)
        .eq("user_id", user.user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Resume not found")

    pdf_path = result.data.get("pdf_file_path")
    if not pdf_path:
        # Return .tex content if PDF was not generated
        return {
            "type": "tex",
            "content": result.data.get("tex_content", ""),
        }

    # Generate signed URL
    try:
        url = db().storage.from_("generated-pdfs").create_signed_url(pdf_path, 3600)
        return {"type": "pdf", "url": url.get("signedURL", "")}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate download URL: {exc}")
