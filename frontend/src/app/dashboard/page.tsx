'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import JobApplicationForm from "@/components/JobApplicationForm";
import ResultDisplay from "@/components/ResultDisplay";
import { JobSearchAPI, getApiBaseUrl, getToken } from "@/services/api";
import { CustomizeResumeResponse } from '@/types';
import Dashboard from '@/components/Dashboard';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CustomizeResumeResponse | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const router = useRouter();

  // Handle client-side only rendering to avoid hydration errors
  useEffect(() => {
    setIsMounted(true);
    if (!getToken()) {
      router.replace('/login');
    }
  }, [router]);

  const handleSubmit = async (jobDescription: string, resumeFile: File, jobId?: number) => {
    setIsLoading(true);

    try {
      let data;
      if (jobId) {
        // If job was saved, use tailorResume to link it in the database
        data = await JobSearchAPI.tailorResume(jobId, resumeFile);
      } else {
        // Otherwise use generic customizeResume
        data = await JobSearchAPI.customizeResume(jobDescription, resumeFile);
      }
      setResult(data);
    } catch (err) {
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
  if (!isMounted || !getToken()) {
    return null;
  }

  // Default view: dashboard overview
  if (!showCustomizer && !result) {
    return (
      <div className="min-h-screen p-4 md:p-8 animate-fade-in">
        <main className="max-w-7xl mx-auto space-y-20 pb-20">
          <Dashboard onOpenCustomizer={() => setShowCustomizer(true)} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 animate-fade-in">
      <main className="max-w-7xl mx-auto space-y-20 pb-20">
        {showCustomizer && (
          <div className="mt-8">
            <button
              onClick={() => setShowCustomizer(false)}
              className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
          </div>
        )}

        <section className="mt-8 text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400 leading-tight">
            AI-Powered Resume <br className="hidden md:block" /> Customization
          </h1>
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
      </main>

      <footer className="mt-20 border-t border-white/10 py-10 text-center text-gray-500">
        <p>© {new Date().getFullYear()} JobSearchAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
