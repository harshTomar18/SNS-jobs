'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Award, Briefcase, Building2, Code, FileText, Languages, MapPin, Users, ArrowRight, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/stat-card';
import { PageHeader } from '@/components/page-header';
import { adminApi, jobsApi, workerApi, WorkerWithMeta, JobWithMeta } from '@/lib/scn-api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/format';

export default function AdminDashboardPage() {
  const statsQuery = useQuery({ queryKey: ['admin-stats'], queryFn: adminApi.stats });
  const workersQuery = useQuery({ queryKey: ['admin-workers'], queryFn: () => workerApi.search({ completeOnly: false }) });
  const jobsQuery = useQuery({ queryKey: ['admin-jobs'], queryFn: jobsApi.list });
  
  const stats = statsQuery.data;
  const recentWorkers = workersQuery.data?.slice(0, 5) || [];
  const recentJobs = jobsQuery.data?.slice(0, 5) || [];

  const masterDataStats = [
    { label: 'Industries', value: stats?.industries || 0, icon: Building2, href: '/admin/master-data', color: 'text-primary' },
    { label: 'Functions', value: (stats?.masterData as any)?.functions || 0, icon: Layers, href: '/admin/master-data', color: 'text-accent' },
    { label: 'Locations', value: stats?.locations || 0, icon: MapPin, href: '/admin/master-data', color: 'text-accent' },
    { label: 'Skills', value: stats?.skills || 0, icon: Code, href: '/admin/master-data', color: 'text-success' },
    { label: 'Languages', value: stats?.languages || 0, icon: Languages, href: '/admin/master-data', color: 'text-warning' },
    { label: 'Job Roles', value: stats?.jobRoles || 0, icon: Briefcase, href: '/admin/master-data', color: 'text-primary' },
    { label: 'Qualifications', value: stats?.qualifications || 0, icon: Award, href: '/admin/master-data', color: 'text-accent' },
  ];
  const applicationRate = stats?.totalJobs ? (stats.totalApplications / stats.totalJobs).toFixed(1) : '0.0';
  const activeJobRate = stats?.totalJobs ? Math.round(((stats.activeJobs || 0) / stats.totalJobs) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" description="Live platform overview and analytics" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Recruiters" value={stats?.totalRecruiters || 0} icon={Users} color="primary" delay={0} />
        <StatCard label="Total Candidates" value={(stats?.totalWorkers || 0).toLocaleString()} icon={Users} color="accent" delay={0.05} />
        <StatCard label="Total Jobs" value={(stats?.totalJobs || 0).toLocaleString()} icon={Briefcase} color="warning" delay={0.1} />
        <StatCard label="Total Applications" value={(stats?.totalApplications || 0).toLocaleString()} icon={FileText} color="success" delay={0.15} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Recent Candidates</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/workers">View all<ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
          <div className="space-y-4">
            {recentWorkers.map((w: WorkerWithMeta) => (
              <div key={w.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={w.avatarUrl} alt={w.fullName} />
                    <AvatarFallback>{getInitials(w.fullName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{w.fullName}</p>
                    <p className="text-xs text-muted-foreground">{w.email}</p>
                  </div>
                </div>
                <Badge variant="outline" className={w.profileCompletion === 100 ? "border-success/20 bg-success/5 text-success" : ""}>
                  {w.profileCompletion}% Profile
                </Badge>
              </div>
            ))}
            {recentWorkers.length === 0 && <p className="text-sm text-muted-foreground">No candidates found.</p>}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Recent Jobs</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/jobs">View all<ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
          <div className="space-y-4">
            {recentJobs.map((j: JobWithMeta) => (
              <div key={j.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                <div>
                  <Link href={`/admin/jobs/${j.id}`} className="font-medium text-sm transition-colors hover:text-primary">{j.title}</Link>
                  <p className="text-xs text-muted-foreground">{j.companyName}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">{j.openings} roles</Badge>
                  <p className="mt-1 text-xs text-muted-foreground">{j.applicationsCount} applied</p>
                </div>
              </div>
            ))}
            {recentJobs.length === 0 && <p className="text-sm text-muted-foreground">No jobs listed.</p>}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Master Data</h3>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/master-data">Manage all<ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {masterDataStats.map((item) => (
            <Link key={item.label} href={item.href}>
              <div className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center transition-all hover:border-primary/30 hover:shadow-card">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-muted ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="text-xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold">Recruiter Status</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Recruiters</span>
              <span className="font-semibold">{stats?.activeRecruiters || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Inactive Recruiters</span>
              <span className="font-semibold">{stats?.inactiveRecruiters || 0}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
            <Link href="/admin/recruiters">Manage Recruiters</Link>
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold">Platform Health</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Hiring Status</span>
              <Badge variant="outline" className="border-success/20 bg-success/5 text-success">Live</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Applications per job</span>
              <span className="font-semibold">{applicationRate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Job Rate</span>
              <span className="font-semibold">{activeJobRate}%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
