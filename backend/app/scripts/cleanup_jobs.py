"""
One-time cleanup script: Remove non-engineering jobs from the database.
Run with: python -m app.scripts.cleanup_jobs
"""
from datetime import datetime, timezone, timedelta

from app.utils.supabase import get_supabase_admin

RETENTION_DAYS = 14

REJECT_KEYWORDS = [
    "nurse", "doctor", "medical", "health coach", "wellness",
    "teacher", "professor", "tutor", "instructor",
    "sales", "marketing", "recruiter", "hr ", "human resource",
    "accountant", "finance", "legal", "lawyer",
    "driver", "janitor", "cleaner", "cook", "chef",
    "handyman", "handyperson", "plumber",
    "executive assistant", "administrative", "receptionist",
    "customer service", "customer support", "call center",
    "civil service", "government clerk",
    "copywriter", "content writer", "social media",
    "warehouse", "retail", "cashier",
    "member support", "coordinator united states",
]

BD_KEYWORDS = [
    "bangladesh", "dhaka", "chittagong", "chattogram", "sylhet",
    "rajshahi", "khulna", "rangpur", "barisal",
]

def main(older_than_days: int = RETENTION_DAYS):
    db = get_supabase_admin()
    
    # Fetch all jobs
    result = db.table("jobs").select("id, title, location, is_remote, source, fetched_at").execute()
    all_jobs = result.data or []
    print(f"Total jobs in DB: {len(all_jobs)}")
    
    cutoff = datetime.now(timezone.utc) - timedelta(days=older_than_days)
    
    to_delete = []
    for job in all_jobs:
        title = (job.get("title") or "").lower()
        location = (job.get("location") or "").lower()
        is_remote = job.get("is_remote", False)
        fetched_at = (job.get("fetched_at") or "")[:10]
        
        try:
            fetched_date = datetime.fromisoformat(fetched_at).replace(tzinfo=timezone.utc) if fetched_at else None
        except ValueError:
            fetched_date = None
        
        is_stale = fetched_date is not None and fetched_date < cutoff
        is_junk = any(kw in title for kw in REJECT_KEYWORDS)
        
        is_bd = any(kw in location for kw in BD_KEYWORDS)
        is_intl_onsite = not is_bd and not is_remote
        
        if is_stale or is_junk or is_intl_onsite:
            to_delete.append(job["id"])
            reason = "stale" if is_stale else ("junk" if is_junk else "intl_onsite")
            print(f"  DELETE [{reason}]: [{job.get('source','')}] {job.get('title','')[:60]}".encode("ascii", "replace").decode())
    
    print(f"\nDeleting {len(to_delete)} non-qualifying jobs...")
    
    # Delete in batches
    for jid in to_delete:
        try:
            db.table("job_categories").delete().eq("job_id", jid).execute()
            db.table("jobs").delete().eq("id", jid).execute()
        except Exception as e:
            print(f"  Error deleting {jid}: {e}")
    
    remaining = db.table("jobs").select("id", count="exact").execute()
    print(f"Done! Remaining jobs: {remaining.count}")

if __name__ == "__main__":
    main()
