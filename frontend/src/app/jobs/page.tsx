'use client';

import { useState, useEffect } from 'react';
import { getJobs, deleteJob, updateJob, Job } from '@/services/api';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import KanbanBoard from '@/components/Kanban/KanbanBoard';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STATUSES: Job['status'][] = ['New', 'Saved', 'Applied', 'Interview', 'Offer', 'Rejected'];

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
      toast.error('Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (jobId: number) => {
    try {
      await deleteJob(jobId);
      toast.success('Job deleted');
      loadJobs();
    } catch (err) {
      console.error('Error deleting job:', err);
      toast.error('Failed to delete job');
    }
  };

  const handleJobMove = async (jobId: number, newStatus: Job['status']) => {
    try {
      await updateJob(jobId, { status: newStatus });
      const job = jobs.find((j) => j.id === jobId);
      toast.success(`Moved "${job?.title}" to ${newStatus}`);
      loadJobs();
    } catch (err) {
      console.error('Error updating job:', err);
      toast.error('Failed to update job status');
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
            <div className="flex gap-4">
              <Link href="/hunter">
                <GlassButton>Find Jobs</GlassButton>
              </Link>
              <Link href="/">
                <GlassButton>Customize Resume</GlassButton>
              </Link>
            </div>
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
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
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
              <p className="mb-6">Start by finding jobs or customizing a resume for a job.</p>
              <div className="flex gap-4 justify-center">
                <Link href="/hunter">
                  <GlassButton>Find Jobs</GlassButton>
                </Link>
                <Link href="/">
                  <GlassButton>Customize Resume</GlassButton>
                </Link>
              </div>
            </GlassCard>
          ) : (
            <KanbanBoard
              jobs={jobs}
              onJobMove={handleJobMove}
              onJobDelete={handleDelete}
            />
          )}
        </section>
      </main>
    </div>
  );
}
