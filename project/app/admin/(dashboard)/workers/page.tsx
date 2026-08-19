'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, Eye, Mail, Phone, MapPin, Briefcase, GraduationCap, FileText, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { DataTable, Column } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { WorkerWithMeta, workerApi, adminApi } from '@/lib/scn-api';
import { getInitials } from '@/lib/format';
import { BulkCandidateImportModal } from '@/components/admin/bulk-candidate-import-modal';

export default function AdminWorkersPage() {
  const queryClient = useQueryClient();
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const workersQuery = useQuery({
    queryKey: ['admin-workers'],
    queryFn: () => workerApi.search({ completeOnly: false }),
  });
  const workers: WorkerWithMeta[] = workersQuery.data ?? [];

  const candidateDetailQuery = useQuery({
    queryKey: ['admin-candidate-full', selectedCandidateId],
    queryFn: () => (selectedCandidateId ? adminApi.getWorkerFull(selectedCandidateId) : null),
    enabled: Boolean(selectedCandidateId),
  });

  const selectedCandidate = candidateDetailQuery.data;

  const columns: Column<WorkerWithMeta>[] = [
    {
      key: 'fullName',
      header: "Candidate's Name",
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
    { key: 'experienceYears', header: 'Candidate Experience', sortable: true, render: (row) => `${row.experienceYears} yrs` },
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
    {
      key: 'id',
      header: 'Action',
      render: (row) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedCandidateId(row.id)}>
          <Eye className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          View Full Profile
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidates"
        description="Manage candidate accounts and profiles"
      />

      <Card className="p-6">
        <DataTable data={workers} columns={columns} searchable searchKeys={['fullName', 'email', 'city']} />
      </Card>

      <Dialog open={Boolean(selectedCandidateId)} onOpenChange={(open) => !open && setSelectedCandidateId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Candidate Profile Oversight
            </DialogTitle>
            <DialogDescription>
              Full candidate profile oversight and background detail
            </DialogDescription>
          </DialogHeader>

          {candidateDetailQuery.isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading full candidate profile...</div>
          ) : selectedCandidate ? (
            <div className="space-y-6 pt-2">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="text-lg">{getInitials(selectedCandidate.fullName)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold">{selectedCandidate.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedCandidate.headline}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{selectedCandidate.email}</span>
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{selectedCandidate.phone || 'N/A'}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{selectedCandidate.city || 'Location N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border p-4 bg-muted/20">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Experience & Status</h4>
                  <p className="text-sm">Total Experience: <strong>{selectedCandidate.experienceYears} Years</strong></p>
                  <p className="text-sm">Notice Period: <strong>{selectedCandidate.noticePeriodDays ? `${selectedCandidate.noticePeriodDays} Days` : 'Immediate'}</strong></p>
                  <p className="text-sm">Working Status: <strong className="capitalize">{selectedCandidate.workingStatus ? selectedCandidate.workingStatus.replace(/_/g, ' ').toLowerCase() : 'active'}</strong></p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-muted/20">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Personal Details</h4>
                  <p className="text-sm">Marital Status: <strong className="capitalize">{selectedCandidate.maritalStatus || 'N/A'}</strong></p>
                  <p className="text-sm">Category: <strong className="uppercase">{selectedCandidate.category || 'GEN'}</strong></p>
                  <p className="text-sm">Is Fresher: <strong>{selectedCandidate.isFresher ? 'Yes' : 'No'}</strong></p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-primary" />Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.skills.map((skill: string) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                  {selectedCandidate.skills.length === 0 && <span className="text-xs text-muted-foreground">No skills listed</span>}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-primary" />Education</h4>
                <div className="space-y-2">
                  {selectedCandidate.education.map((edu: any) => (
                    <div key={edu.id} className="rounded-lg border border-border p-3 text-xs">
                      <p className="font-semibold text-sm">{edu.degree}</p>
                      <p className="text-muted-foreground">{edu.institution} • {edu.endYear}</p>
                    </div>
                  ))}
                  {selectedCandidate.education.length === 0 && <p className="text-xs text-muted-foreground">No education entries.</p>}
                </div>
              </div>

              {selectedCandidate.resumeUrl && (
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-medium flex items-center gap-1"><FileText className="h-4 w-4 text-primary" /> Candidate Resume File</span>
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedCandidate.resumeUrl} target="_blank" rel="noreferrer">Open Resume</a>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">Candidate profile not found.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
