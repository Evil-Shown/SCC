import { useRef, useState } from "react";
import * as fileService from "../../services/fileService";
import { Upload, File, Download, Trash2, FileText, Image, Archive, Code } from "lucide-react";
import LoadingSpinner from "../LoadingSpinner";

// ── File-type icon helper ──────────────────────────────────────
function FileIcon({ name }) {
    const ext = (name || "").split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext))
        return <Image size={20} style={{ color: "#ec4899" }} />;
    if (["zip", "rar", "tar", "gz"].includes(ext))
        return <Archive size={20} style={{ color: "#f59e0b" }} />;
    if (["js", "ts", "jsx", "tsx", "py", "java", "cpp", "c", "html", "css", "json"].includes(ext))
        return <Code size={20} style={{ color: "#06b6d4" }} />;
    if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(ext))
        return <FileText size={20} style={{ color: "#10b981" }} />;
    return <File size={20} style={{ color: "var(--color-primary-500)" }} />;
}

// ── Format bytes ───────────────────────────────────────────────
function fmtSize(bytes) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ── FilesTab ───────────────────────────────────────────────────
function FilesTab({ groupId, currentUserId, isAdmin }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState({});
    const fileInputRef = useRef(null);

    // Load once on mount
    if (!loaded && !loading) {
        setLoading(true);
        fileService.getFiles(groupId)
            .then((res) => {
                setFiles(res?.data?.files || []);
                setLoaded(true);
            })
            .catch(() => setFiles([]))
            .finally(() => setLoading(false));
    }

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            await fileService.uploadFile(groupId, file);
            const res = await fileService.getFiles(groupId);
            setFiles(res?.data?.files || []);
        } catch (err) { console.error(err); }
        finally { setUploading(false); e.target.value = ""; }
    };

    const handleDownload = async (fileId, filename) => {
        try {
            const blob = await fileService.downloadFile(fileId);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = filename; a.click();
            URL.revokeObjectURL(url);
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (fileId) => {
        setDeleting((p) => ({ ...p, [fileId]: true }));
        try {
            await fileService.deleteFile(fileId);
            setFiles((prev) => prev.filter((f) => f._id !== fileId));
        } catch (err) { console.error(err); }
        finally { setDeleting((p) => ({ ...p, [fileId]: false })); }
    };

    return (
        <div className="ft-root">
            {/* ── Header ── */}
            <div className="ft-header">
                <div>
                    <h3 className="ft-title">Shared Files</h3>
                    <p className="ft-subtitle">
                        {files.length} file{files.length !== 1 ? "s" : ""} · upload documents, notes, and resources
                    </p>
                </div>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? "Uploading…" : <><Upload size={15} /> Upload File</>}
                </button>
                <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleUpload} />
            </div>

            {/* ── Content ── */}
            {loading ? (
                <LoadingSpinner text="Loading files…" />
            ) : files.length === 0 ? (
                <div className="ft-empty">
                    <div className="ft-empty-icon">
                        <File size={48} strokeWidth={1} />
                    </div>
                    <h4 className="ft-empty-title">No files yet</h4>
                    <p className="ft-empty-sub">
                        Upload documents, notes, and resources to share with your group
                    </p>
                    <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
                        <Upload size={16} /> Upload First File
                    </button>
                </div>
            ) : (
                <div className="ft-list">
                    {files.map((file) => {
                        const name = file.originalName || file.filename;
                        const canDelete = isAdmin || (file.uploadedBy?._id || file.uploadedBy) === currentUserId;
                        return (
                            <div key={file._id} className="ft-row">
                                <div className="ft-row-icon">
                                    <FileIcon name={name} />
                                </div>
                                <div className="ft-row-info">
                                    <span className="ft-row-name" title={name}>{name}</span>
                                    <span className="ft-row-meta">
                                        {fmtSize(file.size)}
                                        {file.uploadedBy?.name && ` · by ${file.uploadedBy.name}`}
                                        {file.createdAt && ` · ${new Date(file.createdAt).toLocaleDateString()}`}
                                    </span>
                                </div>
                                <div className="ft-row-actions">
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => handleDownload(file._id, name)}
                                        title="Download"
                                    >
                                        <Download size={14} />
                                    </button>
                                    {canDelete && (
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDelete(file._id)}
                                            disabled={deleting[file._id]}
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default FilesTab;
