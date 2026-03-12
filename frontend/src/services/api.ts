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
  network_contacts?: Referral[];
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

// Token management
const TOKEN_KEY = 'jobsearchai_token';

export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

export const setToken = (token: string | null) => {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
};

const getHeaders = (contentType: string = 'application/json') => {
  const headers: Record<string, string> = {};
  if (contentType !== 'multipart/form-data') {
    headers['Content-Type'] = contentType;
  }
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const JobSearchAPI = {
  // Auth methods
  login: async (email: string, password: string): Promise<{ access_token: string; token_type: string }> => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Login failed');
    }

    const data = await response.json();
    setToken(data.access_token);
    return data;
  },

  register: async (userData: any): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Registration failed');
    }

    return response.json();
  },

  getCurrentUser: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return response.json();
  },

  logout: () => {
    setToken(null);
  },

  customizeResume: async (jobDescription: string, resumeFile: File): Promise<CustomizeResumeResponse> => {
    const formData = new FormData();
    formData.append('job_description_text', jobDescription);
    formData.append('resume', resumeFile);

    const response = await fetch(`${API_BASE_URL}/customize-resume/`, {
      method: 'POST',
      headers: getHeaders('multipart/form-data'),
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to customize resume');
    }

    return response.json();
  },

  createJob: async (job: JobCreate): Promise<Job> => {
    const response = await fetch(`${API_BASE_URL}/jobs/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(job),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create job');
    }

    return response.json();
  },

  getJobs: async (
    status?: string,
    company?: string,
    skip: number = 0,
    limit: number = 100
  ): Promise<Job[]> => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    if (status) params.append('status', status);
    if (company) params.append('company', company);

    const response = await fetch(`${API_BASE_URL}/jobs/?${params.toString()}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch jobs');
    }

    return response.json();
  },

  getJob: async (jobId: number): Promise<Job> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch job');
    }

    return response.json();
  },

  updateJob: async (jobId: number, jobUpdate: JobUpdate): Promise<Job> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: 'PATCH',
      headers: getHeaders(),
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
      headers: getHeaders(),
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

    const response = await fetch(`${API_BASE_URL}/search/jobs?${queryParams.toString()}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to search jobs');
    }

    return response.json();
  },

  saveJobFromSearch: async (jobData: SearchJob): Promise<{ success: boolean; job: Job; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/search/jobs/save`, {
      method: 'POST',
      headers: getHeaders(),
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
      headers: getHeaders(),
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
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to find contacts');
    }

    return response.json();
  },

  autoApply: async (jobUrl: string): Promise<unknown> => {
    const response = await fetch(`${API_BASE_URL}/automation/apply`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        job_url: jobUrl,
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
      headers: getHeaders(),
      body: JSON.stringify(referral),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create referral');
    }

    return response.json();
  },

  getReferrals: async (company?: string, status?: string): Promise<Referral[]> => {
    const params = new URLSearchParams();
    if (company) params.append('company', company);
    if (status) params.append('status', status);

    const response = await fetch(`${API_BASE_URL}/referrals/?${params.toString()}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch referrals');
    }

    return response.json();
  },

  updateReferral: async (referralId: number, referralUpdate: ReferralUpdate): Promise<Referral> => {
    const response = await fetch(`${API_BASE_URL}/referrals/${referralId}`, {
      method: 'PATCH',
      headers: getHeaders(),
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
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete referral');
    }
  },

  scanGmail: async (daysBack: number = 7): Promise<{ updates_found: number; updates: any[] }> => {
    const response = await fetch(`${API_BASE_URL}/gmail/scan?days_back=${daysBack}`, {
      method: 'POST',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to scan Gmail');
    }

    return response.json();
  },

  sendEmail: async (payload: GmailSendRequestPayload): Promise<{ status: string; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/gmail/send`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to send email');
    }

    return response.json();
  },
};


 