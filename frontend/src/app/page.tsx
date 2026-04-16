'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import JobApplicationForm from "@/components/JobApplicationForm";
import ResultDisplay from "@/components/ResultDisplay";
import { JobSearchAPI, getApiBaseUrl } from "@/services/api";
import GlassCard from '@/components/GlassCard';
import { CustomizeResumeResponse } from '@/types';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CustomizeResumeResponse | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side only rendering to avoid hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (jobDescription: string, resumeFile: File, jobId?: number) => {
    setIsLoading(true);
    
    try {
      let data;
      if (jobId) {
        // If job was saved, use tailorResume to link it in the database
        data = await JobSearchAPI.tailorResume(jobId, resumeFile);
        console.log(`Job saved with ID: ${jobId}. Resume customized and linked to this job.`);
      } else {
        // Otherwise use generic customizeResume
        data = await JobSearchAPI.customizeResume(jobDescription, resumeFile);
      }
      setResult(data);
    } catch (err) {
      console.error('Error:', err);
      toast.error(err instanceof Error ? err.message : 'An unexpected error occurred during customization');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
  };

  // Return null during server-side rendering or first client-side render
  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 animate-fade-in">
      <main className="max-w-7xl mx-auto space-y-20 pb-20">
        <section className="mt-16 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 glassmorphism text-indigo-300 text-sm font-semibold tracking-wide uppercase">
            Powered by Advanced AI
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400 leading-tight">
            AI-Powered Resume <br className="hidden md:block" /> Customization
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Optimize your resume for specific job descriptions instantly. 
            Highlight your strengths and bridge the gap to your next dream role.
          </p>
          <div className="flex justify-center gap-4">
            <a href="/jobs" className="glassmorphism px-8 py-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-white font-bold transition-all">
              Manage Applications
            </a>
            <a href="#about" className="glassmorphism px-8 py-3 hover:bg-white/10 text-white font-bold transition-all">
              How it works
            </a>
          </div>
        </section>

        {!result ? (
          <section className="relative">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -z-10"></div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl -z-10"></div>
            <h2 className="text-3xl font-bold text-center mb-10 text-white">Start Customizing</h2>
            <JobApplicationForm onSubmit={handleSubmit} isLoading={isLoading} />
          </section>
        ) : (
          <section className="animate-fade-in">
            <ResultDisplay 
              result={result} 
              onReset={handleReset} 
              apiBaseUrl={getApiBaseUrl()} 
            />
          </section>
        )}

        <section id="about" className="py-20 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GlassCard className="p-8 text-center border-white/5 hover:border-indigo-500/30">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">📄</div>
              <h3 className="text-2xl font-bold mb-3 text-white">Upload</h3>
              <p className="text-gray-400 leading-relaxed">Upload your current resume and paste the target job description.</p>
            </GlassCard>
            
            <GlassCard className="p-8 text-center border-white/5 hover:border-indigo-500/30">
              <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">🤖</div>
              <h3 className="text-2xl font-bold mb-3 text-white">Process</h3>
              <p className="text-gray-400 leading-relaxed">Our AI identifies key skills and requirements to tailor your profile.</p>
            </GlassCard>
            
            <GlassCard className="p-8 text-center border-white/5 hover:border-indigo-500/30">
              <div className="w-16 h-16 bg-pink-500/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">✨</div>
              <h3 className="text-2xl font-bold mb-3 text-white">Optimize</h3>
              <p className="text-gray-400 leading-relaxed">Download your optimized resume and start applying with confidence.</p>
            </GlassCard>
          </div>
        </section>
      </main>

      <footer className="mt-20 border-t border-white/10 py-10 text-center text-gray-500">
        <p>© {new Date().getFullYear()} JobSearchAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
