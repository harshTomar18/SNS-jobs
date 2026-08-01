'use client';

import { ReactNode } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { recruiterNavItems } from '@/lib/nav-config';

export default function RecruiterLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout items={recruiterNavItems} role="recruiter" title="Recruiter Dashboard">
      {children}
    </DashboardLayout>
  );
}
