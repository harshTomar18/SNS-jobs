'use client';

import { ReactNode } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { workerNavItems } from '@/lib/nav-config';

export default function WorkerLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout items={workerNavItems} role="worker" title="Worker Dashboard">
      {children}
    </DashboardLayout>
  );
}
