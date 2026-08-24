'use client';

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Globe, 
  User, 
  Calendar, 
  Heart, 
  ShieldAlert, 
  Clock, 
  IndianRupee,
  Building2,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { getInitials, formatExpectedSalary, formatDate } from '@/lib/format';
import { WorkerWithMeta } from '@/lib/scn-api';

interface CandidateProfileDrawerProps {
  worker: WorkerWithMeta | any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CandidateProfileDrawer({ worker, open, onOpenChange }: CandidateProfileDrawerProps) {
  if (!worker) return null;

  const fullName = worker.fullName || worker.name || 'Candidate Profile';
  const email = worker.email || worker.user?.email || '';
  const phone = worker.phone || worker.user?.phone || '';
  const alternatePhone = worker.alternatePhone || '';
  const avatarUrl = worker.avatarUrl || worker.profilePhotoUrl;
  const resumeUrl = worker.resumeUrl;

  const preferredIndustries: string[] = worker.preferredIndustries || [];
  const preferredDepartments: string[] = worker.preferredDepartments || [];
  const preferredJobRoles: string[] = worker.preferredJobRoles || [];
  const preferredLocations: string[] = worker.preferredLocations || [];
  const skills: string[] = worker.skills || [];
  const languages: string[] = worker.languages || [];
  const languageDetails = worker.languageDetails || [];
  const assets: string[] = worker.assets || [];

  const experienceList = worker.experience || [];
  const educationList = worker.education || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="h-full overflow-y-auto bg-white border-l border-slate-100 shadow-2xl p-6 sm:max-w-xl w-full md:w-[540px]">
        <SheetHeader className="text-left border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              <span>Candidate Profile Details</span>
            </SheetTitle>
            {worker.profileComplete && (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Profile Complete
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6 text-left">
          {/* Header Card */}
          <div className="flex items-start gap-4 p-4 bg-slate-50/80 border border-slate-100 rounded-2xl">
            <Avatar className="h-16 w-16 border-2 border-indigo-100 shadow-sm shrink-0">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
              <AvatarFallback className="text-lg font-bold bg-indigo-50 text-indigo-600">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-extrabold text-slate-900 leading-snug truncate">{fullName}</h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">{worker.headline || 'Candidate'}</p>
              
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-600 font-semibold">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {worker.city || worker.locality || 'Location not specified'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  {worker.isFresher ? 'Fresher' : `${worker.experienceYears || 0} Years Exp`}
                </span>
              </div>
            </div>

            {resumeUrl && (
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shrink-0 shadow-sm" asChild>
                <a href={resumeUrl} target="_blank" rel="noreferrer">
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Resume
                </a>
              </Button>
            )}
          </div>

          {/* Contact Details Card */}
          <div className="p-4 bg-indigo-50/40 border border-indigo-100/60 rounded-2xl space-y-2">
            <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block">CONTACT INFORMATION</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {phone && (
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                  <Phone className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{phone}</span>
                </div>
              )}
              {alternatePhone && (
                <div className="flex items-center gap-2 text-slate-600 font-semibold">
                  <Phone className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Alt: {alternatePhone}</span>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-2 text-slate-700 font-semibold sm:col-span-2 truncate">
                  <Mail className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">{email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Professional Summary / Bio */}
          {(worker.bio || worker.summary) && (
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">PROFESSIONAL SUMMARY</span>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                {worker.bio || worker.summary}
              </p>
            </div>
          )}

          {/* Key Personal Details Grid */}
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">PERSONAL & WORK SPECIFICATIONS</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Expected Salary</span>
                <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                  {formatExpectedSalary(worker.expectedSalaryMin, worker.expectedSalaryMax)}
                </p>
              </div>

              <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Experience Status</span>
                <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                  {worker.isFresher ? 'Fresher (0 Yrs)' : `${worker.experienceYears || 0} Years`}
                </p>
              </div>

              <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Working Status</span>
                <p className="text-xs font-extrabold text-slate-800 mt-0.5 capitalize">
                  {worker.workingStatus ? String(worker.workingStatus).toLowerCase().replace('_', ' ') : 'Not specified'}
                </p>
              </div>

              <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Notice Period</span>
                <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                  {worker.noticePeriodDays !== undefined && worker.noticePeriodDays !== null ? `${worker.noticePeriodDays} Days` : 'Immediate'}
                </p>
              </div>

              <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Availability</span>
                <p className="text-xs font-extrabold text-slate-800 mt-0.5 capitalize">
                  {worker.availability ? String(worker.availability).toLowerCase().replace('-', ' ') : 'Immediate'}
                </p>
              </div>

              <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Gender</span>
                <p className="text-xs font-extrabold text-slate-800 mt-0.5 capitalize">
                  {worker.gender ? String(worker.gender).toLowerCase() : 'Not specified'}
                </p>
              </div>

              <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Category</span>
                <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                  {worker.category || 'GEN'}
                </p>
              </div>

              <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Marital Status</span>
                <p className="text-xs font-extrabold text-slate-800 mt-0.5 capitalize">
                  {worker.maritalStatus ? String(worker.maritalStatus).toLowerCase() : 'Single'}
                </p>
              </div>

              {worker.dob && (
                <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Date of Birth</span>
                  <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                    {formatDate(worker.dob)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-slate-100" />

          {/* Preferences Section (Industries, Departments, Job Roles, Cities) */}
          <div className="space-y-4">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">JOB PREFERENCES</span>

            {/* Preferred Industries */}
            {preferredIndustries.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-600 block mb-1.5">Preferred Industries</span>
                <div className="flex flex-wrap gap-1.5">
                  {preferredIndustries.map((ind, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-indigo-50 text-indigo-700 border-none font-bold text-xs py-1 px-3 rounded-full">
                      {ind}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Preferred Departments */}
            {preferredDepartments.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-600 block mb-1.5">Preferred Departments</span>
                <div className="flex flex-wrap gap-1.5">
                  {preferredDepartments.map((dept, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-blue-50 text-blue-700 border-none font-bold text-xs py-1 px-3 rounded-full">
                      {dept}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Preferred Job Roles */}
            {preferredJobRoles.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-600 block mb-1.5">Preferred Job Roles</span>
                <div className="flex flex-wrap gap-1.5">
                  {preferredJobRoles.map((role, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-purple-50 text-purple-700 border-none font-bold text-xs py-1 px-3 rounded-full">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Preferred Cities */}
            {preferredLocations.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-600 block mb-1.5">Preferred Locations</span>
                <div className="flex flex-wrap gap-1.5">
                  {preferredLocations.map((loc, idx) => (
                    <Badge key={idx} variant="outline" className="border-slate-200 text-slate-600 font-semibold text-xs py-1 px-3 rounded-full">
                      <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                      {loc}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-slate-100" />

          {/* Skills, Languages & Assets */}
          <div className="space-y-4">
            {/* Technical Skills */}
            {skills.length > 0 && (
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">TECHNICAL SKILLS</span>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-indigo-50 text-indigo-700 border-none font-bold text-xs py-1 px-2.5 rounded-full">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Languages Known */}
            {(languages.length > 0 || languageDetails.length > 0) && (
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">LANGUAGES KNOWN</span>
                <div className="flex flex-wrap gap-1.5">
                  {languageDetails.length > 0 ? (
                    languageDetails.map((lang: any, idx: number) => (
                      <Badge key={idx} variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 font-semibold text-xs py-1 px-3 rounded-full flex items-center gap-1.5">
                        <Globe className="h-3 w-3 text-indigo-500" />
                        <span>{lang.name}</span>
                        {lang.proficiency && (
                          <span className="bg-indigo-100 text-indigo-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                            {lang.proficiency}
                          </span>
                        )}
                      </Badge>
                    ))
                  ) : (
                    languages.map((lang, idx) => (
                      <Badge key={idx} variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 font-semibold text-xs py-1 px-3 rounded-full flex items-center gap-1">
                        <Globe className="h-3 w-3 text-indigo-500" />
                        <span>{lang}</span>
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Assets */}
            {assets.length > 0 && (
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">ASSETS OWNED / AVAILABLE</span>
                <div className="flex flex-wrap gap-1.5">
                  {assets.map((asset, idx) => (
                    <Badge key={idx} variant="outline" className="border-amber-200 bg-amber-50/50 text-amber-800 font-semibold text-xs py-1 px-3 rounded-full">
                      {asset}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Work Experience Timeline */}
          {experienceList.length > 0 && (
            <>
              <Separator className="bg-slate-100" />
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-3">WORK EXPERIENCE</span>
                <div className="space-y-3">
                  {experienceList.map((exp: any, idx: number) => (
                    <div key={exp.id || idx} className="p-3.5 bg-slate-50/60 border border-slate-100 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-800 text-sm">{exp.designation || 'Position'}</span>
                        {exp.current && (
                          <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-[9px]">Present</Badge>
                        )}
                      </div>
                      <p className="font-bold text-indigo-600">{exp.company}</p>
                      <p className="text-slate-400 text-[11px] font-semibold">
                        {exp.startDate ? formatDate(exp.startDate) : ''} {exp.endDate ? `- ${formatDate(exp.endDate)}` : exp.current ? '- Present' : ''}
                      </p>
                      {exp.description && <p className="text-slate-600 pt-1 border-t border-slate-100 mt-1">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Education Details */}
          {educationList.length > 0 && (
            <>
              <Separator className="bg-slate-100" />
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-3">EDUCATION & QUALIFICATIONS</span>
                <div className="space-y-3">
                  {educationList.map((edu: any, idx: number) => (
                    <div key={edu.id || idx} className="p-3.5 bg-slate-50/60 border border-slate-100 rounded-xl space-y-1 text-xs">
                      <span className="font-extrabold text-slate-800 text-sm block">{edu.degree || 'Degree'}</span>
                      <p className="font-semibold text-slate-600">{edu.institution}</p>
                      <p className="text-slate-400 text-[11px] font-semibold">
                        Passed out: {edu.endYear || edu.startYear} {edu.level ? `(${edu.level})` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
