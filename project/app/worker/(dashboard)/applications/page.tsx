'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Ban,
  Building2,
  Calendar,
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

const statusConfig: Record<ApplicationStatus, { label: string; color: string; icon: typeof Clock }> = {
  applied: { label: 'Applied', color: 'bg-muted text-muted-foreground', icon: Clock },
  shortlisted: { label: 'Shortlisted', color: 'bg-primary/10 text-primary', icon: CheckCircle2 },
  interview_scheduled: { label: 'Interview Scheduled', color: 'bg-accent/10 text-accent', icon: Calendar },
  rejected: { label: 'Rejected', color: 'bg-destructive/10 text-destructive', icon: XCircle },
  hired: { label: 'Hired', color: 'bg-success/10 text-success', icon: CheckCircle2 },
  withdrawn: { label: 'Withdrawn', color: 'bg-muted text-muted-foreground', icon: Ban },
};

function ApplicationTimeline({ application }: { application: Application }) {
  return (
    <div className="space-y-0">
      {application.timeline.map((event, i) => {
        const config = statusConfig[event.status];
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
  const config = statusConfig[application.status];
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
        <Badge variant="outline" className={cn('shrink-0', config.color)}>{config.label}</Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              View Details
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4">
                <p className="font-semibold">{application.job.title}</p>
                <p className="text-sm text-muted-foreground">{application.job.companyName}</p>
                <p className="mt-1 text-xs text-muted-foreground">Applied on {formatDate(application.appliedAt)}</p>
              </div>
              <div>
                <h4 className="mb-4 text-sm font-semibold">Application Timeline</h4>
                <ApplicationTimeline application={application} />
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
            onClick={() => withdrawMutation.mutate()}
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

  const filteredApps = applications.filter((app) => activeTab === 'all' || app.status === activeTab);
  const count = (status: ApplicationStatus) => applications.filter((app) => app.status === status).length;

  return (
    <div className="space-y-6">
      <PageHeader title="My Applications" description="Track the status of all your job applications" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex h-auto flex-wrap gap-1 bg-card p-1">
          <TabsTrigger value="all" className="gap-1.5">All<Badge variant="secondary" className="text-xs">{applications.length}</Badge></TabsTrigger>
          <TabsTrigger value="applied" className="gap-1.5">Applied<Badge variant="secondary" className="text-xs">{count('applied')}</Badge></TabsTrigger>
          <TabsTrigger value="shortlisted" className="gap-1.5">Shortlisted<Badge variant="secondary" className="text-xs">{count('shortlisted')}</Badge></TabsTrigger>
          <TabsTrigger value="interview_scheduled" className="gap-1.5">Interview<Badge variant="secondary" className="text-xs">{count('interview_scheduled')}</Badge></TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1.5">Rejected<Badge variant="secondary" className="text-xs">{count('rejected')}</Badge></TabsTrigger>
          <TabsTrigger value="hired" className="gap-1.5">Hired<Badge variant="secondary" className="text-xs">{count('hired')}</Badge></TabsTrigger>
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
