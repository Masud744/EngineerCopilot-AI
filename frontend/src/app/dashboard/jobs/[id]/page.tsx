'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  ExternalLink,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  BriefcaseBusiness,
  Copy,
  Check,
  Sparkles,
  FileText,
  Loader2,
  Landmark,
  Bookmark,
} from 'lucide-react';
import {
  getCategoryLabel,
  getCategoryBadgeClass,
  getSourceBadge,
  cleanJobSkills,
} from '@/lib/constants/job-taxonomy';
import { sanitizeHtml, getScoreColor, getCompanyLogoUrl, formatPostedDate } from '@/lib/utils';
import type { Job, MatchScore } from '@/types/job';

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [matchData, setMatchData] = useState<MatchScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [matchLoading, setMatchLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [imgError, setImgError] = useState(false);

  const [tracking, setTracking] = useState(false);
  const [trackMsg, setTrackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleTrackApplication = async (status: string = 'saved') => {
    setTracking(true);
    setTrackMsg(null);
    try {
      await api.post('/applications', { job_id: params.id as string, status });
      setTrackMsg({
        type: 'success',
        text: `Job ${status === 'applied' ? 'marked as Applied' : 'saved to pipeline'}! Redirecting...`,
      });
      setTimeout(() => router.push('/dashboard/applications'), 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to track application.';
      setTrackMsg({
        type: 'error',
        text: msg.includes('already') ? 'Already tracked! Check your Applications page.' : msg,
      });
    } finally {
      setTracking(false);
    }
  };

  const handleCopyTitle = () => {
    if (job?.title) {
      navigator.clipboard.writeText(job.title);
      setCopiedTitle(true);
      setTimeout(() => setCopiedTitle(false), 2000);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        setError('');

        const jobRes = await api.get<Job>(`/jobs/${params.id}`);
        if (!isMounted) return;
        if (!jobRes || !jobRes.id) {
          setError('Job not found.');
          setLoading(false);
          return;
        }
        setJob(jobRes);
        setLoading(false);

        // Fetch match score in background
        setMatchLoading(true);
        try {
          const matchRes = await api.post<{ match: MatchScore }>(`/jobs/${params.id}/match`);
          if (isMounted && matchRes) {
            setMatchData(matchRes.match || (matchRes as unknown as MatchScore));
          }
        } catch (matchErr) {
          console.warn('Match calculation skipped or failed:', matchErr);
        } finally {
          if (isMounted) setMatchLoading(false);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Failed to load job details.';
        console.error('Failed to load job details:', err);
        setError(msg);
        setLoading(false);
      }
    };

    if (params.id) fetchJobDetails();
    return () => { isMounted = false; };
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-8">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center select-text">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Oops!</h2>
        <p className="text-muted-foreground mt-2">{error || 'Job not found'}</p>
        <Button onClick={() => router.push('/dashboard/jobs')} className="mt-6">
          Back to Jobs
        </Button>
      </div>
    );
  }

  const cleanSkills = cleanJobSkills(job.required_skills, job.title, job.categories);
  const logoUrl = getCompanyLogoUrl(job.company);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-8 select-text">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="pl-0 text-muted-foreground hover:text-foreground cursor-pointer"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Job Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card className="select-text">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {/* Company Logo */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-secondary/60 overflow-hidden">
                    {logoUrl && !imgError ? (
                      <img
                        src={logoUrl}
                        alt={job.company}
                        className="h-full w-full object-contain p-2"
                        onError={() => setImgError(true)}
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-xl font-bold text-primary/80">
                        {(job.company || job.title || 'J').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight select-text">
                        {job.title}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyTitle}
                        title="Copy Job Title"
                        className="h-8 px-2 text-muted-foreground hover:text-foreground"
                      >
                        {copiedTitle ? (
                          <Check className="w-4 h-4 text-white" strokeWidth={1.75} />
                        ) : (
                          <Copy className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
                        )}
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-4 mt-2 select-text">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <Building2 className="w-4 h-4 text-zinc-400" strokeWidth={1.75} /> {job.company}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-muted-foreground/80" strokeWidth={1.75} /> {job.location || 'Remote'}
                      </span>
                      {job.salary_min && (
                        <span className="flex items-center gap-1.5 text-zinc-200 font-medium font-mono">
                          <DollarSign className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
                          {job.salary_currency || '$'}
                          {job.salary_min.toLocaleString()} –{' '}
                          {job.salary_max ? job.salary_max.toLocaleString() : '+'}
                        </span>
                      )}
                      {job.posted_date && (
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="w-4 h-4 text-muted-foreground/70" strokeWidth={1.75} />
                          {formatPostedDate(job.posted_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {job.is_remote && (
                  <Badge variant="secondary" className="bg-white/[0.05] text-zinc-300 border border-white/10 text-xs font-medium">
                    Remote
                  </Badge>
                )}
                {job.categories &&
                  job.categories
                    .filter((c) => (c.confidence ?? 0) >= 0.3)
                    .slice(0, 3)
                    .map((c) => (
                      <Badge
                        key={c.category}
                        variant="secondary"
                        className={`text-xs font-medium border ${getCategoryBadgeClass(c.category)}`}
                      >
                        {getCategoryLabel(c.category)}
                      </Badge>
                    ))}
                {(() => {
                  const srcBadge = getSourceBadge(job.source);
                  return (
                    <Badge
                      variant="outline"
                      className={`capitalize font-medium flex items-center gap-1 ${srcBadge.className}`}
                    >
                      {job.source === 'BD Govt Jobs' && <Landmark className="w-3 h-3 text-zinc-300" strokeWidth={1.75} />}
                      {srcBadge.label}
                    </Badge>
                  );
                })()}
              </div>
            </CardHeader>
          </Card>

          {/* Government Circular Alert */}
          {job.source === 'BD Govt Jobs' && (
            <div className="p-4 rounded-xl border border-white/20 bg-white/[0.04] text-zinc-300 flex items-start gap-3">
              <Landmark className="w-5 h-5 text-white flex-shrink-0 mt-0.5" strokeWidth={1.75} />
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-white">
                  গণপ্রজাতন্ত্রী বাংলাদেশ সরকার — সরকারি নিয়োগ বিজ্ঞপ্তি
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  এটি বাংলাদেশ সরকারের মন্ত্রণালয়, অধিদপ্তর, স্বায়ত্তশাসিত বা সরকারি প্রতিষ্ঠানের নিয়োগ সার্কুলার। নিয়োগের শর্তাবলী, শিক্ষাগত যোগ্যতা, বয়সসীমা ও নির্দেশনাবলী দেখতে নিচে অথবা সাইডবারের লিংকে ক্লিক করে মূল সার্কুলার ও Teletalk পোর্টালে যান।
                </p>
              </div>
            </div>
          )}

          {/* Description Card — XSS-safe with DOMPurify */}
          <Card className="select-text">
            <CardHeader>
              <CardTitle className="text-lg">Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed select-text [&_strong]:text-foreground [&_h3]:text-foreground"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.description || 'No description provided.') }}
              />
            </CardContent>
          </Card>

          {/* Required Skills */}
          {cleanSkills.length > 0 && (
            <Card className="select-text">
              <CardHeader>
                <CardTitle className="text-lg">Required Technical Skills & Competencies</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {cleanSkills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs py-1 px-2.5 font-mono select-text bg-muted/30 border-border/70 hover:border-primary/50 transition-colors">
                    {skill}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Matching Engine & Quick Actions */}
        <div className="space-y-6 lg:sticky lg:top-24 select-text">
          <Card className="border-primary/20 shadow-sm bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BriefcaseBusiness className="w-5 h-5 text-primary" />
                ATS Match Analysis
              </CardTitle>
              <CardDescription>
                Compatibility evaluated against your Master Resume
              </CardDescription>
            </CardHeader>

            {matchLoading ? (
              <CardContent className="py-8 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Evaluating resume compatibility & skills...</p>
              </CardContent>
            ) : matchData ? (
              <CardContent className="space-y-6">
                {/* Overall Score */}
                <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-xl border border-border/50">
                  <div className={`text-5xl font-black ${getScoreColor(matchData.overall_score || 0)}`}>
                    {matchData.overall_score || 0}%
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground mt-2 uppercase tracking-wider">
                    Overall Candidate Fit
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="space-y-3 text-xs">
                  {[
                    { label: 'Skills Match', value: matchData.skill_match || 0 },
                    { label: 'Projects & Experience', value: matchData.project_match || 0 },
                    { label: 'Location Fit', value: matchData.location_match || 0 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-foreground">{item.label}</span>
                        <span className="font-bold">{item.value}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Matching Skills */}
                {matchData.matching_skills && matchData.matching_skills.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <span className="text-xs font-semibold flex items-center gap-1.5 text-white">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={1.75} />
                      Matching Skills ({matchData.matching_skills.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {matchData.matching_skills.map((s) => (
                        <Badge key={s} variant="secondary" className="bg-white/10 text-white border border-white/20 text-[11px] font-medium">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Skills */}
                {matchData.missing_skills && matchData.missing_skills.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <span className="text-xs font-semibold flex items-center gap-1.5 text-zinc-400">
                      <AlertTriangle className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.75} />
                      Missing Skills ({matchData.missing_skills.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {matchData.missing_skills.map((s) => (
                        <Badge key={s} variant="secondary" className="bg-white/[0.04] text-zinc-400 border border-white/10 text-[11px]">
                          + {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Insights */}
                {matchData.explanation && matchData.explanation.length > 0 && (
                  <div className="pt-2 border-t border-border/50 space-y-2">
                    <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      AI Match Insights
                    </h4>
                    <ul className="space-y-1.5">
                      {matchData.explanation.map((exp, i) => (
                        <li key={i} className="text-xs flex items-start gap-2 text-muted-foreground">
                          <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${getScoreColor(matchData.overall_score || 0)}`} />
                          <span className="leading-tight">{exp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tailor Resume */}
                <div className="pt-2 border-t border-border/50">
                  <Link href="/dashboard/resume" className="block">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <FileText className="w-3.5 h-3.5 mr-1.5 text-primary" />
                      Tailor Resume in Resume Studio
                    </Button>
                  </Link>
                </div>
              </CardContent>
            ) : (
              <CardContent className="text-center py-6 space-y-3">
                <FileText className="w-8 h-8 text-muted-foreground/60 mx-auto" />
                <p className="text-xs text-muted-foreground">
                  Upload your Master Resume to see instant ATS match score and skill gaps.
                </p>
                <Link href="/dashboard/resume">
                  <Button variant="outline" size="sm" className="mt-2 text-xs">
                    Upload Resume
                  </Button>
                </Link>
              </CardContent>
            )}

            {/* Action Buttons */}
            <CardContent className="pt-0 space-y-3">
              {trackMsg && (
                <div
                  className={`p-3 rounded-lg text-xs border ${
                    trackMsg.type === 'success'
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-red-950/30 border-red-800 text-red-300'
                  }`}
                >
                  {trackMsg.text}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => handleTrackApplication('saved')}
                  disabled={tracking}
                >
                  <Bookmark className="w-3.5 h-3.5 mr-1.5" />
                  {tracking ? 'Saving...' : 'Save to Board'}
                </Button>
                <Button
                  className="flex-1 text-xs bg-primary text-primary-foreground"
                  onClick={() => handleTrackApplication('applied')}
                  disabled={tracking}
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  {tracking ? 'Tracking...' : 'Mark Applied'}
                </Button>
              </div>

              {job.apply_url && (
                <a
                  href={job.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex h-9 w-full items-center justify-center rounded-lg px-4 text-xs font-semibold transition-all ${
                    job.source === 'BD Govt Jobs'
                      ? 'bg-white text-black hover:bg-zinc-200 font-medium'
                      : 'border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                >
                  {job.source === 'BD Govt Jobs' ? 'মূল সার্কুলার ও আবেদন লিংক' : `Apply on ${job.source}`}{' '}
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
