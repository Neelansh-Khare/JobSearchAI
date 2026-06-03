'use client';

import { useState, useEffect } from 'react';
import { JobSearchAPI } from '@/services/api';
import { Job } from '@/types';
import GlassCard from './GlassCard';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchScores, setMatchScores] = useState<Record<number, number>>({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, jobsData] = await Promise.all([
          JobSearchAPI.getJobStats(),
          JobSearchAPI.getJobs()
        ]);
        setStats(statsData);
        setJobs(jobsData);
        
        // Fetch match scores for recent jobs
        const recent = [...jobsData].sort((a, b) => 
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        ).slice(0, 5);
        
        recent.forEach(async (job) => {
            try {
                const scoreData = await JobSearchAPI.getJobMatchScore(job.id);
                setMatchScores(prev => ({ ...prev, [job.id]: scoreData.match_score }));
            } catch (e) {
                console.error(`Failed to fetch match score for job ${job.id}`);
            }
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="text-gray-400">Loading your command center...</p>
      </div>
    );
  }

  const upcomingInterviews = jobs.filter(job => {
    const interviewDate = job.applications?.[0]?.interview_date;
    if (!interviewDate) return false;
    return new Date(interviewDate) >= new Date();
  }).sort((a, b) => {
    const dateA = new Date(a.applications![0].interview_date!);
    const dateB = new Date(b.applications![0].interview_date!);
    return dateA.getTime() - dateB.getTime();
  });

  const recentJobs = [...jobs].sort((a, b) => 
    new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  ).slice(0, 5);

  return (
    <div className="space-y-10 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white">Welcome Back!</h1>
          <p className="text-gray-400 mt-1">Here is what&apos;s happening with your job search.</p>
        </div>
        <div className="flex gap-3">
            <Link href="/hunter">
                <button className="glassmorphism px-4 py-2 text-sm font-bold text-white hover:bg-white/10 transition-all">
                    Find Jobs
                </button>
            </Link>
            <Link href="/analytics">
                <button className="glassmorphism px-4 py-2 text-sm font-bold text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 transition-all">
                    Full Analytics
                </button>
            </Link>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard className="p-6 border-blue-500/20">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Applied</p>
          <p className="text-3xl font-bold text-white">{stats?.funnel?.applied || 0}</p>
        </GlassCard>
        <GlassCard className="p-6 border-purple-500/20">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Interviews</p>
          <p className="text-3xl font-bold text-white">{stats?.funnel?.interviews || 0}</p>
        </GlassCard>
        <GlassCard className="p-6 border-green-500/20">
          <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-1">Offers</p>
          <p className="text-3xl font-bold text-white">{stats?.funnel?.offers || 0}</p>
        </GlassCard>
        <GlassCard className="p-6 border-indigo-500/20">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Velocity (7d)</p>
          <p className="text-3xl font-bold text-white">{stats?.velocity_7d || 0}</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Upcoming Interviews */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🗓️ Upcoming Interviews
          </h2>
          {upcomingInterviews.length > 0 ? (
            <div className="space-y-4">
              {upcomingInterviews.map(job => (
                <GlassCard key={`dashboard-int-${job.id}`} className="p-4 border-purple-500/30 hover:border-purple-500/50 transition-all">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-white">{job.title}</h3>
                      <p className="text-sm text-gray-400">{job.company}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-purple-400">
                        {new Date(job.applications![0].interview_date!).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      <Link href="/jobs" className="text-[10px] text-gray-500 hover:text-white transition-colors">
                        View Details →
                      </Link>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard className="p-10 text-center border-dashed border-2 border-white/5">
              <p className="text-gray-500 italic">No interviews scheduled yet. Keep applying!</p>
            </GlassCard>
          )}
        </section>

        {/* Recent Activity */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🕒 Recent Activity
          </h2>
          {recentJobs.length > 0 ? (
            <div className="space-y-4">
              {recentJobs.map(job => (
                <GlassCard key={`dashboard-recent-${job.id}`} className="p-4 border-white/5 hover:border-white/20 transition-all">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-white">{job.title}</h3>
                      <p className="text-sm text-gray-400">{job.company}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="flex gap-2 items-center">
                        {matchScores[job.id] !== undefined && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                matchScores[job.id] >= 80 ? 'border-green-500/50 text-green-400 bg-green-500/10' :
                                matchScores[job.id] >= 60 ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10' :
                                'border-red-500/50 text-red-400 bg-red-500/10'
                            }`} title="AI Match Score">
                                {matchScores[job.id]}% Match
                            </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            job.status === 'Applied' ? 'bg-blue-500/20 text-blue-300' :
                            job.status === 'Interview' ? 'bg-purple-500/20 text-purple-300' :
                            job.status === 'Offer' ? 'bg-green-500/20 text-green-300' :
                            'bg-white/10 text-gray-300'
                        }`}>
                            {job.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                        Added {new Date(job.created_at || '').toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              ))}
              <div className="text-center pt-2">
                <Link href="/jobs" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                  View All Jobs →
                </Link>
              </div>
            </div>
          ) : (
            <GlassCard className="p-10 text-center border-dashed border-2 border-white/5">
              <p className="text-gray-500 italic">No activity yet. Start your journey!</p>
            </GlassCard>
          )}
        </section>
      </div>

      {/* Quick Actions */}
      <section className="pt-10 border-t border-white/5">
        <h2 className="text-2xl font-bold text-white mb-8">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/">
            <GlassCard className="p-6 hover:bg-white/5 transition-all cursor-pointer group">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">✨</div>
              <h3 className="text-lg font-bold text-white mb-2">Tailor Resume</h3>
              <p className="text-sm text-gray-400">Optimize your resume for a specific job.</p>
            </GlassCard>
          </Link>
          <Link href="/hunter">
            <GlassCard className="p-6 hover:bg-white/5 transition-all cursor-pointer group">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">🔍</div>
              <h3 className="text-lg font-bold text-white mb-2">Find Jobs</h3>
              <p className="text-sm text-gray-400">Discover new opportunities with AI search.</p>
            </GlassCard>
          </Link>
          <Link href="/outreach">
            <GlassCard className="p-6 hover:bg-white/5 transition-all cursor-pointer group">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">📧</div>
              <h3 className="text-lg font-bold text-white mb-2">Generate Outreach</h3>
              <p className="text-sm text-gray-400">Create personalized emails for networking.</p>
            </GlassCard>
          </Link>
        </div>
      </section>
    </div>
  );
}
