import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "../styles/Home.css";

const PICSUM = (seed, w, h) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const RANDOM_USER_API = "https://randomuser.me/api/?results=3";
const HOME_DATA_URL = "/data/homeData.json";

const defaultData = {
  hero: {
    badge: "AI-Powered Campus Management",
    titleLine1: "Transform Your",
    titleHighlight: " Academic Journey",
    description: "Experience the future of education with intelligent scheduling, collaborative learning spaces, and data-driven insights that adapt to your unique academic path.",
    imageSeed: "campus-hero",
  },
  stats: [
    { value: "10K+", label: "Active Students", icon: "👥" },
    { value: "50K+", label: "Tasks Completed", icon: "✅" },
    { value: "98%", label: "Satisfaction Rate", icon: "⭐" },
    { value: "24/7", label: "Support Available", icon: "🔄" },
  ],
  features: [
    { id: "academic", icon: "🎓", title: "Academic Intelligence", description: "AI-powered scheduling and course management that adapts to your learning patterns", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", stats: "98% accuracy" },
    { id: "analytics", icon: "📊", title: "Analytics Dashboard", description: "Comprehensive insights into your academic performance and study habits", gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", stats: "Real-time tracking" },
    { id: "collaborative", icon: "🤝", title: "Collaborative Learning", description: "Smart study groups with intelligent peer matching based on your courses", gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", stats: "500+ active groups" },
    { id: "notifications", icon: "⚡", title: "Smart Notifications", description: "Context-aware alerts for deadlines, events, and campus activities", gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", stats: "< 1s delivery" },
    { id: "security", icon: "🔐", title: "Enterprise Security", description: "Bank-level encryption and secure authentication for your academic data", gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", stats: "256-bit encryption" },
    { id: "sync", icon: "🌐", title: "Cross-Platform Sync", description: "Seamless experience across all your devices with real-time synchronization", gradient: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)", stats: "99.9% uptime" },
  ],
  solutions: [
    { id: "timetable", title: "Smart Timetable Generator", description: "AI creates optimal schedules considering your learning patterns, course requirements, and personal preferences.", icon: "⚡" },
    { id: "study-spaces", title: "Collaborative Study Spaces", description: "Virtual rooms with real-time document editing, video conferencing, and intelligent note-taking.", icon: "🤝" },
    { id: "analytics-sol", title: "Predictive Analytics", description: "Identify at-risk students early and provide targeted interventions with machine learning algorithms.", icon: "📈" },
  ],
  testimonialContents: [
    { role: "Professor, Computer Science", content: "Smart Campus Companion has transformed how I manage my courses and interact with students. The AI scheduling is a game-changer.", rating: 5 },
    { role: "Student, Engineering", content: "I've never been more organized. The study group feature helped me connect with classmates and improve my grades significantly.", rating: 5 },
    { role: "Department Head", content: "The analytics dashboard provides invaluable insights into student engagement and performance. Essential tool for modern education.", rating: 5 },
  ],
  sections: {
    featuresBadge: "POWERFUL FEATURES",
    featuresTitle: "Everything you need to ",
    featuresTitleHighlight: "excel academically",
    featuresSubtitle: "Intelligent tools designed to enhance every aspect of your campus life, from scheduling to collaboration and beyond.",
    solutionsBadge: "INTELLIGENT SOLUTIONS",
    solutionsTitle: "Built for modern ",
    solutionsTitleHighlight: "campus challenges",
    testimonialsBadge: "TESTIMONIALS",
    testimonialsTitle: "Trusted by ",
    testimonialsTitleHighlight: "educators and students",
  },
  courseProgress: [
    { label: "CS50", value: 85 },
    { label: "Math 201", value: 92 },
    { label: "Physics", value: 78 },
  ],
};

const Home = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const [pageData, setPageData] = useState(defaultData);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const heroRef = useRef(null);
  const featuresRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dataRes, usersRes] = await Promise.all([
          fetch(HOME_DATA_URL).then((r) => (r.ok ? r.json() : defaultData)),
          fetch(RANDOM_USER_API).then((r) => (r.ok ? r.json() : { results: [] })),
        ]);

        if (cancelled) return;

        const data = dataRes?.hero ? dataRes : defaultData;
        setPageData(data);

        const contents = data.testimonialContents || defaultData.testimonialContents;
        const users = usersRes?.results || [];
        const merged = contents.map((c, i) => ({
          name: users[i] ? `${users[i].name?.first || ""} ${users[i].name?.last || ""}`.trim() || `User ${i + 1}` : `User ${i + 1}`,
          role: c.role,
          content: c.content,
          avatar: users[i]?.picture?.large || users[i]?.picture?.medium || users[i]?.picture?.thumbnail || null,
          rating: c.rating ?? 5,
        }));
        setTestimonials(merged.length ? merged : defaultData.testimonialContents.map((c, i) => ({ ...c, name: `User ${i + 1}`, avatar: null })));
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Failed to load data");
          setTestimonials(
            (defaultData.testimonialContents || []).map((c, i) => ({
              name: `User ${i + 1}`,
              role: c.role,
              content: c.content,
              avatar: null,
              rating: c.rating ?? 5,
            }))
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const hero = pageData.hero || defaultData.hero;
  const stats = pageData.stats ?? defaultData.stats;
  const features = pageData.features ?? defaultData.features;
  const solutions = pageData.solutions ?? defaultData.solutions;
  const sections = pageData.sections || defaultData.sections;
  const courseProgress = pageData.courseProgress ?? defaultData.courseProgress;
  const heroBg = PICSUM(hero.imageSeed || "campus-hero", 1920, 1080);

  if (loading) {
    return (
      <div className="home home-loading">
        <nav className="navbar">
          <div className="nav-container">
            <div className="nav-logo">
              <span className="logo-icon">🏛️</span>
              <span className="logo-text">Campus<span className="logo-highlight">AI</span></span>
            </div>
            <div className="nav-menu">
              <a href="#features" className="nav-link">Features</a>
              <a href="#solutions" className="nav-link">Solutions</a>
              <a href="#testimonials" className="nav-link">Testimonials</a>
              <a href="#pricing" className="nav-link">Pricing</a>
            </div>
            <div className="nav-actions">
              <Link to="/login" className="nav-login">Sign In</Link>
              <Link to="/register" className="nav-register">Get Started</Link>
            </div>
          </div>
        </nav>
        <div className="loading-screen">
          <div className="loading-spinner" />
          <p>Loading campus experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-text">SMART CAMPUS <span className="logo-highlight">COMPANION</span></span>
          </div>
          <div className="nav-menu">
            <a href="#" className="nav-link">Groups</a>
            <a href="#" className="nav-link">To Do</a>
            <a href="#" className="nav-link">Notes</a>
            <a href="#" className="nav-link">Exam Assistant</a>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="nav-login">Sign In</Link>
            <Link to="/register" className="nav-register">Get Started</Link>
          </div>
        </div>
      </nav>

      {error && (
        <div className="home-error-banner" role="alert">
          Could not load some data from the internet. Showing cached content. ({error})
        </div>
      )}

      <section
        className="hero"
        ref={heroRef}
        style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="hero-overlay" />
        <div className="hero-particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${10 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>

        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-pulse" />
              {hero.badge}
            </div>
            <h1 className="hero-title">
              {hero.titleLine1}
              <span className="gradient-text">{hero.titleHighlight}</span>
            </h1>
            <p className="hero-description">{hero.description}</p>
            <div className="hero-cta">
              <Link to="/register" className="cta-primary">
                Start Free Trial
                <span className="cta-arrow">→</span>
              </Link>
              <Link to="/demo" className="cta-secondary">
                Watch Demo
                <span className="cta-play">▶</span>
              </Link>
            </div>
            <div className="hero-stats">
              {stats.map((stat, index) => (
                <div key={index} className="stat-item">
                  <span className="stat-icon">{stat.icon}</span>
                  <div className="stat-info">
                    <span className="stat-value">{stat.value}</span>
                    <span className="stat-label">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card main-card">
              <div className="card-glow" />
              <div className="card-content">
                <div className="card-header">
                  <span className="card-dot red" />
                  <span className="card-dot yellow" />
                  <span className="card-dot green" />
                </div>
                <div className="card-body">
                  {courseProgress.map((row, i) => (
                    <div key={i} className="data-row">
                      <span className="data-label">{row.label}</span>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${row.value}%` }} />
                      </div>
                      <span className="data-value">{row.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-scroll">
          <span className="scroll-text">Scroll to explore</span>
          <div className="scroll-indicator" />
        </div>
      </section>

      <section className="features" id="features" ref={featuresRef}>
        <div className="features-container">
          <div className="section-header">
            <span className="section-badge">{sections.featuresBadge}</span>
            <h2 className="section-title">
              {sections.featuresTitle}<span className="gradient-text">{sections.featuresTitleHighlight}</span>
            </h2>
            <p className="section-subtitle">{sections.featuresSubtitle}</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={feature.id || index}
                className={`feature-card ${activeFeature === index ? "active" : ""}`}
                onMouseEnter={() => setActiveFeature(index)}
                onMouseLeave={() => setActiveFeature(null)}
                style={{ "--gradient": feature.gradient }}
              >
                <div className="feature-card-image">
                  <img src={PICSUM(feature.id || index, 400, 250)} alt="" loading="lazy" />
                </div>
                <div className="feature-icon-wrapper" style={{ background: feature.gradient }}>
                  <span className="feature-icon">{feature.icon || "•"}</span>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <div className="feature-stats">
                  <span className="stats-badge">{feature.stats}</span>
                </div>
                <div className="feature-hover">
                  <span>Learn more →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="solutions" id="solutions">
        <div className="solutions-container">
          <div className="solutions-content">
            <div className="section-header left">
              <span className="section-badge">{sections.solutionsBadge}</span>
              <h2 className="section-title">
                {sections.solutionsTitle}<span className="gradient-text">{sections.solutionsTitleHighlight}</span>
              </h2>
            </div>
            <div className="solutions-list">
              {solutions.map((solution, index) => (
                <div key={solution.id || index} className="solution-item">
                  <div className="solution-icon">{solution.icon}</div>
                  <div className="solution-info">
                    <h4>{solution.title}</h4>
                    <p>{solution.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="solutions-visual">
            <div className="visual-grid">
              {["sol1", "sol2", "sol3", "sol4"].map((seed, i) => (
                <div key={i} className="grid-item">
                  <img src={PICSUM(seed, 400, 400)} alt="" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="testimonials" id="testimonials">
        <div className="testimonials-container">
          <div className="section-header center">
            <span className="section-badge">{sections.testimonialsBadge}</span>
            <h2 className="section-title">
              {sections.testimonialsTitle}<span className="gradient-text">{sections.testimonialsTitleHighlight}</span>
            </h2>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((t, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-rating">
                  {[...Array(t.rating || 5)].map((_, i) => (
                    <span key={i} className="star">★</span>
                  ))}
                </div>
                <p className="testimonial-content">"{t.content}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    {t.avatar ? <img src={t.avatar} alt="" /> : <span>👤</span>}
                  </div>
                  <div className="author-info">
                    <span className="author-name">{t.name}</span>
                    <span className="author-role">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to transform your campus experience?</h2>
            <p className="cta-description">
              Join thousands of students and educators already using Smart Campus Companion to enhance their academic journey.
            </p>
            <div className="cta-buttons">
              <Link to="/register" className="cta-primary large">
                Get Started Free
                <span className="cta-arrow">→</span>
              </Link>
              <Link to="/contact" className="cta-secondary large">Contact Sales</Link>
            </div>
            <p className="cta-note">No credit card required • Free 30-day trial • Cancel anytime</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="logo-icon">🏛️</span>
                <span className="logo-text">Campus<span className="logo-highlight">AI</span></span>
              </div>
              <p className="footer-description">
                Revolutionizing campus management with artificial intelligence and collaborative tools for the modern educational institution.
              </p>
            </div>
            {[
              { title: "Product", links: ["Features", "Solutions", "Pricing", "Demo"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
              { title: "Resources", links: ["Documentation", "Help Center", "API", "Status"] },
              { title: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] },
            ].map((column, index) => (
              <div key={index} className="footer-column">
                <h4 className="footer-title">{column.title}</h4>
                <ul className="footer-links">
                  {column.links.map((link, i) => (
                    <li key={i}>
                      <a href={`#${link.toLowerCase()}`}>{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <p className="copyright">© {new Date().getFullYear()} Smart Campus Companion. All rights reserved.</p>
            <div className="social-links">
              <a href="#" className="social-link">𝕏</a>
              <a href="#" className="social-link">LinkedIn</a>
              <a href="#" className="social-link">GitHub</a>
              <a href="#" className="social-link">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
