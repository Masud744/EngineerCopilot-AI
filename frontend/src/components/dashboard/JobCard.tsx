import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, DollarSign, ExternalLink, CalendarDays, Bookmark } from 'lucide-react';

export function JobCard({ job, isSaved, onSaveToggle }: { job: any; isSaved?: boolean; onSaveToggle?: (jobId: string) => void }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const { data: { session } } = await createClient().auth.getSession();
        setIsLoggedIn(!!session);
      } catch {
        setIsLoggedIn(false);
      }
    };
    check();
  }, []);

  const handleSaveClick = () => {
    if (!onSaveToggle) return;
    if (!isLoggedIn) {
      window.location.href = '/login';
      return;
    }
    onSaveToggle(job.id || job.job_id || '');
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      iot: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      embedded: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
      ai: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      backend: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      full_stack: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    };
    return colors[category] || 'bg-primary/10 text-primary border-primary/20';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <a href={`/dashboard/jobs/${job.id}`} className="block">
              <h3 className="font-semibold text-lg leading-tight hover:text-primary transition-colors cursor-pointer">
                {job.title}
              </h3>
            </a>
            <div className="flex items-center text-sm text-muted-foreground gap-3">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {job.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {job.location}
              </span>
            </div>
          </div>
          {job.match_score !== undefined && (
            <Badge
              variant="outline"
              className={`flex-shrink-0 font-bold ${
                job.match_score >= 70 ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' :
                job.match_score >= 40 ? 'border-amber-500 text-amber-500 bg-amber-500/10' :
                'border-muted text-muted-foreground bg-muted/20'
              }`}
            >
              {job.match_score}% Match
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-4 flex-grow">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <DollarSign className="w-3.5 h-3.5 text-green-500" />
              {job.salary_min ? `${job.salary_currency || '$'}${job.salary_min.toLocaleString()} - ${job.salary_max ? job.salary_max.toLocaleString() : '+'}` : 'Undisclosed'}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              {formatDate(job.posted_date)}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {job.is_remote && (
              <Badge variant="secondary" className="bg-sky-500/10 text-sky-500 border-sky-500/20">Remote</Badge>
            )}

            {job.categories && job.categories.map((cat: any) => (
              <Badge key={cat.category} variant="secondary" className={getCategoryColor(cat.category)}>
                {cat.category.replace('_', ' ').toUpperCase()}
              </Badge>
            ))}

            {job.required_skills && job.required_skills.slice(0, 3).map((skill: string) => (
              <Badge key={skill} variant="outline" className="text-xs font-normal">
                {skill}
              </Badge>
            ))}
            {job.required_skills && job.required_skills.length > 3 && (
              <span className="text-xs text-muted-foreground self-center">
                +{job.required_skills.length - 3} more
              </span>
            )}
          </div>
        </div>
      </CardContent>

      <div className="mt-auto pt-4 border-t flex gap-2">
        <a
          href={job.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Apply Now
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        {onSaveToggle && (
          <Button
            variant={isSaved ? "default" : "outline"}
            size="icon"
            onClick={handleSaveClick}
            title={isSaved ? "Unsave job" : "Save job"}
            className="h-10 w-10"
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </Button>
        )}
      </div>
    </Card>
  );
}
