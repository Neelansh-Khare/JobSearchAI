'use client';

import { useState, useEffect } from 'react';
import { getJobs, deleteJob, updateJob, Job } from '@/services/api';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import Link from 'next/link';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadJobs();
  }, [statusFilter]);

  const loadJobs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getJobs(1, statusFilter || undefined);
      setJobs(data);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (jobId: number) => {
    if (!confirm('Are you sure you want to delete this job?')) {
      return;
    }
    try {
      await deleteJob(jobId);
      loadJobs();
    } catch (err) {
      console.error('Error deleting job:', err);
      alert('Failed to delete job');
    }
  };

  const handleStatusChange = async (jobId: number, newStatus: Job['status']) => {
    try {
      await updateJob(jobId, { status: newStatus });
      loadJobs();
    } catch (err) {
      console.error('Error updating job:', err);
      alert('Failed to update job status');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <p>Loading jobs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <main className="max-w-7xl mx-auto space-y-8">
        <section className="mt-10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold">My Jobs</h1>
            <Link href="/">
              <GlassButton>Customize Resume</GlassButton>
            </Link>
          </div>

          <div className="mb-6">
            <label htmlFor="statusFilter" className="block mb-2 font-medium">
              Filter by Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-3 glassmorphism bg-white/5 outline-none focus:border-white/30"
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Saved">Saved</option>
              <option value="Applied">Applied</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {error && (
            <GlassCard className="p-6 bg-red-500/10 mb-6">
              <p className="text-red-400">{error}</p>
            </GlassCard>
          )}

          {jobs.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <p className="text-xl mb-4">No jobs found.</p>
              <p className="mb-6">Start by customizing a resume for a job to save it to your tracker.</p>
              <Link href="/">
                <GlassButton>Customize Resume</GlassButton>
              </Link>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <GlassCard key={job.id} className="p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">{job.title}</h3>
                      <p className="text-lg opacity-80">{job.company}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="text-red-400 hover:text-red-300 ml-2"
                      title="Delete job"
                    >
                      ×
                    </button>
                  </div>

                  <div className="mb-4 flex-1">
                    <p className="text-sm opacity-70 line-clamp-3">{job.description}</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select
                        value={job.status}
                        onChange={(e) => handleStatusChange(job.id, e.target.value as Job['status'])}
                        className="w-full p-2 glassmorphism bg-white/5 outline-none focus:border-white/30 text-sm"
                      >
                        <option value="New">New</option>
                        <option value="Saved">Saved</option>
                        <option value="Applied">Applied</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-400 hover:text-blue-300"
                      >
                        View Job Posting →
                      </a>
                    )}

                    <div className="text-xs opacity-60">
                      Added {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
