'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Phone, Plus, Search, Trash2, User, Lock, Check, Eye, EyeOff, KeyRound, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/page-header';
import { getInitials } from '@/lib/format';
import { adminApi, masterDataApi, MasterRawItem, RecruiterView } from '@/lib/scn-api';
import { getApiErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminRecruitersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRecruiterId, setSelectedRecruiterId] = useState('');
  const [recruiterToDelete, setRecruiterToDelete] = useState<RecruiterView | null>(null);
  
  // Password visibility states
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showResetPasswordToggle, setShowResetPasswordToggle] = useState(false);
  const [resetRecruiterTarget, setResetRecruiterTarget] = useState<RecruiterView | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [fullDetailRecruiterId, setFullDetailRecruiterId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', industryIds: [] as number[] });
  
  const recruitersQuery = useQuery({ queryKey: ['admin-recruiters'], queryFn: adminApi.recruiters });
  const industriesQuery = useQuery({ queryKey: ['master', 'industries'], queryFn: () => masterDataApi.raw('industries') });
  const fullRecruiterQuery = useQuery({
    queryKey: ['admin-recruiter-full', fullDetailRecruiterId],
    queryFn: () => (fullDetailRecruiterId ? adminApi.getRecruiterFull(fullDetailRecruiterId) : null),
    enabled: Boolean(fullDetailRecruiterId),
  });

  const recruiters = useMemo<RecruiterView[]>(() => recruitersQuery.data ?? [], [recruitersQuery.data]);
  const industries = useMemo<MasterRawItem[]>(() => industriesQuery.data ?? [], [industriesQuery.data]);

  const createMutation = useMutation({
    mutationFn: () => adminApi.createRecruiter(form),
    onSuccess: () => {
      toast.success('Recruiter created successfully');
      setShowCreate(false);
      setForm({ name: '', email: '', phone: '', password: '', industryIds: [] });
      queryClient.invalidateQueries({ queryKey: ['admin-recruiters'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not create recruiter')),
  });

  const editMutation = useMutation({
    mutationFn: () => adminApi.updateRecruiter(selectedRecruiterId, form),
    onSuccess: () => {
      toast.success('Recruiter updated successfully');
      setShowCreate(false);
      setForm({ name: '', email: '', phone: '', password: '', industryIds: [] });
      queryClient.invalidateQueries({ queryKey: ['admin-recruiters'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update recruiter')),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => {
      if (!resetRecruiterTarget || !newResetPassword) throw new Error('Password required');
      return adminApi.resetRecruiterPassword(resetRecruiterTarget.id, newResetPassword);
    },
    onSuccess: () => {
      toast.success(`Password reset successfully for ${resetRecruiterTarget?.name}`);
      setResetRecruiterTarget(null);
      setNewResetPassword('');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not reset password')),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => adminApi.setRecruiterStatus(id, active),
    onSuccess: () => {
      toast.success('Recruiter status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-recruiters'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update status')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteRecruiter(id),
    onSuccess: () => {
      toast.success('Recruiter deleted');
      setRecruiterToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['admin-recruiters'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not delete recruiter')),
  });

  const filtered = useMemo(() => recruiters.filter((recruiter) =>
    recruiter.name.toLowerCase().includes(search.toLowerCase()) ||
    recruiter.email.toLowerCase().includes(search.toLowerCase()) ||
    recruiter.company.toLowerCase().includes(search.toLowerCase())
  ), [recruiters, search]);

  const toggleIndustry = (id: number) => {
    setForm((current) => ({
      ...current,
      industryIds: current.industryIds.includes(id)
        ? current.industryIds.filter((item) => item !== id)
        : [...current.industryIds, id],
    }));
  };

  const handleClose = (open: boolean) => {
    setShowCreate(open);
    if (!open) {
      setForm({ name: '', email: '', phone: '', password: '', industryIds: [] });
      setEditMode(false);
      setSelectedRecruiterId('');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruiter Management"
        description="Create, manage, reset credentials, and oversee recruiter accounts"
        action={<Button onClick={() => {
          setEditMode(false);
          setForm({ name: '', email: '', phone: '', password: '', industryIds: [] });
          setShowCreate(true);
        }}><Plus className="mr-2 h-4 w-4" />Add Recruiter</Button>}
      />

      <div className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2.5 shadow-soft transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
        <Input
          aria-label="Search recruiters"
          placeholder="Search by name, email, or company"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-10 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((recruiter) => (
          <Card key={recruiter.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{getInitials(recruiter.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{recruiter.name}</h3>
                  <p className="text-sm text-muted-foreground">{recruiter.designation}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn('mt-1', recruiter.status === 'active' ? 'border-success/20 bg-success/5 text-success' : 'bg-muted text-muted-foreground')}>
                      {recruiter.status}
                    </Badge>
                    <Button variant="link" className="text-xs h-6 px-0 mt-1" onClick={() => {
                      setEditMode(true);
                      setSelectedRecruiterId(recruiter.id);
                      setForm({ name: recruiter.name, email: recruiter.email, phone: recruiter.phone || '', password: '', industryIds: recruiter.industryIds });
                      setShowCreate(true);
                    }}>
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
              <Switch
                checked={recruiter.status === 'active'}
                onCheckedChange={(active) => statusMutation.mutate({ id: recruiter.id, active })}
              />
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /><span className="truncate">{recruiter.email}</span></div>
              <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /><span>{recruiter.phone || 'Not provided'}</span></div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {recruiter.industries.map((industry) => <Badge key={industry} variant="outline" className="text-xs">{industry}</Badge>)}
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Jobs Posted</p>
                  <p className="text-lg font-semibold">{recruiter.jobsPosted}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() => {
                      setResetRecruiterTarget(recruiter);
                      setNewResetPassword('');
                    }}
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Reset Password
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setRecruiterToDelete(recruiter)}
                    aria-label={`Delete ${recruiter.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recruiter Create / Edit Modal with Show Password Toggle */}
      <Dialog open={showCreate} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editMode ? 'Edit Recruiter' : 'Create New Recruiter'}</DialogTitle></DialogHeader>
          <DialogDescription className="sr-only">Form to {editMode ? 'edit' : 'create'} a recruiter profile</DialogDescription>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="John Doe" className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" placeholder="john@company.com" required className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} type="tel" placeholder="9876543210" className="pl-10" />
                </div>
              </div>
              {!editMode && (
                <div className="space-y-2">
                  <Label>Temporary Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                      type={showCreatePassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      required
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Assigned Industries</Label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto rounded-md border border-input p-3 bg-muted/30">
                {industries.map((industry) => {
                  const isSelected = form.industryIds.includes(industry.id);
                  return (
                    <Badge
                      key={industry.id}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/90 transition-colors py-1.5 px-3"
                      onClick={() => toggleIndustry(industry.id)}
                    >
                      {'name' in industry ? industry.name : industry.id}
                      {isSelected && <Check className="ml-1.5 h-3 w-3" />}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
            <Button 
              onClick={() => editMode ? editMutation.mutate() : createMutation.mutate()} 
              disabled={(editMode ? editMutation.isPending : createMutation.isPending) || !form.name || !form.email || form.industryIds.length === 0 || (!editMode && !form.password)}
            >
              {editMode ? (editMutation.isPending ? 'Updating...' : 'Update Recruiter') : (createMutation.isPending ? 'Creating...' : 'Create Recruiter')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recruiter Password Reset Dialog with Show Password Toggle */}
      <Dialog open={Boolean(resetRecruiterTarget)} onOpenChange={(open) => !open && setResetRecruiterTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Reset Recruiter Password
            </DialogTitle>
            <DialogDescription>
              Set a new login password for <strong>{resetRecruiterTarget?.name}</strong> ({resetRecruiterTarget?.email}). Old password is not required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showResetPasswordToggle ? 'text' : 'password'}
                  placeholder="Enter new password (min 6 characters)"
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPasswordToggle((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showResetPasswordToggle ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResetRecruiterTarget(null)}>Cancel</Button>
            <Button
              onClick={() => resetPasswordMutation.mutate()}
              disabled={resetPasswordMutation.isPending || !newResetPassword || newResetPassword.length < 6}
            >
              {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recruiter Full Detail Oversight Dialog */}
      <Dialog open={Boolean(fullDetailRecruiterId)} onOpenChange={(open) => !open && setFullDetailRecruiterId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Recruiter Platform Detail & Posted Jobs
            </DialogTitle>
          </DialogHeader>

          {fullRecruiterQuery.isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading recruiter details & posted jobs...</div>
          ) : (() => {
            const selectedRecruiter = recruiters.find((r) => r.id === fullDetailRecruiterId);
            const recruiterData = fullRecruiterQuery.data?.recruiter || (fullRecruiterQuery.data?.name ? fullRecruiterQuery.data : null) || selectedRecruiter;
            const jobsData = fullRecruiterQuery.data?.jobs || (Array.isArray(fullRecruiterQuery.data) ? fullRecruiterQuery.data : []);

            return (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="font-bold text-lg">{recruiterData?.name || 'Recruiter'}</h3>
                    <p className="text-sm text-muted-foreground">{recruiterData?.email || recruiterData?.companyName || ''}</p>
                  </div>
                  <Badge variant="outline">{jobsData?.length || 0} Total Jobs Posted</Badge>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Posted Jobs Oversight</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {jobsData?.map((job: any) => (
                      <div key={job.id} className="rounded-lg border border-border p-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-medium text-sm">{job.title}</p>
                          <p className="text-muted-foreground">{job.headcountRequired || 0} Openings</p>
                        </div>
                        <Badge variant="outline">{job.status}</Badge>
                      </div>
                    ))}
                    {(!jobsData || jobsData.length === 0) && (
                      <p className="text-xs text-muted-foreground py-4 text-center">No jobs posted yet by this recruiter.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Recruiter Alert */}
      <AlertDialog open={!!recruiterToDelete} onOpenChange={(open) => !open && setRecruiterToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete recruiter?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {recruiterToDelete?.name}&apos;s recruiter account. Recruiters with posted jobs should be deactivated instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => recruiterToDelete && deleteMutation.mutate(recruiterToDelete.id)}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Recruiter'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
