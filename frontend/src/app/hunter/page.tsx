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
      } else {
        toast.success(`Found ${results.jobs.length} jobs!`);
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
    const jobId = job.external_id || job.job_id || '';
    setSavingJobId(jobId);
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
    <div className="min-h-screen p-4 md:p-8 animate-fade-in">
      <main className="max-w-7xl mx-auto space-y-8 pb-20">
        <section className="mt-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-white">Job Hunter</h1>
              <p className="text-gray-400 mt-2">Discover your next opportunity</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/jobs">
                <GlassButton variant="secondary">My Jobs</GlassButton>
              </Link>
              <Link href="/">
                <GlassButton variant="primary">Customize Resume</GlassButton>
              </Link>
            </div>
          </div>

          <GlassCard className="p-8 mb-12 border-indigo-500/10">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="query" className="block mb-2 text-sm font-medium text-gray-300">
                    Job Title / Keywords *
                  </label>
                  <input
                    id="query"
                    type="text"
                    value={searchParams.query}
                    onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
                    placeholder="e.g., Software Engineer, Data Scientist"
                    className="w-full p-3 glassmorphism bg-white/5 outline-none focus:border-indigo-500/50 text-white"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block mb-2 text-sm font-medium text-gray-300">
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={searchParams.location || ''}
                    onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                    placeholder="e.g., San Francisco, CA"
                    className="w-full p-3 glassmorphism bg-white/5 outline-none focus:border-indigo-500/50 text-white"
                  />
                </div>

                <div>
                  <label htmlFor="employment_types" className="block mb-2 text-sm font-medium text-gray-300">
                    Employment Type
                  </label>
                  <select
                    id="employment_types"
                    value={searchParams.employment_types || ''}
                    onChange={(e) => setSearchParams({ ...searchParams, employment_types: e.target.value })}
                    className="w-full p-3 glassmorphism bg-white/5 outline-none focus:border-indigo-500/50 text-white"
                  >
                    <option value="" className="bg-slate-900">All Types</option>
                    <option value="FULLTIME" className="bg-slate-900">Full-time</option>
                    <option value="PARTTIME" className="bg-slate-900">Part-time</option>
                    <option value="CONTRACTOR" className="bg-slate-900">Contractor</option>
                    <option value="INTERN" className="bg-slate-900">Intern</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="date_posted" className="block mb-2 text-sm font-medium text-gray-300">
                    Date Posted
                  </label>
                  <select
                    id="date_posted"
                    value={searchParams.date_posted || ''}
                    onChange={(e) => setSearchParams({ ...searchParams, date_posted: e.target.value })}
                    className="w-full p-3 glassmorphism bg-white/5 outline-none focus:border-indigo-500/50 text-white"
                  >
                    <option value="" className="bg-slate-900">Any Time</option>
                    <option value="today" className="bg-slate-900">Today</option>
                    <option value="3days" className="bg-slate-900">Last 3 Days</option>
                    <option value="week" className="bg-slate-900">Last Week</option>
                    <option value="month" className="bg-slate-900">Last Month</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={searchParams.remote_only || false}
                      onChange={(e) => setSearchParams({ ...searchParams, remote_only: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-white/10 rounded-full peer-checked:bg-indigo-500 transition-colors"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Remote Only</span>
                </label>
              </div>

              <div className="pt-4">
                <GlassButton type="submit" isLoading={isLoading} className="px-12 py-3 rounded-full text-lg">
                  Search Jobs
                </GlassButton>
              </div>
            </form>
          </GlassCard>

          {error && (
            <GlassCard className="p-6 bg-red-500/10 mb-6 border-red-500/20">
              <p className="text-red-400 flex items-center">
                <span className="mr-2">⚠️</span> {error}
              </p>
            </GlassCard>
          )}

          {jobs.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-bold text-white">Search Results</h2>
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-indigo-300">
                  {jobs.length} JOBS FOUND
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {jobs.map((job, index) => {
                  const jobId = job.external_id || job.job_id || `job-${index}`;
                  return (
                    <GlassCard key={jobId} className="p-8 flex flex-col hover:border-indigo-500/30">
                      <div className="flex-1 mb-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold text-white leading-tight line-clamp-2">{job.title}</h3>
                        </div>
                        <p className="text-indigo-300 font-semibold mb-3">{job.company}</p>
                        
                        {job.network_contacts && job.network_contacts.length > 0 && (
                          <div className="mb-4">
                            <span className="bg-green-500/20 text-green-300 text-xs px-3 py-1.5 rounded-full border border-green-500/30 inline-flex items-center gap-1.5 font-medium">
                              🤝 {job.network_contacts.length} Connection{job.network_contacts.length === 1 ? '' : 's'} here
                            </span>
                          </div>
                        )}

                        <div className="space-y-2 mb-6">
                          {job.location && (
                            <p className="text-sm text-gray-400 flex items-center">
                              <span className="mr-2 opacity-50">📍</span> {job.location} {job.remote && '(Remote)'}
                            </p>
                          )}
                          {job.salary_min && job.salary_max && (
                            <p className="text-sm text-gray-400 flex items-center">
                              <span className="mr-2 opacity-50">💰</span> {job.salary_currency || 'USD'} {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()}
                            </p>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-500 line-clamp-4 leading-relaxed italic">
                          "{job.description}"
                        </p>
                      </div>

                      <div className="space-y-3 mt-auto pt-6 border-t border-white/5">
                        <GlassButton
                          onClick={() => handleSaveJob(job)}
                          isLoading={savingJobId === jobId}
                          className="w-full py-2.5"
                          variant="primary"
                        >
                          Save to Tracker
                        </GlassButton>
                        {job.url && (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-center text-sm font-semibold text-indigo-400 hover:text-indigo-300 py-1 transition-colors"
                          >
                            View Details →
                          </a>
                        )}
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          )}

          {!isLoading && jobs.length === 0 && searchParams.query && (
            <GlassCard className="p-16 text-center border-dashed border-2 border-white/10">
              <div className="text-6xl mb-6 opacity-20">🔍</div>
              <p className="text-2xl font-bold text-white mb-2">No jobs found.</p>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">Try adjusting your search criteria or search for different keywords.</p>
            </GlassCard>
          )}
        </section>
      </main>
    </div>
  );
}
