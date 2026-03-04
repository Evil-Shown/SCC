import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import { useCyberpunkBackground } from "../hooks/useCyberpunkBackground";

gsap.registerPlugin(ScrollTrigger);

// ========== DATA (same) ==========
const stats = [
  { value: "50K+", label: "Active Students" },
  { value: "10K+", label: "Study Groups" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9★", label: "Avg Rating" },
];

const features = [
  { icon: "📝", tag: "Notes", title: "Smart Notes Sharing", desc: "Upload, organize, and share lecture notes with your peers. AI-powered summaries help you study smarter." },
  { icon: "👥", tag: "Groups", title: "Study Groups", desc: "Create or join study groups, collaborate in real-time, and keep everyone on the same page." },
  { icon: "📅", tag: "Schedule", title: "Timetable Manager", desc: "Manage your class schedule, set reminders, and never miss a lecture or deadline again." },
  { icon: "🤖", tag: "AI", title: "AI Study Assistant", desc: "Get instant answers, generate flashcards, and receive personalized study recommendations." },
  { icon: "💬", tag: "Chat", title: "Real-time Messaging", desc: "Chat with classmates, share files, and stay connected with your study groups instantly." },
  { icon: "🎓", tag: "Kuppi", title: "Kuppi Sessions", desc: "Find or host peer tutoring sessions. Learn from the best students in your university." },
];

const steps = [
  { n: "01", title: "Create your account", desc: "Sign up in seconds with your university email. No credit card required." },
  { n: "02", title: "Join or create groups", desc: "Find your course groups or create new ones. Invite classmates to collaborate." },
  { n: "03", title: "Start collaborating", desc: "Share notes, schedule study sessions, chat in real-time, and leverage AI tools." },
  { n: "04", title: "Ace your semester", desc: "Stay organized, study smarter, and achieve the grades you deserve." },
];

const testimonials = [
  {
    quote: "Before SCC, I was juggling WhatsApp, Google Drive, and random docs. Now everything is in one place and my weekly planning takes half the time.",
    name: "Nadeesha Perera",
    role: "2nd Year • Computer Science",
  },
  {
    quote: "The notes and Kuppi flow is super clean. I can quickly find who explained a topic best and revise without wasting hours searching.",
    name: "Tharushi Jayasinghe",
    role: "3rd Year • Engineering",
  },
  {
    quote: "Group coordination improved a lot. We assign tasks, share resources, and stay on track before exams without constant confusion.",
    name: "Mihiran Fernando",
    role: "1st Year • Information Systems",
  },
];

const faqs = [
  {
    q: "Is Smart Campus Companion free for students?",
    a: "Yes. Core features like notes, study groups, timetable planning, and collaboration are free to start.",
  },
  {
    q: "Can I use SCC for multiple courses and groups?",
    a: "Absolutely. You can create separate study groups, organize notes by module, and manage different class schedules in one account.",
  },
  {
    q: "How quickly can I get started?",
    a: "Most students are fully set up in under 10 minutes—create your account, join groups, and start sharing notes right away.",
  },
  {
    q: "Does SCC work well for exam preparation?",
    a: "Yes. Students use SCC to centralize revision notes, track deadlines, schedule focused sessions, and reduce last-minute stress.",
  },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const canvasRef = useRef(null);
  const rootRef = useRef(null);
  const profileMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Initialize enhanced Three.js background (now with green neon)
  const setCanvasMountRef = (node) => {
    canvasRef.current = node;
    setCanvasReady(Boolean(node));
  };
  useCyberpunkBackground(canvasRef, canvasReady);

  // Lenis smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on("scroll", () => ScrollTrigger.update());
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  // Navbar scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-hero-title]", { y: 60, opacity: 0, duration: 1, ease: "power3.out", delay: 0.2 });
      gsap.from("[data-hero-sub]", { y: 40, opacity: 0, duration: 1, ease: "power3.out", delay: 0.4 });
      gsap.from("[data-hero-cta]", { y: 30, opacity: 0, duration: 0.8, stagger: 0.15, delay: 0.6 });
      gsap.from("[data-hero-stats]", { y: 30, opacity: 0, duration: 0.8, stagger: 0.1, delay: 0.8 });
      gsap.fromTo(
        "[data-feat-card]",
        { y: 36, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".features-grid",
            start: "top 86%",
            once: true,
            invalidateOnRefresh: true,
          },
        }
      );
      gsap.fromTo(
        "[data-step-item]",
        { x: -26, autoAlpha: 0 },
        {
          x: 0,
          autoAlpha: 1,
          duration: 0.75,
          stagger: 0.16,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".steps-list",
            start: "top 86%",
            once: true,
            invalidateOnRefresh: true,
          },
        }
      );
      gsap.fromTo(
        "[data-glow-card]",
        { scale: 0.98, autoAlpha: 0 },
        {
          scale: 1,
          autoAlpha: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".glow-card",
            start: "top 88%",
            once: true,
            invalidateOnRefresh: true,
          },
        }
      );
      gsap.fromTo(
        "[data-cta-block]",
        { scale: 0.98, autoAlpha: 0 },
        {
          scale: 1,
          autoAlpha: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".cta-block",
            start: "top 90%",
            once: true,
            invalidateOnRefresh: true,
          },
        }
      );
      gsap.utils.toArray("[data-section-title]").forEach((el) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: "top 85%" },
          y: 40,
          opacity: 0,
          duration: 1,
        });
      });
      ScrollTrigger.refresh();
    }, rootRef);
    return () => ctx.revert();
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <style>{`
        /* ===== REDESIGNED UI WITH GREEN ACCENTS ===== */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        button,
        a {
          -webkit-tap-highlight-color: transparent;
        }

        a,
        a:visited,
        a:hover,
        a:active {
          color: inherit;
          text-decoration: none;
        }

        button:focus,
        a:focus {
          outline: none;
        }

        .home-signin-btn:focus-visible,
        .btn-solid:focus-visible,
        .btn-hero-primary:focus-visible,
        .btn-hero-ghost:focus-visible,
        .glow-card-btn:focus-visible,
        .profile-dropdown a:focus-visible,
        .profile-dropdown button:focus-visible,
        .nav-links .nav-item:focus-visible {
          outline: 2px solid var(--accent-green);
          outline-offset: 2px;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
        }

        :root {
          --bg-dark: #1b2a43;
          --bg-card: rgba(36, 50, 74, 0.8);
          --bg-surface: #253651;
          --border: rgba(255, 255, 255, 0.11);
          --accent-cyan: #2dd4bf;
          --accent-green: #10b981;
          --accent-purple: #a78bfa;
          --text-primary: #ffffff;
          --text-secondary: #e2e8f0;
          --text-muted: #94a3b8;
          --glow-green: 0 0 20px rgba(16, 185, 129, 0.5);
          --glow-cyan: 0 0 20px rgba(45, 212, 191, 0.5);
          --font-main: 'Inter', sans-serif;
        }

        body {
          font-family: var(--font-main);
          background: var(--bg-dark);
          color: var(--text-primary);
          line-height: 1.6;
          overflow-x: hidden;
        }

        .page {
          position: relative;
          min-height: 100vh;
          z-index: 1;
        }

        .bg-canvas {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.96;
          filter: contrast(1.2) saturate(1.2) brightness(1.16);
        }

        .overlay {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background: radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.12) 0%, transparent 58%),
                      radial-gradient(circle at 70% 80%, rgba(45, 212, 191, 0.12) 0%, transparent 58%),
                      linear-gradient(180deg, rgba(27, 42, 67, 0.01) 0%, rgba(27, 42, 67, 0.22) 100%);
        }

        .content {
          position: relative;
          z-index: 10;
        }

        /* ===== NAVIGATION ===== */
        nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 200;
          height: 88px;
          transition: height 0.35s ease, background 0.35s ease, box-shadow 0.35s ease;
        }
        nav.scrolled {
          height: 74px;
          background: rgba(28, 44, 70, 0.86);
          backdrop-filter: blur(20px) saturate(180%);
          box-shadow: 0 1px 0 rgba(255,255,255,0.08), 0 10px 34px rgba(0,0,0,0.42);
        }
        .nav-inner {
          width: 100%;
          max-width: 1480px;
          height: 100%;
          margin: 0 auto;
          padding: 0 clamp(1.5rem, 4vw, 4rem);
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 1rem;
        }

        /* ---- Brand ---- */
        .nav-brand {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: none;
          color: var(--text-primary);
          padding: 0;
          line-height: 1;
        }
        .nav-brand-logo {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--accent-green), var(--accent-cyan));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.05rem;
          font-weight: 900;
          color: #fff;
          flex-shrink: 0;
          box-shadow: 0 10px 28px rgba(16,185,129,0.4), 0 0 20px rgba(45,212,191,0.3);
        }
        .nav-brand-name {
          font-weight: 800;
          font-size: 1.34rem;
          letter-spacing: -0.03em;
          color: var(--text-primary);
          line-height: 1;
        }
        .nav-brand-name span {
          color: var(--accent-green);
        }

        /* ---- Center Links ---- */
        .nav-center {
          display: flex;
          align-items: center;
          gap: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 100px;
          padding: 6px;
          backdrop-filter: blur(14px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 8px 26px rgba(0,0,0,0.24);
        }
        .nav-link {
          /* complete reset for both <a> and <button> */
          all: unset;
          cursor: pointer;
          box-sizing: border-box;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 42px;
          padding: 0 1.2rem;
          border-radius: 100px;
          font-size: 0.95rem;
          font-weight: 600;
          line-height: 1;
          color: #b5c4da;
          transition: color 0.2s, background 0.2s;
          white-space: nowrap;
          text-decoration: none;
          -webkit-font-smoothing: antialiased;
        }
        .nav-link:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.14);
        }
        .nav-link.active-link {
          color: var(--text-primary);
          background: linear-gradient(135deg, rgba(16,185,129,0.24), rgba(45,212,191,0.2));
        }

        /* ---- Right side ---- */
        .nav-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.75rem;
        }
        .home-signin-btn {
          all: unset;
          cursor: pointer;
          box-sizing: border-box;
          display: inline-flex;
          align-items: center;
          height: 42px;
          padding: 0 1.25rem;
          font-size: 0.95rem;
          font-weight: 600;
          line-height: 1;
          color: var(--text-muted);
          border-radius: 100px;
          transition: color 0.2s, background 0.2s;
          text-decoration: none;
          white-space: nowrap;
        }
        .home-signin-btn:visited { color: var(--text-muted); }
        .home-signin-btn:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.1);
        }
        .btn-solid {
          all: unset;
          cursor: pointer;
          box-sizing: border-box;
          display: inline-flex;
          align-items: center;
          height: 42px;
          padding: 0 1.4rem;
          font-size: 0.95rem;
          font-weight: 600;
          line-height: 1;
          color: #fff;
          background: var(--accent-green);
          border-radius: 100px;
          text-decoration: none;
          white-space: nowrap;
          box-shadow: 0 8px 22px -6px rgba(16,185,129,0.75);
          transition: background 0.2s, box-shadow 0.2s, transform 0.2s;
        }
        .btn-solid:visited, .btn-solid:active { color: #fff; }
        .btn-solid:hover {
          background: #12c98d;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px -4px rgba(16,185,129,0.85);
          color: #fff;
        }

        /* ---- Hamburger ---- */
        .nav-hamburger {
          all: unset;
          cursor: pointer;
          display: none;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
          width: 34px;
          height: 34px;
          padding: 4px;
        }
        .nav-hamburger span {
          display: block;
          height: 2px;
          background: var(--text-primary);
          border-radius: 2px;
          transition: all 0.3s ease;
          transform-origin: center;
        }
        .nav-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .nav-hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .nav-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* ---- Mobile Drawer ---- */
        .nav-mobile-drawer {
          display: none;
          position: fixed;
          top: 68px;
          left: 0;
          right: 0;
          background: rgba(28, 44, 70, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.11);
          z-index: 199;
          flex-direction: column;
          padding: 1.25rem 1.5rem 1.75rem;
          gap: 0.25rem;
          animation: slideDown 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nav-mobile-drawer.open { display: flex; }
        .nav-drawer-link {
          all: unset;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 1rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          transition: background 0.2s, color 0.2s;
        }
        .nav-drawer-link:hover {
          background: rgba(16,185,129,0.1);
          color: var(--text-primary);
        }
        .nav-drawer-link .drawer-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          flex-shrink: 0;
        }
        .nav-drawer-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 0.75rem 0;
        }
        .nav-drawer-btns {
          display: flex;
          gap: 0.75rem;
          padding-top: 0.5rem;
        }
        .nav-drawer-btns .home-signin-btn,
        .nav-drawer-btns .btn-solid {
          flex: 1;
          justify-content: center;
          height: 46px;
          font-size: 0.95rem;
        }
        .nav-drawer-btns .home-signin-btn {
          border: 1px solid rgba(255,255,255,0.12);
        }

        /* Profile dropdown */
        .profile-wrapper { position: relative; }
        .profile-avatar {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-green));
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 600;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.2s;
        }
        .profile-avatar:hover {
          border-color: var(--accent-green);
        }
        .profile-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 220px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 0.5rem 0;
          z-index: 200;
          box-shadow: 0 14px 34px rgba(0,0,0,0.52);
        }
        .profile-dropdown-header {
          padding: 0.8rem 1rem;
          border-bottom: 1px solid var(--border);
        }
        .profile-dropdown-name {
          font-weight: 600;
          color: var(--text-primary);
        }
        .profile-dropdown-email {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .profile-dropdown a,
        .profile-dropdown button {
          display: block;
          width: 100%;
          text-align: left;
          padding: 0.7rem 1rem;
          font-size: 0.9rem;
          color: var(--text-secondary);
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: 0.15s;
        }
        .profile-dropdown a:hover,
        .profile-dropdown button:hover {
          background: rgba(16, 185, 129, 0.1);
          color: var(--text-primary);
        }
        .profile-dropdown .logout-btn {
          color: var(--accent-green);
          border-top: 1px solid var(--border);
        }

        /* Hero */
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 8rem clamp(1.5rem, 5vw, 4rem) 5rem;
        }
        .hero-inner {
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
        }
        .hero-tag {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--accent-green);
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 0.4rem 1.2rem;
          border-radius: 40px;
          margin-bottom: 2rem;
        }
        .hero-title {
          font-size: clamp(2.8rem, 7vw, 5.5rem);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          max-width: 900px;
          margin-bottom: 1.5rem;
        }
        .gradient-text {
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-green), var(--accent-purple));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          font-size: clamp(1rem, 1.5vw, 1.25rem);
          color: var(--text-secondary);
          max-width: 600px;
          margin-bottom: 2.5rem;
        }
        .hero-btns {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 4rem;
        }
        .btn-hero-primary {
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          background: var(--accent-green);
          border: none;
          border-radius: 40px;
          padding: 0.9rem 2.4rem;
          text-decoration: none;
          box-shadow: var(--glow-green);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-hero-primary:visited,
        .btn-hero-primary:active,
        .btn-hero-primary:hover {
          color: #ffffff;
        }
        .btn-hero-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 0 30px var(--accent-green);
        }
        .btn-hero-ghost {
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-primary);
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: 40px;
          padding: 0.9rem 2.4rem;
          text-decoration: none;
          transition: 0.2s;
        }
        .btn-hero-ghost:visited,
        .btn-hero-ghost:active {
          color: var(--text-primary);
        }
        .btn-hero-ghost:hover {
          border-color: var(--accent-green);
          background: rgba(16, 185, 129, 0.16);
          transform: translateY(-3px);
        }
        .stats-row {
          display: flex;
          flex-wrap: wrap;
          gap: 3rem 4rem;
        }
        .stat-item {
          text-align: left;
        }
        .stat-val {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--accent-green);
          line-height: 1;
          margin-bottom: 0.3rem;
        }
        .stat-label {
          font-size: 0.85rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Sections */
        .section {
          padding: 6rem clamp(1.5rem, 5vw, 4rem);
        }
        .section-inner {
          max-width: 1280px;
          margin: 0 auto;
        }
        .section-label {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--accent-green);
          margin-bottom: 1rem;
        }
        .section-title {
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 700;
          color: var(--text-primary);
          max-width: 700px;
          margin-bottom: 3rem;
          line-height: 1.2;
        }

        /* Features grid */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .feat-card,
        .step-item,
        .glow-card,
        .cta-block {
          opacity: 1;
          visibility: visible;
        }
        .feat-card {
          background: var(--bg-card);
          backdrop-filter: blur(10px);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 2rem;
          transition: all 0.3s;
        }
        .feat-card:hover {
          border-color: var(--accent-green);
          transform: translateY(-4px);
          box-shadow: 0 20px 30px rgba(0,0,0,0.3), 0 0 20px rgba(16, 185, 129, 0.2);
        }
        .feat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        .feat-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 16px;
          font-size: 1.4rem;
        }
        .feat-tag {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-muted);
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          border-radius: 30px;
          padding: 0.2rem 0.8rem;
        }
        .feat-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.8rem;
        }
        .feat-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .extra-content-section {
          padding: 2rem clamp(1.5rem, 5vw, 4rem) 6rem;
        }

        .read-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.2rem;
          margin-bottom: 3rem;
        }

        .read-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 1.5rem;
          backdrop-filter: blur(10px);
        }

        .read-quote {
          color: var(--text-secondary);
          font-size: 0.95rem;
          line-height: 1.7;
          margin-bottom: 1rem;
        }

        .read-name {
          color: var(--text-primary);
          font-size: 0.95rem;
          font-weight: 600;
        }

        .read-role {
          color: var(--text-muted);
          font-size: 0.82rem;
          margin-top: 0.2rem;
        }

        .faq-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .faq-item {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 1.25rem 1.3rem;
          backdrop-filter: blur(10px);
        }

        .faq-q {
          color: var(--text-primary);
          font-size: 0.98rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        .faq-a {
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.65;
        }

        /* Steps */
        .steps-section {
          padding: 5rem clamp(1.5rem, 5vw, 4rem) 7rem;
        }
        .steps-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: start;
        }
        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .step-item {
          display: flex;
          gap: 1.5rem;
          padding-bottom: 2.5rem;
        }
        .step-item:last-child { padding-bottom: 0; }
        .step-left {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .step-num {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid var(--accent-green);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: var(--accent-green);
        }
        .step-line {
          flex: 1;
          width: 2px;
          background: linear-gradient(180deg, var(--accent-green), transparent);
          margin-top: 0.5rem;
        }
        .step-item:last-child .step-line { display: none; }
        .step-content { padding-top: 0.5rem; }
        .step-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.3rem;
        }
        .step-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        /* Glow card */
        .glow-card {
          margin-top: 4rem;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(45, 212, 191, 0.1));
          border: 1px solid var(--accent-green);
          border-radius: 32px;
          padding: 3rem;
          backdrop-filter: blur(10px);
          box-shadow: 0 20px 30px rgba(0,0,0,0.3), 0 0 60px rgba(16, 185, 129, 0.2);
        }
        .glow-card-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }
        .glow-card-sub {
          font-size: 1rem;
          color: var(--text-secondary);
          max-width: 600px;
          margin-bottom: 2rem;
        }
        .mini-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .mini-stat {
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.2rem;
          text-align: center;
        }
        .mini-stat-val {
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--accent-green);
          line-height: 1;
          margin-bottom: 0.2rem;
        }
        .mini-stat-lbl {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .glow-card-btn {
          display: inline-block;
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          background: var(--accent-green);
          border: none;
          border-radius: 40px;
          padding: 0.9rem 2.5rem;
          text-decoration: none;
          box-shadow: var(--glow-green);
          transition: 0.2s;
        }
        .glow-card-btn:visited,
        .glow-card-btn:active,
        .glow-card-btn:hover {
          color: #ffffff;
        }
        .glow-card-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 0 30px var(--accent-green);
        }

        /* CTA */
        .cta-section {
          padding: 5rem clamp(1.5rem, 5vw, 4rem) 8rem;
        }
        .cta-block {
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(167, 139, 250, 0.1));
          border: 1px solid var(--accent-green);
          border-radius: 48px;
          padding: 5rem 3rem;
          backdrop-filter: blur(10px);
          box-shadow: 0 20px 30px rgba(0,0,0,0.3), 0 0 60px rgba(16, 185, 129, 0.2);
        }
        .cta-badge {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          color: var(--accent-green);
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 0.3rem 1.2rem;
          border-radius: 40px;
          margin-bottom: 2rem;
        }
        .cta-title {
          font-size: clamp(2.2rem, 5vw, 3.5rem);
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
          margin-bottom: 1.5rem;
        }
        .cta-sub {
          font-size: 1.1rem;
          color: var(--text-secondary);
          max-width: 500px;
          margin: 0 auto 2.5rem;
        }
        .cta-btns {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        /* Footer */
        footer {
          border-top: 1px solid var(--border);
          padding: 2rem clamp(1.5rem, 5vw, 4rem);
        }
        .footer-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .footer-copy {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        /* Light theme overrides */
        [data-theme="light"] {
          --text-primary: #0f172a;
          --text-secondary: #1e293b;
          --text-muted: #334155;
          --border: rgba(15, 23, 42, 0.18);
          --bg-card: rgba(241, 247, 255, 0.88);
          --bg-surface: rgba(236, 244, 255, 0.95);
          --glow-green: 0 0 18px rgba(16, 185, 129, 0.32);
          --glow-cyan: 0 0 18px rgba(45, 212, 191, 0.28);
        }

        [data-theme="light"] body {
          background: linear-gradient(180deg, #eaf1ff 0%, #e6efff 46%, #edf4ff 100%);
          color: #0f172a;
        }

        [data-theme="light"] .bg-canvas {
          opacity: 0.64;
          filter: contrast(1.14) saturate(1.07);
        }

        [data-theme="light"] .overlay {
          background:
            radial-gradient(circle at 20% 20%, rgba(45, 212, 191, 0.1) 0%, transparent 58%),
            radial-gradient(circle at 80% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 58%),
            linear-gradient(180deg, rgba(234, 241, 255, 0) 0%, rgba(234, 241, 255, 0.42) 100%);
        }

        [data-theme="light"] nav.scrolled {
          background: rgba(238, 246, 255, 0.92);
          border-bottom: 1px solid rgba(15, 23, 42, 0.14);
        }

        [data-theme="light"] .nav-center {
          background: rgba(244, 249, 255, 0.86);
          border: 1px solid rgba(59, 130, 246, 0.24);
        }

        [data-theme="light"] .nav-mobile-drawer {
          background: rgba(236, 245, 255, 0.96);
          border-bottom: 1px solid rgba(15, 23, 42, 0.14);
        }

        [data-theme="light"] .nav-drawer-link {
          color: #1e293b;
        }

        [data-theme="light"] .nav-drawer-link .drawer-icon {
          background: rgba(255,255,255,0.82);
          border: 1px solid rgba(15, 23, 42, 0.1);
        }

        [data-theme="light"] .brand,
        [data-theme="light"] .hero-title,
        [data-theme="light"] .section-title,
        [data-theme="light"] .feat-title,
        [data-theme="light"] .step-title,
        [data-theme="light"] .glow-card-title,
        [data-theme="light"] .cta-title {
          color: #0f172a;
        }

        [data-theme="light"] .hero-sub,
        [data-theme="light"] .feat-desc,
        [data-theme="light"] .step-desc,
        [data-theme="light"] .glow-card-sub,
        [data-theme="light"] .cta-sub,
        [data-theme="light"] .footer-copy,
        [data-theme="light"] .nav-link {
          color: #334155;
        }

        [data-theme="light"] .stat-label,
        [data-theme="light"] .mini-stat-lbl,
        [data-theme="light"] .feat-tag {
          color: #475569;
        }

        [data-theme="light"] .feat-tag {
          background: rgba(255,255,255,0.78);
          border-color: rgba(59, 130, 246, 0.16);
        }

        [data-theme="light"] .feat-card,
        [data-theme="light"] .mini-stat,
        [data-theme="light"] .profile-dropdown,
        [data-theme="light"] .read-card,
        [data-theme="light"] .faq-item,
        [data-theme="light"] .milestone-item,
        [data-theme="light"] .milestone-end {
          background: rgba(243, 249, 255, 0.88);
          border: 1px solid rgba(100, 116, 139, 0.28);
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.1);
        }

        [data-theme="light"] .glow-card,
        [data-theme="light"] .cta-block {
          background: linear-gradient(135deg, rgba(241, 249, 255, 0.9), rgba(227, 241, 255, 0.92));
          border: 1px solid rgba(59, 130, 246, 0.3);
          box-shadow: 0 18px 32px rgba(15, 23, 42, 0.1);
        }

        [data-theme="light"] .mini-stat {
          background: rgba(236, 245, 255, 0.9);
        }

        [data-theme="light"] .btn-hero-ghost,
        [data-theme="light"] .home-signin-btn {
          color: #0f172a !important;
          background: rgba(233, 243, 255, 0.9);
          border-color: rgba(59, 130, 246, 0.24);
        }

        [data-theme="light"] .hero-tag,
        [data-theme="light"] .section-label,
        [data-theme="light"] .cta-badge {
          color: #0f766e;
          background: rgba(45, 212, 191, 0.12);
          border-color: rgba(45, 212, 191, 0.32);
        }

        [data-theme="light"] .faq-a,
        [data-theme="light"] .read-quote,
        [data-theme="light"] .milestone-desc,
        [data-theme="light"] .milestone-end p {
          color: #334155;
        }

        [data-theme="light"] .faq-q,
        [data-theme="light"] .read-name,
        [data-theme="light"] .milestone-title,
        [data-theme="light"] .milestone-end h3 {
          color: #0f172a;
        }

        [data-theme="light"] .read-role {
          color: #475569;
        }

        [data-theme="light"] .milestone-period {
          color: #0f766e;
        }

        [data-theme="light"] .btn-hero-ghost:hover,
        [data-theme="light"] .home-signin-btn:hover,
        [data-theme="light"] .nav-link:hover,
        [data-theme="light"] .profile-dropdown a:hover,
        [data-theme="light"] .profile-dropdown button:hover {
          background: rgba(16, 185, 129, 0.16);
          color: #0f172a;
        }

        [data-theme="light"] .profile-dropdown-name {
          color: #0f172a;
        }

        [data-theme="light"] .profile-dropdown-email,
        [data-theme="light"] .profile-dropdown a,
        [data-theme="light"] .profile-dropdown button {
          color: #475569;
        }

        /* Responsive nav */
        @media (max-width: 1024px) {
          .nav-link { padding: 0 0.85rem; font-size: 0.85rem; }
        }
        @media (max-width: 860px) {
          .nav-inner { grid-template-columns: 1fr auto; }
          .nav-center { display: none; }
          .nav-hamburger { display: flex; }
          .nav-right .home-signin-btn,
          .nav-right .btn-solid { display: none; }
        }

        /* Other responsive */
        @media (max-width: 900px) {
          .steps-grid { grid-template-columns: 1fr; }
          .mini-stats { grid-template-columns: 1fr 1fr; }
          .faq-list { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .stats-row { gap: 2rem; }
          .stat-val { font-size: 2rem; }
          .cta-block { padding: 3rem 1.5rem; }
        }
      `}</style>

      <div className="page" ref={rootRef}>
        <div className="bg-canvas" ref={setCanvasMountRef} />
        <div className="overlay" />

        <div className="content">
          <nav className={scrolled ? "scrolled" : ""}>
            <div className="nav-inner">
              {/* Brand */}
              <Link to="/" className="nav-brand">
                <span className="nav-brand-logo">S</span>
                <span className="nav-brand-name">Smart<span> Campus Companion</span></span>
              </Link>

              {/* Center Links – desktop */}
              <div className="nav-center">
                <button className="nav-link" onClick={() => document.querySelector(".features-grid")?.scrollIntoView({ behavior: "smooth" })}>Features</button>
                <Link className="nav-link" to="/community">Community</Link>
                <Link className="nav-link" to="/resources">Resources</Link>
                <Link className="nav-link" to="/tutors">Tutors</Link>
                <button className="nav-link" onClick={() => document.querySelector(".steps-section")?.scrollIntoView({ behavior: "smooth" })}>How it works</button>
              </div>

              {/* Right – desktop */}
              <div className="nav-right">
                {isAuthenticated ? (
                  <div className="profile-wrapper" ref={profileMenuRef}>
                    <div className="profile-avatar" onClick={() => setProfileOpen((v) => !v)}>
                      {user?.profilePicture ? <img src={user.profilePicture} alt={user.name} style={{width:"100%",height:"100%",borderRadius:"50%",objectFit:"cover"}} /> : (user?.name?.[0] || "U")}
                    </div>
                    {profileOpen && (
                      <div className="profile-dropdown">
                        <div className="profile-dropdown-header">
                          <div className="profile-dropdown-name">{user?.name || "User"}</div>
                          <div className="profile-dropdown-email">{user?.email || ""}</div>
                        </div>
                        <Link to="/dashboard" onClick={() => setProfileOpen(false)}>🏠 Dashboard</Link>
                        <Link to="/groups" onClick={() => setProfileOpen(false)}>👥 My Groups</Link>
                        <Link to="/notes" onClick={() => setProfileOpen(false)}>📝 My Notes</Link>
                        <Link to="/notifications" onClick={() => setProfileOpen(false)}>🔔 Notifications</Link>
                        <Link to="/profile" onClick={() => setProfileOpen(false)}>⚙️ Profile Settings</Link>
                        <button className="logout-btn" onClick={() => { dispatch(logout()); setProfileOpen(false); }}>Sign Out</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link to="/login" className="home-signin-btn">Sign In</Link>
                    <Link to="/register" className="btn-solid">Get Started →</Link>
                  </>
                )}
                {/* Mobile hamburger */}
                <button
                  className={`nav-hamburger${mobileOpen ? " open" : ""}`}
                  onClick={() => setMobileOpen((v) => !v)}
                  aria-label="Menu"
                >
                  <span /><span /><span />
                </button>
              </div>
            </div>
          </nav>

          {/* Mobile Drawer */}
          <div className={`nav-mobile-drawer${mobileOpen ? " open" : ""}`} ref={mobileMenuRef}>
            <button className="nav-drawer-link" onClick={() => { document.querySelector(".features-grid")?.scrollIntoView({ behavior: "smooth" }); setMobileOpen(false); }}>
              <span className="drawer-icon">✨</span> Features
            </button>
            <Link className="nav-drawer-link" to="/community" onClick={() => setMobileOpen(false)}>
              <span className="drawer-icon">👥</span> Community
            </Link>
            <Link className="nav-drawer-link" to="/resources" onClick={() => setMobileOpen(false)}>
              <span className="drawer-icon">📝</span> Resources
            </Link>
            <Link className="nav-drawer-link" to="/tutors" onClick={() => setMobileOpen(false)}>
              <span className="drawer-icon">🎓</span> Tutors
            </Link>
            {isAuthenticated && (
              <Link className="nav-drawer-link" to="/dashboard" onClick={() => setMobileOpen(false)}>
                <span className="drawer-icon">🏠</span> Dashboard
              </Link>
            )}
            {isAuthenticated && (
              <Link className="nav-drawer-link" to="/notifications" onClick={() => setMobileOpen(false)}>
                <span className="drawer-icon">🔔</span> Notifications
              </Link>
            )}
            <button className="nav-drawer-link" onClick={() => { document.querySelector(".steps-section")?.scrollIntoView({ behavior: "smooth" }); setMobileOpen(false); }}>
              <span className="drawer-icon">ℹ️</span> How it works
            </button>
            <div className="nav-drawer-divider" />
            {isAuthenticated ? (
              <button className="nav-drawer-link" style={{color:"var(--accent-green)"}} onClick={() => { dispatch(logout()); setMobileOpen(false); }}>
                <span className="drawer-icon">🚪</span> Sign Out
              </button>
            ) : (
              <div className="nav-drawer-btns">
                <Link to="/login" className="home-signin-btn" onClick={() => setMobileOpen(false)}>Sign In</Link>
                <Link to="/register" className="btn-solid" onClick={() => setMobileOpen(false)}>Get Started →</Link>
              </div>
            )}
          </div>

          <main>
            {/* Hero */}
            <section className="hero">
              <div className="hero-inner">
                <p className="hero-tag" data-hero-title>✧ THE FUTURE OF STUDY ✧</p>
                <h1 className="hero-title" data-hero-title>
                  Your academic life <br />
                  <span className="gradient-text">finally under control.</span>
                </h1>
                <p className="hero-sub" data-hero-sub>
                  Smart Campus Companion brings together notes, study groups, AI insights, and seamless collaboration—all in one sleek workspace.
                </p>
                <div className="hero-btns" data-hero-cta>
                  <Link to="/register" className="btn-hero-primary">Launch Your Workspace →</Link>
                  <button className="btn-hero-ghost" onClick={() => document.querySelector(".features-grid")?.scrollIntoView({ behavior: "smooth" })}>
                    Explore Features
                  </button>
                </div>
                <div className="stats-row" data-hero-stats>
                  {stats.map((s) => (
                    <div className="stat-item" key={s.label}>
                      <div className="stat-val">{s.value}</div>
                      <div className="stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Features */}
            <section className="section">
              <div className="section-inner">
                <p className="section-label" data-section-title>Everything you need</p>
                <h2 className="section-title" data-section-title>Built for students who refuse to settle for average.</h2>
                <div className="features-grid">
                  {features.map((f) => (
                    <article className="feat-card card-shine hover-glow" data-feat-card key={f.title}>
                      <div className="feat-top">
                        <div className="feat-icon">{f.icon}</div>
                        <span className="feat-tag">{f.tag}</span>
                      </div>
                      <h3 className="feat-title">{f.title}</h3>
                      <p className="feat-desc">{f.desc}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            {/* Steps */}
            <section className="steps-section">
              <div className="section-inner">
                <p className="section-label" data-section-title>From setup to mastery</p>
                <h2 className="section-title" data-section-title>Up and running in minutes.</h2>
                <div className="steps-grid">
                  <div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                      No steep learning curve. No bloat. Designed to get out of your way and let you focus on what matters.
                    </p>
                  </div>
                  <div className="steps-list">
                    {steps.map((s) => (
                      <div className="step-item" data-step-item key={s.n}>
                        <div className="step-left">
                          <div className="step-num">{s.n}</div>
                          <div className="step-line" />
                        </div>
                        <div className="step-content">
                          <h3 className="step-title">{s.title}</h3>
                          <p className="step-desc">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glow-card" data-glow-card>
                  <h3 className="glow-card-title">Join 50,000+ students already thriving</h3>
                  <p className="glow-card-sub">The average student reports 40% better time management and significantly less exam stress within the first month.</p>
                  <div className="mini-stats">
                    {stats.map((s) => (
                      <div className="mini-stat" key={s.label}>
                        <div className="mini-stat-val">{s.value}</div>
                        <div className="mini-stat-lbl">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <Link to="/register" className="glow-card-btn">Create Free Account →</Link>
                </div>
              </div>
            </section>

            {/* More to read */}
            <section className="extra-content-section">
              <div className="section-inner">
                <p className="section-label" data-section-title>Student voices</p>
                <h2 className="section-title" data-section-title>Real outcomes from real campus life.</h2>
                <div className="read-grid">
                  {testimonials.map((t) => (
                    <article className="read-card" key={t.name}>
                      <p className="read-quote">“{t.quote}”</p>
                      <div className="read-name">{t.name}</div>
                      <div className="read-role">{t.role}</div>
                    </article>
                  ))}
                </div>

                <p className="section-label" data-section-title>FAQs</p>
                <h2 className="section-title" data-section-title>Quick answers before you dive in.</h2>
                <div className="faq-list">
                  {faqs.map((item) => (
                    <article className="faq-item" key={item.q}>
                      <h3 className="faq-q">{item.q}</h3>
                      <p className="faq-a">{item.a}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="cta-section">
              <div className="cta-block" data-cta-block>
                <p className="cta-badge">✦ &nbsp; Free to start. Always.</p>
                <h2 className="cta-title">The semester of your life starts right now.</h2>
                <p className="cta-sub">Join thousands of students who've upgraded their academic experience.</p>
                <div className="cta-btns">
                  <Link to="/register" className="btn-hero-primary">Create Free Account →</Link>
                  <Link to="/login" className="btn-hero-ghost">I already have access</Link>
                </div>
              </div>
            </section>
          </main>

          <footer>
            <div className="footer-inner">
              <p className="footer-copy">© {new Date().getFullYear()} Smart Campus Companion. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}