import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import {
  Brain, BookMarked, Users, Calendar, Share2, GraduationCap,
  LogOut, ArrowRight, Home as HomeIcon,
  Video, Target, TrendingUp, Plus,
  Sparkles, ChevronRight, BookOpen, Activity,
  Shield, LayoutDashboard, Waves, Zap, Radio,
} from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import * as THREE from "three";
import "../styles/Dashboard.css";
import "../styles/Notifications.css";
import { confirmAction } from "../utils/toast";

/* ═══════════════════════════════════════════════════════════
   DEEP OCEAN BIOLUMINESCENT — Three.js Background

   Layers:
   1. Dark abyss void floor (deep blue-black plane)
   2. Volumetric god-rays (additive cone geometry from above)
   3. Caustic light ripples on the seabed (animated UV displacement)
   4. Bioluminescent plankton clouds (point particles, pulsing)
   5. Jellyfish entities (instanced meshes rising upward)
   6. Floating bioluminescent strands (line segments)
   7. Depth haze layers (additive planes)
═══════════════════════════════════════════════════════════ */
function useOceanBackground(wrapRef, canvasReady) {
  useEffect(() => {
    if (!canvasReady || !wrapRef.current) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    wrapRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a2134);
    scene.fog = new THREE.FogExp2(0x0d2940, 0.0165);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);
    camera.position.set(0, 8, 55);
    camera.lookAt(0, 0, 0);

    /* ── 1. ABYSS FLOOR ──────────────────────────────── */
    const floorGeo = new THREE.PlaneGeometry(300, 300, 40, 40);
    // Slight undulation in vertices
    const fPos = floorGeo.attributes.position;
    for (let i = 0; i < fPos.count; i++) {
      const x = fPos.getX(i), z = fPos.getZ(i);
      fPos.setY(i, Math.sin(x * 0.08) * 0.8 + Math.cos(z * 0.06) * 0.6);
    }
    fPos.needsUpdate = true;
    floorGeo.computeVertexNormals();
    const floorMat = new THREE.MeshBasicMaterial({ color: 0x102d42 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -18;
    scene.add(floor);

    /* ── 2. GOD RAYS from above ──────────────────────── */
    const raysGroup = new THREE.Group();
    const RAY_COUNT = 7;
    for (let r = 0; r < RAY_COUNT; r++) {
      const rayGeo = new THREE.CylinderGeometry(0.05, 3 + Math.random() * 4, 60, 6, 1, true);
      const rayMat = new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.035 + Math.random() * 0.035,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ray = new THREE.Mesh(rayGeo, rayMat);
      ray.position.set(
        (Math.random() - 0.5) * 60,
        10,
        (Math.random() - 0.5) * 30 - 10
      );
      ray.rotation.z = (Math.random() - 0.5) * 0.15;
      ray.rotation.x = (Math.random() - 0.5) * 0.1;
      raysGroup.add(ray);
    }
    scene.add(raysGroup);

    /* ── 3. CAUSTIC RIPPLE PATCHES on floor ──────────── */
    const causticGroup = new THREE.Group();
    causticGroup.position.y = -17.5;
    for (let c = 0; c < 12; c++) {
      const size = 4 + Math.random() * 10;
      const geo = new THREE.PlaneGeometry(size, size, 1, 1);
      const col = Math.random() > 0.5 ? 0x7dd3fc : 0x60a5fa;
      const mat = new THREE.MeshBasicMaterial({
        color: col, transparent: true,
        opacity: 0.055 + Math.random() * 0.06,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      });
      const m = new THREE.Mesh(geo, mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set((Math.random() - 0.5) * 80, 0, (Math.random() - 0.5) * 60);
      causticGroup.add(m);
    }
    scene.add(causticGroup);

    /* ── 4. BIOLUMINESCENT PLANKTON ─────────────────── */
    const PLANKTON = 4500;
    const plankGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(PLANKTON * 3);
    const pCol = new Float32Array(PLANKTON * 3);
    const pPhase = new Float32Array(PLANKTON);  // per-particle phase offset
    const cc = new THREE.Color();

    for (let i = 0; i < PLANKTON; i++) {
      pPos[i*3]   = (Math.random() - 0.5) * 100;
      pPos[i*3+1] = -18 + Math.random() * 45;
      pPos[i*3+2] = (Math.random() - 0.5) * 80;
      pPhase[i]   = Math.random() * Math.PI * 2;
      // Mix of teal and cyan
      const isTeal = Math.random() > 0.4;
      cc.setHSL(isTeal ? 0.47 : 0.58, 1, 0.55 + Math.random() * 0.25);
      pCol[i*3]=cc.r; pCol[i*3+1]=cc.g; pCol[i*3+2]=cc.b;
    }

    plankGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    plankGeo.setAttribute('color',    new THREE.BufferAttribute(pCol, 3));
    const plankMat = new THREE.PointsMaterial({
      size: 0.18, vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false, transparent: true, opacity: 0.7,
      sizeAttenuation: true,
    });
    const plankton = new THREE.Points(plankGeo, plankMat);
    scene.add(plankton);

    /* ── 5. JELLYFISH — instanced spheres ────────────── */
    // Each jellyfish = a dim glowing sphere + bell shape
    const jellyCount = 18;
    const jellyData = [];

    for (let j = 0; j < jellyCount; j++) {
      const grp = new THREE.Group();
      const hue = Math.random() > 0.5 ? 0.47 : 0.6; // teal or blue
      const col = new THREE.Color().setHSL(hue, 1, 0.55);

      // Bell body
      const bellGeo = new THREE.SphereGeometry(0.6 + Math.random() * 0.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const bellMat = new THREE.MeshBasicMaterial({
        color: col, transparent: true, opacity: 0.15 + Math.random() * 0.12,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      });
      const bell = new THREE.Mesh(bellGeo, bellMat);
      grp.add(bell);

      // Glow core
      const glowGeo = new THREE.SphereGeometry(0.25, 8, 8);
      const glowMat = new THREE.MeshBasicMaterial({
        color: col, transparent: true, opacity: 0.6,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      grp.add(new THREE.Mesh(glowGeo, glowMat));

      // Trailing tentacles (lines)
      for (let t = 0; t < 5; t++) {
        const len = 2 + Math.random() * 4;
        const ang = (t / 5) * Math.PI * 2 + Math.random() * 0.4;
        const pts = [];
        for (let s = 0; s <= 8; s++) {
          const progress = s / 8;
          pts.push(new THREE.Vector3(
            Math.cos(ang) * 0.3 * (1 - progress) + Math.sin(progress * Math.PI * 2) * 0.1,
            -len * progress,
            Math.sin(ang) * 0.3 * (1 - progress)
          ));
        }
        const tGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const tMat = new THREE.LineBasicMaterial({
          color: col, transparent: true, opacity: 0.3,
          blending: THREE.AdditiveBlending, depthWrite: false,
        });
        grp.add(new THREE.Line(tGeo, tMat));
      }

      grp.position.set(
        (Math.random() - 0.5) * 80,
        -18 + Math.random() * 40,
        (Math.random() - 0.5) * 60
      );
      grp.userData = {
        speed: 0.008 + Math.random() * 0.012,
        drift: (Math.random() - 0.5) * 0.006,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 1.5 + Math.random() * 2,
        bellMat, glowMat,
      };
      scene.add(grp);
      jellyData.push(grp);
    }

    /* ── 6. BIOLUMINESCENT STRANDS (floating tendrils) ─ */
    const strandGroup = new THREE.Group();
    for (let s = 0; s < 20; s++) {
      const pts = [];
      const origin = new THREE.Vector3(
        (Math.random() - 0.5) * 80, -18 + Math.random() * 30, (Math.random() - 0.5) * 60
      );
      const segments = 12 + Math.floor(Math.random() * 8);
      for (let p = 0; p < segments; p++) {
        pts.push(new THREE.Vector3(
          origin.x + Math.sin(p * 0.5) * 1.5,
          origin.y + p * 0.8,
          origin.z + Math.cos(p * 0.4) * 1.2
        ));
      }
      const sGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const col = new THREE.Color().setHSL(Math.random() > 0.5 ? 0.47 : 0.55, 1, 0.5);
      const sMat = new THREE.LineBasicMaterial({
        color: col, transparent: true, opacity: 0.2 + Math.random() * 0.2,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      strandGroup.add(new THREE.Line(sGeo, sMat));
    }
    scene.add(strandGroup);

    /* ── 7. DEPTH HAZE LAYERS ─────────────────────────── */
    const hazeColors = [0x1e3a5f, 0x1f4f54, 0x173b5f];
    hazeColors.forEach((col, hi) => {
      const geo = new THREE.PlaneGeometry(200, 100);
      const mat = new THREE.MeshBasicMaterial({
        color: col, transparent: true, opacity: 0.12 - hi * 0.03,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      });
      const m = new THREE.Mesh(geo, mat);
      m.rotation.x = -Math.PI * 0.05 * (hi + 1);
      m.position.set(0, -8 + hi * 5, -20 - hi * 8);
      scene.add(m);
    });

    /* ── ANIMATION LOOP ──────────────────────────────── */
    let frame = 0, animId;
    const plankPos = plankton.geometry.attributes.position;

    const animate = () => {
      frame++;
      const t = frame * 0.001;

      /* Camera — gentle drift, looking slightly up into water column */
      camera.position.x = Math.sin(t * 0.15) * 10;
      camera.position.z = 55 + Math.sin(t * 0.09) * 8;
      camera.position.y = 8 + Math.sin(t * 0.2) * 3;
      camera.lookAt(0, 2, 0);

      /* Plankton — drift upward, loop, pulse brightness */
      for (let i = 0; i < PLANKTON; i++) {
        plankPos.array[i*3]   += Math.sin(t * 1.2 + pPhase[i]) * 0.004;
        plankPos.array[i*3+1] += 0.006 + Math.sin(pPhase[i] * 3) * 0.003;
        plankPos.array[i*3+2] += Math.cos(t * 0.9 + pPhase[i]) * 0.004;
        if (plankPos.array[i*3+1] > 28) {
          plankPos.array[i*3+1] = -18;
          plankPos.array[i*3]   = (Math.random() - 0.5) * 100;
          plankPos.array[i*3+2] = (Math.random() - 0.5) * 80;
        }
      }
      plankPos.needsUpdate = true;
      plankMat.opacity = 0.55 + Math.sin(t * 2.5) * 0.15;

      /* Jellyfish — rise, pulse, sway */
      jellyData.forEach((jelly, ji) => {
        const d = jelly.userData;
        jelly.position.y += d.speed;
        jelly.position.x += Math.sin(t * d.pulseSpeed + d.phase) * d.drift;
        jelly.rotation.y += 0.002;
        // Bell pulse (scale y)
        jelly.children[0].scale.y = 0.85 + Math.sin(t * d.pulseSpeed * 2 + d.phase) * 0.15;
        // Glow pulse
        d.glowMat.opacity = 0.4 + Math.sin(t * d.pulseSpeed * 1.5 + d.phase) * 0.3;
        d.bellMat.opacity = 0.1 + Math.sin(t * d.pulseSpeed + d.phase) * 0.08;
        // Reset when they float too high
        if (jelly.position.y > 28) {
          jelly.position.y = -18;
          jelly.position.x = (Math.random() - 0.5) * 80;
          jelly.position.z = (Math.random() - 0.5) * 60;
        }
      });

      /* God rays — slow oscillation + opacity flicker */
      raysGroup.children.forEach((ray, ri) => {
        ray.material.opacity = 0.02 + Math.sin(t * 0.8 + ri * 0.9) * 0.018;
        ray.position.x += Math.sin(t * 0.3 + ri) * 0.008;
      });

      /* Caustic ripples — scale + opacity pulse */
      causticGroup.children.forEach((c, ci) => {
        const sc = 0.9 + Math.sin(t * 2 + ci * 0.7) * 0.2;
        c.scale.set(sc, sc, 1);
        c.material.opacity = 0.02 + Math.sin(t * 2.5 + ci) * 0.04;
      });

      /* Strands — gentle sway */
      strandGroup.children.forEach((strand, si) => {
        strand.rotation.z = Math.sin(t * 0.5 + si * 0.3) * 0.05;
        strand.material.opacity = 0.15 + Math.sin(t * 1.5 + si) * 0.1;
      });

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (wrapRef.current?.contains(renderer.domElement))
        wrapRef.current.removeChild(renderer.domElement);
    };
  }, [canvasReady]);
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD COMPONENT
═══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user, isAuthenticated } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [now, setNow] = useState(new Date());

  // Callback ref to detect when canvas div mounts
  const canvasRefCallback = (node) => {
    wrapRef.current = node;
    if (node) setCanvasReady(true);
  };

  useOceanBackground(wrapRef, canvasReady);

  useEffect(() => { if (!isAuthenticated) navigate("/login"); }, [isAuthenticated, navigate]);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

  const handleLogout = async () => {
    const confirmed = await confirmAction("Are you sure you want to log out?", {
      confirmText: "Log out",
    });
    if (!confirmed) return;

    dispatch(logout());
    navigate("/login");
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
  };

  if (!user) return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', background:'#010810',
      color:'#00f5c4', fontFamily:'Inter, sans-serif',
      fontSize:'1rem', letterSpacing:'.05em',
    }}>
      Loading...
    </div>
  );

  /* ── Data ── */
  const primaryModules = [
    {
      icon: <Brain size={20} />, title: "AI Timetable",
      desc: "Generate practical weekly plans, reduce clashes, and keep your routine aligned with deadlines.",
      chips: ["AI Powered","Calendar Sync","Adaptive"],
      color: "#2a9d8f", gradient: "linear-gradient(135deg,#2a9d8f,#1f7a71)",
      pillColor: "#2a9d8f", pillBg: "rgba(42,157,143,.15)", pillBorder: "rgba(42,157,143,.3)",
      pill: "Core", path: "/timetable",
    },
    {
      icon: <BookMarked size={20} />, title: "Notes & Kuppi",
      desc: "Organize personal notes, discover shared content, and run focused peer sessions quickly.",
      chips: ["OneDrive","Kuppi","Social"],
      color: "#3b82f6", gradient: "linear-gradient(135deg,#3b82f6,#2563eb)",
      pillColor: "#3b82f6", pillBg: "rgba(59,130,246,.15)", pillBorder: "rgba(59,130,246,.3)",
      pill: "Available", path: "/notes",
    },
    {
      icon: <Users size={20} />, title: "Study Groups",
      desc: "Coordinate tasks in one place with faster communication and cleaner group collaboration.",
      chips: ["Channels","Polls","Collaboration"],
      color: "#2a9d8f", gradient: "linear-gradient(135deg,#2a9d8f,#256f66)",
      pillColor: "#2a9d8f", pillBg: "rgba(42,157,143,.12)", pillBorder: "rgba(42,157,143,.25)",
      pill: "Available", path: "/groups",
    },
  ];

  const secondaryModules = [
    { icon:<Target size={17}/>, title:"Exam Mode", desc:"Structured exam preparation plans", color:"#2a9d8f", gradient:"linear-gradient(135deg,#2a9d8f,#1f7a71)", pill:"New", path:"/exam-mode" },
    { icon:<Calendar size={17}/>, title:"Calendar", desc:"Events and study checkpoints", color:"#3b82f6", gradient:"linear-gradient(135deg,#3b82f6,#2563eb)", pill:null, path:"/calendar" },
    { icon:<Share2 size={17}/>, title:"File Share", desc:"Fast resource sharing with peers", color:"#2a9d8f", gradient:"linear-gradient(135deg,#3ea89a,#2a7d73)", pill:null, path:"/files" },
  ];

  const stats = [
    { icon:<BookOpen size={16}/>, val:"24", lbl:"Notes Shared",  trend:"+12% this week", ac:"#00f5c4" },
    { icon:<Users size={16}/>,    val:"5",  lbl:"Study Groups",  trend:"2 active now",   ac:"#00aaff" },
    { icon:<Calendar size={16}/>, val:"8",  lbl:"Events Today",  trend:"Next at 2 PM",   ac:"#7fffd4" },
    { icon:<Target size={16}/>,   val:"12", lbl:"Active Tasks",  trend:"3 due soon",     ac:"#00ccff" },
  ];

  const quickActions = [
    { icon:<Plus size={13}/>,       label:"New Timetable", path:"/timetable", primary:true },
    { icon:<BookMarked size={13}/>, label:"Share Notes",   path:"/notes" },
    { icon:<Video size={13}/>,      label:"Create Kuppi",  path:"/kuppi" },
    { icon:<Users size={13}/>,      label:"New Group",     path:"/groups" },
  ];

  const navLinks = [
    { icon:<HomeIcon size={14}/>,        label:"Home",       path:"/" },
    { icon:<LayoutDashboard size={14}/>, label:"Dashboard",  path:"/dashboard", active:true },
    { icon:<Brain size={14}/>,           label:"Timetable",  path:"/timetable" },
    { icon:<BookMarked size={14}/>,      label:"Notes",      path:"/notes" },
    { icon:<Video size={14}/>,           label:"Kuppi",      path:"/kuppi" },
    { icon:<Users size={14}/>,           label:"Groups",     path:"/groups" },
  ];

  const shortcuts = [
    { label: "Open Timetable", path: "/timetable" },
    { label: "Open Notes", path: "/notes" },
    { label: "Create Kuppi", path: "/kuppi" },
  ];

  return (
    <div className="db-root dashboard-page">
      {/* Canvas */}
      <div className="db-canvas-wrap" ref={canvasRefCallback} />
      <div className="db-overlay-vignette" />
      <div className="db-overlay-scan" />

      {/* HUD corner brackets */}
      <div className="db-hud-br db-hud-br--tl" />
      <div className="db-hud-br db-hud-br--tr" />
      <div className="db-hud-br db-hud-br--bl" />
      <div className="db-hud-br db-hud-br--br" />

      <div className="db-layout">

        {/* ── Navbar ── */}
        <nav className="db-nav">
          <div className="db-nav__inner">
            <Link to="/dashboard" className="db-brand">
              <div className="db-brand__mark">
                <Waves size={16} color="#00f5c4" />
              </div>
              <div>
                <div className="db-brand__name">Smart Campus</div>
                <div className="db-brand__sub">Student Collaboration Hub</div>
              </div>
            </Link>

            <div className="db-nav__links">
              {navLinks.map((l, i) => (
                <Link key={i} to={l.path} className={`db-nav__link${l.active ? " db-nav__link--active" : ""}`}>
                  {l.icon}<span>{l.label}</span>
                </Link>
              ))}
            </div>

            <div className="db-nav__right">
              <NotificationBell />
              <button className="db-top-btn" onClick={() => navigate("/profile")}>My Profile</button>
              <button className="db-top-btn db-top-btn--danger" onClick={handleLogout}>
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </nav>

        {/* ── Main ── */}
        <main className="db-main">

          {/* Hero */}
          <section className="db-hero db-hero--modern">
            <div className="db-hero__left">
              <div className="db-hero__sys">{getGreeting()}</div>
              <h1 className="db-hero__name">{user.name}</h1>
              <p className="db-hero__sub">
                All your study tools are centralized here. Track your progress, access resources, and move quickly through your day.
              </p>
              <div className="db-hero__badges">
                <span className="db-badge"><GraduationCap size={10} />{user.role}</span>
                {user.department && <span className="db-badge"><Radio size={10} />{user.department}</span>}
                {user.year && <span className="db-badge"><Activity size={10} />Year {user.year}</span>}
                {user.studentId && <span className="db-badge"><Shield size={10} />{user.studentId}</span>}
              </div>
              <div className="db-shortcuts">
                {shortcuts.map((item) => (
                  <button key={item.path} className="db-shortcut-btn" onClick={() => navigate(item.path)}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="db-clock">
              <div className="db-clock__label">Current Time</div>
              <div className="db-clock__time">
                {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </div>
              <div className="db-clock__date">
                {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="db-stats">
            {stats.map((s, i) => (
              <div key={i} className="db-stat hover-glow" style={{ "--ac": s.ac }}>
                <div className="db-stat__icon">{s.icon}</div>
                <div>
                  <div className="db-stat__val">{s.val}</div>
                  <div className="db-stat__lbl">{s.lbl}</div>
                </div>
                <div className="db-stat__trend"><TrendingUp size={9} />{s.trend}</div>
              </div>
            ))}
          </section>

          {/* Grid */}
          <div className="db-grid">
            <div className="db-grid-left">
              {/* Primary */}
              <div className="db-sec-head">
                <span className="db-sec-title">Core Modules</span>
                <span className="db-sec-count">{primaryModules.length} Active</span>
              </div>
              <div className="db-cards-p">
                {primaryModules.map((m, i) => (
                  <Link key={i} to={m.path} className="db-card-p card-shine hover-glow">
                    <div className="db-card-p__head">
                      <div className="db-card-p__icon" style={{ background: m.gradient }}>
                        {m.icon}
                      </div>
                      <span className="db-card-p__pill" style={{
                        color: m.pillColor,
                        background: m.pillBg,
                        borderColor: m.pillBorder,
                      }}>{m.pill}</span>
                    </div>
                    <div className="db-card-p__title">{m.title}</div>
                    <div className="db-card-p__desc">{m.desc}</div>
                    <div className="db-card-p__chips">
                      {m.chips.map((c, ci) => (
                        <span key={ci} className="db-chip"><Zap size={8} /> {c}</span>
                      ))}
                    </div>
                    <div className="db-card-p__foot">
                      <span className="db-card-p__status">
                        <span className="bio-dot" /> Ready
                      </span>
                      <ArrowRight size={14} className="db-card-p__arrow" />
                    </div>
                  </Link>
                ))}
              </div>

              {/* Secondary */}
              <div className="db-sec-head" style={{ marginTop: "1.4rem" }}>
                <span className="db-sec-title">More Tools</span>
              </div>
              <div className="db-cards-s db-cards-s--modern">
                {secondaryModules.map((m, i) => (
                  <Link key={i} to={m.path} className="db-card-row card-shine hover-glow">
                    <div className="db-card-row__icon" style={{ background: m.gradient }}>{m.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div className="db-card-row__title">
                        {m.title}
                        {m.pill && (
                          <span className="db-card-p__pill" style={{
                            fontSize: "8px", padding: "2px 6px",
                            color: m.color,
                            background: `${m.color}18`,
                            borderColor: `${m.color}35`,
                          }}>{m.pill}</span>
                        )}
                      </div>
                      <div className="db-card-row__desc">{m.desc}</div>
                    </div>
                    <ChevronRight size={14} className="db-card-row__arrow" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="db-sidebar db-sidebar--modern">
              <div className="db-side-card uiverse-glass">
                <div className="db-side-title">Quick Actions</div>
                <div className="db-qa-list">
                  {quickActions.map((a, i) => (
                    <button key={i}
                      className={`db-qa-btn${a.primary ? " db-qa-btn--primary" : ""}`}
                      onClick={() => navigate(a.path)}>
                      {a.icon}<span>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="db-side-card uiverse-glass">
                <div className="db-side-title">Upcoming Events</div>
                <div className="db-empty">
                  <Calendar size={24} strokeWidth={1.2} className="db-empty__icon" />
                  <div className="db-empty__title">No Upcoming Events</div>
                  <div className="db-empty__sub">Your schedule is clear</div>
                </div>
              </div>

              <div className="db-side-card uiverse-glass">
                <div className="db-side-head-row">
                  <div className="db-side-title" style={{ marginBottom: 0 }}>Recent Activity</div>
                  <Link to="/notifications" className="db-side-link">View All <ChevronRight size={10} /></Link>
                </div>
                <div className="db-empty">
                  <Sparkles size={24} strokeWidth={1.2} className="db-empty__icon" />
                  <div className="db-empty__title">No Recent Activity</div>
                  <div className="db-empty__sub">You're all caught up</div>
                </div>
              </div>
            </aside>
          </div>

        </main>
      </div>
    </div>
  );
}