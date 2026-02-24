import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "../styles/Home.css";

gsap.registerPlugin(ScrollTrigger);

const highlights = [
  { value: "50K+", label: "Learners" },
  { value: "1.2M", label: "Study Hours" },
  { value: "97%", label: "Goal Completion" },
  { value: "24/7", label: "AI Assistance" },
];

const pillars = [
  {
    title: "Executive Focus Dashboard",
    desc: "See priorities, deadlines, and momentum in one polished command center.",
  },
  {
    title: "Elite Collaboration Rooms",
    desc: "Coordinate projects with instant messaging, role controls, and shared assets.",
  },
  {
    title: "Predictive Academic Insights",
    desc: "Use trend intelligence to prevent burnout and improve performance consistency.",
  },
];

const timeline = [
  {
    step: "01",
    title: "Create Your Workspace",
    desc: "Set your profile, goals, and preferred study cadence in under two minutes.",
  },
  {
    step: "02",
    title: "Sync Courses & Teams",
    desc: "Connect groups, class plans, and notes into one premium learning flow.",
  },
  {
    step: "03",
    title: "Run Your Semester Like a Pro",
    desc: "Execute with reminders, analytics, and collaborative clarity every day.",
  },
];

const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const heroRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const rafRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  const sectionsRef = useRef({
    hero: null,
    luxury: null,
    timeline: null,
    cta: null,
  });

  const scrollTo = (key) => {
    sectionsRef.current[key]?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!canvasWrapRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      1200
    );
    camera.position.z = 26;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    canvasWrapRef.current.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x4f46e5, 0.6);
    const key = new THREE.PointLight(0x8b5cf6, 1.4, 90);
    const fill = new THREE.PointLight(0x4f46e5, 1.2, 90);
    key.position.set(8, 6, 10);
    fill.position.set(-8, -4, 12);
    scene.add(ambient, key, fill);

    const crystalGroup = new THREE.Group();
    scene.add(crystalGroup);

    const geometryPool = [
      new THREE.OctahedronGeometry(1.1, 0),
      new THREE.IcosahedronGeometry(0.95, 0),
      new THREE.TorusKnotGeometry(0.75, 0.2, 100, 12),
      new THREE.TetrahedronGeometry(1),
    ];

    const materialPool = [
      new THREE.MeshStandardMaterial({
        color: 0x4f46e5,
        metalness: 0.6,
        roughness: 0.22,
        transparent: true,
        opacity: 0.85,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        metalness: 0.55,
        roughness: 0.24,
        transparent: true,
        opacity: 0.8,
      }),
    ];

    const crystals = [];
    for (let index = 0; index < 38; index += 1) {
      const mesh = new THREE.Mesh(
        geometryPool[Math.floor(Math.random() * geometryPool.length)],
        materialPool[Math.floor(Math.random() * materialPool.length)]
      );

      const radius = 15 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      mesh.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
      const scale = 0.45 + Math.random() * 0.9;
      mesh.scale.set(scale, scale, scale);
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      crystalGroup.add(mesh);
      crystals.push(mesh);
    }

    const starsCount = 1800;
    const starsGeometry = new THREE.BufferGeometry();
    const starsArray = new Float32Array(starsCount * 3);
    for (let index = 0; index < starsCount; index += 1) {
      const spread = 110;
      starsArray[index * 3] = (Math.random() - 0.5) * spread;
      starsArray[index * 3 + 1] = (Math.random() - 0.5) * spread;
      starsArray[index * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(starsArray, 3));

    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.09,
      transparent: true,
      opacity: 0.5,
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    const onMouseMove = (event) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      crystalGroup.rotation.y += 0.0009 + mouseRef.current.x * 0.0005;
      crystalGroup.rotation.x += 0.0004 + mouseRef.current.y * 0.0003;
      stars.rotation.y += 0.00015;

      crystals.forEach((mesh, index) => {
        mesh.rotation.x += 0.001 + index * 0.000003;
        mesh.rotation.z += 0.0008 + index * 0.000002;
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      renderer.dispose();
      if (canvasWrapRef.current?.contains(renderer.domElement)) {
        canvasWrapRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const timelineCtx = gsap.context(() => {
      gsap.from(".hero-kicker, .hero-title, .hero-subtitle, .hero-actions, .hero-metrics", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.12,
        ease: "power3.out",
      });

      gsap.from(".luxury-card", {
        scrollTrigger: {
          trigger: ".luxury-grid",
          start: "top 82%",
        },
        y: 60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.14,
        ease: "power3.out",
      });

      gsap.from(".timeline-item", {
        scrollTrigger: {
          trigger: ".journey-timeline",
          start: "top 80%",
        },
        x: -80,
        opacity: 0,
        duration: 0.9,
        stagger: 0.16,
        ease: "power2.out",
      });

      gsap.from(".cta-shell", {
        scrollTrigger: {
          trigger: ".final-cta",
          start: "top 84%",
        },
        scale: 0.95,
        opacity: 0,
        duration: 1,
        ease: "power2.out",
      });

      gsap.to(".orb", {
        y: 20,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.5,
      });
    }, heroRef);

    return () => timelineCtx.revert();
  }, []);

  return (
    <div className="lux-home" ref={heroRef}>
      <div className="lux-canvas" ref={canvasWrapRef} />
      <div className="lux-overlay" />

      <nav className={`lux-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="lux-nav-inner">
          <button className="brand" onClick={() => scrollTo("hero")}>
            <span className="brand-mark">◆</span>
            <span>CampusIQ</span>
          </button>

          <button
            className={`menu-toggle ${mobileMenuOpen ? "open" : ""}`}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>

          <div className={`lux-nav-links ${mobileMenuOpen ? "open" : ""}`}>
            <button onClick={() => scrollTo("luxury")}>Why Premium</button>
            <button onClick={() => scrollTo("timeline")}>Experience</button>
            <button onClick={() => scrollTo("cta")}>Join</button>
          </div>

          <div className="lux-nav-actions">
            <Link to="/login" className="btn ghost">Sign In</Link>
            <Link to="/register" className="btn solid">Get Started</Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="hero-lux" ref={(node) => { sectionsRef.current.hero = node; }}>
          <div className="hero-grid">
            <div>
              <p className="hero-kicker">Luxury Academic Command Center</p>
              <h1 className="hero-title">
                Elevate every semester with a
                <span> world-class student operating system.</span>
              </h1>
              <p className="hero-subtitle">
                Built on intelligence, speed, and premium design — CampusIQ gives you elite control over classes,
                teams, and outcomes.
              </p>

              <div className="hero-actions">
                <Link to="/register" className="btn solid big">Launch Workspace</Link>
                <button className="btn ghost big" onClick={() => scrollTo("luxury")}>Explore Experience</button>
              </div>

              <div className="hero-metrics">
                {highlights.map((item) => (
                  <article key={item.label} className="metric-card">
                    <h3>{item.value}</h3>
                    <p>{item.label}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="hero-orbs">
              <div className="orb orb-one">AI</div>
              <div className="orb orb-two">SYNC</div>
              <div className="orb orb-three">FLOW</div>
            </aside>
          </div>
        </section>

        <section className="luxury-section" ref={(node) => { sectionsRef.current.luxury = node; }}>
          <div className="section-heading">
            <p>Crafted for Excellence</p>
            <h2>The luxurious learning experience your campus deserves.</h2>
          </div>

          <div className="luxury-grid">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="luxury-card">
                <h3>{pillar.title}</h3>
                <p>{pillar.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="journey" ref={(node) => { sectionsRef.current.timeline = node; }}>
          <div className="section-heading">
            <p>From Setup to Mastery</p>
            <h2>Your premium path to academic momentum.</h2>
          </div>

          <div className="journey-timeline">
            {timeline.map((item) => (
              <article key={item.step} className="timeline-item">
                <span>{item.step}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="final-cta" ref={(node) => { sectionsRef.current.cta = node; }}>
          <div className="cta-shell">
            <p className="cta-mini">No hidden tiers. No compromise.</p>
            <h2>Enter the new era of elegant academic performance.</h2>
            <div className="cta-actions">
              <Link to="/register" className="btn solid big">Create Free Account</Link>
              <Link to="/login" className="btn ghost big">I already have access</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;