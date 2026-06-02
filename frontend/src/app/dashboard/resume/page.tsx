'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, FileText, Download, Trash2, Sparkles, ChevronDown } from 'lucide-react';

type Tab = 'upload' | 'generate';

export default function ResumePage() {
  const [tab, setTab] = useState<Tab>('upload');
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [parseResult, setParseResult] = useState<any>(null);
  const [uploadMsg, setUploadMsg] = useState('');
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('ats_classic');
  const [generatedResumes, setGeneratedResumes] = useState<any[]>([]);

  // form state for generate
  const [useJob, setUseJob] = useState(true);
  const [jobId, setJobId] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  useEffect(() => {
    fetchTemplates();
    fetchGenerated();
  }, []);

  const fetchTemplates = async () => {
    try {
      const data = await api.get('/resume/templates');
      setTemplates(data.templates || []);
    } catch { /* ignore */ }
  };

  const fetchGenerated = async () => {
    try {
      const data = await api.get('/resume/generated');
      setGeneratedResumes(data.items || []);
    } catch { /* ignore */ }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg('');
    setParseResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/v1/resume/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadMsg('Resume uploaded and parsed successfully!');
        setParseResult(data.parsed);
      } else {
        setUploadMsg(data.detail || 'Upload failed');
      }
    } catch {
      setUploadMsg('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  async function getToken() {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { data: { session } } = await createClient().auth.getSession();
      return session?.access_token || '';
    } catch {
      return '';
    }
  }

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const body: any = { template_name: selectedTemplate };
      if (useJob && jobId) body.job_id = jobId;
      if (!useJob && customDesc) body.custom_job_description = customDesc;
      const data = await api.post('/resume/generate', body);
      setGeneratedResumes(prev => [data, ...prev]);
      alert('Resume generated successfully!');
    } catch (err: any) {
      alert(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const renderParsed = (data: any) => {
    if (!data) return null;
    const sections: { label: string; items: string[] }[] = [];
    if (data.skills?.length) sections.push({ label: 'Skills', items: data.skills });
    if (data.education?.length) sections.push({ label: 'Education', items: data.education.map((e: any) => `${e.degree || ''} ${e.field_of_study || ''} @ ${e.institution || ''}`) });
    if (data.experience?.length) sections.push({ label: 'Experience', items: data.experience.map((e: any) => `${e.title || ''} @ ${e.company || ''}`) });
    if (data.projects?.length) sections.push({ label: 'Projects', items: data.projects.map((p: any) => p.title || '') });
    return sections.map(s => (
      <div key={s.label} className="mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
        <div className="flex flex-wrap gap-1.5">
          {s.items.map((item, i) => (
            <Badge key={i} variant="outline" className="text-xs">{item}</Badge>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resume Studio</h1>
        <p className="text-muted-foreground mt-2">Upload, parse, and generate ATS-optimized resumes.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab('upload')}
          className={`pb-2 px-3 text-sm font-medium border-b-2 transition-colors ${tab === 'upload' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
        >
          Upload & Parse
        </button>
        <button
          onClick={() => setTab('generate')}
          className={`pb-2 px-3 text-sm font-medium border-b-2 transition-colors ${tab === 'generate' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
        >
          Generate Resume
        </button>
      </div>

      {tab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="w-4 h-4" /> Upload Resume</CardTitle>
              <CardDescription>PDF or DOCX, max 5MB</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <FileText className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Click to upload or drag & drop</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX</p>
                <input type="file" accept=".pdf,.docx" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
              {uploading && <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Uploading & parsing...</p>}
              {uploadMsg && <p className="text-sm mt-3 text-emerald-600">{uploadMsg}</p>}
            </CardContent>
          </Card>

          {/* Parsed Result */}
          <Card>
            <CardHeader>
              <CardTitle>Parsed Data</CardTitle>
              <CardDescription>Extracted from your resume</CardDescription>
            </CardHeader>
            <CardContent>
              {parseResult ? (
                renderParsed(parseResult)
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">Upload a resume to see parsed data here.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'generate' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> ATS Resume Generator</CardTitle>
              <CardDescription>Select a template and target job to generate a tailored resume.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Template</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Target Job</label>
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="radio"
                    id="use_job"
                    checked={useJob}
                    onChange={() => setUseJob(true)}
                  />
                  <label htmlFor="use_job" className="text-sm">Use a saved job from database</label>
                </div>
                {useJob && (
                  <select
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  >
                    <option value="">-- Select a job --</option>
                    {generatedResumes.map((r: any) => (
                      <option key={r.id} value={r.job_id || ''}>Job</option>
                    ))}
                  </select>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="radio"
                    id="use_custom"
                    checked={!useJob}
                    onChange={() => setUseJob(false)}
                  />
                  <label htmlFor="use_custom" className="text-sm">Paste job description</label>
                </div>
                {!useJob && (
                  <textarea
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    placeholder="Paste job description here..."
                    rows={4}
                    className="mt-2 w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                )}
              </div>

              <Button onClick={handleGenerate} disabled={generating || (useJob ? !jobId : !customDesc)} className="w-full">
                {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate ATS Resume</>}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Resumes History */}
          {generatedResumes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Resumes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generatedResumes.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{r.template_name?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()} {r.match_score ? `• Match: ${r.match_score}%` : ''}</p>
                      </div>
                      {r.pdf_file_path && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/resume/generated/${r.id}/download`} target="_blank">
                            <Download className="w-4 h-4 mr-1" /> PDF
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
