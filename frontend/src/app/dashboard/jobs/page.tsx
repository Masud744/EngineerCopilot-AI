'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { JobCard } from '@/components/dashboard/JobCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Loader2,
  Search,
  RefreshCw,
  BriefcaseBusiness,
  Globe,
  MapPin,
  Filter,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  TrendingUp,
  BookmarkCheck,
} from 'lucide-react';
import { CustomJobAnalyzeResponse } from '@/types/job';

interface SourceInfo {
  source: string;
  count?: number;
}

const DEFAULT_SOURCES: SourceInfo[] = [
  { source: 'BD Govt Jobs', count: 49 },
  { source: 'Bdjobs', count: 97 },
  { source: 'LinkedIn', count: 173 },
  { source: 'Jobicy', count: 48 },
  { source: 'NextJobz', count: 5 },
  { source: 'WeWorkRemotely', count: 33 },
  { source: 'RemoteOK', count: 39 },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<'all' | 'bd' | 'remote' | 'govt'>('all');
  const [allSources, setAllSources] = useState<SourceInfo[]>(DEFAULT_SOURCES);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  // Instant Job Analyzer State
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [selectedDbJobId, setSelectedDbJobId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [customLocation, setCustomLocation] = useState('Remote');
  const [customDesc, setCustomDesc] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [analysisResult, setAnalysisResult] = useState<CustomJobAnalyzeResponse | null>(null);
  const [analyzerError, setAnalyzerError] = useState<string | null>(null);

  const handleSelectDbJob = (jobId: string) => {
    setSelectedDbJobId(jobId);
    if (!jobId) {
      setCustomTitle('');
      setCustomCompany('');
      setCustomLocation('Remote');
      setCustomDesc('');
      setCustomUrl('');
      return;
    }
    const target = jobs.find((j) => j.id === jobId);
    if (target) {
      setCustomTitle(target.title || '');
      setCustomCompany(target.company || '');
      setCustomLocation(target.location || 'Remote');
      setCustomDesc(target.description || target.requirements || '');
      setCustomUrl(target.apply_url || '');
    }
  };

  const fetchSources = async () => {
    try {
      const data = await api.get<SourceInfo[]>('/jobs/sources');
      if (data && Array.isArray(data) && data.length > 0) {
        setAllSources(data.filter((s) => s.source && s.source !== 'Custom'));
      }
    } catch {
      /* fallback to DEFAULT_SOURCES */
    }
  };

  const fetchJobs = async (
    loc: 'all' | 'bd' | 'remote' | 'govt' = locationFilter,
    src: string | null = sourceFilter,
    query: string = search
  ) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params: Record<string, any> = { limit: 120 };
      if (src) {
        params.source = src;
      } else if (loc === 'bd') {
        params.location = 'bangladesh';
      } else if (loc === 'remote') {
        params.remote_only = true;
      } else if (loc === 'govt') {
        params.source = 'BD Govt Jobs';
      }
      if (query.trim()) {
        params.keyword = query.trim();
      }

      const response = await api.get('/jobs', params);
      if (response && response.items) {
        setJobs(response.items);
      } else {
        setJobs([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch jobs:', error);
      setErrorMsg('Could not load jobs from server. Click retry to try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchSavedIds();
    fetchSources();
  }, []);

  const handleLocationFilter = (newLoc: 'all' | 'bd' | 'remote' | 'govt') => {
    setLocationFilter(newLoc);
    const targetSource = newLoc === 'govt' ? 'BD Govt Jobs' : sourceFilter;
    if (newLoc === 'govt') {
      setSourceFilter('BD Govt Jobs');
    }
    fetchJobs(newLoc, targetSource, search);
  };

  const handleSourceFilter = (newSrc: string | null) => {
    const nextSrc = sourceFilter === newSrc ? null : newSrc;
    setSourceFilter(nextSrc);
    if (nextSrc === 'BD Govt Jobs') {
      setLocationFilter('govt');
    } else if (locationFilter === 'govt' && nextSrc !== null) {
      setLocationFilter('all');
    }
    const nextLoc = locationFilter === 'govt' && nextSrc !== 'BD Govt Jobs' ? 'all' : locationFilter;
    fetchJobs(nextLoc, nextSrc, search);
  };

  const fetchSavedIds = async () => {
    try {
      const data = await api.get('/saved-jobs');
      setSavedJobIds(new Set((data || []).map((item: any) => item.job_id)));
    } catch {
      /* ignore if not logged in */
    }
  };

  const handleSaveToggle = async (jobId: string) => {
    const isCurrentlySaved = savedJobIds.has(jobId);
    try {
      if (isCurrentlySaved) {
        const data = await api.get('/saved-jobs');
        const savedItem = (data || []).find((item: any) => item.job_id === jobId);
        if (savedItem) {
          await api.delete(`/saved-jobs/${savedItem.id}`);
        }
        setSavedJobIds((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
      } else {
        await api.post('/saved-jobs', { job_id: jobId });
        setSavedJobIds((prev) => new Set(prev).add(jobId));
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const data = await api.post('/jobs/sync');
      setSyncResult(data);
      // Wait briefly for background ingestion, then refresh
      setTimeout(async () => {
        await fetchJobs(locationFilter, sourceFilter, search);
        await fetchSources();
        setSyncing(false);
      }, 2500);
    } catch (error: any) {
      console.error('Failed to sync jobs:', error);
      setSyncResult({ status: 'error', message: 'Failed to trigger job sync' });
      setSyncing(false);
    }
  };

  const handleAnalyzeJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customDesc.trim()) {
      setAnalyzerError('Please enter both Job Title and Job Description.');
      return;
    }

    setAnalyzing(true);
    setAnalyzerError(null);
    setAnalysisStep('1/3: Extracting technical requirements & role domain...');

    const timer1 = setTimeout(() => {
      setAnalysisStep('2/3: Comparing skills & experience with Master Resume...');
    }, 900);

    const timer2 = setTimeout(() => {
      setAnalysisStep('3/3: Evaluating ATS compatibility & score breakdown...');
    }, 1800);

    try {
      const result = await api.post<CustomJobAnalyzeResponse>('/jobs/analyze', {
        title: customTitle.trim(),
        company: customCompany.trim() || 'External Company',
        location: customLocation.trim() || 'Remote',
        description: customDesc.trim(),
        apply_url: customUrl.trim() || undefined,
        save_to_jobs: true,
      });
      setAnalysisResult(result);
      if (result.job_id) {
        setSavedJobIds((prev) => new Set(prev).add(result.job_id!));
      }
    } catch (err: any) {
      console.error('Job analysis failed:', err);
      setAnalyzerError(err?.message || 'Failed to analyze job. Please ensure you are logged in and profile is set up.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setAnalyzing(false);
      setAnalysisStep('');
    }
  };

  // Filtering
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !search ||
      job.title?.toLowerCase().includes(search.toLowerCase()) ||
      job.company?.toLowerCase().includes(search.toLowerCase()) ||
      job.location?.toLowerCase().includes(search.toLowerCase());

    const matchesSource = !sourceFilter || job.source === sourceFilter;

    let matchesLocation = true;
    if (locationFilter === 'bd') {
      const loc = (job.location || '').toLowerCase();
      matchesLocation =
        loc.includes('bangladesh') ||
        loc.includes('bd') ||
        loc.includes('dhaka') ||
        loc.includes('chittagong') ||
        loc.includes('chattogram') ||
        loc.includes('sylhet') ||
        loc.includes('rajshahi') ||
        loc.includes('khulna') ||
        loc.includes('mymensingh') ||
        loc.includes('gazipur') ||
        loc.includes('bogra');
    } else if (locationFilter === 'remote') {
      matchesLocation = job.is_remote === true;
    } else if (locationFilter === 'govt') {
      matchesLocation =
        job.source === 'BD Govt Jobs' ||
        (job.categories || job.job_categories || []).some(
          (c: any) => c.category === 'government'
        );
    }

    return matchesSearch && matchesSource && matchesLocation;
  });

  // Client Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 9;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sourceFilter, locationFilter]);

  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <BriefcaseBusiness className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Find & Analyze Jobs</h1>
            <p className="text-xs text-muted-foreground">
              Discover opportunities or paste any external job description to check your ATS match score.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setShowAnalyzer((prev) => !prev)}
            className="bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90 text-primary-foreground shadow-sm"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {showAnalyzer ? 'Hide Analyzer' : '⚡ Analyze Any Job (LinkedIn / JD)'}
          </Button>

          <Button onClick={handleSync} disabled={syncing} variant="outline">
            {syncing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Jobs
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sync Banner Notification */}
      {syncResult && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{syncResult.message}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSyncResult(null)} className="h-6 w-6 p-0">
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* ── Instant Job Analyzer Panel ── */}
      {showAnalyzer && (
        <Card className="border-primary/30 shadow-lg bg-card/90 backdrop-blur animate-in fade-in slide-in-from-top-3 duration-300 select-text">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-cyan-500" />
                  Instant Job Analyzer & ATS Matcher
                </CardTitle>
                <CardDescription>
                  Select any active job from our database or paste custom job requirements to get an instant match evaluation.
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowAnalyzer(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 select-text">
            <form onSubmit={handleAnalyzeJob} className="space-y-4">
              {/* Quick Select from Database */}
              <div className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <BriefcaseBusiness className="w-3.5 h-3.5 text-primary" />
                    Quick Fill from Current Jobs:
                  </label>
                  {selectedDbJobId && (
                    <button
                      type="button"
                      onClick={() => handleSelectDbJob('')}
                      className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                    >
                      Clear & Write Custom
                    </button>
                  )}
                </div>
                <select
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  value={selectedDbJobId}
                  onChange={(e) => handleSelectDbJob(e.target.value)}
                >
                  <option value="">-- Choose from active jobs (or type custom role below) --</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.source === 'BD Govt Jobs' ? '[🏛️ GOVT] ' : `[${j.source || 'Active'}] `}
                      {j.title} — {j.company} ({j.location || 'Remote'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Job Title *
                  </label>
                  <Input
                    placeholder="e.g. Senior Backend Engineer"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Company (optional)
                  </label>
                  <Input
                    placeholder="e.g. TechCorp / Brain Station 23"
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Location
                  </label>
                  <Input
                    placeholder="e.g. Remote / Dhaka, BD"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Job Description & Requirements *
                </label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[140px] font-mono text-xs select-text"
                  placeholder="Paste the full job post requirements, responsibilities, and qualifications here..."
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  required
                />
              </div>

              {/* Progress step bar during analysis */}
              {analyzing && analysisStep && (
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{analysisStep}</span>
                  </div>
                  <div className="h-1.5 w-full bg-primary/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-pulse w-3/4" />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                <Input
                  className="sm:w-1/2 text-xs"
                  placeholder="Application Link (optional): https://linkedin.com/jobs/..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />

                <Button
                  type="submit"
                  disabled={analyzing}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[180px]"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Fit...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze Match Score
                    </>
                  )}
                </Button>
              </div>

              {analyzerError && (
                <div className="text-xs text-rose-500 bg-rose-500/10 p-2.5 rounded-md flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{analyzerError}</span>
                </div>
              )}
            </form>

            {/* Analysis Results Display */}
            {analysisResult && (
              <div className="mt-6 border-t border-border/50 pt-5 space-y-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-card border border-border/60">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {analysisResult.title}
                      <span className="text-xs font-normal text-muted-foreground">
                        at {analysisResult.company} ({analysisResult.location})
                      </span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ATS Compatibility Analysis based on your profile
                    </p>
                  </div>

                  <div className="mt-3 sm:mt-0 flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-black text-primary">
                        {analysisResult.match.overall_score}%
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Overall Match
                      </div>
                    </div>

                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg border ${
                        analysisResult.match.overall_score >= 75
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : analysisResult.match.overall_score >= 50
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                      }`}
                    >
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>
                </div>

                {/* Score Dimensions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg border bg-muted/20">
                    <span className="text-muted-foreground block text-[11px]">Skill Fit</span>
                    <span className="font-bold text-sm">{analysisResult.match.skill_match}%</span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-muted/20">
                    <span className="text-muted-foreground block text-[11px]">Project Relevance</span>
                    <span className="font-bold text-sm">{analysisResult.match.project_match}%</span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-muted/20">
                    <span className="text-muted-foreground block text-[11px]">Location Match</span>
                    <span className="font-bold text-sm">{analysisResult.match.location_match}%</span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-muted/20">
                    <span className="text-muted-foreground block text-[11px]">Education Fit</span>
                    <span className="font-bold text-sm">{analysisResult.match.education_match}%</span>
                  </div>
                </div>

                {/* Matching vs Missing Skills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Matching Skills */}
                  <div className="p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Matching Candidate Skills ({analysisResult.match.matching_skills?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.match.matching_skills && analysisResult.match.matching_skills.length > 0 ? (
                        analysisResult.match.matching_skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs"
                          >
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No direct keyword overlap detected.</span>
                      )}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div className="p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5">
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 block mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Missing Skills to Highlight ({analysisResult.match.missing_skills?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.match.missing_skills && analysisResult.match.missing_skills.length > 0 ? (
                        analysisResult.match.missing_skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className="border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs"
                          >
                            + {skill}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Great! No major critical skills missing.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recruiter Insights */}
                {analysisResult.match.explanation && analysisResult.match.explanation.length > 0 && (
                  <div className="p-3.5 rounded-lg border bg-muted/30">
                    <span className="text-xs font-semibold text-foreground block mb-1.5">
                      Recruiter Evaluation & Feedback:
                    </span>
                    <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
                      {analysisResult.match.explanation.map((exp, idx) => (
                        <li key={idx}>{exp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Link href={`/dashboard/resume`}>
                    <Button size="sm" className="bg-primary text-primary-foreground">
                      Tailor Resume for this Job
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>

                  <Link href="/dashboard/saved-jobs">
                    <Button size="sm" variant="outline">
                      <BookmarkCheck className="w-3.5 h-3.5 mr-1.5 text-primary" />
                      View in Saved Jobs
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles by title, company, or location (Press Enter to search)..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                fetchJobs(locationFilter, sourceFilter, search);
              }
            }}
          />
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />

          {/* Location & Domain Filter */}
          <Badge
            variant={locationFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => handleLocationFilter('all')}
          >
            All
          </Badge>
          <Badge
            variant={locationFilter === 'bd' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => handleLocationFilter('bd')}
          >
            <MapPin className="w-3 h-3 mr-1" /> Bangladesh Tech
          </Badge>
          <Badge
            variant={locationFilter === 'remote' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => handleLocationFilter('remote')}
          >
            <Globe className="w-3 h-3 mr-1" /> Remote Worldwide
          </Badge>
          <Badge
            variant={locationFilter === 'govt' ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors ${
              locationFilter === 'govt'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold'
                : 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
            }`}
            onClick={() => handleLocationFilter('govt')}
          >
            🏛️ Govt Jobs (সরকারি চাকরি)
          </Badge>

          <span className="text-muted-foreground text-xs mx-2">|</span>

          {/* Source Filter */}
          <Badge
            variant={!sourceFilter ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => handleSourceFilter(null)}
          >
            All Sources
          </Badge>
          {allSources.map((item) => {
            const src = item.source;
            const isGovt = src === 'BD Govt Jobs';
            const isBdjobs = src === 'Bdjobs';
            const isLinkedIn = src === 'LinkedIn';
            const isJobicy = src === 'Jobicy';
            const isNextJobz = src === 'NextJobz';
            const isWWR = src === 'WeWorkRemotely';
            const isRemoteOK = src === 'RemoteOK';
            const isSelected = sourceFilter === src;
            return (
              <Badge
                key={src}
                variant={isSelected ? 'default' : 'outline'}
                className={`cursor-pointer transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? isGovt
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold'
                      : isBdjobs
                      ? 'bg-orange-600 hover:bg-orange-500 text-white font-semibold'
                      : isLinkedIn
                      ? 'bg-blue-600 hover:bg-blue-500 text-white font-semibold'
                      : 'font-semibold'
                    : isGovt
                    ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                    : isBdjobs
                    ? 'border-orange-500/40 text-orange-400 hover:bg-orange-500/10'
                    : isLinkedIn
                    ? 'border-blue-500/40 text-blue-400 hover:bg-blue-500/10'
                    : isJobicy
                    ? 'border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10'
                    : isNextJobz
                    ? 'border-purple-500/40 text-purple-400 hover:bg-purple-500/10'
                    : isWWR
                    ? 'border-rose-500/40 text-rose-400 hover:bg-rose-500/10'
                    : isRemoteOK
                    ? 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
                    : ''
                }`}
                onClick={() => handleSourceFilter(src)}
              >
                {isGovt && <span>🏛️</span>}
                <span>{src}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-[10px] px-1 rounded-full ${
                      isSelected
                        ? 'bg-black/25 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </Badge>
            );
          })}

          <span className="text-muted-foreground text-xs ml-auto">
            {filteredJobs.length} jobs available
          </span>
        </div>
      </div>

      {/* Job Grid / Error / Empty States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading active engineering roles...</p>
        </div>
      ) : errorMsg ? (
        <div className="text-center py-12 border rounded-xl bg-destructive/5 border-destructive/20 p-6">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <h3 className="font-semibold text-foreground">Could not load jobs</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">{errorMsg}</p>
          <Button onClick={() => fetchJobs()} size="sm" variant="outline">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
          </Button>
        </div>
      ) : filteredJobs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isSaved={savedJobIds.has(job.id)}
                onSaveToggle={handleSaveToggle}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6 pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-xl p-8">
          <BriefcaseBusiness className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="text-base font-semibold">No jobs match your current search</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-md mx-auto">
            {jobs.length === 0
              ? "Your local database has not been synced yet. Click 'Sync Jobs' to fetch active roles from RemoteOK and job boards."
              : 'Try clearing your search keyword or switching between Remote and Bangladesh filters.'}
          </p>
          <div className="flex justify-center gap-2">
            {search || sourceFilter || locationFilter !== 'all' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSourceFilter(null);
                  setLocationFilter('all');
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button size="sm" onClick={handleSync} disabled={syncing}>
                {syncing ? 'Syncing...' : 'Sync Jobs Now'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
