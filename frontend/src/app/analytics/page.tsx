'use client';

import { useState, useEffect } from 'react';
import { JobSearchAPI } from '@/services/api';
import GlassCard from '@/components/GlassCard';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await JobSearchAPI.getJobStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        toast.error('Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center space-y-4 bg-black">
        <div className="loading-spinner w-12 h-12 border-4" />
        <p className="text-gray-400">Calculating your metrics...</p>
      </div>
    );
  }

  if (!stats) return null;

  const conversionInterviews = stats.funnel.applied > 0 
    ? ((stats.funnel.interviews / stats.funnel.applied) * 100).toFixed(1) 
    : '0';
  
  const conversionOffers = stats.funnel.interviews > 0 
    ? ((stats.funnel.offers / stats.funnel.interviews) * 100).toFixed(1) 
    : '0';

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 animate-fade-in">
      <main className="max-w-7xl mx-auto space-y-12">
        <header>
          <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Search Analytics
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Track your progress and optimize your job search funnel.</p>
        </header>

        {/* Top Level Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="p-8 border-blue-500/20">
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">Applications</h3>
            <p className="text-5xl font-bold">{stats.funnel.applied}</p>
            <div className="mt-4 space-y-1">
              <p className="text-xs text-gray-500 flex items-center">
                <span className="text-green-400 mr-1">↑</span> {stats.velocity_7d} in last 7 days
              </p>
              <p className="text-xs text-gray-500 flex items-center">
                <span className="text-blue-400 mr-1">→</span> {stats.velocity_30d} in last 30 days
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-8 border-purple-500/20">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-2">Interviews</h3>
            <p className="text-5xl font-bold">{stats.funnel.interviews}</p>
            <p className="text-xs text-gray-500 mt-4">
              Conversion: <span className="text-purple-400 font-bold">{conversionInterviews}%</span> from applied
            </p>
          </GlassCard>

          <GlassCard className="p-8 border-green-500/20">
            <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-2">Offers</h3>
            <p className="text-5xl font-bold">{stats.funnel.offers}</p>
            <p className="text-xs text-gray-500 mt-4">
              Conversion: <span className="text-green-400 font-bold">{conversionOffers}%</span> from interviews
            </p>
          </GlassCard>
        </div>

        {/* Funnel Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <GlassCard className="p-8">
            <h2 className="text-2xl font-bold mb-8">Job Search Funnel</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Applied</span>
                  <span className="text-gray-400">{stats.funnel.applied} applications</span>
                </div>
                <div className="h-10 w-full bg-white/5 rounded-lg overflow-hidden border border-white/10">
                  <div className="h-full bg-blue-500/40 w-full"></div>
                </div>
              </div>

              <div className="space-y-2 pl-8 border-l-2 border-white/5">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Interviews</span>
                  <span className="text-gray-400">{stats.funnel.interviews} companies</span>
                </div>
                <div className="h-10 w-full bg-white/5 rounded-lg overflow-hidden border border-white/10">
                  <div 
                    className="h-full bg-purple-500/40 transition-all duration-1000 ease-out"
                    style={{ width: `${(stats.funnel.interviews / (stats.funnel.applied || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2 pl-16 border-l-2 border-white/5">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Offers</span>
                  <span className="text-gray-400">{stats.funnel.offers} total</span>
                </div>
                <div className="h-10 w-full bg-white/5 rounded-lg overflow-hidden border border-white/10">
                  <div 
                    className="h-full bg-green-500/40 transition-all duration-1000 ease-out"
                    style={{ width: `${(stats.funnel.offers / (stats.funnel.applied || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Status Distribution */}
          <GlassCard className="p-8">
            <h2 className="text-2xl font-bold mb-8">Status Distribution</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(stats.status_distribution).map(([status, count]: [any, any]) => (
                <div key={status} className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center">
                  <span className="text-gray-400">{status}</span>
                  <span className="text-xl font-bold">{count}</span>
                </div>
              ))}
              {Object.keys(stats.status_distribution).length === 0 && (
                <p className="col-span-2 text-center text-gray-500 py-10 italic">No data to display yet.</p>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Insights Section */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <div className="text-2xl mb-4">💡</div>
              <h3 className="text-lg font-bold text-white mb-2">Search Momentum</h3>
              <p className="text-gray-400 leading-relaxed">
                You applied to <span className="text-white font-bold">{stats.velocity_7d} jobs</span> this week and <span className="text-white font-bold">{stats.velocity_30d} jobs</span> in the last month. 
                Consistent application volume is key to maintaining search velocity.
              </p>
            </div>
            
            <div className="p-6 rounded-2xl bg-pink-500/10 border border-pink-500/20">
              <div className="text-2xl mb-4">🎯</div>
              <h3 className="text-lg font-bold text-white mb-2">Optimization Tip</h3>
              {Number(conversionInterviews) < 5 ? (
                <p className="text-gray-400 leading-relaxed">
                  Your interview rate is low. Try tailoring your resume more specifically to job keywords or use our **Referrals** tool to find warm connections.
                </p>
              ) : (
                <p className="text-gray-400 leading-relaxed">
                  Your profile is resonating! Keep doing what you&apos;re doing. Focus now on interview preparation to maximize your offer conversion.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
