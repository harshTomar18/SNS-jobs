'use client';

import { useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, MapPin, Code, Languages, Briefcase, Award, Gift, Box, Upload, Layers, ChevronRight, Loader2 } from 'lucide-react';
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
import { MasterResource, masterDataApi, BackendLocation } from '@/lib/scn-api';
import { getApiErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BulkMasterDataImportModal } from '@/components/admin/bulk-master-data-import-modal';

const tabs: { id: MasterResource; label: string; icon: typeof Building2 }[] = [
  { id: 'industries', label: 'Industries', icon: Building2 },
  { id: 'functions', label: 'Functions', icon: Layers },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'skills', label: 'Skills', icon: Code },
  { id: 'job-roles', label: 'Job Roles', icon: Briefcase },
  { id: 'languages', label: 'Languages', icon: Languages },
  { id: 'qualifications', label: 'Qualifications', icon: Award },
  { id: 'benefits', label: 'Benefits', icon: Gift },
  { id: 'assets', label: 'Assets', icon: Box },
];

export default function MasterDataPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<MasterResource>('industries');
  const [showCreate, setShowCreate] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
  const [form, setForm] = useState({ name: '', level: 'general', state: '', city: '', locality: '' });

  // Location dropdown states
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [stateInput, setStateInput] = useState('');
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [localityInput, setLocalityInput] = useState('');
  const [isLocalityOpen, setIsLocalityOpen] = useState(false);

  // Location API queries
  const { data: statesData, isLoading: isLoadingStates } = useQuery<string[]>({
    queryKey: ['master', 'locations', 'states'],
    queryFn: () => masterDataApi.getStates(),
    enabled: activeTab === 'locations' || showCreate,
  });
  const states = statesData ?? [];

  const effectiveState = selectedState || stateInput.trim();
  const { data: citiesData, isLoading: isLoadingCities } = useQuery<string[]>({
    queryKey: ['master', 'locations', 'cities', effectiveState],
    queryFn: () => masterDataApi.getCities(effectiveState),
    enabled: !!effectiveState && (activeTab === 'locations' || showCreate),
  });
  const cities = citiesData ?? [];

  const effectiveCity = selectedCity || cityInput.trim();
  const { data: localitiesData, isLoading: isLoadingLocalities } = useQuery<BackendLocation[]>({
    queryKey: ['master', 'locations', 'localities', effectiveCity, effectiveState],
    queryFn: () => masterDataApi.getLocalities(effectiveCity, effectiveState),
    enabled: !!effectiveCity && !!effectiveState && (activeTab === 'locations' || showCreate),
  });
  const localities = localitiesData ?? [];

  const filteredStates = states.filter((s: string) => {
    if (!stateInput || stateInput === selectedState) return true;
    return s.toLowerCase().includes(stateInput.toLowerCase());
  });

  const filteredCities = cities.filter((c: string) => {
    if (!cityInput || cityInput === selectedCity) return true;
    return c.toLowerCase().includes(cityInput.toLowerCase());
  });

  const filteredLocalities = localities.filter((l: BackendLocation) => {
    if (!localityInput) return true;
    return l.locality.toLowerCase().includes(localityInput.toLowerCase());
  });

  const handleStateChange = (state: string) => {
    setIsStateOpen(false);
    setSelectedState(state);
    setStateInput(state);
    setForm((prev) => ({ ...prev, state, city: '', locality: '' }));
    setSelectedCity('');
    setCityInput('');
    setLocalityInput('');
  };

  const handleCityChange = (city: string) => {
    setIsCityOpen(false);
    setSelectedCity(city);
    setCityInput(city);
    setForm((prev) => ({ ...prev, city, locality: '' }));
    setLocalityInput('');
  };

  const handleLocalityChange = (locality: string) => {
    setIsLocalityOpen(false);
    setLocalityInput(locality);
    setForm((prev) => ({ ...prev, locality }));
  };

  const queries = useQueries({
    queries: tabs.map((tab) => ({
      queryKey: ['master', tab.id],
      queryFn: () => masterDataApi.list(tab.id),
    })),
  });
  const data = Object.fromEntries(tabs.map((tab, index) => [tab.id, queries[index].data ?? []])) as Record<MasterResource, MasterDataItem[]>;
  const currentTab = tabs.find((tab) => tab.id === activeTab)!;

  const saveMutation = useMutation({
    mutationFn: () => {
      if (activeTab === 'locations') {
        const stateVal = (form.state || stateInput).trim();
        const cityVal = (form.city || cityInput).trim();
        const localityVal = (form.locality || localityInput).trim();
        if (!stateVal || !cityVal || !localityVal) {
          throw new Error('State, City, and Locality are all required');
        }
        const locationData = { state: stateVal, city: cityVal, locality: localityVal };
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
      setSelectedState('');
      setStateInput('');
      setSelectedCity('');
      setCityInput('');
      setLocalityInput('');
      queryClient.invalidateQueries({ queryKey: ['master', activeTab] });
      queryClient.invalidateQueries({ queryKey: ['master', 'locations'] });
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

  const openCreate = () => {
    setEditingItem(null);
    setForm({ name: '', level: 'general', state: '', city: '', locality: '' });
    setSelectedState('');
    setStateInput('');
    setSelectedCity('');
    setCityInput('');
    setLocalityInput('');
    setShowCreate(true);
  };

  const openEdit = (item: MasterDataItem) => {
    setEditingItem(item);
    const st = item.state || '';
    const ct = item.city || '';
    const loc = item.locality || '';
    setForm({ name: item.name, level: 'general', state: st, city: ct, locality: loc });
    setSelectedState(st);
    setStateInput(st);
    setSelectedCity(ct);
    setCityInput(ct);
    setLocalityInput(loc);
    setShowCreate(true);
  };

  const columns: Column<MasterDataItem>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-medium">{row.name}</span>
          {row.state && (
            <span className="ml-2 text-xs text-muted-foreground">({row.state})</span>
          )}
        </div>
      ),
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
        description="Manage platform-wide reference data, benefits, assets, and locations"
        action={
          <div className="flex items-center gap-2">
            {!['languages', 'assets', 'benefits'].includes(activeTab) && (
              <Button variant="outline" onClick={() => setShowBulkModal(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Bulk Import {currentTab.label}
              </Button>
            )}
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add {currentTab.label.replace(/s$/, '')}
            </Button>
          </div>
        }
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

      <BulkMasterDataImportModal
        open={showBulkModal}
        onOpenChange={setShowBulkModal}
        resource={activeTab}
        resourceLabel={currentTab.label}
        functionsList={data['functions'] || []}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['master', activeTab] });
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        }}
      />

      <Dialog open={showCreate} onOpenChange={(open) => {
        setShowCreate(open);
        if (!open) {
          setEditingItem(null);
          setIsStateOpen(false);
          setIsCityOpen(false);
          setIsLocalityOpen(false);
        }
      }}>
        <DialogContent className={cn(activeTab === 'locations' ? 'sm:max-w-2xl' : 'sm:max-w-lg')}>
          <DialogHeader><DialogTitle>{editingItem ? 'Edit' : 'Add'} {currentTab.label.replace(/s$/, '')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {activeTab === 'locations' ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {/* State Field */}
                <div className="space-y-1.5 relative">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">State *</Label>
                  <div className="relative">
                    <input
                      type="text"
                      autoComplete="off"
                      placeholder="Type or select state..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-700 dark:text-slate-200 h-10 px-3 pr-8 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                      value={stateInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStateInput(val);
                        setForm((prev) => ({ ...prev, state: val }));
                        setIsStateOpen(true);
                      }}
                      onFocus={() => setIsStateOpen(true)}
                      onBlur={() => {
                        setTimeout(() => {
                          setIsStateOpen(false);
                          const matched = states.find((s: string) => s.toLowerCase() === stateInput.trim().toLowerCase());
                          if (matched) {
                            handleStateChange(matched);
                          } else if (stateInput.trim()) {
                            setSelectedState(stateInput.trim());
                          }
                        }, 200);
                      }}
                    />
                    <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-slate-400 pointer-events-none" />
                  </div>
                  {isStateOpen && (
                    <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[70] max-h-[190px] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1">
                      {isLoadingStates ? (
                        <div className="flex items-center justify-center p-3">
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        </div>
                      ) : (
                        <>
                          {filteredStates.map((state: string) => (
                            <button
                              key={state}
                              type="button"
                              className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleStateChange(state);
                              }}
                              onClick={() => handleStateChange(state)}
                            >
                              {state}
                            </button>
                          ))}
                          {stateInput.trim() !== '' && !states.some((s: string) => s.toLowerCase() === stateInput.trim().toLowerCase()) && (
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleStateChange(stateInput.trim());
                              }}
                              onClick={() => handleStateChange(stateInput.trim())}
                            >
                              <span className="flex items-center gap-1.5">
                                <Plus className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                Add &quot;{stateInput.trim()}&quot;
                              </span>
                              <Badge className="bg-blue-100 text-blue-700 text-[10px] font-bold border-none dark:bg-blue-900 dark:text-blue-200">Custom</Badge>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* City Field */}
                <div className="space-y-1.5 relative">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">City *</Label>
                  <div className="relative">
                    <input
                      type="text"
                      autoComplete="off"
                      placeholder={effectiveState ? "Type or select city..." : "Choose state first"}
                      disabled={!effectiveState}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-700 dark:text-slate-200 h-10 px-3 pr-8 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm disabled:opacity-50 disabled:bg-slate-100/50 dark:disabled:bg-slate-900/50"
                      value={cityInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCityInput(val);
                        setForm((prev) => ({ ...prev, city: val }));
                        setIsCityOpen(true);
                      }}
                      onFocus={() => setIsCityOpen(true)}
                      onBlur={() => {
                        setTimeout(() => {
                          setIsCityOpen(false);
                          const matched = cities.find((c: string) => c.toLowerCase() === cityInput.trim().toLowerCase());
                          if (matched) {
                            handleCityChange(matched);
                          } else if (cityInput.trim()) {
                            setSelectedCity(cityInput.trim());
                          }
                        }, 200);
                      }}
                    />
                    <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-slate-400 pointer-events-none" />
                  </div>
                  {isCityOpen && effectiveState && (
                    <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[70] max-h-[190px] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1">
                      {isLoadingCities ? (
                        <div className="flex items-center justify-center p-3">
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        </div>
                      ) : (
                        <>
                          {filteredCities.map((city: string) => (
                            <button
                              key={city}
                              type="button"
                              className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleCityChange(city);
                              }}
                              onClick={() => handleCityChange(city)}
                            >
                              {city}
                            </button>
                          ))}
                          {cityInput.trim() !== '' && !cities.some((c: string) => c.toLowerCase() === cityInput.trim().toLowerCase()) && (
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleCityChange(cityInput.trim());
                              }}
                              onClick={() => handleCityChange(cityInput.trim())}
                            >
                              <span className="flex items-center gap-1.5">
                                <Plus className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                Add &quot;{cityInput.trim()}&quot;
                              </span>
                              <Badge className="bg-blue-100 text-blue-700 text-[10px] font-bold border-none dark:bg-blue-900 dark:text-blue-200">Custom</Badge>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Locality Field */}
                <div className="space-y-1.5 relative">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Locality *</Label>
                  <div className="relative">
                    <input
                      type="text"
                      autoComplete="off"
                      placeholder={effectiveCity ? "Type or select locality..." : "Choose city first"}
                      disabled={!effectiveCity}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-700 dark:text-slate-200 h-10 px-3 pr-8 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm disabled:opacity-50 disabled:bg-slate-100/50 dark:disabled:bg-slate-900/50"
                      value={localityInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocalityInput(val);
                        setForm((prev) => ({ ...prev, locality: val }));
                        setIsLocalityOpen(true);
                      }}
                      onFocus={() => setIsLocalityOpen(true)}
                      onBlur={() => {
                        setTimeout(() => {
                          setIsLocalityOpen(false);
                        }, 200);
                      }}
                    />
                    <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-slate-400 pointer-events-none" />
                  </div>
                  {isLocalityOpen && effectiveCity && (
                    <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[70] max-h-[190px] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1">
                      {isLoadingLocalities ? (
                        <div className="flex items-center justify-center p-3">
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        </div>
                      ) : (
                        <>
                          {filteredLocalities.map((loc: BackendLocation) => (
                            <button
                              key={loc.id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleLocalityChange(loc.locality);
                              }}
                              onClick={() => handleLocalityChange(loc.locality)}
                            >
                              {loc.locality}
                            </button>
                          ))}
                          {localityInput.trim() !== '' && !localities.some((l: BackendLocation) => l.locality.toLowerCase() === localityInput.trim().toLowerCase()) && (
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleLocalityChange(localityInput.trim());
                              }}
                              onClick={() => handleLocalityChange(localityInput.trim())}
                            >
                              <span className="flex items-center gap-1.5">
                                <Plus className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                Add &quot;{localityInput.trim()}&quot;
                              </span>
                              <Badge className="bg-blue-100 text-blue-700 text-[10px] font-bold border-none dark:bg-blue-900 dark:text-blue-200">Custom</Badge>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
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
                    <Input value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })} placeholder="TEN, TWELVE, DIPLOMA, GRADUATE, or POST_GRADUATE" />
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreate(false);
              setEditingItem(null);
              setIsStateOpen(false);
              setIsCityOpen(false);
              setIsLocalityOpen(false);
            }}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(undefined)} disabled={saveMutation.isPending}>{editingItem ? 'Save Changes' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
