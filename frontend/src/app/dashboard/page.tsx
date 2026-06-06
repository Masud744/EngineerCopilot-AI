'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, FileText, Activity, TrendingUp, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

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
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ApplicationStats | null>(null)
  const [generatedResumes, setGeneratedResumes] = useState<GeneratedResume[]>([])
  const [recentJobs, setRecentJobs] = useState<JobsItem[]>([])

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      try {
        const [appsStatsRes, resumesRes] = await Promise.all([
          api.get('/applications/stats').then((x: any) => x as ApplicationStats),
          api.get('/resume/generated').then((x: any) => x as any),
        ])

        if (!mounted) return
        setStats(appsStatsRes)
        setGeneratedResumes(resumesRes?.items || [])

        // Recent job matches: backend doesn't expose match history directly,
        // so we show latest jobs from public endpoint.
        const jobsRes = await api.get('/jobs?limit=6')
        if (!mounted) return
        setRecentJobs(jobsRes?.items || [])
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
    const offer = stats?.offer || 0

    return {
      activeApplications: applied + assessment + interview + (stats?.final_interview || 0),
      interviews: interview + (stats?.final_interview || 0),
      offers: offer,
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
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here is an overview of your career progression.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.activeApplications}</div>
            <p className="text-xs text-muted-foreground">Based on your current pipeline</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.interviews}</div>
            <p className="text-xs text-muted-foreground">Upcoming rounds</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resumes Generated</CardTitle>
            <FileText className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generatedResumes.length}</div>
            <p className="text-xs text-muted-foreground">Optimized for ATS</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Match Score Avg</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matchAvg ?? 0}%</div>
            <p className="text-xs text-muted-foreground">Based on generated resumes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 glass-card border-border/50">
          <CardHeader>
            <CardTitle>Recent Job Matches</CardTitle>
            <CardDescription>
              Latest roles from your available sources (use a job to get match analysis).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No jobs found yet.</p>
              ) : (
                recentJobs.slice(0, 3).map((j) => (
                  <div
                    key={j.id}
                    className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <h4 className="font-semibold">{j.title || 'Untitled Job'}</h4>
                      <p className="text-sm text-muted-foreground">
                        {(j.company || 'Unknown')} • {(j.location || (j.is_remote ? 'Remote' : ''))}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-500">View</div>
                      <div className="text-xs text-muted-foreground">Details in Jobs</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 glass-card border-border/50">
          <CardHeader>
            <CardTitle>Application Pipeline</CardTitle>
            <CardDescription>Status of your active job hunt.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Applied', value: stats?.applied || 0, color: 'bg-blue-500', w: '45%' },
                { label: 'Assessment', value: stats?.assessment || 0, color: 'bg-cyan-500', w: '20%' },
                { label: 'Interviewing', value: stats?.interview || 0, color: 'bg-purple-500', w: '30%' },
                { label: 'Offers', value: stats?.offer || 0, color: 'bg-emerald-500', w: '10%' },
              ].map((row) => (
                <div key={row.label} className="flex items-center">
                  <div className="w-full flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{row.label}</span>
                      <span className="text-sm text-muted-foreground">{row.value}</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${row.color} w-[${row.w}]`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

