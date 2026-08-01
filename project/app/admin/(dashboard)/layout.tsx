'use client';

import { ReactNode } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { adminNavItems } from '@/lib/nav-config';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout items={adminNavItems} role="admin" title="Admin Panel">
      {children}
    </DashboardLayout>
  );
}
