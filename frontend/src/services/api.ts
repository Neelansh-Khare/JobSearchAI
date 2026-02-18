import { CustomizeResumeResponse, Job, JobCreate, JobUpdate, Referral, ReferralCreate, ReferralUpdate } from '@/types';

interface NextWindow {
  __NEXT_DATA__?: {
    env?: {
      [key: string]: string;
    };
  };
}

// Next.js injects NEXT_PUBLIC_* env vars at build time
// Access via globalThis to avoid TypeScript errors
const getEnvVar = (key: string): string | undefined => {
  if (typeof window !== 'undefined') {
    return (window as unknown as NextWindow).__NEXT_DATA__?.env?.[key];
  }
  return undefined;
};

export const getApiBaseUrl = () => getEnvVar('NEXT_PUBLIC_API_BASE_URL') || 'http://127.0.0.1:8000';

const API_BASE_URL = getApiBaseUrl();

/**
 * Customize resume with job description and resume
 */
// Job Search operations (Phase 2: Hunter)
export interface JobSearchParams {
  query: string;
  location?: string;
  remote_only?: boolean;
  employment_types?: string;
  job_requirements?: string;
  date_posted?: string;
  page?: number;
  num_pages?: number;
}

export interface SearchJob {
  job_id?: string;
  title: string;
  company: string;
  description: string;
  url: string;
  location?: string;
  remote?: boolean;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  posted_at?: string;
  source?: string;
  external_id?: string;
}

export interface JobSearchResponse {
  success: boolean;
  jobs: SearchJob[];
  total: number;
  page: number;
  num_pages: number;
}

// Outreach API types
export interface EmailGenerateRequestPayload {
  purpose: string;
  tone: string;
  recipient_name: string;
  recipient_company: string;
  additional_context?: string;
}

export interface EmailGenerateResponse {
  email_content: string;
}

export interface ContactFindRequestPayload {
  company_type: string;
  role_types: string[];
  location: string;
  use_linkedin?: boolean;
  max_results?: number;
}

export interface ContactResponsePayload {
  name: string;
  title: string;
  company: string;
  location: string;
  linkedin_url?: string;
  source: string;
}

export const JobSearchAPI = {
  customizeResume: async (jobDescription: string, resumeFile: File): Promise<CustomizeResumeResponse> => {
    const formData = new FormData();
    formData.append('job_description_text', jobDescription);
    formData.append('resume', resumeFile);

    const response = await fetch(`${API_BASE_URL}/customize-resume/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to customize resume');
    }

    return response.json();
  },

  createJob: async (job: JobCreate, userId: number = 1): Promise<Job> => {
    const response = await fetch(`${API_BASE_URL}/jobs/?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(job),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create job');
    }

    return response.json();
  },

  getJobs: async (
    userId: number = 1,
    status?: string,
    company?: string,
    skip: number = 0,
    limit: number = 100
  ): Promise<Job[]> => {
    const params = new URLSearchParams({
      user_id: userId.toString(),
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    if (status) params.append('status', status);
    if (company) params.append('company', company);

    const response = await fetch(`${API_BASE_URL}/jobs/?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch jobs');
    }

    return response.json();
  },

  getJob: async (jobId: number): Promise<Job> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch job');
    }

    return response.json();
  },

  updateJob: async (jobId: number, jobUpdate: JobUpdate): Promise<Job> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobUpdate),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update job');
    }

    return response.json();
  },

  deleteJob: async (jobId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete job');
    }
  },

  searchJobs: async (params: JobSearchParams): Promise<JobSearchResponse> => {
    const queryParams = new URLSearchParams({
      query: params.query,
      page: (params.page || 1).toString(),
      num_pages: (params.num_pages || 1).toString(),
    });
    
    if (params.location) queryParams.append('location', params.location);
    if (params.remote_only) queryParams.append('remote_only', 'true');
    if (params.employment_types) queryParams.append('employment_types', params.employment_types);
    if (params.job_requirements) queryParams.append('job_requirements', params.job_requirements);
    if (params.date_posted) queryParams.append('date_posted', params.date_posted);

    const response = await fetch(`${API_BASE_URL}/search/jobs?${queryParams.toString()}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to search jobs');
    }

    return response.json();
  },

  saveJobFromSearch: async (jobData: SearchJob, userId: number = 1): Promise<{ success: boolean; job: Job; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/search/jobs/save?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to save job');
    }

    return response.json();
  },

  generateEmail: async (payload: EmailGenerateRequestPayload): Promise<EmailGenerateResponse> => {
    const response = await fetch(`${API_BASE_URL}/outreach/email/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to generate email');
    }

    return response.json();
  },

  findContacts: async (payload: ContactFindRequestPayload): Promise<ContactResponsePayload[]> => {
    const response = await fetch(`${API_BASE_URL}/outreach/contacts/find`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to find contacts');
    }

    return response.json();
  },

  autoApply: async (jobUrl: string, userId: number = 1): Promise<unknown> => {
    const response = await fetch(`${API_BASE_URL}/automation/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_url: jobUrl,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to auto-apply');
    }

    return response.json();
  },

  // Referral methods
  createReferral: async (referral: ReferralCreate): Promise<Referral> => {
    const response = await fetch(`${API_BASE_URL}/referrals/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(referral),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create referral');
    }

    return response.json();
  },

  getReferrals: async (userId: number = 1, company?: string, status?: string): Promise<Referral[]> => {
    const params = new URLSearchParams({
      user_id: userId.toString(),
    });
    
    if (company) params.append('company', company);
    if (status) params.append('status', status);

    const response = await fetch(`${API_BASE_URL}/referrals/?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch referrals');
    }

    return response.json();
  },

  updateReferral: async (referralId: number, referralUpdate: ReferralUpdate): Promise<Referral> => {
    const response = await fetch(`${API_BASE_URL}/referrals/${referralId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(referralUpdate),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update referral');
    }

    return response.json();
  },

  deleteReferral: async (referralId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/referrals/${referralId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete referral');
    }
  },
}; 