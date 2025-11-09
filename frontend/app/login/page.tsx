'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { Button, Alert } from '@/components/UIComponents';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response: any = await authApi.login(email, password);
      login(response.token, response.user);
      
      // Redirect based on role
      if (response.user.role === 'tenant') {
        router.push('/dashboard/tenant');
      } else {
        router.push('/dashboard/landlord');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo account quick login
  const handleDemoLogin = async (role: 'tenant' | 'landlord') => {
    const demoCredentials = {
      tenant: { email: 'demo@example.com', password: 'demo' },
      landlord: { email: 'landlord@example.com', password: 'demo' },
    };
    
    setEmail(demoCredentials[role].email);
    setPassword(demoCredentials[role].password);
    
    setTimeout(() => {
      document.querySelector<HTMLFormElement>('form')?.requestSubmit();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.5 }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">Financr</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white"
          >
            Welcome Back
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400"
          >
            Sign in to your account to continue
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <Alert type="error" message={error} icon={<Lock className="w-5 h-5" />} onClose={() => setError('')} />}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} fullWidth>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <motion.span 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    ⏳
                  </motion.span>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center mb-3 font-medium">Quick Demo Access:</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDemoLogin('tenant')}
                fullWidth
              >
                <span className="text-xs sm:text-sm">Demo Tenant</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDemoLogin('landlord')}
                fullWidth
              >
                <span className="text-xs sm:text-sm">Demo Landlord</span>
              </Button>
            </div>
          </div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-6"
          >
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors">
              Sign up
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
