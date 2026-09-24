export type ApplicationStatus = 
  | 'saved' 
  | 'applied' 
  | 'assessment' 
  | 'interview' 
  | 'final_interview' 
  | 'offer' 
  | 'rejected' 
  | 'withdrawn';

export interface Application {
  id: string;
  user_id: string;
  job_id: string;
  status: ApplicationStatus;
  applied_date?: string;
  notes?: string;
  resume_used?: string;
  cover_letter_used?: string;
  created_at: string;
  updated_at: string;
  
  // Joined from jobs table
  job_title?: string;
  job_company?: string;
  job_location?: string;
}

export interface ApplicationStats {
  total: number;
  saved: number;
  applied: number;
  assessment: number;
  interview: number;
  final_interview: number;
  offer: number;
  rejected: number;
  withdrawn: number;
}

export interface GeneratedResume {
  id: string;
  template_name: string;
  match_score?: number;
  optimization_notes?: string;
  pdf_url?: string;
  tex_content?: string;
  created_at: string;
}

export interface GeneratedCoverLetter {
  id: string;
  content: string;
  job_id?: string;
  ai_model: string;
  created_at: string;
}

export interface BulletEnhanceRequest {
  bullet_point: string;
  target_role?: string;
  target_skills?: string[];
}

export interface BulletEnhanceResponse {
  original_bullet: string;
  optimized_bullet: string;
  impact_explanation: string;
  alternatives: string[];
}

export interface MasterResumeData {
  has_resume: boolean;
  file_path?: string | null;
  download_url?: string | null;
  parsed?: {
    skills?: string[];
    experience?: Array<{ title?: string; company?: string; start_date?: string; end_date?: string; description?: string }>;
    projects?: Array<{ title?: string; description?: string; technologies?: string[] }>;
    education?: Array<{ degree?: string; institution?: string; field_of_study?: string }>;
    raw_text?: string;
  } | null;
  profile?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  updated_at?: string;
}
