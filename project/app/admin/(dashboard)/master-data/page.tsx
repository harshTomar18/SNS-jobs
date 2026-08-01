'use client';

import { useState } from 'react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, MapPin, Code, Languages, Briefcase, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DataTable, Column } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { MasterDataItem } from '@/lib/types';
import { MasterResource, masterDataApi } from '@/lib/scn-api';
import { getApiErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const tabs: { id: MasterResource; label: string; icon: typeof Building2 }[] = [
  { id: 'industries', label: 'Industries', icon: Building2 },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'skills', label: 'Skills', icon: Code },
  { id: 'job-roles', label: 'Job Roles', icon: Briefcase },
  { id: 'languages', label: 'Languages', icon: Languages },
  { id: 'qualifications', label: 'Qualifications', icon: Award },
];

export default function MasterDataPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<MasterResource>('industries');
  const [showCreate, setShowCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
  const [form, setForm] = useState({ name: '', level: 'general', state: '', city: '', locality: '' });
  const queries = useQueries({
    queries: tabs.map((tab) => ({
      queryKey: ['master', tab.id],
      queryFn: () => masterDataApi.list(tab.id),
    })),
  });
  const data = Object.fromEntries(tabs.map((tab, index) => [tab.id, queries[index].data ?? []])) as Record<MasterResource, MasterDataItem[]>;
  const currentData = data[activeTab] || [];
  const currentTab = tabs.find((tab) => tab.id === activeTab)!;

  const saveMutation = useMutation({
    mutationFn: () => {
      if (activeTab === 'locations') {
        const locationData = { state: form.state, city: form.city, locality: form.locality };
        return editingItem
          ? masterDataApi.update(activeTab, editingItem.id, locationData)
          : masterDataApi.create(activeTab, locationData);
      }
      if (activeTab === 'qualifications') {
        const qualificationData = { name: form.name, level: form.level || 'general' };
        return editingItem
          ? masterDataApi.update(activeTab, editingItem.id, qualificationData)
          : masterDataApi.create(activeTab, qualificationData);
      }
      return editingItem
        ? masterDataApi.update(activeTab, editingItem.id, { name: form.name })
        : masterDataApi.create(activeTab, { name: form.name });
    },
    onSuccess: () => {
      toast.success(editingItem ? 'Updated successfully' : 'Created successfully');
      setShowCreate(false);
      setEditingItem(null);
      setForm({ name: '', level: 'general', state: '', city: '', locality: '' });
      queryClient.invalidateQueries({ queryKey: ['master', activeTab] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not save master data')),
  });

  const deleteMutation = useMutation({
    mutationFn: (item: MasterDataItem) => masterDataApi.remove(activeTab, item.id),
    onSuccess: () => {
      toast.success('Deactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['master', activeTab] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not deactivate item')),
  });

  const openEdit = (item: MasterDataItem) => {
    setEditingItem(item);
    setForm({ name: item.name, level: 'general', state: '', city: '', locality: '' });
    setShowCreate(true);
  };

  const columns: Column<MasterDataItem>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant="outline" className={cn(row.status === 'active' ? 'border-success/20 bg-success/5 text-success' : 'bg-muted text-muted-foreground')}>
          {row.status}
        </Badge>
      ),
    },
    { key: 'createdAt', header: 'Created', sortable: true, render: (row) => <span className="text-muted-foreground">{row.createdAt || '-'}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Data Management"
        description="Manage platform-wide reference data"
        action={<Button onClick={() => { setEditingItem(null); setShowCreate(true); }}><Plus className="mr-2 h-4 w-4" />Add {currentTab.label.replace(/s$/, '')}</Button>}
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as MasterResource)}>
        <TabsList className="flex h-auto flex-wrap gap-1 bg-card p-1">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <Badge variant="secondary" className="text-xs">{data[tab.id]?.length || 0}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            <Card className="p-6">
              <DataTable
                data={data[tab.id] || []}
                columns={columns}
                searchable
                searchKeys={['name']}
                onEdit={openEdit}
                onDelete={(item) => deleteMutation.mutate(item)}
              />
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) setEditingItem(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingItem ? 'Edit' : 'Add'} {currentTab.label.replace(/s$/, '')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {activeTab === 'locations' ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2"><Label>State</Label><Input value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} /></div>
                <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></div>
                <div className="space-y-2"><Label>Locality</Label><Input value={form.locality} onChange={(event) => setForm({ ...form, locality: event.target.value })} /></div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={`Enter ${currentTab.label.toLowerCase()} name`} />
                </div>
                {activeTab === 'qualifications' && (
                  <div className="space-y-2">
                    <Label>Level</Label>
                    <Input value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })} />
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditingItem(null); }}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>{editingItem ? 'Save Changes' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
