import React, { useEffect, useState } from "react";
import "./Materials.css";
import { apiUrl } from "../../../utils/api";
import { downloadMaterialUrl, openMaterialUrl } from "../../../utils/materialLinks";

const typeIcon = { PDF: "PDF", Video: "Video", Doc: "Doc" };
const typeColor = {
  PDF: { bg: "#dbeafe", color: "#1e40af" },
  Video: { bg: "#fce7f3", color: "#9d174d" },
  Doc: { bg: "#d1fae5", color: "#065f46" },
};

const LectureMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadMaterials = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(apiUrl("/student/materials"));
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch lecture materials");
        }
        setMaterials(data.data || []);
      } catch (err) {
        setError(err.message || "Failed to fetch lecture materials");
      } finally {
        setLoading(false);
      }
    };

    loadMaterials();
  }, []);

  const types = ["All", ...new Set(materials.map((m) => m.type))];

  const filtered = materials.filter((m) => {
    const matchType = filter === "All" || m.type === filter;
    const matchSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.course.toLowerCase().includes(search.toLowerCase()) ||
      m.faculty.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleView = (material) => {
    if (!material.file) {
      alert("No file link available for this material.");
      return;
    }
    openMaterialUrl(material.file).catch(() => {
      setError("Unable to open this material.");
    });
  };

  const handleDownload = (material) => {
    if (!material.file) {
      alert("No file link available for this material.");
      return;
    }
    const safeTitle = (material.title || "material")
      .replace(/[^\w.-]+/g, "_")
      .replace(/^_+|_+$/g, "");
    downloadMaterialUrl(material.file, `${safeTitle || "material"}.pdf`).catch(() => {
      setError("Unable to download this material.");
    });
  };

  return (
    <div className="lm-page">
      <div className="lm-hero">
        <div className="lm-hero-left">
          <h1 className="lm-hero-title">Lecture Materials</h1>
          <p className="lm-hero-sub">Browse and download all materials uploaded by faculty.</p>
        </div>
        <div className="lm-hero-stats">
          <div className="lm-stat">
            <span className="lm-stat-num">{materials.length}</span>
            <span className="lm-stat-label">Total</span>
          </div>
          <div className="lm-stat-div" />
          <div className="lm-stat">
            <span className="lm-stat-num" style={{ color: "#60a5fa" }}>
              {materials.filter((m) => m.type === "PDF").length}
            </span>
            <span className="lm-stat-label">PDFs</span>
          </div>
          <div className="lm-stat-div" />
          <div className="lm-stat">
            <span className="lm-stat-num" style={{ color: "#f472b6" }}>
              {materials.filter((m) => m.type === "Video").length}
            </span>
            <span className="lm-stat-label">Videos</span>
          </div>
        </div>
      </div>

      <div className="lm-toolbar">
        <input
          className="lm-search"
          placeholder="Search by title, course or faculty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="lm-filter-bar">
          {types.map((t) => (
            <button
              key={t}
              className={`lm-filter-btn${filter === t ? " lm-filter-active" : ""}`}
              onClick={() => setFilter(t)}
            >
              {typeIcon[t] || "File"} {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="lm-card">
          <div className="lm-empty">
            <p className="lm-empty-title">Loading materials...</p>
          </div>
        </div>
      ) : error ? (
        <div className="lm-card">
          <div className="lm-empty">
            <p className="lm-empty-title">{error}</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="lm-card">
          <div className="lm-empty">
            <p className="lm-empty-title">No materials found</p>
            <span className="lm-empty-sub">Try adjusting your search or filter.</span>
          </div>
        </div>
      ) : (
        <div className="lm-card">
          <div className="lm-card-header">
            <div className="lm-card-title-row">
              <h2 className="lm-card-title">All Materials</h2>
              <span className="lm-count-chip">{filtered.length}</span>
            </div>
          </div>
          <div className="lm-table-scroll">
            <table className="lm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Course</th>
                  <th>Faculty</th>
                  <th>Material Title</th>
                  <th>Unit</th>
                  <th>Type</th>
                  <th>Upload Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m.id}>
                    <td className="lm-td-num">{i + 1}</td>
                    <td>
                      <div className="lm-course-name">{m.course}</div>
                      <div className="lm-course-code">{m.courseCode}</div>
                    </td>
                    <td>
                      <div className="lm-faculty-cell">
                        <div className="lm-avatar">{m.faculty.charAt(0)}</div>
                        <span className="lm-faculty-name">{m.faculty}</span>
                      </div>
                    </td>
                    <td className="lm-td-title">{m.title}</td>
                    <td>
                      <span className="lm-unit-badge">{m.unit}</span>
                    </td>
                    <td>
                      <span
                        className="lm-type-badge"
                        style={{
                          background: typeColor[m.type]?.bg || "#f3f4f6",
                          color: typeColor[m.type]?.color || "#374151",
                        }}
                      >
                        {typeIcon[m.type] || "File"} {m.type}
                      </span>
                    </td>
                    <td className="lm-td-date">{m.date}</td>
                    <td>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                        <button className="lm-view-btn" onClick={() => handleView(m)}>
                          View
                        </button>
                        <button className="lm-view-btn" onClick={() => handleDownload(m)}>
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LectureMaterials;
