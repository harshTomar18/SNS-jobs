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
  UserCheck,
  MapPin,
  Filter,
  RotateCcw,
  Building
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
import { Application, ApplicationStatus, WorkerProfile } from '@/lib/types';
import { getInitials } from '@/lib/format';
import { CandidateProfileDrawer } from '@/components/candidate-profile-drawer';
import { applicationsApi, adminApi, masterDataApi, ApplicationSearchParams } from '@/lib/scn-api';
import { getApiErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MultiSelectFilter } from '@/components/multi-select-filter';

export default function AdminApplicationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Multi-select Filter states
  const [jobRoleFilters, setJobRoleFilters] = useState<string[]>([]);
  const [expFilter, setExpFilter] = useState('all');
  const [industryFilters, setIndustryFilters] = useState<string[]>([]);
  const [departmentFilters, setDepartmentFilters] = useState<string[]>([]);
  const [skillFilters, setSkillFilters] = useState<string[]>([]);
  const [qualFilters, setQualFilters] = useState<string[]>([]);
  const [genderFilter, setGenderFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [langFilters, setLangFilters] = useState<string[]>([]);
  const [assetFilters, setAssetFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Detail Dialog state (Application View)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [localStatuses, setLocalStatuses] = useState<Record<string, ApplicationStatus>>({});

  // Candidate Profile Sheet state (Worker Profile View)
  const [selectedCandidateApp, setSelectedCandidateApp] = useState<Application | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [isWorkerSheetOpen, setIsWorkerSheetOpen] = useState(false);

  // Master Data Query
  const masterQuery = useQuery({
    queryKey: ['master-data-all'],
    queryFn: () => masterDataApi.all(),
  });
  const masterData = masterQuery.data;

  const resolveIds = (selectedNames: string[], masterList?: any[]) => {
    if (!selectedNames.length) return undefined;
    return selectedNames.map((name) => {
      const match = (masterList || []).find(
        (m: any) => String(m.id) === name || m.name?.toLowerCase() === name.toLowerCase()
      );
      return match ? match.id : name;
    });
  };

  // Build draft API Search parameters for /applications/search (Admin: No default date filter)
  const currentSearchParams = useMemo<ApplicationSearchParams>(() => {
    const params: ApplicationSearchParams = {};

    if (timeFilter !== 'all') {
      if (timeFilter === 'day' || timeFilter === '1') params.days = 1;
      else if (timeFilter === 'week' || timeFilter === '7') params.days = 7;
      else if (timeFilter === '15') params.days = 15;
      else if (timeFilter === 'month' || timeFilter === '30') params.days = 30;
    }

    if (search.trim()) params.q = search.trim();

    if (jobRoleFilters.length > 0) {
      params.jobRoleIds = resolveIds(jobRoleFilters, masterData?.['job-roles']);
    }

    if (expFilter !== 'all') {
      if (expFilter === 'fresher') params.minExperienceMonths = 0;
      else if (expFilter === '1-3') params.minExperienceMonths = 12;
      else if (expFilter === '3-5') params.minExperienceMonths = 36;
      else if (expFilter === '5+') params.minExperienceMonths = 60;
    }

    if (industryFilters.length > 0) {
      params.industryIds = resolveIds(industryFilters, masterData?.industries);
    }

    if (departmentFilters.length > 0) {
      params.departmentIds = resolveIds(departmentFilters, masterData?.['functions'] || masterData?.['departments']);
    }

    if (skillFilters.length > 0) {
      params.skillIds = resolveIds(skillFilters, masterData?.skills);
    }

    if (qualFilters.length > 0) {
      params.qualificationIds = resolveIds(qualFilters, masterData?.qualifications);
    }

    if (genderFilter !== 'all') {
      params.gender = genderFilter.toLowerCase();
    }

    if (ageFilter !== 'all') {
      if (ageFilter === '18-25') { params.minAge = 18; params.maxAge = 25; }
      else if (ageFilter === '26-35') { params.minAge = 26; params.maxAge = 35; }
      else if (ageFilter === '36+') { params.minAge = 36; }
    }

    if (langFilters.length > 0) {
      params.languageIds = resolveIds(langFilters, masterData?.languages);
    }

    if (assetFilters.length > 0) {
      params.assets = assetFilters;
    }

    return params;
  }, [timeFilter, search, jobRoleFilters, expFilter, industryFilters, departmentFilters, skillFilters, qualFilters, genderFilter, ageFilter, langFilters, assetFilters, masterData]);

  // Active API parameters state updated on Search button click or initial load
  const [activeApiParams, setActiveApiParams] = useState(currentSearchParams);

  const handleSearchSubmit = () => {
    setActiveApiParams(currentSearchParams);
  };

  // Primary Query: Fetch applications across all recruiters using backend search endpoint
  const applicationsQuery = useQuery({
    queryKey: ['admin-applications-search', activeApiParams],
    queryFn: async () => {
      try {
        return await applicationsApi.search(activeApiParams);
      } catch (error) {
        return await applicationsApi.recruiterList();
      }
    },
  });
  const rawApps = useMemo<Application[]>(() => applicationsQuery.data ?? [], [applicationsQuery.data]);

  // Worker Detail Query for Candidate Profile Drawer
  const workerDetailQuery = useQuery({
    queryKey: ['candidate-worker-full', selectedWorkerId],
    queryFn: () => adminApi.getWorkerFull(selectedWorkerId!),
    enabled: !!selectedWorkerId && isWorkerSheetOpen,
  });
  const fetchedWorkerProfile: WorkerProfile | null = workerDetailQuery.data ?? null;

  const workerProfile: WorkerProfile | null = useMemo(() => {
    if (fetchedWorkerProfile) return fetchedWorkerProfile;
    if (selectedCandidateApp?.workerProfile) return selectedCandidateApp.workerProfile;
    if (selectedCandidateApp) {
      return {
        id: selectedCandidateApp.workerId,
        name: selectedCandidateApp.workerName,
        headline: selectedCandidateApp.workerHeadline || 'Candidate Profile',
        city: selectedCandidateApp.workerCity || 'Location not specified',
        experienceYears: selectedCandidateApp.workerExperienceYears || 0,
        totalExperienceMonths: (selectedCandidateApp.workerExperienceYears || 0) * 12,
        profilePhotoUrl: selectedCandidateApp.workerAvatar,
        resumeUrl: selectedCandidateApp.resumeUrl,
        summary: selectedCandidateApp.coverLetter || '',
        skills: [],
        languages: [],
        experience: [],
        education: []
      } as any;
    }
    return null;
  }, [fetchedWorkerProfile, selectedCandidateApp]);

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
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update application')),
  });

  const updateStatus = (id: string, status: ApplicationStatus, notes?: string) => {
    setLocalStatuses(prev => ({ ...prev, [id]: status }));
    if (selectedApp && selectedApp.id === id) {
      setSelectedApp(prev => prev ? { ...prev, status } : prev);
    }
    statusMutation.mutate({ id, status, notes });
  };

  const isStatusMatch = (appStatus: string, target: string) => {
    if (target === 'all') return true;
    if (target === 'applied') return appStatus === 'applied';
    if (target === 'accepted') return appStatus === 'accepted';
    if (target === 'rejected') return appStatus === 'rejected';
    if (target === 'shortlisted') return appStatus === 'shortlisted' || appStatus === 'accepted';
    if (target === 'notshortlisted') return appStatus === 'notshortlisted' || appStatus === 'not_shortlisted' || appStatus === 'rejected';
    if (target === 'selected_for_interview') return appStatus === 'selected_for_interview' || appStatus === 'interview';
    if (target === 'resume_viewed') return appStatus === 'resume_viewed';
    return appStatus === target;
  };

  // Filter application dates based on Time dropdown
  const filterByTime = (appliedAt: string) => {
    if (timeFilter === 'all') return true;
    const appliedTime = new Date(appliedAt).getTime();
    const now = Date.now();
    if (timeFilter === 'day') return now - appliedTime <= 24 * 60 * 60 * 1000;
    if (timeFilter === 'week') return now - appliedTime <= 7 * 24 * 60 * 60 * 1000;
    if (timeFilter === '15') return now - appliedTime <= 15 * 24 * 60 * 60 * 1000;
    if (timeFilter === 'month') return now - appliedTime <= 30 * 24 * 60 * 60 * 1000;
    return true;
  };

  // Total Category Counts
  const counts = {
    all: applications.length,
    applied: applications.filter((app) => isStatusMatch(app.status, 'applied')).length,
    shortlisted: applications.filter((app) => isStatusMatch(app.status, 'shortlisted')).length,
    notshortlisted: applications.filter((app) => isStatusMatch(app.status, 'notshortlisted')).length,
    selected_for_interview: applications.filter((app) => isStatusMatch(app.status, 'selected_for_interview')).length,
    resume_viewed: applications.filter((app) => isStatusMatch(app.status, 'resume_viewed')).length,
  };

  // Filter logic
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      if (activeTab !== 'all' && !isStatusMatch(app.status, activeTab)) return false;
      if (statusFilter !== 'all' && !isStatusMatch(app.status, statusFilter)) return false;
      if (!filterByTime(app.appliedAt)) return false;

      if (search) {
        const query = search.toLowerCase();
        const matchesName = app.workerName.toLowerCase().includes(query);
        const matchesJob = app.job.title.toLowerCase().includes(query);
        const matchesRecruiter = (app.job.recruiterName || '').toLowerCase().includes(query) || (app.job.companyName || '').toLowerCase().includes(query);
        const matchesId = app.id.toLowerCase().includes(query);
        if (!matchesName && !matchesJob && !matchesRecruiter && !matchesId) return false;
      }

      return true;
    });
  }, [activeTab, statusFilter, timeFilter, search, applications]);

  // Master data lists for dropdowns
  const jobRolesList = useMemo(() => {
    const fromMaster = (masterData?.['job-roles'] || []).map((r: any) => r.name);
    return Array.from(new Set([...fromMaster, 'Chat Support Executive', 'Stock Clerk', 'Hospital Receptionist', 'IT Helpdesk Executive', 'Production Line Worker', 'Delivery Driver'])).filter(Boolean).sort();
  }, [masterData]);

  const industriesList = useMemo(() => {
    const fromMaster = (masterData?.industries || []).map((i: any) => i.name);
    return Array.from(new Set([...fromMaster, 'BPO / Customer Support', 'Retail', 'Healthcare', 'IT Services', 'Manufacturing', 'Logistics & Supply Chain'])).filter(Boolean).sort();
  }, [masterData]);

  const departmentsList = useMemo(() => {
    const fromMaster = (masterData?.['functions'] || masterData?.['departments'] || []).map((d: any) => d.name);
    const fromApps = (applications || []).map((a: any) => a.job?.functionName || a.job?.departmentName || a.job?.department).filter(Boolean);
    return Array.from(new Set([...fromMaster, ...fromApps, 'Administration & Facilities', 'Customer Support', 'Customer Service', 'Warehouse Operations', 'Front Office', 'Technical Support', 'Production', 'Fleet Operations', 'Food & Beverage', 'Store Operations', 'Software Development', 'Quality Assurance', 'Data Operations', 'Delivery', 'Patient Care', 'Security', 'Site Operations', 'Housekeeping', 'Sales'])).filter(Boolean).sort();
  }, [masterData, applications]);

  const skillsList = useMemo(() => {
    const fromMaster = (masterData?.skills || []).map((s: any) => s.name);
    return Array.from(new Set([...fromMaster, 'Communication', 'Customer Service', 'Inventory Management', 'MS Office', 'JavaScript'])).filter(Boolean).sort();
  }, [masterData]);

  const qualList = useMemo(() => {
    const fromMaster = (masterData?.qualifications || []).map((q: any) => q.name);
    return Array.from(new Set([...fromMaster, '10th Pass', '12th Pass', 'Graduate', 'Post Graduate', 'Diploma'])).filter(Boolean).sort();
  }, [masterData]);

  const languagesList = useMemo(() => {
    const fromMaster = (masterData?.languages || []).map((l: any) => l.name);
    return Array.from(new Set([...fromMaster, 'English', 'Hindi', 'Tamil', 'Kannada', 'Telugu'])).filter(Boolean).sort();
  }, [masterData]);

  const assetsList = useMemo(() => {
    const fromMaster = (masterData?.assets || []).map((a: any) => a.name);
    return Array.from(new Set([...fromMaster, 'Laptop', 'Two-Wheeler / Bike', 'Android Smartphone'])).filter(Boolean).sort();
  }, [masterData]);

  // Pagination calculation
  const totalItems = filteredApps.length;
  const totalPages = Math.max(Math.ceil(totalItems / itemsPerPage), 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedApps = filteredApps.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], { month: 'short', day: '2-digit' });
  };

  const handleOpenCandidateProfile = (app: Application) => {
    setSelectedCandidateApp(app);
    setSelectedWorkerId(app.workerId);
    setIsWorkerSheetOpen(true);
  };

  const activeFilterCount = [
    jobRoleFilters.length > 0,
    expFilter !== 'all',
    industryFilters.length > 0,
    departmentFilters.length > 0,
    skillFilters.length > 0,
    qualFilters.length > 0,
    genderFilter !== 'all',
    ageFilter !== 'all',
    langFilters.length > 0,
    assetFilters.length > 0,
    timeFilter !== 'all',
    statusFilter !== 'all',
    Boolean(search)
  ].filter(Boolean).length;

  const resetAllFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTimeFilter('all');
    setJobRoleFilters([]);
    setExpFilter('all');
    setIndustryFilters([]);
    setDepartmentFilters([]);
    setSkillFilters([]);
    setQualFilters([]);
    setGenderFilter('all');
    setAgeFilter('all');
    setLangFilters([]);
    setAssetFilters([]);
    setActiveApiParams({});
  };

  const renderStatusBadge = (status: ApplicationStatus) => {
    if (status === 'shortlisted' || status === 'accepted') {
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 font-extrabold text-[9px] px-3.5 py-1.5 rounded-full border-none shadow-sm tracking-wider uppercase">SHORTLISTED</Badge>;
    }
    if (status === 'notshortlisted' || status === 'not_shortlisted' || status === 'rejected') {
      return <Badge variant="outline" className="bg-red-50 text-red-600 font-extrabold text-[9px] px-3.5 py-1.5 rounded-full border-none shadow-sm tracking-wider uppercase">NOT SHORTLISTED</Badge>;
    }
    if (status === 'selected_for_interview' || status === 'interview') {
      return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 font-extrabold text-[9px] px-3.5 py-1.5 rounded-full border-none shadow-sm tracking-wider uppercase">SELECTED FOR INTERVIEW</Badge>;
    }
    if (status === 'resume_viewed') {
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 font-extrabold text-[9px] px-3.5 py-1.5 rounded-full border-none shadow-sm tracking-wider uppercase">RESUME VIEWED</Badge>;
    }
    return <Badge variant="outline" className="bg-blue-50/70 text-blue-600 font-extrabold text-[9px] px-3.5 py-1.5 rounded-full border-none shadow-sm tracking-wider uppercase">IN REVIEW</Badge>;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Container */}
      <div className="flex flex-row items-center justify-between flex-wrap gap-4 border-b border-slate-50 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Applications Oversight</h1>
          <p className="text-slate-400 text-sm font-semibold mt-1">Global search across candidate applications across all recruiters</p>
        </div>
        <div className="flex items-center gap-3">
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetAllFilters}
              className="text-xs font-bold text-slate-600 border-slate-200 rounded-xl hover:bg-slate-50 h-9"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              Reset ({activeFilterCount})
            </Button>
          )}
          <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 text-xs font-extrabold px-3.5 py-1.5 rounded-full shadow-sm">
            {counts.all.toLocaleString()} ALL APPLICANTS
          </Badge>
        </div>
      </div>

      {/* Tabs list */}
      <div className="border-b border-slate-100 flex items-center overflow-x-auto gap-2 pb-1">
        {[
          { value: 'all', label: 'All Applications', count: counts.all },
          { value: 'applied', label: 'In Review', count: counts.applied },
          { value: 'shortlisted', label: 'Shortlisted', count: counts.shortlisted },
          { value: 'notshortlisted', label: 'Not Shortlisted', count: counts.notshortlisted },
          { value: 'selected_for_interview', label: 'Selected for Interview', count: counts.selected_for_interview },
          { value: 'resume_viewed', label: 'Resume Viewed', count: counts.resume_viewed }
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setCurrentPage(1); }}
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

      {/* Toolbar & Filters */}
      <div className="bg-white border border-slate-100/80 p-4 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-row items-center justify-between flex-wrap gap-3">
          {/* Left: Search input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by candidate name, job, recruiter, or ID"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
              className="w-full bg-[#f4f5f7] border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 transition-all shadow-inner"
            />
          </div>

          {/* Search Button */}
          <Button
            onClick={handleSearchSubmit}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 px-5 shadow-sm flex items-center gap-2 shrink-0 text-xs"
          >
            <Search className="h-4 w-4" />
            <span>Search Applications</span>
          </Button>

          {/* Right: Dropdowns & Filter Toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="appearance-none bg-white border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-slate-600 shadow-sm focus:outline-none focus:border-slate-300 h-10"
              >
                <option value="all">All Status</option>
                <option value="applied">In Review (Applied)</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="notshortlisted">Not Shortlisted</option>
                <option value="selected_for_interview">Selected for Interview</option>
                <option value="resume_viewed">Resume Viewed</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Time / Days Dropdown (Admin default: All time) */}
            <div className="relative">
              <select
                value={timeFilter}
                onChange={(e) => { setTimeFilter(e.target.value); setCurrentPage(1); }}
                className="appearance-none bg-white border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-slate-600 shadow-sm focus:outline-none focus:border-slate-300 h-10"
              >
                <option value="all">All Time (No Filter)</option>
                <option value="15">Last 15 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="week">Last 7 Days</option>
                <option value="day">Last 24 Hours</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "text-xs font-bold rounded-xl h-10 px-4 transition-all border-slate-200",
                showFilters ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? 'Hide Candidate Filters' : 'Candidate Filters (10)'}
            </Button>
          </div>
        </div>

        {/* Expandable Multi-Criteria Filters Panel */}
        {showFilters && (
          <div className="pt-4 border-t border-slate-100 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 text-left">
            {/* 1. Job Role (Multi-Select) */}
            <MultiSelectFilter
              label="Job Role"
              options={jobRolesList}
              selectedValues={jobRoleFilters}
              onChange={setJobRoleFilters}
            />

            {/* 2. Experience */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Experience</label>
              <div className="relative">
                <select
                  value={expFilter}
                  onChange={(e) => setExpFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50/70 border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500 h-9"
                >
                  <option value="all">All Experience</option>
                  <option value="fresher">Fresher (0 Yrs)</option>
                  <option value="1-3">1 - 3 Years</option>
                  <option value="3-5">3 - 5 Years</option>
                  <option value="5+">5+ Years</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 3. Industry (Multi-Select) */}
            <MultiSelectFilter
              label="Industry"
              options={industriesList}
              selectedValues={industryFilters}
              onChange={setIndustryFilters}
            />

            {/* 4. Department (Multi-Select) */}
            <MultiSelectFilter
              label="Department"
              options={departmentsList}
              selectedValues={departmentFilters}
              onChange={setDepartmentFilters}
            />

            {/* 5. Skills (Multi-Select) */}
            <MultiSelectFilter
              label="Skills"
              options={skillsList}
              selectedValues={skillFilters}
              onChange={setSkillFilters}
            />

            {/* 6. Qualification (Multi-Select) */}
            <MultiSelectFilter
              label="Qualification"
              options={qualList}
              selectedValues={qualFilters}
              onChange={setQualFilters}
            />

            {/* 7. Gender */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Gender</label>
              <div className="relative">
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50/70 border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500 h-9"
                >
                  <option value="all">Any Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 8. Age Range */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Age Range</label>
              <div className="relative">
                <select
                  value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50/70 border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500 h-9"
                >
                  <option value="all">Any Age</option>
                  <option value="18-25">18 - 25 Years</option>
                  <option value="26-35">26 - 35 Years</option>
                  <option value="36+">36+ Years</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 9. Languages (Multi-Select) */}
            <MultiSelectFilter
              label="Languages"
              options={languagesList}
              selectedValues={langFilters}
              onChange={setLangFilters}
            />

            {/* 10. Assets (Multi-Select) */}
            <MultiSelectFilter
              label="Assets"
              options={assetsList}
              selectedValues={assetFilters}
              onChange={setAssetFilters}
            />
          </div>
        )}
      </div>

      {/* Applications Data Table */}
      <Card className="border border-slate-100 rounded-2xl shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">CANDIDATE</th>
                <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">APPLIED JOB</th>
                <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">RECRUITER / COMPANY</th>
                <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">DATE</th>
                <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">LOCATION</th>
                <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4 text-center">STATUS</th>
                <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedApps.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div 
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => handleOpenCandidateProfile(app)}
                      title="Click to view candidate profile"
                    >
                      <Avatar className="h-10 w-10 border border-slate-100 group-hover:border-indigo-400 transition-all shadow-sm">
                        <AvatarImage src={app.workerAvatar} alt={app.workerName} />
                        <AvatarFallback className="text-xs bg-indigo-50 text-indigo-600 font-bold group-hover:bg-indigo-100">
                          {getInitials(app.workerName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-800 text-sm leading-tight group-hover:text-indigo-600 transition-colors underline-offset-2 group-hover:underline">
                          {app.workerName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold mt-0.5">{app.workerHeadline || 'Candidate Profile'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-700">{app.job.title}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs font-semibold">{app.job.recruiterName || app.job.companyName || 'SCN Recruiter'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-500">{formatDate(app.appliedAt)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-700">{app.workerCity || 'Location not specified'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {renderStatusBadge(app.status)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Status & Profile</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenCandidateProfile(app)}>
                          <Eye className="mr-2 h-4 w-4 text-indigo-500" /> View Candidate Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedApp(app); setIsDetailsOpen(true); }}>
                          <FileText className="mr-2 h-4 w-4 text-slate-400" /> View Application
                        </DropdownMenuItem>
                        {app.resumeUrl && (
                          <DropdownMenuItem asChild>
                            <a href={app.resumeUrl} target="_blank" rel="noreferrer">
                              <Download className="mr-2 h-4 w-4 text-slate-400" /> Download Resume
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => updateStatus(app.id, 'shortlisted')}>
                          <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Shortlist
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(app.id, 'notshortlisted')} className="text-red-600 focus:text-red-700">
                          <XCircle className="mr-2 h-4 w-4" /> Not Shortlist
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(app.id, 'selected_for_interview')}>
                          <UserCheck className="mr-2 h-4 w-4 text-indigo-500" /> Selected for Interview
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {paginatedApps.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12">
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

      {/* Candidate Profile Drawer */}
      <CandidateProfileDrawer
        worker={workerProfile}
        open={isWorkerSheetOpen}
        onOpenChange={setIsWorkerSheetOpen}
      />

      {/* Application Detail Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl bg-white border border-slate-100 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">Application Overview</DialogTitle>
          </DialogHeader>
          
          {selectedApp && (
            <div className="space-y-6 mt-4">
              {/* Profile overview card */}
              <div 
                className="flex items-center gap-4 p-4 bg-slate-50/50 border border-slate-100 rounded-xl text-left cursor-pointer hover:border-indigo-200 transition-all group"
                onClick={() => { setIsDetailsOpen(false); handleOpenCandidateProfile(selectedApp); }}
              >
                <Avatar className="h-16 w-16 border-2 border-indigo-100 shadow-sm">
                  <AvatarImage src={selectedApp.workerAvatar} alt={selectedApp.workerName} />
                  <AvatarFallback className="text-lg font-bold bg-indigo-50 text-indigo-600">{getInitials(selectedApp.workerName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-base font-extrabold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{selectedApp.workerName}</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">{selectedApp.workerHeadline || 'Candidate Profile'}</p>
                  <p className="text-xs text-slate-400 font-semibold mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400 inline" /> {selectedApp.workerCity || 'Location not specified'} • {selectedApp.workerExperienceYears} Years Experience
                  </p>
                </div>
                {renderStatusBadge(selectedApp.status)}
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
                  onClick={() => updateStatus(selectedApp.id, 'shortlisted')}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50/50 font-bold rounded-lg"
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-600" /> Shortlist
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => updateStatus(selectedApp.id, 'notshortlisted')}
                  className="border-red-200 text-red-600 hover:bg-red-50/50 font-bold rounded-lg"
                >
                  <XCircle className="mr-1.5 h-4 w-4 text-red-600" /> Not Shortlist
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => updateStatus(selectedApp.id, 'selected_for_interview')}
                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-50/50 font-bold rounded-lg"
                >
                  <UserCheck className="mr-1.5 h-4 w-4 text-indigo-600" /> Selected for Interview
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
                          {event.label === 'applied' ? 'Applied (In Review)' : event.label}
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
