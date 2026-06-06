'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Briefcase, Bookmark, TrendingUp, CheckCircle2, XCircle,
  Clock, Loader2, Plus, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  saved:           { label: 'Saved',           bg: 'bg-slate-100',      text: 'text-slate-700',   icon: Bookmark },
  applied:         { label: 'Applied',         bg: 'bg-blue-100',       text: 'text-blue-700',    icon: Clock },
  assessment:      { label: 'Assessment',      bg: 'bg-purple-100',     text: 'text-purple-700',  icon: Clock },
  interview:       { label: 'Interview',       bg: 'bg-amber-100',      text: 'text-amber-700',   icon: TrendingUp },
  final_interview: { label: 'Final Interview', bg: 'bg-orange-100',    text: 'text-orange-700',  icon: TrendingUp },
  offer:           { label: 'Offer',           bg: 'bg-emerald-100',    text: 'text-emerald-700', icon: CheckCircle2 },
  rejected:        { label: 'Rejected',        bg: 'bg-red-100',        text: 'text-red-700',     icon: XCircle },
  withdrawn:       { label: 'Withdrawn',       bg: 'bg-gray-100',       text: 'text-gray-600',   icon: XCircle },
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appsData, statsData] = await Promise.all([
        api.get('/applications'),
        api.get('/applications/stats'),
      ]);
      setApps(appsData || []);
      setStats(statsData);
    } catch {
      setApps([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStatus = async (appId: string, status: string) => {
    try {
      await api.patch(`/applications/${appId}`, { status });
      setApps(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
      // Refresh stats after status change
      const statsData = await api.get('/applications/stats');
      setStats(statsData);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pipeline = [
    { status: 'applied',  label: 'Applied',       count: stats?.applied || 0 },
    { status: 'assessment', label: 'Assessment', count: stats?.assessment || 0 },
    { status: 'interview',  label: 'Interviewing', count: stats?.interview || 0 },
    { status: 'final_interview', label: 'Final Round', count: stats?.final_interview || 0 },
    { status: 'offer',      label: 'Offers',        count: stats?.offer || 0 },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground mt-2">
            Track your job applications ({stats?.total || 0} total)
          </p>
        </div>
        <Link href="/dashboard/jobs">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Browse Jobs
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {pipeline.map(({ status, label, count }) => (
            <Card key={status} className="border-border/50">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{count}</p>
              </CardContent>
            </Card>
          ))}
          <Card className="border-border/50">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Saved</p>
              <p className="text-2xl font-bold">{stats?.saved || 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Application List */}
      {apps.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No applications yet</p>
            <p className="text-sm mt-1">Start applying to jobs and track them here.</p>
            <Link href="/dashboard/jobs">
              <Button className="mt-4">Browse Jobs</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => {
            const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.saved;
            const StatusIcon = cfg.icon;
            return (
              <Card key={app.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 p-2 rounded-full ${cfg.bg}`}>
                        <StatusIcon className={`w-4 h-4 ${cfg.text}`} />
                      </div>
                      <div>
                        <Link href={`/dashboard/jobs/${app.job_id}`} className="font-semibold hover:text-primary">
                          {app.job_title || 'Untitled Job'}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {app.job_company} {app.job_location && `• ${app.job_location}`}
                        </p>
                        {app.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">“{app.notes}”</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-8 md:ml-0">
                      <select
                        value={app.status}
                        onChange={(e) => updateStatus(app.id, e.target.value)}
                        className="text-xs border rounded-md px-2 py-1.5 bg-background"
                      >
                        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                          <option key={key} value={key}>{val.label}</option>
                        ))}
                      </select>
                      <Link href={`/dashboard/jobs/${app.job_id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
