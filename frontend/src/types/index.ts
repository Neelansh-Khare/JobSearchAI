export interface ResumeSection {
  [key: string]: string | string[] | unknown;
}

export interface ParsedResume {
  personal_info: {
    name?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    github?: string;
    [key: string]: string | undefined;
  };
  education: Array<{
    institution: string;
    degree: string;
    dates: string;
    location?: string;
    [key: string]: string | undefined;
  }>;
  experience: Array<{
    company: string;
    title: string;
    dates: string;
    location?: string;
    details?: string[];
    [key: string]: string | string[] | undefined;
  }>;
  skills: {
    [category: string]: string[] | {
      [subCategory: string]: string[];
    };
  };
  projects?: Array<{
    name: string;
    technologies: string | string[];
    dates?: string;
    details?: string[];
    [key: string]: string | string[] | undefined;
  }>;
  certifications?: Array<{
    name: string;
    organization: string;
    dates?: string;
    [key: string]: string | undefined;
  }>;
  achievements?: string[];
  [key: string]: unknown;
}

export interface JobDescription {
  overview?: string;
  responsibilities?: string;
  requirements?: string;
  qualifications?: string;
  preferred_skills?: string;
  [key: string]: string | undefined;
}

export interface KeywordMatchAnalysis {
  matched_keywords: string[];
  missing_keywords: string[];
}

export interface SectionScores {
  skills_score: number;
  experience_score: number;
  education_score: number;
  overall_format_score: number;
}

export interface AtsAnalysis {
  score: number;
  improvements: string[];
  keyword_match_analysis: KeywordMatchAnalysis;
  section_scores: SectionScores;
}

export interface ModificationsSummary {
  title_adjustments?: string | string[];
  bullet_point_rewrites?: string | string[];
  project_updates?: string | string[];
  skills_enhancement?: string | string[];
  relevance_and_compliance?: string | string[];
  other_changes?: string | string[];
  [key: string]: string | string[] | undefined;
}

export interface CustomizeResumeResponse {
  success: boolean;
  customized_resume?: ParsedResume;
  pdf_path?: string;
  s3_pdf_url?: string;
  json_path?: string;
  s3_json_url?: string;
  modifications_summary?: ModificationsSummary;
  initial_ats_score?: number;
  initial_ats_feedback?: string[];
  final_ats_score?: number;
  final_ats_feedback?: string[];
  score_improvement?: number;
  [key: string]: unknown | boolean | string | ParsedResume | ModificationsSummary | number | string[] | undefined;
}

export type JobStatus = 'New' | 'Saved' | 'Applied' | 'Interview' | 'Offer' | 'Rejected';

export interface Job {
  id: number;
  user_id: number;
  title: string;
  company: string;
  description: string;
  url?: string;
  source?: string;
  status: JobStatus;
  salary_range?: string;
  remote_policy?: string;
  location?: string;
  created_at: string;
  updated_at?: string;
}

export interface JobCreate {
  title: string;
  company: string;
  description: string;
  url?: string;
  source?: string;
  status?: JobStatus;
  salary_range?: string;
  remote_policy?: string;
  location?: string;
}

export interface JobUpdate {
  title?: string;
  company?: string;
  description?: string;
  url?: string;
  source?: string;
  status?: JobStatus;
  salary_range?: string;
  remote_policy?: string;
  location?: string;
}

export interface Referral {
  id: number;
  user_id: number;
  job_id?: number;
  company: string;
  contact_name: string;
  contact_email_or_profile?: string;
  relationship?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface ReferralCreate {
  user_id: number;
  job_id?: number;
  company: string;
  contact_name: string;
  contact_email_or_profile?: string;
  relationship?: string;
  status?: string;
  notes?: string;
}

export interface ReferralUpdate {
  job_id?: number;
  company?: string;
  contact_name?: string;
  contact_email_or_profile?: string;
  relationship?: string;
  status?: string;
  notes?: string;
} 