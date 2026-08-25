'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, MessageSquare, Clock, Send, CheckCircle2, ArrowRight, Building2, User, FileText, ShieldCheck } from 'lucide-react';
import { PublicNavbar } from '@/components/public-navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { contactApi } from '@/lib/scn-api';
import { getApiErrorMessage } from '@/lib/api';
import { AppLogo } from '@/components/app-logo';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) {
      toast.error('Please fill in your name, phone number, and message.');
      return;
    }

    setLoading(true);
    try {
      const res = await contactApi.submit({
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        subject: form.subject || undefined,
        message: form.message,
      });
      setSubmitted(true);
      toast.success(res?.message || 'Your message has been sent. Our team will get back to you shortly.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not send message. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-blue-500/20">
      <div>
        <PublicNavbar />

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-[#101235] py-20 lg:py-24 text-white">
          {/* Ambient Glow Effects */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-1/2 right-10 w-72 h-72 bg-teal-500/10 blur-[90px] rounded-full pointer-events-none" />
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 border border-white/15 text-xs font-bold text-amber-300 backdrop-blur-md shadow-sm">
              <Building2 className="h-4 w-4 text-amber-400" />
              <span>SCN Global Pvt Ltd • SCNJOBS</span>
            </div>
            
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">
              Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-teal-200">Our Team</span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-base text-slate-300 sm:text-lg leading-relaxed font-medium">
              We are here to support job seekers and recruiters across India. Reach out for helpline support, hiring queries, or platform assistance.
            </p>
          </div>
        </section>

        {/* Main Content Area */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-12 mb-24 relative z-10">
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            
            {/* Left Column: Direct Contact Info (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Phone Helpline Card */}
              <Card className="p-6 border border-slate-200/80 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 rounded-3xl group">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 shrink-0 group-hover:scale-105 transition-transform">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">Direct Phone Helpline</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/60">Mon - Sat</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">9:30 AM - 6:30 PM (IST)</p>
                    <a
                      href="tel:8588892236"
                      className="inline-flex items-center gap-2 pt-2 text-xl font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                    >
                      <span>+91 8588892236</span>
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </Card>

              {/* WhatsApp Support Card */}
              <Card className="p-6 border border-emerald-200/80 dark:border-emerald-950/60 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20 rounded-3xl group">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 shrink-0 group-hover:scale-105 transition-transform">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">WhatsApp Chat Support</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Fast & responsive messaging assistance</p>
                    <a
                      href="https://wa.me/918588892236"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 pt-2 text-sm font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <span>Open WhatsApp (+91 8588892236)</span>
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </Card>

              {/* Corporate Info Card */}
              <Card className="p-6 border border-slate-200/80 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900 rounded-3xl space-y-4">
                <div className="flex items-center gap-3.5 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-sm shrink-0 border border-slate-200 dark:border-slate-700">
                    SCN
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">SCN Global Pvt Ltd</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Official Job Portal: scnjob.com</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <span>Serving Job Seekers & Hiring Organizations All Over India</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <span>Working Hours: Mon to Sat (9:30 AM - 6:30 PM)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Transparent Interface & Verified Recruiter Assurance</span>
                  </div>
                </div>
              </Card>

            </div>

            {/* Right Column: Contact Message Form (7 Cols) */}
            <div className="lg:col-span-7">
              <Card className="p-8 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 rounded-3xl">
                {submitted ? (
                  <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 shadow-md">
                      <CheckCircle2 className="h-9 w-9" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Message Received!</h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
                      Thank you for contacting <strong className="text-slate-900 dark:text-slate-100">SCN Global Pvt Ltd</strong>. Our support team will get back to you shortly at <strong className="text-blue-600 dark:text-blue-400">{form.phone}</strong>.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 font-bold rounded-xl border-slate-200 dark:border-slate-800"
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
                      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                        Send Us a Message
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                        Fill out your contact information below and our team will assist you promptly.
                      </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contactName" className="font-extrabold text-xs text-slate-700 dark:text-slate-300">Your Full Name *</Label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                          <Input
                            id="contactName"
                            placeholder="e.g. Rahul Sharma"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            className="pl-10 rounded-xl h-11 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contactPhone" className="font-extrabold text-xs text-slate-700 dark:text-slate-300">Phone Number *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                          <Input
                            id="contactPhone"
                            placeholder="e.g. 8588892236"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            required
                            className="pl-10 rounded-xl h-11 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contactEmail" className="font-extrabold text-xs text-slate-700 dark:text-slate-300">Email Address (Optional)</Label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                          <Input
                            id="contactEmail"
                            type="email"
                            placeholder="e.g. rahul@example.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="pl-10 rounded-xl h-11 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contactSubject" className="font-extrabold text-xs text-slate-700 dark:text-slate-300">Subject / Purpose</Label>
                        <div className="relative">
                          <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                          <Input
                            id="contactSubject"
                            placeholder="e.g. Job Query / Hiring Requirement"
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                            className="pl-10 rounded-xl h-11 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactMessage" className="font-extrabold text-xs text-slate-700 dark:text-slate-300">Message Details *</Label>
                      <Textarea
                        id="contactMessage"
                        rows={4}
                        placeholder="How can SCN Global Pvt Ltd (scnjob.com) help you today?"
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        required
                        className="rounded-xl border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-600 p-3.5"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl py-3 px-8 text-sm shadow-md shadow-blue-600/20 h-11"
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
            <AppLogo className="h-8 w-8 object-contain drop-shadow-sm" />
            <span className="font-extrabold text-slate-800 dark:text-slate-100">SCN Global Pvt Ltd (SCNJOBS)</span>
          </div>
          <p>© 2026 SCNJOBS. All rights reserved. Helpline: +91 8588892236</p>
        </div>
      </footer>
    </div>
  );
}
