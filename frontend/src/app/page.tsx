'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/services/api';
import GlassCard from '@/components/GlassCard';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Logged-in users don't see the marketing page — send them to their dashboard.
  useEffect(() => {
    setIsMounted(true);
    if (getToken()) {
      router.replace('/dashboard');
    }
  }, [router]);

  // Avoid a flash of marketing content for logged-in users before the redirect fires.
  if (!isMounted || getToken()) {
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
            <a href="/register" className="glassmorphism px-8 py-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-white font-bold transition-all">
              Get Started
            </a>
            <a href="#about" className="glassmorphism px-8 py-3 hover:bg-white/10 text-white font-bold transition-all">
              How it works
            </a>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <GlassCard className="p-8 border-white/5 hover:border-indigo-500/30">
            <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-3xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold mb-3 text-white">Job Hunter</h3>
            <p className="text-gray-400 leading-relaxed">Automatically discover and track job postings that match your profile.</p>
          </GlassCard>

          <GlassCard className="p-8 border-white/5 hover:border-indigo-500/30">
            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center text-3xl mb-6">📧</div>
            <h3 className="text-2xl font-bold mb-3 text-white">Outreach & Referrals</h3>
            <p className="text-gray-400 leading-relaxed">Draft outreach messages and manage referral requests in one place.</p>
          </GlassCard>

          <GlassCard className="p-8 border-white/5 hover:border-indigo-500/30">
            <div className="w-16 h-16 bg-pink-500/20 rounded-2xl flex items-center justify-center text-3xl mb-6">📊</div>
            <h3 className="text-2xl font-bold mb-3 text-white">Analytics</h3>
            <p className="text-gray-400 leading-relaxed">Track your application pipeline and see what's actually working.</p>
          </GlassCard>
        </section>

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

        <section className="text-center py-16">
          <p className="text-xl text-gray-400 mb-8">Create a free account to start tailoring your resume.</p>
          <div className="flex justify-center gap-4">
            <a href="/register" className="glassmorphism px-8 py-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-white font-bold transition-all">
              Sign Up Free
            </a>
            <a href="/login" className="glassmorphism px-8 py-3 hover:bg-white/10 text-white font-bold transition-all">
              Log In
            </a>
          </div>
        </section>
      </main>

      <footer className="mt-20 border-t border-white/10 py-10 text-center text-gray-500">
        <p>© {new Date().getFullYear()} JobSearchAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
