'use client';

import { useState } from 'react';
import { MapPin, Clock3, Bookmark, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPostedDate, decodeHtmlEntities } from '@/lib/utils';
import { CompanyLogo } from '@/components/dashboard/CompanyLogo';
import type { Job } from '@/types/job';

interface JobListItemProps {
  job: Job;
  isActive: boolean;
  isSaved: boolean;
  onSelect: (jobId: string) => void;
  onSaveToggle: (jobId: string) => void;
  getJobSkills: (job: Job) => string[];
}

export function JobListItem({
  job,
  isActive,
  isSaved,
  onSelect,
  onSaveToggle,
  getJobSkills,
}: JobListItemProps) {
  const skills = getJobSkills(job);
  const cleanCompany = decodeHtmlEntities(job.company);
  const cleanTitle = decodeHtmlEntities(job.title);
  const cleanLocation = decodeHtmlEntities(job.location);
  const isGovt = job.source === 'BD Govt Jobs';

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 transition-colors cursor-pointer ${
        isActive
          ? 'bg-zinc-800/80 text-foreground'
          : 'hover:bg-zinc-800/30'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(job.id)}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        {/* Company Logo */}
        <CompanyLogo company={cleanCompany} size="md" />

        {/* Job Info */}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-[1.4] text-foreground">
            {cleanTitle}
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {cleanCompany || 'Company not listed'}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {cleanLocation || 'Remote'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3 w-3" />
              {job.experience_level || 'Full-time'}
            </span>
            {isGovt && (
              <span className="inline-flex items-center gap-1 text-zinc-300 font-medium">
                <Landmark className="h-3 w-3" />
                Govt
              </span>
            )}
            {job.salary_min && (
              <span className="inline-flex items-center text-foreground font-semibold font-mono">
                {job.salary_currency || '$'}{Number(job.salary_min).toLocaleString()}
                {job.salary_max ? `–${Number(job.salary_max).toLocaleString()}` : '+'}
                {job.salary_currency === '৳' ? '/mo' : ''}
              </span>
            )}
            <span>{formatPostedDate(job.posted_date)}</span>
          </div>

          {/* Skill Tags */}
          {skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="rounded border border-border/60 bg-muted/60 px-1.5 py-[2px] text-[10px] text-muted-foreground font-medium"
                >
                  {skill}
                </span>
              ))}
              {skills.length > 3 && (
                <span className="rounded border border-border/60 bg-muted/60 px-1.5 py-[2px] text-[10px] text-muted-foreground">
                  +{skills.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </button>

      {/* Save Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
        title={isSaved ? 'Remove saved job' : 'Save job'}
        onClick={(e) => {
          e.stopPropagation();
          onSaveToggle(job.id);
        }}
      >
        <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-primary text-primary' : ''}`} strokeWidth={1.75} />
      </Button>
    </div>
  );
}
