import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { useTheme } from "../context/ThemeContext";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const communities = [
  { icon: "💻", name: "CS & Software Engineering", members: "4,200+", posts: "12k", tag: "Computer Science" },
  { icon: "⚡", name: "Electrical & Electronics", members: "2,800+", posts: "8.4k", tag: "Engineering" },
  { icon: "🧬", name: "Biology & Life Sciences", members: "3,100+", posts: "9.7k", tag: "Science" },
  { icon: "📊", name: "Business & Management", members: "5,600+", posts: "15k", tag: "Business" },
  { icon: "⚗️", name: "Chemistry & Materials", members: "1,900+", posts: "5.2k", tag: "Science" },
  { icon: "🏗️", name: "Civil & Structural Eng.", members: "2,200+", posts: "6.8k", tag: "Engineering" },
];

const benefits = [
  { icon: "🤝", title: "Peer-to-Peer Learning", desc: "Connect with students who have already aced the modules you're tackling. Get targeted help, not generic answers." },
  { icon: "📌", title: "Topic-focused Channels", desc: "Each community has dedicated threads for assignments, exams, projects, and general discussion — organized, never chaotic." },
  { icon: "📆", title: "Shared Calendars", desc: "Sync community deadlines, exam dates, and events to your personal timetable with one click." },
  { icon: "🔒", title: "Private Subgroups", desc: "Spin up private sub-spaces just for your batch, tutorial group, or project team. Fully controlled access." },
  { icon: "🔔", title: "Smart Notifications", desc: "Never miss an important update. Set notification rules per community so your feed only shows what matters to you." },
  { icon: "🏆", title: "Contributor Rankings", desc: "Earn reputation by helping peers. Top contributors get highlighted, fostering a culture of quality over noise." },
];

export default function CommunityPage() {
  const rootRef = useRef(null);
  const profileMenuRef = useRef(null);
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const V = makeV(isDark);
  const styles = makeS(V);
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
      gsap.from("[data-page-hero]", { y: 50, opacity: 0, duration: 0.9, ease: "power3.out", delay: 0.1 });
      gsap.fromTo("[data-comm-card]",
        { y: 30, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08, ease: "power3.out",
          scrollTrigger: { trigger: ".comm-grid", start: "top 85%", once: true } });
      gsap.fromTo("[data-benefit]",
        { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.09, ease: "power3.out",
          scrollTrigger: { trigger: ".benefits-grid", start: "top 85%", once: true } });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} style={styles.page}>
      <style>{pageCSS}</style>

      <nav style={styles.navWrap}>
        <div style={styles.navInner}>
          <Link to="/" style={styles.navBrand}>Smart Campus Companion</Link>
          <div style={styles.navCenter} className="page-nav-center">
            <Link to="/" style={styles.navItem}>Home</Link>
            <Link to="/community" style={{ ...styles.navItem, ...styles.navItemActive }}>Community</Link>
            <Link to="/resources" style={styles.navItem}>Resources</Link>
            <Link to="/tutors" style={styles.navItem}>Tutors</Link>
          </div>
          <div style={styles.navRight}>
            {isAuthenticated ? (
              <div style={{ position: "relative" }} ref={profileMenuRef}>
                <button onClick={() => setProfileOpen((v) => !v)} style={styles.navAvatar}>
                  {user?.profilePicture
                    ? <img src={user.profilePicture} alt={user.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                    : (user?.name?.[0] || "U")}
                </button>
                {profileOpen && (
                  <div style={styles.navDropdown}>
                    <div style={styles.navDropdownHeader}>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: V.textPrimary }}>{user?.name || "User"}</div>
                      <div style={{ fontSize: "0.78rem", color: V.textMuted }}>{user?.email || ""}</div>
                    </div>
                    <Link to="/dashboard" style={styles.navDropdownItem} onClick={() => setProfileOpen(false)}>🏠 Dashboard</Link>
                    <Link to="/notes" style={styles.navDropdownItem} onClick={() => setProfileOpen(false)}>📝 My Notes</Link>
                    <Link to="/groups" style={styles.navDropdownItem} onClick={() => setProfileOpen(false)}>👥 My Groups</Link>
                    <Link to="/profile" style={styles.navDropdownItem} onClick={() => setProfileOpen(false)}>⚙️ Profile Settings</Link>
                    <button style={styles.navDropdownLogout} onClick={() => { dispatch(logout()); setProfileOpen(false); }}>Sign Out</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" style={styles.navSignIn}>Sign In</Link>
                <Link to="/register" style={styles.navCta}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={styles.hero} data-page-hero>
        <p style={styles.tag}>✦ &nbsp;Community</p>
        <h1 style={styles.heroTitle}>
          Study alone and you go fast.<br />
          <span style={styles.grad}>Study together and you go far.</span>
        </h1>
        <p style={styles.heroSub}>
          Join vibrant academic communities built around your courses. Share knowledge, tackle problems together, and build friendships that last beyond graduation.
        </p>
        <div style={styles.heroBtns}>
          <Link to="/register" style={styles.btnPrimary}>Join the Community →</Link>
          <Link to="/login" style={styles.btnGhost}>I already have access</Link>
        </div>
        <div style={styles.heroPills}>
          <span style={styles.pill}>50,000+ Students</span>
          <span style={styles.pill}>200+ Active Communities</span>
          <span style={styles.pill}>1M+ Messages</span>
        </div>
      </section>

      {/* Communities grid */}
      <section style={styles.section}>
        <div style={styles.inner}>
          <p style={styles.sectionLabel}>Browse communities</p>
          <h2 style={styles.sectionTitle}>Find your people, by subject.</h2>
          <div className="comm-grid" style={styles.commGrid}>
            {communities.map((c) => (
              <article key={c.name} className="comm-card" data-comm-card style={styles.commCard}>
                <div style={styles.commIcon}>{c.icon}</div>
                <div style={styles.commTagBadge}>{c.tag}</div>
                <h3 style={styles.commName}>{c.name}</h3>
                <div style={styles.commMeta}>
                  <span>{c.members} members</span>
                  <span style={{color: "var(--border-col)"}}>·</span>
                  <span>{c.posts} messages</span>
                </div>
                <Link to="/register" style={styles.commJoin}>Join →</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section style={{...styles.section, background: "rgba(16,185,129,0.03)"}}>
        <div style={styles.inner}>
          <p style={styles.sectionLabel}>Why it works</p>
          <h2 style={styles.sectionTitle}>Everything a study community should have.</h2>
          <div className="benefits-grid" style={styles.benefitsGrid}>
            {benefits.map((b) => (
              <div key={b.title} data-benefit style={styles.benefitCard}>
                <div style={styles.benefitIcon}>{b.icon}</div>
                <h3 style={styles.benefitTitle}>{b.title}</h3>
                <p style={styles.benefitDesc}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaBox}>
          <h2 style={styles.ctaTitle}>Your community is waiting for you.</h2>
          <p style={styles.ctaSub}>Sign up free and join the community that matches your courses in under two minutes.</p>
          <Link to="/register" style={styles.btnPrimary}>Get Started Free →</Link>
        </div>
      </section>
    </div>
  );
}

const makeV = (isDark) => ({
  dark: isDark ? "#16243a" : "#eaf1ff",
  card: isDark ? "rgba(31,46,70,0.86)" : "rgba(246,250,255,0.9)",
  surface: isDark ? "#233550" : "#dfe9fb",
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
  page: { background: V.dark, color: V.textPrimary, fontFamily: "'Inter', sans-serif", minHeight: "100vh", paddingTop: 0 },
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
  grad: { background: `linear-gradient(135deg, ${V.cyan}, ${V.green})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" },
  heroSub: { fontSize: "clamp(1rem,1.5vw,1.2rem)", color: V.textSec, maxWidth: 600, margin: "0 auto 2.5rem", lineHeight: 1.7 },
  heroBtns: { display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "2rem" },
  btnPrimary: { display: "inline-flex", alignItems: "center", height: 48, padding: "0 2rem", background: V.green, color: "#fff", borderRadius: 100, fontWeight: 600, textDecoration: "none", boxShadow: "0 6px 20px -6px rgba(16,185,129,0.65)", fontSize: "1rem", transition: "transform 0.2s, box-shadow 0.2s" },
  btnGhost: { display: "inline-flex", alignItems: "center", height: 48, padding: "0 2rem", color: V.textPrimary, borderRadius: 100, fontWeight: 500, textDecoration: "none", border: `1px solid ${V.border}`, background: "rgba(255,255,255,0.03)", fontSize: "1rem" },
  heroPills: { display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" },
  pill: { fontSize: "0.8rem", fontWeight: 500, color: V.textMuted, background: "rgba(255,255,255,0.04)", border: `1px solid ${V.border}`, padding: "0.3rem 0.9rem", borderRadius: 100 },
  section: { padding: "5rem clamp(1.5rem,5vw,4rem)" },
  inner: { maxWidth: 1280, margin: "0 auto" },
  sectionLabel: { fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: V.green, marginBottom: "0.75rem" },
  sectionTitle: { fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 700, lineHeight: 1.2, maxWidth: 680, marginBottom: "3rem" },
  commGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" },
  commCard: { background: V.card, border: `1px solid ${V.border}`, borderRadius: 20, padding: "1.75rem", backdropFilter: "blur(10px)", transition: "border-color 0.25s, transform 0.25s, box-shadow 0.25s", cursor: "pointer" },
  commIcon: { fontSize: "2rem", marginBottom: "0.75rem" },
  commTagBadge: { display: "inline-block", fontSize: "0.7rem", fontWeight: 600, color: V.green, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", padding: "0.2rem 0.7rem", borderRadius: 100, marginBottom: "0.75rem" },
  commName: { fontSize: "1.1rem", fontWeight: 700, color: V.textPrimary, marginBottom: "0.5rem", lineHeight: 1.3 },
  commMeta: { fontSize: "0.82rem", color: V.textMuted, display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1.25rem" },
  commJoin: { display: "inline-flex", alignItems: "center", fontSize: "0.88rem", fontWeight: 600, color: V.green, textDecoration: "none", gap: "0.25rem", transition: "gap 0.2s" },
  benefitsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" },
  benefitCard: { background: V.card, border: `1px solid ${V.border}`, borderRadius: 20, padding: "1.75rem", backdropFilter: "blur(10px)" },
  benefitIcon: { fontSize: "1.75rem", marginBottom: "1rem" },
  benefitTitle: { fontSize: "1.05rem", fontWeight: 700, color: V.textPrimary, marginBottom: "0.5rem" },
  benefitDesc: { fontSize: "0.9rem", color: V.textSec, lineHeight: 1.65 },
  ctaSection: { padding: "4rem clamp(1.5rem,5vw,4rem) 8rem" },
  ctaBox: { maxWidth: 700, margin: "0 auto", textAlign: "center", background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(45,212,191,0.06))", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 28, padding: "4rem 3rem" },
  ctaTitle: { fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "1rem" },
  ctaSub: { color: V.textSec, fontSize: "1.05rem", marginBottom: "2rem", lineHeight: 1.6 },
  "border-col": V.border,
});

const pageCSS = `
  .page-nav-center a:hover { color: #f8fafc !important; background: rgba(255,255,255,0.1); }
  .comm-card:hover { border-color: #10b981 !important; transform: translateY(-4px); box-shadow: 0 18px 32px rgba(0,0,0,0.3), 0 0 20px rgba(16,185,129,0.15) !important; }
  .comm-card:hover .comm-join { gap: 0.5rem; }
  @media (max-width: 920px) {
    .page-nav-center { display: none !important; }
  }
`;
