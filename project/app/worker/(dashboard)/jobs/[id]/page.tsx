'use client';

import { useParams } from 'next/navigation';
import { JobDetailsView } from '@/components/job-details-view';

export default function WorkerJobDetailsPage() {
  const params = useParams();
  const id = String(params.id);

  return (
    <div className="py-2">
      <JobDetailsView jobId={id} backUrl="/worker/jobs" hrefPrefix="/worker/jobs" />
    </div>
  );
}
