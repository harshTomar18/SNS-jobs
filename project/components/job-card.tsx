'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Briefcase,
  Clock,
  Users,
  Bookmark,
  Building2,
  IndianRupee,
} from 'lucide-react';
import { Job } from '@/lib/types';
import { formatSalary, timeAgo } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { AppLogo } from '@/components/app-logo';

interface JobCardProps {
  job: Job & { hasApplied?: boolean };
  variant?: 'default' | 'compact';
  className?: string;
  hrefPrefix?: string;
}

export function JobCard({ job, variant = 'default', className, hrefPrefix = '/jobs' }: JobCardProps) {
  const [saved, setSaved] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      className={cn(
        'group relative rounded-xl border border-border bg-card p-5 shadow-soft transition-all hover:border-primary/30 hover:shadow-card',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-xl border border-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700 p-1 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
            <AppLogo className="w-full h-full object-contain" />
          </div>
          <div>
            <Link href={`${hrefPrefix}/${job.id}`}>
              <h3 className="font-semibold leading-tight transition-colors group-hover:text-primary">
                {job.title}
              </h3>
            </Link>
            <p className="mt-0.5 text-sm text-muted-foreground">{job.companyName}</p>
          </div>
        </div>
        <button
          onClick={() => setSaved(!saved)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
          aria-label="Save job"
        >
          <Bookmark
            className={cn('h-4 w-4', saved && 'fill-primary text-primary')}
          />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {formatSalary(job.salaryMin, job.salaryMax, job.wagePeriod)}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {job.location}
        </span>
        <span className="flex items-center gap-1">
          <Briefcase className="h-3.5 w-3.5" />
          {job.experienceMin}-{job.experienceMax} yrs
        </span>
        {variant === 'default' && (
          <>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {job.openings} openings
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {timeAgo(job.postedAt)}
            </span>
          </>
        )}
      </div>

      {variant === 'default' && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="secondary" className="font-normal">
              {skill}
            </Badge>
          ))}
          {job.skills.length > 4 && (
            <Badge variant="outline" className="font-normal">
              +{job.skills.length - 4}
            </Badge>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/5 text-primary"
          >
            {job.workType}
          </Badge>
          {job.isFresherFriendly && (
            <Badge variant="outline" className="border-success/20 bg-success/5 text-success">
              Fresher Friendly
            </Badge>
          )}
        </div>
        {job.hasApplied ? (
          <Button size="sm" variant="secondary" disabled>Applied</Button>
        ) : (
          <Button size="sm" asChild>
            <Link href={`${hrefPrefix}/${job.id}`}>Apply Now</Link>
          </Button>
        )}
      </div>
    </motion.div>
  );
}
