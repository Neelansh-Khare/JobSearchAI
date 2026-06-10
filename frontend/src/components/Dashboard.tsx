'use client';

import { useState, useEffect } from 'react';
import { JobSearchAPI } from '@/services/api';
import { Job, DashboardStats, ActionableInsight, Application } from '@/types';
import GlassCard from './GlassCard';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchScores, setMatchScores] = useState<Record<number, number>>({});
  const [insights, setInsights] = useState<ActionableInsight[]>([]);
  const [followUps, setFollowUps] = useState<Application[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, jobsData] = await Promise.all([
          JobSearchAPI.getJobStats(),
          JobSearchAPI.getJobs()
        ]);
        setStats(statsData);
        setJobs(jobsData);

        // Fetch match scores in parallel (fix N+1 + loading race)
        const recent = [...jobsData]
          .sort((a, b) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          )
          .slice(0, 5);

        const scoreResults = await Promise.allSettled(
          recent.map(job => JobSearchAPI.getJobMatchScore(job.id))
        );

        const scores: Record<number, number> = {};
        scoreResults.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            scores[recent[i].id] = result.value.match_score;
          }
        });
        setMatchScores(scores);

        // Fetch AI insights non-blocking — don't delay loading state
        JobSearchAPI.getActionableInsights()
          .then(data => setInsights(data.insights))
          .catch(() => { /* insights unavailable — non-critical, widget stays hidden */ });

        // Non-blocking follow-up fetch
        JobSearchAPI.getFollowUps()
          .then(data => setFollowUps(data))
          .catch(() => { /* non-critical */ });
      } catch (error) {
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

  // Safe date helper — avoids non-null assertions on interview_date
  const getInterviewDate = (job: Job): Date | null => {
    const dateStr = job.applications?.[0]?.interview_date;
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const upcomingInterviews = jobs
    .filter(job => {
      const d = getInterviewDate(job);
      return d !== null && d >= new Date();
    })
    .sort((a, b) => getInterviewDate(a)!.getTime() - getInterviewDate(b)!.getTime());

  const recentJobs = [...jobs]
    .sort((a, b) =>
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )
    .slice(0, 5);

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
          <p className="text-3xl font-bold text-white">{stats?.funnel?.applied ?? 0}</p>
        </GlassCard>
        <GlassCard className="p-6 border-purple-500/20">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Interviews</p>
          <p className="text-3xl font-bold text-white">{stats?.funnel?.interviews ?? 0}</p>
        </GlassCard>
        <GlassCard className="p-6 border-green-500/20">
          <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-1">Offers</p>
          <p className="text-3xl font-bold text-white">{stats?.funnel?.offers ?? 0}</p>
        </GlassCard>
        <GlassCard className="p-6 border-indigo-500/20">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Velocity (7d)</p>
          <p className="text-3xl font-bold text-white">{stats?.velocity_7d ?? 0}</p>
        </GlassCard>
      </div>

      {/* Follow-up Reminders Banner */}
      {followUps.length > 0 && (
        <section>
          <GlassCard className="p-5 border-orange-500/30 bg-orange-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-orange-400">
                  {followUps.length} application{followUps.length > 1 ? 's' : ''} need{followUps.length === 1 ? 's' : ''} a follow-up
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Reach out to keep your candidacy fresh.
                </p>
              </div>
              <Link href="/jobs">
                <button className="glassmorphism text-xs px-3 py-1.5 text-orange-400 border-orange-500/30 hover:bg-orange-500/10 transition-all font-bold">
                  View Jobs →
                </button>
              </Link>
            </div>
          </GlassCard>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Upcoming Interviews */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🗓️ Upcoming Interviews
          </h2>
          {upcomingInterviews.length > 0 ? (
            <div className="space-y-4">
              {upcomingInterviews.map(job => {
                const interviewDate = getInterviewDate(job)!;
                return (
                  <GlassCard key={`dashboard-int-${job.id}`} className="p-4 border-purple-500/30 hover:border-purple-500/50 transition-all">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-white">{job.title}</h3>
                        <p className="text-sm text-gray-400">{job.company}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-purple-400">
                          {interviewDate.toLocaleDateString(undefined, {
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
                );
              })}
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

      {/* Next Best Actions */}
      {insights.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Next Best Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight) => (
              <Link key={insight.title} href={
                ['/jobs', '/hunter', '/outreach', '/analytics', '/'].includes(insight.action_url)
                  ? insight.action_url
                  : '/'
              }>
                <GlassCard className={`p-5 cursor-pointer hover:bg-white/5 transition-all border ${
                  insight.priority === 'high' ? 'border-red-500/30 hover:border-red-500/50' :
                  insight.priority === 'medium' ? 'border-yellow-500/30 hover:border-yellow-500/50' :
                  'border-white/10 hover:border-white/20'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 flex-shrink-0 ${
                      insight.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      insight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-white/10 text-gray-400'
                    }`}>
                      {insight.priority.toUpperCase()}
                    </span>
                    <div>
                      <p className="font-bold text-white text-sm">{insight.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{insight.description}</p>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        </section>
      )}

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
