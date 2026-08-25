'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  ChevronRight,
  Check
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api';
import { MasterRawItem, jobsApi, masterDataApi, BackendLocation } from '@/lib/scn-api';

const BENEFITS_OPTIONS = [
  'Cab',
  'Meal',
  'Insurance',
  'PF',
  'Medical Benefits',
  'Accommodation',
  'Full Accommodation',
];

const ASSETS_OPTIONS = [
  'Bike/Car',
  'LISCENCE',
  'ADHAR CARD',
  'PAN CARD',
  'LAPTOP',
];

const QUAL_CATEGORY_LABELS: Record<string, string> = {
  TEN: '10th Pass',
  TWELVE: '12th Pass',
  DIPLOMA: 'Diploma',
  GRADUATE: 'Graduate',
  POST_GRADUATE: 'Post Graduate',
  ANY: 'Other / Any',
};
const QUAL_CATEGORY_ORDER = ['TEN', 'TWELVE', 'DIPLOMA', 'GRADUATE', 'POST_GRADUATE', 'ANY'];

const schema = z.object({
  jobRoleName: z.string().min(2, 'Job role / title is required'),
  industryId: z.string().min(1, 'Industry is required'),
  functionId: z.string().optional(),
  functionName: z.string().optional(),
  locationId: z.string().min(1, 'Location is required'),
  jobRoleId: z.string().optional(),
  skillIds: z.array(z.string()).default([]),
  qualificationIds: z.array(z.string()).default([]),
  wageMin: z.coerce.number().min(0, 'Minimum salary must be positive'),
  wageMax: z.coerce.number().min(0, 'Maximum salary must be positive'),
  wageType: z.enum(['monthly', 'annual', 'daily']).default('monthly'),
  workingDays: z.coerce.number().min(1).max(7).default(5),
  workingStatus: z.string().optional(),
  gender: z.enum(['ANY', 'MALE', 'FEMALE']).default('ANY'),
  freshersOnly: z.boolean().default(false),
  shiftType: z.enum(['day', 'night', 'rotational']),
  jobType: z.enum(['full-time', 'part-time', 'contract']),
  headcountRequired: z.coerce.number().min(1, 'Headcount is required'),
  minExperienceYears: z.coerce.number().min(0, 'Minimum experience years must be positive'),
  maxExperienceYears: z.coerce.number().min(0).optional(),
  benefitNames: z.array(z.string()).default([]),
  assetNames: z.array(z.string()).default([]),
  languageIds: z.array(z.string()).default([]),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  highlights: z.string().optional(),
  responsibilities: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const splitLines = (value?: string) =>
  String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const formatWage = (min: number, max: number, period = 'monthly') => {
  const suffix = period === 'daily' ? 'per day' : period === 'annual' ? 'per annum' : 'per month';
  if (min >= 100000 || max >= 100000) {
    return `₹${(min / 100000).toFixed(1)} Lakh - ₹${(max / 100000).toFixed(1)} Lakh ${suffix}`;
  }
  return `₹${min.toLocaleString()} - ₹${max.toLocaleString()} ${suffix}`;
};

const EMPTY_ARRAY: any[] = [];

export default function CreateJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editJobId = searchParams?.get('id') || null;
  const isEditing = Boolean(editJobId);
  const [skillSearch, setSkillSearch] = useState('');
  const [qualSearch, setQualSearch] = useState('');
  const [langSearch, setLangSearch] = useState('');
  const [selectedQualLevel, setSelectedQualLevel] = useState<string>('ALL');

  const [jobRoleSearch, setJobRoleSearch] = useState('');
  const [isJobRoleOpen, setIsJobRoleOpen] = useState(false);

  const [functionSearch, setFunctionSearch] = useState('');
  const [isFunctionOpen, setIsFunctionOpen] = useState(false);

  const [industrySearch, setIndustrySearch] = useState('');
  const [isIndustryOpen, setIsIndustryOpen] = useState(false);

  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedLocalityId, setSelectedLocalityId] = useState<string>('');

  const [stateInput, setStateInput] = useState('');
  const [isStateOpen, setIsStateOpen] = useState(false);

  const [cityInput, setCityInput] = useState('');
  const [isCityOpen, setIsCityOpen] = useState(false);

  const [localityInput, setLocalityInput] = useState('');
  const [isLocalityOpen, setIsLocalityOpen] = useState(false);

  const [benefitSearch, setBenefitSearch] = useState('');
  const [isBenefitOpen, setIsBenefitOpen] = useState(false);

  const [assetSearch, setAssetSearch] = useState('');
  const [isAssetOpen, setIsAssetOpen] = useState(false);

  const { data: statesData, isLoading: isLoadingStates } = useQuery<string[]>({
    queryKey: ['master', 'locations', 'states'],
    queryFn: () => masterDataApi.getStates(),
  });
  const states = statesData ?? EMPTY_ARRAY;

  const { data: citiesData, isLoading: isLoadingCities } = useQuery<string[]>({
    queryKey: ['master', 'locations', 'cities', selectedState],
    queryFn: () => masterDataApi.getCities(selectedState),
    enabled: !!selectedState,
  });
  const cities = citiesData ?? EMPTY_ARRAY;

  const { data: localitiesData, isLoading: isLoadingLocalities } = useQuery<BackendLocation[]>({
    queryKey: ['master', 'locations', 'localities', selectedCity, selectedState],
    queryFn: () => masterDataApi.getLocalities(selectedCity, selectedState),
    enabled: !!selectedCity && !!selectedState,
  });
  const localities = localitiesData ?? EMPTY_ARRAY;

  const filteredStates = states.filter((s: string) => {
    if (!stateInput || stateInput === selectedState) return true;
    return s.toLowerCase().includes(stateInput.toLowerCase());
  });
  const filteredCities = cities.filter((c: string) => {
    if (!cityInput || cityInput === selectedCity) return true;
    return c.toLowerCase().includes(cityInput.toLowerCase());
  });
  const filteredLocalities = localities.filter((l: BackendLocation) => {
    const loc = localities.find((locItem: BackendLocation) => String(locItem.id) === selectedLocalityId);
    if (!localityInput || (loc && l.locality === loc.locality)) return true;
    return l.locality.toLowerCase().includes(localityInput.toLowerCase());
  });

  const handleStateChange = (state: string) => {
    if (state === selectedState) return;
    setSelectedState(state);
    setStateInput(state);
    setSelectedCity('');
    setCityInput('');
    setSelectedLocalityId('');
    setLocalityInput('');
    setValue('locationId', '', { shouldValidate: true });
  };

  const handleCityChange = (city: string) => {
    if (city === selectedCity) return;
    setSelectedCity(city);
    setCityInput(city);
    setSelectedLocalityId('');
    setLocalityInput('');
    setValue('locationId', '', { shouldValidate: true });
  };

  const handleLocalityChange = (locationId: string) => {
    if (locationId === selectedLocalityId) return;
    setSelectedLocalityId(locationId);
    const loc = localities.find((l: BackendLocation) => String(l.id) === locationId);
    setLocalityInput(loc ? loc.locality : '');
    setValue('locationId', locationId, { shouldValidate: true });
  };

  const industriesQuery = useQuery({ queryKey: ['master', 'industries'], queryFn: () => masterDataApi.raw('industries') });
  const functionsQuery = useQuery({ queryKey: ['master', 'functions'], queryFn: () => masterDataApi.raw('functions') });
  const locationsQuery = useQuery({ queryKey: ['master', 'locations'], queryFn: () => masterDataApi.raw('locations') });
  const jobRolesQuery = useQuery({ queryKey: ['master', 'job-roles'], queryFn: () => masterDataApi.raw('job-roles') });
  const skillsQuery = useQuery({ queryKey: ['master', 'skills'], queryFn: () => masterDataApi.raw('skills') });
  const qualificationsQuery = useQuery({ queryKey: ['master', 'qualifications'], queryFn: () => masterDataApi.raw('qualifications') });
  const languagesQuery = useQuery({ queryKey: ['master', 'languages'], queryFn: () => masterDataApi.raw('languages') });
  const benefitsQuery = useQuery({ queryKey: ['master', 'benefits'], queryFn: () => masterDataApi.raw('benefits') });
  const assetsQuery = useQuery({ queryKey: ['master', 'assets'], queryFn: () => masterDataApi.raw('assets') });

  const industries: MasterRawItem[] = industriesQuery.data ?? EMPTY_ARRAY;
  const functions: MasterRawItem[] = functionsQuery.data ?? EMPTY_ARRAY;
  const locations: MasterRawItem[] = locationsQuery.data ?? EMPTY_ARRAY;
  const jobRoles: MasterRawItem[] = jobRolesQuery.data ?? EMPTY_ARRAY;
  const skills: MasterRawItem[] = Array.isArray(skillsQuery.data) ? skillsQuery.data : EMPTY_ARRAY;
  const languages: MasterRawItem[] = Array.isArray(languagesQuery.data) ? languagesQuery.data : EMPTY_ARRAY;
  const rawQuals = qualificationsQuery.data;
  const qualifications: MasterRawItem[] = useMemo(() => {
    return Array.isArray(rawQuals)
      ? rawQuals
      : rawQuals && typeof rawQuals === 'object'
        ? Object.values(rawQuals).flat()
        : EMPTY_ARRAY;
  }, [rawQuals]);

  const rawBenefitsData = benefitsQuery.data;
  const benefitsOptionsList: string[] = useMemo(() => {
    if (Array.isArray(rawBenefitsData) && rawBenefitsData.length > 0) {
      const names = rawBenefitsData.map((b: any) => (typeof b === 'string' ? b : b.name || b.title || String(b.id))).filter(Boolean);
      return Array.from(new Set([...names, ...BENEFITS_OPTIONS]));
    }
    return BENEFITS_OPTIONS;
  }, [rawBenefitsData]);

  const rawAssetsData = assetsQuery.data;
  const assetsOptionsList: string[] = useMemo(() => {
    if (Array.isArray(rawAssetsData) && rawAssetsData.length > 0) {
      const names = rawAssetsData.map((a: any) => (typeof a === 'string' ? a : a.name || a.title || String(a.id))).filter(Boolean);
      return Array.from(new Set([...names, ...ASSETS_OPTIONS]));
    }
    return ASSETS_OPTIONS;
  }, [rawAssetsData]);

  const editJobQuery = useQuery({
    queryKey: ['recruiter-job-edit', editJobId],
    queryFn: () => jobsApi.get(editJobId!),
    enabled: !!editJobId,
  });
  const existingJob = editJobQuery.data;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      jobRoleName: '',
      functionId: '',
      functionName: '',
      workingStatus: 'IMMEDIATE_JOINER',
      wageMin: 0,
      wageMax: 0,
      skillIds: [],
      qualificationIds: [],
      languageIds: [],
      benefitNames: [],
      assetNames: [],
      wageType: 'monthly',
      workingDays: 5,
      gender: 'ANY',
      freshersOnly: false,
      headcountRequired: 1,
      minExperienceYears: 0,
      maxExperienceYears: undefined,
      shiftType: 'day',
      jobType: 'full-time',
      responsibilities: '',
      requirements: '',
      benefits: '',
    },
  });

  const formData = watch();
  const selectedSkillIds = formData.skillIds || [];
  const selectedQualificationIds = formData.qualificationIds || [];
  const selectedLanguageIds = formData.languageIds || [];

  useEffect(() => {
    if (existingJob) {
      const roleName = (existingJob as any).jobRoleName || existingJob.title || (existingJob as any).jobRole?.name || '';
      setValue('jobRoleName', roleName);
      setJobRoleSearch(roleName);
      if (existingJob.jobRoleId) setValue('jobRoleId', String(existingJob.jobRoleId));

      if (existingJob.industryId) setValue('industryId', String(existingJob.industryId));
      const indName = (existingJob as any).industryName || existingJob.industry || (existingJob as any).industry?.name || '';
      if (indName) setIndustrySearch(indName);

      if (existingJob.functionId) setValue('functionId', String(existingJob.functionId));
      const funcName = (existingJob as any).functionName || existingJob.departmentName || existingJob.department || '';
      if (funcName) {
        setValue('functionName', funcName);
        setFunctionSearch(funcName);
      }

      if (existingJob.locationId) {
        setValue('locationId', String(existingJob.locationId));
        const loc: any = locations.find((l: any) => String(l.id) === String(existingJob.locationId));
        if (loc) {
          if (loc.state) {
            setSelectedState(loc.state);
            setStateInput(loc.state);
          }
          if (loc.city) {
            setSelectedCity(loc.city);
            setCityInput(loc.city);
          }
          if (loc.locality) {
            setSelectedLocalityId(String(loc.id));
            setLocalityInput(loc.locality);
          }
        }
      }

      setValue('description', existingJob.description || '');
      const respStr = Array.isArray(existingJob.responsibilities)
        ? existingJob.responsibilities.join('\n')
        : String(existingJob.responsibilities || '');
      setValue('responsibilities', respStr);

      const reqStr = Array.isArray(existingJob.requirements)
        ? existingJob.requirements.join('\n')
        : String(existingJob.requirements || '');
      setValue('requirements', reqStr);

      const hlStr = Array.isArray((existingJob as any).highlights)
        ? (existingJob as any).highlights.join('\n')
        : String((existingJob as any).highlights || '');
      setValue('highlights', hlStr);

      const openings = (existingJob as any).openings || (existingJob as any).headcountRequired || 1;
      setValue('headcountRequired', Number(openings));

      const gender = (existingJob as any).genderPreference || (existingJob as any).gender || 'ANY';
      setValue('gender', gender as any);

      const isFresher = Boolean(existingJob.freshersOnly || (existingJob as any).isFresherFriendly);
      setValue('freshersOnly', isFresher);

      const expMinM = (existingJob as any).minExperienceMonths !== undefined
        ? (existingJob as any).minExperienceMonths
        : ((existingJob as any).experienceMin !== undefined ? (existingJob as any).experienceMin * 12 : 0);

      const expMaxM = (existingJob as any).maxExperienceMonths !== undefined
        ? (existingJob as any).maxExperienceMonths
        : ((existingJob as any).experienceMax !== undefined ? (existingJob as any).experienceMax * 12 : undefined);

      setValue('minExperienceYears', Math.floor((expMinM || 0) / 12));
      if (expMaxM !== undefined && expMaxM !== null) {
        setValue('maxExperienceYears', Math.floor(expMaxM / 12));
      }

      const wMin = existingJob.wageMin || existingJob.salaryMin || (existingJob as any).monthlyWageMin || (existingJob as any).dailyWageMin || (existingJob as any).yearlyWageMin || 0;
      const wMax = existingJob.wageMax || existingJob.salaryMax || (existingJob as any).monthlyWageMax || (existingJob as any).dailyWageMax || (existingJob as any).yearlyWageMax || wMin;
      const wType = (existingJob as any).wageType || (existingJob as any).wagePeriod || 'monthly';

      setValue('wageMin', Number(wMin));
      setValue('wageMax', Number(wMax));
      setValue('wageType', wType as any);

      if ((existingJob as any).workingStatus) setValue('workingStatus', (existingJob as any).workingStatus);

      const rawWorkingDays = (existingJob as any).workingDays;
      if (rawWorkingDays) {
        if (String(rawWorkingDays).includes('6') || String(rawWorkingDays).toUpperCase().includes('SIX')) {
          setValue('workingDays', 6);
        } else {
          setValue('workingDays', 5);
        }
      }

      const shiftVal = (existingJob as any).shift || (existingJob as any).shiftType || 'day';
      setValue('shiftType', String(shiftVal).toLowerCase() as any);

      const rawJobType = String(existingJob.jobType || 'full-time').toLowerCase();
      const formattedJobType = rawJobType.includes('part') ? 'part-time' : rawJobType.includes('contract') ? 'contract' : 'full-time';
      setValue('jobType', formattedJobType as any);

      if (existingJob.skills && Array.isArray(existingJob.skills)) {
        const sIds = skills
          .filter((s: any) => existingJob.skills.includes(s.name) || existingJob.skills.includes(String(s.id)))
          .map((s: any) => String(s.id));
        if (sIds.length > 0) {
          setValue('skillIds', sIds);
        } else {
          const rawSkillIds = existingJob.skills.map((s: any) => typeof s === 'object' ? String(s.id) : String(s)).filter(Boolean);
          setValue('skillIds', rawSkillIds);
        }
      }

      if (existingJob.qualifications && Array.isArray(existingJob.qualifications)) {
        const qIds = qualifications
          .filter((q: any) => (existingJob.qualifications as any).includes(q.name) || (existingJob.qualifications as any).includes(String(q.id)))
          .map((q: any) => String(q.id));
        if (qIds.length > 0) {
          setValue('qualificationIds', qIds);
        } else {
          const rawQualIds = (existingJob.qualifications as any).map((q: any) => typeof q === 'object' ? String(q.id) : String(q)).filter(Boolean);
          setValue('qualificationIds', rawQualIds);
        }
      }

      if ((existingJob as any).languageIds && Array.isArray((existingJob as any).languageIds)) {
        setValue('languageIds', (existingJob as any).languageIds.map(String));
      } else if (existingJob.languages && Array.isArray(existingJob.languages)) {
        const lIds = languages
          .filter((l: any) => (existingJob.languages as any).includes(l.name) || (existingJob.languages as any).includes(String(l.id)))
          .map((l: any) => String(l.id));
        if (lIds.length > 0) {
          setValue('languageIds', lIds);
        } else {
          const rawLangIds = existingJob.languages.map((l: any) => typeof l === 'object' ? String(l.id) : String(l)).filter(Boolean);
          setValue('languageIds', rawLangIds);
        }
      }

      const bNames = (existingJob as any).benefitNames || (existingJob as any).benefits || [];
      if (Array.isArray(bNames)) {
        const parsedBenefits = bNames.map((b: any) => typeof b === 'string' ? b : b?.name).filter(Boolean);
        setValue('benefitNames', parsedBenefits);
      }

      const aNames = (existingJob as any).assetNames || (existingJob as any).assets || [];
      if (Array.isArray(aNames)) {
        const parsedAssets = aNames.map((a: any) => typeof a === 'string' ? a : a?.name).filter(Boolean);
        setValue('assetNames', parsedAssets);
      }
    }
  }, [existingJob, locations, skills, qualifications, setValue]);

  const publishMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const selectedRole = jobRoles.find((r: any) => String(r.id) === data.jobRoleId);
      const roleName = data.jobRoleName || (selectedRole && 'name' in selectedRole ? selectedRole.name : jobRoleSearch);
      const selectedIndustry = industries.find((i: any) => String(i.id) === data.industryId);
      const indName = selectedIndustry && 'name' in selectedIndustry ? selectedIndustry.name : industrySearch;
      const selectedFunction = functions.find((f: any) => String(f.id) === data.functionId);
      const funcName = data.functionName || (selectedFunction && 'name' in selectedFunction ? selectedFunction.name : functionSearch);

        const selectedLanguageNames = data.languageIds && data.languageIds.length > 0
          ? data.languageIds.map((id) => {
              const lang = languages.find((l: any) => String(l.id) === id);
              return lang && 'name' in lang ? lang.name : id;
            }).filter(Boolean)
          : undefined;

        const cleanSkillIds = (data.skillIds || [])
          .map((id: any) => Number(id))
          .filter((n: number) => !isNaN(n) && n > 0);

        const cleanQualIds = (data.qualificationIds || [])
          .map((id: any) => Number(id))
          .filter((n: number) => !isNaN(n) && n > 0);

        const cleanLangIds = (data.languageIds || [])
          .map((id: any) => Number(id))
          .filter((n: number) => !isNaN(n) && n > 0);

        const payload = {
          jobRoleName: roleName,
          description: data.description,
          industryId: Number(data.industryId),
          industryName: indName || undefined,
          functionId: data.functionId ? Number(data.functionId) : undefined,
          functionName: funcName || undefined,
          locationId: Number(data.locationId),
          jobRoleId: data.jobRoleId ? Number(data.jobRoleId) : undefined,
          skillIds: cleanSkillIds.length > 0 ? cleanSkillIds : undefined,
          qualificationIds: cleanQualIds.length > 0 ? cleanQualIds : undefined,
          languageIds: cleanLangIds.length > 0 ? cleanLangIds : undefined,
          languages: selectedLanguageNames,
          wageMin: data.wageMin,
          wageMax: data.wageMax,
          wageType: data.wageType,
          workingDays: data.workingDays,
          workingStatus: data.workingStatus || undefined,
          gender: data.gender,
          freshersOnly: data.freshersOnly,
          shiftType: data.shiftType,
          jobType: data.jobType,
          headcountRequired: data.headcountRequired,
          minExperienceMonths: data.freshersOnly ? undefined : (data.minExperienceYears !== undefined ? data.minExperienceYears * 12 : undefined),
          maxExperienceMonths: data.freshersOnly ? undefined : (data.maxExperienceYears !== undefined ? data.maxExperienceYears * 12 : undefined),
          benefitNames: data.benefitNames,
          assetNames: data.assetNames,
          responsibilities: splitLines(data.responsibilities),
          requirements: splitLines(data.requirements),
          highlights: data.highlights ? splitLines(data.highlights) : (data.benefitNames && data.benefitNames.length > 0 ? data.benefitNames : undefined),
          benefits: splitLines(data.benefits),
        };

      if (isEditing && editJobId) {
        return jobsApi.update(editJobId, payload);
      } else {
        const job = await jobsApi.create(payload);
        return jobsApi.updateStatus(job.id, 'published');
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Job updated successfully' : 'Job published successfully');
      router.push('/recruiter/jobs');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, isEditing ? 'Failed to update job' : 'Failed to publish job')),
  });

  const toggleId = (field: 'skillIds' | 'qualificationIds' | 'languageIds', id: string) => {
    const current: string[] = getValues(field) || [];
    const updated = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    setValue(field, updated, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };

  const toggleBenefit = (benefit: string) => {
    const current: string[] = getValues('benefitNames') || [];
    const isChecked = current.includes(benefit);
    const updated = isChecked ? current.filter((b) => b !== benefit) : [...current, benefit];
    setValue('benefitNames', updated, { shouldDirty: true, shouldTouch: true });
  };

  const toggleAsset = (asset: string) => {
    const current: string[] = getValues('assetNames') || [];
    const isChecked = current.includes(asset);
    const updated = isChecked ? current.filter((a) => a !== asset) : [...current, asset];
    setValue('assetNames', updated, { shouldDirty: true, shouldTouch: true });
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
  const langSuggestions = useMemo(() => {
    const selectedSet = new Set(selectedLanguageIds);
    const query = langSearch.trim().toLowerCase();
    if (!query) return languages.filter(l => !selectedSet.has(String(l.id)));
    return languages.filter(l => {
      const id = String(l.id);
      if (selectedSet.has(id)) return false;
      const name = 'name' in l ? l.name : '';
      return name.toLowerCase().includes(query);
    });
  }, [languages, selectedLanguageIds, langSearch]);

  const selectedQualificationsNames = useMemo(() => {
    return selectedQualificationIds.map(id => {
      const q = qualifications.find(qu => String(qu.id) === id);
      return q && 'name' in q ? q.name : id;
    });
  }, [selectedQualificationIds, qualifications]);

  const skillSuggestions = useMemo(() => {
    const selectedSet = new Set(selectedSkillIds);
    const query = skillSearch.trim().toLowerCase();
    if (!query) return skills.filter(skill => !selectedSet.has(String(skill.id)));
    return skills.filter(skill => {
      const id = String(skill.id);
      if (selectedSet.has(id)) return false;
      const name = 'name' in skill ? skill.name : '';
      return name.toLowerCase().includes(query);
    });
  }, [skills, selectedSkillIds, skillSearch]);

  const qualSuggestions = useMemo(() => {
    const selectedSet = new Set(selectedQualificationIds);
    const query = qualSearch.trim().toLowerCase();

    return qualifications.filter(q => {
      const id = String(q.id);
      if (selectedSet.has(id)) return false;

      // Level filter matching candidate side categories
      if (selectedQualLevel !== 'ALL') {
        const level = (q as any).level || '';
        if (level.toUpperCase() !== selectedQualLevel.toUpperCase()) {
          return false;
        }
      }

      if (!query && selectedQualLevel === 'ALL') return false;

      const name = 'name' in q ? (q.name || '') : '';
      return !query || name.toLowerCase().includes(query);
    });
  }, [qualifications, selectedQualificationIds, qualSearch, selectedQualLevel]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      {/* Header Row */}
      <div className="flex flex-row items-center justify-between flex-wrap gap-4 border-b border-slate-50 pb-6 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">{isEditing ? 'Edit Job Opening' : 'Create New Job'}</h1>
          <p className="text-slate-400 text-sm font-semibold mt-1">
            {isEditing ? 'Update job details, requirements, and information' : 'Fill in the details to post a new job opening instantly'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(
        (data) => publishMutation.mutate(data),
        (errors) => {
          const firstKey = Object.keys(errors)[0];
          const errObj = errors[firstKey as keyof typeof errors];
          const message = errObj && 'message' in errObj && typeof errObj.message === 'string'
            ? errObj.message
            : `Please complete the required field: ${firstKey}`;
          toast.error(message);
        }
      )}>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Form Sections stacked */}
          <div className="lg:col-span-2 space-y-6">

            {/* Card 1: Basic Details */}
            <Card className="p-6 border border-slate-100 rounded-2xl shadow-sm text-left bg-white space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-sm border-b border-slate-50 pb-3">
                <Briefcase className="h-5 w-5" />
                <span>1. Basic Details</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Job Role Name / Title */}
                <div className="space-y-2 relative sm:col-span-2 lg:col-span-2">
                  <Label className="text-slate-700 font-extrabold text-xs">Job Role / Title *</Label>
                  <div className="relative">
                    <input
                      type="text"
                      autoComplete="off"
                      placeholder="Type or select job role (e.g. Backend Developer)..."
                      className="w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 h-10 px-3.5 pr-10 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                      value={jobRoleSearch}
                      onChange={(e) => {
                        setJobRoleSearch(e.target.value);
                        setValue('jobRoleName', e.target.value, { shouldValidate: true });
                        setIsJobRoleOpen(true);
                      }}
                      onFocus={() => setIsJobRoleOpen(true)}
                      onBlur={() => setTimeout(() => setIsJobRoleOpen(false), 200)}
                    />
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-slate-400 pointer-events-none" />
                  </div>
                  {isJobRoleOpen && (
                    <div className="absolute left-0 right-0 top-[66px] z-50 max-h-[200px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">
                      {jobRoles
                        .filter((role: any) => !jobRoleSearch || (role.name || '').toLowerCase().includes(jobRoleSearch.toLowerCase()))
                        .map((role: any) => (
                          <button
                            key={role.id}
                            type="button"
                            className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setValue('jobRoleId', String(role.id));
                              setValue('jobRoleName', role.name || String(role.id), { shouldValidate: true });
                              setJobRoleSearch(role.name || String(role.id));
                              setIsJobRoleOpen(false);
                            }}
                            onClick={() => {
                              setValue('jobRoleId', String(role.id));
                              setValue('jobRoleName', role.name || String(role.id), { shouldValidate: true });
                              setJobRoleSearch(role.name || String(role.id));
                              setIsJobRoleOpen(false);
                            }}
                          >
                            {'name' in role ? role.name : String(role.id)}
                          </button>
                        ))}
                    </div>
                  )}
                  {errors.jobRoleName && <p className="text-xs text-red-500 font-bold">{errors.jobRoleName.message}</p>}
                </div>

                {/* Headcount */}
                <div className="space-y-2">
                  <Label htmlFor="headcountRequired" className="text-slate-700 font-extrabold text-xs">Headcount *</Label>
                  <Input id="headcountRequired" type="number" min={1} {...register('headcountRequired')} className="rounded-xl border-slate-200" />
                  {errors.headcountRequired && <p className="text-xs text-red-500 font-bold">{errors.headcountRequired.message}</p>}
                </div>

                {/* Function / Department Searchable Dropdown */}
                <div className="space-y-2 relative">
                  <Label className="text-slate-700 font-extrabold text-xs">Department / Function</Label>
                  <div className="relative">
                    <input
                      type="text"
                      autoComplete="off"
                      placeholder="Type or select function (e.g. Marketing, Software Engineering)..."
                      className="w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 h-10 px-3.5 pr-10 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                      value={functionSearch}
                      onChange={(e) => {
                        setFunctionSearch(e.target.value);
                        setValue('functionName', e.target.value);
                        setIsFunctionOpen(true);
                      }}
                      onFocus={() => setIsFunctionOpen(true)}
                      onBlur={() => setTimeout(() => setIsFunctionOpen(false), 200)}
                    />
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-slate-400 pointer-events-none" />
                  </div>
                  {isFunctionOpen && (
                    <div className="absolute left-0 right-0 top-[66px] z-50 max-h-[200px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">
                      {functions
                        .filter((func: any) => !functionSearch || (func.name || '').toLowerCase().includes(functionSearch.toLowerCase()))
                        .map((func: any) => (
                          <button
                            key={func.id}
                            type="button"
                            className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setValue('functionId', String(func.id));
                              setValue('functionName', func.name || String(func.id));
                              setFunctionSearch(func.name || String(func.id));
                              setIsFunctionOpen(false);
                            }}
                            onClick={() => {
                              setValue('functionId', String(func.id));
                              setValue('functionName', func.name || String(func.id));
                              setFunctionSearch(func.name || String(func.id));
                              setIsFunctionOpen(false);
                            }}
                          >
                            {'name' in func ? func.name : String(func.id)}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Working Days */}
                <div className="space-y-2">
                  <Label className="text-slate-700 font-extrabold text-xs">Working Days *</Label>
                  <Select value={String(formData.workingDays ?? 5)} onValueChange={(val) => setValue('workingDays', Number(val), { shouldValidate: true })}>
                    <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 days working</SelectItem>
                      <SelectItem value="6">6 days working</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label className="text-slate-700 font-extrabold text-xs">Gender Requirement *</Label>
                  <Select value={formData.gender || 'ANY'} onValueChange={(val: 'ANY' | 'MALE' | 'FEMALE') => setValue('gender', val, { shouldValidate: true })}>
                    <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANY">Any</SelectItem>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Working Status */}
                <div className="space-y-2">
                  <Label className="text-slate-700 font-extrabold text-xs">Working Status</Label>
                  <Select value={formData.workingStatus || 'IMMEDIATE_JOINER'} onValueChange={(val) => setValue('workingStatus', val, { shouldValidate: true })}>
                    <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IMMEDIATE_JOINER">Immediate Joiner</SelectItem>
                      <SelectItem value="SERVING_NOTICE">Serving Notice</SelectItem>
                      <SelectItem value="ANY">Any Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 7. Required Experience */}
              <div className="space-y-3 border-t border-slate-50 pt-3">
                <Label className="text-slate-700 font-extrabold text-xs">Experience Requirement *</Label>

                <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Checkbox
                    id="freshersOnly"
                    checked={formData.freshersOnly}
                    onCheckedChange={(checked) => {
                      const isChecked = Boolean(checked);
                      setValue('freshersOnly', isChecked, { shouldValidate: true });
                      if (isChecked) {
                        setValue('minExperienceYears', 0);
                        setValue('maxExperienceYears', 0);
                      }
                    }}
                  />
                  <label htmlFor="freshersOnly" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Only freshers should apply
                  </label>
                </div>

                {!formData.freshersOnly && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="minExperienceYears" className="text-slate-500 font-bold text-xs">Minimum Experience (Years)</Label>
                      <Input id="minExperienceYears" type="number" min={0} {...register('minExperienceYears')} className="rounded-xl border-slate-200" />
                      {errors.minExperienceYears && <p className="text-xs text-red-500 font-bold">{errors.minExperienceYears.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="maxExperienceYears" className="text-slate-500 font-bold text-xs">Maximum Experience (Years)</Label>
                      <Input id="maxExperienceYears" type="number" min={0} placeholder="e.g. 5" {...register('maxExperienceYears')} className="rounded-xl border-slate-200" />
                    </div>
                  </div>
                )}
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
                <div className="space-y-2 max-w-md relative">
                  <Label className="text-slate-700 font-extrabold text-xs">Industry *</Label>
                  <div className="relative">
                    <input
                      type="text"
                      autoComplete="off"
                      placeholder="Type to search industry..."
                      className="w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 h-10 px-3.5 pr-10 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                      value={industrySearch}
                      onChange={(e) => {
                        setIndustrySearch(e.target.value);
                        setIsIndustryOpen(true);
                      }}
                      onFocus={() => setIsIndustryOpen(true)}
                      onBlur={() => setTimeout(() => setIsIndustryOpen(false), 200)}
                    />
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-slate-400 pointer-events-none" />
                  </div>
                  {isIndustryOpen && (
                    <div className="absolute left-0 right-0 top-[66px] z-50 max-h-[200px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">
                      {industries
                        .filter((ind: any) => !industrySearch || (ind.name || '').toLowerCase().includes(industrySearch.toLowerCase()))
                        .map((ind: any) => (
                          <button
                            key={ind.id}
                            type="button"
                            className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setValue('industryId', String(ind.id), { shouldValidate: true });
                              setIndustrySearch(ind.name || String(ind.id));
                              setIsIndustryOpen(false);
                            }}
                            onClick={() => {
                              setValue('industryId', String(ind.id), { shouldValidate: true });
                              setIndustrySearch(ind.name || String(ind.id));
                              setIsIndustryOpen(false);
                            }}
                          >
                            {'name' in ind ? ind.name : String(ind.id)}
                          </button>
                        ))}
                    </div>
                  )}
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
                              const matched = states.find((s: string) => s.toLowerCase() === stateInput.trim().toLowerCase());
                              if (matched) {
                                handleStateChange(matched);
                              } else if (selectedState) {
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
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleStateChange(state);
                                }}
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
                              const matched = cities.find((c: string) => c.toLowerCase() === cityInput.trim().toLowerCase());
                              if (matched) {
                                handleCityChange(matched);
                              } else if (selectedCity) {
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
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleCityChange(city);
                                }}
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
                              const matched = localities.find((l: BackendLocation) => l.locality.toLowerCase() === localityInput.trim().toLowerCase());
                              if (matched) {
                                handleLocalityChange(String(matched.id));
                              } else if (selectedLocalityId) {
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
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleLocalityChange(String(loc.id));
                                }}
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
                    placeholder="Search and select skills..."
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    className="w-full bg-[#f4f5f7] border border-transparent rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 transition-all shadow-inner"
                  />
                </div>

                {/* Skills Dropdown / Suggestions Grid with Search */}
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto border border-slate-100/80 p-3 rounded-xl bg-slate-50/30">
                  {skillSuggestions.length > 0 ? (
                    skillSuggestions.map((skill: any) => {
                      const id = String(skill.id);
                      const isSelected = selectedSkillIds.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            toggleId('skillIds', id);
                          }}
                          className={cn(
                            'px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all',
                            isSelected
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                          )}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {'name' in skill ? skill.name : id}
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-[10px] text-slate-400 italic py-1">
                      {skillSearch.trim() !== '' ? 'No matching skills found.' : 'No skills available.'}
                    </span>
                  )}
                </div>
              </div>
              <Separator className="my-2 bg-slate-50" />
              <div className="space-y-3">
                <Label className="text-slate-700 font-extrabold text-xs">Qualifications Required</Label>

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

                {/* Candidate-side Qualification Level Filter Buttons */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-slate-400 font-bold uppercase block">Filter by Level</Label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedQualLevel('ALL')}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-bold transition-all border',
                        selectedQualLevel === 'ALL'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      )}
                    >
                      All Levels
                    </button>
                    {QUAL_CATEGORY_ORDER.map((catKey) => (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setSelectedQualLevel(catKey)}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-bold transition-all border',
                          selectedQualLevel === catKey
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        )}
                      >
                        {QUAL_CATEGORY_LABELS[catKey] || catKey}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Input Box */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Search ${selectedQualLevel !== 'ALL' ? QUAL_CATEGORY_LABELS[selectedQualLevel] || selectedQualLevel : 'qualifications'}...`}
                    value={qualSearch}
                    onChange={(e) => setQualSearch(e.target.value)}
                    className="w-full bg-[#f4f5f7] border border-transparent rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 transition-all shadow-inner"
                  />
                </div>

                {/* Suggestions List */}
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto border border-slate-100/80 p-3 rounded-xl bg-slate-50/30">
                  {qualSuggestions.length > 0 ? (
                    qualSuggestions.map((qualification: any) => {
                      const id = String(qualification.id);
                      const isSelected = selectedQualificationIds.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            toggleId('qualificationIds', id);
                          }}
                          className={cn(
                            'px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all',
                            isSelected
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                          )}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {'name' in qualification ? qualification.name : id}
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-[10px] text-slate-400 italic py-1">
                      {selectedQualLevel !== 'ALL' || qualSearch.trim() !== ''
                        ? 'No matching qualifications found for this level.'
                        : 'Select a qualification level above or type to search...'}
                    </span>
                  )}
                </div>
              </div>

              <Separator className="my-2 bg-slate-50" />

              {/* Required Languages Section */}
              <div className="space-y-3">
                <Label className="text-slate-700 font-extrabold text-xs">Required Languages</Label>

                {/* Selected Languages dismissible badges */}
                {selectedLanguageIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50/50 border border-slate-100 rounded-xl">
                    {selectedLanguageIds.map((id) => {
                      const lang = languages.find((l) => String(l.id) === id);
                      const name = lang && 'name' in lang ? lang.name : id;
                      return (
                        <Badge
                          key={id}
                          className="bg-indigo-50 hover:bg-indigo-100/80 text-indigo-600 border-none font-bold text-xs py-1 px-2.5 rounded-full flex items-center gap-1.5 shadow-sm"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => toggleId('languageIds', id)}
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
                    placeholder="Search and add required languages (English, Hindi, Tamil, etc.)..."
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    className="w-full bg-[#f4f5f7] border border-transparent rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 transition-all shadow-inner"
                  />
                </div>

                {/* Language Suggestions Grid */}
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border border-slate-100/80 p-3 rounded-xl bg-slate-50/30">
                  {langSuggestions.length > 0 ? (
                    langSuggestions.map((lang: any) => {
                      const id = String(lang.id);
                      const isSelected = selectedLanguageIds.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            toggleId('languageIds', id);
                          }}
                          className={cn(
                            'px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all',
                            isSelected
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                          )}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {'name' in lang ? lang.name : id}
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-[10px] text-slate-400 italic py-1">No matching languages found.</span>
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

              {/* Salary Period Select */}
              <div className="space-y-2 max-w-xs">
                <Label className="text-slate-700 font-extrabold text-xs">Salary Type *</Label>
                <Select value={formData.wageType || 'monthly'} onValueChange={(val: 'monthly' | 'annual' | 'daily') => setValue('wageType', val, { shouldValidate: true })}>
                  <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Per Month Salary (₹)</SelectItem>
                    <SelectItem value="annual">Per Annum Salary (₹)</SelectItem>
                    <SelectItem value="daily">Per Day Salary (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="wageMin" className="text-slate-700 font-extrabold text-xs">
                    Minimum Wage (₹) ({formData.wageType === 'daily' ? 'Per Day' : formData.wageType === 'annual' ? 'Per Annum' : 'Per Month'}) *
                  </Label>
                  <Input id="wageMin" type="number" placeholder="25000" {...register('wageMin')} className="rounded-xl border-slate-200" />
                  {errors.wageMin && <p className="text-xs text-red-500 font-bold">{errors.wageMin.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wageMax" className="text-slate-700 font-extrabold text-xs">
                    Maximum Wage (₹) ({formData.wageType === 'daily' ? 'Per Day' : formData.wageType === 'annual' ? 'Per Annum' : 'Per Month'}) *
                  </Label>
                  <Input id="wageMax" type="number" placeholder="40000" {...register('wageMax')} className="rounded-xl border-slate-200" />
                  {errors.wageMax && <p className="text-xs text-red-500 font-bold">{errors.wageMax.message}</p>}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-extrabold text-xs">Shift *</Label>
                  <Select value={formData.shiftType || 'day'} onValueChange={(value: 'day' | 'night' | 'rotational') => setValue('shiftType', value, { shouldValidate: true })}>
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
                  <Select value={formData.jobType || 'full-time'} onValueChange={(value: 'full-time' | 'part-time' | 'contract') => setValue('jobType', value, { shouldValidate: true })}>
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

            {/* Card 5: Benefits */}
            <Card className="p-6 border border-slate-100 rounded-2xl shadow-sm text-left bg-white space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-sm border-b border-slate-50 pb-3">
                <Rocket className="h-5 w-5" />
                <span>5. Benefits Provided</span>
              </div>

              <div className="space-y-3 relative">
                {/* Render Selected Benefits as dismissible badges */}
                {(formData.benefitNames || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50/70 border border-slate-100 rounded-xl">
                    {(formData.benefitNames || []).map((benefit) => (
                      <Badge
                        key={benefit}
                        className="bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border-none font-bold text-xs py-1 px-2.5 rounded-full flex items-center gap-1.5 shadow-sm"
                      >
                        {benefit}
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            toggleBenefit(benefit);
                          }}
                          className="hover:bg-indigo-200/50 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Search Input Box */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Type to search and select benefits..."
                    className="w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 h-10 pl-10 pr-10 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                    value={benefitSearch}
                    onChange={(e) => {
                      setBenefitSearch(e.target.value);
                      setIsBenefitOpen(true);
                    }}
                    onFocus={() => setIsBenefitOpen(true)}
                    onBlur={() => setTimeout(() => setIsBenefitOpen(false), 200)}
                  />
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-slate-400 pointer-events-none" />
                </div>

                {/* Searchable Multi-Select Dropdown Menu */}
                {isBenefitOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-[220px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">
                    {benefitsOptionsList
                      .filter((benefit) => !benefitSearch || benefit.toLowerCase().includes(benefitSearch.toLowerCase()))
                      .map((benefit) => {
                        const isChecked = (formData.benefitNames || []).includes(benefit);
                        return (
                          <button
                            key={benefit}
                            type="button"
                            className={cn(
                              'w-full text-left px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors',
                              isChecked ? 'bg-indigo-50/60 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                            )}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              toggleBenefit(benefit);
                            }}
                          >
                            <span>{benefit}</span>
                            <div className={cn(
                              'h-4 w-4 rounded border flex items-center justify-center transition-all',
                              isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                            )}>
                              {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    {benefitsOptionsList.filter((b) => !benefitSearch || b.toLowerCase().includes(benefitSearch.toLowerCase())).length === 0 && (
                      <div className="text-xs text-slate-400 p-3 text-center italic">No matching benefits found</div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Card 6: Required Assets / Documents */}
            <Card className="p-6 border border-slate-100 rounded-2xl shadow-sm text-left bg-white space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-sm border-b border-slate-50 pb-3">
                <FileText className="h-5 w-5" />
                <span>6. Required Assets / Documents</span>
              </div>

              <div className="space-y-3 relative">
                {/* Render Selected Assets as dismissible badges */}
                {(formData.assetNames || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50/70 border border-slate-100 rounded-xl">
                    {(formData.assetNames || []).map((asset) => (
                      <Badge
                        key={asset}
                        className="bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border-none font-bold text-xs py-1 px-2.5 rounded-full flex items-center gap-1.5 shadow-sm"
                      >
                        {asset}
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            toggleAsset(asset);
                          }}
                          className="hover:bg-indigo-200/50 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Search Input Box */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Type to search and select required assets..."
                    className="w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 h-10 pl-10 pr-10 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                    value={assetSearch}
                    onChange={(e) => {
                      setAssetSearch(e.target.value);
                      setIsAssetOpen(true);
                    }}
                    onFocus={() => setIsAssetOpen(true)}
                    onBlur={() => setTimeout(() => setIsAssetOpen(false), 200)}
                  />
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-slate-400 pointer-events-none" />
                </div>

                {/* Searchable Multi-Select Dropdown Menu */}
                {isAssetOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-[220px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">
                    {assetsOptionsList
                      .filter((asset) => !assetSearch || asset.toLowerCase().includes(assetSearch.toLowerCase()))
                      .map((asset) => {
                        const isChecked = (formData.assetNames || []).includes(asset);
                        return (
                          <button
                            key={asset}
                            type="button"
                            className={cn(
                              'w-full text-left px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors',
                              isChecked ? 'bg-indigo-50/60 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                            )}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              toggleAsset(asset);
                            }}
                          >
                            <span>{asset}</span>
                            <div className={cn(
                              'h-4 w-4 rounded border flex items-center justify-center transition-all',
                              isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                            )}>
                              {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    {assetsOptionsList.filter((a) => !assetSearch || a.toLowerCase().includes(assetSearch.toLowerCase())).length === 0 && (
                      <div className="text-xs text-slate-400 p-3 text-center italic">No matching assets found</div>
                    )}
                  </div>
                )}
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="responsibilities" className="text-slate-700 font-extrabold text-xs">Responsibilities (One per line)*</Label>
                  <Textarea id="responsibilities" rows={4} placeholder="e.g. Design, develop, and maintain RESTful APIs" {...register('responsibilities')} className="rounded-xl border-slate-200" />
                  {errors.responsibilities && <p className="text-xs text-red-500 font-bold">{errors.responsibilities.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirements" className="text-slate-700 font-extrabold text-xs">Requirements (One per line)*</Label>
                  <Textarea id="requirements" rows={4} placeholder="e.g. 3 years Node.js experience" {...register('requirements')} className="rounded-xl border-slate-200" />
                  {errors.requirements && <p className="text-xs text-red-500 font-bold">{errors.requirements.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="highlights" className="text-slate-700 font-extrabold text-xs">Job Highlights (One per line)</Label>
                  <Textarea id="highlights" rows={4} placeholder="e.g. Fast growing startup&#10;Flexible working hours&#10;Immediate joining" {...register('highlights')} className="rounded-xl border-slate-200" />
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
                    {formData.jobRoleName || 'Job Role / Title'}
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
                    {publishMutation.isPending ? (isEditing ? 'Updating...' : 'Publishing...') : (isEditing ? 'Update Job' : 'Publish Job')}
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
