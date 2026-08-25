'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  MapPin,
  Briefcase,
  SlidersHorizontal,
  Bookmark,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  User,
  Plus,
  X,
  ChevronRight,
  HelpCircle,
  Banknote
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Job, Application } from '@/lib/types';
import { jobsApi, applicationsApi, workerApi, WorkerWithMeta, JobWithMeta } from '@/lib/scn-api';
import { useAuth } from '@/lib/auth-context';
import { timeAgo } from '@/lib/format';
import { toast } from 'sonner';

import { AppLogo } from '@/components/app-logo';

function CompanyLogo({ name, className = 'h-12 w-12' }: { name?: string; className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-1.5 overflow-hidden shrink-0`}>
      <AppLogo className="w-full h-full object-contain" />
    </div>
  );
}

// Helper to format salary
function displaySalary(min: number, max: number) {
  if (min === 0 && max === 0) return 'Salary not specified';
  if (min === max) return `₹${min.toLocaleString('en-IN')}`;
  return `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}`;
}

function getJobMatchDetails(job: Job, profileSkills: string[] = []) {
  const jobTitle = job?.title || '';
  const jobSkills = job?.skills || [];
  const common = jobSkills.filter(s => profileSkills.some(ps => ps.toLowerCase() === s.toLowerCase()));

  let matchPercent = 75;
  let matchesText = '';

  if (common.length > 0) {
    matchPercent = Math.min(99, 80 + common.length * 5);
    matchesText = `Matches your skill: ${common.slice(0, 3).join(', ')}`;
  } else {
    matchPercent = 85 + (jobTitle.length % 15);
    const displayedSkills = jobSkills.length > 0 ? jobSkills.slice(0, 2).join(', ') : 'React, Node';
    matchesText = `Matches your interest in ${job?.industry || 'Tech'} and ${displayedSkills}`;
  }

  return { matchPercent, matchesText };
}

export default function WorkerJobsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Queries
  const jobsQuery = useQuery({ queryKey: ['jobs'], queryFn: jobsApi.list });
  const applicationsQuery = useQuery({ queryKey: ['worker-applications'], queryFn: applicationsApi.workerList });
  const profileQuery = useQuery({ queryKey: ['worker-profile'], queryFn: workerApi.profile, retry: false });

  // State
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [experienceLimit, setExperienceLimit] = useState(10);
  const [salaryMinLimit, setSalaryMinLimit] = useState(0);
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Mapped old filters state
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [freshersOnly, setFreshersOnly] = useState(false);

  // Data helpers
  const jobs: JobWithMeta[] = jobsQuery.data ?? [];
  const applications: Application[] = applicationsQuery.data ?? [];
  const profile = profileQuery.data as WorkerWithMeta | undefined;

  const completion = profile?.profileCompletion || 85;
  const experienceYears = profile?.experienceYears || 5;

  // Apply Mutation
  const applyMutation = useMutation({
    mutationFn: (jobId: string) => applicationsApi.apply(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-applications'] });
      toast.success('Applied successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit application.');
    }
  });

  // Applied job IDs map
  const appliedJobIds = useMemo(() => {
    return new Set(applications.map(app => app.jobId));
  }, [applications]);

  // Real jobs only
  const allAvailableJobs = jobs;

  // Compute industries and jobTypes dynamically for the old filters
  const industries = useMemo(() => {
    return Array.from(new Set(allAvailableJobs.map((j) => j.industry)))
      .filter((value): value is string => Boolean(value));
  }, [allAvailableJobs]);

  const jobTypes = useMemo(() => {
    return Array.from(new Set(allAvailableJobs.map((j) => j.jobType)))
      .filter((value): value is Job['jobType'] => Boolean(value));
  }, [allAvailableJobs]);

  // Clear filters if real jobs are fetched from API
  useEffect(() => {
    if (jobsQuery.isSuccess && jobs.length > 0) {
      setSelectedEnvironments([]);
      setSkills([]);
      setSalaryMinLimit(0);
      setSelectedIndustries([]);
      setSelectedJobTypes([]);
      setFreshersOnly(false);
    }
  }, [jobsQuery.isSuccess, jobs.length]);

  // Handle environment checkbox toggles
  const handleEnvironmentToggle = (env: string) => {
    if (selectedEnvironments.includes(env)) {
      setSelectedEnvironments(selectedEnvironments.filter(e => e !== env));
    } else {
      setSelectedEnvironments([...selectedEnvironments, env]);
    }
  };

  // Filter logic
  const filteredJobs = useMemo(() => {
    let result = [...allAvailableJobs];

    // Filter by search inputs
    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter(
        j => j.title.toLowerCase().includes(kw) ||
          j.companyName.toLowerCase().includes(kw) ||
          j.skills.some(s => s.toLowerCase().includes(kw))
      );
    }
    if (location) {
      const loc = location.toLowerCase();
      result = result.filter(
        j => j.location.toLowerCase().includes(loc)
      );
    }

    // Filter by Experience Slider
    result = result.filter(j => j.experienceMin <= experienceLimit);

    // Filter by Salary Slider
    result = result.filter(j => j.salaryMax >= salaryMinLimit);

    // Filter by Environment Checkboxes
    if (selectedEnvironments.length > 0) {
      result = result.filter(j => {
        const type = j.workType.toLowerCase();
        if (type === 'remote') return selectedEnvironments.includes('remote');
        if (type === 'hybrid') return selectedEnvironments.includes('hybrid');
        return selectedEnvironments.includes('onsite');
      });
    }

    // Filter by skills badges
    if (skills.length > 0) {
      result = result.filter(j => {
        return skills.some(s => j.skills.some(js => js.toLowerCase() === s.toLowerCase()));
      });
    }

    // Integrated old filters: Industry
    if (selectedIndustries.length > 0) {
      result = result.filter(j => selectedIndustries.includes(j.industry));
    }

    // Integrated old filters: Job Type
    if (selectedJobTypes.length > 0) {
      result = result.filter(j => selectedJobTypes.includes(j.jobType));
    }

    // Integrated old filters: Fresher Friendly
    if (freshersOnly) {
      result = result.filter(j => j.isFresherFriendly);
    }

    return result;
  }, [allAvailableJobs, keyword, location, experienceLimit, salaryMinLimit, selectedEnvironments, skills, selectedIndustries, selectedJobTypes, freshersOnly]);

  // Selected Job tracking
  const activeJob = useMemo(() => {
    const selected = filteredJobs.find(j => j.id === selectedJobId);
    return selected || filteredJobs[0] || null;
  }, [filteredJobs, selectedJobId]);



  // Radial Progress Ring Math for Profile Health Card
  const radius = 45;
  const strokeWidth = 7;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (completion / 100) * circumference;

  // Track gradients math for sliders
  const expPercentage = (experienceLimit / 10) * 100;
  const salPercentage = (salaryMinLimit / 300000) * 100;

  return (
    <div className="space-y-8 pb-10 bg-[#f8fafc] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="w-full space-y-6">
        {/* Central Search Header Card */}
        <Card className="p-8 bg-white border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl space-y-6">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight text-center sm:text-left">
            Find Your Dream Job
          </h1>

          {/* Inputs bar row */}
          <div className="flex flex-row items-center gap-2.5 w-full bg-white border border-slate-200/60 rounded-2xl p-2 shadow-sm">
            {/* Keyword */}
            <div className="relative flex-[2] pl-2 flex items-center gap-2 min-w-[150px] border-r border-slate-100 pr-2">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Job title, skill, or company"
                className="bg-transparent border-0 w-full text-[11px] font-semibold focus:outline-none text-slate-700 placeholder:text-slate-400"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            {/* Location */}
            <div className="relative flex-[1.5] pl-2 flex items-center gap-2 min-w-[120px] border-r border-slate-100 pr-2">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Location"
                className="bg-transparent border-0 w-full text-[11px] font-semibold focus:outline-none text-slate-700 placeholder:text-slate-400"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Buttons alignment */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                type="button"
                className="border-slate-200 hover:bg-slate-50 text-slate-600 font-extrabold rounded-lg px-3.5 h-8 text-[11px] flex items-center justify-center gap-1 shadow-sm"
                onClick={() => setIsFiltersOpen(true)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
              </Button>

              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 h-8 rounded-lg shadow-md shadow-blue-100 text-[11px]"
                onClick={() => jobsQuery.refetch()}
              >
                Search
              </Button>
            </div>
          </div>
        </Card>

        {/* Counts & Sorting */}
        <div className="flex items-center justify-between gap-3 text-slate-400 font-bold text-xs px-2">
          <span>{filteredJobs.length} Jobs Found</span>
          <div className="flex items-center gap-2 text-slate-600 cursor-pointer">
            <span>Sort by:</span>
            <span className="font-extrabold text-slate-800">Highest Match</span>
            <ChevronRight className="h-3.5 w-3.5 rotate-90 text-slate-400" />
          </div>
        </div>

        {/* JobList Container (3 cards side by side on lg+ screens) */}
        {filteredJobs.length === 0 ? (
          <Card className="p-12 text-center bg-white border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl space-y-4">
            <Briefcase className="h-12 w-12 mx-auto text-slate-300" />
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-800">No jobs found</h3>
              <p className="text-xs text-slate-400 font-semibold">Try adjusting your filters or search terms.</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const isSelected = activeJob?.id === job.id;
              const hasApplied = appliedJobIds.has(job.id);

              const workerSkills = profile?.skills || [];
              const { matchPercent } = getJobMatchDetails(job, workerSkills);

              const type = job.workType.toLowerCase();
              const badgeLabel = type === 'remote' ? 'REMOTE FRIENDLY' : type === 'hybrid' ? 'HYBRID' : 'ON SITE';
              const badgeColor = type === 'remote' ? 'bg-emerald-50 text-emerald-700' : type === 'hybrid' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700';

              return (
                <Card
                  key={job.id}
                  className={`p-6 bg-white border hover:border-blue-100 hover:shadow-md transition-all rounded-3xl flex flex-col items-stretch justify-between gap-4 cursor-pointer ${isSelected ? 'border-blue-200 ring-2 ring-blue-50/50 shadow-md' : 'border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)]'
                    }`}
                  onClick={() => setSelectedJobId(job.id)}
                >
                  <div className="flex items-start gap-3.5">
                    <CompanyLogo name={job.companyName} className="h-11 w-11 shrink-0 mt-0.5" />
                    <div className="space-y-3 flex-1 min-w-0">
                      {/* Job Title */}
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-base leading-tight hover:text-blue-600 transition-colors truncate">
                          {job.title}
                        </h3>
                      </div>

                      {/* Detail line */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-semibold">
                        <span className="flex items-center gap-1 shrink-0">
                          <MapPin className="h-3 w-3 text-slate-300 shrink-0" />
                          {job.location}
                        </span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border border-transparent tracking-wider shrink-0 ${badgeColor}`}>
                          {badgeLabel}
                        </span>
                      </div>

                      {/* Salary line */}
                      <div className="flex items-center gap-2 text-slate-500 font-extrabold text-xs">
                        <Banknote className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{displaySalary(job.salaryMin, job.salaryMax)}</span>
                      </div>

                      {/* Status indicators */}
                      <p className="text-[10px] text-slate-400 font-bold">
                        Posted {timeAgo(job.postedAt)} • {job.applicationsCount || 0} applicants
                      </p>
                    </div>
                  </div>

                  {/* Button Stack at the bottom of the card for sideby layout */}
                  <div className="flex flex-col items-center gap-2 pt-4 border-t border-slate-50 w-full shrink-0">
                    {/* Match Badge */}
                    {/* <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-blue-50 mb-1">
                      {matchPercent}% Match
                    </span> */}

                    <div className="flex items-center gap-2 w-full">
                      <Button
                        variant="outline"
                        className="border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-blue-600 rounded-xl py-3 px-4 text-xs font-bold flex-1 transition-colors"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link href={`/worker/jobs/${job.id}`}>
                          Details
                        </Link>
                      </Button>

                      {hasApplied ? (
                        <Button
                          className="bg-slate-100 text-slate-400 font-bold py-3 px-4 rounded-xl text-xs flex-1 cursor-not-allowed"
                          disabled
                          onClick={(e) => e.stopPropagation()}
                        >
                          Applied
                        </Button>
                      ) : (
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex-1 shadow-sm shadow-blue-100 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            applyMutation.mutate(job.id);
                          }}
                          disabled={applyMutation.isPending && applyMutation.variables === job.id}
                        >
                          {applyMutation.isPending && applyMutation.variables === job.id ? 'Applying...' : 'Apply'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter Modal Dialog */}
      <Dialog open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-3xl p-6 bg-white border border-slate-100">
          <DialogHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-3">
            <DialogTitle className="font-extrabold text-slate-800 text-lg">Filters</DialogTitle>
            <button
              onClick={() => {
                setSelectedEnvironments([]);
                setSkills([]);
                setSalaryMinLimit(0);
                setExperienceLimit(10);
                setSelectedIndustries([]);
                setSelectedJobTypes([]);
                setFreshersOnly(false);
                setKeyword('');
                setLocation('');
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
            >
              Reset All
            </button>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Experience Filter */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Experience (Years)
              </label>
              <div className="relative pt-1">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={experienceLimit}
                  onChange={(e) => setExperienceLimit(parseInt(e.target.value))}
                  className="w-full h-1 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none transition-all"
                  style={{
                    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${expPercentage}%, #e2e8f0 ${expPercentage}%, #e2e8f0 100%)`
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>0 yrs</span>
                <span>10+ yrs</span>
              </div>
            </div>

            {/* Salary Filter */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <span>Salary Range</span>
                <span className="text-blue-600 font-extrabold">{salaryMinLimit === 0 ? 'Any' : `₹${(salaryMinLimit / 1000).toFixed(0)}k`}</span>
              </div>
              <div className="relative pt-1">
                <input
                  type="range"
                  min="0"
                  max="300000"
                  step="5000"
                  value={salaryMinLimit}
                  onChange={(e) => setSalaryMinLimit(parseInt(e.target.value))}
                  className="w-full h-1 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none transition-all"
                  style={{
                    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${salPercentage}%, #e2e8f0 ${salPercentage}%, #e2e8f0 100%)`
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-extrabold text-blue-600">
                <span>Any</span>
                <span>₹300k+</span>
              </div>
            </div>

            {/* Environment Filter */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Environment
              </label>
              <div className="space-y-2.5">
                {[
                  { id: 'remote', label: 'Remote Friendly' },
                  { id: 'hybrid', label: 'Hybrid' },
                  { id: 'onsite', label: 'On-site' }
                ].map((env) => (
                  <div key={env.id} className="flex items-center gap-3">
                    <Checkbox
                      id={`filter-dialog-${env.id}`}
                      checked={selectedEnvironments.includes(env.id)}
                      onCheckedChange={() => handleEnvironmentToggle(env.id)}
                      className="h-4.5 w-4.5 rounded border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label htmlFor={`filter-dialog-${env.id}`} className="text-xs font-semibold text-slate-700 cursor-pointer">
                      {env.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Filters */}
            <div className="space-y-3 pt-4 border-t border-slate-100/50">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Quick Filters
              </label>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="filter-dialog-freshers"
                  checked={freshersOnly}
                  onCheckedChange={(value) => setFreshersOnly(!!value)}
                  className="h-4.5 w-4.5 rounded border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <label htmlFor="filter-dialog-freshers" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Fresher Friendly
                </label>
              </div>
            </div>

            {/* Job Type */}
            {jobTypes.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100/50">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Job Type
                </label>
                <div className="space-y-2.5">
                  {jobTypes.map((type) => (
                    <div key={type} className="flex items-center gap-3">
                      <Checkbox
                        id={`filter-dialog-type-${type}`}
                        checked={selectedJobTypes.includes(type)}
                        onCheckedChange={() => {
                          setSelectedJobTypes(
                            selectedJobTypes.includes(type)
                              ? selectedJobTypes.filter(t => t !== type)
                              : [...selectedJobTypes, type]
                          );
                        }}
                        className="h-4.5 w-4.5 rounded border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <label htmlFor={`filter-dialog-type-${type}`} className="text-xs font-semibold text-slate-700 cursor-pointer capitalize">
                        {type.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Industry */}
            {industries.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100/50">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Industry
                </label>
                <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                  {industries.map((ind) => (
                    <div key={ind} className="flex items-center gap-3">
                      <Checkbox
                        id={`filter-dialog-ind-${ind}`}
                        checked={selectedIndustries.includes(ind)}
                        onCheckedChange={() => {
                          setSelectedIndustries(
                            selectedIndustries.includes(ind)
                              ? selectedIndustries.filter(i => i !== ind)
                              : [...selectedIndustries, ind]
                          );
                        }}
                        className="h-4.5 w-4.5 rounded border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <label htmlFor={`filter-dialog-ind-${ind}`} className="text-xs font-semibold text-slate-700 cursor-pointer truncate max-w-[180px]">
                        {ind}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            <div className="space-y-3 pt-4 border-t border-slate-100/50">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Skills
              </label>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 bg-[#e8eefc]/60 text-[#0F52BA] font-extrabold text-[10px] px-3.5 py-1.5 rounded-full border border-transparent"
                  >
                    {skill}
                    <button
                      onClick={() => setSkills(skills.filter(s => s !== skill))}
                      className="hover:bg-blue-100/50 p-0.5 rounded-full"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="mt-2.5">
                {isAddingSkill ? (
                  <input
                    type="text"
                    placeholder="Type skill & press enter"
                    autoFocus
                    className="border border-slate-200 rounded-full px-3 py-1.5 text-xs w-full focus:outline-none focus:border-slate-300"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onBlur={() => {
                      if (newSkillInput.trim()) {
                        setSkills([...skills, newSkillInput.trim()]);
                      }
                      setNewSkillInput('');
                      setIsAddingSkill(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newSkillInput.trim()) {
                          setSkills([...skills, newSkillInput.trim()]);
                        }
                        setNewSkillInput('');
                        setIsAddingSkill(false);
                      }
                    }}
                  />
                ) : (
                  <button
                    onClick={() => setIsAddingSkill(true)}
                    className="bg-slate-50 hover:bg-slate-100/80 text-slate-400 hover:text-slate-600 text-[10px] font-black px-3.5 py-1.5 rounded-full border border-slate-200/50 transition-colors flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Skill</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-50 pt-4">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl text-sm shadow-md shadow-blue-100" onClick={() => setIsFiltersOpen(false)}>
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
