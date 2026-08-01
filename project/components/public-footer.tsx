'use client';

import Link from 'next/link';
import { Briefcase, Twitter, Linkedin, Github, Mail } from 'lucide-react';

const footerSections = [
  {
    title: 'For Workers',
    links: [
      { label: 'Browse Jobs', href: '/jobs' },
      { label: 'Create Profile', href: '/worker/register' },
      { label: 'Login', href: '/login' },
      { label: 'Career Resources', href: '/#how-it-works' },
    ],
  },
  {
    title: 'For Recruiters',
    links: [
      { label: 'Post a Job', href: '/login' },
      { label: 'Search Candidates', href: '/login' },
      { label: 'Recruiter Login', href: '/login' },
      { label: 'Pricing', href: '/#how-it-works' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/' },
      { label: 'Careers', href: '/jobs' },
      { label: 'Blog', href: '/' },
      { label: 'Contact', href: '/' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/' },
      { label: 'Terms of Service', href: '/' },
      { label: 'Cookie Policy', href: '/' },
      { label: 'GDPR', href: '/' },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                <Briefcase className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">SCN Jobs</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The modern job portal connecting talent with opportunity. Built for the future of work.
            </p>
            <div className="mt-6 flex gap-3">
              {[Twitter, Linkedin, Github, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2026 SCN Jobs. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Made with care in India
          </p>
        </div>
      </div>
    </footer>
  );
}
