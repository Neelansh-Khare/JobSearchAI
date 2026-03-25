'use client';

import { useState, useEffect } from 'react';
import { JobSearchAPI } from '@/services/api';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await JobSearchAPI.getCurrentUser();
        setUser(userData);
        setFullName(userData.full_name || '');
        setEmail(userData.email || '');
      } catch (error) {
        console.error('Failed to fetch user:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        full_name: fullName,
        email: email,
      };
      
      if (password) {
        updateData.password = password;
      }

      await JobSearchAPI.updateCurrentUser(updateData);
      toast.success('Profile updated successfully');
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            User Settings
          </h1>
          <p className="text-gray-400 text-lg">Manage your account and preferences.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <GlassCard className="p-6 md:p-8 space-y-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="mr-2">👤</span> Profile Information
              </h2>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="Enter your email"
                  />
                </div>

                <div className="pt-4 border-t border-white/5">
                  <h3 className="text-lg font-medium mb-4">Change Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">New Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <GlassButton
                    type="submit"
                    variant="primary"
                    disabled={saving}
                    className="w-full md:w-auto px-8"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </GlassButton>
                </div>
              </form>
            </GlassCard>
          </div>

          <div className="space-y-8">
            <GlassCard className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="mr-2">🔌</span> Integrations
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📧</span>
                    <div>
                      <p className="text-sm font-medium">Gmail</p>
                      <p className="text-xs text-gray-500">{user?.gmail_token ? 'Connected' : 'Not connected'}</p>
                    </div>
                  </div>
                  {!user?.gmail_token && (
                    <button className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                      Connect
                    </button>
                  )}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🔗</span>
                    <div>
                      <p className="text-sm font-medium">LinkedIn</p>
                      <p className="text-xs text-gray-500">{user?.linkedin_token ? 'Connected' : 'Not connected'}</p>
                    </div>
                  </div>
                  {!user?.linkedin_token && (
                    <button className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6 border-red-500/20">
              <h2 className="text-xl font-semibold mb-4 text-red-400 flex items-center">
                <span className="mr-2">⚠️</span> Danger Zone
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Deleting your account is permanent and cannot be undone. All your data will be removed.
              </p>
              <button className="w-full py-2 px-4 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-all">
                Delete Account
              </button>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
