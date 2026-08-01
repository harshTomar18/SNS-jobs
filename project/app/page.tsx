"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { jobsApi, JobWithMeta } from "@/lib/scn-api";
import { trustedCompanies, topIndustries, popularLocations, testimonials, faqs as FAQS } from "@/lib/marketing-data";
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
/*  Content                                                            */
/* ------------------------------------------------------------------ */
const BOARD_ROWS = [
  ["Machine Operator", "Tata Autocomp", "Pune"],
  ["Staff Nurse", "Apollo Care", "Lucknow"],
  ["Warehouse Lead", "Delhivery", "Gurugram"],
  ["Store Manager", "Reliance Retail", "Jaipur"],
  ["Front Desk Exec.", "Taj Hotels", "Mumbai"],
  ["Frontend Developer", "Zeta Labs", "Noida"],
  ["Field Technician", "BSES", "Delhi NCR"],
  ["QA Inspector", "Havells", "Patna"],
];

const FALLBACK_JOBS = [
  { id: '1', title: "Senior Frontend Developer", company_name: "Zeta Labs", location: "Noida", employment_type: "Full-time", salary_range: "₹12–18L", category: "Technology", created_at: "2d ago" },
  { id: '2', title: "Staff Nurse — ICU", company_name: "Apollo Care", location: "Lucknow", employment_type: "Full-time", salary_range: "₹4.2–6L", category: "Healthcare", created_at: "1d ago" },
  { id: '3', title: "Warehouse Shift Lead", company_name: "Delhivery", location: "Gurugram", employment_type: "Full-time", salary_range: "₹3.5–5L", category: "Logistics", created_at: "5h ago" },
  { id: '4', title: "Store Manager", company_name: "Reliance Retail", location: "Jaipur", employment_type: "Full-time", salary_range: "₹4–6.5L", category: "Retail", created_at: "3d ago" },
  { id: '5', title: "CNC Machine Operator", company_name: "Tata Autocomp", location: "Pune", employment_type: "Full-time", salary_range: "₹2.8–4L", category: "Manufacturing", created_at: "6h ago" },
  { id: '6', title: "Front Office Executive", company_name: "Taj Hotels", location: "Mumbai", employment_type: "Full-time", salary_range: "₹3–4.5L", category: "Hospitality", created_at: "1d ago" },
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
/*  Helpers / small hooks                                              */
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
/*  Flap board (signature element)                                     */
/* ------------------------------------------------------------------ */
function FlapRow({ row, pal }: { row: number, pal: any }) {
  const [idx, setIdx] = useState(row);
  const [flipKey, setFlipKey] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setIdx((row + Math.floor(Math.random() * 3)) % BOARD_ROWS.length);
      setFlipKey((k) => k + 1);
    }, 2600 + row * 400);
    return () => clearInterval(t);
  }, [row]);
  const [title, company, loc] = BOARD_ROWS[idx];
  return (
    <div className="flap-row" style={{ borderColor: "#2A2D5C" }}>
      <div key={flipKey} className="flap-content">
        <span className="flap-title">{title}</span>
        <span className="flap-meta">{company} · {loc}</span>
      </div>
      <span className="flap-dot" />
    </div>
  );
}

function LiveBoard({ pal }: { pal: any }) {
  return (
    <div className="board" style={{ background: pal.boardBg }}>
      <div className="board-head">
        <span className="board-head-label">
          <span className="live-dot" /> LIVE BOARD
        </span>
        <span className="board-head-time">NOW HIRING</span>
      </div>
      <div className="board-body">
        {[0, 1, 2, 3, 4].map((i) => (
          <FlapRow key={i} row={i} pal={pal} />
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

        /* Flap board */
        .board {
          border-radius: 20px;
          padding: 18px;
          box-shadow: 0 30px 60px -20px rgba(16,18,53,0.45);
          border: 1px solid #2A2D5C;
        }
        .board-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 8px 14px 8px;
          border-bottom: 1px solid #2A2D5C;
          margin-bottom: 10px;
        }
        .board-head-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          color: #F3F2EC;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
        }
        .board-head-time {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          color: ${BRAND.amber};
          font-weight: 600;
        }
        .live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: ${BRAND.teal};
          box-shadow: 0 0 0 0 rgba(20,184,166,0.7);
          animation: pulse-dot 1.8s infinite;
        }
        @keyframes pulse-dot {
          0% { box-shadow: 0 0 0 0 rgba(20,184,166,0.55); }
          70% { box-shadow: 0 0 0 7px rgba(20,184,166,0); }
          100% { box-shadow: 0 0 0 0 rgba(20,184,166,0); }
        }
        .flap-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 8px;
          border-bottom: 1px solid #21244a;
          overflow: hidden;
          height: 46px;
        }
        .flap-row:last-child { border-bottom: none; }
        .flap-content {
          display: flex;
          flex-direction: column;
          gap: 3px;
          animation: flap-in 0.5s cubic-bezier(.2,.8,.2,1);
          transform-origin: top center;
        }
        @keyframes flap-in {
          0% { transform: rotateX(90deg); opacity: 0; }
          60% { transform: rotateX(0deg); opacity: 1; }
          100% { transform: rotateX(0deg); opacity: 1; }
        }
        .flap-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          font-weight: 600;
          color: #F3F2EC;
          letter-spacing: 0.01em;
        }
        .flap-meta {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          color: #8E92BB;
        }
        .flap-dot { width: 5px; height: 5px; border-radius: 50%; background: ${BRAND.amber}; flex-shrink: 0; }

        /* Cards */
        .job-card {
          transition: transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s ease, border-color 0.35s ease;
        }
        .job-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 48px -20px rgba(16,18,53,0.25);
          border-color: ${BRAND.teal};
        }
        .industry-card {
          transition: transform 0.3s cubic-bezier(.22,1,.36,1), border-color 0.3s ease, background 0.3s ease;
        }
        .industry-card:hover {
          transform: translateY(-4px);
          border-color: ${BRAND.amber};
        }
        .icon-wrap { transition: transform 0.35s cubic-bezier(.22,1,.36,1), background 0.35s ease; }
        .industry-card:hover .icon-wrap { transform: scale(1.08) rotate(-4deg); }

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
              { label: "How it Works", href: "#how-it-works" },
              { label: "Testimonials", href: "#testimonials" },
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
              { label: "How it Works", href: "#how-it-works" },
              { label: "Testimonials", href: "#testimonials" },
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

      {/* ---------------- HERO ---------------- */}
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
                Trusted by 3,500+ top companies
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
                The modern job portal connecting talent with opportunity. Search thousands of jobs, track applications, and get hired — all in one place.
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
                    placeholder="Job title or keyword" 
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
            <div className="float-slow">
              <LiveBoard pal={pal} />
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
          Trusted by leading companies worldwide
        </p>
        <div style={{ maskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)" }}>
          <div className="marquee-track">
            {[...Array(2)].map((_, dup) => (
              <div key={dup} style={{ display: "flex", gap: 64, paddingRight: 64 }}>
                {trustedCompanies.map((c) => (
                  <span key={c.name} className="disp" style={{ fontSize: 20, fontWeight: 700, color: pal.textMuted, whiteSpace: "nowrap", opacity: 0.75 }}>
                    {c.name}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FEATURED JOBS ---------------- */}
      <section id="featured" className="container" style={{ padding: "96px 24px 20px" }}>
        <Reveal>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 40 }}>
            <div>
              <span className="mono" style={{ fontSize: 12, color: BRAND.teal, fontWeight: 600, letterSpacing: "0.1em" }}>FEATURED JOBS</span>
              <h2 className="disp" style={{ fontSize: "clamp(26px, 3.4vw, 36px)", fontWeight: 800, marginTop: 8, letterSpacing: "-0.01em" }}>
                Hand-picked opportunities
              </h2>
            </div>
            <Link href="/jobs" style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 14, color: BRAND.indigo, textDecoration: "none" }}>
              View all jobs <ArrowRight size={15} />
            </Link>
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
                    {j.category || j.tag}
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
                  <Link href={`/jobs/${j.id || ''}`} style={{ fontSize: 13, fontWeight: 700, color: BRAND.teal, textDecoration: "none" }}>Apply →</Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <style>{`@media (max-width: 900px) { .jobs-grid { grid-template-columns: 1fr 1fr !important; } } @media (max-width: 620px) { .jobs-grid { grid-template-columns: 1fr !important; } }`}</style>
      </section>

      {/* ---------------- INDUSTRIES ---------------- */}
      <section id="industries" className="container" style={{ padding: "96px 24px 20px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="mono" style={{ fontSize: 12, color: BRAND.teal, fontWeight: 600, letterSpacing: "0.1em" }}>EXPLORE BY INDUSTRY</span>
            <h2 className="disp" style={{ fontSize: "clamp(26px, 3.4vw, 36px)", fontWeight: 800, marginTop: 8 }}>
              Find opportunities that match your passion
            </h2>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="industries-grid">
          {topIndustries.slice(0, 8).map((ind, i) => {
            const Icon = iconMap[ind.icon] || Laptop2;
            return (
              <Reveal key={ind.name} delay={i * 50}>
                <div
                  className="industry-card"
                  style={{ border: `1px solid ${pal.border}`, borderRadius: 16, padding: 22, background: pal.surface, cursor: "pointer" }}
                >
                  <div
                    className="icon-wrap"
                    style={{ width: 42, height: 42, borderRadius: 11, background: `${BRAND.indigo}17`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}
                  >
                    <Icon size={19} color={BRAND.indigo} />
                  </div>
                  <h3 className="disp" style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 4 }}>{ind.name}</h3>
                  <p className="mono" style={{ fontSize: 12.5, color: pal.textMuted }}>{ind.jobs} jobs</p>
                </div>
              </Reveal>
            );
          })}
        </div>
        <style>{`@media (max-width: 900px) { .industries-grid { grid-template-columns: 1fr 1fr !important; } }`}</style>
      </section>

      {/* ---------------- LOCATIONS ---------------- */}
      <section className="container" style={{ padding: "96px 24px 20px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="mono" style={{ fontSize: 12, color: BRAND.teal, fontWeight: 600, letterSpacing: "0.1em" }}>POPULAR LOCATIONS</span>
            <h2 className="disp" style={{ fontSize: "clamp(26px, 3.4vw, 36px)", fontWeight: 800, marginTop: 8 }}>
              Discover jobs in top cities across India
            </h2>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }} className="locations-grid">
          {popularLocations.slice(0, 8).map((loc, i) => (
            <Reveal key={loc.name} delay={i * 40}>
              <div
                className="chip-hover"
                style={{
                  border: `1px solid ${pal.border}`, borderRadius: 14, padding: "16px 18px", background: pal.surface,
                  display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <MapPin size={15} color={BRAND.amberDeep} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{loc.name}</span>
                </div>
                <span className="mono" style={{ fontSize: 11.5, color: pal.textMuted }}>{loc.jobs.toLocaleString("en-IN")}</span>
              </div>
            </Reveal>
          ))}
        </div>
        <style>{`@media (max-width: 760px) { .locations-grid { grid-template-columns: 1fr 1fr !important; } }`}</style>
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
              Loved by workers &amp; recruiters
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
            Join millions of workers and recruiters on SCN Jobs. It's free to get started.
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
              { h: "For Workers", items: ["Browse Jobs", "Create Profile", "Login", "Career Resources"] },
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
