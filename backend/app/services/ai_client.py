"""
EngineerCopilot AI — AI Client Wrapper.

Provides lightweight, robust HTTP-based interfaces to Gemini and Groq API
without heavy external SDK dependencies.
"""

from __future__ import annotations

import logging
import json
import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


async def call_gemini_api(prompt: str, system_instruction: str | None = None) -> str:
    """
    Call the Gemini 1.5 Flash API directly using HTTP POST.

    This avoids heavy external SDK dependencies and guarantees compatibility.
    """
    settings = get_settings()
    api_key = settings.gemini_api_key

    if not api_key:
        logger.warning("Gemini API key is not configured. Falling back to mock response.")
        return "[Mock Response: Gemini API key not set. Please configure GEMINI_API_KEY in your .env file.]"

    # API endpoint for Gemini 1.5 Flash
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

    headers = {"Content-Type": "application/json"}

    # Build contents payload
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [
                {"text": system_instruction}
            ]
        }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code != 200:
                logger.error(
                    "Gemini API returned status code %d: %s",
                    response.status_code,
                    response.text,
                )
                raise RuntimeError(f"Gemini API error: {response.text}")

            result = response.json()
            candidates = result.get("candidates", [])
            if not candidates:
                raise ValueError("No candidates returned from Gemini API")

            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            if not parts:
                raise ValueError("No content parts returned from Gemini API")

            text = parts[0].get("text", "")
            return text.strip()

    except Exception as e:
        logger.error("Failed to connect to Gemini API: %s", e)
        raise e


def generate_cover_letter_text(
    job_title: str,
    company_name: str,
    job_description: str,
    user_context: dict,
) -> str:
    """
    Synchronous wrapper to generate cover letter text.
    Uses asyncio.run inside or standard synchronous requests if needed.
    """
    import asyncio

    prompt = f"""
    Create a highly professional, tailored cover letter for the following position:
    - Job Title: {job_title}
    - Company Name: {company_name}
    - Job Description: {job_description}

    Here is the applicant's profile data:
    - Full Name: {user_context.get('name', 'Applicant')}
    - Email: {user_context.get('email', '')}
    - Skills: {', '.join(user_context.get('skills', []))}
    - Core Experience: {json.dumps(user_context.get('experience', []))}
    - Key Projects: {json.dumps(user_context.get('projects', []))}
    - Raw Resume Text: {user_context.get('resume_text', '')[:1000]}

    Instructions:
    1. Structure the letter with formal headers, introduction, 2 body paragraphs, and a polite call to action/conclusion.
    2. Write in a confident, professional, and humble tone.
    3. Tailor the applicant's experience and projects directly to the responsibilities in the job description.
    4. Highlight 2-3 key skills relevant to the role.
    5. Avoid generic placeholders like "[Insert Date]". Output only the completed letter text ready to copy.
    """

    system_instruction = "You are a Principal Technical Recruiter and Career Coach. You write world-class, premium cover letters that pass ATS checkers and impress engineering hiring managers."

    # Call async function in sync context
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    return loop.run_until_complete(call_gemini_api(prompt, system_instruction))


async def optimize_resume_data(
    user_context: dict,
    job_description: str,
) -> str:
    """
    Use Gemini to suggest resume improvements and keywords to add.
    """
    prompt = f"""
    Analyze the user's profile against this job description and suggest optimizations.

    Job Description:
    {job_description}

    User Skills:
    {', '.join(user_context.get('skills', []))}

    User Experience:
    {json.dumps(user_context.get('experience', []))}

    Identify:
    1. Missing keywords from the job description.
    2. 3 actionable bullet point improvements for the experience section.
    3. A matching score (0 to 100) based on requirements.

    Return the result in a clean, professional markdown format.
    """

    system_instruction = "You are an ATS optimization system. Analyze resume data and suggest specific, legal, keyword optimizations to improve matching."

    return await call_gemini_api(prompt, system_instruction)
