'use client';

import { useParams } from 'next/navigation';
import { JobDetailsView } from '@/components/job-details-view';

export default function RecruiterJobDetailsPage() {
  const params = useParams();
  const id = String(params.id);

  return (
    <div className="py-2">
      <JobDetailsView jobId={id} backUrl="/recruiter/jobs" hrefPrefix="/recruiter/jobs" />
    </div>
  );
}
