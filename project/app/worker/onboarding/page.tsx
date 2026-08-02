'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Briefcase, Check, ChevronLeft, ChevronRight, GraduationCap, MapPin, User as UserIcon, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { workerApi, masterDataApi, MasterRawItem } from '@/lib/scn-api';
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

  const locationsQuery = useQuery({ queryKey: ['master', 'locations'], queryFn: () => masterDataApi.raw('locations') });
  const qualificationsQuery = useQuery({ queryKey: ['master', 'qualifications'], queryFn: () => masterDataApi.raw('qualifications') });

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
                  <Input {...register('phone')} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-semibold">Location & Professional Info</h2>
                <div className="space-y-2">
                  <Label>Current City *</Label>
                  <Input {...register('city')} placeholder="e.g. Mumbai" />
                  {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
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

