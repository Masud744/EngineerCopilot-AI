"""
EngineerCopilot AI — Job Scraper Service.

Fetches engineering jobs from multiple public sources:
  1. LinkedIn (public guest API)
  2. RemoteOK API
  3. Arbeitnow API

RULES:
  - Bangladesh: ALL jobs (onsite + remote + hybrid)
  - Outside Bangladesh: ONLY remote jobs
  - ONLY engineering/tech jobs (strict title filter)
"""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from urllib.parse import quote_plus

import httpx
from bs4 import BeautifulSoup

from app.utils.supabase import get_supabase_admin
from app.services.job_classifier import classify_job

logger = logging.getLogger(__name__)

# ─── Engineering title keywords (must match at least one) ───
ENGINEERING_TITLE_KEYWORDS = [
    "engineer", "developer", "programmer", "architect",
    "devops", "sre", "mlops", "data scientist", "data analyst",
    "machine learning", "deep learning", "ai ", "ai/ml",
    "embedded", "firmware", "iot", "robotics",
    "computer vision", "edge ai", "full stack", "fullstack",
    "backend", "frontend", "software", "cloud",
    "cybersecurity", "security analyst", "penetration",
    "data engineer", "platform engineer", "infra",
    "sysadmin", "system admin", "linux admin",
    "technical lead", "tech lead", "cto", "vp engineering",
]

# ─── Non-engineering titles to reject ───────────────────────
REJECT_TITLE_KEYWORDS = [
    "nurse", "doctor", "medical", "health coach", "wellness",
    "teacher", "professor", "tutor", "instructor",
    "sales", "marketing", "recruiter", "hr ", "human resource",
    "accountant", "finance", "legal", "lawyer", "attorney",
    "driver", "janitor", "cleaner", "cook", "chef",
    "handyman", "handyperson", "plumber", "electrician",
    "executive assistant", "administrative", "receptionist",
    "customer service", "customer support", "call center",
    "civil service", "government clerk", "designer",
    "copywriter", "content writer", "social media",
    "warehouse", "retail", "cashier",
]


def is_engineering_job(title: str) -> bool:
    """Check if a job title is an engineering/tech role."""
    t = title.lower().strip()
    
    # Reject non-engineering titles first
    for reject in REJECT_TITLE_KEYWORDS:
        if reject in t:
            return False
    
    # Must match at least one engineering keyword
    for kw in ENGINEERING_TITLE_KEYWORDS:
        if kw in t:
            return True
    
    return False


def is_bangladesh_job(location: str) -> bool:
    """Check if a job is located in Bangladesh."""
    loc = location.lower()
    return any(kw in loc for kw in [
        "bangladesh", "dhaka", "chittagong", "chattogram", "sylhet",
        "rajshahi", "khulna", "rangpur", "barisal", "mymensingh",
        "comilla", "gazipur", "narayanganj", "bd",
    ])


def should_keep_job(title: str, location: str, is_remote: bool) -> bool:
    """
    Filter logic:
      - Must be an engineering job
      - If in Bangladesh: keep (any type)
      - If outside Bangladesh: keep ONLY if remote
    """
    if not is_engineering_job(title):
        return False
    
    if is_bangladesh_job(location):
        return True  # BD job — keep regardless of type
    
    if is_remote:
        return True  # International remote — keep
    
    return False  # International onsite — reject


# ─── LinkedIn searches ──────────────────────────────────────
LINKEDIN_SEARCHES = [
    # Bangladesh (all types)
    {"keywords": "Software Engineer", "location": "Bangladesh", "remote": False},
    {"keywords": "IoT Engineer", "location": "Bangladesh", "remote": False},
    {"keywords": "Embedded Systems Engineer", "location": "Bangladesh", "remote": False},
    {"keywords": "AI ML Engineer", "location": "Bangladesh", "remote": False},
    {"keywords": "Backend Developer", "location": "Bangladesh", "remote": False},
    {"keywords": "Full Stack Developer", "location": "Bangladesh", "remote": False},
    {"keywords": "Data Engineer", "location": "Bangladesh", "remote": False},
    {"keywords": "DevOps Engineer", "location": "Bangladesh", "remote": False},
    # Remote worldwide
    {"keywords": "Embedded Engineer", "location": "", "remote": True},
    {"keywords": "Robotics Engineer", "location": "", "remote": True},
    {"keywords": "Computer Vision Engineer", "location": "", "remote": True},
    {"keywords": "Edge AI Engineer", "location": "", "remote": True},
    {"keywords": "IoT Developer Remote", "location": "", "remote": True},
    {"keywords": "Firmware Engineer Remote", "location": "", "remote": True},
    {"keywords": "Machine Learning Engineer Remote", "location": "", "remote": True},
]


async def fetch_linkedin_job_description(client: httpx.AsyncClient, url: str) -> str:
    """Fetch full job description from LinkedIn job detail page."""
    try:
        detail_headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }
        resp = await client.get(url, headers=detail_headers, timeout=10)
        if resp.status_code != 200:
            return ""
        soup = BeautifulSoup(resp.text, "html.parser")
        desc_el = soup.find("div", class_="description__text")
        if not desc_el:
            desc_el = soup.find("div", class_="show-more-less-html__markup")
        if desc_el:
            return desc_el.get_text(separator="\n", strip=True)
    except Exception:
        pass
    return ""


async def fetch_linkedin_jobs() -> list[dict]:
    """Scrape LinkedIn's public guest job search API."""
    jobs = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    }

    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        for search in LINKEDIN_SEARCHES:
            for start_offset in [0, 25, 50]:  # Fetch 3 pages (75 jobs) per search
                try:
                    kw = quote_plus(search["keywords"])
                    loc = quote_plus(search.get("location", ""))
                    f_WT = "&f_WT=2" if search.get("remote") else ""
                    url = (
                        f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/"
                        f"search?keywords={kw}&location={loc}{f_WT}&start={start_offset}"
                    )

                    resp = await client.get(url, headers=headers)
                    if resp.status_code != 200:
                        logger.warning(f"LinkedIn {resp.status_code} for '{search['keywords']}' at start={start_offset}")
                        break  # Stop pagination if error

                    soup = BeautifulSoup(resp.text, "html.parser")
                    cards = soup.find_all("li")
                    
                    if not cards:
                        break  # No more jobs

                    for card in cards:
                        try:
                            title_el = card.find("h3", class_="base-search-card__title")
                            company_el = card.find("h4", class_="base-search-card__subtitle")
                            location_el = card.find("span", class_="job-search-card__location")
                            link_el = card.find("a", class_="base-card__full-link")
                            time_el = card.find("time")

                            if not title_el or not link_el:
                                continue

                            title = title_el.get_text(strip=True)
                            company = company_el.get_text(strip=True) if company_el else "Unknown"
                            location = location_el.get_text(strip=True) if location_el else ""
                            apply_url = link_el.get("href", "").split("?")[0]
                            posted = time_el.get("datetime", "") if time_el else ""

                            if not apply_url:
                                continue

                            title = re.sub(
                                r"\s*[-–—|]\s*(job\s*id|id|ref|req|requisition)[:\s#]*[\w\-]+",
                                "",
                                title,
                                flags=re.IGNORECASE,
                            ).strip()
                            title = re.sub(r"\s*[-–—|]\s*" + re.escape(company) + r".*$", "", title, flags=re.IGNORECASE).strip()

                            is_remote = search.get("remote", False) or "remote" in location.lower()

                            if not should_keep_job(title, location, is_remote):
                                continue

                            jobs.append({
                                "title": title,
                                "company": company,
                                "location": location or ("Remote" if is_remote else ""),
                                "is_remote": is_remote,
                                "remote_type": "remote" if is_remote else ("hybrid" if "hybrid" in location.lower() else "onsite"),
                                "description": f"{title} at {company}. Location: {location or 'Remote'}.",
                                "apply_url": apply_url,
                                "source": "LinkedIn",
                                "source_job_id": apply_url.split("/")[-1] if "/" in apply_url else "",
                                "posted_date": posted or datetime.now(timezone.utc).isoformat(),
                                "required_skills": [],
                            })
                        except Exception:
                            continue

                except Exception as e:
                    logger.error(f"LinkedIn error for '{search['keywords']}': {e}")

    # Deduplicate
    seen = set()
    unique = []
    for j in jobs:
        if j["apply_url"] not in seen:
            seen.add(j["apply_url"])
            unique.append(j)

    logger.info(f"LinkedIn: {len(unique)} engineering jobs (BD + remote)")
    return unique


async def fetch_remoteok_jobs() -> list[dict]:
    """Fetch remote engineering jobs from RemoteOK API."""
    url = "https://remoteok.com/api"
    jobs = []
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url, headers={"User-Agent": "EngineerCopilotAI/1.0"})
            response.raise_for_status()
            data = response.json()

            for item in data[1:]:
                title = item.get("position", "")
                tags = [t.lower() for t in item.get("tags", [])]

                # ★ Must be engineering job
                if not is_engineering_job(title):
                    continue

                jobs.append({
                    "title": title,
                    "company": item.get("company", ""),
                    "location": item.get("location", "Remote"),
                    "is_remote": True,
                    "remote_type": "remote",
                    "description": item.get("description", ""),
                    "apply_url": item.get("url", ""),
                    "source": "RemoteOK",
                    "source_job_id": str(item.get("id", "")),
                    "posted_date": item.get("date", datetime.now(timezone.utc).isoformat()),
                    "required_skills": tags,
                    "salary_min": item.get("salary_min"),
                    "salary_max": item.get("salary_max"),
                    "salary_currency": "USD" if item.get("salary_min") else None,
                })
    except Exception as e:
        logger.error(f"RemoteOK error: {e}")
    logger.info(f"RemoteOK: {len(jobs)} remote engineering jobs")
    return jobs


async def fetch_arbeitnow_jobs() -> list[dict]:
    """Fetch ONLY remote engineering jobs from Arbeitnow."""
    url = "https://www.arbeitnow.com/api/job-board-api"
    jobs = []
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()

            for item in data.get("data", []):
                title = item.get("title", "")
                tags = [t.lower() for t in item.get("tags", [])]
                location = item.get("location", "")
                is_remote = item.get("remote", False)

                # ★ Must be engineering + (BD or remote only)
                if not should_keep_job(title, location, is_remote):
                    continue

                jobs.append({
                    "title": title,
                    "company": item.get("company_name", ""),
                    "location": location,
                    "is_remote": is_remote,
                    "remote_type": "remote" if is_remote else "onsite",
                    "description": item.get("description", ""),
                    "apply_url": item.get("url", ""),
                    "source": "Arbeitnow",
                    "posted_date": datetime.now(timezone.utc).isoformat(),
                    "required_skills": tags,
                })
    except Exception as e:
        logger.error(f"Arbeitnow error: {e}")
    logger.info(f"Arbeitnow: {len(jobs)} engineering jobs (BD + remote only)")
    return jobs


async def sync_jobs() -> dict:
    """Run all scrapers and save to database."""
    logger.info("═══ Starting job sync (BD all + International remote only) ═══")

    linkedin_jobs = await fetch_linkedin_jobs()
    remoteok_jobs = await fetch_remoteok_jobs()
    arbeitnow_jobs = await fetch_arbeitnow_jobs()

    all_jobs = linkedin_jobs + remoteok_jobs + arbeitnow_jobs
    logger.info(
        f"Total: {len(all_jobs)} "
        f"(LinkedIn: {len(linkedin_jobs)}, RemoteOK: {len(remoteok_jobs)}, Arbeitnow: {len(arbeitnow_jobs)})"
    )

    if not all_jobs:
        return {"status": "success", "inserted": 0, "sources": {}, "message": "No engineering jobs found"}

    db = get_supabase_admin()
    inserted_count = 0
    source_counts = {}

    for job in all_jobs:
        try:
            if not job.get("apply_url"):
                continue

            categories = classify_job(
                job["title"], job.get("description", ""), job.get("required_skills", [])
            )

            result = db.table("jobs").upsert(job, on_conflict="apply_url").execute()
            if result.data:
                inserted_count += 1
                job_id = result.data[0]["id"]
                src = job.get("source", "Unknown")
                source_counts[src] = source_counts.get(src, 0) + 1

                for cat, conf in categories:
                    try:
                        db.table("job_categories").insert({
                            "job_id": job_id, "category": cat, "confidence": conf
                        }).execute()
                    except Exception:
                        pass

        except Exception as e:
            if "duplicate key value" not in str(e):
                logger.debug(f"Insert error: {e}")

    logger.info(f"═══ Sync done: {inserted_count} new jobs ═══")
    return {
        "status": "success",
        "fetched": len(all_jobs),
        "inserted": inserted_count,
        "sources": source_counts,
        "message": f"Added {inserted_count} new engineering jobs (BD + Remote)",
    }
