import {
  AdminStats,
  Application,
  ApplicationStatus,
  Job,
  MasterDataItem,
  User,
  WorkerProfile,
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
  | 'qualifications';

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
  wageType?: 'daily' | 'monthly' | null;
  shiftType?: 'day' | 'night' | 'rotational' | null;
  jobType?: 'full_time' | 'part_time' | 'contract' | null;
  headcountRequired: number;
  headcountFilled?: number;
  minExperienceMonths?: number;
  status: BackendJobStatus;
  postedBy: string;
  poster?: {
    id: string;
    email: string;
    recruiter?: Pick<BackendRecruiter, 'id' | 'name' | 'email'> | null;
  };
  skills?: { skill?: BackendLookup }[];
  qualifications?: { qualification?: BackendLookup }[];
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
}

export interface DashboardStats {
  activeJobs: number;
  draftJobs: number;
  closedJobs: number;
  totalApplications: number;
  applicationsByStatus: Record<string, number>;
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

export function toUser(user: BackendUser): User {
  return {
    id: user.id,
    name: user.workerProfile?.name || user.recruiter?.name || localPart(user.email),
    email: user.email,
    phone: user.phone || user.workerProfile?.phone || undefined,
    role: apiRoleToUi(user.role),
    avatarUrl: user.workerProfile?.profilePhotoUrl || undefined,
    company: user.recruiter?.name,
    designation: user.role === 'super_admin' ? 'Administrator' : undefined,
  };
}

export function toJob(job: BackendJob): JobWithMeta {
  const recruiter = job.poster?.recruiter;
  const companyName = recruiter?.name || 'SCN Jobs';
  const skills = (job.skills || [])
    .map((entry) => entry.skill?.name)
    .filter((name): name is string => Boolean(name));
  const qualifications = (job.qualifications || [])
    .map((entry) => entry.qualification?.name)
    .filter((name): name is string => Boolean(name));
  const experienceMin = Math.floor((job.minExperienceMonths || 0) / 12);
  const locationName = job.location?.city || 'Location not specified';

  return {
    id: job.id,
    title: job.title,
    companyId: recruiter?.id || job.postedBy,
    companyName,
    companyLogo: '',
    industry: job.industry?.name || 'General',
    location: locationName,
    locality: job.location?.locality,
    workType: 'onsite',
    jobType: apiJobTypeToUi(job.jobType),
    shift: job.shiftType || 'day',
    salaryMin: job.wageMin || 0,
    salaryMax: job.wageMax || job.wageMin || 0,
    experienceMin,
    experienceMax: Math.max(experienceMin, experienceMin + 3),
    openings: job.headcountRequired,
    skills,
    description: job.description || 'No description provided.',
    responsibilities: job.responsibilities?.length
      ? job.responsibilities
      : job.description
      ? job.description.split('\n').filter(Boolean).slice(0, 4)
      : ['Review the job responsibilities with the recruiter.'],
    requirements: job.requirements?.length ? job.requirements : [
      ...qualifications.map((qualification) => `${qualification} preferred`),
      ...skills.slice(0, 4).map((skill) => `${skill} experience`),
    ].slice(0, 6),
    benefits: job.benefits || [],
    postedAt: job.createdAt,
    recruiterId: job.postedBy,
    recruiterName: recruiter?.name || job.poster?.email || 'SCN Recruiter',
    status: statusToUi(job.status),
    isFresherFriendly: (job.minExperienceMonths || 0) === 0,
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
      return {
        id,
        label: [locality, city, state].filter(Boolean).join(', '),
      };
    })
    .filter((entry): entry is { id: number; label: string } => Boolean(entry));

  const preferredLocations = preferredLocationDetails.map((d) => d.label);

  const languageIds = (profile.languages || [])
    .map((entry) => entry.language?.id)
    .filter((id): id is number => id !== undefined);

  return {
    id: profile.id,
    userId: profile.userId,
    fullName: profile.name || localPart(email || 'Worker'),
    email,
    phone: profile.phone || profile.user?.phone || '',
    avatarUrl: profile.profilePhotoUrl || undefined,
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
    })),
    skills: (profile.skills || [])
      .map((entry) => entry.skill?.name)
      .filter((name): name is string => Boolean(name)),
    languages: (profile.languages || [])
      .map((entry) => entry.language?.name)
      .filter((name): name is string => Boolean(name)),
    languageIds,
    preferredIndustries: (profile.preferredIndustries || [])
      .map((entry) => entry.industry?.name)
      .filter((name): name is string => Boolean(name)),
    preferredLocations,
    preferredLocationDetails,
    preferredIndustryIds: (profile.preferredIndustries || [])
      .map((entry) => entry.industry?.id)
      .filter((id): id is number => id !== undefined),
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
    city: profile.city || preferredLocations[0] || '',
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
    workerCity: workerProfile?.city || 'Location not specified',
    workerExperienceYears: workerProfile?.totalExperienceMonths ? Math.floor(workerProfile.totalExperienceMonths / 12) : 0,
    workerHeadline: workerProfile?.headline || 'Worker Profile',
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
    const result = await apiPost<{ token: string; user: BackendUser }>('/auth/login', {
      email,
      password,
    });
    return { token: result.token, user: toUser(result.user) };
  },
  async me() {
    const user = await apiGet<BackendUser | null>('/auth/me');
    return user ? toUser(user) : null;
  },
  logout() {
    return apiPost<{ success?: boolean }>('/auth/logout');
  },
  registerWorker(data: { name: string; email: string; phone: string; password: string }) {
    return apiPost<{ userId: string; devOtp?: string }>('/auth/worker/register', data);
  },
  async verifyWorkerOtp(phone: string, otp: string) {
    const result = await apiPost<{ token: string; user: BackendUser }>('/auth/worker/verify-otp', {
      phone,
      otp,
    });
    return { token: result.token, user: toUser(result.user) };
  },
  resendWorkerOtp(phone: string) {
    return apiPost<{ devOtp?: string }>('/auth/worker/resend-otp', { phone });
  },
};

export const jobsApi = {
  async list() {
    const jobs = await apiGet<BackendJob[]>('/jobs');
    return jobs.map(toJob);
  },
  async get(id: string) {
    return toJob(await apiGet<BackendJob>(`/jobs/${id}`));
  },
  async create(data: {
    title: string;
    description: string;
    industryId: number;
    locationId: number;
    jobRoleId?: number;
    functionId?: number;
    skillIds?: number[];
    qualificationIds?: number[];
    responsibilities?: string[];
    requirements?: string[];
    benefits?: string[];
    wageMin?: number;
    wageMax?: number;
    shiftType?: string;
    jobType?: string;
    headcountRequired: number;
    minExperienceMonths?: number;
    status?: Job['status'];
  }) {
    const job = await apiPost<BackendJob>('/jobs', {
      ...data,
      jobType: uiJobTypeToApi(data.jobType),
      status: data.status ? statusToApi(data.status) : undefined,
    });
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
};

export const workerApi = {
  async profile() {
    return toWorkerProfile(await apiGet<BackendWorkerProfile>('/worker/profile'));
  },
  async createProfile() {
    return toWorkerProfile(await apiPost<BackendWorkerProfile>('/worker/profile'));
  },
  async updateProfile(data: {
    state?: string;
    city?: string;
    locality?: string;
    currentLocality?: string;
    name?: string;
    phone?: string;
    headline?: string;
    summary?: string;
    totalExperienceMonths?: number;
    expectedSalaryMin?: number;
    expectedSalaryMax?: number;
    availability?: string;
    resumeUrl?: string;
    skillIds?: number[];
    preferredLocationIds?: number[];
    preferredIndustryIds?: number[];
    languageIds?: number[];
    // New API v2 fields
    dob?: string;
    maritalStatus?: string;
    category?: string;
    jobPreference?: string;
    isFresher?: boolean;
    workingStatus?: string;
    noticePeriodDays?: number;
  }) {
    return toWorkerProfile(
      await apiPatch<BackendWorkerProfile>('/worker/profile', {
        ...data,
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
    return await apiPost<any>('/worker/education', data);
  },
  async editEducation(id: string, data: {
    qualificationId?: number;
    qualificationName?: string;
    level?: string;
    institute?: string;
    passoutYear?: number;
  }) {
    return await apiPatch<any>(`/worker/education/${id}`, data);
  },
  async deleteEducation(id: string) {
    return await apiDelete<any>(`/worker/education/${id}`);
  },
  async getQualificationsGrouped(): Promise<Record<string, BackendLookup[]>> {
    const raw = await apiGet<Record<string, BackendLookup[]>>('/master/qualifications');
    return raw;
  },
  async search(params?: { q?: string; skillId?: number; city?: string; completeOnly?: boolean }) {
    const workers = await apiGet<BackendWorkerProfile[]>('/worker/search', { params });
    return workers.map(toWorkerProfile);
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
    industryIds: number[];
  }) {
    return toRecruiter(await apiPost<BackendRecruiter>('/admin/recruiters', data));
  },
  async updateRecruiter(id: string, data: {
    name?: string;
    email?: string;
    password?: string;
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
  list(resource: MasterResource) {
    return apiGet<(BackendLookup | BackendLocation)[]>(`/master/${resource}`).then((items) =>
      items.map((item) => toMasterDataItem(resource, item)),
    );
  },
  raw(resource: MasterResource) {
    return apiGet<(BackendLookup | BackendLocation)[]>(`/master/${resource}`);
  },
  async all() {
    const [industries, locations, skills, jobRoles, languages, qualifications] = await Promise.all([
      this.list('industries'),
      this.list('locations'),
      this.list('skills'),
      this.list('job-roles'),
      this.list('languages'),
      this.list('qualifications'),
    ]);

    return {
      industries,
      locations,
      skills,
      'job-roles': jobRoles,
      languages,
      qualifications,
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
