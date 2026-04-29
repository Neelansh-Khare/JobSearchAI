'use client';

import { useState, useEffect, useCallback } from 'react';
import { JobSearchAPI } from '@/services/api';
import { Referral } from '@/types';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyFilter, setCompanyFilter] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState<number | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState<{ id: number; text: string } | null>(null);
  const [discoveredJobs, setDiscoveredJobs] = useState<any[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryQuery, setDiscoveryQuery] = useState('Software Engineer');

  const loadReferrals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await JobSearchAPI.getReferrals(companyFilter || undefined);
      setReferrals(data);
    } catch (err) {
      console.error('Error loading referrals:', err);
      setError(err instanceof Error ? err.message : 'Failed to load referrals');
      toast.error('Failed to load referrals');
    } finally {
      setIsLoading(false);
    }
  }, [companyFilter]);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await JobSearchAPI.uploadReferralsCSV(file);
      toast.success(result.message);
      loadReferrals();
    } catch (err) {
      toast.error('Failed to upload CSV');
      console.error(err);
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const generateMessage = async (referral: Referral) => {
    setIsGenerating(referral.id);
    try {
      const result = await JobSearchAPI.generateReferralMessage(referral.id);
      setGeneratedMessage({ id: referral.id, text: result.message });
      toast.success('Message generated!');
    } catch (err) {
      toast.error('Failed to generate message');
      console.error(err);
    } finally {
      setIsGenerating(null);
    }
  };

  const handleDelete = async (referralId: number) => {
    if (!confirm('Are you sure you want to delete this referral contact?')) return;
    try {
      await JobSearchAPI.deleteReferral(referralId);
      toast.success('Referral deleted');
      loadReferrals();
    } catch (err) {
      console.error('Error deleting referral:', err);
      toast.error('Failed to delete referral');
    }
  };

  const updateStatus = async (referralId: number, newStatus: string) => {
    try {
      await JobSearchAPI.updateReferral(referralId, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      loadReferrals();
    } catch (err) {
      console.error('Error updating referral status:', err);
      toast.error('Failed to update status');
    }
  };

  const discoverJobs = async () => {
    setIsDiscovering(true);
    try {
      const result = await JobSearchAPI.discoverNetworkJobs(discoveryQuery);
      setDiscoveredJobs(result.jobs);
      if (result.jobs.length > 0) {
        toast.success(`Found ${result.jobs.length} jobs in your network!`);
      } else {
        toast('No open roles found at your network companies right now.', { icon: '🔍' });
      }
    } catch (err) {
      toast.error('Failed to discover jobs');
      console.error(err);
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <main className="max-w-7xl mx-auto space-y-8">
        <section className="mt-10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white">Network & Referrals</h1>
            <div className="flex gap-4">
              <Link href="/jobs">
                <GlassButton>My Jobs</GlassButton>
              </Link>
              <Link href="/">
                <GlassButton>Home</GlassButton>
              </Link>
            </div>
          </div>

          <GlassCard className="p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label htmlFor="companyFilter" className="block mb-2 font-medium text-white/80">
                  Filter by Company
                </label>
                <input
                  id="companyFilter"
                  type="text"
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  placeholder="Search company..."
                  className="w-full p-3 glassmorphism bg-white/5 outline-none focus:border-white/30 text-white"
                />
              </div>
              <div className="flex gap-4">
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  <GlassButton isLoading={isUploading} variant="secondary">
                    {isUploading ? 'Importing...' : 'Import LinkedIn CSV'}
                  </GlassButton>
                </div>
                <GlassButton onClick={() => toast.success('Feature coming soon: Add Manual Referral')}>
                  + Add Referral
                </GlassButton>
              </div>
            </div>
          </GlassCard>

          {error && (
            <GlassCard className="p-6 bg-red-500/10 mb-6">
              <p className="text-red-400">{error}</p>
            </GlassCard>
          )}

          {isLoading ? (
            <div className="text-center py-20">
              <p className="text-xl text-white/60">Loading your network...</p>
            </div>
          ) : referrals.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <div className="text-5xl mb-6">🤝</div>
              <p className="text-2xl font-bold mb-4 text-white">No referrals found.</p>
              <p className="text-white/60 mb-8 max-w-md mx-auto">
                Start building your network by identifying people at companies you&apos;re interested in. 
                Use the Outreach tool to find contacts!
              </p>
              <Link href="/outreach">
                <GlassButton>Go to Outreach</GlassButton>
              </Link>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {referrals.map((referral) => (
                <GlassCard key={referral.id} className="p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        referral.status === 'Referred' ? 'bg-green-500/20 text-green-400' :
                        referral.status === 'Requested' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-white/10 text-white/60'
                      }`}>
                        {referral.status}
                      </span>
                      <button 
                        onClick={() => handleDelete(referral.id)}
                        className="text-white/40 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{referral.contact_name}</h3>
                    <p className="text-blue-400 font-medium mb-3">{referral.company}</p>
                    
                    {referral.relationship && (
                      <p className="text-sm text-white/60 mb-2">
                        <span className="font-semibold">Relationship:</span> {referral.relationship}
                      </p>
                    )}
                    
                    {referral.contact_email_or_profile && (
                      <p className="text-sm text-white/60 mb-4 break-all">
                        <span className="font-semibold">Contact:</span> {referral.contact_email_or_profile}
                      </p>
                    )}
                    
                    {referral.notes && (
                      <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-sm text-white/70 italic">&quot;{referral.notes}&quot;</p>
                      </div>
                    )}

                    {generatedMessage?.id === referral.id && (
                      <div className="mt-4 p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/30 animate-fade-in">
                        <p className="text-xs font-bold text-indigo-300 mb-2 uppercase tracking-wider">AI Generated Message:</p>
                        <div className="text-sm text-white/90 whitespace-pre-wrap max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                          {generatedMessage.text}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(generatedMessage.text);
                              toast.success('Copied to clipboard!');
                            }}
                            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                          >
                            Copy to Clipboard
                          </button>
                          <button 
                            onClick={() => setGeneratedMessage(null)}
                            className="text-xs font-semibold text-gray-500 hover:text-gray-400"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => updateStatus(referral.id, 'Requested')}
                        className="px-3 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-md transition-colors"
                      >
                        Mark Requested
                      </button>
                      <button 
                        onClick={() => updateStatus(referral.id, 'Referred')}
                        className="px-3 py-1 text-xs bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded-md transition-colors"
                      >
                        Mark Referred
                      </button>
                    </div>
                    
                    <GlassButton 
                      onClick={() => generateMessage(referral)}
                      isLoading={isGenerating === referral.id}
                      variant="primary"
                      className="w-full py-2 text-sm"
                    >
                      ✨ Generate Referral Request
                    </GlassButton>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          {/* Network Discovery Section */}
          <div className="mt-20 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white">Reverse Job Search</h2>
                <p className="text-white/60">Find open roles at companies where your connections work.</p>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <input
                  type="text"
                  value={discoveryQuery}
                  onChange={(e) => setDiscoveryQuery(e.target.value)}
                  placeholder="Target Role (e.g. Software Engineer)"
                  className="p-3 glassmorphism bg-white/5 outline-none focus:border-indigo-500/50 text-white flex-1 md:w-64"
                />
                <GlassButton 
                  onClick={discoverJobs} 
                  isLoading={isDiscovering}
                  variant="primary"
                >
                  Search My Network
                </GlassButton>
              </div>
            </div>

            {discoveredJobs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {discoveredJobs.map((job, idx) => (
                  <GlassCard key={`${job.job_id}-${idx}`} className="p-6 flex flex-col justify-between border-green-500/20">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-green-500/30">
                          Network Match
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">{job.title}</h3>
                      <p className="text-indigo-300 font-semibold mb-3">{job.company}</p>
                      <p className="text-sm text-white/50 mb-4 flex items-center">
                        <span className="mr-1.5 opacity-50">📍</span> {job.location || 'Remote'}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-white/5 space-y-3">
                      <a 
                        href={job.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block w-full text-center py-2 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-lg transition-colors text-sm"
                      >
                        View Details
                      </a>
                      <GlassButton 
                        onClick={() => {
                          const contact = referrals.find(r => r.company.toLowerCase() === job.company.toLowerCase());
                          if (contact) {
                            generateMessage(contact);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          } else {
                            toast.error('Could not find connection for this company');
                          }
                        }}
                        className="w-full py-2 text-xs"
                      >
                        Get Referral
                      </GlassButton>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
