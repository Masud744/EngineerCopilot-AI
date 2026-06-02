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
