'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DataTable, Column } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { WorkerWithMeta, workerApi } from '@/lib/scn-api';
import { getInitials } from '@/lib/format';

export default function AdminWorkersPage() {
  const workersQuery = useQuery({
    queryKey: ['admin-workers'],
    queryFn: () => workerApi.search({ completeOnly: false }),
  });
  const workers: WorkerWithMeta[] = workersQuery.data ?? [];

  const columns: Column<WorkerWithMeta>[] = [
    {
      key: 'fullName',
      header: 'Worker',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs">{getInitials(row.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.fullName}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone' },
    { key: 'experienceYears', header: 'Experience', sortable: true, render: (row) => `${row.experienceYears} yrs` },
    { key: 'city', header: 'Location', sortable: true },
    {
      key: 'skills',
      header: 'Skills',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.skills.slice(0, 2).map((skill) => <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>)}
          {row.skills.length > 2 && <Badge variant="outline" className="text-xs">+{row.skills.length - 2}</Badge>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant="outline" className={row.status === 'active' ? 'border-success/20 bg-success/5 text-success' : 'bg-muted text-muted-foreground'}>
          {row.status}
        </Badge>
      ),
    },
    { key: 'joinedAt', header: 'Joined', sortable: true },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Workers" description="Manage all worker accounts on the platform" />
      <Card className="p-6">
        <DataTable data={workers} columns={columns} searchable searchKeys={['fullName', 'email', 'city']} />
      </Card>
    </div>
  );
}
