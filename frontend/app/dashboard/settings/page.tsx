'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Alert } from '@/components/UIComponents';
import { User, Mail, Lock, Save, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { user, login } = useAuth();
  const [profileData, setProfileData] = useState({
    username: '',
    name: '',
    email: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!profileData.username.trim()) {
      setAlert({ type: 'error', message: 'Username is required' });
      return;
    }

    if (profileData.username.length < 3) {
      setAlert({ type: 'error', message: 'Username must be at least 3 characters' });
      return;
    }

    if (!profileData.name.trim()) {
      setAlert({ type: 'error', message: 'Name is required' });
      return;
    }

    if (!profileData.email.trim()) {
      setAlert({ type: 'error', message: 'Email is required' });
      return;
    }

    setIsUpdatingProfile(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: profileData.username.trim(),
          name: profileData.name.trim(),
          email: profileData.email.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAlert({ type: 'success', message: 'Profile updated successfully!' });
        
        // Update user in context
        if (token) {
          login(token, data.user);
        }
      } else {
        const error = await response.json();
        setAlert({ type: 'error', message: error.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Update profile error:', error);
      setAlert({ type: 'error', message: 'Failed to update profile. Please try again.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!passwordData.currentPassword) {
      setAlert({ type: 'error', message: 'Current password is required' });
      return;
    }

    if (!passwordData.newPassword) {
      setAlert({ type: 'error', message: 'New password is required' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setAlert({ type: 'error', message: 'New password must be at least 6 characters' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setAlert({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        setAlert({ type: 'success', message: 'Password updated successfully!' });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        const error = await response.json();
        setAlert({ type: 'error', message: error.error || 'Failed to update password' });
      }
    } catch (error) {
      console.error('Update password error:', error);
      setAlert({ type: 'error', message: 'Failed to update password. Please try again.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-card-text mb-2">Account Settings</h1>
        <p className="text-card-text/70 mb-8">Manage your profile and security settings</p>

        {alert && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} className="mb-6" />
        )}

        {/* Profile Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card-bg border border-border rounded-2xl p-6 shadow-sm mb-6"
        >
          <h2 className="text-2xl font-bold text-card-text mb-6 flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            Profile Information
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-card-text/90 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-card-text/50" />
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-card-text/20 rounded-xl text-card-text focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="your-username"
                  disabled={isUpdatingProfile}
                />
              </div>
              <p className="text-xs text-card-text/60 mt-1">
                This will be used by landlords to find you
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-text/90 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-card-text/50" />
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-card-text/20 rounded-xl text-card-text focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Doe"
                  disabled={isUpdatingProfile}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-text/90 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-card-text/50" />
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-card-text/20 rounded-xl text-card-text focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="you@example.com"
                  disabled={isUpdatingProfile}
                />
              </div>
            </div>

            <Button type="submit" variant="primary" disabled={isUpdatingProfile} className="w-full">
              {isUpdatingProfile ? (
                'Updating...'
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Profile Changes
                </>
              )}
            </Button>
          </form>
        </motion.div>

        {/* Password Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-card-bg border border-border rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-2xl font-bold text-card-text mb-6 flex items-center gap-2">
            <Lock className="w-6 h-6 text-primary" />
            Change Password
          </h2>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-card-text/90 mb-2">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-card-text/50" />
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-card-text/20 rounded-xl text-card-text focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  disabled={isUpdatingPassword}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-text/90 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-card-text/50" />
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-card-text/20 rounded-xl text-card-text focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  disabled={isUpdatingPassword}
                />
              </div>
              <p className="text-xs text-card-text/60 mt-1">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-text/90 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-card-text/50" />
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-card-text/20 rounded-xl text-card-text focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  disabled={isUpdatingPassword}
                />
              </div>
            </div>

            <Button type="submit" variant="primary" disabled={isUpdatingPassword} className="w-full">
              {isUpdatingPassword ? (
                'Updating...'
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}

