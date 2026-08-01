'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { jobsApi, JobWithMeta } from '@/lib/scn-api';
import { formatSalary, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function AdminJobsPage() {
  const jobsQuery = useQuery({ queryKey: ['admin-jobs'], queryFn: jobsApi.list });
  const jobs: JobWithMeta[] = jobsQuery.data ?? [];

  const columns: Column<JobWithMeta>[] = [
    {
      key: 'title',
      header: 'Job Title',
      sortable: true,
      render: (row) => (
        <div>
          <Link href={`/admin/jobs/${row.id}`} className="font-medium hover:text-primary transition-colors">{row.title}</Link>
          <p className="text-xs text-muted-foreground">{row.companyName}</p>
        </div>
      ),
    },
    { key: 'location', header: 'Location', sortable: true },
    { key: 'salaryMin', header: 'Salary', render: (row) => formatSalary(row.salaryMin, row.salaryMax) },
    { key: 'openings', header: 'Openings', sortable: true },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant="outline" className={cn(
          row.status === 'published' ? 'border-success/20 bg-success/5 text-success' :
          row.status === 'draft' ? 'border-warning/20 bg-warning/5 text-warning' :
          'bg-muted text-muted-foreground'
        )}>
          {row.status}
        </Badge>
      ),
    },
    { key: 'postedAt', header: 'Posted', sortable: true, render: (row) => timeAgo(row.postedAt) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Jobs" description="Manage all job postings on the platform" />
      <Card className="p-6">
        <DataTable data={jobs} columns={columns} searchable searchKeys={['title', 'companyName', 'location']} />
      </Card>
    </div>
  );
}
