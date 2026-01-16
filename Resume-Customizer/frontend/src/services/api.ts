import { CustomizeResumeResponse, Job, JobCreate, JobUpdate } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

/**
 * Customize resume with job description and resume
 */
export const customizeResume = async (jobDescription: string, resumeFile: File): Promise<CustomizeResumeResponse> => {
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
};

/**
 * Job CRUD operations
 */
export const createJob = async (job: JobCreate, userId: number = 1): Promise<Job> => {
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
};

export const getJobs = async (
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
};

export const getJob = async (jobId: number): Promise<Job> => {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch job');
  }

  return response.json();
};

export const updateJob = async (jobId: number, jobUpdate: JobUpdate): Promise<Job> => {
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
};

export const deleteJob = async (jobId: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to delete job');
  }
};

export const getApiBaseUrl = (): string => {
  return API_BASE_URL;
}; 