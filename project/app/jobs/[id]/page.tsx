'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { PublicNavbar } from '@/components/public-navbar';
import { PublicFooter } from '@/components/public-footer';
import { JobDetailsView } from '@/components/job-details-view';

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const id = String(params.id);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'worker') router.replace(`/worker/jobs/${id}`);
      if (user?.role === 'recruiter') router.replace(`/recruiter/jobs/${id}`);
      if (user?.role === 'admin') router.replace(`/admin/jobs/${id}`);
    }
  }, [isAuthenticated, user, router, id]);

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <JobDetailsView jobId={id} backUrl="/jobs" hrefPrefix="/jobs" />
      </main>

      <PublicFooter />
    </div>
  );
}
