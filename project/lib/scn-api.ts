import {
  AdminStats,
  Application,
  ApplicationStatus,
  Job,
  MasterDataItem,
  User,
  WorkerProfile,
  WorkerLanguageDetail,
} from '@/lib/types';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';

export type BackendRole = 'super_admin' | 'recruiter' | 'worker';
export type BackendJobStatus = 'draft' | 'active' | 'closed';
export type MasterResource =
  | 'industries'
  | 'locations'
  | 'skills'
  | 'job-roles'
  | 'languages'
  | 'qualifications'
  | 'benefits'
  | 'assets'
  | 'functions';

export interface BackendUser {
  id: string;
  email: string;
  phone?: string | null;
  role: BackendRole;
  isActive?: boolean;
  createdAt?: string;
  recruiter?: BackendRecruiter | null;
  workerProfile?: BackendWorkerProfile | null;
}

export interface BackendLookup {
  id: number;
  name: string;
  level?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface BackendLocation {
  id: number;
  state: string;
  city: string;
  locality: string;
  isActive?: boolean;
  createdAt?: string;
}

export type MasterRawItem = BackendLookup | BackendLocation;

interface BackendWorkerProfile {
  id: string;
  userId: string;
  user?: Pick<BackendUser, 'email' | 'phone' | 'isActive' | 'createdAt'>;
  name?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  departmentId?: number | null;
  department?: BackendLookup | null;
  state?: string | null;
  city?: string | null;
  currentLocality?: string | null;
  profilePhotoUrl?: string | null;
  headline?: string | null;
  summary?: string | null;
  totalExperienceMonths?: number;
  expectedSalaryMin?: number | null;
  expectedSalaryMax?: number | null;
  availability?: 'immediate' | 'within_15_days' | 'within_30_days' | null;
  resumeUrl?: string | null;
  profileComplete?: boolean;
  createdAt?: string;
  // New API v2 fields
  dob?: string | null;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed' | null;
  category?: 'GEN' | 'OBC' | 'SC_ST' | null;
  jobPreference?: string | null;
  isFresher?: boolean;
  workingStatus?: 'SERVING_NOTICE' | 'WORKING' | 'NOT_WORKING' | 'IMMEDIATE_JOINER' | null;
  noticePeriodDays?: number | null;
  education?: {
    id: string;
    institute?: string | null;
    passoutYear?: number | null;
    score?: string | null;
    qualification?: BackendLookup;
  }[];
  experience?: {
    id: string;
    companyName: string;
    jobTitle: string;
    fromDate: string;
    toDate?: string | null;
    isCurrent: boolean;
    description?: string | null;
    industryId?: number | null;
    industry?: BackendLookup | null;
    departmentId?: number | null;
    department?: BackendLookup | null;
  }[];
  skills?: { skill?: BackendLookup }[];
  languages?: { language?: BackendLookup; proficiency?: string | null }[];
  preferredLocations?: { location?: BackendLocation }[];
  preferredIndustries?: { industry?: BackendLookup }[];
}

interface BackendRecruiter {
  id: string;
  userId?: string;
  user?: {
    id: string;
    email: string;
    phone?: string | null;
    isActive?: boolean;
    createdAt?: string;
    _count?: { jobsPosted?: number };
  };
  name: string;
  email: string;
  isActive?: boolean;
  createdAt?: string;
  categories?: { industry?: BackendLookup; industryId: number }[];
}

interface BackendJob {
  id: string;
  title: string;
  description?: string | null;
  responsibilities?: string[];
  requirements?: string[];
  benefits?: string[];
  industryId: number;
  industry?: BackendLookup;
  functionId?: number | null;
  function?: BackendLookup | null;
  jobRoleId?: number | null;
  jobRole?: BackendLookup | null;
  locationId: number;
  location?: BackendLocation;
  wageMin?: number | null;
  wageMax?: number | null;
  wageType?: 'daily' | 'monthly' | 'annual' | null;
  workingDays?: number | null;
  gender?: 'MALE' | 'FEMALE' | 'ANY' | null;
  freshersOnly?: boolean | null;
  shiftType?: 'day' | 'night' | 'rotational' | null;
  jobType?: 'full_time' | 'part_time' | 'contract' | null;
  headcountRequired: number;
  headcountFilled?: number;
  minExperienceMonths?: number;
  maxExperienceMonths?: number;
  status: BackendJobStatus;
  postedBy: string;
  poster?: {
    id: string;
    email: string;
    recruiter?: Pick<BackendRecruiter, 'id' | 'name' | 'email'> | null;
  };
  skills?: { skill?: BackendLookup }[];
  qualifications?: { qualification?: BackendLookup }[];
  benefitNames?: string[];
  assetNames?: string[];
  createdAt: string;
  updatedAt?: string;
  _count?: { applications?: number };
}

interface BackendApplicationHistory {
  id: string;
  toStatus: ApplicationStatus;
  notes?: string | null;
  changedAt: string;
  changedBy?: { email?: string; role?: BackendRole };
}

interface BackendApplication {
  id: string;
  jobId: string;
  workerId: string;
  recruiterId: string;
  status: ApplicationStatus;
  coverNote?: string | null;
  appliedAt: string;
  updatedAt?: string;
  job?: BackendJob;
  worker?: {
    id: string;
    email?: string | null;
    phone?: string | null;
    workerProfile?: BackendWorkerProfile | null;
  };
  history?: BackendApplicationHistory[];
}

export interface RecruiterView {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  designation: string;
  industries: string[];
  industryIds: number[];
  status: 'active' | 'inactive';
  jobsPosted: number;
  createdAt: string;
}

export interface JobWithMeta extends Job {
  backendStatus: BackendJobStatus;
  applicationsCount: number;
  industryId: number;
  locationId: number;
  jobRoleId?: number;
  functionId?: number;
}

export interface WorkerWithMeta extends WorkerProfile {
  status: 'active' | 'inactive';
  joinedAt: string;
  city: string;
  state?: string;
  locality?: string;
  preferredLocationDetails?: { id: number; label: string }[];
  gender?: string;
  preferredDepartments?: string[];
  preferredJobRoles?: string[];
  assets?: string[];
}

export interface DashboardStats {
  activeJobs: number;
  draftJobs: number;
  closedJobs: number;
  totalApplications: number;
  applicationsByStatus: Record<string, number>;
}

export interface WorkerSearchParams {
  q?: string;
  city?: string;
  jobRoleIds?: string | number | (string | number)[];
  languageIds?: string | number | (string | number)[];
  minExperienceMonths?: number | string;
  industryIds?: string | number | (string | number)[];
  departmentIds?: string | number | (string | number)[];
  skillIds?: string | number | (string | number)[];
  qualificationIds?: string | number | (string | number)[];
  gender?: string;
  minAge?: number | string;
  maxAge?: number | string;
  assets?: string | string[];
  completeOnly?: boolean;
  skillId?: number;
}

export interface ApplicationSearchParams {
  days?: number | string;
  q?: string;
  city?: string;
  jobRoleIds?: string | number | (string | number)[];
  languageIds?: string | number | (string | number)[];
  minExperienceMonths?: number | string;
  industryIds?: string | number | (string | number)[];
  departmentIds?: string | number | (string | number)[];
  skillIds?: string | number | (string | number)[];
  qualificationIds?: string | number | (string | number)[];
  gender?: string;
  minAge?: number | string;
  maxAge?: number | string;
  assets?: string | string[];
  status?: string;
}

function formatSearchParams(params?: Record<string, any>) {
  if (!params) return undefined;
  const clean: Record<string, any> = {};
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && val !== 'all') {
      if (Array.isArray(val)) {
        if (val.length > 0) {
          clean[key] = val.join(',');
        }
      } else {
        clean[key] = val;
      }
    }
  });
  return Object.keys(clean).length > 0 ? clean : undefined;
}

const apiJobTypeToUi = (value?: BackendJob['jobType']): Job['jobType'] => {
  if (value === 'part_time') return 'part-time';
  if (value === 'contract') return 'contract';
  return 'full-time';
};

const uiJobTypeToApi = (value?: string) => {
  if (value === 'part-time') return 'part_time';
  if (value === 'contract') return 'contract';
  return 'full_time';
};

const apiAvailabilityToUi = (
  value?: BackendWorkerProfile['availability'],
): WorkerProfile['availability'] => {
  if (value === 'within_15_days') return '15-days';
  if (value === 'within_30_days') return '30-days';
  return 'immediate';
};

const uiAvailabilityToApi = (value?: string) => {
  if (value === '15-days') return 'within_15_days';
  if (value === '30-days') return 'within_30_days';
  return 'immediate';
};

const apiRoleToUi = (role: BackendRole): User['role'] =>
  role === 'super_admin' ? 'admin' : role;

const statusToUi = (status: BackendJobStatus): Job['status'] =>
  status === 'active' ? 'published' : status;

const statusToApi = (status: Job['status']): BackendJobStatus =>
  status === 'published' ? 'active' : status;

const localPart = (email: string) =>
  email
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export function formatLocationString(...parts: (string | null | undefined)[]): string {
  const seen = new Set<string>();
  const uniqueTokens: string[] = [];

  for (const part of parts) {
    if (!part) continue;
    const tokens = part.split(',').map((t) => t.trim()).filter(Boolean);
    for (const token of tokens) {
      const lower = token.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        uniqueTokens.push(token);
      }
    }
  }

  return uniqueTokens.join(', ');
}


export function toUser(user: BackendUser | any, rootData?: any): User {
  if (!user && rootData?.user) {
    user = rootData.user;
  }
  const rootName = rootData?.name || rootData?.data?.name;
  const recruiterName = user?.recruiter?.name || user?.poster?.recruiter?.name || rootData?.recruiter?.name || rootData?.poster?.recruiter?.name;
  const workerName = user?.workerProfile?.name || user?.worker?.name || rootData?.workerProfile?.name;
  
  let explicitName = rootName || workerName || recruiterName;
  if (!explicitName && user?.name && user.name.toLowerCase() !== localPart(user?.email || '').toLowerCase()) {
    explicitName = user.name;
  }

  const nameToUse = explicitName || localPart(user?.email || 'User');

  return {
    id: user?.id || rootData?.id || '',
    name: nameToUse,
    email: user?.email || rootData?.email || '',
    phone: user?.phone || user?.workerProfile?.phone || rootData?.phone || undefined,
    role: apiRoleToUi(user?.role || rootData?.role || 'worker'),
    avatarUrl: user?.workerProfile?.profilePhotoUrl || rootData?.profilePhotoUrl || undefined,
    company: recruiterName || user?.company,
    designation: user?.role === 'super_admin' ? 'Administrator' : undefined,
  };
}

export function toJob(job: BackendJob): JobWithMeta {
  const recruiter = job.poster?.recruiter;
  const companyName = recruiter?.name || 'SCN Jobs';
  const skills = (job.skills || [])
    .map((entry) => entry.skill?.name)
    .filter((name): name is string => Boolean(name));
  const qualifications = (job.qualifications || [])
    .map((entry: any) => {
      const q = entry.qualification || entry;
      const name = q?.name;
      const level = q?.level;
      if (!name) return null;
      if (level) {
        const cleanLevel = level.replace(/_/g, ' ').toLowerCase();
        const formattedLevel = cleanLevel.charAt(0).toUpperCase() + cleanLevel.slice(1);
        return `${name} (${formattedLevel})`;
      }
      return name;
    })
    .filter((q): q is string => Boolean(q));
  const experienceMin = Math.floor((job.minExperienceMonths || 0) / 12);
  const locationName = formatLocationString(job.location?.locality, job.location?.city, job.location?.state) || 'Location not specified';
  const title = job.title || job.jobRole?.name || (job as any).jobRoleName || 'Job Listing';

  // Handle new 3 independent range pairs (daily, monthly, yearly)
  const monthlyRange = (job as any).monthly || (job as any).monthlyWage;
  const dailyRange = (job as any).daily || (job as any).dailyWage;
  const yearlyRange = (job as any).yearly || (job as any).annualWage || (job as any).annual;

  let salaryMin = job.wageMin || (job as any).salaryMin || (job as any).monthlyWageMin || (job as any).dailyWageMin || (job as any).yearlyWageMin || 0;
  let salaryMax = job.wageMax || (job as any).salaryMax || (job as any).monthlyWageMax || (job as any).dailyWageMax || (job as any).yearlyWageMax || salaryMin;
  let wagePeriod: 'daily' | 'monthly' | 'annual' = (job.wageType as any) || 'monthly';

  const raw = job as any;
  if (raw.monthlyWageMin !== undefined && raw.monthlyWageMin !== null) {
    salaryMin = raw.monthlyWageMin;
    salaryMax = raw.monthlyWageMax || salaryMin;
    wagePeriod = 'monthly';
  } else if (raw.dailyWageMin !== undefined && raw.dailyWageMin !== null) {
    salaryMin = raw.dailyWageMin;
    salaryMax = raw.dailyWageMax || salaryMin;
    wagePeriod = 'daily';
  } else if (raw.yearlyWageMin !== undefined && raw.yearlyWageMin !== null) {
    salaryMin = raw.yearlyWageMin;
    salaryMax = raw.yearlyWageMax || salaryMin;
    wagePeriod = 'annual';
  } else if (monthlyRange && (monthlyRange.min || monthlyRange.max)) {
    salaryMin = monthlyRange.min || 0;
    salaryMax = monthlyRange.max || salaryMin;
    wagePeriod = 'monthly';
  } else if (dailyRange && (dailyRange.min || dailyRange.max)) {
    salaryMin = dailyRange.min || 0;
    salaryMax = dailyRange.max || salaryMin;
    wagePeriod = 'daily';
  } else if (yearlyRange && (yearlyRange.min || yearlyRange.max)) {
    salaryMin = yearlyRange.min || 0;
    salaryMax = yearlyRange.max || salaryMin;
    wagePeriod = 'annual';
  }

  // Handle join-wrapped benefits and assets
  const benefitNames = (job.benefitNames || (job as any).benefits || [])
    .map((b: any) => (typeof b === 'string' ? b : b?.benefit?.name || b?.name))
    .filter((b: any): b is string => Boolean(b));

  const assetNames = (job.assetNames || (job as any).assets || [])
    .map((a: any) => (typeof a === 'string' ? a : a?.asset?.name || a?.name))
    .filter((a: any): a is string => Boolean(a));

  const languagesList = ((job as any).languages || (job as any).languageNames || [])
    .map((l: any) => (typeof l === 'string' ? l : l?.language?.name || l?.name))
    .filter((l: any): l is string => Boolean(l));

  const highlightsList = ((job as any).highlights || [])
    .map((h: any) => (typeof h === 'string' ? h : String(h)))
    .filter((h: any): h is string => Boolean(h));

  return {
    id: job.id,
    title,
    companyId: recruiter?.id || job.postedBy,
    companyName,
    companyLogo: '',
    industry: job.industry?.name || 'General',
    department: (job as any).function?.name || (job as any).functionName || (job as any).departmentName || (job as any).department || 'General',
    departmentName: (job as any).function?.name || (job as any).functionName || (job as any).departmentName || (job as any).department || 'General',
    location: locationName,
    locality: job.location?.locality,
    workType: 'onsite',
    jobType: apiJobTypeToUi(job.jobType),
    shift: job.shiftType || 'day',
    salaryMin,
    salaryMax,
    wagePeriod,
    experienceMin,
    experienceMax: job.maxExperienceMonths !== undefined && job.maxExperienceMonths !== null ? Math.floor(job.maxExperienceMonths / 12) : Math.max(experienceMin, experienceMin + 3),
    workingDays: job.workingDays || undefined,
    freshersOnly: job.freshersOnly || undefined,
    genderPreference: job.gender || undefined,
    gender: job.gender || undefined,
    workingStatus: (job as any).workingStatus || undefined,
    benefitNames,
    assetNames,
    openings: job.headcountRequired,
    skills,
    qualifications,
    languages: languagesList,
    highlights: highlightsList,
    description: job.description || 'No description provided.',
    responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities : [],
    requirements: Array.isArray(job.requirements) ? job.requirements : [],
    benefits: benefitNames,
    postedAt: job.createdAt,
    recruiterId: job.postedBy,
    recruiterName: recruiter?.name || job.poster?.email || 'SCN Recruiter',
    status: statusToUi(job.status),
    isFresherFriendly: (job.minExperienceMonths || 0) === 0 || Boolean(job.freshersOnly),
    backendStatus: job.status,
    applicationsCount: job._count?.applications || 0,
    industryId: job.industryId,
    locationId: job.locationId,
    jobRoleId: job.jobRoleId || undefined,
    functionId: job.functionId || undefined,
  };
}

function profileCompletion(profile: BackendWorkerProfile) {
  const checks = [
    profile.name,
    profile.phone,
    profile.headline,
    profile.summary,
    profile.resumeUrl,
    profile.skills?.length,
    profile.experience?.length,
    profile.education?.length,
    profile.preferredLocations?.length,
    profile.preferredIndustries?.length,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function toWorkerProfile(profile: BackendWorkerProfile): WorkerWithMeta {
  const email = profile.user?.email || '';
  const preferredLocationDetails = (profile.preferredLocations || [])
    .map((entry) => {
      if (!entry.location) return null;
      const { id, locality, city, state } = entry.location;
      const label = formatLocationString(locality, city, state);
      return {
        id,
        label,
      };
    })
    .filter((entry): entry is { id: number; label: string } => Boolean(entry));

  const preferredLocations = preferredLocationDetails.map((d) => d.label);

  const languageEntries = profile.languages || [];
  const languageIds = languageEntries
    .map((entry: any) => entry.language?.id ?? entry.languageId ?? entry.id)
    .filter((id): id is number => typeof id === 'number');

  const languageDetails: WorkerLanguageDetail[] = languageEntries
    .map((entry: any): WorkerLanguageDetail | null => {
      const name = entry.language?.name ?? entry.name;
      if (!name) return null;
      return {
        id: entry.language?.id ?? entry.languageId,
        name,
        proficiency: entry.proficiency || undefined,
      };
    })
    .filter((item): item is WorkerLanguageDetail => item !== null);

  const languages = languageDetails.map((item) =>
    item.proficiency
      ? `${item.name} (${item.proficiency.charAt(0).toUpperCase() + item.proficiency.slice(1)})`
      : item.name,
  );

  const fullWorkerLocationStr = formatLocationString(
    (profile as any).currentLocality || (profile as any).locality,
    profile.city,
    profile.state,
  ) || (preferredLocations[0] ? formatLocationString(preferredLocations[0]) : 'Location not specified');

  return {
    id: profile.id,
    userId: profile.userId,
    fullName: profile.name || localPart(email || 'Worker'),
    email,
    phone: profile.phone || profile.user?.phone || '',
    alternatePhone: profile.alternatePhone || undefined,
    department: profile.department?.name || undefined,
    departmentId: profile.departmentId || profile.department?.id || undefined,
    avatarUrl: profile.profilePhotoUrl || undefined,
    profilePhotoUrl: profile.profilePhotoUrl || undefined,
    resumeUrl: profile.resumeUrl || undefined,
    headline: profile.headline || 'Worker profile',
    bio: profile.summary || '',
    education: (profile.education || []).map((entry) => ({
      id: entry.id,
      degree: entry.qualification?.name || 'Qualification',
      institution: entry.institute || '',
      field: entry.qualification?.level || 'General',
      startYear: entry.passoutYear || new Date().getFullYear(),
      endYear: entry.passoutYear || new Date().getFullYear(),
      qualificationId: entry.qualification?.id,
      level: entry.qualification?.level,
    })),
    experience: (profile.experience || []).map((entry) => ({
      id: entry.id,
      company: entry.companyName,
      designation: entry.jobTitle,
      startDate: entry.fromDate,
      endDate: entry.toDate || undefined,
      current: entry.isCurrent,
      description: entry.description || '',
      industry: entry.industry?.name || undefined,
      industryId: entry.industryId || entry.industry?.id || undefined,
      department: entry.department?.name || undefined,
      departmentId: entry.departmentId || entry.department?.id || undefined,
    })),
    skills: (profile.skills || [])
      .map((entry) => entry.skill?.name)
      .filter((name): name is string => Boolean(name)),
    languages,
    languageIds,
    languageDetails,
    preferredIndustries: (profile.preferredIndustries || [])
      .map((entry) => entry.industry?.name)
      .filter((name): name is string => Boolean(name)),
    preferredLocations,
    preferredLocationDetails,
    preferredIndustryIds: (profile.preferredIndustries || [])
      .map((entry) => entry.industry?.id)
      .filter((id): id is number => id !== undefined),
    preferredDepartmentIds: ((profile as any).preferredDepartments || [])
      .map((entry: any) => entry.department?.id || entry.departmentId || entry.id)
      .filter((id: any): id is number => typeof id === 'number'),
    preferredJobRoleIds: ((profile as any).preferredJobRoles || [])
      .map((entry: any) => entry.jobRole?.id || entry.jobRoleId || entry.id)
      .filter((id: any): id is number => typeof id === 'number'),
    preferredLocationIds: (profile.preferredLocations || [])
      .map((entry) => entry.location?.id)
      .filter((id): id is number => id !== undefined),
    availability: apiAvailabilityToUi(profile.availability),
    expectedSalaryMin: profile.expectedSalaryMin || 0,
    expectedSalaryMax: profile.expectedSalaryMax || 0,
    experienceYears: Math.floor((profile.totalExperienceMonths || 0) / 12),
    profileCompletion: profile.profileComplete ? 100 : profileCompletion(profile),
    status: profile.user?.isActive === false ? 'inactive' : 'active',
    joinedAt: profile.user?.createdAt || profile.createdAt || '',
    city: fullWorkerLocationStr,
    state: profile.state || '',
    locality: profile.currentLocality || '',
    // New personal fields
    dob: profile.dob || undefined,
    maritalStatus: profile.maritalStatus ? (profile.maritalStatus.toLowerCase() as any) : undefined,
    category: profile.category || undefined,
    jobPreference: profile.jobPreference || undefined,
    isFresher: profile.isFresher ?? false,
    workingStatus: profile.workingStatus || undefined,
    noticePeriodDays: profile.noticePeriodDays || undefined,
    gender: (profile as any).gender || undefined,
    preferredDepartments: ((profile as any).preferredDepartments || []).map((entry: any) => entry.department?.name || entry.name).filter((n: any): n is string => Boolean(n)),
    preferredJobRoles: ((profile as any).preferredJobRoles || []).map((entry: any) => entry.jobRole?.name || entry.name).filter((n: any): n is string => Boolean(n)),
    assets: ((profile as any).assets || []).map((entry: any) => entry.asset?.name || entry.name || (typeof entry === 'string' ? entry : '')).filter((n: any): n is string => Boolean(n)),
  };
}

export function toApplication(application: BackendApplication): Application {
  const workerProfile = application.worker?.workerProfile;
  const workerName =
    workerProfile?.name ||
    (application.worker?.email ? localPart(application.worker.email) : 'Worker');
  const job = application.job ? toJob(application.job) : emptyJob(application.jobId);
  const history = application.history?.length
    ? application.history
    : [
      {
        id: `${application.id}-created`,
        toStatus: application.status,
        changedAt: application.appliedAt,
        changedBy: { role: 'worker' as BackendRole },
      },
    ];

  const fullAppLocation = formatLocationString(
    (workerProfile as any)?.currentLocality || (workerProfile as any)?.locality,
    workerProfile?.city,
    workerProfile?.state,
    (workerProfile as any)?.preferredLocations?.[0]?.location?.locality,
    (workerProfile as any)?.preferredLocations?.[0]?.location?.city,
    (workerProfile as any)?.preferredLocations?.[0]?.location?.state,
  ) || 'Location not specified';

  return {
    id: application.id,
    jobId: application.jobId,
    job,
    workerId: application.workerId,
    workerName,
    workerAvatar: workerProfile?.profilePhotoUrl || undefined,
    status: application.status,
    appliedAt: application.appliedAt,
    resumeUrl: workerProfile?.resumeUrl || undefined,
    coverLetter: application.coverNote || undefined,
    timeline: history.map((event) => ({
      id: event.id,
      status: event.toStatus,
      label: event.toStatus.replace('_', ' '),
      description: event.notes || undefined,
      timestamp: event.changedAt,
      actor: event.changedBy?.email || event.changedBy?.role || 'System',
    })),
    workerCity: fullAppLocation,
    workerExperienceYears: workerProfile?.totalExperienceMonths ? Math.floor(workerProfile.totalExperienceMonths / 12) : 0,
    workerHeadline: workerProfile?.headline || 'Worker Profile',
    workerProfile: workerProfile ? toWorkerProfile(workerProfile) : undefined,
  };
}

function emptyJob(id: string): JobWithMeta {
  return {
    id,
    title: 'Job',
    companyId: '',
    companyName: 'SCN Jobs',
    companyLogo: '',
    industry: 'General',
    location: '',
    workType: 'onsite',
    jobType: 'full-time',
    shift: 'day',
    salaryMin: 0,
    salaryMax: 0,
    experienceMin: 0,
    experienceMax: 0,
    openings: 0,
    skills: [],
    description: '',
    responsibilities: [],
    requirements: [],
    benefits: [],
    postedAt: new Date().toISOString(),
    recruiterId: '',
    recruiterName: '',
    status: 'published',
    isFresherFriendly: true,
    backendStatus: 'active',
    applicationsCount: 0,
    industryId: 0,
    locationId: 0,
  };
}

export function toRecruiter(recruiter: BackendRecruiter): RecruiterView {
  return {
    id: recruiter.id,
    userId: recruiter.userId || recruiter.user?.id || '',
    name: recruiter.name,
    email: recruiter.email || recruiter.user?.email || '',
    phone: recruiter.user?.phone || '',
    company: recruiter.name,
    designation: 'Recruiter',
    industries: (recruiter.categories || [])
      .map((entry) => entry.industry?.name)
      .filter((name): name is string => Boolean(name)),
    industryIds: (recruiter.categories || []).map((entry) => entry.industryId),
    status: recruiter.isActive === false ? 'inactive' : 'active',
    jobsPosted: recruiter.user?._count?.jobsPosted || 0,
    createdAt: recruiter.createdAt || recruiter.user?.createdAt || '',
  };
}

export function toMasterDataItem(resource: MasterResource, item: BackendLookup | BackendLocation): MasterDataItem {
  const name =
    resource === 'locations'
      ? `${(item as BackendLocation).city} - ${(item as BackendLocation).locality}`
      : (item as BackendLookup).level
        ? `${(item as BackendLookup).name} (${(item as BackendLookup).level})`
        : (item as BackendLookup).name;

  return {
    id: String(item.id),
    name,
    count: 0,
    createdAt: item.createdAt || '',
    status: item.isActive === false ? 'inactive' : 'active',
  };
}

export const authApi = {
  async login(email: string, password: string) {
    const result = await apiPost<{ token: string; user: BackendUser; name?: string }>('/auth/login', {
      email,
      password,
    });
    return { token: result.token, user: toUser(result.user, result) };
  },
  async me() {
    const res = await apiGet<any>('/auth/me');
    if (!res) return null;
    const userObj = res.user || res;
    return toUser(userObj, res);
  },
  logout() {
    return apiPost<{ success?: boolean }>('/auth/logout');
  },
  registerWorker(data: { name: string; email: string; phone: string; password: string }) {
    return apiPost<{ userId: string; devOtp?: string }>('/auth/worker/register', data);
  },
  async verifyWorkerOtp(phone: string, otp: string) {
    const result = await apiPost<{ token: string; user: BackendUser; name?: string }>('/auth/worker/verify-otp', {
      phone,
      otp,
    });
    return { token: result.token, user: toUser(result.user, result) };
  },
  resendWorkerOtp(phone: string) {
    return apiPost<{ devOtp?: string }>('/auth/worker/resend-otp', { phone });
  },
};

function formatJobPayload(data: any) {
  const roleName = data.jobRoleName || data.title || 'Job Role';

  let workingDaysEnum = 'FIVE_DAYS';
  if (typeof data.workingDays === 'string' && data.workingDays.toUpperCase().endsWith('_DAYS')) {
    workingDaysEnum = data.workingDays.toUpperCase();
  } else {
    const rawDaysStr = String(data.workingDays || '5').trim();
    if (rawDaysStr === '6' || rawDaysStr.toUpperCase().includes('SIX')) {
      workingDaysEnum = 'SIX_DAYS';
    } else if (rawDaysStr === '7' || rawDaysStr.toUpperCase().includes('SEVEN')) {
      workingDaysEnum = 'SEVEN_DAYS';
    } else if (rawDaysStr === '4' || rawDaysStr.toUpperCase().includes('FOUR')) {
      workingDaysEnum = 'FOUR_DAYS';
    }
  }

  const rawJobType = String(data.jobType || 'full_time').toLowerCase();
  const formattedJobType = rawJobType === 'full-time' || rawJobType === 'full_time' ? 'full_time' : rawJobType === 'part-time' || rawJobType === 'part_time' ? 'part_time' : rawJobType;

  // Format array fields
  const responsibilitiesArr = Array.isArray(data.responsibilities)
    ? data.responsibilities
    : typeof data.responsibilities === 'string'
      ? data.responsibilities.split('\n').map((s: string) => s.trim()).filter(Boolean)
      : undefined;

  const requirementsArr = Array.isArray(data.requirements)
    ? data.requirements
    : typeof data.requirements === 'string'
      ? data.requirements.split('\n').map((s: string) => s.trim()).filter(Boolean)
      : undefined;

  const highlightsArr = Array.isArray(data.highlights)
    ? data.highlights
    : typeof data.highlights === 'string'
      ? data.highlights.split('\n').map((s: string) => s.trim()).filter(Boolean)
      : data.benefitNames && data.benefitNames.length > 0
        ? data.benefitNames
        : undefined;

  let languagesArr: string[] | undefined = undefined;
  if (Array.isArray(data.languages)) {
    languagesArr = data.languages;
  } else if (Array.isArray(data.languageNames)) {
    languagesArr = data.languageNames;
  }

  const payload: any = {
    jobRoleName: roleName,
    industryId: data.industryId ? Number(data.industryId) : undefined,
    industryName: data.industryName || undefined,
    functionId: data.functionId ? Number(data.functionId) : undefined,
    functionName: data.functionName || undefined,
    locationId: Number(data.locationId),
    jobRoleId: data.jobRoleId ? Number(data.jobRoleId) : undefined,
    jobType: formattedJobType,
    shiftType: (data.shiftType || 'day').toLowerCase(),
    gender: (data.gender || 'ANY').toUpperCase(),
    headcountRequired: Number(data.headcountRequired || 1),
    minExperienceMonths: data.freshersOnly ? undefined : (data.minExperienceMonths !== undefined ? Number(data.minExperienceMonths) : undefined),
    maxExperienceMonths: data.freshersOnly ? undefined : (data.maxExperienceMonths !== undefined ? Number(data.maxExperienceMonths) : undefined),
    freshersOnly: Boolean(data.freshersOnly),
    workingDays: workingDaysEnum,
    workingStatus: data.workingStatus || undefined,
    description: data.description,
    responsibilities: responsibilitiesArr,
    requirements: requirementsArr,
    highlights: highlightsArr,
    languages: languagesArr,
    languageIds: data.languageIds
      ? (Array.isArray(data.languageIds) ? data.languageIds : [data.languageIds])
          .map((id: any) => Number(id))
          .filter((id: number) => !isNaN(id) && id > 0)
      : undefined,
    skillIds: data.skillIds
      ? (Array.isArray(data.skillIds) ? data.skillIds : [data.skillIds])
          .map((id: any) => Number(id))
          .filter((id: number) => !isNaN(id) && id > 0)
      : undefined,
    qualificationIds: data.qualificationIds
      ? (Array.isArray(data.qualificationIds) ? data.qualificationIds : [data.qualificationIds])
          .map((id: any) => Number(id))
          .filter((id: number) => !isNaN(id) && id > 0)
      : undefined,
    benefitNames: data.benefitNames,
    assetNames: data.assetNames,
    status: data.status ? statusToApi(data.status) : undefined,
  };

  if (data.monthlyWageMin !== undefined || data.monthlyWageMax !== undefined) {
    payload.monthlyWageMin = Number(data.monthlyWageMin || 0);
    payload.monthlyWageMax = Number(data.monthlyWageMax || data.monthlyWageMin || 0);
  } else if (data.dailyWageMin !== undefined || data.dailyWageMax !== undefined) {
    payload.dailyWageMin = Number(data.dailyWageMin || 0);
    payload.dailyWageMax = Number(data.dailyWageMax || data.dailyWageMin || 0);
  } else if (data.yearlyWageMin !== undefined || data.yearlyWageMax !== undefined) {
    payload.yearlyWageMin = Number(data.yearlyWageMin || 0);
    payload.yearlyWageMax = Number(data.yearlyWageMax || data.yearlyWageMin || 0);
  } else {
    const wageMinVal = Number(data.wageMin || 0);
    const wageMaxVal = Number(data.wageMax || data.wageMin || 0);
    const rawWageType = (data.wageType || 'monthly').toLowerCase();
    if (rawWageType === 'daily') {
      payload.dailyWageMin = wageMinVal;
      payload.dailyWageMax = wageMaxVal;
    } else if (rawWageType === 'annual' || rawWageType === 'yearly') {
      payload.yearlyWageMin = wageMinVal;
      payload.yearlyWageMax = wageMaxVal;
    } else {
      payload.monthlyWageMin = wageMinVal;
      payload.monthlyWageMax = wageMaxVal;
    }
  }

  return payload;
}

export const jobsApi = {
  async list() {
    const jobs = await apiGet<BackendJob[]>('/jobs');
    return jobs.map(toJob);
  },
  async get(id: string) {
    return toJob(await apiGet<BackendJob>(`/jobs/${id}`));
  },
  async create(data: any) {
    const payload = formatJobPayload(data);
    const job = await apiPost<BackendJob>('/jobs', payload);
    return toJob(job);
  },
  async update(id: string, data: any) {
    const payload = formatJobPayload(data);
    const job = await apiPatch<BackendJob>(`/jobs/${id}`, payload);
    return toJob(job);
  },
  async updateStatus(id: string, status: Job['status']) {
    return toJob(await apiPatch<BackendJob>(`/jobs/${id}/status`, { status: statusToApi(status) }));
  },
  remove(id: string) {
    return apiDelete<{ deleted: boolean }>(`/jobs/${id}`);
  },
};

export const applicationsApi = {
  async apply(jobId: string, coverNote?: string) {
    return toApplication(await apiPost<BackendApplication>('/applications', { jobId, coverNote }));
  },
  async workerList() {
    return (await apiGet<BackendApplication[]>('/applications/my')).map(toApplication);
  },
  async recruiterList() {
    return (await apiGet<BackendApplication[]>('/applications/recruiter')).map(toApplication);
  },
  async adminList() {
    return (await apiGet<BackendApplication[]>('/applications')).map(toApplication);
  },
  async updateStatus(id: string, status: ApplicationStatus, notes?: string) {
    return toApplication(await apiPatch<BackendApplication>(`/applications/${id}/status`, { status, notes }));
  },
  withdraw(id: string) {
    return apiDelete<{ withdrawn: boolean }>(`/applications/${id}`);
  },
  async search(params?: ApplicationSearchParams) {
    const formattedParams = formatSearchParams(params);
    const rawApps = await apiGet<BackendApplication[]>('/applications/search', { params: formattedParams });
    return (Array.isArray(rawApps) ? rawApps : []).map(toApplication);
  },
};

export const workerApi = {
  async profile() {
    return toWorkerProfile(await apiGet<BackendWorkerProfile>('/worker/profile'));
  },
  async createProfile(data?: any) {
    return toWorkerProfile(await apiPost<BackendWorkerProfile>('/worker/profile', data || {}));
  },
  async updateProfile(data: {
    state?: string;
    city?: string;
    locality?: string;
    currentLocality?: string;
    name?: string;
    phone?: string;
    alternatePhone?: string;
    departmentName?: string;
    departmentId?: number;
    headline?: string;
    summary?: string;
    totalExperienceMonths?: number;
    expectedSalaryMin?: number;
    expectedSalaryMax?: number;
    availability?: string;
    resumeUrl?: string | null;
    profilePhotoUrl?: string | null;
    skillIds?: number[];
    preferredLocationIds?: number[];
    preferredIndustryIds?: number[];
    industryIds?: number[];
    industryNames?: string[];
    preferredIndustries?: string[];
    departmentIds?: number[];
    departmentNames?: string[];
    preferredDepartmentIds?: number[];
    preferredDepartments?: string[];
    preferredJobRoleIds?: number[];
    jobRoleIds?: number[];
    jobRoleNames?: string[];
    preferredJobRoles?: string[];
    languageIds?: number[];
    languages?: { languageId: number; proficiency?: string }[];
    // Spec fields
    dob?: string;
    gender?: string;
    maritalStatus?: string;
    category?: string;
    jobPreference?: string;
    jobType?: string;
    isFresher?: boolean;
    workingStatus?: string;
    noticePeriodDays?: number;
    assets?: string[];
  }) {
    const localityVal = (data.locality || data.currentLocality || '').trim();
    const stateVal = (data.state || '').trim();
    const cityVal = (data.city || '').trim();

    const locationPayload: Record<string, string> = {};
    if (stateVal) locationPayload.state = stateVal;
    if (cityVal) locationPayload.city = cityVal;
    if (localityVal) {
      locationPayload.locality = localityVal;
      locationPayload.currentLocality = localityVal;
    }

    let formattedLanguages = data.languages;
    if (!formattedLanguages && data.languageIds) {
      formattedLanguages = data.languageIds.map((id) => ({ languageId: id, proficiency: 'fluent' }));
    }

    return toWorkerProfile(
      await apiPatch<BackendWorkerProfile>('/worker/profile', {
        ...data,
        ...locationPayload,
        languages: formattedLanguages,
        maritalStatus: data.maritalStatus ? data.maritalStatus.toUpperCase() : undefined,
        availability: data.availability ? uiAvailabilityToApi(data.availability) : undefined,
      }),
    );
  },
  async addExperience(data: {
    companyName: string;
    jobTitle: string;
    fromDate: string;
    toDate?: string;
    isCurrent?: boolean;
    description?: string;
    industryName?: string;
    departmentName?: string;
    industryId?: number;
    departmentId?: number;
  }) {
    return await apiPost<any>('/worker/experience', data);
  },
  async deleteExperience(id: string) {
    return await apiDelete<any>(`/worker/experience/${id}`);
  },
  async addEducation(data: {
    qualificationId?: number;
    qualificationName?: string;
    level?: string;
    institute?: string;
    passoutYear?: number;
  }) {
    const payload: any = {
      institute: data.institute,
      passoutYear: data.passoutYear ? Number(data.passoutYear) : undefined,
    };
    if (data.qualificationId) {
      payload.qualificationId = Number(data.qualificationId);
    }
    if (data.level === 'ANY' || !data.qualificationId) {
      if (data.qualificationName) payload.qualificationName = data.qualificationName;
    }
    if (data.level) {
      payload.level = data.level;
    }
    return await apiPost<any>('/worker/education', payload);
  },
  async editEducation(id: string, data: {
    qualificationId?: number;
    qualificationName?: string;
    level?: string;
    institute?: string;
    passoutYear?: number;
  }) {
    const payload: any = {
      institute: data.institute,
      passoutYear: data.passoutYear ? Number(data.passoutYear) : undefined,
    };
    if (data.qualificationId) {
      payload.qualificationId = Number(data.qualificationId);
    }
    if (data.level === 'ANY' || !data.qualificationId) {
      if (data.qualificationName) payload.qualificationName = data.qualificationName;
    }
    if (data.level) {
      payload.level = data.level;
    }
    return await apiPatch<any>(`/worker/education/${id}`, payload);
  },
  async deleteEducation(id: string) {
    return await apiDelete<any>(`/worker/education/${id}`);
  },
  async getQualificationsGrouped(): Promise<Record<string, BackendLookup[]>> {
    const raw = await apiGet<Record<string, BackendLookup[]>>('/master/qualifications');
    return raw;
  },
  async search(params?: WorkerSearchParams) {
    const formattedParams = formatSearchParams(params);
    const workers = await apiGet<BackendWorkerProfile[]>('/worker/search', { params: formattedParams });
    return (Array.isArray(workers) ? workers : []).map(toWorkerProfile);
  },
};

export const adminApi = {
  async stats(): Promise<AdminStats & DashboardStats> {
    const stats = await apiGet<{
      totalRecruiters: number;
      activeRecruiters: number;
      inactiveRecruiters: number;
      totalWorkers: number;
      totalJobs: number;
      activeJobs: number;
      draftJobs: number;
      closedJobs: number;
      totalApplications: number;
      applicationsByStatus: Record<string, number>;
      masterData: {
        industries: number;
        locations: number;
        skills: number;
        jobRoles: number;
        languages: number;
        qualifications: number;
      };
    }>('/admin/stats');

    return {
      totalRecruiters: stats.totalRecruiters,
      totalWorkers: stats.totalWorkers,
      totalJobs: stats.totalJobs,
      totalApplications: stats.totalApplications,
      activeRecruiters: stats.activeRecruiters,
      inactiveRecruiters: stats.inactiveRecruiters,
      industries: stats.masterData.industries,
      locations: stats.masterData.locations,
      skills: stats.masterData.skills,
      jobRoles: stats.masterData.jobRoles,
      languages: stats.masterData.languages,
      qualifications: stats.masterData.qualifications,
      activeJobs: stats.activeJobs,
      draftJobs: stats.draftJobs,
      closedJobs: stats.closedJobs,
      applicationsByStatus: stats.applicationsByStatus,
    };
  },
  async recruiters() {
    return (await apiGet<BackendRecruiter[]>('/admin/recruiters')).map(toRecruiter);
  },
  async createRecruiter(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    industryIds?: number[];
  }) {
    return toRecruiter(await apiPost<BackendRecruiter>('/admin/recruiters', data));
  },
  async updateRecruiter(id: string, data: {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    industryIds?: number[];
  }) {
    return toRecruiter(await apiPatch<BackendRecruiter>(`/admin/recruiters/${id}`, data));
  },
  async deleteRecruiter(id: string) {
    return await apiDelete<{ deleted: boolean }>(`/admin/recruiters/${id}`);
  },
  async setRecruiterStatus(id: string, active: boolean) {
    const endpoint = active ? 'reactivate' : 'deactivate';
    return toRecruiter(await apiPatch<BackendRecruiter>(`/admin/recruiters/${id}/${endpoint}`));
  },
  async resetRecruiterPassword(id: string, newPassword: string) {
    return await apiPatch<{ message?: string; recruiter?: BackendRecruiter }>(`/admin/recruiters/${id}/password`, { newPassword });
  },
  async getRecruiterFull(id: string) {
    return await apiGet<{ recruiter: BackendRecruiter; jobs: BackendJob[]; stats: any }>(`/admin/recruiters/${id}/full`);
  },
  async getWorkerFull(id: string) {
    const res = await apiGet<BackendWorkerProfile>(`/admin/workers/${id}/full`);
    return toWorkerProfile(res);
  },
  async getAdminJobs() {
    const jobs = await apiGet<BackendJob[]>('/admin/jobs');
    return jobs.map(toJob);
  },
  async getJobStats(id: string) {
    return await apiGet<{ job: BackendJob; applicationsCount: number; applicationsByStatus: Record<string, number>; applicants: any[] }>(`/admin/jobs/${id}/stats`);
  },
  async bulkCreateLocations(items: { state: string; city: string; locality: string }[]) {
    const results = await Promise.allSettled(
      items.map((item) => masterDataApi.create('locations', item))
    );
    return results;
  },
  async bulkCreateCandidates(candidates: { name: string; email: string; phone: string; experienceYears?: number; city?: string; state?: string; skills?: string[]; resumeUrl?: string }[]) {
    const results = await Promise.allSettled(
      candidates.map(async (c) => {
        try {
          const res = await authApi.registerWorker({
            name: c.name,
            email: c.email,
            phone: c.phone || '9999999999',
            password: 'Candidate@1234',
          });
          return res;
        } catch (e) {
          throw e;
        }
      })
    );
    return results;
  },
};

let cachedAllLocations: Promise<BackendLocation[]> | null = null;
function getAllLocationsCached(): Promise<BackendLocation[]> {
  if (!cachedAllLocations) {
    cachedAllLocations = apiGet<BackendLocation[]>('/master/locations').catch((err) => {
      cachedAllLocations = null;
      throw err;
    });
  }
  return cachedAllLocations;
}

export const masterDataApi = {
  async getStates(): Promise<string[]> {
    try {
      return await apiGet<string[]>('/master/locations/states');
    } catch (e) {
      console.warn('States API failed, falling back to local filtering.', e);
      const allLocs = await getAllLocationsCached();
      const statesSet = new Set(allLocs.map((l) => l.state).filter(Boolean));
      return Array.from(statesSet).sort();
    }
  },
  async getCities(state: string): Promise<string[]> {
    try {
      return await apiGet<string[]>(`/master/locations/states/${encodeURIComponent(state)}/cities`);
    } catch (e) {
      console.warn('Cities API failed, falling back to local filtering.', e);
      const allLocs = await getAllLocationsCached();
      const citiesSet = new Set(
        allLocs
          .filter((l) => l.state?.toLowerCase() === state.toLowerCase())
          .map((l) => l.city)
          .filter(Boolean),
      );
      return Array.from(citiesSet).sort();
    }
  },
  async getLocalities(city: string, state?: string): Promise<BackendLocation[]> {
    try {
      const params = state ? { state } : undefined;
      return await apiGet<BackendLocation[]>(`/master/locations/${encodeURIComponent(city)}/localities`, { params });
    } catch (e) {
      console.warn('Localities API failed, falling back to local filtering.', e);
      const allLocs = await getAllLocationsCached();
      return allLocs.filter(
        (l) =>
          l.city?.toLowerCase() === city.toLowerCase() &&
          (!state || l.state?.toLowerCase() === state.toLowerCase()),
      );
    }
  },
  async list(resource: MasterResource) {
    const res = await apiGet<any>(`/master/${resource}`);
    if (res && !Array.isArray(res) && typeof res === 'object') {
      // Grouped object response (e.g. GET /api/master/qualifications)
      const items: any[] = [];
      Object.entries(res).forEach(([groupKey, groupList]) => {
        if (Array.isArray(groupList)) {
          groupList.forEach((item: any) => {
            items.push({ ...item, level: item.level || groupKey });
          });
        }
      });
      return items.map((item) => toMasterDataItem(resource, item));
    }
    const items = Array.isArray(res) ? res : [];
    return items.map((item) => toMasterDataItem(resource, item));
  },
  raw(resource: MasterResource) {
    return apiGet<any>(`/master/${resource}`);
  },
  async getBenefits() {
    return this.list('benefits');
  },
  async getAssets() {
    return this.list('assets');
  },
  async getGroupedQualifications() {
    return this.raw('qualifications');
  },
  async all() {
    const [industries, locations, skills, jobRoles, languages, qualifications, benefits, assets] = await Promise.all([
      this.list('industries'),
      this.list('locations'),
      this.list('skills'),
      this.list('job-roles'),
      this.list('languages'),
      this.list('qualifications'),
      this.list('benefits').catch(() => []),
      this.list('assets').catch(() => []),
    ]);

    return {
      industries,
      locations,
      skills,
      'job-roles': jobRoles,
      languages,
      qualifications,
      benefits,
      assets,
    };
  },
  create(resource: MasterResource, data: { name?: string; level?: string; state?: string; city?: string; locality?: string }) {
    return apiPost<BackendLookup | BackendLocation>(`/master/${resource}`, data).then((item) =>
      toMasterDataItem(resource, item),
    );
  },
  update(resource: MasterResource, id: string, data: { name?: string; level?: string; state?: string; city?: string; locality?: string }) {
    return apiPatch<BackendLookup | BackendLocation>(`/master/${resource}/${id}`, data).then((item) =>
      toMasterDataItem(resource, item),
    );
  },
  remove(resource: MasterResource, id: string) {
    return apiDelete<BackendLookup | BackendLocation>(`/master/${resource}/${id}`).then((item) =>
      toMasterDataItem(resource, item),
    );
  },
};

export const contactApi = {
  submit(data: { name: string; phone: string; email?: string; subject?: string; message: string }) {
    return apiPost<{ success: boolean; data?: any; message?: string }>('/contact', data);
  },
};
