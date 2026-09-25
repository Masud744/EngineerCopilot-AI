'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Briefcase, Building2, MapPin, Landmark, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getSourceBadge } from '@/lib/constants/job-taxonomy';

export interface SearchableJobComboboxProps {
  jobs: any[];
  selectedJobId: string;
  onSelect: (jobId: string, job?: any) => void;
  placeholder?: string;
  className?: string;
}

export function SearchableJobCombobox({
  jobs = [],
  selectedJobId,
  onSelect,
  placeholder = '-- Search and select a job --',
  className = '',
}: SearchableJobComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'govt' | 'bd' | 'remote'>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const selectedJob = useMemo(() => {
    return jobs.find((j) => j.id === selectedJobId);
  }, [jobs, selectedJobId]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // 1. Source / Domain quick tab
      if (sourceFilter === 'govt') {
        const isGovt =
          job.source === 'BD Govt Jobs' ||
          (job.categories || job.job_categories || []).some((c: any) => c.category === 'government');
        if (!isGovt) return false;
      } else if (sourceFilter === 'bd') {
        const loc = (job.location || '').toLowerCase();
        const isBd =
          loc.includes('bangladesh') ||
          loc.includes('bd') ||
          loc.includes('dhaka') ||
          job.source === 'Bdjobs' ||
          job.source === 'NextJobz';
        if (!isBd) return false;
      } else if (sourceFilter === 'remote') {
        if (!job.is_remote && !job.location?.toLowerCase().includes('remote')) return false;
      }

      // 2. Query search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const title = (job.title || '').toLowerCase();
      const company = (job.company || '').toLowerCase();
      const location = (job.location || '').toLowerCase();
      const source = (job.source || '').toLowerCase();
      const skills = (job.required_skills || []).join(' ').toLowerCase();

      return (
        title.includes(q) ||
        company.includes(q) ||
        location.includes(q) ||
        source.includes(q) ||
        skills.includes(q)
      );
    });
  }, [jobs, searchQuery, sourceFilter]);

  return (
    <div ref={containerRef} className={`relative w-full ${isOpen ? 'z-[60]' : 'z-10'} ${className}`}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full min-h-[42px] bg-background border border-border hover:border-primary/50 transition-colors rounded-lg px-3 py-2 text-xs flex items-center justify-between gap-2 cursor-pointer shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {selectedJob ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-zinc-300 font-semibold flex-shrink-0">
              {selectedJob.source === 'BD Govt Jobs' ? (
                <Landmark className="w-3.5 h-3.5 text-zinc-300" />
              ) : (
                <Briefcase className="w-3.5 h-3.5" />
              )}
            </span>
            <div className="flex flex-col min-w-0 flex-1 leading-tight text-left">
              <span className="font-medium text-foreground truncate text-xs">
                {selectedJob.title}
              </span>
              <span className="text-[11px] text-muted-foreground truncate">
                {selectedJob.company} • {selectedJob.location || 'Remote'}
              </span>
            </div>
            {selectedJob.source && (
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${
                  getSourceBadge(selectedJob.source).className
                }`}
              >
                {getSourceBadge(selectedJob.source).label}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground/60" />
            {placeholder}
          </span>
        )}

        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedJob && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect('');
              }}
              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[70] bg-popover/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Search Box Header */}
          <div className="p-2.5 border-b border-border/50 bg-muted/20 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by role, company, skill (e.g. Python, Govt, Bank)..."
                className="w-full bg-background border border-border/60 rounded-md pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick Filter Sub-tabs */}
            <div className="flex items-center gap-1 text-[11px] overflow-x-auto pb-0.5 scrollbar-none">
              <span className="text-zinc-500 text-[10px] uppercase font-bold mr-1">Filter:</span>
              <button
                type="button"
                onClick={() => setSourceFilter('all')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  sourceFilter === 'all'
                    ? 'bg-white text-zinc-950 font-semibold'
                    : 'bg-white/[0.04] hover:bg-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                All ({jobs.length})
              </button>
              <button
                type="button"
                onClick={() => setSourceFilter('govt')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                  sourceFilter === 'govt'
                    ? 'bg-white text-zinc-950 font-semibold'
                    : 'bg-white/[0.04] hover:bg-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <Landmark className="w-3 h-3" /> Govt
              </button>
              <button
                type="button"
                onClick={() => setSourceFilter('bd')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  sourceFilter === 'bd'
                    ? 'bg-white text-zinc-950 font-semibold'
                    : 'bg-white/[0.04] hover:bg-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                BD Tech
              </button>
              <button
                type="button"
                onClick={() => setSourceFilter('remote')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                  sourceFilter === 'remote'
                    ? 'bg-white text-zinc-950 font-semibold'
                    : 'bg-white/[0.04] hover:bg-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <Globe className="w-3 h-3" /> Remote
              </button>
            </div>
          </div>

          {/* Job Items List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-border/30 p-1">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => {
                const isSelected = job.id === selectedJobId;
                const sourceBadge = getSourceBadge(job.source);

                return (
                  <div
                    key={job.id}
                    onClick={() => {
                      onSelect(job.id, job);
                      setIsOpen(false);
                    }}
                    className={`p-2 rounded-lg cursor-pointer transition-colors flex items-start justify-between gap-2 text-left ${
                      isSelected
                        ? 'bg-white/10 border border-white/20 text-white'
                        : 'hover:bg-white/[0.04] text-foreground'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs leading-snug line-clamp-1">
                          {job.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1 text-foreground/80 font-medium">
                          <Building2 className="w-3 h-3 text-muted-foreground" />
                          {job.company || 'Tech Org'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.location || 'Remote'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 font-medium tracking-tight ${sourceBadge.className}`}
                      >
                        {sourceBadge.label}
                      </Badge>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">No matching jobs found</p>
                <p className="text-[11px]">Try searching with a different keyword or switch the filter tab above.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-border/50 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Showing {filteredJobs.length} of {jobs.length} jobs</span>
            {selectedJobId && (
              <button
                type="button"
                onClick={() => {
                  onSelect('');
                  setIsOpen(false);
                }}
                className="text-xs text-destructive hover:underline"
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
