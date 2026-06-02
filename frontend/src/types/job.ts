export interface JobCategory {
  category: string;
  confidence: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  is_remote: boolean;
  remote_type?: 'remote' | 'hybrid' | 'onsite';
  experience_level?: 'intern' | 'entry' | 'mid' | 'senior' | 'lead';
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  description?: string;
  requirements?: string;
  required_skills: string[];
  apply_url: string;
  source: string;
  source_job_id?: string;
  posted_date?: string;
  is_active: boolean;
  fetched_at: string;
  created_at: string;
  categories: JobCategory[];
  match_score?: number;
}

export interface PaginatedJobs {
  items: Job[];
  total: int;
  limit: int;
  offset: int;
}

export interface MatchScore {
  overall_score: number;
  skill_match: number;
  project_match: number;
  education_match: number;
  location_match: number;
  explanation: string[];
}

export interface MatchResponse {
  job: Job;
  match: MatchScore;
}
