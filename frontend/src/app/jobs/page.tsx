'use client';

import { useState, useEffect, useCallback } from 'react';
import { JobSearchAPI } from '@/services/api';
import { Job } from '@/types';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import KanbanBoard from '@/components/Kanban/KanbanBoard';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STATUSES: Job['status'][] = ['New', 'Saved', 'Applied', 'Interview', 'Offer', 'Rejected'];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await JobSearchAPI.getJobs(1, statusFilter || undefined);
      setJobs(data);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
      toast.error('Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleDelete = async (jobId: number) => {
    try {
      await JobSearchAPI.deleteJob(jobId);
      toast.success('Job deleted');
      loadJobs();
    } catch (err) {
      console.error('Error deleting job:', err);
      toast.error('Failed to delete job');
    }
  };

  const handleJobMove = async (jobId: number, newStatus: Job['status']) => {
    try {
      await JobSearchAPI.updateJob(jobId, { status: newStatus });
      const job = jobs.find((j) => j.id === jobId);
      toast.success(`Moved "${job?.title}" to ${newStatus}`);
      loadJobs();
    } catch (err) {
      console.error('Error updating job:', err);
      toast.error('Failed to update job status');
    }
  };

  const handleSyncGmail = async () => {
    setIsSyncing(true);
    try {
      const result = await JobSearchAPI.scanGmail(1, 7);
      if (result.updates_found > 0) {
        toast.success(`Found ${result.updates_found} updates from Gmail!`);
        loadJobs();
      } else {
        toast('No new job updates found in Gmail.', { icon: '📧' });
      }
    } catch (err) {
      console.error('Error syncing Gmail:', err);
      toast.error('Failed to sync Gmail. Ensure your Gmail token is configured.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading && jobs.length === 0) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center space-y-4">
        <div className="loading-spinner w-12 h-12 border-4" />
        <p className="text-gray-400 animate-pulse">Loading your jobs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 animate-fade-in">
      <main className="max-w-7xl mx-auto space-y-8">
        <section className="mt-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-white">My Jobs</h1>
              <p className="text-gray-400 mt-2">Track and manage your applications</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <GlassButton 
                onClick={handleSyncGmail} 
                isLoading={isSyncing}
                variant="secondary"
              >
                📧 Sync Gmail
              </GlassButton>
              <Link href="/hunter">
                <GlassButton>Find Jobs</GlassButton>
              </Link>
              <Link href="/">
                <GlassButton variant="primary">Customize Resume</GlassButton>
              </Link>
            </div>
          </div>

          <div className="mb-10 flex items-center gap-4">
            <div className="glassmorphism p-1 flex items-center">
              <span className="px-4 text-sm text-gray-400 font-medium">Filter by Status:</span>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 bg-transparent outline-none text-white font-medium cursor-pointer"
              >
                <option value="" className="bg-slate-900">All Statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status} className="bg-slate-900">
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <GlassCard className="p-6 bg-red-500/10 mb-6 border-red-500/20">
              <p className="text-red-400 font-medium flex items-center">
                <span className="mr-2">⚠️</span> {error}
              </p>
            </GlassCard>
          )}

          {jobs.length === 0 && !isLoading ? (
            <GlassCard className="p-16 text-center border-dashed border-2 border-white/10">
              <div className="text-6xl mb-6 opacity-20">📂</div>
              <p className="text-2xl font-bold text-white mb-2">No jobs found.</p>
              <p className="text-gray-400 mb-10 max-w-md mx-auto">Start by finding jobs or customizing a resume for a job you've seen.</p>
              <div className="flex gap-4 justify-center">
                <Link href="/hunter">
                  <GlassButton>Find Jobs</GlassButton>
                </Link>
                <Link href="/">
                  <GlassButton variant="primary">Customize Resume</GlassButton>
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
