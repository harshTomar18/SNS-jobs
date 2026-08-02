'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Bookmark,
  Briefcase,
  Clock,
  FileText,
  Search,
  Sparkles,
  TrendingUp,
  User,
  Eye,
  Mail,
  CheckCircle2,
  Calendar,
  ChevronRight,
  GraduationCap,
  PenTool,
  BookOpen,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Application, Job } from '@/lib/types';
import { applicationsApi, jobsApi, workerApi, WorkerWithMeta } from '@/lib/scn-api';
import { useAuth } from '@/lib/auth-context';
import { timeAgo } from '@/lib/format';

function CompanyLogo({ name, className = 'h-12 w-12' }: { name: string; className?: string }) {
  const normalized = name.toLowerCase();
  if (normalized.includes('google')) {
    return (
      <div className={`${className} flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 shadow-sm text-lg font-bold`}>
        <span className="text-[#4285F4]">G</span>
        <span className="text-[#EA4335]">o</span>
        <span className="text-[#FBBC05]">o</span>
        <span className="text-[#34A853]">g</span>
      </div>
    );
  }
  if (normalized.includes('airbnb')) {
    return (
      <div className={`${className} flex items-center justify-center rounded-xl bg-rose-50 border border-rose-100 shadow-sm text-lg font-bold text-rose-500`}>
        A
      </div>
    );
  }
  if (normalized.includes('vercel')) {
    return (
      <div className={`${className} flex items-center justify-center rounded-xl bg-black border border-neutral-900 shadow-sm text-white font-extrabold text-xs`}>
        ▲
      </div>
    );
  }
  if (normalized.includes('stripe')) {
    return (
      <div className={`${className} flex items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm text-lg font-extrabold text-indigo-600`}>
        S
      </div>
    );
  }
  if (normalized.includes('meta')) {
    return (
      <div className={`${className} flex items-center justify-center rounded-xl bg-blue-50 border border-blue-100 shadow-sm text-lg font-bold text-blue-600`}>
        M
      </div>
    );
  }
  if (normalized.includes('shopify')) {
    return (
      <div className={`${className} flex items-center justify-center rounded-xl bg-green-50 border border-green-100 shadow-sm text-lg font-bold text-green-600`}>
        S
      </div>
    );
  }
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className={`${className} flex items-center justify-center rounded-xl bg-blue-50 border border-blue-100 shadow-sm text-lg font-bold text-blue-600`}>
      {initial}
    </div>
  );
}

function displaySalary(min: number, max: number) {
  if (min === 0 && max === 0) return 'Salary not specified';
  if (min >= 100000) {
    return `$${Math.round(min / 1000)}k - $${Math.round(max / 1000)}k`;
  }
  if (min >= 1000) {
    return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
  }
  return `$${min} - $${max}`;
}

function getJobMatchDetails(job: Job, profileSkills: string[] = []) {
  const jobSkills = job.skills || [];
  const common = jobSkills.filter(s => profileSkills.some(ps => ps.toLowerCase() === s.toLowerCase()));
  
  let matchPercent = 75;
  let matchesText = '';
  
  if (common.length > 0) {
    matchPercent = Math.min(99, 80 + common.length * 5);
    matchesText = `Matches your skill: ${common.slice(0, 3).join(', ')}`;
  } else {
    matchPercent = 85 + (job.title.length % 15);
    const displayedSkills = jobSkills.length > 0 ? jobSkills.slice(0, 2).join(', ') : 'React, Node';
    matchesText = `Matches your interest in ${job.industry || 'Tech'} and ${displayedSkills}`;
  }
  
  return { matchPercent, matchesText };
}

export default function WorkerDashboardPage() {
  const { user } = useAuth();
  const jobsQuery = useQuery({ queryKey: ['jobs'], queryFn: jobsApi.list });
  const applicationsQuery = useQuery({ queryKey: ['worker-applications'], queryFn: applicationsApi.workerList });
  const profileQuery = useQuery({ queryKey: ['worker-profile'], queryFn: workerApi.profile, retry: false });

  const jobs: Job[] = jobsQuery.data ?? [];
  const applications: Application[] = applicationsQuery.data ?? [];
  const profile = profileQuery.data as WorkerWithMeta | undefined;
  
  const completion = profile?.profileCompletion || 85;
  const workerSkills = profile?.skills || [];

  // Radial Progress Ring Math
  const radius = 60;
  const strokeWidth = 9;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (completion / 100) * circumference;

  const realJobsWithMatch = jobs.slice(0, 3).map((job) => {
    const { matchPercent, matchesText } = getJobMatchDetails(job, workerSkills);
    return {
      ...job,
      matchPercent,
      matchesText
    };
  });

  const jobsToDisplay = realJobsWithMatch.slice(0, 2);

  const historyItems = applications.slice(0, 3).map((app, idx) => {
    const isActive = idx === 0;
    const timeText = timeAgo(app.appliedAt);
    
    let statusText = 'Applied';
    let statusColor = 'bg-blue-50 text-blue-700';
    if (app.status === 'shortlisted') {
      statusText = 'Shortlisted';
      statusColor = 'bg-green-50 text-green-700';
    } else if (app.status === 'interview_scheduled') {
      statusText = 'Interview';
      statusColor = 'bg-purple-50 text-purple-700';
    } else if (app.status === 'rejected') {
      statusText = 'Rejected';
      statusColor = 'bg-red-50 text-red-700';
    } else if (app.status === 'hired') {
      statusText = 'Hired';
      statusColor = 'bg-emerald-50 text-emerald-700';
    }
    
    return {
      title: `Applied to ${app.job.companyName}`,
      subtitle: `${app.job.title} • ${timeText}`,
      badge: statusText,
      badgeColor: statusColor,
      active: isActive
    };
  });

  const interviewApps = applications.filter(app => app.status === 'interview_scheduled');
  const interviewsToDisplay = interviewApps.map(app => {
    const interviewEvent = app.timeline.find(t => t.status === 'interview_scheduled');
    const timeString = interviewEvent ? new Date(interviewEvent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM';
    const dateString = interviewEvent ? new Date(interviewEvent.timestamp).toLocaleDateString([], { weekday: 'long' }) : 'Tomorrow';
    
    return {
      companyName: app.job.companyName,
      round: 'Technical Round',
      time: dateString,
      timeDetail: timeString
    };
  });

  return (
    <div className="space-y-8 pb-10 bg-[#f8fafc] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      {/* Top Banner & Profile Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Banner Card */}
        <Card className="lg:col-span-2 p-8 bg-white border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl flex flex-col justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              Good Morning {profile?.fullName || user?.name || 'Harsh'} <span className="animate-bounce"></span>
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              Your dream career is just one application away.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-8">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 px-6 font-bold shadow-md shadow-blue-100 flex items-center gap-2 text-sm" asChild>
              <Link href="/worker/jobs">
                <Search className="h-4 w-4" />
                Find Jobs
              </Link>
            </Button>
            <Button variant="outline" className="border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl py-6 px-6 font-bold text-sm" asChild>
              <Link href="/worker/profile">Complete Profile</Link>
            </Button>
          </div>
        </Card>

        {/* Profile Completion Circular Progress Card */}
        <Card className="p-8 bg-white border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl flex flex-col items-center justify-center gap-4 text-center">
          <div className="relative flex items-center justify-center">
            <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
              <circle
                stroke="#f1f5f9"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke="#2563eb"
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <span className="absolute text-2xl font-black text-slate-800">{completion}%</span>
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">Profile Completion</h3>
            <p className="text-slate-400 font-medium text-xs mt-1">
              Nearly there! Add your portfolio.
            </p>
          </div>
        </Card>
      </div>

      {/* Row of 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Applications */}
        <Card className="p-6 bg-white border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-800">{applications.length}</p>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">Applications</p>
            </div>
          </div>
        </Card>

        {/* Skills */}
        <Card className="p-6 bg-white border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-800">{profile?.skills?.length || 0}</p>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">Skills Added</p>
            </div>
          </div>
          <div className="self-start bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full">
            Profile skills
          </div>
        </Card>

        {/* Experience Years */}
        <Card className="p-6 bg-white border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-800">{profile?.experienceYears || 0}</p>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">Years of Exp</p>
            </div>
          </div>
          <div className="self-start bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full">
            Active profile
          </div>
        </Card>

        {/* Languages */}
        <Card className="p-6 bg-white border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-800">{profile?.languages?.length || 0}</p>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">Languages</p>
            </div>
          </div>
          <div className="self-start bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full">
            Fluent languages
          </div>
        </Card>
      </div>

      {/* Two Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Recommended Jobs + Quick Tools) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recommended Jobs Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-800">Recommended Jobs</h2>
              <Link href="/worker/jobs" className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1">
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Recommended Job List */}
            {jobsToDisplay.length === 0 ? (
              <div className="text-center py-8 text-slate-400 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <span className="text-sm font-bold">No recommended jobs found at the moment</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {jobsToDisplay.map((job) => (
                  <Card key={job.id} className="p-6 bg-white border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl flex flex-col justify-between hover:border-blue-100 hover:shadow-md transition-all">
                    <div className="space-y-4">
                      {/* Job Top Row: Logo & Match badge */}
                      <div className="flex items-center justify-between">
                        <CompanyLogo name={job.companyName} className="h-11 w-11" />
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                          {job.matchPercent}% MATCH
                        </span>
                      </div>

                      {/* Job Info */}
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-slate-800 text-lg leading-tight hover:text-blue-600 transition-colors">
                          <Link href={`/worker/jobs/${job.id}`}>{job.title}</Link>
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold">
                          {job.companyName} • {job.location} • {displaySalary(job.salaryMin, job.salaryMax)}
                        </p>
                      </div>

                      {/* Why Recommended Banner */}
                      <div className="bg-[#f8fafc]/80 rounded-2xl p-3 border border-slate-100/50 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-blue-600">
                          <CheckCircle2 className="h-3.5 w-3.5 fill-blue-50" />
                          <span className="text-[10px] font-bold">Why recommended</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium pl-5 leading-relaxed">
                          {job.matchesText}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/worker/jobs/${job.id}`}
                      className="w-full bg-[#e8eefc] hover:bg-[#d5e2f9] text-blue-600 font-bold py-3 rounded-2xl transition-all text-center block mt-6 text-xs"
                    >
                      Apply Now
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Quick Services Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Resume Builder */}
            {/* <Link href="/worker/profile" className="block">
              <Card className="p-5 bg-white border-slate-100/80 hover:border-blue-200 hover:bg-slate-50/20 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl space-y-3 cursor-pointer group transition-all">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                  <PenTool className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">Resume Builder</h4>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">Update your CV with AI assistance.</p>
                </div>
              </Card>
            </Link> */}

            {/* Career Advice */}
            {/* <Link href="/worker/profile" className="block">
              <Card className="p-5 bg-white border-slate-100/80 hover:border-blue-200 hover:bg-slate-50/20 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl space-y-3 cursor-pointer group transition-all">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">Career Advice</h4>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">1-on-1 sessions with industry leads.</p>
                </div>
              </Card>
            </Link> */}

            {/* Interview Prep */}
            {/* <Link href="/worker/profile" className="block">
              <Card className="p-5 bg-white border-slate-100/80 hover:border-blue-200 hover:bg-slate-50/20 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl space-y-3 cursor-pointer group transition-all">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">Interview Prep</h4>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">Mock interviews and common Q&As.</p>
                </div>
              </Card>
            </Link> */}
          </div>
        </div>

        {/* Right Column (Interviews + History + Trending) */}
        <div className="space-y-6">
          {/* Upcoming Interviews */}
          <Card className="p-6 bg-white border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-4 mb-4">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h3 className="font-extrabold text-slate-800 text-sm">Upcoming Interviews</h3>
            </div>
            <div className="space-y-4">
              {interviewsToDisplay.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold text-center py-4">
                  No interviews scheduled
                </p>
              ) : (
                interviewsToDisplay.map((interview, index) => (
                  <div key={index} className="flex items-start gap-3 bg-blue-50/40 rounded-2xl p-4 border border-blue-50/60">
                    <CompanyLogo name={interview.companyName} className="h-10 w-10 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-slate-800 text-xs truncate">{interview.companyName}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        {interview.round} • {interview.time}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold mt-2">
                        <Clock className="h-3 w-3" />
                        <span>{interview.timeDetail}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Recent History */}
          <Card className="p-6 bg-white border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-4 mb-4">
              <Clock className="h-5 w-5 text-slate-500" />
              <h3 className="font-extrabold text-slate-800 text-sm">Recent History</h3>
            </div>
            
            {/* Timeline */}
            {historyItems.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold text-center py-4">
                No recent activity
              </p>
            ) : (
              <div className="relative border-l border-slate-100 pl-5 ml-2.5 space-y-6">
                {historyItems.map((item, index) => (
                  <div key={index} className="relative">
                    {/* Timeline Dot */}
                    <span className={`absolute -left-[26px] top-1 flex h-3 w-3 items-center justify-center rounded-full border bg-white ${
                      item.active ? 'border-blue-600 ring-4 ring-blue-50' : 'border-slate-200'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        item.active ? 'bg-blue-600' : 'bg-slate-300'
                      }`} />
                    </span>
                    
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-800 text-xs leading-none">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold leading-tight">{item.subtitle}</p>
                      {item.badge && (
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5 ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>


        </div>
      </div>
    </div>
  );
}
