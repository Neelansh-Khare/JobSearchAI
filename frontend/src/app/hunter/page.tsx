'use client';

import { useState } from 'react';
import { JobSearchAPI, JobSearchParams, SearchJob } from '@/services/api';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function HunterPage() {
  const [searchParams, setSearchParams] = useState<JobSearchParams>({
    query: '',
    location: '',
    remote_only: false,
    employment_types: '',
    date_posted: '',
    page: 1,
    num_pages: 1,
  });
  const [jobs, setJobs] = useState<SearchJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchParams.query.trim()) {
      toast.error('Please enter a job search query');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const results = await JobSearchAPI.searchJobs(searchParams);
      setJobs(results.jobs);
      if (results.jobs.length === 0) {
        toast('No jobs found. Try adjusting your search criteria.', { icon: 'ℹ️' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search jobs';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveJob = async (job: SearchJob) => {
    setSavingJobId(job.external_id || job.job_id || '');
    try {
      await JobSearchAPI.saveJobFromSearch(job);
      toast.success(`Saved "${job.title}" to your tracker!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save job';
      toast.error(errorMessage);
    } finally {
      setSavingJobId(null);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <main className="max-w-7xl mx-auto space-y-8">
        <section className="mt-10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold">Job Hunter</h1>
            <div className="flex gap-4">
              <Link href="/jobs">
                <GlassButton>My Jobs</GlassButton>
              </Link>
              <Link href="/">
                <GlassButton>Customize Resume</GlassButton>
              </Link>
            </div>
          </div>

          <GlassCard className="p-6 mb-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="query" className="block mb-2 font-medium">
                    Job Title / Keywords *
                  </label>
                  <input
                    id="query"
                    type="text"
                    value={searchParams.query}
                    onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
                    placeholder="e.g., Software Engineer, Data Scientist"
                    className="w-full p-3 glassmorphism bg-white/5 outline-none focus:border-white/30"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block mb-2 font-medium">
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={searchParams.location || ''}
                    onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                    placeholder="e.g., San Francisco, CA"
                    className="w-full p-3 glassmorphism bg-white/5 outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label htmlFor="employment_types" className="block mb-2 font-medium">
                    Employment Type
                  </label>
                  <select
                    id="employment_types"
                    value={searchParams.employment_types || ''}
                    onChange={(e) => setSearchParams({ ...searchParams, employment_types: e.target.value })}
                    className="w-full p-3 glassmorphism bg-white/5 outline-none focus:border-white/30"
                  >
                    <option value="">All Types</option>
                    <option value="FULLTIME">Full-time</option>
                    <option value="PARTTIME">Part-time</option>
                    <option value="CONTRACTOR">Contractor</option>
                    <option value="INTERN">Intern</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="date_posted" className="block mb-2 font-medium">
                    Date Posted
                  </label>
                  <select
                    id="date_posted"
                    value={searchParams.date_posted || ''}
                    onChange={(e) => setSearchParams({ ...searchParams, date_posted: e.target.value })}
                    className="w-full p-3 glassmorphism bg-white/5 outline-none focus:border-white/30"
                  >
                    <option value="">Any Time</option>
                    <option value="today">Today</option>
                    <option value="3days">Last 3 Days</option>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={searchParams.remote_only || false}
                    onChange={(e) => setSearchParams({ ...searchParams, remote_only: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span>Remote Only</span>
                </label>
              </div>

              <GlassButton type="submit" disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Search Jobs'}
              </GlassButton>
            </form>
          </GlassCard>

          {error && (
            <GlassCard className="p-6 bg-red-500/10 mb-6">
              <p className="text-red-400">{error}</p>
            </GlassCard>
          )}

          {jobs.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Search Results ({jobs.length} jobs)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job, index) => (
                  <GlassCard key={job.external_id || job.job_id || index} className="p-6 flex flex-col">
                    <div className="flex-1 mb-4">
                      <h3 className="text-xl font-bold mb-1">{job.title}</h3>
                      <p className="text-lg opacity-80 mb-2">{job.company}</p>
                      {job.location && (
                        <p className="text-sm opacity-70 mb-2">
                          📍 {job.location} {job.remote && '(Remote)'}
                        </p>
                      )}
                      {job.salary_min && job.salary_max && (
                        <p className="text-sm opacity-70 mb-2">
                          💰 {job.salary_currency || 'USD'} {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()}
                        </p>
                      )}
                      <p className="text-sm opacity-70 line-clamp-3 mt-2">{job.description}</p>
                    </div>

                    <div className="space-y-2 mt-auto">
                      <GlassButton
                        onClick={() => handleSaveJob(job)}
                        disabled={savingJobId === (job.external_id || job.job_id || '')}
                        className="w-full"
                      >
                        {savingJobId === (job.external_id || job.job_id || '') ? 'Saving...' : 'Save to Tracker'}
                      </GlassButton>
                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-center text-sm text-blue-400 hover:text-blue-300"
                        >
                          View Job Posting →
                        </a>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {!isLoading && jobs.length === 0 && searchParams.query && (
            <GlassCard className="p-8 text-center">
              <p className="text-xl mb-4">No jobs found.</p>
              <p className="mb-6">Try adjusting your search criteria or search for different keywords.</p>
            </GlassCard>
          )}
        </section>
      </main>
    </div>
  );
}
