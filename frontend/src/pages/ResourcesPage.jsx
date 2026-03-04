import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { useTheme } from "../context/ThemeContext";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const categories = [
  { icon: "💻", label: "CS & Programming", count: "3,400 notes", color: "#10b981" },
  { icon: "📐", label: "Mathematics", count: "2,100 notes", color: "#2dd4bf" },
  { icon: "⚗️", label: "Chemistry", count: "1,800 notes", color: "#a78bfa" },
  { icon: "📡", label: "Electronics", count: "1,550 notes", color: "#f59e0b" },
  { icon: "🧬", label: "Biology", count: "2,200 notes", color: "#10b981" },
  { icon: "📊", label: "Statistics", count: "980 notes", color: "#2dd4bf" },
  { icon: "🏗️", label: "Civil Engineering", count: "1,320 notes", color: "#a78bfa" },
  { icon: "📚", label: "English & Lit.", count: "770 notes", color: "#f59e0b" },
];

const features = [
  {
    icon: "🤖",
    title: "AI-Powered Summaries",
    desc: "Upload a long PDF and get a clean, structured summary in seconds. Focus your revision on what actually matters.",
  },
  {
    icon: "🔖",
    title: "Bookmarks & Collections",
    desc: "Save notes from any subject into personal collections. Build your perfect revision pack without downloading files.",
  },
  {
    icon: "⬆️",
    title: "One-click Upload",
    desc: "Drag and drop PDFs, images, or Word documents. We handle formatting — your notes land neatly in the right category.",
  },
  {
    icon: "🧩",
    title: "Version History",
    desc: "Every edit is tracked. Revisit older versions of a note, see what changed, and restore any snapshot instantly.",
  },
  {
    icon: "💬",
    title: "Inline Comments",
    desc: "Highlight any paragraph and leave a comment. Great for study groups reviewing each other's notes before exams.",
  },
  {
    icon: "🔍",
    title: "Full-text Search",
    desc: "Search inside every document by keyword, module code, or topic. Find what you need in under a second.",
  },
];

const recentNotes = [
  { title: "Data Structures — Lecture 7 (Trees & Heaps)", subject: "CS2201", by: "Dulan S.", views: "1.2k", rating: 4.9 },
  { title: "Thermodynamics Formula Sheet — Final Exam", subject: "ME3102", by: "Kavya R.", views: "890", rating: 4.8 },
  { title: "Organic Chemistry Mechanisms — Complete Guide", subject: "CH2050", by: "Nimali W.", views: "2.1k", rating: 5.0 },
  { title: "Linear Algebra — Eigenvalues Explained", subject: "MA1013", by: "Tharaka P.", views: "756", rating: 4.7 },
];

export default function ResourcesPage() {
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
      gsap.fromTo("[data-cat-card]",
        { y: 28, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.65, stagger: 0.07, ease: "power3.out",
          scrollTrigger: { trigger: ".cat-grid", start: "top 85%", once: true } });
      gsap.fromTo("[data-note-row]",
        { x: -20, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1, ease: "power3.out",
          scrollTrigger: { trigger: ".notes-list", start: "top 85%", once: true } });
      gsap.fromTo("[data-feat]",
        { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.65, stagger: 0.08, ease: "power3.out",
          scrollTrigger: { trigger: ".feats-grid", start: "top 85%", once: true } });
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
            <Link to="/resources" style={{ ...S.navItem, ...S.navItemActive }}>Resources</Link>
            <Link to="/tutors" style={S.navItem}>Tutors</Link>
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
        <p style={S.tag}>✦ &nbsp;Resources</p>
        <h1 style={S.heroTitle}>
          Every note you need,<br />
          <span style={S.grad}>right when you need it.</span>
        </h1>
        <p style={S.heroSub}>
          Thousands of student-uploaded notes, past papers, and reference sheets — organised by subject, rated by your peers, and searchable in an instant.
        </p>
        <div style={S.heroBtns}>
          <Link to="/register" style={S.btnPrimary}>Browse Resources →</Link>
          <Link to="/login" style={S.btnGhost}>Sign in to upload</Link>
        </div>
        <div style={S.heroPills}>
          <span style={S.pill}>24,000+ Notes</span>
          <span style={S.pill}>400+ Modules</span>
          <span style={S.pill}>AI Summaries</span>
          <span style={S.pill}>Peer Rated</span>
        </div>
      </section>

      {/* Categories */}
      <section style={S.section}>
        <div style={S.inner}>
          <p style={S.sectionLabel}>Browse by subject</p>
          <h2 style={S.sectionTitle}>Whatever your course, we've got you covered.</h2>
          <div className="cat-grid" style={S.catGrid}>
            {categories.map((c) => (
              <Link key={c.label} to="/register" data-cat-card className="cat-card" style={{ ...S.catCard, "--cc": c.color }}>
                <span style={S.catIcon}>{c.icon}</span>
                <span style={S.catLabel}>{c.label}</span>
                <span style={{ ...S.catCount, color: c.color }}>{c.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent uploads */}
      <section style={{ ...S.section, background: "rgba(16,185,129,0.02)", borderTop: `1px solid ${V.border}`, borderBottom: `1px solid ${V.border}` }}>
        <div style={S.inner}>
          <p style={S.sectionLabel}>Trending this week</p>
          <h2 style={S.sectionTitle}>Top-rated notes from your peers.</h2>
          <div className="notes-list" style={S.notesList}>
            {recentNotes.map((n) => (
              <div key={n.title} data-note-row className="note-row" style={S.noteRow}>
                <div style={S.noteLeft}>
                  <span style={S.noteSubject}>{n.subject}</span>
                  <h3 style={S.noteTitle}>{n.title}</h3>
                  <span style={S.noteMeta}>by {n.by} · {n.views} views</span>
                </div>
                <div style={S.noteRight}>
                  <span style={S.noteRating}>⭐ {n.rating}</span>
                  <Link to="/register" style={S.noteBtn}>View →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={S.section}>
        <div style={S.inner}>
          <p style={S.sectionLabel}>What makes it different</p>
          <h2 style={S.sectionTitle}>Not just a file dump. A smart library.</h2>
          <div className="feats-grid" style={S.featsGrid}>
            {features.map((f) => (
              <div key={f.title} data-feat style={S.featCard}>
                <div style={S.featIcon}>{f.icon}</div>
                <h3 style={S.featTitle}>{f.title}</h3>
                <p style={S.featDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={S.ctaSection}>
        <div style={S.ctaBox}>
          <h2 style={S.ctaTitle}>Start building your resource library today.</h2>
          <p style={S.ctaSub}>Join for free. Upload your first note and help a classmate — and they'll return the favour.</p>
          <Link to="/register" style={S.btnPrimary}>Create Free Account →</Link>
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
  tag: { display: "inline-block", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: V.green, background: "rgba(16,185,129,0.1)", border: `1px solid rgba(16,185,129,0.3)`, padding: "0.4rem 1.2rem", borderRadius: 40, marginBottom: "1.75rem" },
  heroTitle: { fontSize: "clamp(2.4rem,6vw,4.5rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "1.25rem" },
  grad: { background: `linear-gradient(135deg,${V.cyan},${V.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" },
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
  catGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "1rem" },
  catCard: { display: "flex", flexDirection: "column", gap: "0.5rem", background: V.card, border: `1px solid ${V.border}`, borderRadius: 18, padding: "1.5rem", textDecoration: "none", color: V.textPrimary, backdropFilter: "blur(10px)", transition: "border-color 0.25s, transform 0.25s, box-shadow 0.25s" },
  catIcon: { fontSize: "2rem" },
  catLabel: { fontSize: "1rem", fontWeight: 600, color: V.textPrimary },
  catCount: { fontSize: "0.82rem", fontWeight: 500 },
  notesList: { display: "flex", flexDirection: "column", gap: "0.85rem" },
  noteRow: { display: "flex", alignItems: "center", justifyContent: "space-between", background: V.card, border: `1px solid ${V.border}`, borderRadius: 16, padding: "1.25rem 1.5rem", backdropFilter: "blur(10px)", gap: "1rem", flexWrap: "wrap", transition: "border-color 0.25s, transform 0.25s" },
  noteLeft: { display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1 },
  noteSubject: { fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", color: V.green, textTransform: "uppercase" },
  noteTitle: { fontSize: "1rem", fontWeight: 600, color: V.textPrimary, lineHeight: 1.35 },
  noteMeta: { fontSize: "0.8rem", color: V.textMuted },
  noteRight: { display: "flex", alignItems: "center", gap: "1.25rem" },
  noteRating: { fontSize: "0.9rem", color: "#f59e0b", fontWeight: 600 },
  noteBtn: { fontSize: "0.88rem", fontWeight: 600, color: V.green, textDecoration: "none", whiteSpace: "nowrap" },
  featsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1.25rem" },
  featCard: { background: V.card, border: `1px solid ${V.border}`, borderRadius: 20, padding: "1.75rem", backdropFilter: "blur(10px)" },
  featIcon: { fontSize: "1.75rem", marginBottom: "1rem" },
  featTitle: { fontSize: "1.05rem", fontWeight: 700, color: V.textPrimary, marginBottom: "0.5rem" },
  featDesc: { fontSize: "0.9rem", color: V.textSec, lineHeight: 1.65 },
  ctaSection: { padding: "4rem clamp(1.5rem,5vw,4rem) 8rem" },
  ctaBox: { maxWidth: 700, margin: "0 auto", textAlign: "center", background: "linear-gradient(135deg,rgba(45,212,191,0.08),rgba(167,139,250,0.06))", border: `1px solid rgba(45,212,191,0.2)`, borderRadius: 28, padding: "4rem 3rem" },
  ctaTitle: { fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "1rem" },
  ctaSub: { color: V.textSec, fontSize: "1.05rem", marginBottom: "2rem", lineHeight: 1.6 },
});

const css = `
  .page-nav-center a:hover { color: #f8fafc !important; background: rgba(255,255,255,0.1); }
  .cat-card:hover { border-color: var(--cc, #10b981) !important; transform: translateY(-4px); box-shadow: 0 16px 28px rgba(0,0,0,0.3) !important; }
  .note-row:hover { border-color: rgba(16,185,129,0.4) !important; transform: translateY(-2px); }
  @media (max-width: 920px) {
    .page-nav-center { display: none !important; }
  }
`;
