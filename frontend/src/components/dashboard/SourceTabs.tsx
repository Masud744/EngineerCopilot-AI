'use client';

import { useState } from 'react';
import {
  Landmark,
  ChevronDown,
  ChevronUp,
  MapPin,
  Laptop,
  Building2,
  Zap,
  Sparkles,
  Briefcase,
  Layers,
  Wifi,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SourceInfo {
  source: string;
  count?: number;
}

interface SourceTabsProps {
  sources: SourceInfo[];
  totalCount: number;
  activeSource: string | null;
  onSelect: (source: string | null) => void;
}

const MAX_VISIBLE = 7;

function getSourceIcon(sourceName: string) {
  const s = sourceName.toLowerCase();
  if (s.includes('govt')) return <Landmark className="h-3 w-3 shrink-0" />;
  if (s.includes('linkedin')) {
    return (
      <svg className="h-3 w-3 shrink-0 fill-current" viewBox="0 0 24 24">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    );
  }
  if (s.includes('bdjobs')) return <MapPin className="h-3 w-3 shrink-0" />;
  if (s.includes('remoteok')) return <Wifi className="h-3 w-3 shrink-0" />;
  if (s.includes('weworkremotely')) return <Laptop className="h-3 w-3 shrink-0" />;
  if (s.includes('jobicy')) return <Zap className="h-3 w-3 shrink-0" />;
  if (s.includes('arbeitnow')) return <Building2 className="h-3 w-3 shrink-0" />;
  if (s.includes('nextjobz')) return <Sparkles className="h-3 w-3 shrink-0" />;
  return <Briefcase className="h-3 w-3 shrink-0" />;
}

export function SourceTabs({ sources, totalCount, activeSource, onSelect }: SourceTabsProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleSources = showAll ? sources : sources.slice(0, MAX_VISIBLE);
  const hasMore = sources.length > MAX_VISIBLE;

  const sumOfSources = sources.reduce((acc, s) => acc + (s.count || 0), 0);
  const displayTotal = sumOfSources > 0 ? sumOfSources : totalCount;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* All Sources */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer',
          !activeSource
            ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
            : 'border-border/60 bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-primary/40'
        )}
      >
        <Layers className="h-3 w-3 shrink-0" />
        <span>All Sources</span>
        <span
          className={cn(
            'text-[10px] px-1.5 py-0.2 rounded-full font-semibold',
            !activeSource
              ? 'bg-white/20 text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {displayTotal}
        </span>
      </button>

      {visibleSources.map((item) => {
        const isActive = activeSource === item.source;

        return (
          <button
            key={item.source}
            type="button"
            onClick={() => onSelect(item.source)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer',
              isActive
                ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                : 'border-border/60 bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-primary/40'
            )}
          >
            {getSourceIcon(item.source)}
            <span>{item.source}</span>
            {item.count !== undefined && item.count > 0 && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-semibold',
                  isActive
                    ? 'bg-white/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}

      {/* More / Less button */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium border border-border/60 bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer"
        >
          {showAll ? (
            <>
              Less <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              More <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
