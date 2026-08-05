'use client';

import { useEffect, useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Briefcase,
  Check,
  Edit,
  GraduationCap,
  Languages,
  Plus,
  Upload,
  User,
  MapPin,
  Link as LinkIcon,
  MoreHorizontal,
  Camera,
  CheckCircle2,

  FileText,
  BadgeCheck,
  Heart,
  Monitor,
  Plane,
  ChevronRight,
  TrendingUp,
  X,
  Star,
  Trash2,
  Loader2,
  Search,
  Phone,
  Mail
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/page-header';
import { getInitials } from '@/lib/format';
import { workerApi, masterDataApi, WorkerWithMeta, MasterRawItem, BackendLookup, BackendLocation } from '@/lib/scn-api';
import { getApiErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { LocationCascadePicker } from '@/components/location-cascade-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UploadButton } from '@/utils/uploadthing';

export default function WorkerProfilePage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const profileQuery = useQuery({ queryKey: ['worker-profile'], queryFn: () => workerApi.profile(), retry: false });
  const profile = profileQuery.data as WorkerWithMeta | undefined;
  
  const [form, setForm] = useState({
    name: '',
    phone: '',
    headline: '',
    summary: '',
    totalExperienceMonths: 0,
    expectedSalaryMin: 0,
    expectedSalaryMax: 0, 
    resumeUrl: '',
    state: '',
    city: '',
    locality: '',
  });

  const [stateInput, setStateInput] = useState('');
  const [isStateOpen, setIsStateOpen] = useState(false);

  const [cityInput, setCityInput] = useState('');
  const [isCityOpen, setIsCityOpen] = useState(false);

  const [localityInput, setLocalityInput] = useState('');
  const [isLocalityOpen, setIsLocalityOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.fullName,
      phone: profile.phone,
      headline: profile.headline,
      summary: profile.bio,
      totalExperienceMonths: profile.experienceYears * 12,
      expectedSalaryMin: profile.expectedSalaryMin,
      expectedSalaryMax: profile.expectedSalaryMax,
      resumeUrl: profile.resumeUrl || '',
      state: profile.state || '',
      city: profile.city || '',
      locality: profile.locality || '',
    });
  }, [profile]);

  const { data: states = [], isLoading: isLoadingStates } = useQuery<string[]>({
    queryKey: ['master', 'locations', 'states'],
    queryFn: () => masterDataApi.getStates(),
  });

  const { data: cities = [], isLoading: isLoadingCities } = useQuery<string[]>({
    queryKey: ['master', 'locations', 'cities', form.state],
    queryFn: () => masterDataApi.getCities(form.state),
    enabled: !!form.state,
  });

  const { data: localities = [], isLoading: isLoadingLocalities } = useQuery<BackendLocation[]>({
    queryKey: ['master', 'locations', 'localities', form.city, form.state],
    queryFn: () => masterDataApi.getLocalities(form.city, form.state),
    enabled: !!form.city && !!form.state,
  });

  useEffect(() => {
    setStateInput(form.state || '');
  }, [form.state]);

  useEffect(() => {
    setCityInput(form.city || '');
  }, [form.city]);

  useEffect(() => {
    setLocalityInput(form.locality || '');
  }, [form.locality]);

  const filteredStates = states.filter((s: string) => {
    if (!stateInput || stateInput === form.state) return true;
    return s.toLowerCase().includes(stateInput.toLowerCase());
  });

  const filteredCities = cities.filter((c: string) => {
    if (!cityInput || cityInput === form.city) return true;
    return c.toLowerCase().includes(cityInput.toLowerCase());
  });

  const filteredLocalities = localities.filter((l: BackendLocation) => {
    if (!localityInput || l.locality === form.locality) return true;
    return l.locality.toLowerCase().includes(localityInput.toLowerCase());
  });

  const handleStateChange = (state: string) => {
    setForm(prev => ({
      ...prev,
      state,
      city: '',
      locality: ''
    }));
    setStateInput(state);
    setCityInput('');
    setLocalityInput('');
  };

  const handleCityChange = (city: string) => {
    setForm(prev => ({
      ...prev,
      city,
      locality: ''
    }));
    setCityInput(city);
    setLocalityInput('');
  };

  const handleLocalityChange = (locality: string) => {
    setForm(prev => ({
      ...prev,
      locality
    }));
    setLocalityInput(locality);
  };

  const createMutation = useMutation({
    mutationFn: workerApi.createProfile,
    onSuccess: () => {
      toast.success('Profile created');
      queryClient.invalidateQueries({ queryKey: ['worker-profile'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not create profile')),
  });

  const updateMutation = useMutation({
    mutationFn: () => workerApi.updateProfile(form),
    onSuccess: () => {
      toast.success('Profile updated successfully');
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['worker-profile'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update profile')),
  });

  // Master Skills Query
  const masterSkillsQuery = useQuery({
    queryKey: ['master', 'skills'],
    queryFn: () => masterDataApi.raw('skills'),
  });
  const masterSkills: BackendLookup[] = (masterSkillsQuery.data as BackendLookup[]) || [];

  // Skills Update state & logic
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [skillSearch, setSkillSearch] = useState('');

  const handleOpenSkillsModal = () => {
    if (!profile) return;
    const currentSkillsLower = (profile.skills || []).map((s) => s.toLowerCase());
    const initialIds = masterSkills
      .filter((ms) => ms.name && currentSkillsLower.includes(ms.name.toLowerCase()))
      .map((ms) => ms.id);
    setSelectedSkillIds(initialIds);
    setSkillsModalOpen(true);
  };

  const toggleSkillSelection = (skillId: number) => {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  const updateSkillsMutation = useMutation({
    mutationFn: (skillIds: number[]) => workerApi.updateProfile({ skillIds }),
    onSuccess: () => {
      toast.success('Skills updated successfully');
      setSkillsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['worker-profile'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update skills')),
  });

  // Experience Management state & logic
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [expForm, setExpForm] = useState({
    companyName: '',
    jobTitle: '',
    fromDate: '',
    toDate: '',
    isCurrent: false,
    description: '',
  });

  const addExperienceMutation = useMutation({
    mutationFn: () =>
      workerApi.addExperience({
        companyName: expForm.companyName,
        jobTitle: expForm.jobTitle,
        fromDate: expForm.fromDate ? new Date(expForm.fromDate).toISOString() : new Date().toISOString(),
        toDate: expForm.isCurrent || !expForm.toDate ? undefined : new Date(expForm.toDate).toISOString(),
        isCurrent: expForm.isCurrent,
        description: expForm.description || undefined,
      }),
    onSuccess: () => {
      toast.success('Experience added successfully');
      setExpModalOpen(false);
      setExpForm({ companyName: '', jobTitle: '', fromDate: '', toDate: '', isCurrent: false, description: '' });
      queryClient.invalidateQueries({ queryKey: ['worker-profile'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not add experience')),
  });

  const deleteExperienceMutation = useMutation({
    mutationFn: (id: string) => workerApi.deleteExperience(id),
    onSuccess: () => {
      toast.success('Experience removed');
      queryClient.invalidateQueries({ queryKey: ['worker-profile'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not delete experience')),
  });

  // Master Languages Query
  const masterLanguagesQuery = useQuery({
    queryKey: ['master', 'languages'],
    queryFn: () => masterDataApi.raw('languages'),
  });
  const masterLanguages: BackendLookup[] = (masterLanguagesQuery.data as BackendLookup[]) || [];

  // Languages Update state & logic
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [selectedLangIds, setSelectedLangIds] = useState<number[]>([]);
  const [langSearch, setLangSearch] = useState('');

  const handleOpenLangModal = () => {
    if (!profile) return;
    const currentLangsLower = (profile.languages || []).map((l) => l.toLowerCase());
    const initialIds = masterLanguages
      .filter((ml) => ml.name && currentLangsLower.includes(ml.name.toLowerCase()))
      .map((ml) => ml.id);
    setSelectedLangIds(initialIds);
    setLangModalOpen(true);
  };

  const toggleLangSelection = (langId: number) => {
    setSelectedLangIds((prev) =>
      prev.includes(langId) ? prev.filter((id) => id !== langId) : [...prev, langId]
    );
  };

  const updateLanguagesMutation = useMutation({
    mutationFn: (languageIds: number[]) => workerApi.updateProfile({ languageIds }),
    onSuccess: () => {
      toast.success('Languages updated successfully');
      setLangModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['worker-profile'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update languages')),
  });



  // Pseudo-random endorsement counts for skills
  const skillsWithScores = useMemo(() => {
    if (!profile?.skills) return [];
    return profile.skills.map((skill, index) => {
      const hash = skill.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const score = (hash % 45) + 15 + (index * 3);
      return { name: skill, score };
    });
  }, [profile?.skills]);

  // Profile strength radial progress ring math
  const completion = profile?.profileCompletion || 90;
  const radius = 45;
  const strokeWidth = 7;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (completion / 100) * circumference;

  if (profileQuery.isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile && !profileQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Profile" description="Create your worker profile to start applying" />
        <Card className="p-8 text-center bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <User className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold text-slate-800">No profile found</h2>
          <p className="mt-2 text-sm text-slate-400 font-medium">Create your profile and then add resume, skills, education, and experience.</p>
          <Button className="mt-6 bg-blue-600 hover:bg-blue-700 font-bold px-6 py-5 rounded-xl shadow-md" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Profile'}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 min-h-screen">
      {profile && (
        <>
          {/* Top Card: Hero Banner Block */}
          <Card className="overflow-hidden bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            
            {/* Avatar & Details Header */}
            <div className="pt-3 px-8 pb-8  relative">
              <div className="flex md:flex-row items-start md:items-end justify-between gap-6 w-full">
                <div className="flex sm:flex-row items-start sm:items-end gap-5 text-left flex-1 min-w-0">
                  
                  {/* Circular LinkedIn "Open to Work" Avatar layout */}
                  <div className="relative shrink-0 z-10">
                    <Avatar className="h-32 w-32 border-4 border-white shadow-md bg-slate-100 relative rounded-full overflow-hidden">
                      {profile.avatarUrl ? (
                        <AvatarImage src={profile.avatarUrl} alt={profile.fullName} className="object-cover h-full w-full" />
                      ) : null}
                      <AvatarFallback className="text-3xl font-black text-blue-600 bg-blue-50 flex items-center justify-center h-full w-full">
                        {getInitials(profile.fullName)}
                      </AvatarFallback>
                      
                      {/* Green Circular LinkedIn "Open to Work" frame */}
                      <div className="absolute inset-0 border-[5px] border-[#00c853] rounded-full pointer-events-none" />
                      <div className="absolute bottom-0 left-0 right-0 bg-[#00c853] text-white text-[7px] font-black text-center py-1 uppercase tracking-wider">
                        Open To Work
                      </div>
                    </Avatar>
                    <button className="absolute bottom-1.5 right-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 border-2 border-white shadow-md transition-colors cursor-pointer z-20" title="Upload Photo">
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="pb-1 space-y-2 flex-1 min-w-0 text-left">
                    <div className="flex flex-wrap items-center justify-start gap-2">
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{profile.fullName}</h2>
                      <Badge className="bg-[#e8eefc] hover:bg-[#e8eefc] text-[#1a73e8] font-bold text-[10px] rounded-full py-0.5 px-2.5 uppercase tracking-wide border-transparent shrink-0">
                        {profile.profileCompletion >= 80 ? 'PRO USER' : 'WORKER'}
                      </Badge>
                    </div>

                    <p className="text-sm text-slate-600 font-semibold leading-relaxed max-w-xl text-left">
                      {profile.headline || (profile.experience[0] ? `${profile.experience[0].designation} at ${profile.experience[0].company}` : 'Worker Profile')}
                    </p>

                    <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-1.5 text-xs text-slate-500 font-bold text-left">
                      {profile.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {profile.phone}
                        </span>
                      )}
                      {profile.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {profile.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {[profile.locality, profile.city, profile.state].filter(Boolean).join(', ') || profile.preferredLocations[0] || 'Location Not Set'}
                      </span>
                      {profile.resumeUrl ? (
                        <a
                          href={profile.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          View Resume
                        </a>
                      ) : null}
                    </div>

                    {/* Header Skills Badges */}
                    {profile.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {profile.skills.slice(0, 5).map((sk) => (
                          <span
                            key={sk}
                            className="bg-slate-100 text-slate-700 font-bold text-[11px] px-2.5 py-0.5 rounded-md"
                          >
                            {sk}
                          </span>
                        ))}
                        {profile.skills.length > 5 && (
                          <span className="bg-slate-100 text-slate-400 font-bold text-[11px] px-2 py-0.5 rounded-md">
                            +{profile.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Header CTA Buttons */}
                <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-end mt-4 lg:mt-0">
                  <Button
                    variant="outline"
                    className="bg-[#e2e8f0] text-slate-700 font-bold border-transparent hover:bg-slate-300 rounded-xl py-5 px-6 text-xs transition-colors shadow-none"
                    onClick={() => setEditing((prev) => !prev)}
                  >
                    {editing ? 'Cancel' : 'Edit Profile'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* 2-Column Grid Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar Column (1/3 width) */}
            <div className="space-y-6 lg:col-span-1">
              
              {/* Profile Optimization Card */}
              <Card className="p-6 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center justify-center gap-4 text-center">
                <h3 className="font-extrabold text-slate-800 text-xs self-start border-b border-slate-50 pb-2.5 w-full text-left">
                  Profile Optimization
                </h3>
                
                <div className="relative flex items-center justify-center shrink-0 my-1">
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
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-slate-800 leading-none">{completion}%</span>
                    <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">COMPLETE</span>
                  </div>
                </div>
                
                <p className="text-slate-400 font-bold text-[10px] leading-normal max-w-[200px]">
                  Add a featured project to reach <span className="text-blue-600">All-Star</span> status.
                </p>
              </Card>

            </div>

            {/* Right Main Column (2/3 width) */}
            <div className="space-y-6 lg:col-span-2">
              
              {/* About Card */}
              <Card className="p-8 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <h3 className="font-extrabold text-slate-800 text-lg">About</h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg" onClick={() => setEditing((value) => !value)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>

                {editing ? (
                  <div className="space-y-4 pt-1">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500">Full Name</Label>
                        <Input value={form.name} className="rounded-xl border-slate-200" onChange={(event) => setForm({ ...form, name: event.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500">Phone</Label>
                        <Input value={form.phone} className="rounded-xl border-slate-200" onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500">Headline</Label>
                      <Input value={form.headline} className="rounded-xl border-slate-200" onChange={(event) => setForm({ ...form, headline: event.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500">Experience (Years)</Label>
                      <Input type="number" value={form.totalExperienceMonths / 12} className="rounded-xl border-slate-200" onChange={(event) => setForm({ ...form, totalExperienceMonths: Number(event.target.value) * 12 })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500">Resume URL</Label>
                      <div className="flex gap-2 items-center">
                        <Input 
                          placeholder="Resume URL (upload file or paste link)"
                          value={form.resumeUrl} 
                          className="rounded-xl border-slate-200 flex-1 text-xs" 
                          onChange={(event) => setForm({ ...form, resumeUrl: event.target.value })} 
                        />
                        <UploadButton
                          endpoint="resumeUploader"
                          headers={{
                            Authorization: typeof window !== 'undefined' && localStorage.getItem('auth-token')
                              ? `Bearer ${localStorage.getItem('auth-token')}`
                              : '',
                          }}
                          onClientUploadComplete={(res) => {
                            if (res && res[0]) {
                              setForm((prev) => ({ ...prev, resumeUrl: res[0].url }));
                              toast.success('Resume uploaded successfully');
                            }
                          }}
                          onUploadError={(error: Error) => {
                            toast.error(`Upload failed: ${error.message}`);
                          }}
                          appearance={{
                            button: "bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs py-2 px-4 font-bold h-10 shadow-sm transition-colors cursor-pointer shrink-0 ut-ready:bg-blue-600 ut-uploading:bg-blue-500",
                            allowedContent: "hidden"
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500">Bio Summary</Label>
                      <Textarea value={form.summary} rows={4} className="rounded-xl border-slate-200" onChange={(event) => setForm({ ...form, summary: event.target.value })} />
                    </div>

                    {/* Location Selection Grid */}
                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <Label className="text-slate-700 font-extrabold text-xs">Current Location</Label>
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
                                  } else if (stateInput.trim()) {
                                    handleStateChange(stateInput.trim());
                                  } else {
                                    setStateInput(form.state);
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

                        {/* City */}
                        <div className="space-y-1.5 relative">
                          <Label className="text-[10px] text-slate-400 font-bold uppercase">City</Label>
                          <div className="relative">
                            <input
                              type="text"
                              autoComplete="off"
                              placeholder={form.state ? "Type or select city..." : "Choose state first"}
                              disabled={!form.state}
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
                                    setCityInput(form.city);
                                  }
                                }, 200);
                              }}
                            />
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-slate-400 pointer-events-none" />
                          </div>
                          {isCityOpen && form.state && (
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
                        </div>

                        {/* Locality */}
                        <div className="space-y-1.5 relative">
                          <Label className="text-[10px] text-slate-400 font-bold uppercase">Locality</Label>
                          <div className="relative">
                            <input
                              type="text"
                              autoComplete="off"
                              placeholder={form.city ? "Type or select locality..." : "Choose city first"}
                              disabled={!form.city}
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
                                    setLocalityInput(form.locality);
                                  }
                                }, 200);
                              }}
                            />
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-slate-400 pointer-events-none" />
                          </div>
                          {isLocalityOpen && form.city && (
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
                    </div>
                    
                    <div className="flex gap-2.5 pt-2">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs py-2 px-5" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                        <Check className="mr-1 h-4 w-4" />
                        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button variant="outline" className="border-slate-200 text-slate-600 rounded-xl text-xs py-2 px-5" onClick={() => setEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs leading-relaxed text-slate-500 font-bold whitespace-pre-line">
                    {profile.bio || 'Add a professional biography here.'}
                  </p>
                )}
              </Card>

              {/* Experience Timeline */}
              <Card className="p-8 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <h3 className="font-extrabold text-slate-800 text-lg">Experience</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg"
                    onClick={() => setExpModalOpen(true)}
                    title="Add Experience"
                  >
                    <Plus className="h-4.5 w-4.5" />
                  </Button>
                </div>

                <div className="relative pl-6 space-y-8 border-l-2 border-slate-100">
                  {profile.experience.length ? (
                    profile.experience.map((exp) => {
                      const expName = exp.company.toLowerCase();
                      const iconLetter = exp.company.charAt(0).toUpperCase();
                      const isApple = expName.includes('apple');
                      const isNetflix = expName.includes('netflix');

                      return (
                        <div key={exp.id} className="relative group">
                          {/* Dot connector */}
                          <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-blue-200 bg-white z-10">
                            <span className="h-2 w-2 rounded-full bg-blue-600" />
                          </div>

                          <div className="flex items-start justify-between gap-4">
                            <div className="flex gap-4">
                              {/* Logo Wrapper */}
                              {isApple ? (
                                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center shrink-0 text-slate-800 font-bold text-base">
                                  
                                </div>
                              ) : isNetflix ? (
                                <div className="h-10 w-10 rounded-xl bg-red-50 border border-red-100 shadow-sm flex items-center justify-center shrink-0 text-red-600 font-black text-base">
                                  N
                                </div>
                              ) : (
                                <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 shadow-sm flex items-center justify-center shrink-0 text-blue-600 font-bold text-base">
                                  {iconLetter}
                                </div>
                              )}

                              <div className="space-y-1">
                                <h4 className="font-extrabold text-slate-800 text-sm">{exp.designation}</h4>
                                <p className="text-xs font-bold text-blue-600">
                                  {exp.company} <span className="text-slate-300 mx-1">•</span> Full-time
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold">
                                  {exp.startDate ? new Date(exp.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Jan 2021'} — {exp.current ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Present'}
                                </p>
                                {exp.description && (
                                  <p className="text-[11px] leading-relaxed text-slate-500 font-bold mt-2 whitespace-pre-line">
                                    {exp.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => deleteExperienceMutation.mutate(exp.id)}
                              disabled={deleteExperienceMutation.isPending}
                              title="Delete experience"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-slate-400">
                      <p className="text-xs font-semibold">No experience added yet. Click the "+" button to add work experience.</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Skills & Endorsements */}
              <Card className="p-8 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <h3 className="font-extrabold text-slate-800 text-lg">Skills & Endorsements</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg"
                    onClick={handleOpenSkillsModal}
                    title="Edit Skills"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  {skillsWithScores.length ? (
                    skillsWithScores.map((sk) => (
                      <span
                        key={sk.name}
                        className="inline-flex items-center bg-[#f1f5f9]/70 text-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-transparent"
                      >
                        <span>{sk.name}</span>
                        <div className="h-3.5 w-px bg-slate-300 mx-2.5" />
                        <span className="text-blue-600 font-black">{sk.score}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">No skills added yet. Click the edit icon to add skills.</span>
                  )}
                </div>
              </Card>

              {/* Education Card */}
              <Card className="p-8 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
                <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-50 pb-2">
                  Education
                </h3>
                
                <div className="space-y-4">
                  {profile.education.length ? (
                    profile.education.map((edu) => (
                      <div key={edu.id} className="flex gap-3">
                        <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                          <GraduationCap className="h-4.5 w-4.5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-700 leading-tight">{edu.degree}</h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{edu.institution}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">No education details added yet. Click Edit Profile to update.</span>
                  )}
                </div>
              </Card>

              {/* Languages Card */}
              <Card className="p-8 bg-[#ffffff] border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <h3 className="font-extrabold text-slate-800 text-lg">Languages</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg"
                    onClick={handleOpenLangModal}
                    title="Edit Languages"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {profile.languages.length ? (
                    profile.languages.map((lang) => (
                      <span key={lang} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100/60 text-slate-500 font-extrabold text-xs px-3.5 py-1.5 rounded-xl">
                        <Languages className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{lang}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">No languages added yet. Click edit to select languages.</span>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Skills Edit Dialog */}
          <Dialog open={skillsModalOpen} onOpenChange={setSkillsModalOpen}>
            <DialogContent className="sm:max-w-lg rounded-2xl p-6 bg-white">
              <DialogHeader>
                <DialogTitle className="text-lg font-extrabold text-slate-800">Update Skills</DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-medium">
                  Select skills to display on your worker profile for job matching.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search skills..."
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    className="pl-9 rounded-xl border-slate-200 text-xs"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto pr-1 space-y-1.5 border rounded-xl p-3 border-slate-100 bg-slate-50/50">
                  {masterSkillsQuery.isLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    </div>
                  ) : masterSkills.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No skills found in master data.</p>
                  ) : (
                    masterSkills
                      .filter((s) => !skillSearch || s.name?.toLowerCase().includes(skillSearch.toLowerCase()))
                      .map((skill) => {
                        const isSelected = selectedSkillIds.includes(skill.id);
                        return (
                          <div
                            key={skill.id}
                            onClick={() => toggleSkillSelection(skill.id)}
                            className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors text-xs font-bold ${
                              isSelected ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-white text-slate-700 hover:bg-slate-100/70 border border-transparent'
                            }`}
                          >
                            <span>{skill.name}</span>
                            <Checkbox checked={isSelected} onCheckedChange={() => toggleSkillSelection(skill.id)} />
                          </div>
                        );
                      })
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-xs text-slate-400 font-bold w-full">Selected ({selectedSkillIds.length}):</span>
                  {selectedSkillIds.map((id) => {
                    const item = masterSkills.find((s) => s.id === id);
                    if (!item) return null;
                    return (
                      <Badge key={id} className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none text-[11px] font-bold py-1 px-2.5 rounded-lg flex items-center gap-1">
                        <span>{item.name}</span>
                        <X className="h-3 w-3 cursor-pointer" onClick={() => toggleSkillSelection(id)} />
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" className="rounded-xl text-xs" onClick={() => setSkillsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs px-5"
                  onClick={() => updateSkillsMutation.mutate(selectedSkillIds)}
                  disabled={updateSkillsMutation.isPending}
                >
                  {updateSkillsMutation.isPending ? 'Saving...' : 'Save Skills'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Experience Dialog */}
          <Dialog open={expModalOpen} onOpenChange={setExpModalOpen}>
            <DialogContent className="sm:max-w-lg rounded-2xl p-6 bg-white">
              <DialogHeader>
                <DialogTitle className="text-lg font-extrabold text-slate-800">Add Work Experience</DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-medium">
                  Add details about your previous or current employment.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600">Job Title / Designation *</Label>
                  <Input
                    placeholder="e.g. Senior Product Designer"
                    value={expForm.jobTitle}
                    onChange={(e) => setExpForm({ ...expForm, jobTitle: e.target.value })}
                    className="rounded-xl border-slate-200 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600">Company Name *</Label>
                  <Input
                    placeholder="e.g. Apple Inc."
                    value={expForm.companyName}
                    onChange={(e) => setExpForm({ ...expForm, companyName: e.target.value })}
                    className="rounded-xl border-slate-200 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600">Start Date *</Label>
                    <Input
                      type="date"
                      value={expForm.fromDate}
                      onChange={(e) => setExpForm({ ...expForm, fromDate: e.target.value })}
                      className="rounded-xl border-slate-200 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600">End Date</Label>
                    <Input
                      type="date"
                      disabled={expForm.isCurrent}
                      value={expForm.toDate}
                      onChange={(e) => setExpForm({ ...expForm, toDate: e.target.value })}
                      className="rounded-xl border-slate-200 text-xs disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox
                    id="isCurrent"
                    checked={expForm.isCurrent}
                    onCheckedChange={(checked) => setExpForm({ ...expForm, isCurrent: Boolean(checked) })}
                  />
                  <Label htmlFor="isCurrent" className="text-xs font-bold text-slate-700 cursor-pointer">
                    I currently work here
                  </Label>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600">Description</Label>
                  <Textarea
                    rows={3}
                    placeholder="Describe your key responsibilities and achievements..."
                    value={expForm.description}
                    onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                    className="rounded-xl border-slate-200 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" className="rounded-xl text-xs" onClick={() => setExpModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs px-5"
                  disabled={!expForm.jobTitle || !expForm.companyName || !expForm.fromDate || addExperienceMutation.isPending}
                  onClick={() => addExperienceMutation.mutate()}
                >
                  {addExperienceMutation.isPending ? 'Saving...' : 'Add Experience'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Languages Edit Dialog */}
          <Dialog open={langModalOpen} onOpenChange={setLangModalOpen}>
            <DialogContent className="sm:max-w-lg rounded-2xl p-6 bg-white">
              <DialogHeader>
                <DialogTitle className="text-lg font-extrabold text-slate-800">Update Languages</DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-medium">
                  Select the languages you can speak or write fluently.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search languages..."
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    className="pl-9 rounded-xl border-slate-200 text-xs"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto pr-1 space-y-1.5 border rounded-xl p-3 border-slate-100 bg-slate-50/50">
                  {masterLanguagesQuery.isLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    </div>
                  ) : masterLanguages.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No languages found in master data.</p>
                  ) : (
                    masterLanguages
                      .filter((l) => !langSearch || l.name?.toLowerCase().includes(langSearch.toLowerCase()))
                      .map((lang) => {
                        const isSelected = selectedLangIds.includes(lang.id);
                        return (
                          <div
                            key={lang.id}
                            onClick={() => toggleLangSelection(lang.id)}
                            className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors text-xs font-bold ${
                              isSelected ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-white text-slate-700 hover:bg-slate-100/70 border border-transparent'
                            }`}
                          >
                            <span>{lang.name}</span>
                            <Checkbox checked={isSelected} onCheckedChange={() => toggleLangSelection(lang.id)} />
                          </div>
                        );
                      })
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-xs text-slate-400 font-bold w-full">Selected ({selectedLangIds.length}):</span>
                  {selectedLangIds.map((id) => {
                    const item = masterLanguages.find((l) => l.id === id);
                    if (!item) return null;
                    return (
                      <Badge key={id} className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none text-[11px] font-bold py-1 px-2.5 rounded-lg flex items-center gap-1">
                        <span>{item.name}</span>
                        <X className="h-3 w-3 cursor-pointer" onClick={() => toggleLangSelection(id)} />
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" className="rounded-xl text-xs" onClick={() => setLangModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs px-5"
                  onClick={() => updateLanguagesMutation.mutate(selectedLangIds)}
                  disabled={updateLanguagesMutation.isPending}
                >
                  {updateLanguagesMutation.isPending ? 'Saving...' : 'Save Languages'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </>
      )}
    </div>
  );
}
