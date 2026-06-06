# EngineerCopilot AI — Run Frontend & Backend + Fix Dashboard

## Plan (Dashboard)

- [x] Inspect existing dashboard pages/layout.
- [x] Confirm layout issue: sidebar has **Settings** link but no route/page.
- [ ] Update `frontend/src/app/dashboard/layout.tsx` to remove Settings menu item.
- [ ] Update `frontend/src/app/dashboard/page.tsx` to fetch real dashboard numbers + lists from backend.
  - [ ] Call `/applications` + `/applications/stats`
  - [ ] Call `/resume/generated` (or relevant endpoint) for resume count
  - [ ] Call `/jobs?limit=...` and/or recommendations for recent matches
- [ ] Run both apps and verify dashboard renders correctly.
