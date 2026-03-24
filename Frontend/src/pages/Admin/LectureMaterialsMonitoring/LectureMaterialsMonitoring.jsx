import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./LectureMaterialsMonitoring.css";
import { apiUrl } from "../../../utils/api";
import { openMaterialUrl } from "../../../utils/materialLinks";

function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase() || "FA";
}

function LectureMaterialsMonitoring() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readOnly, setReadOnly] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const loadMaterials = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError("");
    setReadOnly(false);
    try {
      const response = await fetch(apiUrl("/admin/materials"));
      if (response.ok) {
        const data = await response.json();
        if (!data.success) throw new Error(data.message || "Admin materials fetch failed");
        setMaterials(data.data || []);
        return;
      }
      throw new Error(`Admin materials endpoint unavailable (HTTP ${response.status})`);
    } catch (err) {
      try {
        const fallbackResponse = await fetch(apiUrl("/student/materials"));
        const fallbackData = await fallbackResponse.json();
        setMaterials(
          fallbackResponse.ok && fallbackData.success ? fallbackData.data || [] : []
        );
        setReadOnly(true);
      } catch {
        setError(err.message || "Unable to load lecture materials.");
      }
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMaterials();
    const timer = setInterval(() => loadMaterials(false), 8000);
    return () => clearInterval(timer);
  }, [loadMaterials]);

  const rows = useMemo(() => {
    return materials.map((m) => ({
      id: m.id,
      faculty: m.facultyName || m.faculty_name || m.faculty || "Faculty",
      department: m.department || m.department_name || "N/A",
      course: m.course || m.course_name || "-",
      lesson: m.lessonPlanTitle || m.title || m.unit_name || "Unit",
      lessonNumber: m.lessonPlanNumber || m.unit_number || "-",
      pdf: m.pdfUrl || m.pdf_url || "",
      video: m.videoUrl || m.video_url || "",
      discourse: m.discourseUrl || m.discourse_url || "",
      date: m.uploadedAt || m.upload_date || m.date || "-",
      status: m.status || m.approval_status || "Approved",
    }));
  }, [materials]);

  const stats = useMemo(() => ({
    total: rows.length,
    pending: rows.filter((r) => r.status === "Pending").length,
    approved: rows.filter((r) => r.status === "Approved").length,
    rejected: rows.filter((r) => r.status === "Rejected").length,
  }), [rows]);

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const matchStatus = statusFilter === "All" || r.status === statusFilter;
      const matchSearch =
        !q ||
        r.faculty.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.course.toLowerCase().includes(q) ||
        r.lesson.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [rows, search, statusFilter]);

  const updateMaterialStatus = (id, status, reason) => {
    setMaterials((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, approval_status: status, status, admin_feedback: reason || "" } : m
      )
    );
  };

  const handleOpenMaterial = async (url, label) => {
    if (!url) return;
    try {
      await openMaterialUrl(url);
    } catch (error) {
      setError(`Unable to open ${label}.`);
    }
  };

  const handleApprove = async (id) => {
    if (readOnly) return;
    setActionLoading(id);
    try {
      const response = await fetch(apiUrl(`/admin/materials/${id}/approve`), { method: "PUT" });
      if (!response.ok) throw new Error("Approval failed");
      updateMaterialStatus(id, "Approved");
    } catch {
      setError("Failed to approve material.");
    } finally {
      setActionLoading("");
    }
  };

  const handleReject = (material) => {
    if (readOnly) return;
    setRejecting(material);
    setRejectReason("");
  };

  const submitReject = async () => {
    if (!rejecting) return;
    if (!rejectReason.trim()) { setError("Rejection reason is required."); return; }
    setActionLoading(rejecting.id);
    try {
      const response = await fetch(apiUrl(`/admin/materials/${rejecting.id}/reject`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!response.ok) throw new Error("Rejection failed");
      updateMaterialStatus(rejecting.id, "Rejected", rejectReason);
      setRejecting(null);
      setRejectReason("");
    } catch {
      setError("Failed to reject material.");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <div className="lm-page">

      {/* ── HEADER ── */}
      <div className="lm-header">
        <div className="lm-header-left">
          <h1>Lecture Materials Monitoring</h1>
          <p>Review, approve or reject faculty uploads and keep records updated.</p>
        </div>
        <div className="lm-header-actions">
          {readOnly && <span className="lm-hint">Read-only</span>}
          <button className="lm-refresh" onClick={() => loadMaterials()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="lm-stats">
        <div className="lm-stat-card total">
          <div className="lm-stat-label">Total Uploads</div>
          <div className="lm-stat-value">{stats.total}</div>
          <div className="lm-stat-sub">All materials</div>
        </div>
        <div className="lm-stat-card pending">
          <div className="lm-stat-label">Pending Review</div>
          <div className="lm-stat-value">{stats.pending}</div>
          <div className="lm-stat-sub">Awaiting action</div>
        </div>
        <div className="lm-stat-card approved">
          <div className="lm-stat-label">Approved</div>
          <div className="lm-stat-value">{stats.approved}</div>
          <div className="lm-stat-sub">Published to students</div>
        </div>
        <div className="lm-stat-card rejected">
          <div className="lm-stat-label">Rejected</div>
          <div className="lm-stat-value">{stats.rejected}</div>
          <div className="lm-stat-sub">Needs revision</div>
        </div>
      </div>

      {/* ── ERROR BANNER ── */}
      {error && (
        <div className="lm-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* ── TOOLBAR ── */}
      <div className="lm-toolbar">
        <div className="lm-search-wrap">
          <svg className="lm-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="lm-search"
            type="text"
            placeholder="Search by faculty, department, course or lesson..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="lm-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* ── TABLE ── */}
      <div className="lm-table-wrap">
        {loading ? (
          <div className="lm-empty">
            <div className="lm-empty-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
            <p>Loading materials...</p>
            <span>Please wait</span>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="lm-empty">
            <div className="lm-empty-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <p>{search || statusFilter !== "All" ? "No results found." : "No materials uploaded yet."}</p>
            <span>{search || statusFilter !== "All" ? "Try adjusting your search or filter." : "Faculty uploads will appear here."}</span>
          </div>
        ) : (
          <>
            <div className="lm-table-scroll">
              <table className="lm-table">
                <thead>
                  <tr>
                    <th>Faculty</th>
                    <th>Department</th>
                    <th>Course</th>
                    <th>Lesson Name</th>
                    <th>LP No.</th>
                    <th>PDF</th>
                    <th>Video</th>
                    <th>Discourse</th>
                    <th>Upload Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td style={{ maxWidth: 160 }}>
                        <div className="lm-faculty-cell">
                          <div className="lm-avatar">{getInitials(row.faculty)}</div>
                          <span title={row.faculty}>{row.faculty}</span>
                        </div>
                      </td>
                      <td title={row.department}>{row.department}</td>
                      <td title={row.course}>{row.course}</td>
                      <td title={row.lesson}>{row.lesson}</td>
                      <td>{row.lessonNumber}</td>
                      <td>
                        {row.pdf ? (
                          <button className="lm-link" onClick={() => handleOpenMaterial(row.pdf, "PDF")}>View PDF</button>
                        ) : <span style={{ color: "#cbd5e1" }}>—</span>}
                      </td>
                      <td>
                        {row.video ? (
                          <button className="lm-link" onClick={() => handleOpenMaterial(row.video, "video")}>View Video</button>
                        ) : <span style={{ color: "#cbd5e1" }}>—</span>}
                      </td>
                      <td>
                        {row.discourse ? (
                          <button className="lm-link" onClick={() => handleOpenMaterial(row.discourse, "link")}>Open Link</button>
                        ) : <span style={{ color: "#cbd5e1" }}>—</span>}
                      </td>
                      <td style={{ color: "#64748b", fontSize: "0.82rem" }}>{row.date}</td>
                      <td>
                        <span className={`lm-badge ${row.status.toLowerCase()}`}>
                          {row.status}
                        </span>
                      </td>
                      <td>
                        <div className="lm-actions">
                          <button
                            className="lm-btn approve"
                            onClick={() => handleApprove(row.id)}
                            disabled={readOnly || row.status !== "Pending" || actionLoading === row.id}
                          >
                            Approve
                          </button>
                          <button
                            className="lm-btn reject"
                            onClick={() => handleReject(row)}
                            disabled={readOnly || row.status !== "Pending" || actionLoading === row.id}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="lm-table-footer">
              Showing {filteredRows.length} of {rows.length} record{rows.length !== 1 ? "s" : ""}
              {statusFilter !== "All" || search ? " (filtered)" : ""}
            </div>
          </>
        )}
      </div>

      {/* ── REJECT MODAL ── */}
      {rejecting && (
        <div className="lm-modal-overlay" onClick={() => setRejecting(null)}>
          <div className="lm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lm-modal-header">
              <div>
                <h3>Reject Material</h3>
                <p>Provide feedback for <strong>{rejecting.lesson || "this upload"}</strong></p>
              </div>
              <button className="lm-modal-close" onClick={() => setRejecting(null)}>✕</button>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this material is being rejected so the faculty can revise and resubmit..."
              autoFocus
            />
            <div className="lm-modal-actions">
              <button className="lm-btn ghost" onClick={() => setRejecting(null)}>Cancel</button>
              <button
                className="lm-btn reject"
                onClick={submitReject}
                disabled={!rejectReason.trim() || actionLoading === rejecting.id}
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LectureMaterialsMonitoring;
