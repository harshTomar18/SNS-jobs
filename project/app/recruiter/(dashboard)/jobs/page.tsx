'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Briefcase, 
  MoreVertical, 
  Trash2, 
  Eye, 
  Users, 
  Clock, 
  MapPin, 
  Rocket, 
  Archive, 
  Download,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Search,
  Settings
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { JobWithMeta, jobsApi } from '@/lib/scn-api';
import { timeAgo, formatSalary } from '@/lib/format';
import { getApiErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function RecruiterJobsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const jobsQuery = useQuery({ queryKey: ['recruiter-jobs'], queryFn: jobsApi.list });
  const jobs: JobWithMeta[] = jobsQuery.data ?? [];

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: JobWithMeta['status'] }) => jobsApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Job status updated');
      queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update job')),
  });

  const deleteMutation = useMutation({
    mutationFn: jobsApi.remove,
    onSuccess: () => {
      toast.success('Job deleted');
      queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Only draft jobs can be deleted')),
  });

  // Export to CSV function
  const handleExportCSV = () => {
    if (jobs.length === 0) {
      toast.error('No jobs available to export.');
      return;
    }
    const headers = ['Job Title', 'Location', 'Salary Min', 'Salary Max', 'Applications', 'Posted At', 'Status'];
    const rows = jobs.map(j => [
      `"${j.title.replace(/"/g, '""')}"`,
      `"${j.location.replace(/"/g, '""')}"`,
      j.salaryMin,
      j.salaryMax,
      j.applicationsCount,
      j.postedAt ? new Date(j.postedAt).toLocaleDateString() : 'N/A',
      j.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "job_management_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded successfully!");
  };

  // Filter jobs based on selected tab and search query
  const filteredJobs = jobs.filter((job) => {
    const matchesTab = activeTab === 'all' || job.status === activeTab;
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.industry.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const counts = {
    all: jobs.length,
    draft: jobs.filter((job) => job.status === 'draft').length,
    published: jobs.filter((job) => job.status === 'published').length,
    closed: jobs.filter((job) => job.status === 'closed').length,
  };

  // Pagination calculation
  const totalItems = filteredJobs.length;
  const totalPages = Math.max(Math.ceil(totalItems / itemsPerPage), 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  const formatWage = (min: number, max: number) => {
    const formatNum = (num: number) => {
      if (num >= 1000) {
        return `$${Math.round(num / 1000)}k`;
      }
      return `$${num}`;
    };
    if (min === max) return formatNum(min);
    return `${formatNum(min)} - ${formatNum(max)}`;
  };

  // Total dynamic application count
  const totalApplications = jobs.reduce((sum, job) => sum + (job.applicationsCount || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Container */}
      <div className="flex flex-row items-center justify-between flex-wrap gap-4 border-b border-slate-50 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Job Management</h1>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 font-semibold">
            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
              {counts.published} Active Jobs
            </span>
            <span>•</span>
            <span>Updated 5m ago</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleExportCSV} 
            className="border-slate-200 hover:bg-slate-50 hover:text-slate-700 text-slate-600 font-extrabold rounded-xl px-4 py-2.5 text-xs h-auto flex items-center gap-1.5 shadow-sm"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-5 py-3 text-xs shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all h-auto">
            <Link href="/recruiter/jobs/new">
              <span className="font-extrabold mr-1 text-sm">+</span> Create Job
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs and Toolbar Row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white border border-slate-100/80 p-3 rounded-2xl shadow-sm">
        {/* Custom styled tabs list */}
        <div className="flex items-center border-b xl:border-b-0 border-slate-100 pb-2 xl:pb-0 overflow-x-auto gap-2">
          {[
            { value: 'all', label: 'All Jobs', count: counts.all },
            { value: 'published', label: 'Published', count: counts.published },
            { value: 'draft', label: 'Drafts', count: counts.draft },
            { value: 'closed', label: 'Closed', count: counts.closed }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => { setActiveTab(tab.value); setCurrentPage(1); }}
              className={cn(
                "px-4 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap",
                activeTab === tab.value 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Toolbar Search / Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Field */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search jobs, locations..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-[#f4f5f7] border border-transparent rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 transition-all shadow-inner"
            />
          </div>

          {/* Filters Toggles */}
          <Button variant="outline" className="border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-xl px-3 py-2 text-xs h-auto flex items-center gap-1.5 shadow-sm">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>

          {/* Settings Slider Trigger */}
          <Button variant="outline" size="icon" className="border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl h-9 w-9 shadow-sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Jobs Data Table Card */}
      <Card className="border border-slate-100 rounded-2xl shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">JOB DETAILS</th>
                <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">LOCATION</th>
                <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">SALARY</th>
                <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">APPLICATIONS</th>
                <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">POSTED</th>
                <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">STATUS</th>
                <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-slate-800 text-sm leading-tight hover:text-indigo-600 transition-colors">
                        <Link href={`/recruiter/jobs/${job.id}`}>{job.title}</Link>
                      </span>
                      <span className="text-[11px] text-slate-400 font-semibold capitalize mt-1">
                        {job.jobType.replace('-', ' ')} • {job.industry}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-slate-700 leading-tight">{job.location}</span>
                      <span className="text-[10px] text-slate-400 font-semibold capitalize mt-0.5">({job.workType})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-700">
                      {formatWage(job.salaryMin, job.salaryMax)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {job.applicationsCount > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{job.applicationsCount}</span>
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {[1, 2, 3].slice(0, Math.min(job.applicationsCount, 3)).map((_, i) => (
                            <Avatar key={i} className="inline-block h-5 w-5 rounded-full ring-2 ring-white">
                              <AvatarFallback className="text-[7px] bg-slate-100 text-slate-500 font-extrabold">C</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold italic">No applications yet</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-500">
                      {job.status === 'draft' ? '--' : new Date(job.postedAt).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={cn(
                      "capitalize font-extrabold text-[9px] px-3 py-1 rounded-full border-none shadow-sm flex items-center gap-1.5 w-fit",
                      job.status === 'published' && "bg-green-50 text-green-600",
                      job.status === 'draft' && "bg-amber-50 text-amber-600",
                      job.status === 'closed' && "bg-red-50 text-red-600"
                    )}>
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        job.status === 'published' && "bg-green-500",
                        job.status === 'draft' && "bg-amber-500",
                        job.status === 'closed' && "bg-red-500"
                      )} />
                      {job.status === 'published' ? 'ACTIVE' : job.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/recruiter/jobs/${job.id}`}><Eye className="mr-2 h-4 w-4" />View Job</Link>
                        </DropdownMenuItem>
                        {job.status === 'draft' && (
                          <DropdownMenuItem onClick={() => statusMutation.mutate({ id: job.id, status: 'published' })}>
                            <Rocket className="mr-2 h-4 w-4" />Publish
                          </DropdownMenuItem>
                        )}
                        {job.status === 'published' && (
                          <DropdownMenuItem onClick={() => statusMutation.mutate({ id: job.id, status: 'closed' })}>
                            <Archive className="mr-2 h-4 w-4" />Close
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(job.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />Delete Draft
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {paginatedJobs.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Briefcase className="h-12 w-12 text-slate-200 mb-3" />
                      <span className="text-base font-bold text-slate-700">No jobs found</span>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">No jobs matches the search criteria or category filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {filteredJobs.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              Showing {startIndex + 1} to {endIndex} of {totalItems} results
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
              {Array.from({ length: totalPages }).map((_, idx) => (
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
              ))}
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

      {/* Bottom Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Card 1: AVG Time to Hire */}
        <Card className="p-5 border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between bg-white text-left">
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">AVG TIME TO HIRE</span>
            <p className="text-2xl font-extrabold text-slate-800 mt-2">18.5 Days</p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] font-extrabold text-red-500">
            <span className="bg-red-50 px-2 py-0.5 rounded-full">↓ 2.4%</span>
            <span className="text-slate-400 font-semibold">from last month</span>
          </div>
        </Card>

        {/* Card 2: Active Applications */}
        <Card className="p-5 border border-slate-100 rounded-2xl shadow-sm flex justify-between items-center bg-white text-left">
          <div className="flex flex-col justify-between h-full">
            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">ACTIVE APPLICATIONS</span>
              <p className="text-2xl font-extrabold text-slate-800 mt-2">{totalApplications}</p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] font-extrabold text-indigo-600">
              <span className="bg-indigo-50 px-2 py-0.5 rounded-full">↑ 15%</span>
              <span className="text-slate-400 font-semibold">increase</span>
            </div>
          </div>
          <div className="bg-orange-50 h-10 w-10 flex items-center justify-center rounded-xl">
            <Users className="h-5 w-5 text-orange-500" />
          </div>
        </Card>

        {/* Card 3: Budget Utilization */}
        <Card className="p-5 border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between bg-white text-left">
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">BUDGET UTILIZATION</span>
            <p className="text-2xl font-extrabold text-slate-800 mt-2">74%</p>
          </div>
          <div className="mt-6 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: '74%' }} />
          </div>
        </Card>
      </div>
    </div>
  );
}
