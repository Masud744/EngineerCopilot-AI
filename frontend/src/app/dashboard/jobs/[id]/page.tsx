'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Building2, MapPin, DollarSign, ExternalLink, CalendarDays, CheckCircle2, AlertTriangle, BriefcaseBusiness } from 'lucide-react';
import Link from 'next/link';

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        // Fetch Job Details and Match Analysis simultaneously (if using the /match endpoint, it returns both!)
        // Our backend POST /match returns { job, match }
        const res = await api.post(`/jobs/match?job_id=${params.id}`);
        if (res && res.job) {
          setJob(res.job);
          setMatchData(res.match);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load job details. You might need to complete your profile first.');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchJobDetails();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-8">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Oops!</h2>
        <p className="text-muted-foreground mt-2">{error || "Job not found"}</p>
        <Button onClick={() => router.push('/dashboard/jobs')} className="mt-6">
          Back to Jobs
        </Button>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
    if (score >= 50) return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
    return 'bg-red-500/10 border-red-500/20 text-red-500';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-8">
      {/* Back Button */}
      <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Job Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <CardTitle className="text-3xl font-bold">{job.title}</CardTitle>
                  <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-4 mt-3">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Building2 className="w-4 h-4" /> {job.company}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> {job.location || 'Remote'}
                    </span>
                    {job.salary_min && (
                      <span className="flex items-center gap-1.5 text-green-500 font-medium">
                        <DollarSign className="w-4 h-4" />
                        {job.salary_currency || '$'}{job.salary_min.toLocaleString()} - {job.salary_max ? job.salary_max.toLocaleString() : '+'}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4" />
                      {new Date(job.posted_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {job.is_remote && (
                  <Badge variant="secondary" className="bg-sky-500/10 text-sky-500 border-sky-500/20">Remote</Badge>
                )}
                {job.categories && job.categories.map((c: any) => (
                  <Badge key={c.category} variant="secondary" className="bg-primary/10 text-primary">
                    {c.category.replace('_', ' ').toUpperCase()}
                  </Badge>
                ))}
                <Badge variant="outline" className="capitalize text-muted-foreground">Source: {job.source}</Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Description Card */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: job.description.replace(/\n/g, '<br/>') }}
              />
            </CardContent>
          </Card>
          
          {/* Required Skills */}
          {job.required_skills && job.required_skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Required Skills / Keywords</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {job.required_skills.map((skill: string) => (
                  <Badge key={skill} variant="outline" className="text-sm py-1">
                    {skill}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Matching Engine */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <Card className="border-primary/20 shadow-sm bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <BriefcaseBusiness className="w-5 h-5 text-primary" />
                Match Analysis
              </CardTitle>
              <CardDescription>
                How well your profile matches this role
              </CardDescription>
            </CardHeader>
            
            {matchData ? (
              <CardContent className="space-y-6">
                {/* Overall Score */}
                <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-xl border border-border/50">
                  <div className={`text-5xl font-black ${getScoreColor(matchData.overall_score)}`}>
                    {matchData.overall_score}%
                  </div>
                  <div className="text-sm font-medium text-muted-foreground mt-2 uppercase tracking-wider">
                    Overall Match
                  </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium">Skills Match</span>
                      <span className="font-bold">{matchData.skill_match}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${matchData.skill_match}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium">Projects & Experience</span>
                      <span className="font-bold">{matchData.project_match}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${matchData.project_match}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium">Location Fit</span>
                      <span className="font-bold">{matchData.location_match}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${matchData.location_match}%` }} />
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div className="pt-4 border-t border-border/50 space-y-3">
                  <h4 className="text-sm font-semibold">AI Insights</h4>
                  <ul className="space-y-2">
                    {matchData.explanation.map((exp: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2 text-muted-foreground">
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getScoreColor(matchData.overall_score)}`} />
                        <span className="leading-tight">{exp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Apply Button */}
                <div className="pt-2">
                  <a
                    href={job.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-transparent bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80 disabled:pointer-events-none disabled:opacity-50"
                  >
                    Apply on {job.source} <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </div>
              </CardContent>
            ) : (
              <CardContent className="text-center py-6 text-muted-foreground">
                <p>Complete your profile to see your match score.</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/profile')}>
                  Update Profile
                </Button>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
