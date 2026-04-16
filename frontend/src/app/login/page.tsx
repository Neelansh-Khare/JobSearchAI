'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import { JobSearchAPI } from '@/services/api';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const loginToast = toast.loading('Logging in...');
    
    try {
      await JobSearchAPI.login(email, password);
      toast.success('Successfully logged in!', { id: loginToast });
      router.push('/jobs'); 
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check your credentials.', { id: loginToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 animate-fade-in">
      <GlassCard className="w-full max-w-md p-8">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🚀</div>
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="text-gray-400 mt-2">Log in to your JobSearchAI account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              required
              className="w-full p-3 glassmorphism bg-white/5 outline-none focus:border-indigo-500/50 text-white placeholder-gray-500"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              required
              className="w-full p-3 glassmorphism bg-white/5 outline-none focus:border-indigo-500/50 text-white"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <GlassButton type="submit" isLoading={loading} className="w-full py-3 text-lg mt-4">
            Login
          </GlassButton>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          <span>Don't have an account? </span>
          <Link href="/register" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
            Sign up for free
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
