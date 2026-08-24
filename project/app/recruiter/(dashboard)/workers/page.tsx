'use client';

// Candidate data search page

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Eye, 
  Download, 
  Clock, 
  User,
  ChevronDown,
  Filter,
  RotateCcw
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { EmptyState } from '@/components/empty-state';
import { getInitials, formatExpectedSalary } from '@/lib/format';
import { CandidateProfileDrawer } from '@/components/candidate-profile-drawer';
import { workerApi, masterDataApi, WorkerWithMeta } from '@/lib/scn-api';
import { cn } from '@/lib/utils';

export default function RecruiterWorkerSearchPage() {
  const [search, setSearch] = useState('');
  const [jobRoleFilter, setJobRoleFilter] = useState('all');
  const [expFilter, setExpFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('all');
  const [qualFilter, setQualFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [langFilter, setLangFilter] = useState('all');
  const [assetFilter, setAssetFilter] = useState('all');
  const [availFilter, setAvailFilter] = useState('all');

  const [selectedWorker, setSelectedWorker] = useState<WorkerWithMeta | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Fetch candidates from API (/worker/search)
  const workersQuery = useQuery({
    queryKey: ['workers', search],
    queryFn: () => workerApi.search({ q: search || undefined }),
  });
  const workers = useMemo<WorkerWithMeta[]>(() => workersQuery.data ?? [], [workersQuery.data]);

  // Fetch master data for dropdown options
  const masterQuery = useQuery({
    queryKey: ['master-data-all'],
    queryFn: () => masterDataApi.all(),
  });

  const masterData = masterQuery.data;

  // Extract master data options with safe fallbacks
  const jobRolesList = useMemo(() => {
    const fromMaster = (masterData?.['job-roles'] || []).map((r: any) => r.name);
    const fromWorkers = workers.flatMap((w) => (w as any).preferredJobRoles || []);
    return Array.from(new Set([...fromMaster, ...fromWorkers, 'Chat Support Executive', 'Stock Clerk', 'Hospital Receptionist', 'IT Helpdesk Executive', 'Production Line Worker', 'Delivery Driver', 'Cook', 'Store Supervisor', 'Quality Control Inspector', 'Data Entry Operator', 'Delivery Executive', 'Junior Software Developer', 'Nursing Assistant', 'Security Guard', 'Electrician', 'Machine Operator', 'Housekeeping Staff', 'Customer Support Executive', 'Warehouse Associate', 'Sales Associate'])).filter(Boolean).sort();
  }, [masterData, workers]);

  const industriesList = useMemo(() => {
    const fromMaster = (masterData?.industries || []).map((i: any) => i.name);
    const fromWorkers = workers.flatMap((w) => w.preferredIndustries || []);
    return Array.from(new Set([...fromMaster, ...fromWorkers, 'BPO / Customer Support', 'Retail', 'Healthcare', 'IT Services', 'Manufacturing', 'Logistics & Supply Chain', 'Hospitality', 'Construction', 'Security Services', 'E-commerce'])).filter(Boolean).sort();
  }, [masterData, workers]);

  const departmentsList = useMemo(() => {
    const fromWorkers = workers.map((w) => w.department).concat(workers.flatMap((w) => (w as any).preferredDepartments || [])).filter(Boolean) as string[];
    return Array.from(new Set([...fromWorkers, 'Customer Service', 'Warehouse Operations', 'Front Office', 'Technical Support', 'Production', 'Fleet Operations', 'Food & Beverage', 'Store Operations', 'Quality Assurance', 'Data Operations', 'Delivery', 'Software Development', 'Patient Care', 'Security', 'Site Operations', 'Housekeeping', 'Sales'])).filter(Boolean).sort();
  }, [workers]);

  const skillsList = useMemo(() => {
    const fromMaster = (masterData?.skills || []).map((s: any) => s.name);
    const fromWorkers = workers.flatMap((w) => w.skills || []);
    return Array.from(new Set([...fromMaster, ...fromWorkers, 'Communication', 'Customer Service', 'Inventory Management', 'MS Office', 'JavaScript', 'Node.js', 'SQL', 'English Communication', 'Vigilant', 'Physical Stamina'])).filter(Boolean).sort();
  }, [masterData, workers]);

  const qualList = useMemo(() => {
    const fromMaster = (masterData?.qualifications || []).map((q: any) => q.name);
    const fromWorkers = workers.flatMap((w) => w.education.map((e) => e.degree)).filter(Boolean);
    return Array.from(new Set([...fromMaster, ...fromWorkers, '10th Pass', '12th Pass', 'Graduate', 'Post Graduate', 'Diploma', 'B.Tech', 'B.Com', 'B.A.', 'B.Sc'])).filter(Boolean).sort();
  }, [masterData, workers]);

  const languagesList = useMemo(() => {
    const fromMaster = (masterData?.languages || []).map((l: any) => l.name);
    const fromWorkers = workers.flatMap((w) => w.languages.map((l) => l.split(' ')[0])).filter(Boolean);
    return Array.from(new Set([...fromMaster, ...fromWorkers, 'English', 'Hindi', 'Tamil', 'Kannada', 'Telugu', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi'])).filter(Boolean).sort();
  }, [masterData, workers]);

  const assetsList = useMemo(() => {
    const fromMaster = (masterData?.assets || []).map((a: any) => a.name);
    const fromWorkers = workers.flatMap((w) => (w as any).assets || []);
    return Array.from(new Set([...fromMaster, ...fromWorkers, 'Laptop', 'Two-Wheeler / Bike', 'Android Smartphone', 'Safety Shoes / Helmet', 'Driving License'])).filter(Boolean).sort();
  }, [masterData, workers]);

  // Comprehensive multi-criteria filtering
  const filteredWorkers = useMemo(() => {
    let result = workers;

    // 1. Candidate Keyword Search (Name, Headline, Phone, Email, City, Skills, etc.)
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) => 
          w.fullName.toLowerCase().includes(q) || 
          (w.headline && w.headline.toLowerCase().includes(q)) ||
          (w.phone && w.phone.includes(q)) ||
          (w.email && w.email.toLowerCase().includes(q)) ||
          (w.city && w.city.toLowerCase().includes(q)) ||
          (w.locality && w.locality.toLowerCase().includes(q)) ||
          w.skills.some((skill) => skill.toLowerCase().includes(q)) ||
          (w.jobPreference && w.jobPreference.toLowerCase().includes(q))
      );
    }

    // 2. Job Role Filter
    if (jobRoleFilter !== 'all') {
      const roleQ = jobRoleFilter.toLowerCase();
      result = result.filter((w) =>
        (w.headline && w.headline.toLowerCase().includes(roleQ)) ||
        ((w as any).preferredJobRoles && (w as any).preferredJobRoles.some((r: string) => r.toLowerCase().includes(roleQ))) ||
        (w.experience && w.experience.some((exp) => exp.designation.toLowerCase().includes(roleQ)))
      );
    }

    // 3. Experience Filter
    if (expFilter !== 'all') {
      result = result.filter((w) => {
        if (expFilter === 'fresher') return w.isFresher || w.experienceYears === 0;
        if (expFilter === '1-3') return w.experienceYears >= 1 && w.experienceYears <= 3;
        if (expFilter === '3-5') return w.experienceYears > 3 && w.experienceYears <= 5;
        if (expFilter === '5+') return w.experienceYears > 5;
        return true;
      });
    }

    // 4. Industry Filter
    if (industryFilter !== 'all') {
      const indQ = industryFilter.toLowerCase();
      result = result.filter((w) =>
        w.preferredIndustries.some((ind) => ind.toLowerCase().includes(indQ)) ||
        (w.experience && w.experience.some((exp) => exp.industry && exp.industry.toLowerCase().includes(indQ)))
      );
    }

    // 5. Department Filter
    if (departmentFilter !== 'all') {
      const deptQ = departmentFilter.toLowerCase();
      result = result.filter((w) =>
        (w.department && w.department.toLowerCase().includes(deptQ)) ||
        ((w as any).preferredDepartments && (w as any).preferredDepartments.some((d: string) => d.toLowerCase().includes(deptQ))) ||
        (w.experience && w.experience.some((exp) => exp.department && exp.department.toLowerCase().includes(deptQ)))
      );
    }

    // 6. Skills Filter
    if (skillFilter !== 'all') {
      const skillQ = skillFilter.toLowerCase();
      result = result.filter((w) =>
        w.skills.some((s) => s.toLowerCase() === skillQ || s.toLowerCase().includes(skillQ))
      );
    }

    // 7. Qualification Filter
    if (qualFilter !== 'all') {
      const qualQ = qualFilter.toLowerCase();
      result = result.filter((w) =>
        w.education.some((edu) =>
          edu.degree.toLowerCase().includes(qualQ) ||
          (edu.level && edu.level.toLowerCase().includes(qualQ)) ||
          edu.field.toLowerCase().includes(qualQ)
        )
      );
    }

    // 8. Gender Filter
    if (genderFilter !== 'all') {
      result = result.filter((w) => {
        const g = ((w as any).gender || '').toUpperCase();
        return g === genderFilter.toUpperCase();
      });
    }

    // 9. Age Filter
    if (ageFilter !== 'all') {
      result = result.filter((w) => {
        if (!w.dob) return true;
        const birthYear = new Date(w.dob).getFullYear();
        const age = new Date().getFullYear() - birthYear;
        if (ageFilter === '18-25') return age >= 18 && age <= 25;
        if (ageFilter === '26-35') return age >= 26 && age <= 35;
        if (ageFilter === '36+') return age > 35;
        return true;
      });
    }

    // 10. Language Filter
    if (langFilter !== 'all') {
      const langQ = langFilter.toLowerCase();
      result = result.filter((w) =>
        w.languages.some((l) => l.toLowerCase().includes(langQ))
      );
    }

    // 11. Assets Filter
    if (assetFilter !== 'all') {
      const assetQ = assetFilter.toLowerCase();
      result = result.filter((w) =>
        (w.bio && w.bio.toLowerCase().includes(assetQ)) ||
        (w.headline && w.headline.toLowerCase().includes(assetQ)) ||
        ((w as any).assets && (w as any).assets.some((a: string) => a.toLowerCase().includes(assetQ)))
      );
    }

    // Availability Filter
    if (availFilter !== 'all') {
      result = result.filter((w) => w.availability === availFilter);
    }

    return result;
  }, [search, jobRoleFilter, expFilter, industryFilter, departmentFilter, skillFilter, qualFilter, genderFilter, ageFilter, langFilter, assetFilter, availFilter, workers]);

  // Count active filters
  const activeFilterCount = [
    jobRoleFilter !== 'all',
    expFilter !== 'all',
    industryFilter !== 'all',
    departmentFilter !== 'all',
    skillFilter !== 'all',
    qualFilter !== 'all',
    genderFilter !== 'all',
    ageFilter !== 'all',
    langFilter !== 'all',
    assetFilter !== 'all',
    availFilter !== 'all',
    Boolean(search)
  ].filter(Boolean).length;

  const resetAllFilters = () => {
    setSearch('');
    setJobRoleFilter('all');
    setExpFilter('all');
    setIndustryFilter('all');
    setDepartmentFilter('all');
    setSkillFilter('all');
    setQualFilter('all');
    setGenderFilter('all');
    setAgeFilter('all');
    setLangFilter('all');
    setAssetFilter('all');
    setAvailFilter('all');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Container */}
      <div className="flex flex-row items-center justify-between flex-wrap gap-4 border-b border-slate-50 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Candidate data search</h1>
          <p className="text-slate-400 text-sm font-semibold mt-1">Find candidates that match your assigned criteria</p>
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
            {filteredWorkers.length.toLocaleString()} FOUND
          </Badge>
        </div>
      </div>

      {/* Main Search & Filter Control Container */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Row 1: Candidate Search Input & Filter Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate name, phone, city, skills, headline..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#f4f5f7] border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 transition-all shadow-inner"
            />
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
            {showFilters ? 'Hide Filters' : 'Show All Filters (11)'}
          </Button>
        </div>

        {/* Row 2: 11 Multi-Criteria Filters Panel */}
        {showFilters && (
          <div className="pt-4 border-t border-slate-100 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 text-left">
            {/* 1. Job Role */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Job Role</label>
              <div className="relative">
                <select
                  value={jobRoleFilter}
                  onChange={(e) => setJobRoleFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50/70 border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="all">All Job Roles</option>
                  {jobRolesList.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 2. Experience */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Experience</label>
              <div className="relative">
                <select
                  value={expFilter}
                  onChange={(e) => setExpFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50/70 border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="all">All Experience</option>
                  <option value="fresher">Fresher (0 yrs)</option>
                  <option value="1-3">1 - 3 Years</option>
                  <option value="3-5">3 - 5 Years</option>
                  <option value="5+">5+ Years</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 3. Industry */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Industry</label>
              <div className="relative">
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50/70 border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="all">All Industries</option>
                  {industriesList.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 4. Department */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Department</label>
              <div className="relative">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50/70 border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="all">All Departments</option>
                  {departmentsList.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 5. Skills */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Skills</label>
              <div className="relative">
                <select
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50/70 border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="all">All Skills</option>
                  {skillsList.map((sk) => (
                    <option key={sk} value={sk}>{sk}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 6. Qualification */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Qualification</label>
              <div className="relative">
                <select
                  value={qualFilter}
                  onChange={(e) => setQualFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50/70 border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="all">All Qualifications</option>
                  {qualList.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 7. Gender */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Gender</label>
              <div className="relative">
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50/70 border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="all">Any Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 8. Age */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Age Range</label>
              <div className="relative">
                <select
                  value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50/70 border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="all">Any Age</option>
                  <option value="18-25">18 - 25 Years</option>
                  <option value="26-35">26 - 35 Years</option>
                  <option value="36+">36+ Years</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 9. Languages */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Languages</label>
              <div className="relative">
                <select
                  value={langFilter}
                  onChange={(e) => setLangFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50/70 border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="all">All Languages</option>
                  {languagesList.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 10. Assets */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Assets</label>
              <div className="relative">
                <select
                  value={assetFilter}
                  onChange={(e) => setAssetFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50/70 border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="all">All Assets</option>
                  {assetsList.map((asset) => (
                    <option key={asset} value={asset}>{asset}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 11. Availability */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Availability</label>
              <div className="relative">
                <select
                  value={availFilter}
                  onChange={(e) => setAvailFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50/70 border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="all">All Availability</option>
                  <option value="immediate">Immediate</option>
                  <option value="15-days">15 Days</option>
                  <option value="30-days">30 Days</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid List of Candidate Cards */}
      {filteredWorkers.length === 0 ? (
        <EmptyState icon={Search} title="No candidates found" description="Try adjusting your filter criteria or keyword search." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredWorkers.map((worker) => (
            <Card key={worker.id} className="p-6 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/60 transition-all flex flex-col justify-between bg-white text-left">
              <div>
                {/* Profile header */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 border border-slate-100 shadow-sm">
                    <AvatarImage src={worker.avatarUrl} alt={worker.fullName} />
                    <AvatarFallback className="text-sm bg-indigo-50 text-indigo-600 font-extrabold">
                      {getInitials(worker.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-slate-800 text-sm truncate leading-tight">{worker.fullName}</h3>
                    <p className="text-[11px] text-slate-400 font-semibold truncate mt-1">{worker.headline || 'Candidate Profile'}</p>
                  </div>
                </div>

                {/* Metrics list */}
                <div className="mt-5 space-y-2.5 text-xs text-slate-500 font-semibold border-t border-slate-50 pt-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{worker.experienceYears} Years Experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{worker.city || worker.preferredLocations[0] || 'Location not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="capitalize">Availability: {worker.availability.replace('-', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 flex items-center justify-center text-[10px] font-bold bg-slate-100 rounded text-slate-500 shrink-0">₹</span>
                    <span>Expected Salary: {formatExpectedSalary(worker.expectedSalaryMin, worker.expectedSalaryMax)}</span>
                  </div>
                </div>

                {/* Skills badges */}
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {worker.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600 border-none font-bold text-[9px] px-2 py-0.5 rounded">
                      {skill}
                    </Badge>
                  ))}
                  {worker.skills.length > 3 && (
                    <Badge variant="outline" className="text-[9px] font-extrabold px-2 py-0.5 rounded border-slate-100 text-slate-400">
                      +{worker.skills.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-2 pt-4 border-t border-slate-50">
                <Button 
                  onClick={() => { setSelectedWorker(worker); setIsDetailsOpen(true); }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-2 text-xs shadow-sm h-auto flex items-center justify-center gap-1.5"
                >
                  <Eye className="h-4 w-4" />
                  View Profile
                </Button>
                {worker.resumeUrl && (
                  <Button variant="outline" size="icon" className="border-slate-200 hover:bg-slate-50 text-slate-400 rounded-xl h-9 w-9 shrink-0 shadow-sm" asChild>
                    <a href={worker.resumeUrl} target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Candidate Profile Details Drawer */}
      <CandidateProfileDrawer
        worker={selectedWorker}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
}
