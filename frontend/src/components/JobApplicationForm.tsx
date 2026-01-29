import React, { useState } from 'react';
import GlassCard from './GlassCard';
import GlassButton from './GlassButton';
import { createJob, JobCreate } from '@/services/api';

interface JobApplicationFormProps {
  onSubmit: (jobDescription: string, resumeFile: File, jobId?: number) => Promise<void>;
  isLoading: boolean;
}

const JobApplicationForm: React.FC<JobApplicationFormProps> = ({ onSubmit, isLoading }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [saveJobFirst, setSaveJobFirst] = useState(true);
  const [savingJob, setSavingJob] = useState(false);

  // Extract job title and company from job description if possible
  const extractJobInfo = (description: string) => {
    // Simple extraction - try to find common patterns
    const lines = description.split('\n').slice(0, 5);
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('job title') || lowerLine.includes('position')) {
        const match = line.match(/[:\-]\s*(.+)/);
        if (match && !jobTitle) setJobTitle(match[1].trim());
      }
      if (lowerLine.includes('company') || lowerLine.includes('organization')) {
        const match = line.match(/[:\-]\s*(.+)/);
        if (match && !companyName) setCompanyName(match[1].trim());
      }
    }
  };

  const handleJobDescriptionChange = (value: string) => {
    setJobDescription(value);
    if (saveJobFirst && !jobTitle && !companyName) {
      extractJobInfo(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription || !resumeFile) {
      alert('Please provide both a job description and a resume file');
      return;
    }

    let jobId: number | undefined = undefined;
    
    try {
      // Save job first if enabled
      if (saveJobFirst && jobTitle && companyName) {
        setSavingJob(true);
        const jobData: JobCreate = {
          title: jobTitle,
          company: companyName,
          description: jobDescription,
          url: jobUrl || undefined,
          source: 'Manual',
          status: 'New',
        };
        const savedJob = await createJob(jobData);
        jobId = savedJob.id;
        setSavingJob(false);
      }
      
      await onSubmit(jobDescription, resumeFile, jobId);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSavingJob(false);
    }
  };

  return (
    <GlassCard className="p-8 max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            id="saveJobFirst"
            checked={saveJobFirst}
            onChange={(e) => setSaveJobFirst(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="saveJobFirst" className="text-sm">
            Save job to tracker before customizing resume
          </label>
        </div>

        {saveJobFirst && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="jobTitle" className="block mb-2 font-medium">
                Job Title *
              </label>
              <input
                id="jobTitle"
                type="text"
                className="w-full p-3 glassmorphism bg-white/5 outline-none focus:border-white/30"
                placeholder="e.g., Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required={saveJobFirst}
              />
            </div>
            <div>
              <label htmlFor="companyName" className="block mb-2 font-medium">
                Company Name *
              </label>
              <input
                id="companyName"
                type="text"
                className="w-full p-3 glassmorphism bg-white/5 outline-none focus:border-white/30"
                placeholder="e.g., Google"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required={saveJobFirst}
              />
            </div>
          </div>
        )}

        {saveJobFirst && (
          <div>
            <label htmlFor="jobUrl" className="block mb-2 font-medium">
              Job Posting URL (optional)
            </label>
            <input
              id="jobUrl"
              type="url"
              className="w-full p-3 glassmorphism bg-white/5 outline-none focus:border-white/30"
              placeholder="https://..."
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
            />
          </div>
        )}

        <div>
          <label htmlFor="jobDescription" className="block mb-2 font-medium">
            Job Description
          </label>
          <textarea
            id="jobDescription"
            rows={8}
            className="w-full p-3 glassmorphism bg-white/5 outline-none focus:border-white/30"
            placeholder="Paste the job description here"
            value={jobDescription}
            onChange={(e) => handleJobDescriptionChange(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label htmlFor="resumeFile" className="block mb-2 font-medium">
            Upload Resume (PDF)
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              id="resumeFile"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              required
            />
            <label 
              htmlFor="resumeFile" 
              className="glassmorphism cursor-pointer p-3 bg-white/5 flex-1 text-center"
            >
              {resumeFile ? resumeFile.name : 'Click to select your resume PDF'}
            </label>
            {resumeFile && (
              <button 
                type="button" 
                className="glassmorphism p-2 bg-red-500/20 hover:bg-red-500/30"
                onClick={() => setResumeFile(null)}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <GlassButton 
            type="submit" 
            className="text-lg py-3 px-12 rounded-full" 
            disabled={isLoading || savingJob}
          >
            {savingJob ? 'Saving Job...' : isLoading ? 'Processing...' : saveJobFirst ? 'Save Job & Customize Resume' : 'Process Application'}
          </GlassButton>
        </div>
      </form>
    </GlassCard>
  );
};

export default JobApplicationForm; 