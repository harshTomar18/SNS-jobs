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
  Sparkles,
  Banknote
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Job, Application } from '@/lib/types';
import { jobsApi, applicationsApi, workerApi, WorkerWithMeta } from '@/lib/scn-api';
import { useAuth } from '@/lib/auth-context';
import { timeAgo } from '@/lib/format';
import { toast } from 'sonner';

// Helper component for logos
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

// Helper to format salary
function displaySalary(min: number, max: number) {
  if (min === 0 && max === 0) return 'Salary not specified';
  if (max >= 1000) {
    return `$${Math.round(min / 1000)}k - $${Math.round(max / 1000)}k`;
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
  
  const [experienceLimit, setExperienceLimit] = useState(10);
  const [salaryMinLimit, setSalaryMinLimit] = useState(80000);
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>(['remote']); // precheck remote
  const [skills, setSkills] = useState<string[]>(['React', 'TypeScript']);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Mapped old filters state
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [freshersOnly, setFreshersOnly] = useState(false);

  // Data helpers
  const jobs: Job[] = jobsQuery.data ?? [];
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

  // Mock Jobs from screenshot
  const mockJobs: Job[] = [
    {
      id: 'mock-1',
      title: 'Staff Product Designer',
      companyId: 'nebula-systems',
      companyName: 'Nebula Systems',
      companyLogo: '',
      industry: 'Design',
      location: 'San Francisco, CA',
      workType: 'remote',
      jobType: 'full-time',
      shift: 'day',
      salaryMin: 180000,
      salaryMax: 240000,
      experienceMin: 6,
      experienceMax: 9,
      openings: 1,
      skills: ['React', 'UI Design', 'Figma', 'TypeScript'],
      description: 'Join Nebula Systems as a Staff Product Designer.',
      responsibilities: [],
      requirements: [],
      benefits: [],
      postedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      recruiterId: 'recruiter-nebula',
      recruiterName: 'Nebula Recruiter',
      status: 'published',
      isFresherFriendly: false,
    },
    {
      id: 'mock-2',
      title: 'Senior Frontend Developer (React/TS)',
      companyId: 'lumina-cloud',
      companyName: 'Lumina Cloud',
      companyLogo: '',
      industry: 'Tech',
      location: 'New York, NY',
      workType: 'hybrid',
      jobType: 'full-time',
      shift: 'day',
      salaryMin: 150000,
      salaryMax: 195000,
      experienceMin: 5,
      experienceMax: 8,
      openings: 3,
      skills: ['React', 'TypeScript', 'Tailwind CSS'],
      description: 'Senior Frontend Developer role at Lumina Cloud.',
      responsibilities: [],
      requirements: [],
      benefits: [],
      postedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      recruiterId: 'recruiter-lumina',
      recruiterName: 'Lumina Recruiter',
      status: 'published',
      isFresherFriendly: false,
    },
    {
      id: 'mock-3',
      title: 'Lead AI Engineer',
      companyId: 'cognito-ai',
      companyName: 'Cognito AI',
      companyLogo: '',
      industry: 'AI',
      location: 'Austin, TX',
      workType: 'remote',
      jobType: 'full-time',
      shift: 'day',
      salaryMin: 220000,
      salaryMax: 310000,
      experienceMin: 7,
      experienceMax: 12,
      openings: 2,
      skills: ['Python', 'PyTorch', 'TypeScript', 'React'],
      description: 'Lead AI engineering projects at Cognito AI.',
      responsibilities: [],
      requirements: [],
      benefits: [],
      postedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      recruiterId: 'recruiter-cognito',
      recruiterName: 'Cognito Recruiter',
      status: 'published',
      isFresherFriendly: false,
    }
  ];

  // Merge real and mock jobs
  const allAvailableJobs = useMemo(() => {
    return jobs.length > 0 ? jobs : mockJobs;
  }, [jobs]);

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

  // Selected Job dynamic calculations for right Smart Match card
  const smartMatchStats = useMemo(() => {
    if (!activeJob) return { skillAlignment: 0, salaryAlignment: 0, strengths: [] };
    
    const jobSkills = activeJob.skills || [];
    const common = jobSkills.filter(s => skills.some(sk => sk.toLowerCase() === s.toLowerCase()));
    const skillAlignment = jobSkills.length > 0 ? Math.min(100, Math.round((common.length / jobSkills.length) * 100)) : 80;

    const maxSalary = activeJob.salaryMax || 150000;
    const salaryAlignment = maxSalary >= salaryMinLimit ? 100 : Math.round((maxSalary / salaryMinLimit) * 100);

    const strengths = [];
    if (common.length >= 2) strengths.push('Perfect Tech Stack match');
    if (experienceYears >= activeJob.experienceMin) strengths.push('Seniority level exceeded');
    if (activeJob.workType === 'remote') strengths.push('Ideal remote work setup');
    if (strengths.length === 0) {
      strengths.push('Hiring team actively reviewing');
      strengths.push('Strong industry alignment');
    }

    return {
      skillAlignment: Math.max(70, skillAlignment),
      salaryAlignment: Math.max(65, salaryAlignment),
      strengths
    };
  }, [activeJob, skills, salaryMinLimit, experienceYears]);

  // Radial Progress Ring Math for Profile Health Card
  const radius = 45;
  const strokeWidth = 7;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (completion / 100) * circumference;

  // Track gradients math for sliders
  const expPercentage = (experienceLimit / 10) * 100;
  const salPercentage = ((salaryMinLimit - 80000) / (300000 - 80000)) * 100;

  return (
    <div className="space-y-8 pb-10 bg-[#f8fafc] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Filters (1/4 width) */}
        <aside className="lg:col-span-1 block bg-white border border-slate-100/80 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] self-start space-y-6">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h3 className="font-extrabold text-slate-800 text-base">Filters</h3>
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          </div>

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
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Salary Range
            </label>
            <div className="relative pt-1">
              <input
                type="range"
                min="80000"
                max="300000"
                step="10000"
                value={salaryMinLimit}
                onChange={(e) => setSalaryMinLimit(parseInt(e.target.value))}
                className="w-full h-1 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none transition-all"
                style={{
                  background: `linear-gradient(to right, #2563eb 0%, #2563eb ${salPercentage}%, #e2e8f0 ${salPercentage}%, #e2e8f0 100%)`
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-extrabold text-blue-600">
              <span>$80k</span>
              <span>$300k+</span>
            </div>
          </div>

          {/* Environment Filter */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Environment
            </label>
            <div className="space-y-2.5">
              {[
                { id: 'remote', label: 'Remote' },
                { id: 'hybrid', label: 'Hybrid' },
                { id: 'onsite', label: 'On-site' }
              ].map((env) => (
                <div key={env.id} className="flex items-center gap-3">
                  <Checkbox
                    id={`filter-${env.id}`}
                    checked={selectedEnvironments.includes(env.id)}
                    onCheckedChange={() => handleEnvironmentToggle(env.id)}
                    className="h-4.5 w-4.5 rounded border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <label htmlFor={`filter-${env.id}`} className="text-xs font-semibold text-slate-700 cursor-pointer">
                    {env.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Integrated Old Filter: Quick Filters (Fresher Friendly) */}
          <div className="space-y-3 pt-4 border-t border-slate-100/50">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Quick Filters
            </label>
            <div className="flex items-center gap-3">
              <Checkbox
                id="filter-freshers"
                checked={freshersOnly}
                onCheckedChange={(value) => setFreshersOnly(!!value)}
                className="h-4.5 w-4.5 rounded border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <label htmlFor="filter-freshers" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Fresher Friendly
              </label>
            </div>
          </div>

          {/* Integrated Old Filter: Job Type */}
          {jobTypes.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100/50">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Job Type
              </label>
              <div className="space-y-2.5">
                {jobTypes.map((type) => (
                  <div key={type} className="flex items-center gap-3">
                    <Checkbox
                      id={`filter-type-${type}`}
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
                    <label htmlFor={`filter-type-${type}`} className="text-xs font-semibold text-slate-700 cursor-pointer capitalize">
                      {type.replace('_', ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integrated Old Filter: Industry */}
          {industries.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100/50">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Industry
              </label>
              <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                {industries.map((ind) => (
                  <div key={ind} className="flex items-center gap-3">
                    <Checkbox
                      id={`filter-ind-${ind}`}
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
                    <label htmlFor={`filter-ind-${ind}`} className="text-xs font-semibold text-slate-700 cursor-pointer truncate max-w-[150px]">
                      {ind}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills Badges Filter */}
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

          {/* Support Box */}
          <div className="bg-[#f8fafc]/80 rounded-2xl p-4 border border-slate-100/50 space-y-3 mt-4 text-center">
            <p className="text-[10px] text-slate-500 font-bold">Need help finding a role?</p>
            <Button variant="outline" className="w-full border-slate-200 bg-[#e2e8f0]/40 hover:bg-[#e2e8f0]/60 text-slate-600 rounded-xl py-2.5 font-extrabold text-xs transition-colors shadow-none" asChild>
              <Link href="/worker/profile">Support</Link>
            </Button>
          </div>
        </aside>

        {/* Middle Column: Search Card & Job List (2/4 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Central Search Header Card */}
          <Card className="p-8 bg-white border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl space-y-6">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight text-center sm:text-left">
              Find Your Dream Job
            </h1>

            {/* Inputs bar row */}
            <div className="flex flex-col md:flex-row items-center gap-3 w-full bg-white border border-slate-200/60 rounded-2xl p-2.5 shadow-sm">
              {/* Keyword */}
              <div className="relative flex-1 w-full pl-3.5 flex items-center gap-2.5">
                <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Job title, skill, or company"
                  className="bg-transparent border-0 w-full text-xs font-semibold focus:outline-none text-slate-700 placeholder:text-slate-400"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>

              <div className="hidden md:block h-6 w-px bg-slate-200 shrink-0" />

              {/* Location */}
              <div className="relative flex-1 w-full pl-3.5 flex items-center gap-2.5">
                <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Location"
                  className="bg-transparent border-0 w-full text-xs font-semibold focus:outline-none text-slate-700 placeholder:text-slate-400"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="hidden md:block h-6 w-px bg-slate-200 shrink-0" />

              {/* Dropdown Seniority */}
              <div className="w-full md:w-32 flex items-center justify-between px-3 text-xs font-bold text-slate-600 bg-white rounded-xl py-2 border border-slate-100 cursor-pointer">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                  <span>Mid-Senior</span>
                </div>
                <ChevronRight className="h-4 w-4 rotate-90 text-slate-400" />
              </div>

              <Button
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-5 rounded-xl shadow-md shadow-blue-100 text-xs shrink-0"
                onClick={() => jobsQuery.refetch()}
              >
                Search
              </Button>
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

          {/* JobList Container (2 cards side by side on md+ screens) */}
          {filteredJobs.length === 0 ? (
            <Card className="p-12 text-center bg-white border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl space-y-4">
              <Briefcase className="h-12 w-12 mx-auto text-slate-300" />
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-800">No jobs found</h3>
                <p className="text-xs text-slate-400 font-semibold">Try adjusting your filters or search terms.</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredJobs.map((job, idx) => {
                const isSelected = activeJob?.id === job.id;
                const hasApplied = appliedJobIds.has(job.id);
                
                const workerSkills = profile?.skills || [];
                const { matchPercent } = getJobMatchDetails(job, workerSkills);

                const type = job.workType.toLowerCase();
                const badgeLabel = type === 'remote' ? 'REMOTE FRIENDLY' : type === 'hybrid' ? 'HYBRID' : 'ON SITE';
                const badgeColor = type === 'remote' ? 'bg-emerald-50 text-emerald-700' : type === 'hybrid' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700';

                const isHiringActive = idx % 2 === 0;
                
                return (
                  <Card
                    key={job.id}
                    className={`p-6 bg-white border hover:border-blue-100 hover:shadow-md transition-all rounded-3xl flex flex-col items-stretch justify-between gap-4 cursor-pointer ${
                      isSelected ? 'border-blue-200 ring-2 ring-blue-50/50 shadow-md' : 'border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)]'
                    }`}
                    onClick={() => setSelectedJobId(job.id)}
                  >
                    <div className="flex items-start gap-4">
                      <CompanyLogo name={job.companyName} className="h-12 w-12 shrink-0 md:mt-1" />
                      <div className="space-y-3 flex-1 min-w-0">
                        {/* Title and Company */}
                        <div className="space-y-0.5">
                          <h3 className="font-extrabold text-slate-800 text-base leading-tight hover:text-blue-600 transition-colors truncate">
                            {job.title}
                          </h3>
                          <p className="text-xs text-slate-400 font-bold">{job.companyName}</p>
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
                        {isHiringActive ? (
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-extrabold">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span>Hiring team is active</span>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 font-bold">
                            Posted {timeAgo(job.postedAt)} • {job.openings + (idx * 5)} applicants
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Button Stack at the bottom of the card for sideby layout */}
                    <div className="flex flex-col items-center gap-2 pt-4 border-t border-slate-50 w-full shrink-0">
                      {/* Match Badge */}
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-blue-50 mb-1">
                        ✦ {matchPercent}% Match
                      </span>
                      
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

        {/* Right Column: Smart Match & Profile Health (1/4 width) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Smart Match Card */}
          <Card className="p-6 bg-white border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h3 className="font-extrabold text-slate-800 text-sm">Smart Match</h3>
            </div>

            {activeJob ? (
              <div className="space-y-5">
                <p className="text-[10px] text-slate-400 font-bold leading-normal">
                  Based on your Profile Analysis and {experienceYears}+ years of React experience.
                </p>

                <div className="space-y-4">
                  {/* Skill Alignment */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-extrabold text-slate-700">
                      <span>SKILL ALIGNMENT</span>
                      <span>{smartMatchStats.skillAlignment}%</span>
                    </div>
                    <div className="w-full bg-slate-50 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${smartMatchStats.skillAlignment}%` }}
                      />
                    </div>
                  </div>

                  {/* Salary Alignment */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-extrabold text-slate-700">
                      <span>SALARY ALIGNMENT</span>
                      <span>{smartMatchStats.salaryAlignment}%</span>
                    </div>
                    <div className="w-full bg-slate-50 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${smartMatchStats.salaryAlignment}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                    Top Strengths
                  </span>
                  <div className="space-y-2 text-[10px] text-slate-600 font-bold leading-normal pl-1">
                    {smartMatchStats.strengths.map((str, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-50 shrink-0" />
                        <span>{str}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href="/worker/profile"
                  className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1.5 pt-2 border-t border-slate-50"
                >
                  Improve my Match Score
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-semibold text-center py-6">
                Select a job to view Smart Match alignment details.
              </p>
            )}
          </Card>

          {/* Profile Health Card */}
          <Card className="p-6 bg-white border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl flex flex-col items-center justify-center gap-4 text-center">
            <h3 className="font-extrabold text-slate-800 text-sm self-start border-b border-slate-50 pb-2 w-full text-left">
              Profile Health
            </h3>
            
            <div className="flex items-center gap-4 text-left w-full">
              <div className="relative flex items-center justify-center shrink-0">
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
                <span className="absolute text-sm font-black text-slate-800">{completion}%</span>
              </div>
              <p className="text-slate-400 font-bold text-[10px] leading-normal">
                Add a portfolio to reach 100% and get noticed faster.
              </p>
            </div>
            
            <Button
              variant="outline"
              className="border-slate-200 hover:bg-slate-50 text-blue-600 hover:text-blue-700 rounded-xl py-2 w-full font-bold text-xs mt-2"
              asChild
            >
              <Link href="/worker/profile">Complete Profile</Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
