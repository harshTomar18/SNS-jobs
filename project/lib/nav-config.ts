import { LayoutDashboard, Search, FileText, User, Briefcase } from 'lucide-react';
import { NavItem } from '@/components/dashboard-sidebar';

export const workerNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/worker/dashboard', icon: LayoutDashboard },
  { label: 'Find Jobs', href: '/worker/jobs', icon: Search },
  { label: 'Applications', href: '/worker/applications', icon: FileText },
  { label: 'My Profile', href: '/worker/profile', icon: User },
];

export const recruiterNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/recruiter/dashboard', icon: LayoutDashboard },
  { label: 'Jobs', href: '/recruiter/jobs', icon: Briefcase },
  { label: 'Applications', href: '/recruiter/applications', icon: FileText },
  { label: 'Worker Search', href: '/recruiter/workers', icon: Search },
];

export const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Recruiters', href: '/admin/recruiters', icon: User },
  { label: 'Workers', href: '/admin/workers', icon: Briefcase },
  { label: 'Jobs', href: '/admin/jobs', icon: Briefcase },
  { label: 'Master Data', href: '/admin/master-data', icon: FileText },
];
