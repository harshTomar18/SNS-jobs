'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, MessageSquare, Clock, Send, CheckCircle2, ArrowRight, Building2 } from 'lucide-react';
import { PublicNavbar } from '@/components/public-navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) {
      toast.error('Please fill in your name, phone number, and message.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success('Thank you! Your message has been sent to SCN Global Pvt Ltd.');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <div>
        <PublicNavbar />

        {/* Hero Header */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-900 py-20 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent opacity-60" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 border border-blue-400/20 text-xs font-semibold text-blue-300">
              <Building2 className="h-3.5 w-3.5" />
              <span>SCN Global Pvt Ltd</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              Get in Touch with Us
            </h1>
            <p className="mx-auto max-w-2xl text-base text-blue-100/80 sm:text-lg">
              Have questions about recruitment, candidate profiles, or job postings? Our team at SCN Global Pvt Ltd is here to assist you.
            </p>
          </div>
        </section>

        {/* Contact Info Grid & Form */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-10 mb-20 relative z-10">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Contact Cards Column */}
            <div className="space-y-4 lg:col-span-1">
              {/* Phone Card */}
              <Card className="p-6 border-slate-200/80 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow bg-white dark:bg-slate-900 rounded-3xl">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0 border border-blue-100 dark:border-blue-900/50">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">Call Us Directly</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Mon - Sat: 9:30 AM - 6:30 PM</p>
                    <a
                      href="tel:8588892236"
                      className="inline-block pt-1 text-lg font-black text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      +91 8588892236
                    </a>
                  </div>
                </div>
              </Card>

              {/* WhatsApp Card */}
              <Card className="p-6 border-slate-200/80 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow bg-white dark:bg-slate-900 rounded-3xl">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-100 dark:border-emerald-900/50">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">WhatsApp Support</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Instant chat for fast response</p>
                    <a
                      href="https://wa.me/918588892236"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 pt-1 text-sm font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Chat on WhatsApp (+91 8588892236) <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </Card>

              {/* Company Info Card */}
              <Card className="p-6 border-slate-200/80 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 rounded-3xl space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">SCN Global Pvt Ltd</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Official Recruitment Suite</p>
                  </div>
                </div>
                <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Serving Job Seekers & Recruiters Pan-India</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Support Available Mon to Sat (9:30 AM - 6:30 PM)</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Form Column */}
            <div className="lg:col-span-2">
              <Card className="p-8 sm:p-10 border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 rounded-3xl">
                {submitted ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Message Received!</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm">
                      Thank you for contacting SCN Global Pvt Ltd. Our representative will get back to you shortly at <strong className="text-slate-700 dark:text-slate-200">{form.phone}</strong>.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 font-bold rounded-xl"
                      onClick={() => {
                        setSubmitted(false);
                        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
                      }}
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
                        Send us a message
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        Fill out the form below and our support team will respond promptly.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contactName" className="font-bold text-xs">Your Name *</Label>
                        <Input
                          id="contactName"
                          placeholder="e.g. Rahul Sharma"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactPhone" className="font-bold text-xs">Phone Number *</Label>
                        <Input
                          id="contactPhone"
                          placeholder="e.g. 8588892236"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          required
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contactEmail" className="font-bold text-xs">Email Address (Optional)</Label>
                        <Input
                          id="contactEmail"
                          type="email"
                          placeholder="e.g. rahul@example.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactSubject" className="font-bold text-xs">Subject / Purpose</Label>
                        <Input
                          id="contactSubject"
                          placeholder="e.g. Job Search Query / Hiring Requirement"
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactMessage" className="font-bold text-xs">Message *</Label>
                      <Textarea
                        id="contactMessage"
                        rows={5}
                        placeholder="How can SCN Global Pvt Ltd help you today?"
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        required
                        className="rounded-xl"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-3 px-8 text-sm shadow-md"
                    >
                      {loading ? 'Sending Message...' : 'Submit Message'}
                      <Send className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                )}
              </Card>
            </div>
          </div>
        </section>
      </div>

      {/* Public Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="SCN Jobs" className="h-6 w-6 object-contain" />
            <span className="font-extrabold text-slate-800 dark:text-slate-100">SCN Global Pvt Ltd (scnjob.com)</span>
          </div>
          <p>© 2026 SCN Global Pvt Ltd. All rights reserved. Helpline: +91 8588892236</p>
        </div>
      </footer>
    </div>
  );
}
