'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Briefcase, Check, ChevronLeft, ChevronRight, GraduationCap, MapPin, User as UserIcon, FileText, X, Loader2, Search, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/lib/auth-context';
import { workerApi, masterDataApi, MasterRawItem, BackendLocation, BackendLookup } from '@/lib/scn-api';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { UploadDropzone } from '@/utils/uploadthing';

const steps = [
  { id: 1, title: 'Basic Details', icon: UserIcon },
  { id: 2, title: 'Location', icon: MapPin },
  { id: 3, title: 'Education', icon: GraduationCap },
  { id: 4, title: 'Experience', icon: Briefcase },
  { id: 5, title: 'Resume', icon: FileText },
];

const schema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().min(10, 'Valid phone is required'),
  alternatePhone: z.string().optional(),
  departmentName: z.string().optional(),
  industryName: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  currentLocality: z.string().optional(),
  preferredLocationIds: z.array(z.string()).default([]),
  headline: z.string().min(5, 'Headline is required'),
  summary: z.string().optional(),
  // Education
  qualificationId: z.string().optional(),
  institute: z.string().optional(),
  passoutYear: z.coerce.number().optional(),
  // Experience & Fresher & Working Status
  isFresher: z.boolean().default(false),
  workingStatus: z.string().optional(),
  noticePeriodDays: z.coerce.number().optional(),
  companyName: z.string().optional(),
  jobTitle: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
  expDepartmentName: z.string().optional(),
  expIndustryName: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const QUAL_CATEGORY_LABELS: Record<string, string> = {
  TEN: '10th Pass',
  TWELVE: '12th Pass',
  DIPLOMA: 'Diploma',
  GRADUATE: 'Graduate',
  POST_GRADUATE: 'Post Graduate',
  ANY: 'Other / Any',
};

const QUAL_CATEGORY_ORDER = ['TEN', 'TWELVE', 'DIPLOMA', 'GRADUATE', 'POST_GRADUATE', 'ANY'];

export interface EducationEntryItem {
  qualificationId: number;
  qualificationName: string;
  level: string;
  levelLabel: string;
  institute: string;
  passoutYear: number;
}

export default function WorkerOnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedLocality, setSelectedLocality] = useState<string>('');

  const [stateInput, setStateInput] = useState('');
  const [isStateOpen, setIsStateOpen] = useState(false);

  const [cityInput, setCityInput] = useState('');
  const [isCityOpen, setIsCityOpen] = useState(false);

  const [isWhatsapp, setIsWhatsapp] = useState<boolean>(true);
  const [localityInput, setLocalityInput] = useState('');
  const [isLocalityOpen, setIsLocalityOpen] = useState(false);

  const [deptInput, setDeptInput] = useState('');
  const [isDeptOpen, setIsDeptOpen] = useState(false);

  const [indInput, setIndInput] = useState('');
  const [isIndOpen, setIsIndOpen] = useState(false);

  const [expDeptInput, setExpDeptInput] = useState('');
  const [isExpDeptOpen, setIsExpDeptOpen] = useState(false);

  const [expIndInput, setExpIndInput] = useState('');
  const [isExpIndOpen, setIsExpIndOpen] = useState(false);

  const [qualSearch, setQualSearch] = useState('');
  const [isQualOpen, setIsQualOpen] = useState(false);
  const [selectedQualLevel, setSelectedQualLevel] = useState<string>('');

  const [educationList, setEducationList] = useState<EducationEntryItem[]>([]);

  const qualGroupsQuery = useQuery<Record<string, BackendLookup[]>>({
    queryKey: ['master', 'qualifications', 'grouped'],
    queryFn: () => workerApi.getQualificationsGrouped(),
  });
  const qualGroups: Record<string, BackendLookup[]> = qualGroupsQuery.data || {};

  const handleAddEducation = () => {
    const qualIdStr = watch('qualificationId');
    const instituteVal = watch('institute');
    const passoutYearVal = watch('passoutYear');

    if (!selectedQualLevel || !qualIdStr || !instituteVal || !passoutYearVal) {
      toast.error('Please select Qualification Level, Specific Qualification, Institute Name, and Year of Passing before adding.');
      return;
    }

    const qualObj = (qualGroups[selectedQualLevel] || qualifications.filter((q: any) => q.level === selectedQualLevel))
      .find((q: any) => String(q.id) === String(qualIdStr));

    const qualName = qualObj ? (qualObj.name || String(qualObj.id)) : qualSearch || 'Qualification';

    const newItem: EducationEntryItem = {
      qualificationId: Number(qualIdStr),
      qualificationName: qualName,
      level: selectedQualLevel,
      levelLabel: QUAL_CATEGORY_LABELS[selectedQualLevel] || selectedQualLevel,
      institute: instituteVal,
      passoutYear: Number(passoutYearVal),
    };

    setEducationList((prev) => [...prev, newItem]);
    
    // Clear temporary inputs for next entry
    setSelectedQualLevel('');
    setQualSearch('');
    setValue('qualificationId', '');
    setValue('institute', '');
    setValue('passoutYear', undefined as any);
    toast.success(`Added ${newItem.levelLabel} qualification`);
  };

  const handleRemoveEducation = (index: number) => {
    setEducationList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const functionsQuery = useQuery({ queryKey: ['master', 'functions'], queryFn: () => masterDataApi.raw('functions') });
  const rawFunctionsData = functionsQuery.data;
  const functionsList: BackendLookup[] = Array.isArray(rawFunctionsData) ? (rawFunctionsData as BackendLookup[]) : [];

  const industriesQuery = useQuery({ queryKey: ['master', 'industries'], queryFn: () => masterDataApi.raw('industries') });
  const rawIndustriesData = industriesQuery.data;
  const industriesList: BackendLookup[] = Array.isArray(rawIndustriesData) ? (rawIndustriesData as BackendLookup[]) : [];

  useEffect(() => {
    setStateInput(selectedState);
  }, [selectedState]);

  useEffect(() => {
    setCityInput(selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    setLocalityInput(selectedLocality);
  }, [selectedLocality]);

  const locationsQuery = useQuery({ queryKey: ['master', 'locations'], queryFn: () => masterDataApi.raw('locations') });
  const qualificationsQuery = useQuery({ queryKey: ['master', 'qualifications'], queryFn: () => masterDataApi.raw('qualifications') });

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

  const filteredStates = states.filter((s: string) => {
    if (!stateInput || stateInput === selectedState) return true;
    return s.toLowerCase().includes(stateInput.toLowerCase());
  });
  const filteredCities = cities.filter((c: string) => {
    if (!cityInput || cityInput === selectedCity) return true;
    return c.toLowerCase().includes(cityInput.toLowerCase());
  });
  const filteredLocalities = localities.filter((l: BackendLocation) => {
    if (!localityInput || l.locality === selectedLocality) return true;
    return l.locality.toLowerCase().includes(localityInput.toLowerCase());
  });

  const filteredFunctions = functionsList.filter((fn: BackendLookup) => {
    if (!deptInput || fn.name === deptInput) return true;
    return (fn.name || '').toLowerCase().includes(deptInput.toLowerCase());
  });
  const filteredIndustries = industriesList.filter((ind: BackendLookup) => {
    if (!indInput || ind.name === indInput) return true;
    return (ind.name || '').toLowerCase().includes(indInput.toLowerCase());
  });

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setStateInput(state);
    setSelectedCity('');
    setCityInput('');
    setSelectedLocality('');
    setLocalityInput('');
    setValue('city', '');
    setValue('currentLocality', '');
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setCityInput(city);
    setSelectedLocality('');
    setLocalityInput('');
    setValue('city', city, { shouldValidate: true });
    setValue('currentLocality', '');
  };

  const handleLocalityChange = (locality: string) => {
    setSelectedLocality(locality);
    setLocalityInput(locality);
    setValue('currentLocality', locality, { shouldValidate: true });
  };

  const locations: MasterRawItem[] = locationsQuery.data ?? [];
  const rawQualificationsData = qualificationsQuery.data;
  const qualifications: MasterRawItem[] = Array.isArray(rawQualificationsData)
    ? rawQualificationsData
    : rawQualificationsData && typeof rawQualificationsData === 'object'
    ? Object.values(rawQualificationsData).flat()
    : [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName || user?.name?.split(' ')[0] || '',
      lastName: user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '',
      phone: user?.phone || '',
      preferredLocationIds: [],
    },
  });

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 1) fieldsToValidate = ['firstName', 'lastName', 'phone'];
    if (currentStep === 2) fieldsToValidate = ['city', 'headline'];
    // Steps 3 and 4 are optional (can skip)

    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate as any);
      if (!isValid) return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const onSubmit = async (data: FormData) => {
    if (!resumeUrl) {
      toast.error('Please upload your resume to complete your profile.');
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Create or update profile including isFresher, department & workingStatus
      await workerApi.updateProfile({
        name: `${data.firstName} ${data.lastName}`,
        phone: data.phone,
        alternatePhone: data.alternatePhone || undefined,
        departmentName: data.departmentName || undefined,
        headline: data.headline,
        summary: data.summary,
        resumeUrl: resumeUrl || undefined,
        preferredLocationIds: data.preferredLocationIds.map(Number),
        state: selectedState || undefined,
        city: data.city,
        currentLocality: data.currentLocality || undefined,
        isFresher: data.isFresher,
        workingStatus: data.workingStatus || undefined,
        noticePeriodDays: data.workingStatus === 'SERVING_NOTICE' ? (data.noticePeriodDays || undefined) : undefined,
      });

      // 2. Add all education items (multiple qualifications supported)
      const allEducationItems = [...educationList];
      
      const currentQualId = data.qualificationId;
      const currentInstitute = data.institute;
      const currentPassoutYear = data.passoutYear;
      if (selectedQualLevel && currentQualId && currentInstitute && currentPassoutYear) {
        const qualObj = (qualGroups[selectedQualLevel] || qualifications.filter((q: any) => q.level === selectedQualLevel))
          .find((q: any) => String(q.id) === String(currentQualId));
        const qualName = qualObj ? (qualObj.name || String(qualObj.id)) : qualSearch || 'Qualification';

        allEducationItems.push({
          qualificationId: Number(currentQualId),
          qualificationName: qualName,
          level: selectedQualLevel,
          levelLabel: QUAL_CATEGORY_LABELS[selectedQualLevel] || selectedQualLevel,
          institute: currentInstitute,
          passoutYear: Number(currentPassoutYear),
        });
      }

      for (const edu of allEducationItems) {
        await workerApi.addEducation({
          qualificationId: edu.qualificationId,
          qualificationName: edu.qualificationName,
          level: edu.level,
          institute: edu.institute,
          passoutYear: edu.passoutYear,
        });
      }

      // 3. Add experience if provided (freshers can also add internships/projects)
      if (data.companyName && data.jobTitle && data.fromDate) {
        await workerApi.addExperience({
          companyName: data.companyName,
          jobTitle: data.jobTitle,
          fromDate: new Date(data.fromDate).toISOString(),
          toDate: data.isCurrent || !data.toDate ? undefined : new Date(data.toDate).toISOString(),
          isCurrent: data.isCurrent,
          description: data.description || undefined,
          industryName: data.expIndustryName || data.industryName || undefined,
          departmentName: data.expDepartmentName || data.departmentName || undefined,
        });
      }

      updateUser({ hasProfile: true });
      toast.success('Profile created successfully!');
      router.push('/worker/dashboard');
    } catch (error) {
      toast.error('Failed to create profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Complete Your Profile</h1>
          <p className="mt-2 text-muted-foreground">Let&apos;s set up your profile so you can start applying to jobs.</p>
        </div>

        {/* Premium Stepper */}
        <div className="mb-10 px-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-in-out"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>
            {steps.map((step, i) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center group">
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-full border-4 bg-background transition-all duration-300',
                      isCompleted ? 'border-primary bg-primary text-primary-foreground' :
                        isCurrent ? 'border-primary text-primary shadow-lg scale-110' :
                          'border-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? <Check className="h-6 w-6" /> : <step.icon className="h-5 w-5" />}
                  </div>
                  <span className={cn(
                    "absolute -bottom-6 text-xs font-semibold whitespace-nowrap transition-colors",
                    isCurrent ? "text-primary" : "text-muted-foreground hidden sm:block"
                  )}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="p-6 sm:p-10 shadow-2xl bg-card/90 backdrop-blur-xl border-border/50">
          <form onSubmit={handleSubmit(onSubmit)}>
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-semibold">Basic Details</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input {...register('firstName')} />
                    {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name *</Label>
                    <Input {...register('lastName')} />
                    {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                  </div>
                </div>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                    <Label className="text-xs font-bold text-slate-800">Is primary phone number your WhatsApp number?</Label>
                    <div className="flex items-center gap-6 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                        <input
                          type="radio"
                          name="isWhatsapp"
                          checked={isWhatsapp === true}
                          onChange={() => {
                            setIsWhatsapp(true);
                            setValue('alternatePhone', '');
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        Yes (WhatsApp is same)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                        <input
                          type="radio"
                          name="isWhatsapp"
                          checked={isWhatsapp === false}
                          onChange={() => setIsWhatsapp(false)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        No (Add alternate number)
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Primary Phone Number *</Label>
                      <Input {...register('phone')} readOnly className="bg-muted cursor-not-allowed opacity-75" />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                    </div>

                    {!isWhatsapp && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label>Alternate Phone Number (Optional)</Label>
                        <Input placeholder="e.g. 9876543210" {...register('alternatePhone')} />
                        {errors.alternatePhone && <p className="text-xs text-destructive">{errors.alternatePhone.message}</p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-semibold">Location & Professional Info</h2>
                
                {/* Location Grid Row */}
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Step 1: State */}
                  <div className="space-y-2 relative">
                    <Label>State *</Label>
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
                            } else if (stateInput.trim()) {
                              handleStateChange(stateInput.trim());
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
                          <div className="text-xs text-slate-400 p-2.5 text-center">No match — your entry will be saved as-is</div>
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

                  {/* Step 2: City */}
                  <div className="space-y-2 relative">
                    <Label>City *</Label>
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
                            } else if (cityInput.trim()) {
                              handleCityChange(cityInput.trim());
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
                          <div className="text-xs text-slate-400 p-2.5 text-center">No match — your entry will be saved as-is</div>
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
                    {errors.city && <p className="text-xs text-destructive mt-1">{errors.city.message}</p>}
                  </div>

                  {/* Step 3: Locality */}
                  <div className="space-y-2 relative">
                    <Label>Locality (Optional)</Label>
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
                              handleLocalityChange(matched.locality);
                            } else if (localityInput.trim()) {
                              handleLocalityChange(localityInput.trim());
                            } else {
                              setLocalityInput(selectedLocality);
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
                          <div className="text-xs text-slate-400 p-2.5 text-center">No match — your entry will be saved as-is</div>
                        ) : (
                          filteredLocalities.map((loc: BackendLocation) => (
                            <button
                              key={loc.id}
                              type="button"
                              className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                              onMouseDown={() => handleLocalityChange(loc.locality)}
                            >
                              {loc.locality}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Industry & Department / Function Row (Industry First, Department Second) */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* 1. Industry (First) */}
                  <div className="space-y-2 relative">
                    <Label>Industry</Label>
                    <div className="relative">
                      <input
                        type="text"
                        autoComplete="off"
                        placeholder="Search or type industry (e.g. Information Technology)..."
                        className="w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 h-10 px-3.5 pr-10 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                        value={indInput}
                        onChange={(e) => {
                          setIndInput(e.target.value);
                          setIsIndOpen(true);
                          setValue('industryName', e.target.value);
                        }}
                        onFocus={() => setIsIndOpen(true)}
                        onBlur={() => setTimeout(() => setIsIndOpen(false), 200)}
                      />
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-slate-400 pointer-events-none" />
                    </div>
                    {isIndOpen && (
                      <div className="absolute left-0 right-0 top-[66px] z-50 max-h-[200px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">
                        {industriesQuery.isLoading ? (
                          <div className="flex items-center justify-center p-2.5">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          </div>
                        ) : filteredIndustries.length === 0 ? (
                          <div className="text-xs text-slate-400 p-2.5 text-center">No match — custom entry will be saved</div>
                        ) : (
                          filteredIndustries.map((ind: BackendLookup) => (
                            <button
                              key={ind.id}
                              type="button"
                              className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                              onMouseDown={() => {
                                setIndInput(ind.name);
                                setValue('industryName', ind.name);
                                setIsIndOpen(false);
                              }}
                            >
                              {ind.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. Department / Function (Second - Enabled when Industry is filled) */}
                  <div className="space-y-2 relative">
                    <Label>Department / Function</Label>
                    <div className="relative">
                      <input
                        type="text"
                        autoComplete="off"
                        disabled={!indInput.trim()}
                        placeholder={indInput.trim() ? "Search or type department (e.g. Software Engineering)..." : "Select Industry first"}
                        className="w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 h-10 px-3.5 pr-10 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm disabled:opacity-50 disabled:bg-slate-100/50 cursor-pointer disabled:cursor-not-allowed"
                        value={deptInput}
                        onChange={(e) => {
                          setDeptInput(e.target.value);
                          setIsDeptOpen(true);
                          setValue('departmentName', e.target.value);
                        }}
                        onFocus={() => {
                          if (indInput.trim()) setIsDeptOpen(true);
                        }}
                        onBlur={() => setTimeout(() => setIsDeptOpen(false), 200)}
                      />
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-slate-400 pointer-events-none" />
                    </div>
                    {isDeptOpen && indInput.trim() && (
                      <div className="absolute left-0 right-0 top-[66px] z-50 max-h-[200px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">
                        {functionsQuery.isLoading ? (
                          <div className="flex items-center justify-center p-2.5">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          </div>
                        ) : filteredFunctions.length === 0 ? (
                          <div className="text-xs text-slate-400 p-2.5 text-center">No match — custom entry will be saved</div>
                        ) : (
                          filteredFunctions.map((fn: BackendLookup) => (
                            <button
                              key={fn.id}
                              type="button"
                              className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                              onMouseDown={() => {
                                setDeptInput(fn.name);
                                setValue('departmentName', fn.name);
                                setIsDeptOpen(false);
                              }}
                            >
                              {fn.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Professional Headline *</Label>
                  <Input {...register('headline')} placeholder="e.g. Software Engineer" />
                  {errors.headline && <p className="text-xs text-destructive">{errors.headline.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Summary (Optional)</Label>
                  <Textarea {...register('summary')} rows={4} placeholder="Tell us about yourself..." />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Education (Optional)</h2>
                  <span className="text-xs text-muted-foreground font-semibold">Add multiple (10th, 12th, Diploma, Graduate, etc.)</span>
                </div>

                {/* List of Added Qualifications */}
                {educationList.length > 0 && (
                  <div className="space-y-2.5 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                    <h3 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>Added Qualifications ({educationList.length}):</span>
                      <span className="text-[10px] text-blue-600 font-semibold">Ready to save</span>
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {educationList.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl text-xs shadow-sm">
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] uppercase border border-blue-200/60 shrink-0">
                                {item.levelLabel}
                              </span>
                              <span className="font-extrabold text-slate-800 truncate">{item.qualificationName}</span>
                            </div>
                            <p className="text-slate-500 font-semibold text-[11px] mt-0.5">{item.institute} • Passed in {item.passoutYear}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                            onClick={() => handleRemoveEducation(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-4 p-4 border border-slate-200/70 rounded-2xl bg-white/60">
                  <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    {educationList.length > 0 ? 'Add Another Qualification' : 'Qualification Details'}
                  </h3>

                  {/* 1. Qualification Level */}
                  <div className="space-y-2">
                    <Label>Qualification Level</Label>
                    <Select
                      value={selectedQualLevel}
                      onValueChange={(lvl) => {
                        setSelectedQualLevel(lvl);
                        setValue('qualificationId', '');
                        setQualSearch('');
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select Level (10th, 12th, Diploma, Graduate, etc.)" /></SelectTrigger>
                      <SelectContent>
                        {QUAL_CATEGORY_ORDER.map((catKey) => (
                          <SelectItem key={catKey} value={catKey}>
                            {QUAL_CATEGORY_LABELS[catKey] || catKey}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 2. Specific Qualification Dropdown with Search */}
                  {selectedQualLevel && (
                    <div className="space-y-2 relative">
                      <Label>Specific Qualification</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                        <Input
                          placeholder={`Type to search ${QUAL_CATEGORY_LABELS[selectedQualLevel] || 'qualification'}...`}
                          value={qualSearch}
                          onChange={(e) => {
                            setQualSearch(e.target.value);
                            setIsQualOpen(true);
                          }}
                          onFocus={() => setIsQualOpen(true)}
                          className="pl-9 font-medium"
                        />
                      </div>
                      {isQualOpen && (
                        <div className="absolute left-0 right-0 top-[68px] z-50 max-h-52 overflow-y-auto space-y-1 border rounded-md p-2 border-border bg-popover text-popover-foreground shadow-xl">
                          {qualGroupsQuery.isLoading ? (
                            <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
                          ) : !(qualGroups[selectedQualLevel] || qualifications.filter((q: any) => q.level === selectedQualLevel)).filter((q: any) => !qualSearch || (q.name || '').toLowerCase().includes(qualSearch.toLowerCase())).length ? (
                            <p className="text-xs text-muted-foreground text-center py-3">No matching qualifications found.</p>
                          ) : (
                            (qualGroups[selectedQualLevel] || qualifications.filter((q: any) => q.level === selectedQualLevel))
                              .filter((q: any) => {
                                if (!qualSearch) return true;
                                const name = 'name' in q ? q.name : String(q.id);
                                return name.toLowerCase().includes(qualSearch.toLowerCase());
                              })
                              .map((q: any) => (
                                <button
                                  key={q.id}
                                  type="button"
                                  onClick={() => {
                                    setValue('qualificationId', String(q.id));
                                    setQualSearch(q.name || String(q.id));
                                    setIsQualOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                                    watch('qualificationId') === String(q.id) ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted'
                                  }`}
                                >
                                  {'name' in q ? q.name : String(q.id)}
                                </button>
                              ))
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Institute Name</Label>
                    <Input {...register('institute')} placeholder="e.g. University of Mumbai" />
                  </div>
                  <div className="space-y-2">
                    <Label>Year of Passing</Label>
                    <Input type="number" {...register('passoutYear')} placeholder="e.g. 2020" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddEducation}
                    className="w-full border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl text-xs py-2.5 flex items-center justify-center gap-2 mt-2 shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Qualification (10th, 12th, Diploma, Graduate, etc.)
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-semibold">Work Experience (Optional)</h2>

                {/* Fresher Checkbox */}
                <div className="flex items-center justify-between rounded-lg border border-border p-3.5 bg-muted/20">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="onboardingFresher"
                      checked={watch('isFresher')}
                      onCheckedChange={(checked) => {
                        const isChecked = Boolean(checked);
                        setValue('isFresher', isChecked);
                        if (isChecked) {
                          setValue('workingStatus', 'IMMEDIATE_JOINER');
                          setValue('noticePeriodDays', undefined);
                        }
                      }}
                    />
                    <label htmlFor="onboardingFresher" className="text-sm font-semibold cursor-pointer">
                      I am a Fresher
                    </label>
                  </div>
                  <span className="text-xs text-muted-foreground font-semibold">(Freshers can also add internships or projects below)</span>
                </div>

                {/* Working Status */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Working Status</Label>
                    <Select value={watch('workingStatus') || ''} onValueChange={(val) => setValue('workingStatus', val)}>
                      <SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger>
                      <SelectContent>
                        {watch('isFresher') ? (
                          <SelectItem value="IMMEDIATE_JOINER">Immediate Joiner</SelectItem>
                        ) : (
                          <>
                            <SelectItem value="WORKING">Currently Working</SelectItem>
                            <SelectItem value="SERVING_NOTICE">Serving Notice Period</SelectItem>
                            <SelectItem value="NOT_WORKING">Not Working</SelectItem>
                            <SelectItem value="IMMEDIATE_JOINER">Immediate Joiner</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {!watch('isFresher') && watch('workingStatus') === 'SERVING_NOTICE' && (
                    <div className="space-y-2">
                      <Label>Notice Period (Days)</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 30"
                        value={watch('noticePeriodDays') || ''}
                        onChange={(e) => setValue('noticePeriodDays', Number(e.target.value))}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      Work Experience / Internship / Project (Optional)
                    </h3>
                  </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Company Name</Label>
                        <Input {...register('companyName')} placeholder="e.g. Google" />
                      </div>
                      <div className="space-y-2">
                        <Label>Job Title / Designation</Label>
                        <Input {...register('jobTitle')} placeholder="e.g. Frontend Developer" />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="date" {...register('fromDate')} />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input type="date" disabled={watch('isCurrent')} {...register('toDate')} className="disabled:opacity-50" />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="onboardingIsCurrent"
                        checked={watch('isCurrent')}
                        onCheckedChange={(checked) => setValue('isCurrent', Boolean(checked))}
                      />
                      <label htmlFor="onboardingIsCurrent" className="text-sm font-medium cursor-pointer">
                        I currently work here
                      </label>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea {...register('description')} rows={3} placeholder="Key responsibilities and achievements..." />
                    </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-semibold">Resume Upload</h2>
                <p className="text-sm text-muted-foreground mb-4">Upload your resume to stand out to recruiters.</p>
                {resumeUrl ? (
                  <div className="rounded-lg border border-success/30 bg-success/5 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-success" />
                      <div>
                        <p className="font-medium">Resume Uploaded Successfully</p>
                        <a href={resumeUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">View File</a>
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setResumeUrl(null)}>Change</Button>
                  </div>
                ) : (
                  <UploadDropzone
                    endpoint="resumeUploader"
                    headers={{
                      Authorization: typeof window !== 'undefined' && localStorage.getItem('auth-token')
                        ? `Bearer ${localStorage.getItem('auth-token')}`
                        : '',
                    }}
                    onClientUploadComplete={(res) => {
                      if (res && res[0]) {
                        setResumeUrl(res[0].url);
                        toast.success('Resume uploaded successfully');
                      }
                    }}
                    onUploadError={(error: Error) => {
                      toast.error(`Upload failed: ${error.message}`);
                    }}
                  />
                )}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between pt-4 border-t">
              <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              {currentStep < steps.length ? (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting || !resumeUrl}>
                  {isSubmitting ? 'Saving Profile...' : 'Complete Profile'}
                  <Check className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

