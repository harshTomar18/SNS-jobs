'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { Briefcase, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  backLink?: string;
  backLabel?: string;
  sideImage?: string;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  backLink = '/',
  backLabel = 'Back to home',
  sideImage = '/auth-bg.png',
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 relative">
      {/* Full screen background image */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={sideImage} 
          alt="Background" 
          className="h-full w-full object-cover"
        />
        {/* Gradient overlay to ensure form readability and glass effect */}
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm" />
      </div>

      <header className="absolute left-0 right-0 top-0 z-50 flex h-20 items-center justify-between px-6 sm:px-10 lg:px-12">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png?v=3" alt="SCNJOBS" className="h-10 w-10 object-contain drop-shadow-sm" />
          <span className="text-xl font-extrabold tracking-tight">SCNJOBS</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center p-6 pt-24 sm:p-10">
        <div className="w-full max-w-lg rounded-[2rem] border border-border/50 bg-card/80 p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
          <Link
            href={backLink}
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">{subtitle}</p>
          <div className="mt-10">{children}</div>
        </div>
      </main>
    </div>
  );
}
