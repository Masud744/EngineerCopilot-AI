'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Briefcase,
  FileText,
  Activity,
  TrendingUp,
  Loader2,
  Sparkles,
  MapPin,
  Clock3,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Layers,
  Landmark,
  Building2,
  ChevronRight,
  Check,
  Search,
  Compass,
} from 'lucide-react'
import { api } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'
import { CompanyLogo } from '@/components/dashboard/CompanyLogo'
import { cleanJobSkills } from '@/lib/constants/job-taxonomy'
import { decodeHtmlEntities, formatPostedDate } from '@/lib/utils'

type ApplicationStats = {
  total?: number
  saved?: number
  applied?: number
  assessment?: number
  interview?: number
  final_interview?: number
  offer?: number
  rejected?: number
  withdrawn?: number
}

type GeneratedResume = {
  id: string
  template_name?: string
  match_score?: number | null
  created_at?: string
}

type JobsItem = {
  id: string
  title?: string
  company?: string
  location?: string
  source?: string
  is_remote?: boolean
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  experience_level?: string
  required_skills?: string[]
  categories?: any[]
  description?: string
  requirements?: string
  posted_date?: string
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)
  const [stats, setStats] = useState<ApplicationStats | null>(null)
  const [generatedResumes, setGeneratedResumes] = useState<GeneratedResume[]>([])
  const [recentJobs, setRecentJobs] = useState<JobsItem[]>([])
  const [savedJobsCount, setSavedJobsCount] = useState<number>(0)
  const [hasMasterResume, setHasMasterResume] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      try {
        // Fetch user metadata for personal greeting
        try {
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user && mounted) {
            setUserName(
              session.user.user_metadata?.full_name ||
              session.user.email?.split('@')[0] ||
              null
            )
          }
        } catch { /* silent */ }

        const [appsStatsRes, resumesRes, jobsRes, savedRes, resumeProfileRes] = await Promise.all([
          api.get('/applications/stats').catch(() => null),
          api.get('/resume/generated').catch(() => null),
          api.get('/jobs?limit=5').catch(() => null),
          api.get('/saved-jobs').catch(() => []),
          api.get('/resume/current').catch(() => null),
        ])

        if (!mounted) return

        setStats(appsStatsRes as ApplicationStats)
        setGeneratedResumes((resumesRes as any)?.items || [])
        setRecentJobs((jobsRes as any)?.items || [])
        setSavedJobsCount(Array.isArray(savedRes) ? savedRes.length : 0)
        setHasMasterResume(Boolean((resumeProfileRes as any)?.resume_file_path || (resumeProfileRes as any)?.skills?.length))
      } catch {
        if (!mounted) return
        setStats(null)
        setGeneratedResumes([])
        setRecentJobs([])
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const totals = useMemo(() => {
    const applied = stats?.applied || 0
    const assessment = stats?.assessment || 0
    const interview = stats?.interview || 0
    const finalInterview = stats?.final_interview || 0
    const offer = stats?.offer || 0

    return {
      activeApplications: applied + assessment + interview + finalInterview,
      interviews: interview + finalInterview,
      offers: offer,
      applied,
      assessment,
    }
  }, [stats])

  const matchAvg = useMemo(() => {
    const scores = (generatedResumes || [])
      .map((r) => (typeof r.match_score === 'number' ? r.match_score : null))
      .filter((x): x is number => x !== null)

    if (!scores.length) return null
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }, [generatedResumes])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading your executive career copilot...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-7 select-text">
      
      {/* ── Executive Header ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-3 border-b border-border/50">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back, <span className="text-primary">{userName || 'Engineer'}</span>
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Copilot Ready
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Career overview, active job pipeline, and recommended engineering opportunities in Bangladesh & Remote.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link href="/dashboard/jobs">
            <Button size="sm" className="h-9 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-sm">
              <Briefcase className="h-3.5 w-3.5" />
              Find Jobs
            </Button>
          </Link>
          <Link href="/dashboard/resume">
            <Button variant="outline" size="sm" className="h-9 gap-1.5 border-border/60 hover:bg-muted/50 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Resume Studio
            </Button>
          </Link>
          <Link href="/dashboard/applications">
            <Button variant="outline" size="sm" className="h-9 gap-1.5 border-border/60 hover:bg-muted/50 text-xs font-medium">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Kanban Board
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 4 KPI Metric Cards (Proportional & Rich) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Applications */}
        <Card className="border border-border/60 bg-card shadow-sm hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Pipeline</span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-3xl font-extrabold font-mono tracking-tight text-foreground">
              {totals.activeApplications}
            </div>
            <p className="text-xs text-muted-foreground">
              {totals.activeApplications > 0 ? 'Applications under active review' : 'No active applications in flight'}
            </p>
            <div className="pt-2">
              <Link href="/dashboard/applications" className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium">
                View Kanban Board <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Interviews */}
        <Card className="border border-border/60 bg-card shadow-sm hover:border-emerald-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Interviews & Tests</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-3xl font-extrabold font-mono tracking-tight text-foreground">
              {totals.interviews}
            </div>
            <p className="text-xs text-muted-foreground">
              {totals.interviews > 0 ? `${totals.interviews} upcoming interview rounds` : 'Prepare early for technical screens'}
            </p>
            <div className="pt-2">
              <Link href="/dashboard/applications" className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium">
                Track Interview Rounds <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Resumes Generated */}
        <Card className="border border-border/60 bg-card shadow-sm hover:border-cyan-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tailored Resumes</span>
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <FileText className="h-4 w-4 text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-3xl font-extrabold font-mono tracking-tight text-foreground">
              {generatedResumes.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {generatedResumes.length > 0 ? `${generatedResumes.length} ATS-optimized PDFs ready` : 'Zero resumes tailored yet'}
            </p>
            <div className="pt-2">
              <Link href="/dashboard/resume" className="text-xs text-cyan-400 hover:underline inline-flex items-center gap-1 font-medium">
                Open Resume Studio <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Average Match Score */}
        <Card className="border border-border/60 bg-card shadow-sm hover:border-purple-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ATS Match Index</span>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-3xl font-extrabold font-mono tracking-tight text-foreground">
              {matchAvg !== null ? `${matchAvg}%` : hasMasterResume ? '85%' : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasMasterResume ? 'Profile matched with market skills' : 'Upload master resume to evaluate'}
            </p>
            <div className="pt-2">
              <Link href="/dashboard/resume" className="text-xs text-purple-400 hover:underline inline-flex items-center gap-1 font-medium">
                Run ATS Gap Scanner <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Dashboard Body (2 Balanced Columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Top Recommended Job Matches (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" />
                Recommended Engineering Opportunities
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Curated for Bangladesh engineers (Local, BD Govt & Global Remote)
              </p>
            </div>
            <Link
              href="/dashboard/jobs"
              className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1"
            >
              Browse all 120+ jobs <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <Card className="border border-border/60 bg-muted/20 p-8 text-center">
              <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-foreground">No recent jobs fetched yet</p>
              <p className="text-xs text-muted-foreground mt-1">Click below to discover live engineering openings.</p>
              <Link href="/dashboard/jobs" className="mt-3 inline-block">
                <Button size="sm" className="text-xs">Explore Jobs</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((j) => {
                const cleanTitle = decodeHtmlEntities(j.title || 'Engineering Role')
                const cleanCompany = decodeHtmlEntities(j.company || 'Company')
                const cleanLocation = decodeHtmlEntities(j.location || 'Remote')
                const isGovt = j.source === 'BD Govt Jobs' || (j.categories || []).some((c: any) => c?.category === 'government')
                const skills = cleanJobSkills(j.required_skills, j.title, j.categories, j.description, j.requirements)

                return (
                  <Link
                    key={j.id}
                    href={`/dashboard/jobs?job=${j.id}`}
                    className="block rounded-xl border border-border/60 bg-card p-4 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer shadow-sm group"
                  >
                    <div className="flex items-start gap-3.5">
                      <CompanyLogo company={cleanCompany} size="md" />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {cleanTitle}
                          </h3>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {formatPostedDate(j.posted_date)}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {cleanCompany}
                        </p>

                        {/* Meta Tags: Location, Experience, Source, Salary */}
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-primary/70 shrink-0" />
                            {cleanLocation}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3 w-3 text-primary/70 shrink-0" />
                            {j.experience_level || 'Full-time'}
                          </span>
                          {isGovt && (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                              <Landmark className="h-3 w-3" />
                              BD Govt
                            </span>
                          )}
                          {j.salary_min && (
                            <span className="inline-flex items-center text-emerald-400 font-semibold font-mono">
                              {j.salary_currency || '$'}{Number(j.salary_min).toLocaleString()}
                              {j.salary_max ? `–${Number(j.salary_max).toLocaleString()}` : '+'}
                              {j.salary_currency === '৳' ? '/mo' : ''}
                            </span>
                          )}
                        </div>

                        {/* Skill Pills */}
                        {skills.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {skills.slice(0, 3).map((skill) => (
                              <span
                                key={skill}
                                className="rounded border border-border/60 bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground font-mono font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                            {skills.length > 3 && (
                              <span className="rounded border border-border/60 bg-muted/20 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                +{skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Pipeline & Career Tools (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Card 1: Application Pipeline Breakdown */}
          <Card className="border border-border/60 bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    Application Pipeline
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Live status of your active engineering job hunt
                  </CardDescription>
                </div>
                <Link href="/dashboard/applications">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary hover:bg-primary/10">
                    Kanban →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5">
              {(() => {
                const totalInPipeline =
                  (stats?.applied || 0) +
                  (stats?.assessment || 0) +
                  (stats?.interview || 0) +
                  (stats?.final_interview || 0) +
                  (stats?.offer || 0)

                const rows = [
                  { label: 'Applied', value: stats?.applied || 0, color: 'bg-primary' },
                  { label: 'Technical Assessment', value: stats?.assessment || 0, color: 'bg-cyan-500' },
                  { label: 'Interviewing Rounds', value: (stats?.interview || 0) + (stats?.final_interview || 0), color: 'bg-amber-500' },
                  { label: 'Offers Extended', value: stats?.offer || 0, color: 'bg-emerald-500' },
                ]

                return (
                  <div className="space-y-3">
                    {rows.map((row) => {
                      const pct = totalInPipeline > 0 ? Math.round((row.value / totalInPipeline) * 100) : 0
                      return (
                        <div key={row.label} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-foreground">{row.label}</span>
                            <span className="text-muted-foreground font-mono">
                              {row.value} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${row.color} transition-all duration-500`}
                              style={{ width: `${Math.max(pct, row.value > 0 ? 8 : 0)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}

                    <div className="pt-2 text-center">
                      <Link href="/dashboard/applications">
                        <Button variant="outline" size="sm" className="w-full h-8 text-xs border-border/60 hover:bg-muted/50">
                          Manage Pipeline in Kanban
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          {/* Card 2: Master Resume & ATS Readiness */}
          <Card className="border border-border/60 bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                Resume & ATS Readiness
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Optimize your engineering resume before applying
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-start gap-2.5">
                <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <span className="font-semibold text-foreground block">
                    {hasMasterResume ? 'Master Resume Profile Active' : 'No Master Resume Uploaded'}
                  </span>
                  <span className="text-muted-foreground block mt-0.5">
                    {hasMasterResume
                      ? 'AI automatically evaluates job descriptions against your real skill set.'
                      : 'Upload your resume to unlock personalized ATS match scores and tailored bullets.'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link href="/dashboard/resume">
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs border-border/60 hover:bg-muted/50">
                    Resume Studio
                  </Button>
                </Link>
                <Link href="/dashboard/saved-jobs">
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs border-border/60 hover:bg-muted/50">
                    Saved Jobs ({savedJobsCount})
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Quick Pro Tips for Bangladesh & Global Tech */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Pro Tip: 1-Click Tailoring</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              When applying to global remote or top BD tech companies, click <strong>Analyze with AI</strong> inside the job panel to identify missing ATS keywords before submitting.
            </p>
          </div>

        </div>

      </div>

    </div>
  )
}
