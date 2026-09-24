'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { mockAuthApi } from './mockApi';

// The two built-in demo accounts. They never touch the backend: every API call
// they make is answered from lib/mockData.ts, so they work on a static deploy.
const DEMO_ACCOUNTS = {
  tenant: 'demo@example.com',
  landlord: 'landlord@example.com',
} as const;

export type DemoRole = keyof typeof DEMO_ACCOUNTS;

export function useDemoLogin() {
  const router = useRouter();
  const { login } = useAuth();
  const [pending, setPending] = useState<DemoRole | null>(null);

  const loginAsDemo = async (role: DemoRole) => {
    setPending(role);
    try {
      const { token, user } = await mockAuthApi.login(DEMO_ACCOUNTS[role], '');
      login(token, user);
      router.push(role === 'tenant' ? '/dashboard/tenant' : '/dashboard/landlord');
    } finally {
      setPending(null);
    }
  };

  return { loginAsDemo, pending };
}
