'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Briefcase, Check, ChevronLeft, ChevronRight, GraduationCap, MapPin, User as UserIcon, FileText, X, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { workerApi, masterDataApi, MasterRawItem, BackendLocation } from '@/lib/scn-api';
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
  city: z.string().min(2, 'City is required'),
  currentLocality: z.string().optional(),
  preferredLocationIds: z.array(z.string()).default([]),
  headline: z.string().min(5, 'Headline is required'),
  summary: z.string().optional(),
  // Education
  qualificationId: z.string().optional(),
  institute: z.string().optional(),
  passoutYear: z.coerce.number().optional(),
  // Experience
  companyName: z.string().optional(),
  jobTitle: z.string().optional(),
  fromDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function WorkerOnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedLocality, setSelectedLocality] = useState<string>('');

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

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedCity('');
    setSelectedLocality('');
    setValue('city', '');
    setValue('currentLocality', '');
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedLocality('');
    setValue('city', city, { shouldValidate: true });
    setValue('currentLocality', '');
  };

  const handleLocalityChange = (locality: string) => {
    setSelectedLocality(locality);
    setValue('currentLocality', locality, { shouldValidate: true });
  };

  const locations: MasterRawItem[] = locationsQuery.data ?? [];
  const qualifications: MasterRawItem[] = qualificationsQuery.data ?? [];

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
      // 1. Create or update profile
      await workerApi.updateProfile({
        name: `${data.firstName} ${data.lastName}`,
        phone: data.phone,
        headline: data.headline,
        summary: data.summary,
        resumeUrl: resumeUrl || undefined,
        preferredLocationIds: data.preferredLocationIds.map(Number),
        city: data.city,
        currentLocality: data.currentLocality || undefined,
      });

      // 2. Add education if provided
      if (data.qualificationId && data.institute && data.passoutYear) {
        await workerApi.addEducation({
          qualificationId: Number(data.qualificationId),
          institute: data.institute,
          passoutYear: data.passoutYear,
        });
      }

      // 3. Add experience if provided
      if (data.companyName && data.jobTitle && data.fromDate) {
        await workerApi.addExperience({
          companyName: data.companyName,
          jobTitle: data.jobTitle,
          fromDate: new Date(data.fromDate).toISOString(),
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
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input {...register('phone')} readOnly className="bg-muted cursor-not-allowed opacity-75" />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-semibold">Location & Professional Info</h2>
                
                {/* Location Grid Row */}
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Step 1: State */}
                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Select value={selectedState} onValueChange={handleStateChange}>
                      <SelectTrigger className="w-full rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 h-10">
                        <SelectValue placeholder={isLoadingStates ? "Loading..." : "Choose state"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[250px]">
                        {isLoadingStates ? (
                          <div className="flex items-center justify-center p-2.5">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          </div>
                        ) : (
                          states.map((state: string) => (
                            <SelectItem key={state} value={state} className="text-xs font-medium">
                              {state}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Step 2: City */}
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Select
                      value={selectedCity}
                      onValueChange={handleCityChange}
                      disabled={!selectedState}
                    >
                      <SelectTrigger className="w-full rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 h-10 disabled:opacity-50 disabled:bg-slate-100/50">
                        <SelectValue placeholder={isLoadingCities ? "Loading..." : "Choose city"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[250px]">
                        {isLoadingCities ? (
                          <div className="flex items-center justify-center p-2.5">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          </div>
                        ) : (
                          cities.map((city: string) => (
                            <SelectItem key={city} value={city} className="text-xs font-medium">
                              {city}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.city && <p className="text-xs text-destructive mt-1">{errors.city.message}</p>}
                  </div>

                  {/* Step 3: Locality */}
                  <div className="space-y-2">
                    <Label>Locality (Optional)</Label>
                    <Select
                      value={selectedLocality}
                      onValueChange={handleLocalityChange}
                      disabled={!selectedCity}
                    >
                      <SelectTrigger className="w-full rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 h-10 disabled:opacity-50 disabled:bg-slate-100/50">
                        <SelectValue placeholder={isLoadingLocalities ? "Loading..." : "Choose locality"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[250px]">
                        {isLoadingLocalities ? (
                          <div className="flex items-center justify-center p-2.5">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          </div>
                        ) : (
                          localities.map((loc: BackendLocation) => (
                            <SelectItem key={loc.id} value={loc.locality} className="text-xs font-medium">
                              {loc.locality}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
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
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-semibold">Education (Optional)</h2>
                <div className="space-y-2">
                  <Label>Highest Qualification</Label>
                  <Select onValueChange={(value) => setValue('qualificationId', value)}>
                    <SelectTrigger><SelectValue placeholder="Select qualification" /></SelectTrigger>
                    <SelectContent>
                      {qualifications.map((q) => (
                        <SelectItem key={q.id} value={String(q.id)}>{'name' in q ? q.name : String(q.id)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Institute Name</Label>
                  <Input {...register('institute')} placeholder="e.g. University of Mumbai" />
                </div>
                <div className="space-y-2">
                  <Label>Year of Passing</Label>
                  <Input type="number" {...register('passoutYear')} placeholder="e.g. 2020" />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-semibold">Work Experience (Optional)</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input {...register('companyName')} placeholder="e.g. Google" />
                  </div>
                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input {...register('jobTitle')} placeholder="e.g. Frontend Developer" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" {...register('fromDate')} />
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

