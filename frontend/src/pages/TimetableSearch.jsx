import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Search, Trash2 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

import { deleteSemesterTimetable, searchSemesterTimetables } from "../services/semesterTimetableService";

import "../styles/Timetable.css";

export default function TimetableSearch() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [batchType, setBatchType] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const run = async () => {
    setError("");
    setSuccess("");
    try {
      setLoading(true);
      const data = await searchSemesterTimetables({
        year: year === "" ? undefined : Number(year),
        semester: semester === "" ? undefined : Number(semester),
        batchType: batchType === "" ? undefined : batchType
      });
      setItems(data || []);
    } catch (e) {
      setError(e.message || "Failed to search timetables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    run();
  }, []);

  const onDelete = async (id) => {
    setError("");
    setSuccess("");
    try {
      await deleteSemesterTimetable(id);
      setSuccess("Deleted.");
      await run();
    } catch (e) {
      setError(e.message || "Failed to delete");
    }
  };

  return (
    <div className="tt-root" data-theme={theme}>
      <main className="tt-main">
        <div className="tt-topbar">
          <div className="tt-topbar__left">
            <button className="tt-back-btn" onClick={() => navigate("/timetable")} title="Back">
              <ArrowLeft size={18} />
            </button>
            <div className="tt-breadcrumb">
              <Link to="/timetable">Timetable</Link>
              <span style={{ opacity: 0.7, margin: "0 0.4rem" }}>/</span>
              <span className="active">Search</span>
            </div>
          </div>
          <div className="tt-flow-nav">
            <button className="tt-flow-nav__btn" type="button" onClick={() => navigate("/timetable/generate")}>
              <ArrowLeft size={16} />
              <span>Back: Generate</span>
            </button>
            <button className="tt-flow-nav__btn" type="button" onClick={() => navigate("/timetable")}>
              <span>Next: Home</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {error && <div className="tt-alert tt-alert-error"><span>{error}</span></div>}
        {success && <div className="tt-alert tt-alert-success"><span>{success}</span></div>}

        <section className="tt-panel">
          <div className="tt-card tt-card--full">
            <div className="tt-card__header">
              <div className="tt-card__header-info">
                <h3 className="tt-card__title"><Search size={18} /> Find timetables</h3>
                <p className="tt-card__desc">Search by year/semester and filter by weekday/weekend.</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
              <input id="search-year" name="year" className="tt-input" placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} />
              <input id="search-semester" name="semester" className="tt-input" placeholder="Semester" value={semester} onChange={(e) => setSemester(e.target.value)} />
              <select id="search-batch-type" name="batchType" className="tt-select" value={batchType} onChange={(e) => setBatchType(e.target.value)}>
                <option value="">All</option>
                <option value="WEEKDAY">Weekday</option>
                <option value="WEEKEND">Weekend</option>
              </select>
              <button className="tt-btn tt-btn-primary" onClick={run} disabled={loading}>
                <Search size={16} /> {loading ? "Searching…" : "Search"}
              </button>
            </div>

            <div style={{ marginTop: "1rem" }}>
              {loading ? (
                <p className="tt-label">Loading…</p>
              ) : items.length === 0 ? (
                <p className="tt-label">No timetables found.</p>
              ) : (
                <table className="tt-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Semester</th>
                      <th>Batch</th>
                      <th>Updated</th>
                      <th style={{ width: 160 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((t) => (
                      <tr key={t._id}>
                        <td>{t.year}</td>
                        <td>{t.semester}</td>
                        <td>{t.batchType}</td>
                        <td>{t.updatedAt ? new Date(t.updatedAt).toLocaleString() : "—"}</td>
                        <td style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          <button className="tt-btn tt-btn-outline tt-btn-sm" onClick={() => navigate(`/timetable/view/${t._id}`)}>
                            Open
                          </button>
                          <button className="tt-btn tt-btn-danger tt-btn-sm" onClick={() => onDelete(t._id)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

