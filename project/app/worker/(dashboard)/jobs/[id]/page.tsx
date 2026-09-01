'use client';

import { useParams } from 'next/navigation';
import { JobDetailsView } from '@/components/job-details-view';

export default function WorkerJobDetailsPage() {
  const params = useParams();
  const id = String(params.id);

  return (
    <div className="space-y-6 pb-10 bg-[#f0f8ff] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      <JobDetailsView jobId={id} backUrl="/worker/jobs" hrefPrefix="/worker/jobs" />
    </div>
  );
}
