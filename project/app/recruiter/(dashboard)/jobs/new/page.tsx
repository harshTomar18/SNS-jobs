'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Briefcase,
  Clock,
  Code,
  FileText,
  IndianRupee,
  MapPin,
  Rocket,
  Users,
  Eye,
  GraduationCap,
  Search,
  X,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api';
import { MasterRawItem, jobsApi, masterDataApi, BackendLocation } from '@/lib/scn-api';

const schema = z.object({
  title: z.string().min(2, 'Job title is required'),
  industryId: z.string().min(1, 'Industry is required'),
  locationId: z.string().min(1, 'Location is required'),
  jobRoleId: z.string().optional(),
  skillIds: z.array(z.string()).default([]),
  qualificationIds: z.array(z.string()).default([]),
  wageMin: z.coerce.number().min(0, 'Minimum salary must be positive'),
  wageMax: z.coerce.number().min(0, 'Maximum salary must be positive'),
  shiftType: z.enum(['day', 'night', 'rotational']),
  jobType: z.enum(['full-time', 'part-time', 'contract']),
  headcountRequired: z.coerce.number().min(1, 'Headcount is required'),
  minExperienceYears: z.coerce.number().min(0, 'Minimum experience years must be positive'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  responsibilities: z.string().min(2, 'Add at least one responsibility'),
  requirements: z.string().min(2, 'Add at least one requirement'),
  benefits: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const splitLines = (value?: string) =>
  String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const formatWage = (min: number, max: number) => {
  if (min >= 100000 || max >= 100000) {
    return `₹${(min / 100000).toFixed(1)}L - ₹${(max / 100000).toFixed(1)}L LPA`;
  }
  return `₹${min.toLocaleString()} - ₹${max.toLocaleString()} LPA`;
};

export default function CreateJobPage() {
  const router = useRouter();
  const [skillSearch, setSkillSearch] = useState('');
  const [qualSearch, setQualSearch] = useState('');

  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedLocalityId, setSelectedLocalityId] = useState<string>('');

  const [stateInput, setStateInput] = useState('');
  const [isStateOpen, setIsStateOpen] = useState(false);

  const [cityInput, setCityInput] = useState('');
  const [isCityOpen, setIsCityOpen] = useState(false);

  const [localityInput, setLocalityInput] = useState('');
  const [isLocalityOpen, setIsLocalityOpen] = useState(false);

  const { data: states = [], isLoading: isLoadingStates } = useQuery<string[]>({
    queryKey: ['master', 'locations', 'states'],
    queryFn: () => masterDataApi.getStates(),
  });

  const { data: cities = [], isLoading: isLoadingCities } = useQuery<string[]>({
    queryKey: ['master', 'locations', 'cities', selectedState],
    queryFn: () => masterDataApi.getCities(selectedState),
    enabled: !!selectedState,
  });

  const { data: localities = [], isLoading: isLoadingLocalities } = useQuery<BackendLocation[]>({
    queryKey: ['master', 'locations', 'localities', selectedCity, selectedState],
    queryFn: () => masterDataApi.getLocalities(selectedCity, selectedState),
    enabled: !!selectedCity && !!selectedState,
  });

  useEffect(() => {
    setStateInput(selectedState);
  }, [selectedState]);

  useEffect(() => {
    setCityInput(selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    const loc = localities.find((l: BackendLocation) => String(l.id) === selectedLocalityId);
    setLocalityInput(loc ? loc.locality : '');
  }, [selectedLocalityId, localities]);

  const filteredStates = states.filter((s: string) => {
    if (!stateInput || stateInput === selectedState) return true;
    return s.toLowerCase().includes(stateInput.toLowerCase());
  });
  const filteredCities = cities.filter((c: string) => {
    if (!cityInput || cityInput === selectedCity) return true;
    return c.toLowerCase().includes(cityInput.toLowerCase());
  });
  const filteredLocalities = localities.filter((l: BackendLocation) => {
    const loc = localities.find((loc: BackendLocation) => String(loc.id) === selectedLocalityId);
    if (!localityInput || (loc && l.locality === loc.locality)) return true;
    return l.locality.toLowerCase().includes(localityInput.toLowerCase());
  });

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setStateInput(state);
    setSelectedCity('');
    setCityInput('');
    setSelectedLocalityId('');
    setLocalityInput('');
    setValue('locationId', '', { shouldValidate: true });
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setCityInput(city);
    setSelectedLocalityId('');
    setLocalityInput('');
    setValue('locationId', '', { shouldValidate: true });
  };

  const handleLocalityChange = (locationId: string) => {
    setSelectedLocalityId(locationId);
    const loc = localities.find((l: BackendLocation) => String(l.id) === locationId);
    setLocalityInput(loc ? loc.locality : '');
    setValue('locationId', locationId, { shouldValidate: true });
  };

  const industriesQuery = useQuery({ queryKey: ['master', 'industries'], queryFn: () => masterDataApi.raw('industries') });
  const locationsQuery = useQuery({ queryKey: ['master', 'locations'], queryFn: () => masterDataApi.raw('locations') });
  const jobRolesQuery = useQuery({ queryKey: ['master', 'job-roles'], queryFn: () => masterDataApi.raw('job-roles') });
  const skillsQuery = useQuery({ queryKey: ['master', 'skills'], queryFn: () => masterDataApi.raw('skills') });
  const qualificationsQuery = useQuery({ queryKey: ['master', 'qualifications'], queryFn: () => masterDataApi.raw('qualifications') });
  
  const industries: MasterRawItem[] = industriesQuery.data ?? [];
  const locations: MasterRawItem[] = locationsQuery.data ?? [];
  const jobRoles: MasterRawItem[] = jobRolesQuery.data ?? [];
  const skills: MasterRawItem[] = skillsQuery.data ?? [];
  const qualifications: MasterRawItem[] = qualificationsQuery.data ?? [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      skillIds: [],
      qualificationIds: [],
      headcountRequired: 1,
      minExperienceYears: 0,
      shiftType: 'day',
      jobType: 'full-time',
      responsibilities: 'Own day-to-day responsibilities for the role',
      requirements: 'Relevant experience or qualification for the role',
      benefits: '',
    },
  });

  const formData = watch();
  const selectedSkillIds = formData.skillIds || [];
  const selectedQualificationIds = formData.qualificationIds || [];

  const publishMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const job = await jobsApi.create({
        title: data.title,
        description: data.description,
        industryId: Number(data.industryId),
        locationId: Number(data.locationId),
        jobRoleId: data.jobRoleId ? Number(data.jobRoleId) : undefined,
        skillIds: data.skillIds.map(Number),
        qualificationIds: data.qualificationIds.map(Number),
        wageMin: data.wageMin,
        wageMax: data.wageMax,
        shiftType: data.shiftType,
        jobType: data.jobType,
        headcountRequired: data.headcountRequired,
        minExperienceMonths: data.minExperienceYears * 12,
        responsibilities: splitLines(data.responsibilities),
        requirements: splitLines(data.requirements),
        benefits: splitLines(data.benefits),
      });
      return jobsApi.updateStatus(job.id, 'published');
    },
    onSuccess: () => {
      toast.success('Job published successfully');
      router.push('/recruiter/jobs');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to publish job')),
  });

  const toggleId = (field: 'skillIds' | 'qualificationIds', id: string) => {
    const current = field === 'skillIds' ? selectedSkillIds : selectedQualificationIds;
    setValue(field, current.includes(id) ? current.filter((item) => item !== id) : [...current, id], {
      shouldValidate: true,
    });
  };

  const selectedLocationName = useMemo(() => {
    const loc = locations.find(l => String(l.id) === formData.locationId);
    if (!loc) return '';
    return 'city' in loc ? `${loc.city} - ${loc.locality}` : 'Selected Location';
  }, [formData.locationId, locations]);

  const selectedSkillsNames = useMemo(() => {
    return selectedSkillIds.map(id => {
      const s = skills.find(sk => String(sk.id) === id);
      return s && 'name' in s ? s.name : id;
    });
  }, [selectedSkillIds, skills]);

  const selectedQualificationsNames = useMemo(() => {
    return selectedQualificationIds.map(id => {
      const q = qualifications.find(qu => String(qu.id) === id);
      return q && 'name' in q ? q.name : id;
    });
  }, [selectedQualificationIds, qualifications]);

  const skillSuggestions = useMemo(() => {
    const selectedSet = new Set(selectedSkillIds);
    const query = skillSearch.toLowerCase();
    return skills.filter(skill => {
      const id = String(skill.id);
      if (selectedSet.has(id)) return false;
      if (!query) return true;
      const name = 'name' in skill ? skill.name : '';
      return name.toLowerCase().includes(query);
    });
  }, [skills, selectedSkillIds, skillSearch]);

  const qualSuggestions = useMemo(() => {
    const selectedSet = new Set(selectedQualificationIds);
    const query = qualSearch.toLowerCase();
    return qualifications.filter(q => {
      const id = String(q.id);
      if (selectedSet.has(id)) return false;
      if (!query) return true;
      const name = 'name' in q ? q.name : '';
      return name.toLowerCase().includes(query);
    });
  }, [qualifications, selectedQualificationIds, qualSearch]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      {/* Header Row */}
      <div className="flex flex-row items-center justify-between flex-wrap gap-4 border-b border-slate-50 pb-6 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Create New Job</h1>
          <p className="text-slate-400 text-sm font-semibold mt-1">Fill in the details to post a new job opening instantly</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => publishMutation.mutate(data))}>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Form Sections stacked */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card 1: Basic Details */}
            <Card className="p-6 border border-slate-100 rounded-2xl shadow-sm text-left bg-white space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-sm border-b border-slate-50 pb-3">
                <Briefcase className="h-5 w-5" />
                <span>1. Basic Details</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-700 font-extrabold text-xs">Job Title *</Label>
                <Input id="title" placeholder="e.g. Senior Frontend Engineer" {...register('title')} className="rounded-xl border-slate-200" />
                {errors.title && <p className="text-xs text-red-500 font-bold">{errors.title.message}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-extrabold text-xs">Job Role</Label>
                  <Select onValueChange={(value) => setValue('jobRoleId', value)}>
                    <SelectTrigger className="rounded-xl border-slate-200"><SelectValue placeholder="Select job role" /></SelectTrigger>
                    <SelectContent>
                      {jobRoles.map((role) => (
                        <SelectItem key={role.id} value={String(role.id)}>{'name' in role ? role.name : String(role.id)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headcountRequired" className="text-slate-700 font-extrabold text-xs">Headcount *</Label>
                  <Input id="headcountRequired" type="number" min={1} {...register('headcountRequired')} className="rounded-xl border-slate-200" />
                  {errors.headcountRequired && <p className="text-xs text-red-500 font-bold">{errors.headcountRequired.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minExperienceYears" className="text-slate-700 font-extrabold text-xs">Minimum Experience (Years)</Label>
                  <Input id="minExperienceYears" type="number" min={0} {...register('minExperienceYears')} className="rounded-xl border-slate-200" />
                  {errors.minExperienceYears && <p className="text-xs text-red-500 font-bold">{errors.minExperienceYears.message}</p>}
                </div>
              </div>
            </Card>

            {/* Card 2: Location & Industry */}
            <Card className="p-6 border border-slate-100 rounded-2xl shadow-sm text-left bg-white space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-sm border-b border-slate-50 pb-3">
                <MapPin className="h-5 w-5" />
                <span>2. Location & Industry</span>
              </div>
              <div className="space-y-4">
                {/* Industry Selection */}
                <div className="space-y-2 max-w-md">
                  <Label className="text-slate-700 font-extrabold text-xs">Industry *</Label>
                  <Select onValueChange={(value) => setValue('industryId', value, { shouldValidate: true })}>
                    <SelectTrigger className="rounded-xl border-slate-200"><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry.id} value={String(industry.id)}>{'name' in industry ? industry.name : String(industry.id)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.industryId && <p className="text-xs text-red-500 font-bold">{errors.industryId.message}</p>}
                </div>

                <Separator className="my-2 bg-slate-50" />

                {/* Location Selection Grid */}
                <div className="space-y-2">
                  <Label className="text-slate-700 font-extrabold text-xs">Location *</Label>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* State */}
                    <div className="space-y-1.5 relative">
                      <Label className="text-[10px] text-slate-400 font-bold uppercase">State</Label>
                      <div className="relative">
                        <input
                          type="text"
                          autoComplete="off"
                          placeholder="Type or select state..."
                          className="w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 h-10 px-3.5 pr-10 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                          value={stateInput}
                          onChange={(e) => {
                            setStateInput(e.target.value);
                            setIsStateOpen(true);
                          }}
                          onFocus={() => setIsStateOpen(true)}
                          onBlur={() => {
                            setTimeout(() => {
                              setIsStateOpen(false);
                              const matched = states.find((s: string) => s.toLowerCase() === stateInput.toLowerCase());
                              if (matched) {
                                handleStateChange(matched);
                              } else {
                                setStateInput(selectedState);
                              }
                            }, 200);
                          }}
                        />
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-slate-400 pointer-events-none" />
                      </div>
                      {isStateOpen && (
                        <div className="absolute left-0 right-0 top-[66px] z-50 max-h-[200px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">
                          {isLoadingStates ? (
                            <div className="flex items-center justify-center p-2.5">
                              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            </div>
                          ) : filteredStates.length === 0 ? (
                            <div className="text-xs text-slate-400 p-2.5 text-center">No states found</div>
                          ) : (
                            filteredStates.map((state: string) => (
                              <button
                                key={state}
                                type="button"
                                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                onMouseDown={() => handleStateChange(state)}
                              >
                                {state}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* City */}
                    <div className="space-y-1.5 relative">
                      <Label className="text-[10px] text-slate-400 font-bold uppercase">City</Label>
                      <div className="relative">
                        <input
                          type="text"
                          autoComplete="off"
                          placeholder={selectedState ? "Type or select city..." : "Choose state first"}
                          disabled={!selectedState}
                          className="w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 h-10 px-3.5 pr-10 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm disabled:opacity-50 disabled:bg-slate-100/50"
                          value={cityInput}
                          onChange={(e) => {
                            setCityInput(e.target.value);
                            setIsCityOpen(true);
                          }}
                          onFocus={() => setIsCityOpen(true)}
                          onBlur={() => {
                            setTimeout(() => {
                              setIsCityOpen(false);
                              const matched = cities.find((c: string) => c.toLowerCase() === cityInput.toLowerCase());
                              if (matched) {
                                handleCityChange(matched);
                              } else {
                                setCityInput(selectedCity);
                              }
                            }, 200);
                          }}
                        />
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-slate-400 pointer-events-none" />
                      </div>
                      {isCityOpen && selectedState && (
                        <div className="absolute left-0 right-0 top-[66px] z-50 max-h-[200px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">
                          {isLoadingCities ? (
                            <div className="flex items-center justify-center p-2.5">
                              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            </div>
                          ) : filteredCities.length === 0 ? (
                            <div className="text-xs text-slate-400 p-2.5 text-center">No cities found</div>
                          ) : (
                            filteredCities.map((city: string) => (
                              <button
                                key={city}
                                type="button"
                                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                onMouseDown={() => handleCityChange(city)}
                              >
                                {city}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Locality */}
                    <div className="space-y-1.5 relative">
                      <Label className="text-[10px] text-slate-400 font-bold uppercase">Locality</Label>
                      <div className="relative">
                        <input
                          type="text"
                          autoComplete="off"
                          placeholder={selectedCity ? "Type or select locality..." : "Choose city first"}
                          disabled={!selectedCity}
                          className="w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 h-10 px-3.5 pr-10 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm disabled:opacity-50 disabled:bg-slate-100/50"
                          value={localityInput}
                          onChange={(e) => {
                            setLocalityInput(e.target.value);
                            setIsLocalityOpen(true);
                          }}
                          onFocus={() => setIsLocalityOpen(true)}
                          onBlur={() => {
                            setTimeout(() => {
                              setIsLocalityOpen(false);
                              const matched = localities.find((l: BackendLocation) => l.locality.toLowerCase() === localityInput.toLowerCase());
                              if (matched) {
                                handleLocalityChange(String(matched.id));
                              } else {
                                const activeLoc = localities.find((l: BackendLocation) => String(l.id) === selectedLocalityId);
                                setLocalityInput(activeLoc ? activeLoc.locality : '');
                              }
                            }, 200);
                          }}
                        />
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-slate-400 pointer-events-none" />
                      </div>
                      {isLocalityOpen && selectedCity && (
                        <div className="absolute left-0 right-0 top-[66px] z-50 max-h-[200px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">
                          {isLoadingLocalities ? (
                            <div className="flex items-center justify-center p-2.5">
                              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            </div>
                          ) : filteredLocalities.length === 0 ? (
                            <div className="text-xs text-slate-400 p-2.5 text-center">No localities found</div>
                          ) : (
                            filteredLocalities.map((loc: BackendLocation) => (
                              <button
                                key={loc.id}
                                type="button"
                                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                onMouseDown={() => handleLocalityChange(String(loc.id))}
                              >
                                {loc.locality}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {errors.locationId && <p className="text-xs text-red-500 font-bold mt-1">{errors.locationId.message}</p>}
                </div>
              </div>
            </Card>

            {/* Card 3: Skills & Qualifications */}
            <Card className="p-6 border border-slate-100 rounded-2xl shadow-sm text-left bg-white space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-sm border-b border-slate-50 pb-3">
                <Code className="h-5 w-5" />
                <span>3. Skills & Qualifications</span>
              </div>
              <div className="space-y-3">
                <Label className="text-slate-700 font-extrabold text-xs">Required Skills</Label>

                {/* Render Selected Skills as dismissible badges */}
                {selectedSkillIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50/50 border border-slate-100 rounded-xl">
                    {selectedSkillIds.map((id) => {
                      const skill = skills.find((s) => String(s.id) === id);
                      const name = skill && 'name' in skill ? skill.name : id;
                      return (
                        <Badge 
                          key={id} 
                          className="bg-indigo-50 hover:bg-indigo-100/80 text-indigo-600 border-none font-bold text-xs py-1 px-2.5 rounded-full flex items-center gap-1.5 shadow-sm"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => toggleId('skillIds', id)}
                            className="hover:bg-indigo-200/50 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {/* Search Input Box */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search and add skills..."
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    className="w-full bg-[#f4f5f7] border border-transparent rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 transition-all shadow-inner"
                  />
                </div>

                {/* Suggestions List */}
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border border-slate-100/80 p-3 rounded-xl bg-slate-50/30">
                  {skillSuggestions.length > 0 ? (
                    skillSuggestions.map((skill) => {
                      const id = String(skill.id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleId('skillIds', id)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all hover:border-slate-300"
                        >
                          + {'name' in skill ? skill.name : id}
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">No matching skills found.</span>
                  )}
                </div>
              </div>
              <Separator className="my-2 bg-slate-50" />
              <div className="space-y-3">
                <Label className="text-slate-700 font-extrabold text-xs">Qualifications</Label>

                {/* Render Selected Qualifications as dismissible badges */}
                {selectedQualificationIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50/50 border border-slate-100 rounded-xl">
                    {selectedQualificationIds.map((id) => {
                      const qualification = qualifications.find((q) => String(q.id) === id);
                      const name = qualification && 'name' in qualification ? qualification.name : id;
                      return (
                        <Badge 
                          key={id} 
                          className="bg-indigo-50 hover:bg-indigo-100/80 text-indigo-600 border-none font-bold text-xs py-1 px-2.5 rounded-full flex items-center gap-1.5 shadow-sm"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => toggleId('qualificationIds', id)}
                            className="hover:bg-indigo-200/50 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {/* Search Input Box */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search and add qualifications..."
                    value={qualSearch}
                    onChange={(e) => setQualSearch(e.target.value)}
                    className="w-full bg-[#f4f5f7] border border-transparent rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 transition-all shadow-inner"
                  />
                </div>

                {/* Suggestions List */}
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border border-slate-100/80 p-3 rounded-xl bg-slate-50/30">
                  {qualSuggestions.length > 0 ? (
                    qualSuggestions.map((qualification: any) => {
                      const id = String(qualification.id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleId('qualificationIds', id)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all hover:border-slate-300"
                        >
                          + {'name' in qualification ? qualification.name : id}
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">No matching qualifications found.</span>
                  )}
                </div>
              </div>
            </Card>

            {/* Card 4: Salary & Shift */}
            <Card className="p-6 border border-slate-100 rounded-2xl shadow-sm text-left bg-white space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-sm border-b border-slate-50 pb-3">
                <IndianRupee className="h-5 w-5" />
                <span>4. Salary, Shifts & Types</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="wageMin" className="text-slate-700 font-extrabold text-xs">Minimum Wage (Annual)*</Label>
                  <Input id="wageMin" type="number" placeholder="500000" {...register('wageMin')} className="rounded-xl border-slate-200" />
                  {errors.wageMin && <p className="text-xs text-red-500 font-bold">{errors.wageMin.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wageMax" className="text-slate-700 font-extrabold text-xs">Maximum Wage (Annual)*</Label>
                  <Input id="wageMax" type="number" placeholder="1500000" {...register('wageMax')} className="rounded-xl border-slate-200" />
                  {errors.wageMax && <p className="text-xs text-red-500 font-bold">{errors.wageMax.message}</p>}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-extrabold text-xs">Shift *</Label>
                  <Select defaultValue="day" onValueChange={(value: 'day' | 'night' | 'rotational') => setValue('shiftType', value)}>
                    <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day Shift</SelectItem>
                      <SelectItem value="night">Night Shift</SelectItem>
                      <SelectItem value="rotational">Rotational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-extrabold text-xs">Job Type *</Label>
                  <Select defaultValue="full-time" onValueChange={(value: 'full-time' | 'part-time' | 'contract') => setValue('jobType', value)}>
                    <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full Time</SelectItem>
                      <SelectItem value="part-time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Card 5: Job Detail Sections */}
            <Card className="p-6 border border-slate-100 rounded-2xl shadow-sm text-left bg-white space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-sm border-b border-slate-50 pb-3">
                <FileText className="h-5 w-5" />
                <span>5. Job Description Details</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-700 font-extrabold text-xs">General Description *</Label>
                <Textarea id="description" rows={5} placeholder="Describe the role details..." {...register('description')} className="rounded-xl border-slate-200" />
                {errors.description && <p className="text-xs text-red-500 font-bold">{errors.description.message}</p>}
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="responsibilities" className="text-slate-700 font-extrabold text-xs">Responsibilities (One per line)*</Label>
                  <Textarea id="responsibilities" rows={6} placeholder="e.g. Build UI pages" {...register('responsibilities')} className="rounded-xl border-slate-200" />
                  {errors.responsibilities && <p className="text-xs text-red-500 font-bold">{errors.responsibilities.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirements" className="text-slate-700 font-extrabold text-xs">Requirements (One per line)*</Label>
                  <Textarea id="requirements" rows={6} placeholder="e.g. 3 years NextJS exp" {...register('requirements')} className="rounded-xl border-slate-200" />
                  {errors.requirements && <p className="text-xs text-red-500 font-bold">{errors.requirements.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="benefits" className="text-slate-700 font-extrabold text-xs">Benefits (One per line)</Label>
                  <Textarea id="benefits" rows={6} placeholder="e.g. Medical insurance" {...register('benefits')} className="rounded-xl border-slate-200" />
                </div>
              </div>
            </Card>

          </div>

          {/* Right Column: Sticky Live Preview & Action panel */}
          <div className="space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
              
              {/* Card A: Interactive Live Preview */}
              <Card className="p-6 border border-slate-100 rounded-2xl shadow-sm bg-white text-left space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-xs border-b border-slate-50 pb-3">
                  <Eye className="h-4 w-4" />
                  <span>Job Listing Live Preview</span>
                </div>
                
                <div className="space-y-3.5 pt-1">
                  <span className="bg-indigo-50 text-indigo-600 border-none font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                    {formData.jobType}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-800 leading-tight">
                    {formData.title || 'Job Title Title'}
                  </h3>

                  <div className="space-y-2 text-xs text-slate-500 font-semibold border-t border-b border-slate-50 py-3.5">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{selectedLocationName || 'Location not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="capitalize">{formData.shiftType} Shift</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{formData.headcountRequired || 1} openings available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4 flex items-center justify-center text-[10px] font-bold bg-slate-100 rounded text-slate-500 shrink-0">₹</span>
                      <span>Salary: {formatWage(formData.wageMin || 0, formData.wageMax || 0)}</span>
                    </div>
                  </div>

                  {/* Summary / Description preview */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role Overview</span>
                    <p className="text-xs text-slate-600 leading-relaxed truncate-3-lines mt-1">
                      {formData.description || 'Description details will appear here as you type...'}
                    </p>
                  </div>

                  {/* Skills/Qualifications previews */}
                  {selectedSkillsNames.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Skills</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSkillsNames.map((name: string) => (
                          <Badge key={name} variant="secondary" className="bg-slate-100/80 hover:bg-slate-100 text-slate-600 border-none font-bold text-xs px-2.5 py-1 rounded-lg shadow-sm">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedQualificationsNames.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Qualifications</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedQualificationsNames.map((name: string) => (
                          <Badge key={name} variant="outline" className="border-slate-150 text-slate-500 font-bold text-xs px-2.5 py-1 rounded-lg shadow-sm">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Card B: Action Panel */}
              <Card className="p-5 border border-slate-100 rounded-2xl shadow-sm bg-white text-left space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submit Actions</span>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Make sure you have completed the details. Once published, your listing goes live instantly on SCN Jobs.</p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <Button 
                    type="submit" 
                    disabled={publishMutation.isPending} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-3 text-xs shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all h-auto flex items-center justify-center gap-1.5"
                  >
                    <Rocket className="h-4 w-4" />
                    {publishMutation.isPending ? 'Publishing...' : 'Publish Job'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.push('/recruiter/jobs')}
                    className="w-full border-slate-200 hover:bg-slate-50 hover:text-slate-700 text-slate-500 font-bold rounded-xl py-3 text-xs h-auto shadow-sm"
                  >
                    Cancel / Discard
                  </Button>
                </div>
              </Card>

            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
