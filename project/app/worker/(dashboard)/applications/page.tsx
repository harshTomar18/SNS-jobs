'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Ban,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  IndianRupee,
  MapPin,
  XCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Application, ApplicationStatus } from '@/lib/types';
import { formatSalary, formatDate, formatDateTime, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { applicationsApi } from '@/lib/scn-api';
import { getApiErrorMessage } from '@/lib/api';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  applied: { label: 'Applied', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  resume_viewed: { label: 'Resume Viewed', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Eye },
  shortlisted: { label: 'Shortlisted', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  accepted: { label: 'Shortlisted', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  interview: { label: 'Selected for Interview', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: CheckCircle2 },
  not_shortlisted: { label: 'Not Shortlisted', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
  rejected: { label: 'Not Shortlisted', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
  withdrawn: { label: 'Withdrawn', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: Ban },
};

function ApplicationTimeline({ application }: { application: Application }) {
  return (
    <div className="space-y-0">
      {application.timeline.map((event, i) => {
        const config = statusConfig[event.status] || {
          label: event.status || 'Applied',
          color: 'bg-muted text-muted-foreground',
          icon: Clock
        };
        const isLast = i === application.timeline.length - 1;
        return (
          <div key={event.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', config.color)}>
                <config.icon className="h-4 w-4" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-border" />}
            </div>
            <div className={cn('flex-1', !isLast && 'pb-6')}>
              <p className="text-sm font-medium capitalize">{event.label}</p>
              {event.description && <p className="mt-0.5 text-sm text-muted-foreground">{event.description}</p>}
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDateTime(event.timestamp)}</span>
                <span>by {event.actor}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ApplicationCard({ application }: { application: Application }) {
  const queryClient = useQueryClient();
  const config = statusConfig[application.status] || {
    label: application.status || 'Applied',
    color: 'bg-muted text-muted-foreground',
    icon: Clock
  };
  const withdrawMutation = useMutation({
    mutationFn: () => applicationsApi.withdraw(application.id),
    onSuccess: () => {
      toast.success('Application withdrawn');
      queryClient.invalidateQueries({ queryKey: ['worker-applications'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not withdraw application')),
  });

  const canWithdraw = application.status === 'applied';

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">{application.job.title}</h3>
            <p className="text-sm text-muted-foreground">{application.job.companyName}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{application.job.location}</span>
              <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{formatSalary(application.job.salaryMin, application.job.salaryMax)}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Applied {timeAgo(application.appliedAt)}</span>
            </div>
          </div>
        </div>
        <Badge variant="outline" className={cn('shrink-0 font-bold px-3 py-1', config.color)}>{config.label}</Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/worker/jobs/${application.jobId}`}>
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            View Details
          </Link>
        </Button>

        {application.resumeUrl && (
          <Button variant="ghost" size="sm" asChild>
            <a href={application.resumeUrl} target="_blank" rel="noreferrer">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Resume
            </a>
          </Button>
        )}

        {canWithdraw && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            disabled={withdrawMutation.isPending}
            onClick={() => withdrawMutation.mutate(undefined)}
          >
            <Ban className="mr-1.5 h-3.5 w-3.5" />
            Withdraw
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function WorkerApplicationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const applicationsQuery = useQuery({
    queryKey: ['worker-applications'],
    queryFn: applicationsApi.workerList,
  });
  const applications: Application[] = applicationsQuery.data ?? [];
  const { isLoading } = applicationsQuery;

  const filteredApps = applications.filter((app) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'shortlisted') return app.status === 'shortlisted' || app.status === 'accepted';
    if (activeTab === 'not_shortlisted') return app.status === 'not_shortlisted' || app.status === 'rejected';
    return app.status === activeTab;
  });

  const count = (tabKey: string) => applications.filter((app) => {
    if (tabKey === 'all') return true;
    if (tabKey === 'shortlisted') return app.status === 'shortlisted' || app.status === 'accepted';
    if (tabKey === 'not_shortlisted') return app.status === 'not_shortlisted' || app.status === 'rejected';
    return app.status === tabKey;
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader title="My Applications" description="Track the status of all your job applications" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex h-auto flex-wrap gap-1 bg-card p-1">
          <TabsTrigger value="all" className="gap-1.5">All<Badge variant="secondary" className="text-xs">{count('all')}</Badge></TabsTrigger>
          <TabsTrigger value="applied" className="gap-1.5">Applied<Badge variant="secondary" className="text-xs">{count('applied')}</Badge></TabsTrigger>
          <TabsTrigger value="resume_viewed" className="gap-1.5">Resume Viewed<Badge variant="secondary" className="text-xs">{count('resume_viewed')}</Badge></TabsTrigger>
          <TabsTrigger value="shortlisted" className="gap-1.5">Shortlisted<Badge variant="secondary" className="text-xs">{count('shortlisted')}</Badge></TabsTrigger>
          <TabsTrigger value="interview" className="gap-1.5">Selected for Interview<Badge variant="secondary" className="text-xs">{count('interview')}</Badge></TabsTrigger>
          <TabsTrigger value="not_shortlisted" className="gap-1.5">Not Shortlisted<Badge variant="secondary" className="text-xs">{count('not_shortlisted')}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => <Card key={item} className="h-32 animate-pulse bg-muted/40" />)}
            </div>
          ) : filteredApps.length === 0 ? (
            <EmptyState icon={FileText} title="No applications yet" description="Start applying to jobs to see them tracked here." />
          ) : (
            <div className="space-y-4">
              {filteredApps.map((app, i) => (
                <motion.div key={app.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
                  <ApplicationCard application={app} />
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
