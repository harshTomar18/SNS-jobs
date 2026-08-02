'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowRight, 
  Briefcase, 
  Calendar, 
  FileText, 
  Plus, 
  UserCheck, 
  Search, 
  Users, 
  CheckCircle2, 
  XCircle, 
  MoreVertical,
  ChevronDown
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { applicationsApi, jobsApi, JobWithMeta } from '@/lib/scn-api';
import { Application } from '@/lib/types';
import { getInitials } from '@/lib/format';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

export default function RecruiterDashboardPage() {
  const { user } = useAuth();
  const jobsQuery = useQuery({ queryKey: ['recruiter-jobs'], queryFn: jobsApi.list });
  const applicationsQuery = useQuery({ queryKey: ['recruiter-applications'], queryFn: applicationsApi.recruiterList });
  
  const jobs: JobWithMeta[] = jobsQuery.data ?? [];
  const applications: Application[] = applicationsQuery.data ?? [];

  // Calculate dynamic metrics
  const activeJobsCount = jobs.filter(j => j.status === 'published' || j.backendStatus === 'active').length;
  const totalApplicationsCount = applications.length;
  const interviewsCount = applications.filter(a => a.status === 'interview_scheduled').length;
  const shortlistedCount = applications.filter(a => a.status === 'shortlisted').length;
  const hiredCount = applications.filter(a => a.status === 'hired').length;

  const firstName = user?.name ? user.name.split(' ')[0] : 'Sarah';

  // Conversion calculations
  const shortlistedConversion = totalApplicationsCount > 0 ? (shortlistedCount / totalApplicationsCount) * 100 : 0;
  const interviewsConversion = shortlistedCount > 0 ? (interviewsCount / shortlistedCount) * 100 : 0;
  const hiredConversion = interviewsCount > 0 ? (hiredCount / interviewsCount) * 100 : 0;

  // Recent jobs (slice top 3)
  const recentJobs = jobs.slice(0, 3);

  // Recent applications (slice top 3)
  const recentApplications = applications.slice(0, 3);

  // Scheduled Interviews
  const interviewApplications = applications.filter(a => a.status === 'interview_scheduled');
  
  const displayInterviews = interviewApplications.map(app => {
        const event = app.timeline.find(e => e.status === 'interview_scheduled');
        const timeStr = event 
          ? new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          : "11:00 AM";
        return {
          time: timeStr,
          candidateName: app.workerName,
          details: event?.description || "Technical Round • 45m"
        };
      });

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

  const splitTime = (timeString: string) => {
    const parts = timeString.split(' ');
    return {
      time: parts[0],
      ampm: parts[1] || ''
    };
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome & Controls Row */}
      <div className="flex flex-row items-center justify-between flex-wrap gap-6">
        <div className="flex flex-col text-left">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Good morning, {firstName}
          </h1>
          {/* <span className="text-3xl mt-1.5 leading-none">👋</span> */}
          <p className="text-slate-400 text-sm font-semibold mt-2">Here's what's happening with your hiring pipeline today.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Calendar Picker Card */}
          <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl px-5 py-3 shadow-sm select-none">
            <Calendar className="h-5 w-5 text-slate-400" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-slate-400 font-bold leading-none uppercase">Last</span>
              <span className="text-slate-700 text-sm font-extrabold leading-tight mt-0.5">30 days</span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 ml-2" />
          </div>

          {/* Find Workers link */}
          <Link 
            href="/recruiter/workers" 
            className="flex items-center justify-center gap-2 border-2 border-dashed border-indigo-200 bg-indigo-50/10 hover:bg-indigo-50/30 text-indigo-600 font-bold rounded-2xl px-5 py-3 text-xs shadow-sm transition-all"
          >
            Find Workers
          </Link>

          {/* Post a Job button */}
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl px-6 py-3.5 text-xs shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all h-auto">
            <Link href="/recruiter/jobs/new">
              <span className="font-bold mr-1 text-sm">+</span> Post a Job
            </Link>
          </Button>
        </div>
      </div>

      {/* 5 Column Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {/* Card 1: Active Jobs */}
        <Card className="p-5 border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">ACTIVE JOBS</span>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-extrabold text-slate-800 leading-none">{activeJobsCount}</span>
          </div>
        </Card>

        {/* Card 2: Total Applications */}
        <Card className="p-5 border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">TOTAL APPLICATIONS</span>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-extrabold text-slate-800 leading-none">{totalApplicationsCount}</span>
          </div>
        </Card>

        {/* Card 3: Interviews */}
        <Card className="p-5 border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">INTERVIEWS</span>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-extrabold text-slate-800 leading-none">{interviewsCount}</span>
          </div>
        </Card>

        {/* Card 4: Shortlisted */}
        <Card className="p-5 border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">SHORTLISTED</span>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-extrabold text-slate-800 leading-none">{shortlistedCount}</span>
          </div>
        </Card>

        {/* Card 5: Hired */}
        <Card className="p-5 border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">HIRED</span>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-extrabold text-slate-800 leading-none">{hiredCount}</span>
          </div>
        </Card>
      </div>

      {/* Main Grid Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Application Pipeline & Recent Applications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Application Pipeline */}
          <Card className="p-6 border border-slate-100 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Application Pipeline</h3>
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                  Successful
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                  Remaining
                </span>
              </div>
            </div>

            <div className="space-y-5">
              {/* Funnel Applied */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Applied ({totalApplicationsCount})</span>
                  <span>100%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-8 overflow-hidden">
                  <div className="bg-indigo-700 h-full rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Funnel Shortlisted */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Shortlisted ({shortlistedCount})</span>
                  <span className="text-emerald-500 font-extrabold">{shortlistedConversion.toFixed(1)}% Conversion</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-8 overflow-hidden">
                  <div className="bg-indigo-50 h-full rounded-full" style={{ width: `${Math.max(shortlistedConversion, 8)}%` }} />
                </div>
              </div>

              {/* Funnel Interviews */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Interviews ({interviewsCount})</span>
                  <span className="text-emerald-500 font-extrabold">{interviewsConversion.toFixed(1)}% Conversion</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-8 overflow-hidden">
                  <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${Math.max(interviewsConversion, 8)}%` }} />
                </div>
              </div>

              {/* Funnel Hired */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Hired ({hiredCount})</span>
                  <span className="text-emerald-500 font-extrabold">{hiredConversion.toFixed(1)}% Conversion</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-8 overflow-hidden">
                  <div className="bg-indigo-300 h-full rounded-full" style={{ width: `${Math.max(hiredConversion, 8)}%` }} />
                </div>
              </div>
            </div>
          </Card>

          {/* Card: Recent Applications */}
          <Card className="p-6 border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Recent Applications</h3>
              <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-bold" asChild>
                <Link href="/recruiter/applications">View all</Link>
              </Button>
            </div>

            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-3">CANDIDATE</th>
                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-3">APPLIED FOR</th>
                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-3">EXPERIENCE</th>
                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-3">STATUS</th>
                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-3">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/30 transition-colors">
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
                            <span className="text-[11px] text-slate-400 font-semibold">{app.workerCity || 'Location not specified'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-700 leading-tight block">{app.job.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-500">
                          {app.workerExperienceYears !== undefined ? `${app.workerExperienceYears} years` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={cn(
                          "capitalize font-extrabold text-[9px] px-3 py-1 rounded-full border-none shadow-sm",
                          app.status === 'interview_scheduled' && "bg-blue-50 text-blue-600",
                          app.status === 'shortlisted' && "bg-purple-50 text-purple-600",
                          app.status === 'hired' && "bg-green-50 text-green-600",
                          app.status === 'applied' && "bg-slate-100 text-slate-500",
                          app.status === 'rejected' && "bg-red-50 text-red-600",
                          app.status === 'withdrawn' && "bg-slate-100 text-slate-400"
                        )}>
                          {app.status === 'interview_scheduled' ? 'INTERVIEW' : app.status}
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
                              <Link href="/recruiter/applications">View Details</Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {recentApplications.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <FileText className="h-10 w-10 text-slate-300 mb-2" />
                          <span className="text-sm font-bold">No applications yet</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Recent Jobs & Today's Interviews */}
        <div className="space-y-6">
          {/* Card: Recent Jobs */}
          <Card className="p-6 border border-slate-100 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Recent Jobs</h3>
              <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-bold" asChild>
                <Link href="/recruiter/jobs">Manage All</Link>
              </Button>
            </div>

            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div key={job.id} className="p-4 border border-slate-100 rounded-2xl hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-extrabold text-slate-800 truncate block max-w-[150px]">{job.title}</span>
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-extrabold px-2 py-0.5 rounded border-none shadow-sm capitalize",
                      job.status === 'published' ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {job.status === 'published' ? 'active' : 'draft'}
                    </Badge>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-400 mt-1">
                    {job.location} • {formatWage(job.salaryMin, job.salaryMax)}
                  </p>

                  <div className="flex items-center gap-2 mt-4">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {[1, 2, 3].slice(0, Math.min(job.applicationsCount, 3)).map((_, i) => (
                        <Avatar key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-white">
                          <AvatarFallback className="text-[8px] bg-slate-100 text-slate-500 font-extrabold">C</AvatarFallback>
                        </Avatar>
                      ))}
                      {job.applicationsCount > 3 && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[8px] font-extrabold text-slate-500 ring-2 ring-white">
                          +{job.applicationsCount - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-semibold">
                      {job.applicationsCount} Applications
                    </span>
                  </div>
                </div>
              ))}
              {recentJobs.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <span className="text-sm font-bold">No jobs posted yet</span>
                </div>
              )}
            </div>
          </Card>

          {/* Card: TODAY'S INTERVIEWS */}
          <Card className="p-6 border border-slate-100 rounded-2xl shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-6">TODAY'S INTERVIEWS</h3>
            
            <div className="space-y-4">
              {displayInterviews.map((interview, index) => {
                const timeInfo = splitTime(interview.time);
                return (
                  <div key={index} className="flex gap-4 items-center">
                    {/* Time Pill Box */}
                    <div className="bg-[#f4f5f7] p-2 flex flex-col items-center justify-center rounded-xl min-w-[70px] border border-slate-50">
                      <span className="text-xs font-extrabold text-slate-700 leading-none">{timeInfo.time}</span>
                      <span className="text-[9px] font-extrabold text-slate-400 mt-1 uppercase tracking-wider">{timeInfo.ampm}</span>
                    </div>

                    {/* Interview details */}
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-slate-800 leading-tight">{interview.candidateName}</span>
                      <span className="text-[11px] font-semibold text-slate-400 mt-0.5">{interview.details}</span>
                    </div>
                  </div>
                );
              })}
              {displayInterviews.length === 0 && (
                <div className="text-center py-4 text-slate-400">
                  <span className="text-sm font-bold">No interviews scheduled today</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
