'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import AppShell from '@/components/layout/AppShell';
import { PageLoading } from '@/components/ui/LoadingSpinner';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isDeviceTrusted = useAuthStore((s) => s.isDeviceTrusted);
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/');
    } else if (!isDeviceTrusted) {
      router.replace('/');
    } else {
      setReady(true);
    }
  }, [isAuthenticated, isDeviceTrusted, router]);

  if (!ready) return <PageLoading />;

  return <AppShell>{children}</AppShell>;
}
