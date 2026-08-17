'use client';

import { useEffect, useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Edit,
  GraduationCap,
  Languages,
  Plus,
  User,
  MapPin,
  Link as LinkIcon,
  Camera,
  ChevronRight,
  X,
  Trash2,
  Loader2,
  Search,
  Phone,
  Mail,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { workerApi, masterDataApi, WorkerWithMeta, BackendLookup, BackendLocation } from '@/lib/scn-api';
import { getApiErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UploadButton } from '@/utils/uploadthing';

const QUAL_CATEGORY_LABELS: Record<string, string> = {
  TEN: '10th Pass',
  TWELVE: '12th Pass',
  DIPLOMA: 'Diploma',
  GRADUATE: 'Graduate',
  POST_GRADUATE: 'Post Graduate',
  ANY: 'Other / Any',
};
const QUAL_CATEGORY_ORDER = ['TEN', 'TWELVE', 'DIPLOMA', 'GRADUATE', 'POST_GRADUATE', 'ANY'];

export default function WorkerProfilePage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const profileQuery = useQuery({ queryKey: ['worker-profile'], queryFn: () => workerApi.profile(), retry: false });
  const profile = profileQuery.data as WorkerWithMeta | undefined;

  const [form, setForm] = useState({
    name: '', phone: '', alternatePhone: '', departmentName: '', headline: '', summary: '',
    totalExperienceMonths: 0, expectedSalaryMin: 0, expectedSalaryMax: 0,
    resumeUrl: '', state: '', city: '', locality: '',
    dob: '',
    maritalStatus: '' as '' | 'single' | 'married' | 'divorced' | 'widowed',
    category: '' as '' | 'GEN' | 'OBC' | 'SC_ST',
    jobPreference: '',
    isFresher: false,
    workingStatus: '' as '' | 'SERVING_NOTICE' | 'WORKING' | 'NOT_WORKING' | 'IMMEDIATE_JOINER',
    noticePeriodDays: 0,
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
      name: profile.fullName, phone: profile.phone, alternatePhone: profile.alternatePhone || '', departmentName: profile.department || '', headline: profile.headline,
      summary: profile.bio, totalExperienceMonths: profile.experienceYears * 12,
      expectedSalaryMin: profile.expectedSalaryMin, expectedSalaryMax: profile.expectedSalaryMax,
      resumeUrl: profile.resumeUrl || '', state: profile.state || '',
      city: profile.city || '', locality: profile.locality || '',
      dob: profile.dob || '',
      maritalStatus: (profile.maritalStatus as any) || '',
      category: (profile.category as any) || '',
      jobPreference: profile.jobPreference || '',
      isFresher: profile.isFresher ?? false,
      workingStatus: (profile.workingStatus as any) || '',
      noticePeriodDays: profile.noticePeriodDays || 0,
    });
  }, [profile]);

  const { data: states = [], isLoading: isLoadingStates } = useQuery<string[]>({ queryKey: ['master', 'locations', 'states'], queryFn: () => masterDataApi.getStates() });
  const { data: cities = [], isLoading: isLoadingCities } = useQuery<string[]>({ queryKey: ['master', 'locations', 'cities', form.state], queryFn: () => masterDataApi.getCities(form.state), enabled: !!form.state });
  const { data: localities = [], isLoading: isLoadingLocalities } = useQuery<BackendLocation[]>({ queryKey: ['master', 'locations', 'localities', form.city, form.state], queryFn: () => masterDataApi.getLocalities(form.city, form.state), enabled: !!form.city && !!form.state });

  useEffect(() => { setStateInput(form.state || ''); }, [form.state]);
  useEffect(() => { setCityInput(form.city || ''); }, [form.city]);
  useEffect(() => { setLocalityInput(form.locality || ''); }, [form.locality]);

  const filteredStates = states.filter((s: string) => !stateInput || stateInput === form.state || s.toLowerCase().includes(stateInput.toLowerCase()));
  const filteredCities = cities.filter((c: string) => !cityInput || cityInput === form.city || c.toLowerCase().includes(cityInput.toLowerCase()));
  const filteredLocalities = localities.filter((l: BackendLocation) => !localityInput || l.locality === form.locality || l.locality.toLowerCase().includes(localityInput.toLowerCase()));

  const handleStateChange = (state: string) => { setForm(p => ({ ...p, state, city: '', locality: '' })); setStateInput(state); setCityInput(''); setLocalityInput(''); };
  const handleCityChange = (city: string) => { setForm(p => ({ ...p, city, locality: '' })); setCityInput(city); setLocalityInput(''); };
  const handleLocalityChange = (locality: string) => { setForm(p => ({ ...p, locality })); setLocalityInput(locality); };

  const createMutation = useMutation({
    mutationFn: workerApi.createProfile,
    onSuccess: () => { toast.success('Profile created'); queryClient.invalidateQueries({ queryKey: ['worker-profile'] }); },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not create profile')),
  });

  const updateMutation = useMutation({
    mutationFn: () => workerApi.updateProfile({
      name: form.name, phone: form.phone, alternatePhone: form.alternatePhone || undefined, departmentName: form.departmentName || undefined, headline: form.headline, summary: form.summary,
      totalExperienceMonths: form.totalExperienceMonths,
      expectedSalaryMin: form.expectedSalaryMin, expectedSalaryMax: form.expectedSalaryMax,
      resumeUrl: form.resumeUrl || undefined,
      state: form.state || undefined,
      city: form.city || undefined,
      locality: form.locality || undefined,
      currentLocality: form.locality || undefined,
      dob: form.dob || undefined, maritalStatus: form.maritalStatus || undefined,
      category: form.category || undefined, jobPreference: form.jobPreference || undefined,
      isFresher: form.isFresher, workingStatus: form.workingStatus || undefined,
      noticePeriodDays: form.workingStatus === 'SERVING_NOTICE' ? (form.noticePeriodDays || undefined) : undefined,
    }),
    onSuccess: () => { toast.success('Profile updated'); setEditing(false); queryClient.invalidateQueries({ queryKey: ['worker-profile'] }); },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update profile')),
  });

  // Skills
  const masterSkillsQuery = useQuery({ queryKey: ['master', 'skills'], queryFn: () => masterDataApi.raw('skills') });
  const masterSkills: BackendLookup[] = (masterSkillsQuery.data as BackendLookup[]) || [];
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const handleOpenSkillsModal = () => {
    if (!profile) return;
    const lower = (profile.skills || []).map(s => s.toLowerCase());
    setSelectedSkillIds(masterSkills.filter(ms => ms.name && lower.includes(ms.name.toLowerCase())).map(ms => ms.id));
    setSkillsModalOpen(true);
  };
  const toggleSkillSelection = (id: number) => setSelectedSkillIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const updateSkillsMutation = useMutation({
    mutationFn: (skillIds: number[]) => workerApi.updateProfile({ skillIds }),
    onSuccess: () => { toast.success('Skills updated'); setSkillsModalOpen(false); queryClient.invalidateQueries({ queryKey: ['worker-profile'] }); },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update skills')),
  });

  // Experience
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [expForm, setExpForm] = useState({ companyName: '', jobTitle: '', fromDate: '', toDate: '', isCurrent: false, description: '' });
  const addExperienceMutation = useMutation({
    mutationFn: () => workerApi.addExperience({
      companyName: expForm.companyName, jobTitle: expForm.jobTitle,
      fromDate: expForm.fromDate ? new Date(expForm.fromDate).toISOString() : new Date().toISOString(),
      toDate: expForm.isCurrent || !expForm.toDate ? undefined : new Date(expForm.toDate).toISOString(),
      isCurrent: expForm.isCurrent, description: expForm.description || undefined,
    }),
    onSuccess: () => {
      toast.success('Experience added'); setExpModalOpen(false);
      setExpForm({ companyName: '', jobTitle: '', fromDate: '', toDate: '', isCurrent: false, description: '' });
      queryClient.invalidateQueries({ queryKey: ['worker-profile'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not add experience')),
  });
  const deleteExperienceMutation = useMutation({
    mutationFn: (id: string) => workerApi.deleteExperience(id),
    onSuccess: () => { toast.success('Experience removed'); queryClient.invalidateQueries({ queryKey: ['worker-profile'] }); },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not delete experience')),
  });

  // Languages - with proficiency selection
  const masterLanguagesQuery = useQuery({ queryKey: ['master', 'languages'], queryFn: () => masterDataApi.raw('languages') });
  const masterLanguages: BackendLookup[] = (masterLanguagesQuery.data as BackendLookup[]) || [];
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [selectedLangs, setSelectedLangs] = useState<{ languageId: number; proficiency: string }[]>([]);
  const [langSearch, setLangSearch] = useState('');

  const handleOpenLangModal = () => {
    if (!profile) return;
    const ids = profile.languageIds?.length
      ? profile.languageIds
      : masterLanguages.filter(ml => ml.name && profile.languages.map(l => l.toLowerCase()).includes(ml.name.toLowerCase())).map(ml => ml.id);
    setSelectedLangs(ids.map(id => ({ languageId: id, proficiency: 'fluent' })));
    setLangModalOpen(true);
  };

  const toggleLangSelection = (id: number) => {
    setSelectedLangs(prev => {
      const exists = prev.some(item => item.languageId === id);
      if (exists) {
        return prev.filter(item => item.languageId !== id);
      }
      return [...prev, { languageId: id, proficiency: 'fluent' }];
    });
  };

  const updateProficiency = (id: number, proficiency: string) => {
    setSelectedLangs(prev =>
      prev.map(item => (item.languageId === id ? { ...item, proficiency } : item))
    );
  };

  const updateLanguagesMutation = useMutation({
    mutationFn: (languages: { languageId: number; proficiency: string }[]) => workerApi.updateProfile({ languages }),
    onSuccess: () => { toast.success('Languages updated'); setLangModalOpen(false); queryClient.invalidateQueries({ queryKey: ['worker-profile'] }); },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update languages')),
  });

  // Education
  const qualGroupsQuery = useQuery<Record<string, BackendLookup[]>>({ queryKey: ['master', 'qualifications', 'grouped'], queryFn: () => workerApi.getQualificationsGrouped() });
  const qualGroups: Record<string, BackendLookup[]> = qualGroupsQuery.data || {};
  const [eduModalOpen, setEduModalOpen] = useState(false);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [qualSearch, setQualSearch] = useState('');
  const [isQualOpen, setIsQualOpen] = useState(false);
  const [selectedQualId, setSelectedQualId] = useState<number | null>(null);
  const [selectedQualLevel, setSelectedQualLevel] = useState('');
  const [selectedQualName, setSelectedQualName] = useState('');
  const [eduInstitute, setEduInstitute] = useState('');
  const [eduPassoutYear, setEduPassoutYear] = useState('');
  const openAddEduModal = () => {
    setEditingEduId(null); setSelectedQualId(null); setSelectedQualLevel(''); setSelectedQualName('');
    setEduInstitute(''); setEduPassoutYear(''); setQualSearch(''); setEduModalOpen(true);
  };
  const openEditEduModal = (edu: { id: string; degree: string; institution: string; qualificationId?: number; level?: string; endYear: number }) => {
    setEditingEduId(edu.id); setSelectedQualId(edu.qualificationId || null);
    setSelectedQualLevel(edu.level || ''); setSelectedQualName(edu.degree);
    setEduInstitute(edu.institution); setEduPassoutYear(edu.endYear ? String(edu.endYear) : '');
    setQualSearch(''); setEduModalOpen(true);
  };
  const addEduMutation = useMutation({
    mutationFn: () => workerApi.addEducation({ qualificationId: selectedQualId || undefined, qualificationName: !selectedQualId ? selectedQualName : undefined, level: selectedQualLevel || undefined, institute: eduInstitute || undefined, passoutYear: eduPassoutYear ? Number(eduPassoutYear) : undefined }),
    onSuccess: () => { toast.success('Education added'); setEduModalOpen(false); queryClient.invalidateQueries({ queryKey: ['worker-profile'] }); },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not add education')),
  });
  const editEduMutation = useMutation({
    mutationFn: () => workerApi.editEducation(editingEduId!, { qualificationId: selectedQualId || undefined, qualificationName: !selectedQualId ? selectedQualName : undefined, level: selectedQualLevel || undefined, institute: eduInstitute || undefined, passoutYear: eduPassoutYear ? Number(eduPassoutYear) : undefined }),
    onSuccess: () => { toast.success('Education updated'); setEduModalOpen(false); queryClient.invalidateQueries({ queryKey: ['worker-profile'] }); },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update education')),
  });
  const deleteEduMutation = useMutation({
    mutationFn: (id: string) => workerApi.deleteEducation(id),
    onSuccess: () => { toast.success('Education removed'); queryClient.invalidateQueries({ queryKey: ['worker-profile'] }); },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not remove education')),
  });

  // Industries
  const masterIndustriesQuery = useQuery({ queryKey: ['master', 'industries'], queryFn: () => masterDataApi.raw('industries') });
  const masterIndustries: BackendLookup[] = (masterIndustriesQuery.data as BackendLookup[]) || [];
  const [industryModalOpen, setIndustryModalOpen] = useState(false);
  const [selectedIndustryIds, setSelectedIndustryIds] = useState<number[]>([]);
  const [industrySearch, setIndustrySearch] = useState('');
  const handleOpenIndustryModal = () => { if (!profile) return; setSelectedIndustryIds(profile.preferredIndustryIds || []); setIndustryModalOpen(true); };
  const toggleIndustrySelection = (id: number) => setSelectedIndustryIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const updateIndustriesMutation = useMutation({
    mutationFn: (preferredIndustryIds: number[]) => workerApi.updateProfile({ preferredIndustryIds }),
    onSuccess: () => { toast.success('Industries updated'); setIndustryModalOpen(false); queryClient.invalidateQueries({ queryKey: ['worker-profile'] }); },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update industries')),
  });

  const skillsWithScores = useMemo(() => {
    if (!profile?.skills) return [];
    return profile.skills.map((skill, index) => ({ name: skill, score: (skill.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 45) + 15 + index * 3 }));
  }, [profile?.skills]);

  const completion = profile?.profileCompletion || 0;
  const radius = 45; const strokeWidth = 7;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (completion / 100) * circumference;

  const filteredQualGroups = useMemo(() => {
    const result: Record<string, BackendLookup[]> = {};
    for (const key of QUAL_CATEGORY_ORDER) {
      const items = qualGroups[key] || [];
      const filtered = qualSearch ? items.filter(q => q.name.toLowerCase().includes(qualSearch.toLowerCase())) : items;
      if (filtered.length > 0) result[key] = filtered;
    }
    return result;
  }, [qualGroups, qualSearch]);

  if (profileQuery.isLoading) return <div className="flex min-h-[400px] items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  if (!profile && !profileQuery.isLoading) return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="Create your profile to start applying" />
      <Card className="p-8 text-center bg-white border border-slate-100 rounded-3xl">
        <User className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold text-slate-800">No profile found</h2>
        <p className="mt-2 text-sm text-slate-400">Create your profile to start applying for jobs.</p>
        <Button className="mt-6 bg-blue-600 hover:bg-blue-700 font-bold px-6 py-5 rounded-xl" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create Profile'}
        </Button>
      </Card>
    </div>
  );

  const wStatusLabel = {
    SERVING_NOTICE: `Notice Period${profile?.noticePeriodDays ? ` (${profile.noticePeriodDays}d)` : ''}`,
    WORKING: 'Currently Working',
    NOT_WORKING: 'Not Working',
    IMMEDIATE_JOINER: 'Immediate Joiner',
  };

  return (
    <div className="space-y-6 pb-16 min-h-screen">
      {profile && (
        <>
          {/* Hero Card */}
          <Card className="overflow-hidden bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="pt-3 px-8 pb-8 relative">
              <div className="flex md:flex-row items-start md:items-end justify-between gap-6 w-full">
                <div className="flex sm:flex-row items-start sm:items-end gap-5 text-left flex-1 min-w-0">
                  <div className="relative shrink-0 z-10">
                    <Avatar className="h-32 w-32 border-4 border-white shadow-md bg-slate-100 relative rounded-full overflow-hidden">
                      {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={profile.fullName} className="object-cover h-full w-full" /> : null}
                      <AvatarFallback className="text-3xl font-black text-blue-600 bg-blue-50 flex items-center justify-center h-full w-full">{getInitials(profile.fullName)}</AvatarFallback>
                      <div className="absolute inset-0 border-[5px] border-[#00c853] rounded-full pointer-events-none" />
                      <div className="absolute bottom-0 left-0 right-0 bg-[#00c853] text-white text-[7px] font-black text-center py-1 uppercase tracking-wider">Open To Work</div>
                    </Avatar>
                    <button className="absolute bottom-1.5 right-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 border-2 border-white shadow-md z-20"><Camera className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="pb-1 space-y-2 flex-1 min-w-0 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black text-slate-800">{profile.fullName}</h2>
                      <Badge className="bg-[#e8eefc] text-[#1a73e8] font-bold text-[10px] rounded-full py-0.5 px-2.5 uppercase border-transparent">{profile.profileCompletion >= 80 ? 'PRO USER' : 'WORKER'}</Badge>
                      {profile.isFresher && <Badge className="bg-green-50 text-green-600 border-none text-[10px] font-bold rounded-full px-2.5 py-0.5">FRESHER</Badge>}
                    </div>
                    <p className="text-sm text-slate-600 font-semibold max-w-xl">{profile.headline || 'Worker Profile'}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-bold">
                      {profile.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-400" />{profile.phone}</span>}
                      {profile.alternatePhone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-400" />Alt: {profile.alternatePhone}</span>}
                      {profile.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-slate-400" />{profile.email}</span>}
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" />{[profile.locality, profile.city, profile.state].filter(Boolean).join(', ') || 'Location Not Set'}</span>
                      {profile.resumeUrl && <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline"><LinkIcon className="h-3.5 w-3.5" />View Resume</a>}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {profile.workingStatus && <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${profile.workingStatus === 'IMMEDIATE_JOINER' ? 'bg-green-50 text-green-600' : profile.workingStatus === 'SERVING_NOTICE' ? 'bg-amber-50 text-amber-600' : profile.workingStatus === 'WORKING' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>{wStatusLabel[profile.workingStatus]}</span>}
                      {profile.category && <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-600">{{ GEN: 'General', OBC: 'OBC', SC_ST: 'SC/ST' }[profile.category]}</span>}
                      {profile.maritalStatus && <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-600 capitalize">{profile.maritalStatus}</span>}
                    </div>
                    {profile.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {profile.skills.slice(0, 5).map(sk => <span key={sk} className="bg-slate-100 text-slate-700 font-bold text-[11px] px-2.5 py-0.5 rounded-md">{sk}</span>)}
                        {profile.skills.length > 5 && <span className="bg-slate-100 text-slate-400 font-bold text-[11px] px-2 py-0.5 rounded-md">+{profile.skills.length - 5} more</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-end mt-4 lg:mt-0">
                  <Button variant="outline" className="bg-[#e2e8f0] text-slate-700 font-bold border-transparent hover:bg-slate-300 rounded-xl py-5 px-6 text-xs" onClick={() => setEditing(p => !p)}>{editing ? 'Cancel' : 'Edit Profile'}</Button>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar */}
            <div className="space-y-6 lg:col-span-1">
              <Card className="p-6 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center gap-4 text-center">
                <h3 className="font-extrabold text-slate-800 text-xs self-start border-b border-slate-50 pb-2.5 w-full text-left">Profile Optimization</h3>
                <div className="relative flex items-center justify-center shrink-0 my-1">
                  <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
                    <circle stroke="#f1f5f9" fill="transparent" strokeWidth={strokeWidth} r={normalizedRadius} cx={radius} cy={radius} />
                    <circle stroke="#2563eb" fill="transparent" strokeWidth={strokeWidth} strokeDasharray={`${circumference} ${circumference}`} style={{ strokeDashoffset }} strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius} className="transition-all duration-700 ease-out" />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-slate-800 leading-none">{completion}%</span>
                    <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">COMPLETE</span>
                  </div>
                </div>
                <p className="text-slate-400 font-bold text-[10px] leading-normal max-w-[200px]">Add more details to reach <span className="text-blue-600">All-Star</span> status.</p>
              </Card>

              {(profile.dob || profile.maritalStatus || profile.category || profile.jobPreference) && (
                <Card className="p-6 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-3">
                  <h3 className="font-extrabold text-slate-800 text-xs border-b border-slate-50 pb-2.5">Personal Details</h3>
                  {profile.dob && <div className="flex justify-between text-xs"><span className="font-bold text-slate-400">Date of Birth</span><span className="font-bold text-slate-700">{new Date(profile.dob).toLocaleDateString()}</span></div>}
                  {profile.maritalStatus && <div className="flex justify-between text-xs"><span className="font-bold text-slate-400">Marital Status</span><span className="font-bold text-slate-700 capitalize">{profile.maritalStatus}</span></div>}
                  {profile.category && <div className="flex justify-between text-xs"><span className="font-bold text-slate-400">Category</span><span className="font-bold text-slate-700">{{ GEN: 'General', OBC: 'OBC', SC_ST: 'SC/ST' }[profile.category]}</span></div>}
                  {profile.jobPreference && <div className="flex justify-between text-xs"><span className="font-bold text-slate-400">Job Preference</span><span className="font-bold text-slate-700">{profile.jobPreference}</span></div>}
                </Card>
              )}

              <Card className="p-6 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-3">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <h3 className="font-extrabold text-slate-800 text-xs">Preferred Industries</h3>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700 rounded-lg" onClick={handleOpenIndustryModal}><Edit className="h-3.5 w-3.5" /></Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.preferredIndustries.length ? profile.preferredIndustries.map(ind => <span key={ind} className="bg-indigo-50 text-indigo-600 font-bold text-[11px] px-2.5 py-1 rounded-lg">{ind}</span>) : <span className="text-xs text-slate-400">None — click edit to add.</span>}
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6 lg:col-span-2">
              {/* About */}
              <Card className="p-8 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <h3 className="font-extrabold text-slate-800 text-lg">About</h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-lg" onClick={() => setEditing(v => !v)}><Edit className="h-4 w-4" /></Button>
                </div>
                {editing ? (
                  <div className="space-y-4 pt-1">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-500">Full Name</Label><Input value={form.name} className="rounded-xl border-slate-200" onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                      <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-500">Primary Phone</Label><Input value={form.phone} className="rounded-xl border-slate-200" onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                      <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-500">Alternate Phone</Label><Input placeholder="e.g. 9876543210" value={form.alternatePhone} className="rounded-xl border-slate-200" onChange={e => setForm({ ...form, alternatePhone: e.target.value })} /></div>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-500">Headline</Label><Input value={form.headline} className="rounded-xl border-slate-200" onChange={e => setForm({ ...form, headline: e.target.value })} /></div>
                    <div className="grid gap-4 sm:grid-cols-2 items-end">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500">Experience (Years)</Label>
                        <Input type="number" disabled={form.isFresher} value={form.isFresher ? 0 : form.totalExperienceMonths / 12} className="rounded-xl border-slate-200 disabled:opacity-50" onChange={e => setForm({ ...form, totalExperienceMonths: Number(e.target.value) * 12 })} />
                      </div>
                      <div className="flex items-center gap-2 pb-1">
                        <Checkbox id="isFresher" checked={form.isFresher} onCheckedChange={checked => setForm({ ...form, isFresher: Boolean(checked), totalExperienceMonths: checked ? 0 : form.totalExperienceMonths })} />
                        <Label htmlFor="isFresher" className="text-xs font-bold text-slate-700 cursor-pointer">I am a Fresher (0 experience)</Label>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500">Working Status</Label>
                        <Select value={form.workingStatus} onValueChange={v => setForm({ ...form, workingStatus: v as any })}>
                          <SelectTrigger className="rounded-xl border-slate-200 text-xs"><SelectValue placeholder="Select status..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WORKING">Currently Working</SelectItem>
                            <SelectItem value="SERVING_NOTICE">Serving Notice Period</SelectItem>
                            <SelectItem value="NOT_WORKING">Not Working</SelectItem>
                            <SelectItem value="IMMEDIATE_JOINER">Immediate Joiner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {form.workingStatus === 'SERVING_NOTICE' && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-500">Notice Period (Days)</Label>
                          <Input type="number" placeholder="e.g. 30" value={form.noticePeriodDays || ''} className="rounded-xl border-slate-200" onChange={e => setForm({ ...form, noticePeriodDays: Number(e.target.value) })} />
                        </div>
                      )}
                    </div>
                    <div className="border-t border-slate-100 pt-3 space-y-3">
                      <Label className="text-slate-700 font-extrabold text-xs">Personal Details</Label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-500">Date of Birth</Label><Input type="date" value={form.dob} className="rounded-xl border-slate-200 text-xs" onChange={e => setForm({ ...form, dob: e.target.value })} /></div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-500">Marital Status</Label>
                          <Select value={form.maritalStatus} onValueChange={v => setForm({ ...form, maritalStatus: v as any })}>
                            <SelectTrigger className="rounded-xl border-slate-200 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Single</SelectItem><SelectItem value="married">Married</SelectItem>
                              <SelectItem value="divorced">Divorced</SelectItem><SelectItem value="widowed">Widowed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-500">Category</Label>
                          <Select value={form.category} onValueChange={v => setForm({ ...form, category: v as any })}>
                            <SelectTrigger className="rounded-xl border-slate-200 text-xs"><SelectValue placeholder="Select category..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GEN">General</SelectItem><SelectItem value="OBC">OBC</SelectItem><SelectItem value="SC_ST">SC / ST</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-500">Job Preference</Label><Input placeholder="e.g. Full Time, Remote" value={form.jobPreference} className="rounded-xl border-slate-200 text-xs" onChange={e => setForm({ ...form, jobPreference: e.target.value })} /></div>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-500">Expected Salary Min</Label><Input type="number" value={form.expectedSalaryMin} className="rounded-xl border-slate-200" onChange={e => setForm({ ...form, expectedSalaryMin: Number(e.target.value) })} /></div>
                      <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-500">Expected Salary Max</Label><Input type="number" value={form.expectedSalaryMax} className="rounded-xl border-slate-200" onChange={e => setForm({ ...form, expectedSalaryMax: Number(e.target.value) })} /></div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500">Resume URL</Label>
                      <div className="flex gap-2 items-center">
                        <Input placeholder="Paste URL or upload" value={form.resumeUrl} className="rounded-xl border-slate-200 flex-1 text-xs" onChange={e => setForm({ ...form, resumeUrl: e.target.value })} />
                        <UploadButton endpoint="resumeUploader" headers={{ Authorization: typeof window !== 'undefined' && localStorage.getItem('auth-token') ? `Bearer ${localStorage.getItem('auth-token')}` : '' }} onClientUploadComplete={res => { if (res?.[0]) { setForm(p => ({ ...p, resumeUrl: res[0].url })); toast.success('Uploaded'); } }} onUploadError={(e: Error) => { toast.error(`Upload failed: ${e.message}`); }} appearance={{ button: "bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs py-2 px-4 font-bold h-10 shadow-sm cursor-pointer shrink-0", allowedContent: "hidden" }} />
                      </div>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-500">Bio Summary</Label><Textarea value={form.summary} rows={4} className="rounded-xl border-slate-200" onChange={e => setForm({ ...form, summary: e.target.value })} /></div>
                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <Label className="text-slate-700 font-extrabold text-xs">Current Location</Label>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-1.5 relative">
                          <Label className="text-[10px] text-slate-400 font-bold uppercase">State</Label>
                          <div className="relative">
                            <input type="text" autoComplete="off" placeholder="Type or select state..." className="w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 h-10 px-3.5 pr-10 focus:outline-none focus:border-blue-600 transition-all shadow-sm" value={stateInput} onChange={e => { setStateInput(e.target.value); setIsStateOpen(true); }} onFocus={() => setIsStateOpen(true)} onBlur={() => setTimeout(() => { setIsStateOpen(false); const m = states.find((s: string) => s.toLowerCase() === stateInput.toLowerCase()); if (m) handleStateChange(m); else if (stateInput.trim()) handleStateChange(stateInput.trim()); else setStateInput(form.state); }, 200)} />
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-slate-400 pointer-events-none" />
                          </div>
                          {isStateOpen && (<div className="absolute left-0 right-0 top-[66px] z-50 max-h-[200px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">{isLoadingStates ? <div className="flex justify-center p-2.5"><Loader2 className="h-4 w-4 animate-spin text-slate-400" /></div> : filteredStates.length === 0 ? <div className="text-xs text-slate-400 p-2.5 text-center">No match — will be saved as-is</div> : filteredStates.map((s: string) => <button key={s} type="button" className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50" onMouseDown={() => handleStateChange(s)}>{s}</button>)}</div>)}
                        </div>
                        <div className="space-y-1.5 relative">
                          <Label className="text-[10px] text-slate-400 font-bold uppercase">City</Label>
                          <div className="relative">
                            <input type="text" autoComplete="off" placeholder={form.state ? "Type or select city..." : "Choose state first"} disabled={!form.state} className="w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 h-10 px-3.5 pr-10 focus:outline-none focus:border-blue-600 transition-all shadow-sm disabled:opacity-50" value={cityInput} onChange={e => { setCityInput(e.target.value); setIsCityOpen(true); }} onFocus={() => setIsCityOpen(true)} onBlur={() => setTimeout(() => { setIsCityOpen(false); const m = cities.find((c: string) => c.toLowerCase() === cityInput.toLowerCase()); if (m) handleCityChange(m); else if (cityInput.trim()) handleCityChange(cityInput.trim()); else setCityInput(form.city); }, 200)} />
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-slate-400 pointer-events-none" />
                          </div>
                          {isCityOpen && form.state && (<div className="absolute left-0 right-0 top-[66px] z-50 max-h-[200px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">{isLoadingCities ? <div className="flex justify-center p-2.5"><Loader2 className="h-4 w-4 animate-spin text-slate-400" /></div> : filteredCities.length === 0 ? <div className="text-xs text-slate-400 p-2.5 text-center">No match — will be saved as-is</div> : filteredCities.map((c: string) => <button key={c} type="button" className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50" onMouseDown={() => handleCityChange(c)}>{c}</button>)}</div>)}
                        </div>
                        <div className="space-y-1.5 relative">
                          <Label className="text-[10px] text-slate-400 font-bold uppercase">Locality</Label>
                          <div className="relative">
                            <input type="text" autoComplete="off" placeholder={form.city ? "Type or select locality..." : "Choose city first"} disabled={!form.city} className="w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 h-10 px-3.5 pr-10 focus:outline-none focus:border-blue-600 transition-all shadow-sm disabled:opacity-50" value={localityInput} onChange={e => { setLocalityInput(e.target.value); setIsLocalityOpen(true); }} onFocus={() => setIsLocalityOpen(true)} onBlur={() => setTimeout(() => { setIsLocalityOpen(false); const m = localities.find((l: BackendLocation) => l.locality.toLowerCase() === localityInput.toLowerCase()); if (m) handleLocalityChange(m.locality); else if (localityInput.trim()) handleLocalityChange(localityInput.trim()); else setLocalityInput(form.locality); }, 200)} />
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-slate-400 pointer-events-none" />
                          </div>
                          {isLocalityOpen && form.city && (<div className="absolute left-0 right-0 top-[66px] z-50 max-h-[200px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">{isLoadingLocalities ? <div className="flex justify-center p-2.5"><Loader2 className="h-4 w-4 animate-spin text-slate-400" /></div> : filteredLocalities.length === 0 ? <div className="text-xs text-slate-400 p-2.5 text-center">No match — will be saved as-is</div> : filteredLocalities.map((loc: BackendLocation) => <button key={loc.id} type="button" className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50" onMouseDown={() => handleLocalityChange(loc.locality)}>{loc.locality}</button>)}</div>)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2.5 pt-2">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs py-2 px-5" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}><Check className="mr-1 h-4 w-4" />{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</Button>
                      <Button variant="outline" className="border-slate-200 text-slate-600 rounded-xl text-xs py-2 px-5" onClick={() => setEditing(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : <p className="text-xs leading-relaxed text-slate-500 font-bold whitespace-pre-line">{profile.bio || 'Add a professional biography here.'}</p>}
              </Card>

              {/* Experience */}
              <Card className="p-8 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <h3 className="font-extrabold text-slate-800 text-lg">Experience</h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-lg" onClick={() => { if (profile.isFresher) { toast.error('Uncheck Fresher to add experience'); return; } setExpModalOpen(true); }}><Plus className="h-4.5 w-4.5" /></Button>
                </div>
                {profile.isFresher && <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-700 font-bold">Fresher profile — experience not applicable</div>}
                <div className="relative pl-6 space-y-8 border-l-2 border-slate-100">
                  {profile.experience.length ? profile.experience.map(exp => (
                    <div key={exp.id} className="relative group">
                      <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-blue-200 bg-white z-10"><span className="h-2 w-2 rounded-full bg-blue-600" /></div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4">
                          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600 font-bold">{exp.company.charAt(0).toUpperCase()}</div>
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-slate-800 text-sm">{exp.designation}</h4>
                            <p className="text-xs font-bold text-blue-600">{exp.company}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{exp.startDate ? new Date(exp.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''} — {exp.current ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Present'}</p>
                            {exp.description && <p className="text-[11px] text-slate-500 font-bold mt-2 whitespace-pre-line">{exp.description}</p>}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0 opacity-0 group-hover:opacity-100" onClick={() => deleteExperienceMutation.mutate(exp.id)} disabled={deleteExperienceMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  )) : <div className="text-center py-6"><p className="text-xs text-slate-400">{profile.isFresher ? 'Fresher — no experience needed.' : 'No experience added yet.'}</p></div>}
                </div>
              </Card>

              {/* Skills */}
              <Card className="p-8 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <h3 className="font-extrabold text-slate-800 text-lg">Skills & Endorsements</h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-lg" onClick={handleOpenSkillsModal}><Edit className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-3 pt-1">
                  {skillsWithScores.length ? skillsWithScores.map(sk => (
                    <span key={sk.name} className="inline-flex items-center bg-[#f1f5f9]/70 text-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-xl">
                      <span>{sk.name}</span><div className="h-3.5 w-px bg-slate-300 mx-2.5" /><span className="text-blue-600 font-black">{sk.score}</span>
                    </span>
                  )) : <span className="text-xs text-slate-400">No skills added yet.</span>}
                </div>
              </Card>

              {/* Education */}
              <Card className="p-8 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <h3 className="font-extrabold text-slate-800 text-lg">Education & Qualifications</h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-lg" onClick={openAddEduModal}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-3">
                  {profile.education.length ? profile.education.map(edu => (
                    <div key={edu.id} className="flex items-start gap-3 group">
                      <div className="h-8 w-8 bg-blue-50 rounded-xl flex items-center justify-center shrink-0"><GraduationCap className="h-4 w-4 text-blue-600" /></div>
                      <div className="flex-1">
                        <h4 className="text-xs font-extrabold text-slate-700 leading-tight">{edu.degree}</h4>
                        {edu.institution && <p className="text-[10px] text-slate-400 font-bold mt-0.5">{edu.institution}</p>}
                        {edu.endYear && edu.endYear !== new Date().getFullYear() && <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Passout: {edu.endYear}</p>}
                        {edu.level && <span className="inline-block mt-1 text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">{QUAL_CATEGORY_LABELS[edu.level] || edu.level}</span>}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => openEditEduModal(edu)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" onClick={() => deleteEduMutation.mutate(edu.id)} disabled={deleteEduMutation.isPending}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  )) : <span className="text-xs text-slate-400">No education added yet.</span>}
                </div>
              </Card>

              {/* Languages */}
              <Card className="p-8 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <h3 className="font-extrabold text-slate-800 text-lg">Languages</h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-lg" onClick={handleOpenLangModal}><Edit className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {profile.languageDetails?.length ? profile.languageDetails.map(item => (
                    <span key={item.name} className="inline-flex items-center gap-1.5 bg-blue-50/70 border border-blue-100 text-blue-800 font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-xs">
                      <Languages className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span>{item.name}</span>
                      {item.proficiency && (
                        <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-md ml-0.5">
                          {item.proficiency}
                        </span>
                      )}
                    </span>
                  )) : profile.languages.length ? profile.languages.map(lang => (
                    <span key={lang} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100/60 text-slate-500 font-extrabold text-xs px-3.5 py-1.5 rounded-xl">
                      <Languages className="h-3.5 w-3.5 text-slate-400 shrink-0" /><span>{lang}</span>
                    </span>
                  )) : <span className="text-xs text-slate-400">No languages added yet.</span>}
                </div>
              </Card>
            </div>
          </div>

          {/* === Dialogs === */}
          <Dialog open={skillsModalOpen} onOpenChange={setSkillsModalOpen}>
            <DialogContent className="sm:max-w-lg rounded-2xl p-6 bg-white">
              <DialogHeader><DialogTitle className="text-lg font-extrabold text-slate-800">Update Skills</DialogTitle><DialogDescription className="text-xs text-slate-500">Select skills for job matching.</DialogDescription></DialogHeader>
              <div className="space-y-4 py-3">
                <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input placeholder="Search skills..." value={skillSearch} onChange={e => setSkillSearch(e.target.value)} className="pl-9 rounded-xl border-slate-200 text-xs" /></div>
                <div className="max-h-60 overflow-y-auto pr-1 space-y-1.5 border rounded-xl p-3 border-slate-100 bg-slate-50/50">
                  {masterSkillsQuery.isLoading ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /></div> : masterSkills.filter(s => !skillSearch || s.name?.toLowerCase().includes(skillSearch.toLowerCase())).map(skill => { const isSelected = selectedSkillIds.includes(skill.id); return <div key={skill.id} onClick={() => toggleSkillSelection(skill.id)} className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs font-bold ${isSelected ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-white text-slate-700 hover:bg-slate-100/70 border border-transparent'}`}><span>{skill.name}</span><Checkbox checked={isSelected} onCheckedChange={() => toggleSkillSelection(skill.id)} /></div>; })}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-xs text-slate-400 font-bold w-full">Selected ({selectedSkillIds.length}):</span>
                  {selectedSkillIds.map(id => { const item = masterSkills.find(s => s.id === id); if (!item) return null; return <Badge key={id} className="bg-blue-100 text-blue-700 border-none text-[11px] font-bold py-1 px-2.5 rounded-lg flex items-center gap-1"><span>{item.name}</span><X className="h-3 w-3 cursor-pointer" onClick={() => toggleSkillSelection(id)} /></Badge>; })}
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" className="rounded-xl text-xs" onClick={() => setSkillsModalOpen(false)}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs px-5" onClick={() => updateSkillsMutation.mutate(selectedSkillIds)} disabled={updateSkillsMutation.isPending}>{updateSkillsMutation.isPending ? 'Saving...' : 'Save Skills'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={eduModalOpen} onOpenChange={setEduModalOpen}>
            <DialogContent className="sm:max-w-lg rounded-2xl p-6 bg-white max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="text-lg font-extrabold text-slate-800">{editingEduId ? 'Edit Education' : 'Add Education'}</DialogTitle><DialogDescription className="text-xs text-slate-500">Select qualification level and specific qualification.</DialogDescription></DialogHeader>
              <div className="space-y-4 py-2">
                {/* 1. Qualification Level Select */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600">Qualification Level *</Label>
                  <Select
                    value={selectedQualLevel}
                    onValueChange={(lvl) => {
                      setSelectedQualLevel(lvl);
                      setSelectedQualId(null);
                      setSelectedQualName('');
                      setQualSearch('');
                    }}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200 text-xs font-bold">
                      <SelectValue placeholder="Select Level (10th, 12th, Graduate, Diploma, etc.)" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUAL_CATEGORY_ORDER.map((catKey) => (
                        <SelectItem key={catKey} value={catKey} className="text-xs font-bold">
                          {QUAL_CATEGORY_LABELS[catKey] || catKey}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. Specific Qualification Dropdown with Search Box */}
                {selectedQualLevel && (
                  <div className="space-y-1.5 relative">
                    <Label className="text-xs font-bold text-slate-600">Specific Qualification *</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 z-10" />
                      <Input
                        placeholder={selectedQualName || `Type to search ${QUAL_CATEGORY_LABELS[selectedQualLevel] || 'qualification'}...`}
                        value={qualSearch}
                        onChange={(e) => {
                          setQualSearch(e.target.value);
                          setIsQualOpen(true);
                        }}
                        onFocus={() => setIsQualOpen(true)}
                        className="pl-9 rounded-xl border-slate-200 text-xs font-bold"
                      />
                    </div>
                    {isQualOpen && (
                      <div className="absolute left-0 right-0 top-[68px] z-50 max-h-48 overflow-y-auto space-y-1 border rounded-xl p-2 border-slate-200 bg-white shadow-xl">
                        {qualGroupsQuery.isLoading ? (
                          <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-blue-600" /></div>
                        ) : !(qualGroups[selectedQualLevel] || []).filter(q => !qualSearch || q.name.toLowerCase().includes(qualSearch.toLowerCase())).length ? (
                          <p className="text-xs text-slate-400 text-center py-3">No matching qualifications found.</p>
                        ) : (
                          (qualGroups[selectedQualLevel] || [])
                            .filter((q) => !qualSearch || q.name.toLowerCase().includes(qualSearch.toLowerCase()))
                            .map((q) => (
                              <button
                                key={q.id}
                                type="button"
                                onClick={() => {
                                  setSelectedQualId(q.id);
                                  setSelectedQualName(q.name);
                                  setQualSearch(q.name);
                                  setIsQualOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                                  selectedQualId === q.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-transparent'
                                }`}
                              >
                                {q.name}
                              </button>
                            ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {selectedQualName && <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 text-xs font-bold text-blue-700">Selected: {selectedQualName}</div>}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Institution / School</Label><Input placeholder="e.g. DPS, Delhi University" value={eduInstitute} onChange={e => setEduInstitute(e.target.value)} className="rounded-xl border-slate-200 text-xs" /></div>
                  <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Passout Year</Label><Input type="number" placeholder="e.g. 2022" value={eduPassoutYear} onChange={e => setEduPassoutYear(e.target.value)} className="rounded-xl border-slate-200 text-xs" /></div>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" className="rounded-xl text-xs" onClick={() => setEduModalOpen(false)}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs px-5" disabled={!selectedQualId || (editingEduId ? editEduMutation.isPending : addEduMutation.isPending)} onClick={() => editingEduId ? editEduMutation.mutate() : addEduMutation.mutate()}>{editingEduId ? (editEduMutation.isPending ? 'Saving...' : 'Update') : (addEduMutation.isPending ? 'Saving...' : 'Add Education')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={expModalOpen} onOpenChange={setExpModalOpen}>
            <DialogContent className="sm:max-w-lg rounded-2xl p-6 bg-white">
              <DialogHeader><DialogTitle className="text-lg font-extrabold text-slate-800">Add Work Experience</DialogTitle><DialogDescription className="text-xs text-slate-500">Add employment details.</DialogDescription></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Job Title *</Label><Input placeholder="e.g. Senior Designer" value={expForm.jobTitle} onChange={e => setExpForm({ ...expForm, jobTitle: e.target.value })} className="rounded-xl border-slate-200 text-xs" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Company Name *</Label><Input placeholder="e.g. Apple Inc." value={expForm.companyName} onChange={e => setExpForm({ ...expForm, companyName: e.target.value })} className="rounded-xl border-slate-200 text-xs" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Start Date *</Label><Input type="date" value={expForm.fromDate} onChange={e => setExpForm({ ...expForm, fromDate: e.target.value })} className="rounded-xl border-slate-200 text-xs" /></div>
                  <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">End Date</Label><Input type="date" disabled={expForm.isCurrent} value={expForm.toDate} onChange={e => setExpForm({ ...expForm, toDate: e.target.value })} className="rounded-xl border-slate-200 text-xs disabled:opacity-50" /></div>
                </div>
                <div className="flex items-center space-x-2"><Checkbox id="isCurrentExp" checked={expForm.isCurrent} onCheckedChange={c => setExpForm({ ...expForm, isCurrent: Boolean(c) })} /><Label htmlFor="isCurrentExp" className="text-xs font-bold text-slate-700 cursor-pointer">I currently work here</Label></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Description</Label><Textarea rows={3} placeholder="Key responsibilities..." value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} className="rounded-xl border-slate-200 text-xs" /></div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" className="rounded-xl text-xs" onClick={() => setExpModalOpen(false)}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs px-5" disabled={!expForm.jobTitle || !expForm.companyName || !expForm.fromDate || addExperienceMutation.isPending} onClick={() => addExperienceMutation.mutate()}>{addExperienceMutation.isPending ? 'Saving...' : 'Add Experience'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={langModalOpen} onOpenChange={setLangModalOpen}>
            <DialogContent className="sm:max-w-lg rounded-2xl p-6 bg-white max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-extrabold text-slate-800">Update Languages & Fluency</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">Select languages and set your proficiency level for each.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search languages..." value={langSearch} onChange={e => setLangSearch(e.target.value)} className="pl-9 rounded-xl border-slate-200 text-xs font-bold" />
                </div>
                <div className="max-h-52 overflow-y-auto pr-1 space-y-1.5 border rounded-xl p-3 border-slate-100 bg-slate-50/50">
                  {masterLanguagesQuery.isLoading ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /></div>
                  ) : (
                    masterLanguages
                      .filter(l => !langSearch || l.name?.toLowerCase().includes(langSearch.toLowerCase()))
                      .map(lang => {
                        const isSelected = selectedLangs.some(item => item.languageId === lang.id);
                        return (
                          <div
                            key={lang.id}
                            onClick={() => toggleLangSelection(lang.id)}
                            className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs font-bold ${
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

                {/* Selected Languages with Proficiency Selectors */}
                {selectedLangs.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-700 font-extrabold block">Selected Languages & Proficiency ({selectedLangs.length}):</span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedLangs.map(item => {
                        const langItem = masterLanguages.find(l => l.id === item.languageId);
                        if (!langItem) return null;
                        return (
                          <div key={item.languageId} className="flex items-center justify-between gap-3 p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs">
                            <span className="font-bold text-blue-900 shrink-0">{langItem.name}</span>
                            <div className="flex items-center gap-2">
                              <Select value={item.proficiency} onValueChange={(val) => updateProficiency(item.languageId, val)}>
                                <SelectTrigger className="h-8 w-32 rounded-lg bg-white border-blue-200 text-xs font-bold text-blue-700">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="fluent" className="text-xs font-bold">Fluent</SelectItem>
                                  <SelectItem value="intermediate" className="text-xs font-bold">Intermediate</SelectItem>
                                  <SelectItem value="basic" className="text-xs font-bold">Basic</SelectItem>
                                  <SelectItem value="native" className="text-xs font-bold">Native</SelectItem>
                                </SelectContent>
                              </Select>
                              <X className="h-4 w-4 text-blue-400 hover:text-blue-600 cursor-pointer shrink-0" onClick={() => toggleLangSelection(item.languageId)} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" className="rounded-xl text-xs" onClick={() => setLangModalOpen(false)}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs px-5" onClick={() => updateLanguagesMutation.mutate(selectedLangs)} disabled={updateLanguagesMutation.isPending}>
                  {updateLanguagesMutation.isPending ? 'Saving...' : 'Save Languages'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={industryModalOpen} onOpenChange={setIndustryModalOpen}>
            <DialogContent className="sm:max-w-lg rounded-2xl p-6 bg-white">
              <DialogHeader><DialogTitle className="text-lg font-extrabold text-slate-800">Preferred Industries</DialogTitle><DialogDescription className="text-xs text-slate-500">Select industries you prefer to work in.</DialogDescription></DialogHeader>
              <div className="space-y-4 py-3">
                <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input placeholder="Search industries..." value={industrySearch} onChange={e => setIndustrySearch(e.target.value)} className="pl-9 rounded-xl border-slate-200 text-xs" /></div>
                <div className="max-h-60 overflow-y-auto pr-1 space-y-1.5 border rounded-xl p-3 border-slate-100 bg-slate-50/50">
                  {masterIndustriesQuery.isLoading ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /></div> : masterIndustries.filter(ind => !industrySearch || ind.name?.toLowerCase().includes(industrySearch.toLowerCase())).map(ind => { const isSelected = selectedIndustryIds.includes(ind.id); return <div key={ind.id} onClick={() => toggleIndustrySelection(ind.id)} className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs font-bold ${isSelected ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-white text-slate-700 hover:bg-slate-100/70 border border-transparent'}`}><span>{ind.name}</span><Checkbox checked={isSelected} onCheckedChange={() => toggleIndustrySelection(ind.id)} /></div>; })}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-xs text-slate-400 font-bold w-full">Selected ({selectedIndustryIds.length}):</span>
                  {selectedIndustryIds.map(id => { const item = masterIndustries.find(ind => ind.id === id); if (!item) return null; return <Badge key={id} className="bg-indigo-100 text-indigo-700 border-none text-[11px] font-bold py-1 px-2.5 rounded-lg flex items-center gap-1"><span>{item.name}</span><X className="h-3 w-3 cursor-pointer" onClick={() => toggleIndustrySelection(id)} /></Badge>; })}
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" className="rounded-xl text-xs" onClick={() => setIndustryModalOpen(false)}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs px-5" onClick={() => updateIndustriesMutation.mutate(selectedIndustryIds)} disabled={updateIndustriesMutation.isPending}>{updateIndustriesMutation.isPending ? 'Saving...' : 'Save Industries'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
