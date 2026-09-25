'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookmarkX, MapPin, Building2, Loader2, TrendingUp } from 'lucide-react';

export default function SavedJobsPage() {
  const router = useRouter();
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [tracking, setTracking] = useState<string | null>(null);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const data = await api.get('/saved-jobs');
      setSaved(data || []);
    } catch {
      setSaved([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const unsave = async (savedId: string) => {
    setRemoving(savedId);
    try {
      await api.delete(`/saved-jobs/${savedId}`);
      setSaved(prev => prev.filter(s => s.id !== savedId));
    } catch {
      // ignore
    } finally {
      setRemoving(null);
    }
  };

  const startTracking = async (jobId: string) => {
    setTracking(jobId);
    try {
      await api.post('/applications', { job_id: jobId, status: 'saved' });
      router.push('/dashboard/applications');
    } catch {
      alert('Failed to start tracking. Make sure you are logged in.');
    } finally {
      setTracking(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Saved Jobs</h1>
        <p className="text-muted-foreground mt-2">
          Jobs you&apos;ve bookmarked for later ({saved.length} total)
        </p>
      </div>

      {saved.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookmarkX className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No saved jobs yet</p>
            <p className="text-sm mt-1">Browse jobs and bookmark the ones you like.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {saved.map((item) => (
            <Card key={item.id} className="flex flex-col rounded-xl border border-border bg-card hover:border-[hsl(var(--border-strong))] hover:-translate-y-0.5 transition-all">
              <CardHeader className="p-4 pb-2">
                <div className="space-y-1.5">
                  <a href={`/dashboard/jobs?job=${item.job_id}`} className="block">
                    <h3 className="font-semibold text-base leading-snug hover:text-primary transition-colors cursor-pointer line-clamp-2">
                      {item.job_title || 'Untitled Job'}
                    </h3>
                  </a>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium text-foreground/90">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      {item.job_company || 'Unknown'}
                    </span>
                    {item.job_location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {item.job_location}
                      </span>
                    )}
                  </div>
                </div>
                {item.job_source && (
                  <div className="pt-2">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                      {item.job_source}
                    </span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="px-4 py-2 flex-grow">
                <p className="text-[11px] text-muted-foreground">
                  Saved on {new Date(item.created_at).toLocaleDateString()}
                </p>
              </CardContent>

              <div className="p-4 pt-2 border-t border-border/40 flex items-center gap-2">
                <a
                  href={`/dashboard/jobs/${item.job_id}`}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-border bg-background px-3 text-xs font-semibold hover:bg-muted transition-colors text-foreground"
                >
                  View Details
                </a>
                <Button
                  variant="outline"
                  size="icon"
                  className="min-h-[44px] min-w-[44px] border-border text-muted-foreground hover:text-primary"
                  title="Start tracking this application"
                  onClick={() => startTracking(item.job_id)}
                  disabled={tracking === item.job_id}
                >
                  {tracking === item.job_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <TrendingUp className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive"
                  onClick={() => unsave(item.id)}
                  disabled={removing === item.id}
                  title="Remove from saved"
                >
                  {removing === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <BookmarkX className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
