'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { JobCard } from '@/components/dashboard/JobCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, RefreshCw, BriefcaseBusiness, Globe, MapPin, Filter } from 'lucide-react';

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<'all' | 'bd' | 'remote'>('all');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // Fetch ALL jobs from the public endpoint with higher limit
      const response = await api.get('/jobs?limit=100');
      if (response && response.items) {
        setJobs(response.items);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      // Try without auth as fallback
      try {
        const res = await fetch('http://localhost:8000/api/v1/jobs?limit=100');
        const data = await res.json();
        if (data && data.items) {
          setJobs(data.items);
        }
      } catch {
        console.error('Fallback fetch also failed');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await fetch('http://localhost:8000/api/v1/jobs/sync', { method: 'POST' });
      const data = await result.json();
      setSyncResult(data);
      await fetchJobs(); // Refresh list
    } catch (error) {
      console.error('Failed to sync jobs:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Filtering
  const filteredJobs = jobs.filter(job => {
    // Text search
    const matchesSearch = !search || 
      job.title?.toLowerCase().includes(search.toLowerCase()) || 
      job.company?.toLowerCase().includes(search.toLowerCase()) ||
      job.location?.toLowerCase().includes(search.toLowerCase());
    
    // Source filter
    const matchesSource = !sourceFilter || job.source === sourceFilter;
    
    // Location filter
    let matchesLocation = true;
    if (locationFilter === 'bd') {
      const loc = (job.location || '').toLowerCase();
      matchesLocation = loc.includes('bangladesh') || loc.includes('dhaka') || 
                         loc.includes('chittagong') || loc.includes('chattogram');
    } else if (locationFilter === 'remote') {
      matchesLocation = job.is_remote === true;
    }
    
    return matchesSearch && matchesSource && matchesLocation;
  });

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 9;
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sourceFilter, locationFilter]);

  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  // Get unique sources for filter
  const sources = [...new Set(jobs.map(j => j.source).filter(Boolean))];

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BriefcaseBusiness className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Find Jobs</h1>
        </div>
        
        <Button onClick={handleSync} disabled={syncing} variant="outline" className="w-full sm:w-auto">
          {syncing ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Syncing...</>
          ) : (
            <><RefreshCw className="w-4 h-4 mr-2" /> Sync Latest Jobs</>
          )}
        </Button>
      </div>

      {/* Sync Result */}
      {syncResult && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-sm animate-in fade-in">
          ✅ {syncResult.message} 
          {syncResult.sources && Object.keys(syncResult.sources).length > 0 && (
            <span className="ml-2">
              ({Object.entries(syncResult.sources).map(([k, v]) => `${k}: ${v}`).join(', ')})
            </span>
          )}
        </div>
      )}

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by title, company, or location..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          
          {/* Location Filter */}
          <Badge 
            variant={locationFilter === 'all' ? 'default' : 'outline'} 
            className="cursor-pointer"
            onClick={() => setLocationFilter('all')}
          >
            All
          </Badge>
          <Badge 
            variant={locationFilter === 'bd' ? 'default' : 'outline'} 
            className="cursor-pointer"
            onClick={() => setLocationFilter('bd')}
          >
            <MapPin className="w-3 h-3 mr-1" /> Bangladesh
          </Badge>
          <Badge 
            variant={locationFilter === 'remote' ? 'default' : 'outline'} 
            className="cursor-pointer"
            onClick={() => setLocationFilter('remote')}
          >
            <Globe className="w-3 h-3 mr-1" /> Remote
          </Badge>

          <span className="text-muted-foreground text-xs mx-2">|</span>

          {/* Source Filter */}
          <Badge 
            variant={!sourceFilter ? 'default' : 'outline'} 
            className="cursor-pointer"
            onClick={() => setSourceFilter(null)}
          >
            All Sources
          </Badge>
          {sources.map(src => (
            <Badge 
              key={src}
              variant={sourceFilter === src ? 'default' : 'outline'} 
              className="cursor-pointer"
              onClick={() => setSourceFilter(sourceFilter === src ? null : src)}
            >
              {src}
            </Badge>
          ))}

          <span className="text-muted-foreground text-xs ml-auto">
            {filteredJobs.length} jobs matching filters
          </span>
        </div>
      </div>

      {/* Job Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredJobs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-8 pb-4">
              <Button 
                variant="outline" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button 
                variant="outline" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <h3 className="text-lg font-semibold">No jobs found</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            {jobs.length === 0 
              ? "No jobs in database yet. Click 'Sync Latest Jobs' to fetch from LinkedIn, RemoteOK, and Arbeitnow." 
              : "No jobs match your current filters. Try adjusting your search."}
          </p>
          {jobs.length === 0 && (
            <Button onClick={handleSync} disabled={syncing}>
              {syncing ? 'Syncing...' : 'Fetch Jobs Now'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
