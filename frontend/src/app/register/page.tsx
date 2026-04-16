'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import { JobSearchAPI } from '@/services/api';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const regToast = toast.loading('Creating your account...');
    
    try {
      await JobSearchAPI.register({
        email,
        password,
        full_name: fullName,
      });
      
      toast.success('Account created! Logging you in...', { id: regToast });
      
      // After registration, log them in
      await JobSearchAPI.login(email, password);
      router.push('/jobs');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Please try again.', { id: regToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 animate-fade-in">
      <GlassCard className="w-full max-w-md p-8">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">✨</div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-gray-400 mt-2">Join JobSearchAI today</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <input
              type="text"
              required
              className="w-full p-3 glassmorphism bg-white/5 outline-none focus:border-indigo-500/50 text-white placeholder-gray-500"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
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
              minLength={6}
              className="w-full p-3 glassmorphism bg-white/5 outline-none focus:border-indigo-500/50 text-white"
              placeholder="•••••••• (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <GlassButton type="submit" isLoading={loading} className="w-full py-3 text-lg mt-4">
            Register
          </GlassButton>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          <span>Already have an account? </span>
          <Link href="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
            Login here
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
