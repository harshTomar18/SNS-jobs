'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Bookmark,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  MapPin,
  Share2,
  Users,
  ShieldAlert,
  ShieldCheck,
  Gift,
  Star,
  Heart,
  Monitor,
  Plane,
  ChevronRight,
  Sparkles,
  Banknote,
  Check,
  BadgeCheck,
  X,
  IndianRupee,
  Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { JobListSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/empty-state';
import { JobWithMeta, applicationsApi, jobsApi, workerApi, WorkerWithMeta } from '@/lib/scn-api';
import { formatSalary, timeAgo } from '@/lib/format';
import { getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Application } from '@/lib/types';

// Helper component for logos
function CompanyLogo({ name, className = 'h-16 w-16' }: { name: string; className?: string }) {
  const normalized = name.toLowerCase();
  if (normalized.includes('linear')) {
    return (
      <div className={`${className} flex items-center justify-center rounded-2xl bg-[#121214] border border-neutral-800 shadow-sm text-[#5E6AD2] font-black text-2xl`}>
        L
      </div>
    );
  }
  if (normalized.includes('google')) {
    return (
      <div className={`${className} flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 shadow-sm text-2xl font-bold`}>
        <span className="text-[#4285F4]">G</span>
        <span className="text-[#EA4335]">o</span>
        <span className="text-[#FBBC05]">o</span>
        <span className="text-[#34A853]">g</span>
      </div>
    );
  }
  if (normalized.includes('airbnb')) {
    return (
      <div className={`${className} flex items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 shadow-sm text-2xl font-bold text-rose-500`}>
        A
      </div>
    );
  }
  if (normalized.includes('vercel')) {
    return (
      <div className={`${className} flex items-center justify-center rounded-2xl bg-black border border-neutral-900 shadow-sm text-white font-extrabold text-lg`}>
        ▲
      </div>
    );
  }
  if (normalized.includes('stripe')) {
    return (
      <div className={`${className} flex items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm text-2xl font-extrabold text-indigo-600`}>
        S
      </div>
    );
  }
  if (normalized.includes('meta')) {
    return (
      <div className={`${className} flex items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 shadow-sm text-2xl font-bold text-blue-600`}>
        M
      </div>
    );
  }
  if (normalized.includes('shopify')) {
    return (
      <div className={`${className} flex items-center justify-center rounded-2xl bg-green-50 border border-green-100 shadow-sm text-2xl font-bold text-green-600`}>
        S
      </div>
    );
  }
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className={`${className} flex items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 shadow-sm text-2xl font-bold text-blue-600`}>
      {initial}
    </div>
  );
}

// Helper to format salary
function formatSalaryDisplay(job?: JobWithMeta) {
  if (!job) return 'Salary not specified';
  const min = job.salaryMin || (job as any).monthlyWageMin || (job as any).dailyWageMin || (job as any).yearlyWageMin || 0;
  const max = job.salaryMax || (job as any).monthlyWageMax || (job as any).dailyWageMax || (job as any).yearlyWageMax || 0;
  const period = String(job.wagePeriod || 'monthly').toLowerCase();
  
  if (min === 0 && max === 0) return 'Salary not specified';

  const suffix = period === 'daily' ? 'per day' : period.includes('annual') || period.includes('year') ? 'per annum' : 'per month';

  if (period.includes('annual') || period.includes('year')) {
    const minLacs = (min / 100000).toFixed(1).replace('.0', '');
    const maxLacs = (max / 100000).toFixed(1).replace('.0', '');
    if (min === max) return `₹${minLacs} Lakh ${suffix}`;
    return `₹${minLacs} Lakh - ₹${maxLacs} Lakh ${suffix}`;
  }

  if (min === max) return `₹${min.toLocaleString('en-IN')} ${suffix}`;
  return `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')} ${suffix}`;
}

function getJobMatchDetails(job: JobWithMeta, profileSkills: string[] = []) {
  const jobTitle = job?.title || '';
  const jobSkills = job?.skills || [];
  const common = jobSkills.filter(s => profileSkills.some(ps => ps.toLowerCase() === s.toLowerCase()));
  let matchPercent = 75;
  if (common.length > 0) {
    matchPercent = Math.min(99, 80 + common.length * 5);
  } else {
    matchPercent = 85 + (jobTitle.length % 15);
  }
  return { matchPercent };
}

interface JobDetailsViewProps {
  jobId: string;
  backUrl?: string;
  hrefPrefix?: string;
}

export function JobDetailsView({ jobId, backUrl = '/jobs', hrefPrefix = '/jobs' }: JobDetailsViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [saved, setSaved] = useState(false);

  const isRecruiter = user?.role === 'recruiter' || hrefPrefix.includes('/recruiter');

  // Queries
  const jobQuery = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.get(jobId),
  });
  const job = jobQuery.data as JobWithMeta | undefined;
  const { isLoading } = jobQuery;

  const jobsQuery = useQuery({
    queryKey: ['jobs'],
    queryFn: jobsApi.list,
  });
  const jobs = useMemo<JobWithMeta[]>(() => jobsQuery.data ?? [], [jobsQuery.data]);

  // Profile to calculate match score
  const profileQuery = useQuery({
    queryKey: ['worker-profile'],
    queryFn: workerApi.profile,
    enabled: isAuthenticated && user?.role === 'worker',
    retry: false,
  });
  const profile = profileQuery.data as WorkerWithMeta | undefined;

  // Check if current worker has already applied
  const applicationsQuery = useQuery({
    queryKey: ['worker-applications'],
    queryFn: applicationsApi.workerList,
    enabled: isAuthenticated && user?.role === 'worker',
  });
  const workerApplications: Application[] = applicationsQuery.data ?? [];
  const hasApplied = workerApplications.some((app) => app.jobId === jobId);

  // Filter similar jobs
  const relatedJobs = useMemo(() => {
    if (!job) return [];
    return jobs.filter((item) => item.id !== jobId && item.industry === job.industry).slice(0, 3);
  }, [jobId, jobs, job]);

  const applyMutation = useMutation({
    mutationFn: () => applicationsApi.apply(jobId),
    onSuccess: () => {
      toast.success('Application submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['worker-applications'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not submit application')),
  });

  const handleApply = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'worker') {
      toast.error('Only worker accounts can apply to jobs');
      return;
    }
    if (hasApplied) {
      toast.info('You have already applied to this job');
      return;
    }
    applyMutation.mutate(undefined);
  };

  // Highlights extraction - ONLY use API highlights
  const highlights = useMemo(() => {
    if (!job) return [];
    return Array.isArray(job.highlights) ? job.highlights : [];
  }, [job]);

  if (isLoading) {
    return <JobListSkeleton />;
  }

  if (!job) {
    return (
      <EmptyState icon={Briefcase} title="Job not found" description="This opening is no longer available." />
    );
  }

  // Work type labels matching premium style
  const workTypeLabel = job.workType.toLowerCase() === 'remote' ? 'Remote Friendly' : job.workType.toLowerCase() === 'hybrid' ? 'Remote / Hybrid' : 'On-site';
  const jobTypeLabel = job.jobType.toLowerCase() === 'full-time' ? 'Full-time' : job.jobType.toLowerCase() === 'part-time' ? 'Part-time' : 'Contract';

  return (
    <div className="bg-[#f8fafc] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen pb-16 space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <Link
        href={backUrl}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </Link>

      {/* 1. Top Header Banner Card (Naukri Exact Responsive Layout) */}
      <Card className="p-6 md:p-8 bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-6 text-left">
        {/* Top Header Row: Info on Left, Logo & Link on Right */}
        <div className="flex items-start justify-between gap-4">
          {/* Left Column Info */}
          <div className="space-y-3 flex-1 min-w-0">
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-snug">
              {job.title}
            </h1>

            {/* Recruiter & Rating Row */}
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600 font-bold">
              <span>{job.companyName}</span>
              <span className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> 2.5
              </span>
              <span className="text-slate-400 text-xs font-semibold">81 Reviews</span>
            </div>

            {/* Dynamic Details in a Row (Side by side with vertical dividers) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm font-bold text-slate-700 pt-1">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
                <span>{job.experienceMin} - {job.experienceMax} years</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <IndianRupee className="h-4 w-4 text-slate-400 shrink-0" />
                <span>{formatSalaryDisplay(job)}</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="truncate max-w-[280px]">
                  {job.locality && !job.location.includes(job.locality) ? `${job.locality}, ${job.location}` : job.location}
                </span>
              </div>
            </div>
          </div>

          {/* Right Logo Column */}
          <div className="flex flex-col items-end gap-2.5 shrink-0">
            <CompanyLogo name={job.companyName} className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl shrink-0" />
          </div>
        </div>

        <Separator className="bg-slate-100" />

        {/* Bottom Header Row: Post info & Action buttons */}
        <div className="flex flex-row items-center justify-between gap-4 w-full text-left">
          {/* Posted info anchored strictly at FAR LEFT */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500 text-left mr-auto shrink-0">
            <span>Posted: <strong className="text-slate-800 font-bold">{timeAgo(job.postedAt)}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Openings: <strong className="text-slate-800 font-bold">{job.openings || 1}</strong></span>
          </div>

          {/* Action buttons anchored strictly at FAR RIGHT */}
          {isRecruiter ? (
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <Button variant="outline" size="sm" onClick={() => router.push(`/recruiter/jobs/new?id=${job.id}`)} className="rounded-xl font-bold border-slate-200 flex items-center gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Edit Job
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/recruiter/jobs')} className="rounded-xl font-bold border-slate-200">
                Manage All Jobs
              </Button>
              <Button size="sm" onClick={() => router.push('/recruiter/applications')} className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white">
                View Applications
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 shrink-0 ml-auto">
              <Button
                onClick={handleApply}
                disabled={applyMutation.isPending || hasApplied}
                className="rounded-full font-bold px-9 py-2.5 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100 text-xs"
              >
                {applyMutation.isPending ? 'Applying...' : hasApplied ? 'Applied' : 'Apply'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 2. Job Highlights Card (Only shown if API provides highlights) */}
      {highlights.length > 0 && (
        <Card className="p-6 md:p-8 bg-white border border-slate-200/80 rounded-3xl space-y-5 text-left shadow-sm">
          <h3 className="text-base font-extrabold text-slate-800 border-b border-slate-100 pb-3">Job highlights</h3>
          <ul className="space-y-2.5 text-xs font-semibold text-slate-700">
            {highlights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* 3. Job match score Card */}
      {!isRecruiter && (
        <Card className="p-6 md:p-8 bg-white border border-slate-200/80 rounded-3xl space-y-3 text-left shadow-sm">
          <h4 className="text-xs font-extrabold text-slate-800">Job match score</h4>
          <div className="flex flex-wrap gap-2.5 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 fill-emerald-100" /> Early Applicant
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 fill-emerald-100" /> Keyskills
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 fill-emerald-100" /> Location
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
              <X className="h-3.5 w-3.5 text-slate-400" /> Work Experience
            </span>
          </div>
        </Card>
      )}

      {/* 3. Job Description Card (Matching Image 2 & 3) */}
      <Card className="p-6 md:p-8 bg-white border border-slate-200/80 rounded-3xl space-y-6 text-left shadow-sm">
        <div className="space-y-3">
          <h3 className="text-lg font-extrabold text-slate-800 border-b border-slate-100 pb-3">Job description</h3>
          <div className="text-xs font-semibold text-slate-700 space-y-1.5 bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
            <p className="text-sm font-bold text-slate-900">{job.title}</p>
            <p><strong>Company:</strong> {job.companyName}</p>
            <p><strong>Location:</strong> {job.locality && !job.location.includes(job.locality) ? `${job.locality}, ${job.location}` : job.location}</p>
            <p><strong>Experience:</strong> {job.experienceMin}-{job.experienceMax} Years</p>
            <p><strong>Job Type:</strong> <span className="capitalize">{job.jobType}</span></p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-extrabold text-slate-800">About the Role:</h4>
          <p className="text-xs font-semibold leading-relaxed text-slate-600 whitespace-pre-line">
            {job.description}
          </p>
        </div>

        {job.responsibilities.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-slate-800">Responsibilities:</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-600">
              {job.responsibilities.map((resp, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {job.requirements.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-slate-800">Requirements:</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-600">
              {job.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Image 3 Role Details Metadata Box */}
        <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-700">
          <p><strong>Role:</strong> {job.title}</p>
          <p><strong>Industry Type:</strong> {job.industry}</p>
          <p><strong>Department / Function:</strong> {job.department || job.departmentName || (job as any).function?.name || (job as any).functionName || 'General'}</p>
          <p><strong>Employment Type:</strong> <span className="capitalize">{job.jobType}</span>, <span className="capitalize">{job.shift} Shift</span></p>
          <p><strong>Working Days:</strong> {job.workingDays ? (typeof (job.workingDays as any) === 'string' && (job.workingDays as any).includes('_') ? (job.workingDays as any).replace('_', ' ').toLowerCase() : `${job.workingDays} Days Working`) : '5 Days Working'}</p>
          {job.gender && <p><strong>Gender Requirement:</strong> <span className="capitalize">{job.gender.toLowerCase()}</span></p>}
          {job.workingStatus && <p><strong>Working Status Required:</strong> <span className="capitalize">{job.workingStatus.replace('_', ' ').toLowerCase()}</span></p>}
          {job.isFresherFriendly && <p><strong>Fresher Status:</strong> <span className="text-emerald-700 font-extrabold">Freshers Allowed</span></p>}
        </div>

        {/* Education & Qualifications */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-700">
          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Education & Qualifications</h4>
          <p><strong>Required Qualifications:</strong> {Array.isArray(job.qualifications) && job.qualifications.length > 0 ? job.qualifications.join(', ') : 'Any Specialization / Graduate'}</p>
        </div>

        {/* Required Languages */}
        {Array.isArray(job.languages) && job.languages.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-700">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Required Languages</h4>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {job.languages.map((lang, idx) => (
                <Badge key={idx} variant="outline" className="rounded-full bg-blue-50 border-blue-100 text-blue-700 font-bold text-xs px-3.5 py-1">
                  🌐 {lang}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Key Skills & Assets & Benefits */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Key Skills & Required Assets / Benefits</h4>
          <p className="text-[10px] text-slate-400 font-bold">Skills highlighted with &apos;☆&apos; are preferred keyskills</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {(job.skills || []).map((skill, idx) => (
              <Badge key={idx} variant="outline" className="rounded-full bg-slate-50 border-slate-200 text-slate-700 font-bold text-xs px-3.5 py-1.5">
                ☆ {skill}
              </Badge>
            ))}
            {(job.assetNames || []).map((asset, idx) => (
              <Badge key={`asset-${idx}`} variant="outline" className="rounded-full bg-indigo-50 border-indigo-100 text-indigo-700 font-bold text-xs px-3.5 py-1.5">
                💼 {asset}
              </Badge>
            ))}
            {(job.benefitNames || []).map((benefit, idx) => (
              <Badge key={`benefit-${idx}`} variant="outline" className="rounded-full bg-emerald-50 border-emerald-100 text-emerald-700 font-bold text-xs px-3.5 py-1.5">
                🎁 {benefit}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
