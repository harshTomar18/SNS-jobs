export type UserRole = 'worker' | 'recruiter' | 'admin';

export type ApplicationStatus =
  | 'applied'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  company?: string;
  designation?: string;
  hasProfile?: boolean;
  firstName?: string;
  lastName?: string;
}

export interface Job {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  industry: string;
  location: string;
  locality?: string;
  workType: 'remote' | 'hybrid' | 'onsite';
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  shift: 'day' | 'night' | 'rotational';
  salaryMin: number;
  salaryMax: number;
  wagePeriod?: 'monthly' | 'annual' | 'daily';
  experienceMin: number;
  experienceMax: number;
  workingDays?: number;
  freshersOnly?: boolean;
  genderPreference?: 'MALE' | 'FEMALE' | 'ANY';
  benefitNames?: string[];
  assetNames?: string[];
  openings: number;
  skills: string[];
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  postedAt: string;
  recruiterId: string;
  recruiterName: string;
  status: 'draft' | 'published' | 'closed';
  isFresherFriendly: boolean;
}

export interface JobFilters {
  keyword?: string;
  location?: string;
  industry?: string;
  jobRole?: string;
  salaryMin?: number;
  salaryMax?: number;
  experienceMin?: number;
  experienceMax?: number;
  shift?: string;
  jobType?: string;
  workFromHome?: boolean;
  freshers?: boolean;
  sortBy?: 'relevance' | 'latest' | 'salary_high' | 'salary_low';
  page?: number;
  limit?: number;
}

export interface Application {
  id: string;
  jobId: string;
  job: Job;
  workerId: string;
  workerName: string;
  workerAvatar?: string;
  status: ApplicationStatus;
  appliedAt: string;
  resumeUrl?: string;
  coverLetter?: string;
  timeline: ApplicationTimelineEvent[];
  workerCity?: string;
  workerExperienceYears?: number;
  workerHeadline?: string;
}

export interface ApplicationTimelineEvent {
  id: string;
  status: ApplicationStatus;
  label: string;
  description?: string;
  timestamp: string;
  actor: string;
}

export interface WorkerProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  resumeUrl?: string;
  headline: string;
  bio: string;
  education: Education[];
  experience: WorkExperience[];
  skills: string[];
  languages: string[];
  languageIds: number[];
  preferredIndustries: string[];
  preferredLocations: string[];
  preferredLocationDetails?: { id: number; label: string }[];
  availability: 'immediate' | '15-days' | '30-days' | '60-days';
  expectedSalaryMin: number;
  expectedSalaryMax: number;
  experienceYears: number;
  profileCompletion: number;
  // New fields from API v2
  dob?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  category?: 'GEN' | 'OBC' | 'SC_ST';
  jobPreference?: string;
  isFresher?: boolean;
  workingStatus?: 'SERVING_NOTICE' | 'WORKING' | 'NOT_WORKING' | 'IMMEDIATE_JOINER';
  noticePeriodDays?: number;
  preferredIndustryIds?: number[];
  preferredLocationIds?: number[];
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  field: string;
  startYear: number;
  endYear: number;
  qualificationId?: number;
  level?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  designation: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
}

export interface RecruiterStats {
  jobsPosted: number;
  totalApplications: number;
  interviewsScheduled: number;
  hiredCount: number;
  hiringRate: number;
  activeJobs: number;
  draftJobs: number;
  closedJobs: number;
}

export interface AdminStats {
  totalRecruiters: number;
  totalWorkers: number;
  totalJobs: number;
  totalApplications: number;
  activeRecruiters: number;
  inactiveRecruiters: number;
  industries: number;
  locations: number;
  skills: number;
  jobRoles: number;
  languages: number;
  qualifications: number;
}

export interface MasterDataItem {
  id: string;
  name: string;
  count?: number;
  createdAt: string;
  status: 'active' | 'inactive';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
}
