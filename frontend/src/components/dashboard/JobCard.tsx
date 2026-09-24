import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, DollarSign, ExternalLink, CalendarDays, Bookmark, Copy, Check } from 'lucide-react';

export function JobCard({
  job,
  isSaved,
  onSaveToggle,
}: {
  job: any;
  isSaved?: boolean;
  onSaveToggle?: (jobId: string) => void;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const {
          data: { session },
        } = await createClient().auth.getSession();
        setIsLoggedIn(!!session);
      } catch {
        setIsLoggedIn(false);
      }
    };
    check();
  }, []);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSaveToggle) return;
    if (!isLoggedIn) {
      window.location.href = '/login';
      return;
    }
    onSaveToggle(job.id || job.job_id || '');
  };

  const handleCopyTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (job?.title) {
      navigator.clipboard.writeText(job.title);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      government: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-medium',
      iot: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      embedded: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      ai: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      backend: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      full_stack: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      devops: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      cloud: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    };
    return colors[category] || 'bg-primary/10 text-primary border-primary/20';
  };

  const getSourceBadgeClass = (source: string) => {
    switch (source) {
      case 'BD Govt Jobs':
        return 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-semibold';
      case 'Bdjobs':
        return 'border-orange-500/40 text-orange-400 bg-orange-500/10 font-medium';
      case 'NextJobz':
        return 'border-purple-500/40 text-purple-400 bg-purple-500/10 font-medium';
      case 'Jobicy':
        return 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10 font-medium';
      case 'WeWorkRemotely':
        return 'border-rose-500/40 text-rose-400 bg-rose-500/10 font-medium';
      case 'LinkedIn':
        return 'border-blue-500/40 text-blue-400 bg-blue-500/10 font-medium';
      case 'RemoteOK':
        return 'border-amber-500/40 text-amber-400 bg-amber-500/10 font-medium';
      default:
        return 'border-border/40 text-muted-foreground/80 bg-muted/20 font-mono';
    }
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

  const hasValidMatchScore =
    typeof job.match_score === 'number' &&
    !isNaN(job.match_score) &&
    job.match_score > 0;

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow group select-text border-border/50 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3 select-text">
        <div className="flex justify-between items-start gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 group/title">
              <Link
                href={`/dashboard/jobs/${job.id}`}
                draggable={false}
                className="font-semibold text-base leading-snug hover:text-primary transition-colors cursor-pointer select-text line-clamp-2"
              >
                {job.title}
              </Link>
              <button
                type="button"
                onClick={handleCopyTitle}
                className="opacity-0 group-hover/title:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground rounded flex-shrink-0"
                title="Copy job title to clipboard"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center text-xs text-muted-foreground gap-3 select-text">
              <span className="flex items-center gap-1 text-foreground/90 font-medium">
                <Building2 className="w-3.5 h-3.5 text-primary/70" />
                {job.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {job.location || 'Remote'}
              </span>
            </div>
          </div>

          {/* Match Score Badge (only shown when valid score is present) */}
          {hasValidMatchScore ? (
            <Badge
              variant="outline"
              className={`flex-shrink-0 font-bold text-xs ${
                job.match_score >= 70
                  ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
                  : job.match_score >= 40
                  ? 'border-amber-500/50 text-amber-400 bg-amber-500/10'
                  : 'border-muted text-muted-foreground bg-muted/20'
              }`}
            >
              {job.match_score}% Match
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className={`flex-shrink-0 text-[10px] tracking-wider uppercase ${getSourceBadgeClass(job.source)}`}
            >
              {job.source === 'BD Govt Jobs' ? '🏛️ BD GOVT' : job.source || 'Active'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-4 flex-grow select-text">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground select-text">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              {job.salary_min
                ? `${job.salary_currency || '$'}${job.salary_min.toLocaleString()} - ${
                    job.salary_max ? job.salary_max.toLocaleString() : '+'
                  }`
                : 'Undisclosed'}
            </span>
            {job.posted_date && (
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {formatDate(job.posted_date)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 select-text">
            {job.is_remote && (
              <Badge variant="secondary" className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-xs">
                Remote
              </Badge>
            )}

            {job.categories &&
              job.categories.map((cat: any) => (
                <Badge
                  key={cat.category}
                  variant="secondary"
                  className={`text-xs ${getCategoryColor(cat.category)}`}
                >
                  {cat.category.replace('_', ' ').toUpperCase()}
                </Badge>
              ))}

            {job.required_skills &&
              job.required_skills.slice(0, 3).map((skill: string) => (
                <Badge key={skill} variant="outline" className="text-xs font-mono select-text">
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

      <div className="mt-auto pt-3 pb-3 px-6 border-t border-border/40 flex items-center gap-2">
        <Link
          href={`/dashboard/jobs/${job.id}`}
          className="flex items-center justify-center flex-1 h-9 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
        >
          View & Match
        </Link>

        {job.apply_url && (
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center h-9 px-3 rounded-lg text-xs font-medium transition-colors ${
              job.source === 'BD Govt Jobs'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
            title="Open application link in new tab"
          >
            {job.source === 'BD Govt Jobs' ? 'সার্কুলার / Apply' : 'Apply'} <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        )}

        {onSaveToggle && (
          <Button
            variant={isSaved ? 'default' : 'outline'}
            size="icon"
            onClick={handleSaveClick}
            title={isSaved ? 'Unsave job' : 'Save job'}
            className="h-9 w-9 flex-shrink-0"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </Button>
        )}
      </div>
    </Card>
  );
}
