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

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const canvasRef = useRef(null);
  const rootRef = useRef(null);
  const profileMenuRef = useRef(null);

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
        .nav-links button:focus-visible {
          outline: 2px solid var(--accent-green);
          outline-offset: 2px;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
        }

        :root {
          --bg-dark: #0a0c14;
          --bg-card: rgba(18, 22, 36, 0.8);
          --bg-surface: #121624;
          --border: rgba(255, 255, 255, 0.08);
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
          opacity: 0.7;
        }

        .overlay {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background: radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.05) 0%, transparent 60%),
                      radial-gradient(circle at 70% 80%, rgba(45, 212, 191, 0.05) 0%, transparent 60%),
                      linear-gradient(180deg, rgba(10, 12, 20, 0) 0%, rgba(10, 12, 20, 0.8) 100%);
        }

        .content {
          position: relative;
          z-index: 10;
        }

        /* Navigation */
        nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 1.25rem clamp(1.5rem, 5vw, 4rem);
          transition: background 0.3s, backdrop-filter 0.3s;
        }
        nav.scrolled {
          background: rgba(10, 12, 20, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
        }
        .nav-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .brand {
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--text-primary);
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          letter-spacing: -0.02em;
        }
        .brand-dot {
          width: 8px;
          height: 8px;
          background: var(--accent-green);
          border-radius: 50%;
          box-shadow: var(--glow-green);
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-left: auto;
        }
        .nav-links button {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-secondary);
          background: none;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .nav-links button:hover {
          color: var(--text-primary);
          background: rgba(16, 185, 129, 0.1);
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .home-signin-btn {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--accent-green);
          background: transparent;
          border: 1px solid rgba(16, 185, 129, 0.45);
          border-radius: 30px;
          padding: 0.5rem 1.4rem;
          text-decoration: none;
          box-shadow: 0 0 14px rgba(16, 185, 129, 0.2);
          transition: all 0.2s;
        }
        .home-signin-btn:visited,
        .home-signin-btn:active {
          color: var(--accent-green);
        }
        .home-signin-btn:hover {
          border-color: var(--accent-green);
          color: var(--accent-green);
          background: rgba(16, 185, 129, 0.16);
          transform: translateY(-3px);
          box-shadow: 0 0 22px rgba(16, 185, 129, 0.35);
        }

        .nav-actions .home-signin-btn,
        .nav-actions .home-signin-btn:visited,
        .nav-actions .home-signin-btn:active,
        .nav-actions .home-signin-btn:hover,
        .nav-actions .home-signin-btn:focus,
        .nav-actions .home-signin-btn:focus-visible {
          color: var(--accent-green) !important;
          text-decoration: none !important;
        }
        .btn-solid {
          font-size: 0.9rem;
          font-weight: 600;
          color: #ffffff;
          background: var(--accent-green);
          border: none;
          border-radius: 30px;
          padding: 0.5rem 1.6rem;
          text-decoration: none;
          box-shadow: var(--glow-green);
          transition: opacity 0.2s, box-shadow 0.2s;
        }
        .btn-solid:visited,
        .btn-solid:active,
        .btn-solid:hover {
          color: #ffffff;
        }
        .btn-solid:hover {
          opacity: 0.9;
          box-shadow: 0 0 25px var(--accent-green);
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
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
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
        [data-theme="light"] body {
          background: #f4f7fb;
          color: #0f172a;
        }

        [data-theme="light"] .bg-canvas {
          opacity: 0.68;
          filter: contrast(1.18) saturate(1.06);
        }

        [data-theme="light"] .overlay {
          background:
            radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.11) 0%, transparent 55%),
            radial-gradient(circle at 80% 75%, rgba(45, 212, 191, 0.1) 0%, transparent 55%),
            linear-gradient(180deg, rgba(244, 247, 251, 0) 0%, rgba(244, 247, 251, 0.45) 100%);
        }

        [data-theme="light"] nav.scrolled {
          background: rgba(255, 255, 255, 0.9);
          border-bottom: 1px solid rgba(15, 23, 42, 0.1);
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
        [data-theme="light"] .nav-links button {
          color: #334155;
        }

        [data-theme="light"] .stat-label,
        [data-theme="light"] .mini-stat-lbl,
        [data-theme="light"] .feat-tag {
          color: #475569;
        }

        [data-theme="light"] .feat-card,
        [data-theme="light"] .mini-stat,
        [data-theme="light"] .profile-dropdown {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(15, 23, 42, 0.14);
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
        }

        [data-theme="light"] .glow-card,
        [data-theme="light"] .cta-block {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.88), rgba(236, 253, 245, 0.9));
          border: 1px solid rgba(16, 185, 129, 0.4);
          box-shadow: 0 18px 32px rgba(15, 23, 42, 0.1);
        }

        [data-theme="light"] .mini-stat {
          background: rgba(255, 255, 255, 0.86);
        }

        [data-theme="light"] .btn-hero-ghost,
        [data-theme="light"] .home-signin-btn {
          color: #0f172a !important;
          background: rgba(255, 255, 255, 0.7);
          border-color: rgba(15, 23, 42, 0.14);
        }

        [data-theme="light"] .hero-tag,
        [data-theme="light"] .section-label,
        [data-theme="light"] .cta-badge {
          color: #0f766e;
          background: rgba(15, 118, 110, 0.12);
          border-color: rgba(15, 118, 110, 0.3);
        }

        [data-theme="light"] .btn-hero-ghost:hover,
        [data-theme="light"] .home-signin-btn:hover,
        [data-theme="light"] .nav-links button:hover,
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

        /* Responsive */
        @media (max-width: 900px) {
          .steps-grid { grid-template-columns: 1fr; }
          .mini-stats { grid-template-columns: 1fr 1fr; }
          .nav-links, .nav-actions .home-signin-btn { display: none; }
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
              <button className="brand">
                <span className="brand-dot" />
                Campus Companion
              </button>
              <div className="nav-links">
                <button onClick={() => document.querySelector(".features-grid")?.scrollIntoView({ behavior: "smooth" })}>Features</button>
                <button onClick={() => document.querySelector(".steps-section")?.scrollIntoView({ behavior: "smooth" })}>How It Works</button>
              </div>
              <div className="nav-actions">
                {isAuthenticated ? (
                  <div className="profile-wrapper" ref={profileMenuRef}>
                    <div className="profile-avatar" onClick={() => setProfileOpen((v) => !v)}>
                      {user?.profilePicture ? <img src={user.profilePicture} alt={user.name} /> : (user?.name?.[0] || "U")}
                    </div>
                    {profileOpen && (
                      <div className="profile-dropdown">
                        <div className="profile-dropdown-header">
                          <div className="profile-dropdown-name">{user?.name || "User"}</div>
                          <div className="profile-dropdown-email">{user?.email || ""}</div>
                        </div>
                        <Link to="/dashboard" onClick={() => setProfileOpen(false)}>Dashboard</Link>
                        <Link to="/groups" onClick={() => setProfileOpen(false)}>My Groups</Link>
                        <Link to="/notes" onClick={() => setProfileOpen(false)}>My Notes</Link>
                        <button className="logout-btn" onClick={() => { dispatch(logout()); setProfileOpen(false); }}>Sign Out</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link to="/login" className="home-signin-btn">Sign In</Link>
                    <Link to="/register" className="btn-solid">Register</Link>
                  </>
                )}
              </div>
            </div>
          </nav>

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
                    <article className="feat-card" data-feat-card key={f.title}>
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