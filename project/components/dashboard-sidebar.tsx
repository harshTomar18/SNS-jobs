'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon, ChevronLeft, LogOut, User, X, Rocket, Settings, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/format';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

interface DashboardSidebarProps {
  items: NavItem[];
  role: 'worker' | 'recruiter' | 'admin';
  isOpen?: boolean;
  onClose?: () => void;
}

const roleLabels: Record<string, string> = {
  worker: 'Worker Portal',
  recruiter: 'Recruiter Portal',
  admin: 'Admin Panel',
};

const roleHomeRoutes: Record<string, string> = {
  worker: '/worker/dashboard',
  recruiter: '/recruiter/dashboard',
  admin: '/admin/dashboard',
};

export function DashboardSidebar({ items, role, isOpen = true, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const closeOnMobile = () => {
    if (window.innerWidth < 1024) onClose?.();
  };

  const isWorker = role === 'worker';

  return (
    <aside
      aria-label={`${roleLabels[role]} navigation`}
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex h-screen w-72 shrink-0 flex-col border-r border-border bg-card shadow-xl transition-all duration-300 ease-in-out lg:sticky lg:z-30 lg:shadow-none',
        isOpen
          ? 'translate-x-0 lg:w-64'
          : '-translate-x-full lg:w-0 lg:overflow-hidden lg:border-r-0 lg:px-0 lg:opacity-0',
        isWorker && 'bg-white border-slate-100/80'
      )}
    >
      {isWorker ? (
        <div className="flex items-center justify-between gap-2 px-5 py-6">
          <Link href={roleHomeRoutes[role]} className="flex items-center gap-3">
            <img src="/logo.png?v=3" alt="SCNJOBS" className="h-10 w-10 object-contain drop-shadow-sm shrink-0" />
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-slate-800 leading-none">SCNJOBS</span>
              <span className="text-[10px] font-medium text-slate-400 mt-1 block">Recruitment Suite</span>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-500"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        <div className="flex h-16 items-center justify-between gap-2 border-b border-border px-5">
          <Link href={roleHomeRoutes[role]} className="flex items-center gap-2">
            <img src="/logo.png?v=3" alt="SCNJOBS" className="h-10 w-10 object-contain drop-shadow-sm shrink-0" />
            <span className="text-lg font-extrabold tracking-tight">SCNJOBS</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {!isWorker && (
        <div className="px-3 py-4">
          <p className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {roleLabels[role]}
          </p>
        </div>
      )}

      <nav className={cn('flex-1 space-y-1 px-3', isWorker && 'px-4 mt-2')}>
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeOnMobile}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                isWorker && (
                  isActive
                    ? 'bg-blue-600 text-white rounded-xl py-3 px-4 shadow-sm shadow-blue-100 font-semibold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/60 rounded-xl py-3 px-4 font-medium'
                )
              )}
            >
              <item.icon className={cn('h-4 w-4 shrink-0', isWorker && 'h-5 w-5')} />
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={cn(
                    'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold',
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-primary/10 text-primary',
                    isWorker && (
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-50 text-blue-600'
                    )
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* {isWorker && (
          <div className="pt-6 mt-6 border-t border-slate-100/50 space-y-1">
            <Link
              href="/worker/profile"
              onClick={closeOnMobile}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50/60 transition-colors"
            >
              <Settings className="h-5 w-5 shrink-0" />
              <span>Settings</span>
            </Link>
            <Link
              href="/worker/profile"
              onClick={closeOnMobile}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50/60 transition-colors"
            >
              <HelpCircle className="h-5 w-5 shrink-0" />
              <span>Help</span>
            </Link>
          </div>
        )} */}
      </nav>
    </aside>
  );
}

function BriefcaseIcon() {
  return (
    <svg
      className="h-4 w-4 text-primary-foreground"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}
