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
      let payload: any = { save_to_jobs: false };
      if (scanMode === 'saved') {
        if (!selectedJobId) {
          setScanError('Please select a job from the dropdown.');
          setScanning(false);
          return;
        }
        // Match specific job
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
        payload = {
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
    <div className="space-y-8 max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Layers className="w-8 h-8 text-primary" />
            Resume Studio & ATS Optimizer
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Keep your real Master Resume stored, scan any job for keyword gaps, and optimize experience bullets.
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-3">
          {resumeData?.has_resume ? (
            <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/10 text-emerald-400 py-1.5 px-3">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
              Master Resume Active
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-400 py-1.5 px-3">
              <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-400" />
              No Master Resume Uploaded
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
            className="shadow-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Uploading & Parsing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-1.5" /> Upload Resume
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Upload Feedback */}
      {uploadMsg && (
        <div
          className={`p-4 rounded-lg text-sm flex items-center justify-between border ${
            uploadMsg.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
              : 'bg-red-950/30 border-red-800 text-red-300'
          }`}
        >
          <span>{uploadMsg.text}</span>
          <button onClick={() => setUploadMsg(null)} className="text-xs hover:underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Navigation (Horizontally scrollable pill row on mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-border/50">
        <button
          onClick={() => setActiveTab('overview')}
          className={`shrink-0 min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" /> Master Resume Profile
        </button>
        <button
          onClick={() => setActiveTab('scanner')}
          className={`shrink-0 min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'scanner'
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
          }`}
        >
          <Search className="w-4 h-4 shrink-0" /> ATS Job Scanner
        </button>
        <button
          onClick={() => setActiveTab('bullet_optimizer')}
          className={`shrink-0 min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'bullet_optimizer'
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
          }`}
        >
          <Wand2 className="w-4 h-4 shrink-0" /> Bullet Enhancer
        </button>
      </div>

      {/* ─── TAB 1: MASTER RESUME OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {loadingResume ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !resumeData?.has_resume ? (
            <Card className="border-dashed border-2 border-border/70 bg-card/40">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">No Master Resume on File</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mt-2">
                  Upload your existing PDF or DOCX resume. Our parser will extract your real skills, roles, and
                  projects so you can run ATS scans and target keyword gaps.
                </p>
                <Button
                  className="mt-6 shadow-lg"
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Metadata & Quick Actions */}
              <div className="space-y-6">
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Master File Info
                    </CardTitle>
                    <CardDescription>Your active base resume</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Candidate</p>
                      <p className="text-sm font-medium mt-0.5">{resumeData.profile?.name || 'Candidate'}</p>
                      {resumeData.profile?.email && (
                        <p className="text-xs text-muted-foreground">{resumeData.profile.email}</p>
                      )}
                      {resumeData.profile?.location && (
                        <p className="text-xs text-muted-foreground mt-0.5">📍 {resumeData.profile.location}</p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Parsed Stats</p>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                        <div className="p-2 rounded bg-muted/50 border border-border/40">
                          <p className="text-lg font-bold text-primary">{parsed?.skills?.length || 0}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Skills</p>
                        </div>
                        <div className="p-2 rounded bg-muted/50 border border-border/40">
                          <p className="text-lg font-bold text-primary">{parsed?.experience?.length || 0}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Roles</p>
                        </div>
                        <div className="p-2 rounded bg-muted/50 border border-border/40">
                          <p className="text-lg font-bold text-primary">{parsed?.projects?.length || 0}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Projects</p>
                        </div>
                      </div>
                    </div>

                    {resumeData.download_url && (
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => window.open(resumeData.download_url!, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-2" /> Download Original PDF
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ATS Optimization Shortcut */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <h4 className="text-sm font-bold flex items-center gap-1.5 text-primary">
                      <Sparkles className="w-4 h-4" /> Ready to Apply?
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      Before sending your resume to a recruiter, run an ATS scan against the job posting to ensure your
                      keywords align.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setActiveTab('scanner')}
                      className="w-full mt-4 bg-primary text-primary-foreground"
                    >
                      Scan Against a Job Posting ➔
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Parsed Resume Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Skills */}
                <Card className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" /> Parsed Technical Skills
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {parsed?.skills?.length || 0} extracted
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                              <div key={group.name} className="space-y-1.5">
                                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                                  {group.name} ({group.skills.length})
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {group.skills.map((skill, i) => (
                                    <span
                                      key={i}
                                      className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-zinc-200 font-mono"
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
                      <p className="text-xs text-muted-foreground italic">No skills extracted.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Work Experience */}
                <Card className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary" /> Work History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {parsed?.experience && parsed.experience.length > 0 ? (
                      parsed.experience.map((exp, i) => (
                        <div key={i} className="border-l-2 border-primary/40 pl-4 py-1">
                          <p className="text-sm font-bold text-foreground">
                            {exp.title || 'Role'} <span className="text-muted-foreground font-normal">at</span>{' '}
                            {exp.company || 'Company'}
                          </p>
                          {(exp.start_date || exp.end_date) && (
                            <p className="text-xs text-muted-foreground">
                              {exp.start_date || ''} – {exp.end_date || 'Present'}
                            </p>
                          )}
                          {exp.description && (
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3 leading-relaxed">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No work experience extracted.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Projects */}
                <Card className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" /> Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {parsed?.projects && parsed.projects.length > 0 ? (
                      parsed.projects.map((proj, i) => (
                        <div key={i} className="border-l-2 border-cyan-500/40 pl-4 py-1">
                          <p className="text-sm font-bold text-foreground">{proj.title || 'Project'}</p>
                          {proj.technologies && proj.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {proj.technologies.map((t, idx) => (
                                <Badge key={idx} variant="secondary" className="text-[10px] py-0 px-1.5">
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {proj.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{proj.description}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No projects listed.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Education */}
                {parsed?.education && parsed.education.length > 0 && (
                  <Card className="border-border/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-primary" /> Education
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {parsed.education.map((edu, i) => (
                        <div key={i} className="text-xs">
                          <p className="font-semibold text-foreground">
                            {edu.degree} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}
                          </p>
                          <p className="text-muted-foreground">{edu.institution}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: ATS SCANNER & GAP ANALYSIS ─── */}
      {activeTab === 'scanner' && (
        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" /> Target Job ATS Scanner & Keyword Gap Analysis
              </CardTitle>
              <CardDescription>
                Compare your uploaded Master Resume with any job posting to evaluate your ATS Match Score and discover
                missing keywords to add.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Scan Mode Toggle */}
              <div className="flex gap-4 border-b border-border/50 pb-3">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="scanMode"
                    checked={scanMode === 'saved'}
                    onChange={() => setScanMode('saved')}
                  />
                  Select from Job Database
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="scanMode"
                    checked={scanMode === 'custom'}
                    onChange={() => setScanMode('custom')}
                  />
                  Paste Any Job Description (LinkedIn / BDjobs)
                </label>
              </div>

              {scanMode === 'saved' ? (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
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
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Job Title *
                      </label>
                      <Input
                        placeholder="e.g. Senior Backend Engineer"
                        value={customJobTitle}
                        onChange={(e) => setCustomJobTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Company Name
                      </label>
                      <Input
                        placeholder="e.g. Brain Station 23 / Automattic"
                        value={customJobCompany}
                        onChange={(e) => setCustomJobCompany(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Job Description & Requirements *
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Paste the required skills, responsibilities, and qualifications..."
                      value={customJobDesc}
                      onChange={(e) => setCustomJobDesc(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {scanError && <p className="text-sm text-red-400">{scanError}</p>}

              <Button onClick={handleRunScan} disabled={scanning} className="w-full sm:w-auto shadow-md">
                {scanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Calculating 4-Factor ATS Score...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Run ATS Gap Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Scan Results Panel */}
          {scanResult && (
            <Card className="border-border/80 bg-card/60 shadow-xl overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-muted/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" /> ATS Match Results
                    </CardTitle>
                    <CardDescription>
                      Evaluation based on Skills (45%), Projects (35%), Location (10%), and Education (10%).
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-3xl font-black text-primary">{scanResult.match?.overall_score || 0}%</span>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        Overall ATS Match
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* 4-Factor Score Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                    <p className="text-xs text-muted-foreground font-semibold">Skills (45%)</p>
                    <p className="text-xl font-bold text-foreground mt-1">{scanResult.match?.skill_match || 0}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                    <p className="text-xs text-muted-foreground font-semibold">Projects (35%)</p>
                    <p className="text-xl font-bold text-foreground mt-1">{scanResult.match?.project_match || 0}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                    <p className="text-xs text-muted-foreground font-semibold">Location (10%)</p>
                    <p className="text-xl font-bold text-foreground mt-1">{scanResult.match?.location_match || 0}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                    <p className="text-xs text-muted-foreground font-semibold">Education (10%)</p>
                    <p className="text-xl font-bold text-foreground mt-1">{scanResult.match?.education_match || 0}%</p>
                  </div>
                </div>

                {/* Keyword Gaps Grid (Neutral Dark Aesthetic) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Matched Keywords */}
                  <div className="space-y-3 p-4 rounded-xl border border-border/60 bg-muted/20">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Matching Keywords in Your Resume ({scanResult.matching_skills?.length || 0})
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      These requirements are already recognized in your profile. Keep them prominent.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {scanResult.matching_skills && scanResult.matching_skills.length > 0 ? (
                        scanResult.matching_skills.map((skill, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-card px-2.5 py-1 text-xs font-mono text-foreground font-medium"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No direct keyword overlap found.</p>
                      )}
                    </div>
                  </div>

                  {/* Missing Keywords (The Gap) */}
                  <div className="space-y-3 p-4 rounded-xl border border-border/60 bg-muted/20">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Missing Keywords to Add (The Gap) ({scanResult.missing_skills?.length || 0})
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Recruiters and ATS filters look for these terms. Add relevant ones to your resume.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {scanResult.missing_skills && scanResult.missing_skills.length > 0 ? (
                        scanResult.missing_skills.map((skill, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-card px-2.5 py-1 text-xs font-mono text-muted-foreground font-medium"
                          >
                            + {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-emerald-400 italic font-medium">
                          No missing critical skills detected! Unicorn match.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recruiter Feedback Bullets */}
                {scanResult.match?.explanation && scanResult.match.explanation.length > 0 && (
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Recruiter & ATS Insights
                    </h4>
                    <ul className="space-y-1.5">
                      {scanResult.match.explanation.map((item, idx) => (
                        <li key={idx} className="text-xs text-foreground/90 flex items-start gap-2">
                          <span className="text-primary font-bold mt-0.5">•</span>
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

      {/* ─── TAB 3: GOOGLE XYZ BULLET ENHANCER ─── */}
      {activeTab === 'bullet_optimizer' && (
        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" /> Google XYZ Bullet Point Optimizer
              </CardTitle>
              <CardDescription>
                Top engineering recruiters evaluate experience bullets using Google’s XYZ formula:
                <span className="text-primary font-semibold block mt-1">
                  “Accomplished [X], as measured by [Y], by doing [Z]”
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Your Current Rough Bullet Point *
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Worked on the backend APIs using Python and Docker for customer management."
                  value={rawBullet}
                  onChange={(e) => setRawBullet(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Target Role (optional)
                    </label>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) setTargetRole(e.target.value);
                      }}
                      className="text-[11px] bg-background border border-border rounded-md px-2 py-0.5 text-muted-foreground hover:text-foreground hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors appearance-none"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23888%27 stroke-width=%272%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', paddingRight: '20px' }}
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
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Skills to Infuse (optional)
                    </label>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAppendSkill(e.target.value);
                        }
                      }}
                      className="text-[11px] bg-background border border-border rounded-md px-2 py-0.5 text-muted-foreground hover:text-foreground hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors appearance-none"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23888%27 stroke-width=%272%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', paddingRight: '20px' }}
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
                  />
                  {/* Quick-tap skill badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase mr-0.5">Quick add:</span>
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
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                            isAdded
                              ? 'bg-primary/20 border-primary/40 text-primary opacity-60 cursor-default'
                              : 'bg-muted/40 hover:bg-primary/10 hover:border-primary/50 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {isAdded ? `✓ ${skill}` : `+ ${skill}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {bulletError && <p className="text-sm text-red-400">{bulletError}</p>}

              <Button onClick={handleOptimizeBullet} disabled={optimizing} className="shadow-md">
                {optimizing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Rewriting with Google XYZ...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" /> Optimize with Google XYZ Formula
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Bullet Enhancer Results */}
          {bulletResult && (
            <div className="space-y-4">
              {/* Primary Recommendation */}
              <Card className="border-primary/40 bg-card/80 shadow-lg">
                <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Top Recommendation (Google XYZ)
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => copyToClipboard(bulletResult.optimized_bullet, 0)}
                    >
                      {copiedIndex === 0 ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1" /> Copy Line
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <p className="text-base font-medium text-foreground leading-relaxed pl-3 border-l-2 border-primary">
                    “{bulletResult.optimized_bullet}”
                  </p>
                  <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground">
                    💡 <strong className="text-foreground">Why this wins:</strong> {bulletResult.impact_explanation}
                  </div>
                </CardContent>
              </Card>

              {/* Alternative Variations */}
              {bulletResult.alternatives && bulletResult.alternatives.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                    Alternative Variations
                  </h4>
                  {bulletResult.alternatives.map((alt, idx) => (
                    <Card key={idx} className="border-border/60 bg-muted/20">
                      <CardContent className="py-3 px-4 flex items-center justify-between gap-4">
                        <p className="text-xs text-foreground/90 leading-relaxed">“{alt}”</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs shrink-0"
                          onClick={() => copyToClipboard(alt, idx + 1)}
                        >
                          {copiedIndex === idx + 1 ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
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
  );
}
