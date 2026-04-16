import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTheme } from "../context/ThemeContext";
import { Database, Layers, Wand2, Search, ArrowLeft } from "lucide-react";
import { searchSemesterTimetables } from "../services/semesterTimetableService";

import "../styles/Timetable.css";

function canGenerateSemesterTimetable(role) {
  return role === "teacher" || role === "admin";
}

export default function TimetableHome() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const allowGenerate = canGenerateSemesterTimetable(user?.role);
  const [totalGenerated, setTotalGenerated] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStatsLoading(true);
        const data = await searchSemesterTimetables();
        if (!cancelled) {
          setTotalGenerated(Array.isArray(data) ? data.length : 0);
        }
      } catch {
        if (!cancelled) {
          setTotalGenerated(0);
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    {
      icon: <Database size={20} />,
      title: "Resources",
      desc: "Upload or manage lecture halls and labs.",
      to: "/timetable/resources"
    },
    {
      icon: <Layers size={20} />,
      title: "Modules",
      desc: "Define lectures/labs (duration, year, semester, batch).",
      to: "/timetable/modules"
    },
    {
      icon: <Wand2 size={20} />,
      title: "Generate",
      desc: "Generate a semester timetable from your inputs.",
      to: "/timetable/generate"
    },
    {
      icon: <Search size={20} />,
      title: "Search",
      desc: "Find and manage generated timetables.",
      to: "/timetable/search"
    },
  ];

  return (
    <div className="tt-root" data-theme={theme}>
      <main className="tt-main">
        <div className="tt-topbar">
          <div className="tt-topbar__left">
            <button className="tt-back-btn" onClick={() => navigate("/dashboard")} title="Back">
              <ArrowLeft size={18} />
            </button>
            <div className="tt-breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <span style={{ opacity: 0.7, margin: "0 0.4rem" }}>/</span>
              <span className="active">Timetable</span>
            </div>
          </div>
          <div className="tt-status-pill">
            <span className="tt-status-dot" />
            <span>University Timetable System</span>
          </div>
        </div>

        <section className="tt-hero">
          <div className="tt-hero__content">
            <span className="tt-hero__tag">University Timetable System</span>
            <h1 className="tt-hero__title">Generate & manage your semester timetable</h1>
            <p className="tt-hero__desc">
              Add your resources and modules, generate weekday/weekend timetables, edit slots, export as PDF, and search by year/semester.
            </p>
            <div className="tt-hero-metric" aria-live="polite">
              <span className="tt-hero-metric__label">Total Generated Timetables</span>
              <span className="tt-hero-metric__value">
                {statsLoading ? "..." : totalGenerated}
              </span>
            </div>
          </div>
        </section>

        <section className="tt-panel">
          <div className="tt-card tt-card--full">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              {cards.map((c) => {
                const isGenerate = c.to === "/timetable/generate";
                if (isGenerate && !allowGenerate) {
                  return (
                    <div
                      key={c.title}
                      className="tt-rec"
                      style={{
                        display: "block",
                        opacity: 0.55,
                        cursor: "not-allowed",
                        borderStyle: "dashed"
                      }}
                      title="Only lecturer or admin accounts can generate timetables."
                    >
                      <div className="tt-rec__type" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {c.icon} {c.title}
                      </div>
                      <div className="tt-rec__slot" style={{ fontSize: "1.05rem" }}>{c.desc}</div>
                      <div className="tt-rec__slot" style={{ fontSize: "0.85rem", marginTop: "0.35rem", opacity: 0.85 }}>
                        Lecturer accounts only
                      </div>
                    </div>
                  );
                }
                return (
                  <Link
                    key={c.title}
                    to={c.to}
                    className="tt-rec"
                    style={{ display: "block", textDecoration: "none", color: "inherit" }}
                  >
                    <div className="tt-rec__type" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {c.icon} {c.title}
                    </div>
                    <div className="tt-rec__slot" style={{ fontSize: "1.05rem" }}>{c.desc}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

