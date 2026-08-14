"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { jobsApi, JobWithMeta } from "@/lib/scn-api";
import { trustedCompanies, testimonials, faqs as FAQS } from "@/lib/marketing-data";
import {
  Search, MapPin, ArrowRight, CheckCircle2, Star, ChevronDown, Menu, X,
  Sun, Moon, Factory, HeartPulse, Truck, ShoppingBag, UtensilsCrossed,
  Laptop2, Landmark, GraduationCap, Quote, Clock, IndianRupee, Users,
  Building2, Briefcase, Apple, PlayCircle, Code, CreditCard, ShoppingCart
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */
const BRAND = {
  ink: "#101235",
  amber: "#F5A623",
  amberDeep: "#D98C0F",
  indigo: "#2B2E77",
  teal: "#14B8A6",
};

const getPalette = (dark: boolean) =>
  dark
    ? {
        bg: "#0A0B1E",
        bgAlt: "#12143080",
        surface: "#13152F",
        surfaceAlt: "#191C3D",
        text: "#F3F2EC",
        textMuted: "#A6A9C4",
        border: "#262A54",
        boardBg: "#0E1030",
      }
    : {
        bg: "#FBFAF6",
        bgAlt: "#F2F0E8",
        surface: "#FFFFFF",
        surfaceAlt: "#F5F3EC",
        text: "#101235",
        textMuted: "#5B5F79",
        border: "#E7E3D6",
        boardBg: "#101235",
      };

const iconMap: Record<string, any> = {
  Code, CreditCard, HeartPulse, ShoppingCart, GraduationCap, Factory,
  Truck, ShoppingBag, UtensilsCrossed, Laptop2, Landmark
};

/* ------------------------------------------------------------------ */
/*  Content & Data                                                     */
/* ------------------------------------------------------------------ */
const HERO_SLIDES = [
  {
    id: 1,
    image: "/images/hero-1.png",
    badge: "NOW HIRING",
    title: "Tech & Software Engineering",
    subtitle: "Frontend, Backend, Cloud & Product Leads",
    location: "Bengaluru • Noida • Hyderabad",
  },
  {
    id: 2,
    image: "/images/hero-2.png",
    badge: "HEALTHCARE OPPORTUNITIES",
    title: "Medical & Nursing Professionals",
    subtitle: "Staff Nurses, ICU Specialists & Technicians",
    location: "Mumbai • Lucknow • Delhi NCR",
  },
  {
    id: 3,
    image: "/images/hero-3.png",
    badge: "IMMEDIATE JOINING",
    title: "Supply Chain & Manufacturing",
    subtitle: "Warehouse Shift Leads, Operators & Technicians",
    location: "Pune • Gurugram • Jaipur",
  },
];

const FALLBACK_JOBS = [
  { id: '1', title: "Senior Frontend Developer", company_name: "Zeta Labs", location: "Noida", employment_type: "Full-time", salary_range: "₹12–18L", category: "Technology", created_at: "2d ago" },
  { id: '2', title: "Staff Nurse — ICU", company_name: "Apollo Care", location: "Lucknow", employment_type: "Full-time", salary_range: "₹4.2–6L", category: "Healthcare", created_at: "1d ago" },
  { id: '3', title: "Warehouse Shift Lead", company_name: "Delhivery", location: "Gurugram", employment_type: "Full-time", salary_range: "₹3.5–5L", category: "Logistics", created_at: "5h ago" },
  { id: '4', title: "Store Manager", company_name: "Reliance Retail", location: "Jaipur", employment_type: "Full-time", salary_range: "₹4–6.5L", category: "Retail", created_at: "3d ago" },
  { id: '5', title: "CNC Machine Operator", company_name: "Tata Autocomp", location: "Pune", employment_type: "Full-time", salary_range: "₹2.8–4L", category: "Manufacturing", created_at: "6h ago" },
  { id: '6', title: "Front Office Executive", company_name: "Taj Hotels", location: "Mumbai", employment_type: "Full-time", salary_range: "₹3–4.5L", category: "Hospitality", created_at: "1d ago" },
];

const TOP_INDUSTRIES_WITH_BG = [
  { name: "Technology & IT", icon: "Laptop2", bg: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80" },
  { name: "Healthcare & Pharma", icon: "HeartPulse", bg: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80" },
  { name: "Logistics & Supply Chain", icon: "Truck", bg: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80" },
  { name: "Retail & E-Commerce", icon: "ShoppingBag", bg: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80" },
  { name: "Manufacturing", icon: "Factory", bg: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80" },
  { name: "Hospitality & Tourism", icon: "UtensilsCrossed", bg: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80" },
  { name: "Banking & Finance", icon: "Landmark", bg: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80" },
  { name: "Education & EdTech", icon: "GraduationCap", bg: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80" },
];

const TOP_CITIES_WITH_BG = [
  { name: "Mumbai", state: "Maharashtra", bg: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80" },
  { name: "Bengaluru", state: "Karnataka", bg: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80" },
  { name: "Delhi NCR", state: "Delhi", bg: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80" },
  { name: "Hyderabad", state: "Telangana", bg: "https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=800&q=80" },
  { name: "Pune", state: "Maharashtra", bg: "https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?auto=format&fit=crop&w=800&q=80" },
  { name: "Jaipur", state: "Rajasthan", bg: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80" },
  { name: "Chennai", state: "Tamil Nadu", bg: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80" },
  { name: "Kolkata", state: "West Bengal", bg: "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=800&q=80" },
];

const STATS = [
  { value: 12000, suffix: "+", label: "Active Jobs" },
  { value: 3500, suffix: "+", label: "Companies Hiring" },
  { value: 1200000, suffix: "+", label: "Job Seekers", compact: true },
  { value: 94, suffix: "%", label: "Success Rate" },
];

const STEPS = [
  { title: "Create Your Profile", desc: "Sign up in minutes and build a profile that stands out to recruiters." },
  { title: "Discover Jobs", desc: "Search and filter through thousands of jobs that match your skills and preferences." },
  { title: "Apply with One Click", desc: "Apply to jobs instantly and track your application status in real time." },
  { title: "Get Hired", desc: "Receive interview invites and offers, all managed in one beautiful dashboard." },
];

/* ------------------------------------------------------------------ */
/*  Helpers & Hooks                                                    */
/* ------------------------------------------------------------------ */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return [ref, visible] as const;
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.7s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.7s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function useCountUp(target: number, active: boolean, decimals = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    const duration = 1600;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target]);
  return val.toFixed(decimals);
}

function formatStat(n: number, compact?: boolean) {
  if (compact) return (n / 100000).toFixed(1).replace(/\.0$/, "") + "L";
  return Math.round(n).toLocaleString("en-IN");
}

/* ------------------------------------------------------------------ */
/*  Hero Image Slider Component                                        */
/* ------------------------------------------------------------------ */
function HeroSlider({ pal }: { pal: any }) {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 24,
        overflow: "hidden",
        height: 380,
        boxShadow: "0 30px 60px -20px rgba(16,18,53,0.45)",
        border: `1px solid ${pal.border}`,
        background: pal.surfaceAlt,
      }}
    >
      {HERO_SLIDES.map((s, idx) => (
        <div
          key={s.id}
          style={{
            position: "absolute",
            inset: 0,
            opacity: idx === activeSlide ? 1 : 0,
            transform: idx === activeSlide ? "scale(1)" : "scale(1.05)",
            transition: "opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1)",
            pointerEvents: idx === activeSlide ? "auto" : "none",
          }}
        >
          <img
            src={s.image}
            alt={s.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(16,18,53,0.15) 0%, rgba(16,18,53,0.88) 100%)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: 28,
            }}
          >
            <span
              className="mono"
              style={{
                display: "inline-block",
                padding: "5px 12px",
                borderRadius: 999,
                background: BRAND.amber,
                color: BRAND.ink,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                alignSelf: "flex-start",
                marginBottom: 10,
              }}
            >
              {s.badge}
            </span>
            <h3 className="disp" style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1.25 }}>
              {s.title}
            </h3>
            <p style={{ color: "#E5E7EB", fontSize: 13.5, marginTop: 6, marginBottom: 6 }}>{s.subtitle}</p>
            <span style={{ color: BRAND.teal, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
              <MapPin size={13} /> {s.location}
            </span>
          </div>
        </div>
      ))}

      {/* Prev / Next controls */}
      <button
        onClick={() => setActiveSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
        aria-label="Previous slide"
        style={{
          position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
          width: 36, height: 36, borderRadius: "50%", background: "rgba(16,18,53,0.6)",
          border: "1px solid rgba(255,255,255,0.25)", color: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10,
          backdropFilter: "blur(4px)",
        }}
      >
        ‹
      </button>
      <button
        onClick={() => setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
        aria-label="Next slide"
        style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          width: 36, height: 36, borderRadius: "50%", background: "rgba(16,18,53,0.6)",
          border: "1px solid rgba(255,255,255,0.25)", color: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10,
          backdropFilter: "blur(4px)",
        }}
      >
        ›
      </button>

      {/* Indicator dots */}
      <div style={{ position: "absolute", bottom: 14, right: 24, display: "flex", gap: 6, zIndex: 10 }}>
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveSlide(i)}
            style={{
              width: i === activeSlide ? 22 : 7,
              height: 7,
              borderRadius: 4,
              background: i === activeSlide ? BRAND.amber : "rgba(255,255,255,0.45)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function SCNJobsLanding() {
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [statsRef, statsVisible] = useReveal();
  const [scrolled, setScrolled] = useState(false);
  
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  const jobsQuery = useQuery({ queryKey: ['jobs'], queryFn: jobsApi.list });
  const fetchedJobs: any[] = jobsQuery.data ?? [];
  const displayJobs = fetchedJobs.length > 0 ? fetchedJobs : FALLBACK_JOBS;

  const pal = getPalette(dark);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLink = { color: pal.textMuted, fontWeight: 500, fontSize: 14 };

  return (
    <div
      style={{
        background: pal.bg,
        color: pal.text,
        fontFamily: "'Inter', sans-serif",
        minHeight: "100vh",
        transition: "background 0.4s ease, color 0.4s ease",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

        * { box-sizing: border-box; }
        .disp { font-family: 'Sora', sans-serif; }
        .mono { font-family: 'IBM Plex Mono', monospace; }

        ::selection { background: ${BRAND.amber}; color: ${BRAND.ink}; }

        .container { max-width: 1180px; margin: 0 auto; padding: 0 24px; }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
        }

        a, button { font-family: inherit; }
        button:focus-visible, a:focus-visible, input:focus-visible {
          outline: 2px solid ${BRAND.teal};
          outline-offset: 3px;
        }

        /* Marquee */
        .marquee-track {
          display: flex;
          width: max-content;
          animation: scroll-left 28s linear infinite;
        }
        @keyframes scroll-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        /* Cards */
        .job-card {
          transition: transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s ease, border-color 0.35s ease;
        }
        .job-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 48px -20px rgba(16,18,53,0.25);
          border-color: ${BRAND.teal};
        }

        /* Smooth Slide-up Hover Card for Industry & Cities */
        .hover-slide-card {
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          height: 220px;
          cursor: pointer;
          border: 1px solid ${pal.border};
          box-shadow: 0 10px 30px -15px rgba(0,0,0,0.1);
          transition: border-color 0.35s ease, box-shadow 0.35s ease;
        }
        .hover-slide-card:hover {
          border-color: ${BRAND.amber};
          box-shadow: 0 20px 40px -15px rgba(16,18,53,0.3);
        }
        .hover-slide-card .bg-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.65s cubic-bezier(.22,1,.36,1), filter 0.65s ease;
        }
        .hover-slide-card:hover .bg-img {
          transform: scale(1.12);
        }
        .hover-slide-card .card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(16,18,53,0.15) 0%, rgba(16,18,53,0.88) 100%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 22px;
          transition: background 0.4s ease;
        }
        .hover-slide-card:hover .card-overlay {
          background: linear-gradient(180deg, rgba(16,18,53,0.35) 0%, rgba(16,18,53,0.95) 100%);
        }
        .hover-slide-card .slide-up-body {
          transform: translateY(28px);
          transition: transform 0.45s cubic-bezier(.22,1,.36,1);
        }
        .hover-slide-card:hover .slide-up-body {
          transform: translateY(0);
        }

        .cta-btn {
          transition: transform 0.25s cubic-bezier(.22,1,.36,1), box-shadow 0.25s ease, background 0.25s ease;
        }
        .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 30px -10px rgba(245,166,35,0.55); }
        .cta-btn:active { transform: translateY(0px) scale(0.98); }

        .ghost-btn { transition: background 0.25s ease, border-color 0.25s ease, transform 0.25s ease; }
        .ghost-btn:hover { transform: translateY(-2px); }

        .nav-link { position: relative; }
        .nav-link::after {
          content: ''; position: absolute; left: 0; bottom: -4px; height: 1.5px; width: 0%;
          background: ${BRAND.amber}; transition: width 0.3s ease;
        }
        .nav-link:hover::after { width: 100%; }

        .faq-item { transition: background 0.3s ease; }

        .chip-hover { transition: transform 0.25s ease, border-color 0.25s ease; }
        .chip-hover:hover { transform: translateY(-2px); border-color: ${BRAND.teal}; }

        /* Hero background texture */
        .hero-glow {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(560px circle at 15% 20%, rgba(43,46,119,0.18), transparent 60%),
            radial-gradient(520px circle at 85% 0%, rgba(245,166,35,0.14), transparent 55%);
        }

        input::placeholder { color: ${pal.textMuted}; opacity: 0.8; }

        .float-slow { animation: float 6s ease-in-out infinite; }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .spin-slow { animation: spin 22s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
      `}} />

      {/* ---------------- NAV ---------------- */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: scrolled ? (dark ? "rgba(10,11,30,0.85)" : "rgba(251,250,246,0.85)") : "transparent",
          backdropFilter: scrolled ? "blur(10px)" : "none",
          borderBottom: scrolled ? `1px solid ${pal.border}` : "1px solid transparent",
          transition: "all 0.35s ease",
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
            <div
              style={{
                width: 34, height: 34, borderRadius: 9,
                background: `linear-gradient(135deg, ${BRAND.indigo}, ${BRAND.teal})`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Briefcase size={17} color="#fff" strokeWidth={2.4} />
            </div>
            <span className="disp" style={{ fontWeight: 800, fontSize: 19, letterSpacing: "-0.01em" }}>SCN Jobs</span>
          </Link>

          <nav style={{ display: "flex", alignItems: "center", gap: 32 }} className="nav-desktop">
            {[
              { label: "Featured Jobs", href: "#featured" },
              { label: "Industries", href: "#industries" },
              { label: "Cities", href: "#cities" },
              { label: "How it Works", href: "#how-it-works" },
              { label: "FAQ", href: "#faq" },
            ].map((l) => (
              <a key={l.label} href={l.href} className="nav-link" style={navLink}>{l.label}</a>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              aria-label="Toggle theme"
              onClick={() => setDark((d) => !d)}
              className="ghost-btn"
              style={{
                width: 38, height: 38, borderRadius: 10,
                border: `1px solid ${pal.border}`, background: pal.surface,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}
            >
              {dark ? <Sun size={16} color={pal.text} /> : <Moon size={16} color={pal.text} />}
            </button>
            <Link
              href="/login"
              className="ghost-btn nav-desktop"
              style={{ fontSize: 14, fontWeight: 600, padding: "9px 16px", borderRadius: 10, border: `1px solid ${pal.border}`, color: pal.text, textDecoration: "none" }}
            >
              Sign In
            </Link>
            <Link
              href="/worker/register"
              className="cta-btn nav-desktop"
              style={{
                fontSize: 14, fontWeight: 700, padding: "10px 18px", borderRadius: 10,
                background: BRAND.amber, color: BRAND.ink, textDecoration: "none",
              }}
            >
              Sign Up Free
            </Link>
            <button
              className="menu-toggle"
              onClick={() => setMenuOpen((m) => !m)}
              aria-label="Menu"
              style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: pal.text }}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="container" style={{ paddingBottom: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Featured Jobs", href: "#featured" },
              { label: "Industries", href: "#industries" },
              { label: "Cities", href: "#cities" },
              { label: "How it Works", href: "#how-it-works" },
              { label: "FAQ", href: "#faq" },
            ].map((l) => (
              <a key={l.label} href={l.href} style={{ color: pal.text, fontWeight: 600, fontSize: 15, textDecoration: "none" }}>{l.label}</a>
            ))}
            <Link href="/login" style={{ color: pal.text, fontWeight: 600, fontSize: 15, textDecoration: "none" }}>Sign In</Link>
            <Link href="/worker/register" style={{ color: pal.text, fontWeight: 600, fontSize: 15, textDecoration: "none" }}>Sign Up Free</Link>
          </div>
        )}
        <style>{`
          @media (max-width: 860px) {
            .nav-desktop { display: none !important; }
            .menu-toggle { display: flex !important; }
          }
        `}</style>
      </header>

      {/* ---------------- SECTION 1: HERO & SLIDER ---------------- */}
      <section style={{ position: "relative", overflow: "hidden", paddingTop: 64, paddingBottom: 88 }}>
        <div className="hero-glow" />
        <div className="container" style={{ position: "relative", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 56, alignItems: "center" }}>
          <div>
            <Reveal>
              <div
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px",
                  borderRadius: 999, border: `1px solid ${pal.border}`, background: pal.surface,
                  fontSize: 12.5, fontWeight: 600, color: pal.textMuted, marginBottom: 22,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: BRAND.teal }} />
                Trusted by 3,500+ top hiring partners
              </div>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="disp" style={{ fontSize: "clamp(36px, 5vw, 58px)", lineHeight: 1.06, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
                Find your next
                <br />
                opportunity, <span style={{ color: BRAND.amberDeep }}>faster.</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p style={{ fontSize: 17, color: pal.textMuted, maxWidth: 480, marginTop: 22, lineHeight: 1.6 }}>
                The modern recruitment suite connecting top candidates with verified recruiters. Discover hand-picked jobs and get hired today.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div
                style={{
                  marginTop: 32, display: "flex", gap: 8, padding: 8, borderRadius: 16,
                  background: pal.surface, border: `1px solid ${pal.border}`, boxShadow: "0 20px 44px -24px rgba(16,18,53,0.28)",
                }}
                className="search-row"
              >
                <div style={{ flex: 1.2, display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
                  <Search size={17} color={pal.textMuted} />
                  <input 
                    placeholder="Job title or skill" 
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: 14.5, color: pal.text }} 
                  />
                </div>
                <div style={{ width: 1, background: pal.border, margin: "6px 0" }} />
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
                  <MapPin size={17} color={pal.textMuted} />
                  <input 
                    placeholder="City" 
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: 14.5, color: pal.text }} 
                  />
                </div>
                <Link 
                  href={`/jobs?q=${encodeURIComponent(searchKeyword)}&loc=${encodeURIComponent(searchLocation)}`}
                  className="cta-btn" 
                  style={{ display: "inline-flex", alignItems: "center", border: "none", borderRadius: 10, background: BRAND.amber, color: BRAND.ink, fontWeight: 700, fontSize: 14, padding: "0 22px", cursor: "pointer", textDecoration: "none" }}
                >
                  Search
                </Link>
              </div>
            </Reveal>

            <Reveal delay={300}>
              <div style={{ marginTop: 18, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: pal.textMuted, marginRight: 4 }}>Popular:</span>
                {["Frontend Developer", "Product Designer", "Remote", "Fresher"].map((t) => (
                  <span key={t} className="chip-hover" style={{ fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 999, border: `1px solid ${pal.border}`, color: pal.textMuted, cursor: "pointer" }}>
                    {t}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={200}>
            <div>
              <HeroSlider pal={pal} />
            </div>
          </Reveal>
        </div>
        <style>{`
          @media (max-width: 900px) {
            .container > div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 560px) {
            .search-row { flex-direction: column; }
            .search-row > div[style*="width: 1"] { display: none; }
          }
        `}</style>
      </section>

      {/* ---------------- MARQUEE ---------------- */}
      <section style={{ padding: "26px 0", borderTop: `1px solid ${pal.border}`, borderBottom: `1px solid ${pal.border}`, background: pal.surfaceAlt, overflow: "hidden" }}>
        <p style={{ textAlign: "center", fontSize: 12.5, fontWeight: 600, letterSpacing: "0.1em", color: pal.textMuted, marginBottom: 18, textTransform: "uppercase" }}>
          Trusted by leading employers across India
        </p>
        <div style={{ maskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)" }}>
          <div className="marquee-track">
            {[...Array(3)].map((_, dup) => (
              <div key={dup} style={{ display: "flex", gap: 36, paddingRight: 36, alignItems: "center" }}>
                {trustedCompanies.map((c) => (
                  <div
                    key={c.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 18px",
                      borderRadius: 14,
                      background: pal.surface,
                      border: `1px solid ${pal.border}`,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.logo ? (
                      <img src={c.logo} alt={c.name} style={{ width: 28, height: 28, borderRadius: 8, objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: BRAND.amber, color: BRAND.ink, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {c.name[0]}
                      </div>
                    )}
                    <span className="disp" style={{ fontSize: 15, fontWeight: 700, color: pal.text }}>
                      {c.name}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- SECTION 2: HAND-PICKED OPPORTUNITIES (View all / pages removed) ---------------- */}
      <section id="featured" className="container" style={{ padding: "96px 24px 20px" }}>
        <Reveal>
          <div style={{ marginBottom: 40 }}>
            <span className="mono" style={{ fontSize: 12, color: BRAND.teal, fontWeight: 600, letterSpacing: "0.1em" }}>FEATURED JOBS</span>
            <h2 className="disp" style={{ fontSize: "clamp(26px, 3.4vw, 36px)", fontWeight: 800, marginTop: 8, letterSpacing: "-0.01em" }}>
              Hand-picked opportunities
            </h2>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="jobs-grid">
          {displayJobs.slice(0, 6).map((j, i) => (
            <Reveal key={j.id || j.title} delay={i * 70}>
              <div
                className="job-card"
                style={{
                  border: `1px solid ${pal.border}`, borderRadius: 16, padding: 22, background: pal.surface, height: "100%",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 42, height: 42, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
                      background: `linear-gradient(135deg, ${BRAND.indigo}22, ${BRAND.teal}22)`, color: BRAND.indigo, fontWeight: 800, fontSize: 16,
                    }}
                    className="disp"
                  >
                    {(j.company_name || j.company || 'S')[0]}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: BRAND.amberDeep, background: `${BRAND.amber}1f`, padding: "4px 10px", borderRadius: 999 }}>
                    {j.category || j.tag || 'Hot Role'}
                  </span>
                </div>
                <h3 className="disp" style={{ fontSize: 17.5, fontWeight: 700, marginTop: 16, marginBottom: 4 }}>{j.title}</h3>
                <p style={{ fontSize: 13.5, color: pal.textMuted, marginBottom: 16 }}>{j.company_name || j.company}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: pal.textMuted }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={13} /> {j.location || j.loc}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><IndianRupee size={13} /> {j.salary_range || j.pay} / yr</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Clock size={13} /> {j.created_at || j.posted}</span>
                </div>
                <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${pal.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: pal.textMuted }}>{j.employment_type || j.type}</span>
                  <Link href="/worker/register" style={{ fontSize: 13, fontWeight: 700, color: BRAND.teal, textDecoration: "none" }}>Apply →</Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <style>{`@media (max-width: 900px) { .jobs-grid { grid-template-columns: 1fr 1fr !important; } } @media (max-width: 620px) { .jobs-grid { grid-template-columns: 1fr !important; } }`}</style>
      </section>

      {/* ---------------- SECTION 3: INDUSTRIES (Count removed, BG images + Smooth Slide-Up Hover) ---------------- */}
      <section id="industries" className="container" style={{ padding: "96px 24px 20px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="mono" style={{ fontSize: 12, color: BRAND.teal, fontWeight: 600, letterSpacing: "0.1em" }}>EXPLORE BY INDUSTRY</span>
            <h2 className="disp" style={{ fontSize: "clamp(26px, 3.4vw, 36px)", fontWeight: 800, marginTop: 8 }}>
              Find opportunities that match your passion
            </h2>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }} className="industries-grid">
          {TOP_INDUSTRIES_WITH_BG.map((ind, i) => {
            const Icon = iconMap[ind.icon] || Laptop2;
            return (
              <Reveal key={ind.name} delay={i * 50}>
                <div className="hover-slide-card">
                  <img src={ind.bg} alt={ind.name} className="bg-img" />
                  <div className="card-overlay">
                    <div className="slide-up-body">
                      <div
                        style={{
                          width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.2)",
                          backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center",
                          marginBottom: 12, border: "1px solid rgba(255,255,255,0.3)",
                        }}
                      >
                        <Icon size={20} color="#fff" />
                      </div>
                      <h3 className="disp" style={{ color: "#fff", fontSize: 16.5, fontWeight: 700, margin: 0 }}>{ind.name}</h3>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
        <style>{`@media (max-width: 900px) { .industries-grid { grid-template-columns: 1fr 1fr !important; } } @media (max-width: 520px) { .industries-grid { grid-template-columns: 1fr !important; } }`}</style>
      </section>

      {/* ---------------- SECTION 4: TOP CITIES (Page numbers removed, Image cards layout) ---------------- */}
      <section id="cities" className="container" style={{ padding: "96px 24px 20px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="mono" style={{ fontSize: 12, color: BRAND.teal, fontWeight: 600, letterSpacing: "0.1em" }}>POPULAR CITIES</span>
            <h2 className="disp" style={{ fontSize: "clamp(26px, 3.4vw, 36px)", fontWeight: 800, marginTop: 8 }}>
              Discover jobs in top cities across India
            </h2>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }} className="cities-grid">
          {TOP_CITIES_WITH_BG.map((city, i) => (
            <Reveal key={city.name} delay={i * 40}>
              <div className="hover-slide-card">
                <img src={city.bg} alt={city.name} className="bg-img" />
                <div className="card-overlay">
                  <div className="slide-up-body">
                    <span
                      style={{
                        fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        color: BRAND.amber, background: "rgba(16,18,53,0.7)", padding: "3px 8px", borderRadius: 4,
                        display: "inline-block", marginBottom: 8,
                      }}
                    >
                      {city.state}
                    </span>
                    <h3 className="disp" style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                      <MapPin size={16} color={BRAND.amber} /> {city.name}
                    </h3>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <style>{`@media (max-width: 900px) { .cities-grid { grid-template-columns: 1fr 1fr !important; } } @media (max-width: 520px) { .cities-grid { grid-template-columns: 1fr !important; } }`}</style>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section id="how-it-works" style={{ background: pal.surfaceAlt, marginTop: 96, padding: "96px 0", borderTop: `1px solid ${pal.border}`, borderBottom: `1px solid ${pal.border}` }}>
        <div className="container">
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <span className="mono" style={{ fontSize: 12, color: BRAND.teal, fontWeight: 600, letterSpacing: "0.1em" }}>HOW IT WORKS</span>
              <h2 className="disp" style={{ fontSize: "clamp(26px, 3.4vw, 36px)", fontWeight: 800, marginTop: 8 }}>
                Get hired in four simple steps
              </h2>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 28, position: "relative" }} className="steps-grid">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 90}>
                <div style={{ position: "relative" }}>
                  <span className="disp" style={{ fontSize: 44, fontWeight: 800, color: pal.border, display: "block", lineHeight: 1 }}>
                    0{i + 1}
                  </span>
                  <h3 className="disp" style={{ fontSize: 17, fontWeight: 700, marginTop: 14, marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontSize: 13.5, color: pal.textMuted, lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <style>{`@media (max-width: 860px) { .steps-grid { grid-template-columns: 1fr 1fr !important; row-gap: 40px; } }`}</style>
      </section>

      {/* ---------------- STATS ---------------- */}
      <section ref={statsRef} className="container" style={{ padding: "96px 24px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="stats-grid">
          {STATS.map((s, i) => {
            const val = useCountUp(s.value, statsVisible);
            return (
              <Reveal key={s.label} delay={i * 60}>
                <div style={{ border: `1px solid ${pal.border}`, borderRadius: 16, padding: "28px 20px", background: pal.surface, textAlign: "center" }}>
                  <div className="mono" style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 700, color: BRAND.indigo }}>
                    {formatStat(Number(val), s.compact)}{s.suffix}
                  </div>
                  <p style={{ fontSize: 13, color: pal.textMuted, marginTop: 8, fontWeight: 600 }}>{s.label}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
        <style>{`@media (max-width: 760px) { .stats-grid { grid-template-columns: 1fr 1fr !important; } }`}</style>
      </section>

      {/* ---------------- TESTIMONIALS ---------------- */}
      <section id="testimonials" className="container" style={{ padding: "96px 24px 20px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="mono" style={{ fontSize: 12, color: BRAND.teal, fontWeight: 600, letterSpacing: "0.1em" }}>TESTIMONIALS</span>
            <h2 className="disp" style={{ fontSize: "clamp(26px, 3.4vw, 36px)", fontWeight: 800, marginTop: 8 }}>
              Loved by candidates &amp; recruiters
            </h2>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="testi-grid">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 80}>
              <div style={{ border: `1px solid ${pal.border}`, borderRadius: 16, padding: 26, background: pal.surface, height: "100%" }}>
                <Quote size={22} color={BRAND.amber} style={{ marginBottom: 14 }} />
                <p style={{ fontSize: 14.5, lineHeight: 1.65, color: pal.text, marginBottom: 20 }}>{t.content}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {t.avatar ? (
                    <img src={t.avatar} alt={t.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${BRAND.indigo}, ${BRAND.teal})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>
                      {t.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 700 }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: pal.textMuted }}>{t.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <style>{`@media (max-width: 900px) { .testi-grid { grid-template-columns: 1fr !important; } }`}</style>
      </section>

      {/* ---------------- APP DOWNLOAD ---------------- */}
      <section className="container" style={{ padding: "96px 24px 20px" }}>
        <Reveal>
          <div
            style={{
              borderRadius: 24, padding: "56px 44px", position: "relative", overflow: "hidden",
              background: `linear-gradient(120deg, ${BRAND.ink}, ${BRAND.indigo})`,
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: 32, flexWrap: "wrap",
            }}
          >
            <div className="spin-slow" style={{ position: "absolute", right: -60, top: -60, width: 220, height: 220, borderRadius: "50%", border: `1px dashed ${BRAND.teal}55` }} />
            <div style={{ maxWidth: 460, position: "relative" }}>
              <h2 className="disp" style={{ color: "#fff", fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 800, marginBottom: 12 }}>
                Take SCN Jobs with you
              </h2>
              <p style={{ color: "#C7C9E6", fontSize: 14.5, lineHeight: 1.65 }}>
                Get instant job alerts, track applications, and never miss an opportunity. Download our mobile app today.
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, position: "relative" }}>
              <a href="#" className="ghost-btn" style={{ display: "flex", alignItems: "center", gap: 10, background: "#ffffff14", border: "1px solid #ffffff30", borderRadius: 12, padding: "11px 18px", textDecoration: "none" }}>
                <Apple size={22} color="#fff" />
                <span style={{ color: "#fff" }}>
                  <span style={{ display: "block", fontSize: 9.5, color: "#C7C9E6" }}>Download on the</span>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 700 }}>App Store</span>
                </span>
              </a>
              <a href="#" className="ghost-btn" style={{ display: "flex", alignItems: "center", gap: 10, background: "#ffffff14", border: "1px solid #ffffff30", borderRadius: 12, padding: "11px 18px", textDecoration: "none" }}>
                <PlayCircle size={22} color="#fff" />
                <span style={{ color: "#fff" }}>
                  <span style={{ display: "block", fontSize: 9.5, color: "#C7C9E6" }}>GET IT ON</span>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 700 }}>Google Play</span>
                </span>
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section id="faq" className="container" style={{ padding: "96px 24px 20px", maxWidth: 820 }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="mono" style={{ fontSize: 12, color: BRAND.teal, fontWeight: 600, letterSpacing: "0.1em" }}>FAQ</span>
            <h2 className="disp" style={{ fontSize: "clamp(26px, 3.4vw, 36px)", fontWeight: 800, marginTop: 8 }}>
              Frequently asked questions
            </h2>
          </div>
        </Reveal>
        <div>
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={i * 40}>
              <div className="faq-item" style={{ borderBottom: `1px solid ${pal.border}` }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  style={{
                    width: "100%", background: "none", border: "none", padding: "20px 4px", display: "flex",
                    justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left",
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 15, color: pal.text }}>{f.q}</span>
                  <ChevronDown
                    size={18}
                    color={pal.textMuted}
                    style={{ transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease", flexShrink: 0 }}
                  />
                </button>
                <div
                  style={{
                    maxHeight: openFaq === i ? 200 : 0, overflow: "hidden", transition: "max-height 0.4s cubic-bezier(.22,1,.36,1)",
                  }}
                >
                  <p style={{ padding: "0 4px 20px", fontSize: 14, color: pal.textMuted, lineHeight: 1.65 }}>{f.a}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- FINAL CTA ---------------- */}
      <section className="container" style={{ padding: "96px 24px 100px", textAlign: "center" }}>
        <Reveal>
          <h2 className="disp" style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 16 }}>
            Ready to find your next opportunity?
          </h2>
          <p style={{ fontSize: 15.5, color: pal.textMuted, maxWidth: 480, margin: "0 auto 32px" }}>
            Join thousands of candidates and recruiters on SCN Jobs. It's free to get started.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/worker/register" className="cta-btn" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: BRAND.amber, color: BRAND.ink, fontWeight: 700, fontSize: 14.5, padding: "13px 26px", borderRadius: 12, textDecoration: "none" }}>
              Get Started Free <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="ghost-btn" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", color: pal.text, fontWeight: 700, fontSize: 14.5, padding: "13px 26px", borderRadius: 12, border: `1px solid ${pal.border}`, textDecoration: "none" }}>
              I'm Hiring
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer style={{ borderTop: `1px solid ${pal.border}`, background: pal.surfaceAlt, padding: "64px 0 32px" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 40 }} className="footer-grid">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${BRAND.indigo}, ${BRAND.teal})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Briefcase size={15} color="#fff" />
                </div>
                <span className="disp" style={{ fontWeight: 800, fontSize: 17 }}>SCN Jobs</span>
              </div>
              <p style={{ fontSize: 13.5, color: pal.textMuted, lineHeight: 1.65, maxWidth: 260 }}>
                The modern job portal connecting talent with opportunity. Built for the future of work.
              </p>
            </div>
            {[
              { h: "For Candidates", items: ["Browse Jobs", "Create Profile", "Login", "Career Resources"] },
              { h: "For Recruiters", items: ["Post a Job", "Search Candidates", "Recruiter Login", "Pricing"] },
              { h: "Company", items: ["About Us", "Careers", "Blog", "Contact"] },
            ].map((col) => (
              <div key={col.h}>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: pal.text }}>{col.h}</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {col.items.map((it) => (
                    <a key={it} href="#" style={{ fontSize: 13.5, color: pal.textMuted, textDecoration: "none" }}>{it}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${pal.border}`, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 12.5, color: pal.textMuted }}>© 2026 SCN Jobs. All rights reserved.</p>
            <p style={{ fontSize: 12.5, color: pal.textMuted }}>Made with care in India</p>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `@media (max-width: 760px) { .footer-grid { grid-template-columns: 1fr 1fr !important; row-gap: 32px; } }` }} />
      </footer>
    </div>
  );
}
