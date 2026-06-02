export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  country: string;
  city?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  preferred_categories: string[];
  preferred_locations: string[];
  expected_salary_min?: number;
  expected_salary_max?: number;
  salary_currency: string;
  employment_type: string[];
  resume_file_path?: string;
  resume_parsed_data?: Record<string, any>;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  user_id: string;
  skill_name: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_experience?: number;
}

export interface Education {
  id: string;
  user_id: string;
  institution: string;
  degree: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
  gpa?: string;
  description?: string;
  is_current: boolean;
}

export interface Experience {
  id: string;
  user_id: string;
  company: string;
  title: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
  technologies: string[];
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  technologies: string[];
  url?: string;
  github_url?: string;
  start_date?: string;
  end_date?: string;
  highlights: string[];
}

export interface Certification {
  id: string;
  user_id: string;
  name: string;
  issuing_organization?: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
}
