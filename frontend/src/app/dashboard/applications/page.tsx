'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase, Bookmark, TrendingUp, CheckCircle2, XCircle,
  Clock, Loader2, Plus, GripVertical, MessageSquare,
  Trash2, ExternalLink, X, Calendar, Building2, BarChart3,
} from 'lucide-react';
import Link from 'next/link';

/* ─── Status pipeline config ────────────────────────────── */

const KANBAN_COLUMNS = [
  { key: 'saved',           label: 'Saved',           color: 'text-slate-400',   bg: 'bg-slate-500/15',  border: 'border-slate-500/30', dot: 'bg-slate-400',   icon: Bookmark },
  { key: 'applied',         label: 'Applied',         color: 'text-blue-400',    bg: 'bg-blue-500/15',   border: 'border-blue-500/30',  dot: 'bg-blue-400',    icon: Clock },
  { key: 'assessment',      label: 'Assessment',      color: 'text-violet-400',  bg: 'bg-violet-500/15', border: 'border-violet-500/30',dot: 'bg-violet-400',  icon: Clock },
  { key: 'interview',       label: 'Interview',       color: 'text-amber-400',   bg: 'bg-amber-500/15',  border: 'border-amber-500/30', dot: 'bg-amber-400',   icon: TrendingUp },
  { key: 'final_interview', label: 'Final Round',     color: 'text-orange-400',  bg: 'bg-orange-500/15', border: 'border-orange-500/30',dot: 'bg-orange-400',  icon: TrendingUp },
  { key: 'offer',           label: 'Offer',           color: 'text-emerald-400', bg: 'bg-emerald-500/15',border: 'border-emerald-500/30',dot: 'bg-emerald-400',icon: CheckCircle2 },
  { key: 'rejected',        label: 'Rejected',        color: 'text-red-400',     bg: 'bg-red-500/15',    border: 'border-red-500/30',   dot: 'bg-red-400',     icon: XCircle },
  { key: 'withdrawn',       label: 'Withdrawn',       color: 'text-gray-500',    bg: 'bg-gray-500/15',   border: 'border-gray-500/30',  dot: 'bg-gray-500',    icon: XCircle },
] as const;

type StatusKey = (typeof KANBAN_COLUMNS)[number]['key'];

interface AppItem {
  id: string;
  user_id: string;
  job_id: string;
  status: StatusKey;
  applied_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  job_title?: string | null;
  job_company?: string | null;
  job_location?: string | null;
}

interface Stats {
  total: number;
  saved: number;
  applied: number;
  assessment: number;
  interview: number;
  final_interview: number;
  offer: number;
  rejected: number;
  withdrawn: number;
}

/* ─── Helper: days since a date ─────────────────────────── */
function daysSince(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

/* ═══════════════════════════════════════════════════════════ */

export default function ApplicationsKanbanPage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // Notes dialog
  const [editingNotes, setEditingNotes] = useState<AppItem | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  /* ── Data fetching ──────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [appsData, statsData] = await Promise.all([
        api.get<AppItem[]>('/applications'),
        api.get<Stats>('/applications/stats'),
      ]);
      setApps(appsData || []);
      setStats(statsData);
    } catch {
      setApps([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Status update ──────────────────────────────────────── */
  const updateStatus = async (appId: string, newStatus: StatusKey) => {
    setApps(prev =>
      prev.map(a => (a.id === appId ? { ...a, status: newStatus, updated_at: new Date().toISOString() } : a))
    );
    try {
      await api.patch(`/applications/${appId}`, { status: newStatus });
      const statsData = await api.get<Stats>('/applications/stats');
      setStats(statsData);
    } catch {
      fetchData();
    }
  };

  /* ── Notes save ─────────────────────────────────────────── */
  const handleSaveNote = async () => {
    if (!editingNotes) return;
    setSavingNote(true);
    try {
      await api.patch(`/applications/${editingNotes.id}`, { notes: noteText });
      setApps(prev =>
        prev.map(a => (a.id === editingNotes.id ? { ...a, notes: noteText } : a))
      );
      setEditingNotes(null);
    } catch {
      /* ignore */
    } finally {
      setSavingNote(false);
    }
  };

  /* ── Delete ─────────────────────────────────────────────── */
  const handleDelete = async (appId: string) => {
    setApps(prev => prev.filter(a => a.id !== appId));
    try {
      await api.delete(`/applications/${appId}`);
      const statsData = await api.get<Stats>('/applications/stats');
      setStats(statsData);
    } catch {
      fetchData();
    }
  };

  /* ── Drag & Drop handlers ───────────────────────────────── */
  const onDragStart = (e: React.DragEvent, appId: string) => {
    setDraggingId(appId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', appId);
  };

  const onDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colKey);
  };

  const onDragLeave = () => {
    setDragOverCol(null);
  };

  const onDrop = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('text/plain');
    if (appId) {
      updateStatus(appId, colKey as StatusKey);
    }
    setDraggingId(null);
    setDragOverCol(null);
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setDragOverCol(null);
  };

  /* ── Group apps by status ───────────────────────────────── */
  const groupedApps: Record<string, AppItem[]> = {};
  KANBAN_COLUMNS.forEach(col => {
    groupedApps[col.key] = apps.filter(a => a.status === col.key);
  });

  /* ── Loading state ──────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your pipeline...</p>
      </div>
    );
  }

  /* ── Pipeline funnel stats ──────────────────────────────── */
  const activePipeline = KANBAN_COLUMNS.filter(c => !['rejected', 'withdrawn'].includes(c.key));
  const maxCount = Math.max(1, ...activePipeline.map(c => (stats as any)?.[c.key] || 0));

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Application Pipeline
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {stats?.total || 0} total applications · Drag cards to update status
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border/60 overflow-hidden">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              List
            </button>
          </div>

          <Link href="/dashboard/jobs">
            <Button size="sm" className="shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" /> Browse Jobs
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Funnel Stats Bar ────────────────────────────────── */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {activePipeline.map(col => {
            const count = (stats as any)?.[col.key] || 0;
            const pct = Math.round((count / maxCount) * 100);
            const Icon = col.icon;
            return (
              <div
                key={col.key}
                className={`rounded-lg p-3 ${col.bg} border ${col.border} transition-all hover:scale-[1.02]`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={`w-3.5 h-3.5 ${col.color}`} />
                  <span className={`text-xs font-medium ${col.color}`}>{col.label}</span>
                </div>
                <p className="text-2xl font-bold">{count}</p>
                <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${col.dot} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Empty State ─────────────────────────────────────── */}
      {apps.length === 0 && (
        <Card className="border-dashed border-2 border-border/60 bg-card/40">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold">No Applications Yet</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mt-2">
              Start browsing jobs and save or apply to them. They&apos;ll appear here as cards
              you can drag across your pipeline.
            </p>
            <Link href="/dashboard/jobs">
              <Button className="mt-6 shadow-lg">
                <Briefcase className="w-4 h-4 mr-2" /> Browse Jobs
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* ═══ KANBAN BOARD VIEW ═══════════════════════════════ */}
      {apps.length > 0 && viewMode === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2" style={{ minHeight: '500px' }}>
          {KANBAN_COLUMNS.map(col => {
            const colApps = groupedApps[col.key] || [];
            const isOver = dragOverCol === col.key;
            const Icon = col.icon;

            return (
              <div
                key={col.key}
                className={`flex-shrink-0 w-[240px] flex flex-col rounded-xl border transition-all duration-200 ${
                  isOver
                    ? `${col.border} ${col.bg} shadow-lg shadow-primary/5`
                    : 'border-border/40 bg-card/30'
                }`}
                onDragOver={e => onDragOver(e, col.key)}
                onDragLeave={onDragLeave}
                onDrop={e => onDrop(e, col.key)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {col.label}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 font-bold ${col.color} border-current/30`}
                  >
                    {colApps.length}
                  </Badge>
                </div>

                {/* Cards container */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[80px]">
                  {colApps.length === 0 && (
                    <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/50 italic">
                      Drop here
                    </div>
                  )}

                  {colApps.map(app => {
                    const days = daysSince(app.updated_at);
                    const isDragging = draggingId === app.id;

                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={e => onDragStart(e, app.id)}
                        onDragEnd={onDragEnd}
                        className={`group rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing transition-all duration-150 hover:shadow-md hover:border-primary/30 ${
                          isDragging ? 'opacity-40 scale-95' : 'opacity-100'
                        }`}
                      >
                        {/* Grip + Title */}
                        <div className="flex items-start gap-2">
                          <GripVertical className="w-3.5 h-3.5 mt-0.5 text-muted-foreground/40 flex-shrink-0 group-hover:text-muted-foreground/70" />
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/dashboard/jobs/${app.job_id}`}
                              className="text-sm font-semibold leading-tight hover:text-primary transition-colors line-clamp-2"
                            >
                              {app.job_title || 'Untitled Job'}
                            </Link>
                            {app.job_company && (
                              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {app.job_company}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground/70">
                          {days !== null && (
                            <span className="flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              {days}d ago
                            </span>
                          )}
                          {app.job_location && (
                            <span className="truncate max-w-[100px]">{app.job_location}</span>
                          )}
                        </div>

                        {/* Notes preview */}
                        {app.notes && (
                          <p className="mt-1.5 text-[10px] text-muted-foreground/60 italic line-clamp-2 bg-muted/30 rounded px-1.5 py-1">
                            &ldquo;{app.notes}&rdquo;
                          </p>
                        )}

                        {/* Quick actions (visible on hover) */}
                        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingNotes(app);
                              setNoteText(app.notes || '');
                            }}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Add note"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </button>
                          <Link href={`/dashboard/jobs/${app.job_id}`}>
                            <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="View job">
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(app.id)}
                            className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive ml-auto"
                            title="Remove"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ LIST VIEW ═══════════════════════════════════════ */}
      {apps.length > 0 && viewMode === 'list' && (
        <div className="space-y-2">
          {apps.map(app => {
            const col = KANBAN_COLUMNS.find(c => c.key === app.status) || KANBAN_COLUMNS[0];
            const Icon = col.icon;
            const days = daysSince(app.updated_at);

            return (
              <Card key={app.id} className="hover:shadow-sm transition-shadow border-border/50">
                <CardContent className="py-3 px-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-1.5 rounded-full ${col.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${col.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link href={`/dashboard/jobs/${app.job_id}`} className="font-semibold text-sm hover:text-primary line-clamp-1">
                          {app.job_title || 'Untitled Job'}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {app.job_company} {app.job_location && `· ${app.job_location}`}
                          {days !== null && ` · ${days}d ago`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-8 md:ml-0">
                      {app.notes && (
                        <button
                          onClick={() => {
                            setEditingNotes(app);
                            setNoteText(app.notes || '');
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground"
                          title={app.notes}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <select
                        value={app.status}
                        onChange={e => updateStatus(app.id, e.target.value as StatusKey)}
                        className="text-xs border rounded-md px-2 py-1.5 bg-background border-border/50 cursor-pointer"
                      >
                        {KANBAN_COLUMNS.map(c => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDelete(app.id)}
                        className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ═══ NOTES DIALOG ════════════════════════════════════ */}
      {editingNotes && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditingNotes(null)}>
          <div
            className="bg-card border border-border/60 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Application Notes</h3>
              <button onClick={() => setEditingNotes(null)} className="p-1 rounded-full hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <p className="text-sm font-medium">{editingNotes.job_title}</p>
              <p className="text-xs text-muted-foreground">{editingNotes.job_company}</p>
            </div>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add your notes here... (e.g., recruiter name, interview date, follow-up reminders)"
              className="w-full h-32 rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditingNotes(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveNote} disabled={savingNote}>
                {savingNote ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
                Save Note
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
