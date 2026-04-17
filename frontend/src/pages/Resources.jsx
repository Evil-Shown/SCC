import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { ArrowLeft, ArrowRight, Upload, Trash2, Plus, Save } from "lucide-react";

import {
  createResource,
  deleteAllResources,
  deleteResource,
  importResourcesFromFile,
  listResources,
  updateResource
} from "../services/resourceService";

import "../styles/Timetable.css";

const emptyForm = { name: "", resourceType: "LECTURE_HALL", location: "" };

export default function Resources() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const fileRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [importFile, setImportFile] = useState(null);

  const refresh = async () => {
    const data = await listResources();
    setResources(data || []);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await refresh();
      } catch (e) {
        setError(e.message || "Failed to load resources");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onCreate = async () => {
    setError("");
    setSuccess("");
    if (!form.name.trim()) {
      setError("Resource name is required.");
      return;
    }
    try {
      setSaving(true);
      await createResource({
        name: form.name,
        resourceType: form.resourceType,
        location: form.location
      });
      setForm(emptyForm);
      await refresh();
      setSuccess("Resource created.");
    } catch (e) {
      setError(e.message || "Failed to create resource");
    } finally {
      setSaving(false);
    }
  };

  const onUpdateInline = async (id, patch) => {
    setError("");
    setSuccess("");
    try {
      await updateResource(id, patch);
      await refresh();
      setSuccess("Resource updated.");
    } catch (e) {
      setError(e.message || "Failed to update resource");
    }
  };

  const onDelete = async (id) => {
    setError("");
    setSuccess("");
    try {
      setDeletingId(id);
      await deleteResource(id);
      await refresh();
      setSuccess("Resource deleted.");
    } catch (e) {
      setError(e.message || "Failed to delete resource");
    } finally {
      setDeletingId("");
    }
  };

  const onDeleteAll = async () => {
    setError("");
    setSuccess("");
    const ok = window.confirm("Delete ALL lecture halls and labs? This will also remove related timetable slots.");
    if (!ok) return;

    try {
      setDeletingAll(true);
      const result = await deleteAllResources();
      await refresh();
      setSuccess(`Deleted all resources (${result?.resourcesDeleted ?? 0}) and related slots (${result?.slotsDeleted ?? 0}).`);
    } catch (e) {
      setError(e.message || "Failed to delete all resources");
    } finally {
      setDeletingAll(false);
    }
  };

  const onImport = async () => {
    setError("");
    setSuccess("");
    if (!importFile) {
      setError("Choose a PDF or image first.");
      return;
    }
    try {
      setImporting(true);
      const data = await importResourcesFromFile({ file: importFile });
      setResources(data.resources || []);
      setImportFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setSuccess(`Imported. New resources: ${data.created ?? 0}.`);
    } catch (e) {
      setError(e.message || "Failed to import resources");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="tt-root" data-theme={theme}>
      <main className="tt-main">
        <div className="tt-topbar">
          <div className="tt-topbar__left">
            <button className="tt-back-btn" onClick={() => navigate("/timetable")} title="Back to Timetable">
              <ArrowLeft size={18} />
            </button>
            <div className="tt-breadcrumb">
              <Link to="/timetable">Timetable</Link>
              <span style={{ opacity: 0.7, margin: "0 0.4rem" }}>/</span>
              <span className="active">Resources</span>
            </div>
          </div>
          <div className="tt-flow-nav">
            <button className="tt-flow-nav__btn" type="button" onClick={() => navigate("/timetable")}>
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button className="tt-flow-nav__btn tt-flow-nav__btn--primary" type="button" onClick={() => navigate("/timetable/modules")}>
              <span>Next: Modules</span>
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
                <h3 className="tt-card__title">Lecture halls & labs</h3>
                <p className="tt-card__desc">Upload a PDF/image or manage resources manually.</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <div className="tt-form-group">
                  <label className="tt-label">Import (PDF/Image)</label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                  <button className="tt-btn tt-btn-primary" onClick={onImport} disabled={importing}>
                    <Upload size={16} /> {importing ? "Importing…" : "Import resources"}
                  </button>
                </div>
              </div>

              <div>
                <div className="tt-form-group">
                  <label className="tt-label">Add resource</label>
                  <input id="resource-name" name="resourceName" className="tt-input" placeholder="Name (e.g. LH-A1, Lab 2)" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                  <select id="resource-type" name="resourceType" className="tt-select" value={form.resourceType} onChange={(e) => setForm((p) => ({ ...p, resourceType: e.target.value }))}>
                    <option value="LECTURE_HALL">Lecture hall</option>
                    <option value="LAB">Lab</option>
                  </select>
                  <input id="resource-location" name="location" className="tt-input" placeholder="Location (optional)" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
                  <button className="tt-btn tt-btn-outline" onClick={onCreate} disabled={saving}>
                    <Plus size={16} /> {saving ? "Saving…" : "Create"}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
                <button
                  className="tt-btn tt-btn-danger"
                  onClick={onDeleteAll}
                  disabled={deletingAll || loading || resources.length === 0}
                >
                  <Trash2 size={16} /> {deletingAll ? "Deleting all..." : "Delete all resources"}
                </button>
              </div>
              {loading ? (
                <p className="tt-label">Loading…</p>
              ) : resources.length === 0 ? (
                <p className="tt-label">No resources yet.</p>
              ) : (
                <table className="tt-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Location</th>
                      <th style={{ width: 120 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map((r) => (
                      <tr key={r._id}>
                        <td>
                          <input
                            className="tt-input"
                            defaultValue={r.name}
                            onBlur={(e) => e.target.value !== r.name && onUpdateInline(r._id, { name: e.target.value })}
                          />
                        </td>
                        <td>
                          <select
                            className="tt-select"
                            defaultValue={r.resourceType}
                            onChange={(e) => onUpdateInline(r._id, { resourceType: e.target.value })}
                          >
                            <option value="LECTURE_HALL">Lecture hall</option>
                            <option value="LAB">Lab</option>
                          </select>
                        </td>
                        <td>
                          <input
                            className="tt-input"
                            defaultValue={r.location || ""}
                            onBlur={(e) => (e.target.value || "") !== (r.location || "") && onUpdateInline(r._id, { location: e.target.value })}
                          />
                        </td>
                        <td style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          <button className="tt-btn tt-btn-outline tt-btn-sm" onClick={() => onUpdateInline(r._id, {})} title="Refresh">
                            <Save size={14} />
                          </button>
                          <button
                            className="tt-btn tt-btn-danger tt-btn-sm"
                            onClick={() => onDelete(r._id)}
                            title="Delete"
                            disabled={deletingId === r._id}
                          >
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

