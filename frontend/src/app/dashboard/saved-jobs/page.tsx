'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookmarkX, ExternalLink, MapPin, Building2, Loader2 } from 'lucide-react';

export default function SavedJobsPage() {
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {saved.map((item) => (
            <Card key={item.id} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="space-y-1">
                  <a href={`/dashboard/jobs/${item.job_id}`} className="block">
                    <h3 className="font-semibold text-lg leading-tight hover:text-primary transition-colors cursor-pointer">
                      {item.job_title || 'Untitled Job'}
                    </h3>
                  </a>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
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
                  <Badge variant="outline" className="text-xs w-fit">
                    {item.job_source}
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="pb-4 flex-grow">
                <p className="text-xs text-muted-foreground">
                  Saved on {new Date(item.created_at).toLocaleDateString()}
                </p>
              </CardContent>

              <div className="px-6 pb-4 flex gap-2">
                <a
                  href={`/dashboard/jobs/${item.job_id}`}
                  className="inline-flex h-8 flex-1 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted transition-colors"
                >
                  View Details
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => unsave(item.id)}
                  disabled={removing === item.id}
                  className="text-destructive hover:text-destructive"
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
