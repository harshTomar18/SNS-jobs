'use client';

import Link from 'next/link';
import { Bell, LogOut, Menu, PanelLeftClose, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NavItem } from '@/components/dashboard-sidebar';
import { useAuth } from '@/lib/auth-context';
import { getInitials } from '@/lib/format';

interface DashboardTopbarProps {
  items: NavItem[];
  role: 'worker' | 'recruiter' | 'admin';
  title: string;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function DashboardTopbar({ role, title, sidebarOpen, onToggleSidebar }: DashboardTopbarProps) {
  const { user, logout } = useAuth();
  const unreadCount = 0;

  const profileRoute = role === 'worker' ? '/worker/profile' : role === 'recruiter' ? '/recruiter/dashboard' : null;
  const isWorker = role === 'worker';

  if (isWorker) {
    return (
      <header className="sticky top-0 z-40 flex h-20 items-center justify-between gap-4 border-b border-slate-100 bg-white/95 px-6 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="lg:hidden text-slate-500 hover:bg-slate-50"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          <div className="relative w-80 max-w-md hidden md:block">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search for jobs, companies..."
              className="w-full bg-slate-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-500">
            <Link href="/worker/jobs" className="hover:text-slate-800 transition-colors">Remote Jobs</Link>
            <Link href="/worker/jobs" className="hover:text-slate-800 transition-colors">Salary Tools</Link>
          </div>

          <div className="flex items-center gap-2.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-slate-50 text-slate-600">
                  <Bell className="h-[21px] w-[21px]" />
                  <span className="absolute right-3 top-2.5 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  Notifications
                  <Badge variant="secondary" className="text-xs">1 new</Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="py-3 text-sm text-slate-600">
                  You have 8 new recruiter messages
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full relative border border-slate-100 p-0.5 hover:bg-slate-50">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                    <AvatarFallback className="text-xs bg-blue-50 text-blue-600 font-bold">
                      {user ? getInitials(user.name) : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute right-0 bottom-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-semibold text-slate-800">{user?.name}</p>
                  <p className="text-xs font-normal text-slate-400">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {profileRoute && (
                  <DropdownMenuItem asChild>
                    <Link href={profileRoute} className="flex items-center gap-2 py-2">
                      <User className="h-4 w-4 text-slate-500" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                {profileRoute && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-700 flex items-center gap-2 py-2">
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    );
  }

  if (role === 'recruiter') {
    return (
      <header className="sticky top-0 z-40 flex h-20 items-center justify-between gap-4 border-b border-slate-100 bg-white/95 px-6 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="lg:hidden text-slate-500 hover:bg-slate-50"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          {/* Recruiter Search Bar */}
          <div className="relative w-80 max-w-md hidden md:block">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="search candidates, jobs..."
              className="w-full bg-[#f4f5f7] border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-semibold">
            <Link href="/recruiter/dashboard" className="text-indigo-600 border-b-2 border-indigo-600 pb-1 hover:text-indigo-800 transition-colors">
              Analytics
            </Link>
            <Link href="/recruiter/dashboard" className="text-slate-500 hover:text-slate-800 transition-colors">
              Reports
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Add Candidate Button */}
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-4 py-2 text-xs">
              <Link href="/recruiter/workers">
                Add Candidate
              </Link>
            </Button>

            {/* Notification and Task indicators */}
            <div className="flex items-center gap-1 text-slate-400 font-medium text-xs">
              <Button variant="ghost" size="icon" className="relative h-10 w-10 text-slate-500 hover:bg-slate-50">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </Button>
              <span className="text-slate-400 text-xs select-none">notificati</span>
              <Button variant="ghost" size="icon" className="relative h-10 w-10 text-slate-500 hover:bg-slate-50">
                <span className="h-5 w-5 flex items-center justify-center border-2 border-slate-400 rounded-sm text-[8px] font-bold">✓</span>
              </Button>
              <span className="text-slate-400 text-xs select-none">task_mode</span>
            </div>

            {/* User Profile Card */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 border-l border-slate-100 pl-4 text-left hover:bg-slate-50/50 h-auto py-1 px-2 rounded-xl">
                  <Avatar className="h-9 w-9 border border-indigo-100">
                    <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                    <AvatarFallback className="text-xs bg-indigo-50 text-indigo-600 font-bold">
                      {user ? getInitials(user.name) : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800 leading-tight">{user?.name || 'Sarah Jenkins'}</span>
                    <span className="text-[10px] text-slate-400">{user?.designation || 'Lead Recruiter'}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-semibold text-slate-800">{user?.name}</p>
                  <p className="text-xs font-normal text-slate-400">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-700 flex items-center gap-2 py-2">
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="py-3 text-sm text-muted-foreground">
                No notifications yet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                  <AvatarFallback className="text-xs">
                    {user ? getInitials(user.name) : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {profileRoute && (
                <DropdownMenuItem asChild>
                  <Link href={profileRoute}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
              )}
              {profileRoute && <DropdownMenuSeparator />}
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
