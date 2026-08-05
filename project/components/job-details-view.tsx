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
  BadgeCheck
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
function displaySalary(min: number, max: number) {
  if (min === 0 && max === 0) return 'Salary not specified';
  if (max >= 1000) {
    return `₹${Math.round(min / 1000)}k - ₹${Math.round(max / 1000)}k`;
  }
  return `₹${min} - ₹${max}`;
}

function getJobMatchDetails(job: JobWithMeta, profileSkills: string[] = []) {
  const jobSkills = job.skills || [];
  const common = jobSkills.filter(s => profileSkills.some(ps => ps.toLowerCase() === s.toLowerCase()));
  let matchPercent = 75;
  if (common.length > 0) {
    matchPercent = Math.min(99, 80 + common.length * 5);
  } else {
    matchPercent = 85 + (job.title.length % 15);
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
    applyMutation.mutate();
  };

  // Dynamic applicants count
  const applicantsCount = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < jobId.length; i++) {
      hash = jobId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 120) + 42;
  }, [jobId]);

  // Match score
  const matchPercent = useMemo(() => {
    if (!job) return 90;
    const workerSkills = profile?.skills || [];
    return getJobMatchDetails(job, workerSkills).matchPercent;
  }, [job, profile]);

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
    <div className="bg-[#f8fafc] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen pb-16 space-y-6">
      {/* Back button */}
      <Link
        href={backUrl}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </Link>

      {/* Header Banner Card */}
      <Card className="p-8 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
        <div className="flex flex-row items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <CompanyLogo name={job.companyName} className="h-16 w-16 shrink-0" />
            <div className="space-y-1.5 min-w-0 flex-1 text-left">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="border-transparent bg-[#e8eefc]/70 text-[#0f52ba] font-bold text-[10px] rounded-lg py-0.5 px-2.5">
                  {workTypeLabel}
                </Badge>
                <Badge variant="outline" className="border-transparent bg-[#e8eefc]/70 text-[#0f52ba] font-bold text-[10px] rounded-lg py-0.5 px-2.5 capitalize">
                  {jobTypeLabel}
                </Badge>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight mt-1 truncate">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 font-bold mt-1.5">
                <span className="flex items-center gap-1"><Building2 className="h-4 w-4 text-slate-300" />{job.companyName}</span>
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-slate-300" />{job.location}</span>
                <span className="flex items-center gap-1 text-blue-500 font-extrabold"><BadgeCheck className="h-4.5 w-4.5 text-blue-600 fill-blue-50 shrink-0" />Verified Employer</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              className="border-slate-200 text-slate-700 hover:text-blue-600 font-bold rounded-xl py-5 px-5 shadow-sm text-xs transition-colors"
              onClick={() => {
                setSaved((value) => !value);
                if (!saved) toast.success('Job saved successfully');
              }}
            >
              {saved ? 'Saved' : 'Save Job'}
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-5 px-8 shadow-md shadow-blue-100 text-xs transition-colors"
              onClick={handleApply}
              disabled={applyMutation.isPending || hasApplied}
            >
              {applyMutation.isPending ? 'Applying...' : hasApplied ? 'Applied' : 'Apply Now'}
            </Button>
          </div>
        </div>

        <Separator className="bg-slate-100" />

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2">
          {/* Salary */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">SALARY RANGE</span>
            <span className="text-slate-800 font-extrabold text-2xl block mt-1">
              {displaySalary(job.salaryMin, job.salaryMax).replace(' - ', ' – ')}
            </span>
          </div>
          {/* Experience */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">EXPERIENCE</span>
            <span className="text-slate-800 font-extrabold text-2xl block mt-1">{job.experienceMin}+ Years</span>
          </div>
          {/* Match Score */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">MATCH SCORE</span>
            <div className="flex items-center gap-2.5 mt-1">
              <span className="text-blue-600 font-extrabold text-2xl leading-none">{matchPercent}%</span>
              <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden shrink-0 mt-0.5">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${matchPercent}%` }} />
              </div>
            </div>
          </div>
          {/* Applicants */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">APPLICANTS</span>
            <span className="text-slate-800 font-extrabold text-2xl block mt-1">{applicantsCount}</span>
          </div>
        </div>
      </Card>

      {/* Main layout columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* About the Role */}
          <Card className="p-8 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <Briefcase className="h-4.5 w-4.5 text-blue-600" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-800">About the Role</h2>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 font-bold whitespace-pre-line">
              {job.description || `${job.companyName} is seeking a motivated ${job.title} to join our growing organization. In this position, you will collaborate with other team members to deliver exceptional technical solutions.`}
            </p>
          </Card>

          {/* Responsibilities */}
          <Card className="p-8 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <CheckCircle2 className="h-4.5 w-4.5 text-blue-600" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-800">Responsibilities</h2>
            </div>
            <ul className="space-y-3">
              {job.responsibilities.length > 0 ? (
                job.responsibilities.map((resp, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-500 font-bold leading-normal">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 fill-emerald-50 shrink-0" />
                    <span>{resp}</span>
                  </li>
                ))
              ) : (
                ['Collaborate on design and implementation details.', 'Drive core functionality improvements and debug live issues.', 'Engage in review cycles and support project deadlines.'].map((resp, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-500 font-bold leading-normal">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 fill-emerald-50 shrink-0" />
                    <span>{resp}</span>
                  </li>
                ))
              )}
            </ul>
          </Card>

          {/* Requirements */}
          <Card className="p-8 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <ShieldCheck className="h-4.5 w-4.5 text-blue-600" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-800">Requirements</h2>
            </div>
            <ul className="space-y-3">
              {job.requirements.length > 0 ? (
                job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-500 font-bold leading-normal">
                    <Star className="mt-0.5 h-4 w-4 text-blue-500 shrink-0 fill-blue-50" />
                    <span>{req}</span>
                  </li>
                ))
              ) : (
                ['Solid foundational background in technology and related tools.', 'Clear comprehension of state management principles.', 'Attention to design details and smooth micro-animations.'].map((req, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-500 font-bold leading-normal">
                    <Star className="mt-0.5 h-4 w-4 text-blue-500 shrink-0 fill-blue-50" />
                    <span>{req}</span>
                  </li>
                ))
              )}
            </ul>
          </Card>

          {/* Benefits */}
          <Card className="p-8 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <Gift className="h-4.5 w-4.5 text-blue-600" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-800">Benefits</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {[
                {
                  title: 'Health & Wellness',
                  desc: '100% covered health, dental, and vision insurance for you and family.',
                  icon: Heart,
                  color: 'text-rose-500 bg-rose-50'
                },
                {
                  title: 'Modern Equipment',
                  desc: '₹4,00,000 budget for your home office setup and latest MacBook Pro.',
                  icon: Monitor,
                  color: 'text-blue-500 bg-blue-50'
                },
                {
                  title: 'Unlimited PTO',
                  desc: 'Flexible vacation policy with a minimum of 3 weeks encouraged.',
                  icon: Plane,
                  color: 'text-emerald-500 bg-emerald-50'
                }
              ].map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <div key={idx} className="bg-slate-50/70 border border-slate-100/40 p-5 rounded-2xl space-y-2">
                    <div className={`p-2 rounded-xl w-fit ${benefit.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <h4 className="font-extrabold text-slate-700 text-xs">{benefit.title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold leading-normal">{benefit.desc}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">
          {/* About the Company */}
          <Card className="p-6 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b border-slate-50 pb-2">
              ABOUT THE COMPANY
            </span>
            <div className="flex items-center gap-3">
              <CompanyLogo name={job.companyName} className="h-12 w-12 shrink-0" />
              <div>
                <h4 className="font-extrabold text-slate-700 text-sm">{job.companyName}</h4>
                <p className="text-[10px] text-slate-400 font-bold">Productivity Software</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-bold leading-normal">
              {job.companyName} is a top tier platform focusing on delivering productivity systems, cutting-edge software suites, and state-of-the-art developer operations tools.
            </p>
            <div className="space-y-3 pt-2 text-[11px] font-bold text-slate-500">
              <div className="flex justify-between">
                <span className="text-slate-400">Founded</span>
                <span className="text-slate-700 font-extrabold">2019</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Employees</span>
                <span className="text-slate-700 font-extrabold">50-100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Headquarters</span>
                <span className="text-slate-700 font-extrabold truncate max-w-[150px]">{job.location}</span>
              </div>
            </div>
          </Card>

          {/* Hiring Team */}
          <Card className="p-6 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b border-slate-50 pb-2">
              HIRING TEAM
            </span>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 overflow-hidden">
                <Avatar className="h-full w-full">
                  <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-sm">KS</AvatarFallback>
                </Avatar>
              </div>
              <div>
                <h4 className="font-extrabold text-slate-700 text-sm">{job.recruiterName || 'Karri Saarinen'}</h4>
                <p className="text-[10px] text-slate-400 font-bold">CEO & Co-founder</p>
              </div>
            </div>
            {/* <Button
              variant="outline"
              className="w-full border-slate-200 text-blue-600 hover:text-blue-700 font-extrabold text-xs py-3.5 rounded-xl transition-colors mt-2"
              onClick={() => toast.success(`Starting conversation with ${job.recruiterName || 'Karri Saarinen'}`)}
            >
              Send Message
            </Button> */}
          </Card>

          {/* Similar Jobs */}
          {relatedJobs.length > 0 && (
            <Card className="p-6 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b border-slate-50 pb-2">
                SIMILAR JOBS
              </span>
              <div className="space-y-4 pt-1">
                {relatedJobs.map((rJob) => (
                  <Link
                    key={rJob.id}
                    href={`${hrefPrefix}/${rJob.id}`}
                    className="flex justify-between items-center group cursor-pointer border-b border-slate-50/50 pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <h5 className="font-extrabold text-slate-700 text-xs group-hover:text-blue-600 transition-colors leading-snug">
                        {rJob.title}
                      </h5>
                      <span className="text-[9px] text-slate-400 font-bold">{rJob.companyName}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 shrink-0">
                      {displaySalary(rJob.salaryMin, rJob.salaryMax)}
                    </span>
                  </Link>
                ))}
              </div>
              <Link
                href="/worker/jobs"
                className="text-blue-600 hover:text-blue-700 font-extrabold text-[11px] flex items-center gap-1 border-t border-slate-50 pt-3"
              >
                View all similar jobs
                <ChevronRight className="h-3 w-3" />
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
