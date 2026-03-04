import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { useTheme } from "../context/ThemeContext";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const tutors = [
  { initials: "NK", name: "Nuwan Kirindegoda", subject: "Data Structures & Algorithms", year: "4th Year · CS", rating: 4.9, sessions: 62, tags: ["Algorithms", "Python", "LeetCode"] },
  { initials: "SP", name: "Shalini Perera", subject: "Calculus & Linear Algebra", year: "3rd Year · Maths", rating: 5.0, sessions: 48, tags: ["Calculus", "Matrices", "Integration"] },
  { initials: "RF", name: "Ruchira Fernando", subject: "Organic Chemistry", year: "4th Year · Chemistry", rating: 4.8, sessions: 37, tags: ["Mechanisms", "Reactions", "NMR"] },
  { initials: "TJ", name: "Tharushi Jayasinghe", subject: "Circuit Analysis & Electronics", year: "3rd Year · EEE", rating: 4.9, sessions: 55, tags: ["Circuits", "Ohm's Law", "Op-Amps"] },
  { initials: "MF", name: "Mihiran Fernando", subject: "Business Statistics", year: "2nd Year · Business", rating: 4.7, sessions: 29, tags: ["SPSS", "Regression", "Hypothesis"] },
  { initials: "AR", name: "Ayesha Ratnayake", subject: "Clinical Pharmacy", year: "4th Year · Pharmacy", rating: 4.9, sessions: 41, tags: ["Pharmacology", "Dosing", "OSCE"] },
];

const howItWorks = [
  { n: "01", title: "Post your request", desc: "Describe the topic you're stuck on, your available times, and whether you prefer online or in-person. Takes 60 seconds." },
  { n: "02", title: "Match with a tutor", desc: "Peer tutors who've excelled in your subject reach out. Review their ratings and pick the one that fits best." },
  { n: "03", title: "Book a Kuppi session", desc: "Confirm the slot in your shared calendar. You'll both get a reminder — no no-shows, no confusion." },
  { n: "04", title: "Learn, review, repeat", desc: "After the session rate your tutor, leave feedback, and build a personalised network of go-to explainers." },
];

const perks = [
  { icon: "🎯", title: "Subject-matched", desc: "We only show tutors who have passed or are currently excelling in the exact module you need help with." },
  { icon: "📹", title: "Online or In-person", desc: "Your choice. Tutors can meet you on campus, at a cafe, or over video call — whatever you're comfortable with." },
  { icon: "💰", title: "Free peer tutoring", desc: "Kuppi sessions are peer-to-peer exchanges. Most are completely free. Tutors volunteer because they genuinely enjoy teaching." },
  { icon: "⭐", title: "Verified ratings", desc: "Every tutor rating comes from a real completed session. Fake reviews are removed automatically." },
  { icon: "🛡️", title: "Safe & Trustworthy", desc: "All tutors are verified university students. Sessions can be flagged or reviewed by moderators if needed." },
  { icon: "📈", title: "Become a tutor yourself", desc: "Once you've mastered a subject, pay it forward. Build your reputation and unlock campus recognition." },
];

const AVATAR_COLORS = [
  "linear-gradient(135deg,#10b981,#2dd4bf)",
  "linear-gradient(135deg,#a78bfa,#818cf8)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#2dd4bf,#0ea5e9)",
  "linear-gradient(135deg,#10b981,#a78bfa)",
  "linear-gradient(135deg,#f472b6,#a78bfa)",
];

export default function TutorsPage() {
  const rootRef = useRef(null);
  const profileMenuRef = useRef(null);
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const V = makeV(isDark);
  const S = makeS(V);
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-hero]", { y: 50, opacity: 0, duration: 0.9, ease: "power3.out", delay: 0.1 });
      gsap.fromTo("[data-tutor-card]",
        { y: 30, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08, ease: "power3.out",
          scrollTrigger: { trigger: ".tutors-grid", start: "top 86%", once: true } });
      gsap.fromTo("[data-step]",
        { x: -24, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.7, stagger: 0.12, ease: "power3.out",
          scrollTrigger: { trigger: ".steps-list", start: "top 86%", once: true } });
      gsap.fromTo("[data-perk]",
        { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.65, stagger: 0.08, ease: "power3.out",
          scrollTrigger: { trigger: ".perks-grid", start: "top 85%", once: true } });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} style={S.page}>
      <style>{css}</style>

      <nav style={S.navWrap}>
        <div style={S.navInner}>
          <Link to="/" style={S.navBrand}>Smart Campus Companion</Link>
          <div style={S.navCenter} className="page-nav-center">
            <Link to="/" style={S.navItem}>Home</Link>
            <Link to="/community" style={S.navItem}>Community</Link>
            <Link to="/resources" style={S.navItem}>Resources</Link>
            <Link to="/tutors" style={{ ...S.navItem, ...S.navItemActive }}>Tutors</Link>
          </div>
          <div style={S.navRight}>
            {isAuthenticated ? (
              <div style={{ position: "relative" }} ref={profileMenuRef}>
                <button onClick={() => setProfileOpen((v) => !v)} style={S.navAvatar}>
                  {user?.profilePicture
                    ? <img src={user.profilePicture} alt={user.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                    : (user?.name?.[0] || "U")}
                </button>
                {profileOpen && (
                  <div style={S.navDropdown}>
                    <div style={S.navDropdownHeader}>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: V.textPrimary }}>{user?.name || "User"}</div>
                      <div style={{ fontSize: "0.78rem", color: V.textMuted }}>{user?.email || ""}</div>
                    </div>
                    <Link to="/dashboard" style={S.navDropdownItem} onClick={() => setProfileOpen(false)}>🏠 Dashboard</Link>
                    <Link to="/notes" style={S.navDropdownItem} onClick={() => setProfileOpen(false)}>📝 My Notes</Link>
                    <Link to="/groups" style={S.navDropdownItem} onClick={() => setProfileOpen(false)}>👥 My Groups</Link>
                    <Link to="/profile" style={S.navDropdownItem} onClick={() => setProfileOpen(false)}>⚙️ Profile Settings</Link>
                    <button style={S.navDropdownLogout} onClick={() => { dispatch(logout()); setProfileOpen(false); }}>Sign Out</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" style={S.navSignIn}>Sign In</Link>
                <Link to="/register" style={S.navCta}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={S.hero} data-hero>
        <p style={S.tag}>✦ &nbsp;Kuppi — Peer Tutoring</p>
        <h1 style={S.heroTitle}>
          Stuck on a topic?<br />
          <span style={S.grad}>A senior who aced it is waiting.</span>
        </h1>
        <p style={S.heroSub}>
          Kuppi connects you with peer tutors who've mastered the exact module you're struggling with. Real students, real explanations, real results.
        </p>
        <div style={S.heroBtns}>
          <Link to="/register" style={S.btnPrimary}>Find a Tutor →</Link>
          <Link to="/register" style={S.btnGhost}>Become a Tutor</Link>
        </div>
        <div style={S.heroPills}>
          <span style={S.pill}>800+ Peer Tutors</span>
          <span style={S.pill}>5,000+ Sessions Completed</span>
          <span style={S.pill}>4.9★ Average Rating</span>
          <span style={S.pill}>Free to Start</span>
        </div>
      </section>

      {/* Tutor cards */}
      <section style={S.section}>
        <div style={S.inner}>
          <p style={S.sectionLabel}>Featured tutors</p>
          <h2 style={S.sectionTitle}>Top-rated peer tutors, this semester.</h2>
          <div className="tutors-grid" style={S.tutorsGrid}>
            {tutors.map((t, i) => (
              <article key={t.name} data-tutor-card className="tutor-card" style={S.tutorCard}>
                <div style={S.tutorHeader}>
                  <div style={{ ...S.avatar, background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                    {t.initials}
                  </div>
                  <div>
                    <div style={S.tutorName}>{t.name}</div>
                    <div style={S.tutorYear}>{t.year}</div>
                  </div>
                  <div style={S.tutorRating}>⭐ {t.rating}</div>
                </div>
                <div style={S.tutorSubject}>{t.subject}</div>
                <div style={S.tutorTags}>
                  {t.tags.map((tag) => (
                    <span key={tag} style={S.tag2}>{tag}</span>
                  ))}
                </div>
                <div style={S.tutorFooter}>
                  <span style={S.tutorSessions}>{t.sessions} sessions</span>
                  <Link to="/register" style={S.bookBtn}>Book Kuppi →</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ ...S.section, background: isDark ? "rgba(16,185,129,0.02)" : "rgba(16,185,129,0.04)", borderTop: `1px solid ${V.border}`, borderBottom: `1px solid ${V.border}` }}>
        <div style={S.inner}>
          <div className="steps-layout-grid">
            <div>
              <p style={S.sectionLabel}>The process</p>
              <h2 style={{ ...S.sectionTitle, marginBottom: "1rem" }}>From stuck to sorted in 4 simple steps.</h2>
              <p style={{ color: V.textSec, fontSize: "1rem", lineHeight: 1.7, maxWidth: 400 }}>
                No middlemen, no agencies. Just two students — one with a question, one with the answer.
              </p>
            </div>
            <div className="steps-list" style={S.stepsList}>
              {howItWorks.map((s, i) => (
                <div key={s.n} data-step style={S.stepItem}>
                  <div style={S.stepLeft}>
                    <div style={S.stepNum}>{s.n}</div>
                    {i < howItWorks.length - 1 && <div style={S.stepLine} />}
                  </div>
                  <div style={S.stepContent}>
                    <h3 style={S.stepTitle}>{s.title}</h3>
                    <p style={S.stepDesc}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section style={S.section}>
        <div style={S.inner}>
          <p style={S.sectionLabel}>Why Kuppi</p>
          <h2 style={S.sectionTitle}>Peer tutoring done right.</h2>
          <div className="perks-grid" style={S.perksGrid}>
            {perks.map((p) => (
              <div key={p.title} data-perk style={S.perkCard}>
                <div style={S.perkIcon}>{p.icon}</div>
                <h3 style={S.perkTitle}>{p.title}</h3>
                <p style={S.perkDesc}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={S.ctaSection}>
        <div style={S.ctaBox}>
          <h2 style={S.ctaTitle}>Stop guessing. Start learning from someone who gets it.</h2>
          <p style={S.ctaSub}>Create a free account and find your first Kuppi session in minutes.</p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/register" style={S.btnPrimary}>Find a Tutor Now →</Link>
            <Link to="/register" style={S.btnGhost}>Offer Tutoring</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const makeV = (isDark) => ({
  dark: isDark ? "#16243a" : "#eaf1ff",
  card: isDark ? "rgba(31,46,70,0.86)" : "rgba(246,250,255,0.9)",
  border: isDark ? "rgba(255,255,255,0.1)" : "rgba(30,41,59,0.14)",
  green: "#10b981",
  cyan: "#2dd4bf",
  purple: "#a78bfa",
  textPrimary: isDark ? "#f8fafc" : "#111827",
  textSec: isDark ? "#cbd5e1" : "#374151",
  textMuted: isDark ? "#94a3b8" : "#6b7280",
  navGlass: isDark ? "rgba(22,36,58,0.82)" : "rgba(234,241,255,0.85)",
  navPill: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.72)",
  navActive: isDark ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.16)",
  navActiveBorder: isDark ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.34)",
});

const makeS = (V) => ({
  page: { background: V.dark, color: V.textPrimary, fontFamily: "'Inter',sans-serif", minHeight: "100vh", paddingTop: 0 },
  navWrap: { position: "fixed", top: 0, left: 0, right: 0, zIndex: 120, backdropFilter: "blur(14px)", background: V.navGlass, borderBottom: `1px solid ${V.border}` },
  navInner: { maxWidth: 1280, margin: "0 auto", padding: "0.85rem clamp(1rem,4vw,2rem)", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "0.75rem" },
  navBrand: { color: V.textPrimary, textDecoration: "none", fontWeight: 800, fontSize: "1.08rem", letterSpacing: "-0.02em", whiteSpace: "nowrap" },
  navCenter: { justifySelf: "center", display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.28rem", borderRadius: 999, border: `1px solid ${V.border}`, background: V.navPill },
  navItem: { color: V.textMuted, textDecoration: "none", fontSize: "0.88rem", fontWeight: 600, padding: "0.52rem 0.88rem", borderRadius: 999, transition: "all 0.2s" },
  navItemActive: { color: V.textPrimary, background: V.navActive, border: `1px solid ${V.navActiveBorder}` },
  navRight: { justifySelf: "end", display: "flex", alignItems: "center", gap: "0.5rem" },
  navSignIn: { color: V.textMuted, textDecoration: "none", fontWeight: 600, fontSize: "0.86rem", padding: "0.52rem 0.8rem", borderRadius: 999 },
  navCta: { color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "0.86rem", padding: "0.58rem 1rem", borderRadius: 999, background: V.green, boxShadow: "0 6px 18px -8px rgba(16,185,129,0.8)" },
  navAvatar: { width: 36, height: 36, borderRadius: "50%", background: V.green, color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1rem", overflow: "hidden", padding: 0 },
  navDropdown: { position: "absolute", top: "calc(100% + 10px)", right: 0, minWidth: 200, background: V.navGlass, backdropFilter: "blur(18px)", border: `1px solid ${V.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,0.25)", zIndex: 200 },
  navDropdownHeader: { padding: "0.85rem 1rem 0.75rem", borderBottom: `1px solid ${V.border}` },
  navDropdownItem: { display: "block", padding: "0.6rem 1rem", color: V.textPrimary, textDecoration: "none", fontSize: "0.86rem", fontWeight: 500 },
  navDropdownLogout: { display: "block", width: "100%", padding: "0.6rem 1rem", color: "#ef4444", background: "none", border: "none", borderTop: `1px solid ${V.border}`, textAlign: "left", cursor: "pointer", fontSize: "0.86rem" },
  hero: { padding: "8rem clamp(1.5rem,5vw,4rem) 6rem", maxWidth: 1280, margin: "0 auto", textAlign: "center" },
  tag: { display: "inline-block", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: V.green, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", padding: "0.4rem 1.2rem", borderRadius: 40, marginBottom: "1.75rem" },
  heroTitle: { fontSize: "clamp(2.4rem,6vw,4.5rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "1.25rem" },
  grad: { background: `linear-gradient(135deg,${V.green},${V.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" },
  heroSub: { fontSize: "clamp(1rem,1.5vw,1.2rem)", color: V.textSec, maxWidth: 600, margin: "0 auto 2.5rem", lineHeight: 1.7 },
  heroBtns: { display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "2rem" },
  btnPrimary: { display: "inline-flex", alignItems: "center", height: 48, padding: "0 2rem", background: V.green, color: "#fff", borderRadius: 100, fontWeight: 600, textDecoration: "none", boxShadow: "0 6px 20px -6px rgba(16,185,129,0.65)", fontSize: "1rem" },
  btnGhost: { display: "inline-flex", alignItems: "center", height: 48, padding: "0 2rem", color: V.textPrimary, border: `1px solid ${V.border}`, borderRadius: 100, fontWeight: 500, textDecoration: "none", background: "rgba(255,255,255,0.03)", fontSize: "1rem" },
  heroPills: { display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" },
  pill: { fontSize: "0.8rem", fontWeight: 500, color: V.textMuted, background: "rgba(255,255,255,0.04)", border: `1px solid ${V.border}`, padding: "0.3rem 0.9rem", borderRadius: 100 },
  section: { padding: "5rem clamp(1.5rem,5vw,4rem)" },
  inner: { maxWidth: 1280, margin: "0 auto" },
  sectionLabel: { fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: V.green, marginBottom: "0.75rem" },
  sectionTitle: { fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 700, lineHeight: 1.2, maxWidth: 680, marginBottom: "3rem" },
  tutorsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "1.25rem" },
  tutorCard: { background: V.card, border: `1px solid ${V.border}`, borderRadius: 22, padding: "1.75rem", backdropFilter: "blur(10px)", display: "flex", flexDirection: "column", gap: "1rem", transition: "border-color 0.25s, transform 0.25s, box-shadow 0.25s" },
  tutorHeader: { display: "flex", alignItems: "center", gap: "0.85rem" },
  avatar: { width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1rem", color: "#fff", flexShrink: 0 },
  tutorName: { fontWeight: 700, fontSize: "0.98rem", color: V.textPrimary, lineHeight: 1.3 },
  tutorYear: { fontSize: "0.78rem", color: V.textMuted },
  tutorRating: { marginLeft: "auto", fontSize: "0.88rem", fontWeight: 600, color: "#f59e0b", whiteSpace: "nowrap" },
  tutorSubject: { fontSize: "0.92rem", fontWeight: 600, color: V.green },
  tutorTags: { display: "flex", flexWrap: "wrap", gap: "0.4rem" },
  tag2: { fontSize: "0.72rem", fontWeight: 500, color: V.textMuted, background: "rgba(255,255,255,0.05)", border: `1px solid ${V.border}`, padding: "0.2rem 0.6rem", borderRadius: 100 },
  tutorFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "0.5rem", borderTop: `1px solid ${V.border}` },
  tutorSessions: { fontSize: "0.8rem", color: V.textMuted },
  bookBtn: { fontSize: "0.88rem", fontWeight: 600, color: V.green, textDecoration: "none" },
  stepsLayout: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "start" },
  stepsList: { display: "flex", flexDirection: "column", gap: 0 },
  stepItem: { display: "flex", gap: "1.25rem", paddingBottom: "2rem" },
  stepLeft: { display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 },
  stepNum: { width: 44, height: 44, borderRadius: "50%", background: "rgba(16,185,129,0.08)", border: `1px solid ${V.green}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem", color: V.green, flexShrink: 0 },
  stepLine: { width: 2, flex: 1, background: "rgba(16,185,129,0.15)", marginTop: 4, marginBottom: 0 },
  stepContent: { paddingTop: "0.5rem", paddingBottom: "0.5rem" },
  stepTitle: { fontSize: "1.05rem", fontWeight: 700, color: V.textPrimary, marginBottom: "0.4rem" },
  stepDesc: { fontSize: "0.9rem", color: V.textSec, lineHeight: 1.65 },
  perksGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1.25rem" },
  perkCard: { background: V.card, border: `1px solid ${V.border}`, borderRadius: 20, padding: "1.75rem", backdropFilter: "blur(10px)" },
  perkIcon: { fontSize: "1.75rem", marginBottom: "0.75rem" },
  perkTitle: { fontSize: "1.05rem", fontWeight: 700, color: V.textPrimary, marginBottom: "0.5rem" },
  perkDesc: { fontSize: "0.9rem", color: V.textSec, lineHeight: 1.65 },
  ctaSection: { padding: "4rem clamp(1.5rem,5vw,4rem) 8rem" },
  ctaBox: { maxWidth: 740, margin: "0 auto", textAlign: "center", background: "linear-gradient(135deg,rgba(16,185,129,0.1),rgba(167,139,250,0.07))", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 28, padding: "4rem 3rem" },
  ctaTitle: { fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "1rem" },
  ctaSub: { color: V.textSec, fontSize: "1.05rem", marginBottom: "2.5rem", lineHeight: 1.6 },
});

const css = `
  .page-nav-center a:hover { color: #f8fafc !important; background: rgba(255,255,255,0.1); }
  .tutor-card:hover { border-color: #10b981 !important; transform: translateY(-4px); box-shadow: 0 18px 32px rgba(0,0,0,0.3), 0 0 20px rgba(16,185,129,0.12) !important; }
  .steps-layout-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: start; }
  @media (max-width: 920px) {
    .page-nav-center { display: none !important; }
  }
  @media (max-width: 860px) {
    .steps-layout-grid { grid-template-columns: 1fr; gap: 2rem; }
  }
`;
