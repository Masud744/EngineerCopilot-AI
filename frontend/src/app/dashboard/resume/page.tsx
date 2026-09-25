'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Upload,
  FileText,
  Download,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Layers,
  Wand2,
  Search,
  MapPin,
  Mail,
  User,
  ArrowRight,
} from 'lucide-react';
import { SearchableJobCombobox } from '@/components/dashboard/SearchableJobCombobox';
import type { MasterResumeData, BulletEnhanceResponse } from '@/types/application';
import type { CustomJobAnalyzeResponse } from '@/types/job';

const ROLE_PRESETS = [
  'Senior Backend Engineer',
  'Full Stack Developer',
  'DevOps & Cloud Engineer',
  'AI / Machine Learning Engineer',
  'Embedded Systems & IoT Engineer',
  'Data Engineer / ETL',
  'Frontend / React Engineer',
  'System Architect',
  'Cybersecurity Specialist',
  'IT Officer / Assistant Engineer (Govt/Bank)',
];

const SKILL_SUGGESTIONS = [
  'Python',
  'FastAPI',
  'Docker',
  'Kubernetes',
  'PostgreSQL',
  'Redis',
  'AWS',
  'React',
  'Next.js',
  'Kafka',
  'Microservices',
  'CI/CD Pipelines',
  'System Design',
  'GraphQL',
];

type ActiveTab = 'overview' | 'scanner' | 'bullet_optimizer';

export default function ResumeStudioPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Master Resume Data State
  const [resumeData, setResumeData] = useState<MasterResumeData | null>(null);
  const [loadingResume, setLoadingResume] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ATS Scanner State
  const [jobs, setJobs] = useState<{ id: string; title: string; company?: string }[]>([]);
  const [scanMode, setScanMode] = useState<'saved' | 'custom'>('saved');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [customJobTitle, setCustomJobTitle] = useState('');
  const [customJobCompany, setCustomJobCompany] = useState('');
  const [customJobDesc, setCustomJobDesc] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<CustomJobAnalyzeResponse | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Bullet Optimizer State
  const [rawBullet, setRawBullet] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [targetKeywords, setTargetKeywords] = useState('');
  const [optimizing, setOptimizing] = useState(false);
  const [bulletResult, setBulletResult] = useState<BulletEnhanceResponse | null>(null);
  const [bulletError, setBulletError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchCurrentResume();
    fetchAvailableJobs();
  }, []);

  const fetchCurrentResume = async () => {
    setLoadingResume(true);
    try {
      const data = await api.get<MasterResumeData>('/resume/current');
      setResumeData(data);
    } catch (err) {
      console.error('Failed to load current resume:', err);
    } finally {
      setLoadingResume(false);
    }
  };

  const fetchAvailableJobs = async () => {
    try {
      const data = await api.get('/jobs?limit=120');
      setJobs(
        (data?.items || []).map((j: any) => ({
          id: j.id,
          title: j.title,
          company: j.company,
          location: j.location,
          source: j.source,
          is_remote: j.is_remote,
          job_categories: j.job_categories,
          required_skills: j.required_skills,
        }))
      );
    } catch {
      /* ignore */
    }
  };

  const handleAppendSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    const currentList = targetKeywords
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!currentList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      const nextList = [...currentList, trimmed];
      setTargetKeywords(nextList.join(', '));
    }
  };

  const handleUploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadMsg({ type: 'error', text: 'Resume file size cannot exceed 5MB.' });
      e.target.value = '';
      return;
    }

    setUploading(true);
    setUploadMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.post('/resume/upload', formData);
      setUploadMsg({ type: 'success', text: 'Master resume uploaded and parsed successfully!' });
      await fetchCurrentResume();
    } catch (err: any) {
      setUploadMsg({ type: 'error', text: err?.message || 'Resume upload failed. Please ensure you are logged in.' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRunScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setScanning(true);
    setScanError(null);
    setScanResult(null);

    try {
      if (scanMode === 'saved') {
        if (!selectedJobId) {
          setScanError('Please select a job from the list.');
          setScanning(false);
          return;
        }
        const matchData = await api.post<any>(`/jobs/${selectedJobId}/match`);
        const targetJob = jobs.find((j) => j.id === selectedJobId);
        const matchObj = matchData?.match || matchData || {};
        const score = matchObj.overall_score ?? matchData.overall_score ?? 0;
        const matching = matchObj.matching_skills || matchData.matching_skills || [];
        const missing = matchObj.missing_skills || matchData.missing_skills || [];

        setScanResult({
          title: targetJob?.title || 'Selected Job',
          company: targetJob?.company || 'Target Company',
          match: {
            overall_score: score,
            skill_match: matchObj.skill_match ?? matchData.skill_match ?? 0,
            project_match: matchObj.project_match ?? matchData.project_match ?? 0,
            education_match: matchObj.education_match ?? matchData.education_match ?? 0,
            location_match: matchObj.location_match ?? matchData.location_match ?? 0,
            explanation: matchObj.explanation || matchData.explanation || [],
            matching_skills: matching,
            missing_skills: missing,
          },
          matching_skills: matching,
          missing_skills: missing,
        });
        return;
      } else {
        if (!customJobTitle.trim() || !customJobDesc.trim()) {
          setScanError('Job Title and Job Description are required.');
          setScanning(false);
          return;
        }
        const payload = {
          title: customJobTitle.trim(),
          company: customJobCompany.trim() || 'Target Company',
          location: 'Remote',
          description: customJobDesc.trim(),
          save_to_jobs: false,
        };
        const result = await api.post<CustomJobAnalyzeResponse>('/jobs/analyze', payload);
        setScanResult(result);
      }
    } catch (err: any) {
      console.error('ATS scan failed:', err);
      setScanError(err?.message || 'Failed to scan job against master resume. Ensure profile is configured.');
    } finally {
      setScanning(false);
    }
  };

  const handleOptimizeBullet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawBullet.trim()) {
      setBulletError('Please enter a bullet point to optimize.');
      return;
    }

    setOptimizing(true);
    setBulletError(null);
    setBulletResult(null);

    try {
      const skillsArr = targetKeywords
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const result = await api.post<BulletEnhanceResponse>('/resume/enhance-bullet', {
        bullet_point: rawBullet.trim(),
        target_role: targetRole.trim() || undefined,
        target_skills: skillsArr.length > 0 ? skillsArr : undefined,
      });

      setBulletResult(result);
    } catch (err: any) {
      console.error('Bullet optimization failed:', err);
      setBulletError(err?.message || 'Failed to optimize bullet point. Please try again.');
    } finally {
      setOptimizing(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const parsed = resumeData?.parsed;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden select-text space-y-3">
      {/* ── Compact Studio Header (shrink-0) ── */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-white/20 bg-white/10 text-white">
              <FileText className="w-4 h-4" strokeWidth={1.75} />
            </span>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Resume & Career Profile Studio
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Unified candidate profile, master resume storage & AI ATS keyword optimizer
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          {resumeData?.has_resume ? (
            <Badge variant="outline" className="border-white/20 bg-white/10 text-white py-1 px-2.5 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-white" />
              Master Resume Active
            </Badge>
          ) : (
            <Badge variant="outline" className="border-white/20 bg-white/5 text-zinc-400 py-1 px-2.5 text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
              No Resume Uploaded
            </Badge>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleUploadResume}
            disabled={uploading}
          />
          <Button
            size="sm"
            disabled={uploading}
            className="bg-white text-black hover:bg-zinc-200 font-semibold h-8 text-xs shadow-none border-0"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload PDF/DOCX
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Upload Feedback Banner (shrink-0) */}
      {uploadMsg && (
        <div
          className={`shrink-0 p-3 rounded-lg text-xs flex items-center justify-between border ${
            uploadMsg.type === 'success'
              ? 'bg-white/10 border-white/20 text-white'
              : 'bg-zinc-900 border-zinc-700 text-zinc-300'
          }`}
        >
          <span>{uploadMsg.text}</span>
          <button onClick={() => setUploadMsg(null)} className="text-xs hover:underline ml-4 text-zinc-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* ── Main Viewport Split Container (Zero page-level scroll, full width) ── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        {/* ── LEFT RAIL: Profile & Master Resume Rail (lg:col-span-4 xl:col-span-4) ── */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col h-full min-h-0 bg-card border border-border/70 rounded-xl overflow-hidden">
          {/* Rail Header */}
          <div className="p-3 border-b border-border/50 shrink-0 flex items-center justify-between bg-muted/20">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-white" /> Candidate Profile
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">
              {parsed?.skills?.length || 0} skills indexed
            </span>
          </div>

          {/* Rail Scroll Container */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {/* Identity Card */}
            <div className="p-3.5 rounded-lg border border-border/60 bg-muted/20 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <span className="text-base font-bold text-white">
                    {(resumeData?.profile?.name || 'Engineer').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-white truncate">
                    {resumeData?.profile?.name || 'Engineering Candidate'}
                  </h3>
                  {resumeData?.profile?.email && (
                    <p className="text-xs text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 shrink-0" /> {resumeData.profile.email}
                    </p>
                  )}
                  {resumeData?.profile?.location && (
                    <p className="text-xs text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" /> {resumeData.profile.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Quick 4-box metrics grid */}
              <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-border/40 text-center">
                <div className="p-2 rounded bg-background/60 border border-border/50">
                  <p className="text-base font-bold text-white">{parsed?.skills?.length || 0}</p>
                  <p className="text-[9px] text-zinc-400 uppercase font-semibold">Skills</p>
                </div>
                <div className="p-2 rounded bg-background/60 border border-border/50">
                  <p className="text-base font-bold text-white">{parsed?.experience?.length || 0}</p>
                  <p className="text-[9px] text-zinc-400 uppercase font-semibold">Roles</p>
                </div>
                <div className="p-2 rounded bg-background/60 border border-border/50">
                  <p className="text-base font-bold text-white">{parsed?.projects?.length || 0}</p>
                  <p className="text-[9px] text-zinc-400 uppercase font-semibold">Projects</p>
                </div>
                <div className="p-2 rounded bg-background/60 border border-border/50">
                  <p className="text-base font-bold text-white">{parsed?.education?.length || 0}</p>
                  <p className="text-[9px] text-zinc-400 uppercase font-semibold">Edu</p>
                </div>
              </div>
            </div>

            {/* Master Resume File Card */}
            <div className="p-3.5 rounded-lg border border-border/60 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-white" /> Active Master File
                </span>
                {resumeData?.has_resume && (
                  <span className="text-[10px] text-zinc-400 font-mono">Parsed</span>
                )}
              </div>

              {resumeData?.has_resume ? (
                <div className="space-y-2.5">
                  <div className="text-xs text-zinc-300">
                    <p className="font-medium text-white truncate">
                      {resumeData.file_path ? resumeData.file_path.split('/').pop() : 'master_resume.pdf'}
                    </p>
                    {resumeData.updated_at && (
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Last updated: {new Date(resumeData.updated_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    {resumeData.download_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs border-white/20 text-zinc-200 hover:text-white hover:bg-white/10"
                        onClick={() => window.open(resumeData.download_url!, '_blank')}
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Download PDF
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs border-white/20 text-zinc-200 hover:text-white hover:bg-white/10"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-3.5 h-3.5 mr-1.5" /> Re-upload
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-zinc-400">No master resume uploaded yet.</p>
                  <Button
                    size="sm"
                    disabled={uploading}
                    className="bg-white text-black hover:bg-zinc-200 font-semibold h-8 text-xs w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Master Resume
                  </Button>
                </div>
              )}
            </div>

            {/* Education Summary */}
            {parsed?.education && parsed.education.length > 0 && (
              <div className="p-3.5 rounded-lg border border-border/60 bg-muted/20 space-y-2.5">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-white" /> Education
                </span>
                <div className="space-y-2">
                  {parsed.education.map((edu, i) => (
                    <div key={i} className="text-xs border-l-2 border-white/20 pl-2.5 py-0.5">
                      <p className="font-semibold text-white">
                        {edu.degree} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}
                      </p>
                      <p className="text-[11px] text-zinc-400">{edu.institution}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick CTA to ATS Scan */}
            <div className="p-3.5 rounded-lg border border-border/60 bg-white/[0.02] space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-white" /> Optimize for an Application
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Target a specific role to calculate keyword match score and identify missing skills.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveTab('scanner')}
                className="w-full h-8 text-xs border-white/20 text-white hover:bg-white/10 mt-1"
              >
                Open ATS Job Scanner <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* ── RIGHT RAIL: Interactive Studio Workstation (lg:col-span-8 xl:col-span-8) ── */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col h-full min-h-0 bg-card border border-border/70 rounded-xl overflow-hidden">
          {/* Tab Navigation Header */}
          <div className="shrink-0 flex items-center gap-1.5 px-3 py-2 border-b border-border/60 bg-muted/20 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('overview')}
              className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Profile & Technical Skills
            </button>
            <button
              onClick={() => setActiveTab('scanner')}
              className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'scanner'
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Search className="w-3.5 h-3.5" /> ATS Job Scanner
            </button>
            <button
              onClick={() => setActiveTab('bullet_optimizer')}
              className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'bullet_optimizer'
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" /> Bullet Enhancer (XYZ)
            </button>
          </div>

          {/* Tab Workspace Body (Scrollable independently, zero page-level scroll) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-5 select-text">
            {/* ── TAB 1: PROFILE & PARSED SKILLS OVERVIEW ── */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                {loadingResume ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                ) : !resumeData?.has_resume ? (
                  <Card className="border-dashed border-2 border-border/70 bg-card/40">
                    <CardContent className="py-16 text-center">
                      <div className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center mx-auto mb-4 border border-white/20">
                        <FileText className="w-7 h-7" />
                      </div>
                      <h3 className="text-lg font-bold text-white">No Master Resume on File</h3>
                      <p className="text-muted-foreground text-xs max-w-md mx-auto mt-2 leading-relaxed">
                        Upload your existing PDF or DOCX resume. Our parser will extract your real skills, roles, and
                        projects so you can run ATS scans and target keyword gaps.
                      </p>
                      <Button
                        className="mt-5 bg-white text-black hover:bg-zinc-200 font-semibold"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading & Parsing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" /> Upload Your Resume (PDF/DOCX)
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-5">
                    {/* Technical Skills Categorized */}
                    <Card className="border-border/60">
                      <CardHeader className="pb-3 border-b border-border/40">
                        <CardTitle className="text-sm font-semibold flex items-center justify-between">
                          <span className="flex items-center gap-2 text-white">
                            <Sparkles className="w-4 h-4 text-white" /> Extracted Technical Skills
                          </span>
                          <span className="text-xs text-zinc-400 font-mono">
                            {parsed?.skills?.length || 0} skills identified
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        {parsed?.skills && parsed.skills.length > 0 ? (
                          (() => {
                            const groups: { name: string; skills: string[] }[] = [
                              {
                                name: 'Languages & Core',
                                skills: parsed.skills.filter(s => {
                                  const l = s.toLowerCase();
                                  return ['c', 'c++', 'python', 'typescript', 'javascript', 'sql', 'bash', 'go', 'rust', 'html', 'css'].some(k => l === k || l.startsWith(k + ' ') || l.startsWith(k + '/'));
                                })
                              },
                              {
                                name: 'Embedded, IoT & Hardware',
                                skills: parsed.skills.filter(s => {
                                  const l = s.toLowerCase();
                                  return ['esp', 'arduino', 'raspberry', 'rtos', 'lora', 'mqtt', 'uart', 'spi', 'i2c', 'wire', 'sensor', 'motor', 'tinyml', 'hardware', 'eeprom', 'nvs', 'ota', 'isr', 'logic', 'serial'].some(k => l.includes(k));
                                })
                              },
                              {
                                name: 'AI, ML & Frameworks',
                                skills: parsed.skills.filter(s => {
                                  const l = s.toLowerCase();
                                  return ['ai', 'ml', 'pytorch', 'tensorflow', 'scikit', 'opencv', 'yolo', 'onnx', 'mediapipe', 'llm', 'react', 'fastapi', 'tailwind', 'vite', 'chart'].some(k => l.includes(k));
                                })
                              },
                              {
                                name: 'Cloud, Systems & Tools',
                                skills: parsed.skills.filter(s => {
                                  const l = s.toLowerCase();
                                  const matchedOther = ['c', 'c++', 'python', 'typescript', 'javascript', 'sql', 'bash', 'go', 'rust', 'html', 'css'].some(k => l === k || l.startsWith(k + ' ') || l.startsWith(k + '/'))
                                    || ['esp', 'arduino', 'raspberry', 'rtos', 'lora', 'mqtt', 'uart', 'spi', 'i2c', 'wire', 'sensor', 'motor', 'tinyml', 'hardware', 'eeprom', 'nvs', 'ota', 'isr', 'logic', 'serial'].some(k => l.includes(k))
                                    || ['ai', 'ml', 'pytorch', 'tensorflow', 'scikit', 'opencv', 'yolo', 'onnx', 'mediapipe', 'llm', 'react', 'fastapi', 'tailwind', 'vite', 'chart'].some(k => l.includes(k));
                                  return !matchedOther;
                                })
                              }
                            ].filter(g => g.skills.length > 0);

                            return (
                              <div className="space-y-4">
                                {groups.map(group => (
                                  <div key={group.name} className="space-y-2">
                                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                                      {group.name} ({group.skills.length})
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {group.skills.map((skill, i) => (
                                        <span
                                          key={i}
                                          className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-200 font-mono"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()
                        ) : (
                          <p className="text-xs text-zinc-400 italic">No skills extracted.</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Work Experience */}
                    <Card className="border-border/60">
                      <CardHeader className="pb-3 border-b border-border/40">
                        <CardTitle className="text-sm font-semibold flex items-center justify-between">
                          <span className="flex items-center gap-2 text-white">
                            <Briefcase className="w-4 h-4 text-white" /> Work Experience
                          </span>
                          <span className="text-xs text-zinc-400 font-mono">
                            {parsed?.experience?.length || 0} positions
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-3.5">
                        {parsed?.experience && parsed.experience.length > 0 ? (
                          parsed.experience.map((exp, i) => (
                            <div key={i} className="border-l-2 border-white/20 pl-3 py-1">
                              <p className="text-sm font-bold text-white">
                                {exp.title || 'Role'} <span className="text-zinc-400 font-normal">at</span>{' '}
                                {exp.company || 'Company'}
                              </p>
                              {(exp.start_date || exp.end_date) && (
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  {exp.start_date || ''} – {exp.end_date || 'Present'}
                                </p>
                              )}
                              {exp.description && (
                                <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                                  {exp.description}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-zinc-400 italic">No work experience extracted.</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Projects */}
                    <Card className="border-border/60">
                      <CardHeader className="pb-3 border-b border-border/40">
                        <CardTitle className="text-sm font-semibold flex items-center justify-between">
                          <span className="flex items-center gap-2 text-white">
                            <Layers className="w-4 h-4 text-white" /> Projects Showcase
                          </span>
                          <span className="text-xs text-zinc-400 font-mono">
                            {parsed?.projects?.length || 0} projects
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-3.5">
                        {parsed?.projects && parsed.projects.length > 0 ? (
                          parsed.projects.map((proj, i) => (
                            <div key={i} className="border-l-2 border-white/20 pl-3 py-1">
                              <p className="text-sm font-bold text-white">{proj.title || 'Project'}</p>
                              {proj.technologies && proj.technologies.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {proj.technologies.map((t, idx) => (
                                    <span key={idx} className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-zinc-300 font-mono">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {proj.description && (
                                <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">{proj.description}</p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-zinc-400 italic">No projects listed.</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: ATS SCANNER & GAP ANALYSIS ── */}
            {activeTab === 'scanner' && (
              <div className="space-y-5">
                <Card className="border-border/60">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                      <Search className="w-4 h-4 text-white" /> Target Job ATS Scanner & Keyword Gap Analysis
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Compare your uploaded Master Resume with any job posting to evaluate your ATS Match Score and discover
                      missing keywords to add.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {/* Scan Mode Toggle */}
                    <div className="flex gap-4 border-b border-border/50 pb-3">
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-zinc-300">
                        <input
                          type="radio"
                          name="scanMode"
                          checked={scanMode === 'saved'}
                          onChange={() => setScanMode('saved')}
                          className="accent-white"
                        />
                        Select from Job Database
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-zinc-300">
                        <input
                          type="radio"
                          name="scanMode"
                          checked={scanMode === 'custom'}
                          onChange={() => setScanMode('custom')}
                          className="accent-white"
                        />
                        Paste Any Job Description (LinkedIn / BDjobs)
                      </label>
                    </div>

                    {scanMode === 'saved' ? (
                      <div>
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                          Choose Target Job
                        </label>
                        <SearchableJobCombobox
                          jobs={jobs}
                          selectedJobId={selectedJobId}
                          onSelect={(jobId) => setSelectedJobId(jobId)}
                          placeholder="Search active roles by keyword, company, or source..."
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                              Job Title *
                            </label>
                            <Input
                              placeholder="e.g. Senior Backend Engineer"
                              value={customJobTitle}
                              onChange={(e) => setCustomJobTitle(e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                              Company Name
                            </label>
                            <Input
                              placeholder="e.g. Brain Station 23 / Automattic"
                              value={customJobCompany}
                              onChange={(e) => setCustomJobCompany(e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                            Job Description & Requirements *
                          </label>
                          <textarea
                            rows={4}
                            placeholder="Paste the required skills, responsibilities, and qualifications..."
                            value={customJobDesc}
                            onChange={(e) => setCustomJobDesc(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-white font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {scanError && <p className="text-xs text-red-400">{scanError}</p>}

                    <Button onClick={handleRunScan} disabled={scanning} className="bg-white text-black hover:bg-zinc-200 font-semibold h-8 text-xs">
                      {scanning ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Calculating ATS Score...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 mr-2" /> Run ATS Gap Analysis
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Scan Results Panel */}
                {scanResult && (
                  <Card className="border-border/80 bg-card/60 overflow-hidden">
                    <CardHeader className="border-b border-border/50 bg-muted/20 py-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                            <TrendingUp className="w-4 h-4 text-white" /> ATS Match Results
                          </CardTitle>
                          <CardDescription className="text-xs text-zinc-400">
                            Evaluation based on Skills (45%), Projects (35%), Location (10%), and Education (10%).
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-2xl font-black text-white">{scanResult.match?.overall_score || 0}%</span>
                            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                              Overall ATS Match
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-4">
                      {/* 4-Factor Score Breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                          <p className="text-[11px] text-zinc-400 font-semibold">Skills (45%)</p>
                          <p className="text-lg font-bold text-white mt-0.5">{scanResult.match?.skill_match || 0}%</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                          <p className="text-[11px] text-zinc-400 font-semibold">Projects (35%)</p>
                          <p className="text-lg font-bold text-white mt-0.5">{scanResult.match?.project_match || 0}%</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                          <p className="text-[11px] text-zinc-400 font-semibold">Location (10%)</p>
                          <p className="text-lg font-bold text-white mt-0.5">{scanResult.match?.location_match || 0}%</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                          <p className="text-[11px] text-zinc-400 font-semibold">Education (10%)</p>
                          <p className="text-lg font-bold text-white mt-0.5">{scanResult.match?.education_match || 0}%</p>
                        </div>
                      </div>

                      {/* Keyword Gaps Grid (Clean Monochrome) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {/* Matched Keywords */}
                        <div className="space-y-2.5 p-3.5 rounded-xl border border-border/60 bg-muted/20">
                          <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            Matching Keywords in Your Resume ({scanResult.matching_skills?.length || 0})
                          </h4>
                          <p className="text-[11px] text-zinc-400">
                            These requirements are already recognized in your profile.
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {scanResult.matching_skills && scanResult.matching_skills.length > 0 ? (
                              scanResult.matching_skills.map((skill, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-card px-2 py-0.5 text-xs font-mono text-white font-medium"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-white" />
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <p className="text-xs text-zinc-400 italic">No direct keyword overlap found.</p>
                            )}
                          </div>
                        </div>

                        {/* Missing Keywords (The Gap) */}
                        <div className="space-y-2.5 p-3.5 rounded-xl border border-border/60 bg-muted/20">
                          <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-zinc-400" />
                            Missing Keywords to Add (The Gap) ({scanResult.missing_skills?.length || 0})
                          </h4>
                          <p className="text-[11px] text-zinc-400">
                            ATS filters look for these terms. Add relevant ones to your resume.
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {scanResult.missing_skills && scanResult.missing_skills.length > 0 ? (
                              scanResult.missing_skills.map((skill, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-card px-2 py-0.5 text-xs font-mono text-zinc-400 font-medium"
                                >
                                  + {skill}
                                </span>
                              ))
                            ) : (
                              <p className="text-xs text-zinc-300 italic font-medium">
                                No missing critical skills detected! Great alignment.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Recruiter Feedback Bullets */}
                      {scanResult.match?.explanation && scanResult.match.explanation.length > 0 && (
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1.5">
                          <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            Recruiter & ATS Insights
                          </h4>
                          <ul className="space-y-1">
                            {scanResult.match.explanation.map((item, idx) => (
                              <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2">
                                <span className="text-white font-bold mt-0.5">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ── TAB 3: GOOGLE XYZ BULLET ENHANCER ── */}
            {activeTab === 'bullet_optimizer' && (
              <div className="space-y-5">
                <Card className="border-border/60">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                      <Wand2 className="w-4 h-4 text-white" /> Google XYZ Bullet Point Optimizer
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Top engineering recruiters evaluate experience bullets using Google’s formula:
                      <span className="text-white font-mono block mt-1">
                        “Accomplished [X], as measured by [Y], by doing [Z]”
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3.5">
                    <div>
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                        Your Current Rough Bullet Point *
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Worked on backend APIs using Python and Docker for customer data processing."
                        value={rawBullet}
                        onChange={(e) => setRawBullet(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                            Target Role (optional)
                          </label>
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) setTargetRole(e.target.value);
                            }}
                            className="text-[10px] bg-background border border-border rounded px-1.5 py-0.5 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            <option value="">Quick Select Role...</option>
                            {ROLE_PRESETS.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Input
                          placeholder="e.g. Senior Backend Engineer"
                          value={targetRole}
                          onChange={(e) => setTargetRole(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                            Skills to Infuse (optional)
                          </label>
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAppendSkill(e.target.value);
                              }
                            }}
                            className="text-[10px] bg-background border border-border rounded px-1.5 py-0.5 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            <option value="">Add Skill from list...</option>
                            {SKILL_SUGGESTIONS.map((skill) => (
                              <option key={skill} value={skill}>
                                + {skill}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Input
                          placeholder="e.g. FastAPI, PostgreSQL, Redis, Kubernetes"
                          value={targetKeywords}
                          onChange={(e) => setTargetKeywords(e.target.value)}
                          className="h-8 text-xs"
                        />
                        {/* Quick-tap skill badges */}
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          <span className="text-[10px] text-zinc-500 font-semibold uppercase mr-0.5">Quick add:</span>
                          {SKILL_SUGGESTIONS.slice(0, 7).map((skill) => {
                            const isAdded = targetKeywords
                              .toLowerCase()
                              .split(',')
                              .map((s) => s.trim())
                              .includes(skill.toLowerCase());
                            return (
                              <button
                                key={skill}
                                type="button"
                                onClick={() => handleAppendSkill(skill)}
                                disabled={isAdded}
                                className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                                  isAdded
                                    ? 'bg-white/20 border-white/40 text-white opacity-70 cursor-default'
                                    : 'bg-muted/40 hover:bg-white/10 hover:border-white/30 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {isAdded ? `✓ ${skill}` : `+ ${skill}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {bulletError && <p className="text-xs text-red-400">{bulletError}</p>}

                    <Button onClick={handleOptimizeBullet} disabled={optimizing} className="bg-white text-black hover:bg-zinc-200 font-semibold h-8 text-xs">
                      {optimizing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Rewriting with Google XYZ...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5 mr-2" /> Optimize with Google XYZ Formula
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Bullet Enhancer Results */}
                {bulletResult && (
                  <div className="space-y-3.5">
                    {/* Primary Recommendation */}
                    <Card className="border-white/30 bg-card/80">
                      <CardHeader className="py-2.5 px-4 border-b border-border/40">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-white" /> Top Recommendation (Google XYZ)
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-white/20 text-zinc-200 hover:text-white"
                            onClick={() => copyToClipboard(bulletResult.optimized_bullet, 0)}
                          >
                            {copiedIndex === 0 ? (
                              <>
                                <Check className="w-3 h-3 mr-1 text-white" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 mr-1" /> Copy Line
                              </>
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-3.5 space-y-2.5">
                        <p className="text-sm font-medium text-white leading-relaxed pl-3 border-l-2 border-white">
                          “{bulletResult.optimized_bullet}”
                        </p>
                        <div className="p-2.5 rounded-lg bg-muted/40 text-xs text-zinc-300">
                          <strong className="text-white">Why this wins:</strong> {bulletResult.impact_explanation}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Alternative Variations */}
                    {bulletResult.alternatives && bulletResult.alternatives.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-1">
                          Alternative Variations
                        </h4>
                        {bulletResult.alternatives.map((alt, idx) => (
                          <Card key={idx} className="border-border/60 bg-muted/20">
                            <CardContent className="py-2.5 px-3 flex items-center justify-between gap-3">
                              <p className="text-xs text-zinc-300 leading-relaxed">“{alt}”</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs shrink-0 text-zinc-400 hover:text-white"
                                onClick={() => copyToClipboard(alt, idx + 1)}
                              >
                                {copiedIndex === idx + 1 ? (
                                  <Check className="w-3.5 h-3.5 text-white" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
