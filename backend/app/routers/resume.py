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
from app.models.application import (
    ResumeGenerateRequest,
    ResumeGenerateResponse,
    ResumeParseResponse,
    BulletEnhanceRequest,
    BulletEnhanceResponse,
)
from app.services.resume_parser import parse_resume_file
from app.utils.resume_pdf import generate_ats_resume_pdf, ResumeContext

from app.utils.supabase import get_supabase_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/resume", tags=["resume"])

db = get_supabase_admin

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/upload")
async def upload_resume(user: CurrentUser, file: UploadFile = File(...)):
    """
    Upload a resume file (PDF or DOCX).
    Stores the file in Supabase Storage and parses it.
    """
    # Validate file type with both content_type and extension fallback
    filename = (file.filename or "").lower()
    content_type = (file.content_type or "").lower()
    is_pdf = filename.endswith(".pdf") or "pdf" in content_type
    is_docx = filename.endswith(".docx") or "word" in content_type or "officedocument" in content_type

    if not (is_pdf or is_docx):
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are accepted (.pdf, .docx)",
        )

    # Read file content
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")

    file_ext = "pdf" if is_pdf else "docx"
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
        # Continue even if storage fails so parsing still works

    # Update profile with file path
    db().table("profiles").update({"resume_file_path": storage_path}).eq("id", user.user_id).execute()

    # Parse the resume
    try:
        parsed = await parse_resume_file(content, file_ext)
        # Store parsed data in profile
        db().table("profiles").update(
            {"resume_parsed_data": parsed.model_dump()}
        ).eq("id", user.user_id).execute()

        # Auto-sync parsed skills to user_skills table if user has none
        if parsed and parsed.skills:
            for skill_name in parsed.skills[:30]:
                try:
                    db().table("user_skills").upsert({
                        "user_id": user.user_id,
                        "skill_name": skill_name.strip()
                    }, on_conflict="user_id,skill_name").execute()
                except Exception:
                    pass
    except Exception as exc:
        logger.warning("Resume parsing failed: %s", exc)
        parsed = None

    return {
        "message": "Resume uploaded successfully",
        "file_path": storage_path,
        "parsed": parsed.model_dump() if parsed else None,
    }


@router.get("/current")
def get_current_resume(user: CurrentUser):
    """Fetch current user's uploaded master resume metadata and parsed content."""
    res = db().table("profiles").select(
        "id, full_name, email, phone, city, country, linkedin_url, github_url, portfolio_url, resume_file_path, resume_parsed_data, updated_at"
    ).eq("id", user.user_id).single().execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile = res.data
    file_path = profile.get("resume_file_path")
    download_url = None
    if file_path:
        try:
            signed = db().storage.from_("resumes").create_signed_url(file_path, 3600)
            download_url = signed.get("signedURL")
        except Exception:
            pass

    return {
        "has_resume": bool(file_path or profile.get("resume_parsed_data")),
        "file_path": file_path,
        "download_url": download_url,
        "parsed": profile.get("resume_parsed_data"),
        "profile": {
            "name": profile.get("full_name"),
            "email": profile.get("email"),
            "phone": profile.get("phone"),
            "location": f"{profile.get('city') or ''}, {profile.get('country') or ''}".strip(", "),
            "linkedin": profile.get("linkedin_url"),
            "github": profile.get("github_url"),
            "portfolio": profile.get("portfolio_url"),
        },
        "updated_at": profile.get("updated_at"),
    }


@router.post("/enhance-bullet", response_model=BulletEnhanceResponse)
async def enhance_bullet_point(data: BulletEnhanceRequest, user: CurrentUser):
    """
    Transform a rough resume bullet point into the high-impact Google XYZ formula:
    'Accomplished [X], as measured by [Y], by doing [Z]'.
    """
    raw_bullet = data.bullet_point.strip()
    if not raw_bullet:
        raise HTTPException(status_code=400, detail="Bullet point cannot be empty")

    prompt = f"""
    You are an elite Silicon Valley Tech Recruiter and Resume Coach.
    A software engineer provided this rough bullet point from their resume:
    "{raw_bullet}"

    Target Role: {data.target_role or "Software Engineer"}
    Target Skills to Highlight: {', '.join(data.target_skills) if data.target_skills else "General engineering best practices"}

    Transform this bullet point using the Google XYZ Formula:
    "Accomplished [X] as measured by [Y], by doing [Z]"

    Guidelines:
    1. Start with a strong action verb (Architected, Engineered, Optimized, Spearheaded, Implemented).
    2. Include realistic engineering metrics (e.g. latency reduced by 35%, throughput increased to 10k RPS, test coverage improved by 40%, cut cloud costs by $2k/mo).
    3. State the technical implementation details (tools, libraries, patterns).
    4. Provide 1 primary recommendation and 2 diverse alternatives.

    Return ONLY a valid JSON object matching this schema:
    {{
      "original_bullet": "{raw_bullet}",
      "optimized_bullet": "<string: best Google XYZ bullet point>",
      "impact_explanation": "<string: 1-2 sentences on why this improves ATS score and catches hiring managers' attention>",
      "alternatives": [
        "<string: alternative option 1>",
        "<string: alternative option 2>"
      ]
    }}
    """

    system_prompt = "You are a professional resume optimization assistant. Return strict JSON only without markdown code fences."

    try:
        from app.ai.manager import get_ai_manager
        manager = get_ai_manager()
        resp = await manager.complete(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.3,
            preferred_provider="gemini",
        )
        content = resp.content.strip()
        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]

        parsed_json = json.loads(content.strip())
        return BulletEnhanceResponse(
            original_bullet=raw_bullet,
            optimized_bullet=parsed_json.get("optimized_bullet", raw_bullet),
            impact_explanation=parsed_json.get("impact_explanation", "Rewritten with strong metrics and actionable verbs."),
            alternatives=parsed_json.get("alternatives", []),
        )
    except Exception as exc:
        logger.error("AI bullet enhancement failed: %s", exc)
        action_verb = "Architected and delivered"
        fallback_bullet = f"{action_verb} {raw_bullet.lower().rstrip('.')}, improving operational efficiency and system reliability by 25%."
        return BulletEnhanceResponse(
            original_bullet=raw_bullet,
            optimized_bullet=fallback_bullet,
            impact_explanation="Reframed with active verbs and quantifiable outcome metrics.",
            alternatives=[
                f"Optimized {raw_bullet.lower().rstrip('.')}, cutting latency and resource overhead by 30%.",
                f"Spearheaded implementation of {raw_bullet.lower().rstrip('.')}, accelerating feature delivery cycle by 2 weeks."
            ],
        )


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
