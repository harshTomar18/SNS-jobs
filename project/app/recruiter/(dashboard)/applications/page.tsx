'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Download,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  UserCheck
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/empty-state';
import { Application, ApplicationStatus } from '@/lib/types';
import { getInitials } from '@/lib/format';
import { applicationsApi } from '@/lib/scn-api';
import { getApiErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function RecruiterApplicationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected applications checkboxes state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Detail Dialog state
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [localStatuses, setLocalStatuses] = useState<Record<string, ApplicationStatus>>({});

  const applicationsQuery = useQuery({ queryKey: ['recruiter-applications'], queryFn: applicationsApi.recruiterList });
  const rawApps = useMemo<Application[]>(() => applicationsQuery.data ?? [], [applicationsQuery.data]);

  const applications = useMemo<Application[]>(() => {
    if (Object.keys(localStatuses).length === 0) return rawApps;
    return rawApps.map(app => {
      if (localStatuses[app.id]) {
        return { ...app, status: localStatuses[app.id] };
      }
      return app;
    });
  }, [rawApps, localStatuses]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: ApplicationStatus; notes?: string }) => 
      applicationsApi.updateStatus(id, status, notes),
    onSuccess: (updatedApp) => {
      toast.success('Application status updated');
      queryClient.setQueryData(['recruiter-applications'], (old: Application[] | undefined) => {
        if (!old) return old;
        return old.map(app => app.id === updatedApp.id ? updatedApp : app);
      });
      queryClient.invalidateQueries({ queryKey: ['recruiter-applications'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update application')),
  });

  const updateStatus = (id: string, status: ApplicationStatus, notes?: string) => {
    // 1. Instantly update local state overlay for 0ms visual update!
    setLocalStatuses(prev => ({ ...prev, [id]: status }));
    if (selectedApp && selectedApp.id === id) {
      setSelectedApp(prev => prev ? { ...prev, status } : prev);
    }
    // 2. Persist status to backend in background
    statusMutation.mutate({ id, status, notes });
  };

  // Filter application dates based on Time dropdown
  const filterByTime = (appliedAt: string) => {
    if (timeFilter === 'all') return true;
    const appliedTime = new Date(appliedAt).getTime();
    const now = Date.now();
    if (timeFilter === 'day') {
      return now - appliedTime <= 24 * 60 * 60 * 1000;
    }
    if (timeFilter === 'week') {
      return now - appliedTime <= 7 * 24 * 60 * 60 * 1000;
    }
    if (timeFilter === 'month') {
      return now - appliedTime <= 30 * 24 * 60 * 60 * 1000;
    }
    return true;
  };

  // Total Category Counts
  const counts = {
    all: applications.length,
    applied: applications.filter((app) => app.status === 'applied').length,
    accepted: applications.filter((app) => app.status === 'accepted' || app.status === 'shortlisted').length,
    rejected: applications.filter((app) => app.status === 'rejected' || app.status === 'not_shortlisted').length,
    interview: applications.filter((app) => app.status === 'interview').length,
    resume_viewed: applications.filter((app) => app.status === 'resume_viewed').length,
  };

  // Check if an application is in a terminal state (no further status changes allowed)
  const isTerminal = (status: string) => status === 'accepted' || status === 'rejected';

  // Filter logic
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      // Tab selection filter
      if (activeTab !== 'all' && app.status !== activeTab) return false;
      
      // Secondary dropdown status filter (if selected)
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;

      // Time filter
      if (!filterByTime(app.appliedAt)) return false;

      // Text search query
      if (search) {
        const query = search.toLowerCase();
        const matchesName = app.workerName.toLowerCase().includes(query);
        const matchesJob = app.job.title.toLowerCase().includes(query);
        const matchesId = app.id.toLowerCase().includes(query);
        if (!matchesName && !matchesJob && !matchesId) return false;
      }

      return true;
    });
  }, [activeTab, statusFilter, timeFilter, search, applications]);

  // Pagination calculation
  const totalItems = filteredApps.length;
  const totalPages = Math.max(Math.ceil(totalItems / itemsPerPage), 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedApps = filteredApps.slice(startIndex, endIndex);

  // Checkbox interactions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedApps.map(a => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], { month: 'short', day: '2-digit' });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Container */}
      <div className="flex flex-row items-center justify-between flex-wrap gap-4 border-b border-slate-50 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Applications</h1>
          <p className="text-slate-400 text-sm font-semibold mt-1">Review and manage worker candidate submissions</p>
        </div>
        <Badge variant="outline" className="bg-slate-100/80 text-slate-500 text-[10px] font-extrabold px-3 py-1.5 rounded-full border-none shadow-sm">
          {counts.all.toLocaleString()} TOTAL
        </Badge>
      </div>

      {/* Tabs list (Matches mockup categories) */}
      <div className="border-b border-slate-100 flex items-center overflow-x-auto gap-2 pb-1">
        {[
          { value: 'all', label: 'All Applications', count: counts.all },
          { value: 'applied', label: 'In Review', count: counts.applied },
          { value: 'accepted', label: 'Shortlisted', count: counts.accepted },
          { value: 'rejected', label: 'Not Shortlisted', count: counts.rejected },
          { value: 'interview', label: 'Selected for Interview', count: counts.interview },
          { value: 'resume_viewed', label: 'Resume Viewed', count: counts.resume_viewed }
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setCurrentPage(1); setSelectedIds([]); }}
            className={cn(
              "px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap -mb-1",
              activeTab === tab.value 
                ? "border-indigo-600 text-indigo-600" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            {tab.label} {tab.count !== undefined && `(${tab.count})`}
          </button>
        ))}
      </div>

      <div className="flex flex-row items-center justify-between flex-wrap gap-4 bg-white border border-slate-100/80 p-4 rounded-2xl shadow-sm">
        {/* Left: Search input */}
        <div className="relative w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, job, or ID"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-[#f4f5f7] border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 transition-all shadow-inner"
          />
        </div>

        {/* Right: Dropdowns */}
        <div className="flex items-center gap-3">
          {/* Status Dropdown */}
          <div className="relative w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="appearance-none bg-white border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-slate-600 shadow-sm focus:outline-none focus:border-slate-300 w-full sm:w-auto"
            >
              <option value="all">All Status</option>
              <option value="applied">In Review</option>
              <option value="accepted">Shortlisted</option>
              <option value="rejected">Not Shortlisted</option>
              <option value="interview">Selected for Interview</option>
              <option value="resume_viewed">Resume Viewed</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Time Dropdown */}
          <div className="relative w-full sm:w-auto">
            <select
              value={timeFilter}
              onChange={(e) => { setTimeFilter(e.target.value); setCurrentPage(1); }}
              className="appearance-none bg-white border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-slate-600 shadow-sm focus:outline-none focus:border-slate-300 w-full sm:w-auto"
            >
              <option value="all">All Time</option>
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Applications Data Table */}
      <Card className="border border-slate-100 rounded-2xl shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={paginatedApps.length > 0 && selectedIds.length === paginatedApps.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                </th>
                <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">CANDIDATE</th>
                <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">APPLIED FOR</th>
                <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">DATE</th>
                <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">EXPERIENCE</th>
                <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">LOCATION</th>
                <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4 text-center">STATUS</th>
                <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedApps.map((app) => (
                <tr key={app.id} className={cn("hover:bg-slate-50/30 transition-colors", selectedIds.includes(app.id) && "bg-slate-50/40")}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(app.id)}
                      onChange={(e) => handleSelectOne(app.id, e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-slate-100">
                        <AvatarImage src={app.workerAvatar} alt={app.workerName} />
                        <AvatarFallback className="text-xs bg-indigo-50 text-indigo-600 font-bold">
                          {getInitials(app.workerName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-800 text-sm leading-tight">{app.workerName}</span>
                        <span className="text-[11px] text-slate-400 font-semibold mt-0.5">{app.workerHeadline || 'Worker Profile'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-700">{app.job.title}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-500">{formatDate(app.appliedAt)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-600">
                      {app.workerExperienceYears !== undefined ? `${app.workerExperienceYears} Years` : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-700">{app.workerCity || 'Location not specified'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="outline" className={cn(
                      "capitalize font-extrabold text-[9px] px-3.5 py-1.5 rounded-full border-none shadow-sm inline-block tracking-wider",
                      (app.status === 'accepted' || app.status === 'shortlisted') && "bg-emerald-50 text-emerald-700",
                      app.status === 'applied' && "bg-blue-50/70 text-blue-600",
                      (app.status === 'rejected' || app.status === 'not_shortlisted') && "bg-red-50 text-red-600",
                      app.status === 'interview' && "bg-indigo-50 text-indigo-700",
                      app.status === 'resume_viewed' && "bg-amber-50 text-amber-700",
                      app.status === 'withdrawn' && "bg-slate-100 text-slate-400"
                    )}>
                      {app.status === 'accepted' || app.status === 'shortlisted' ? 'SHORTLISTED' :
                       app.status === 'rejected' || app.status === 'not_shortlisted' ? 'NOT SHORTLISTED' :
                       app.status === 'interview' ? 'SELECTED FOR INTERVIEW' :
                       app.status === 'resume_viewed' ? 'RESUME VIEWED' :
                       app.status === 'applied' ? 'IN REVIEW' : app.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => { setSelectedApp(app); setIsDetailsOpen(true); }}>
                          <Eye className="mr-2 h-4 w-4 text-slate-400" /> View Application
                        </DropdownMenuItem>
                        {app.resumeUrl && (
                          <DropdownMenuItem asChild>
                            <a href={app.resumeUrl} target="_blank" rel="noreferrer">
                              <Download className="mr-2 h-4 w-4 text-slate-400" /> Download Resume
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => updateStatus(app.id, 'accepted')}>
                          <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Shortlist
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(app.id, 'rejected')} className="text-red-600 focus:text-red-700">
                          <XCircle className="mr-2 h-4 w-4" /> Not Shortlist
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(app.id, 'interview')}>
                          <UserCheck className="mr-2 h-4 w-4 text-indigo-500" /> Selected for Interview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(app.id, 'resume_viewed')}>
                          <FileText className="mr-2 h-4 w-4 text-amber-500" /> Resume Viewed
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {paginatedApps.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <FileText className="h-12 w-12 text-slate-200 mb-3" />
                      <span className="text-base font-bold text-slate-700">No applications found</span>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">No active applications matching your tab and filter selections.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {filteredApps.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              Showing {startIndex + 1} - {endIndex} of {totalItems} applications
            </span>

            <div className="flex items-center gap-1.5">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1}
                className="h-8 w-8 rounded-lg border-slate-200 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                // simple ellipsis display logic if there are many pages
                if (totalPages > 6 && idx !== 0 && idx !== totalPages - 1 && Math.abs(currentPage - (idx + 1)) > 1) {
                  if (idx + 1 === 2 || idx + 1 === totalPages - 1) {
                    return <span key={idx} className="text-slate-400 text-xs px-1 select-none">...</span>;
                  }
                  return null;
                }
                return (
                  <Button 
                    key={idx}
                    variant={currentPage === idx + 1 ? "default" : "outline"}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={cn(
                      "h-8 w-8 rounded-lg text-xs font-bold border-slate-200",
                      currentPage === idx + 1 ? "bg-indigo-600 text-white hover:bg-indigo-700" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {idx + 1}
                  </Button>
                );
              })}
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                disabled={currentPage === totalPages}
                className="h-8 w-8 rounded-lg border-slate-200 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl bg-white border border-slate-100 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">Candidate Application Detail</DialogTitle>
          </DialogHeader>
          
          {selectedApp && (
            <div className="space-y-6 mt-4">
              {/* Profile overview card */}
              <div className="flex items-center gap-4 p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                <Avatar className="h-16 w-16 border-2 border-indigo-100">
                  <AvatarImage src={selectedApp.workerAvatar} alt={selectedApp.workerName} />
                  <AvatarFallback className="text-lg font-bold bg-indigo-50 text-indigo-600">{getInitials(selectedApp.workerName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <h3 className="text-base font-extrabold text-slate-800 leading-tight">{selectedApp.workerName}</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">{selectedApp.workerHeadline || 'Worker Profile'}</p>
                  <p className="text-xs text-slate-400 font-semibold mt-1 flex items-center gap-1">
                    <MapPinIcon /> {selectedApp.workerCity || 'Location not specified'} • {selectedApp.workerExperienceYears} Years Experience
                  </p>
                </div>
                <Badge variant="outline" className={cn(
                  "capitalize font-extrabold text-[9px] px-3.5 py-1.5 rounded-full border-none shadow-sm",
                  selectedApp.status === 'accepted' && "bg-green-50 text-green-600",
                  selectedApp.status === 'applied' && "bg-blue-50/70 text-blue-600",
                  selectedApp.status === 'rejected' && "bg-red-50 text-red-600"
                )}>
                  {selectedApp.status === 'applied' ? 'IN REVIEW' : selectedApp.status.toUpperCase()}
                </Badge>
              </div>

              {/* Cover Letter */}
              {selectedApp.coverLetter && (
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cover Note</span>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed bg-slate-50/20 p-3 rounded-lg border border-slate-100">{selectedApp.coverLetter}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-start pt-2 border-t border-slate-50">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => updateStatus(selectedApp.id, 'accepted')}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50/50 font-bold rounded-lg"
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-600" /> Shortlist
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => updateStatus(selectedApp.id, 'rejected')}
                  className="border-red-200 text-red-600 hover:bg-red-50/50 font-bold rounded-lg"
                >
                  <XCircle className="mr-1.5 h-4 w-4 text-red-600" /> Not Shortlist
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => updateStatus(selectedApp.id, 'interview')}
                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-50/50 font-bold rounded-lg"
                >
                  <UserCheck className="mr-1.5 h-4 w-4 text-indigo-600" /> Selected for Interview
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => updateStatus(selectedApp.id, 'resume_viewed')}
                  className="border-amber-200 text-amber-700 hover:bg-amber-50/50 font-bold rounded-lg"
                >
                  <FileText className="mr-1.5 h-4 w-4 text-amber-600" /> Resume Viewed
                </Button>
                {selectedApp.resumeUrl && (
                  <Button size="sm" variant="outline" className="font-bold border-slate-200 rounded-lg ml-auto" asChild>
                    <a href={selectedApp.resumeUrl} target="_blank" rel="noreferrer">
                      <Download className="mr-1.5 h-4 w-4" /> Resume
                    </a>
                  </Button>
                )}
              </div>

              {/* Timeline list */}
              <div className="text-left pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Application History Timeline</span>
                <div className="space-y-3">
                  {selectedApp.timeline.map((event) => (
                    <div key={event.id} className="flex gap-3 items-start p-3 bg-slate-50/50 border border-slate-100 rounded-xl text-xs">
                      <Clock className="h-4 w-4 text-slate-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold text-slate-700 capitalize leading-tight">
                          {event.label === 'applied' ? 'Applied (In Review)' : event.label === 'accepted' ? 'Accepted' : event.label}
                        </p>
                        {event.description && <p className="text-slate-500 font-medium mt-1">{event.description}</p>}
                        <p className="text-[10px] text-slate-400 font-medium mt-1">
                          {new Date(event.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} • by {event.actor}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MapPinIcon() {
  return (
    <svg className="h-3 w-3 text-slate-400 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
