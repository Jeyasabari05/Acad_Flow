import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./CourseMaterials.css";
import { apiUrl } from "../../../utils/api";
import { createMaterialViewerToken, openMaterialUrl } from "../../../utils/materialLinks";

const CourseMaterials = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!courseId) return;

    const loadMaterials = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(apiUrl(`/materials/${courseId}`));
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load materials");
        }
        setMaterials(data.data || []);
      } catch (err) {
        setError(err.message || "Failed to load materials");
      } finally {
        setLoading(false);
      }
    };

    loadMaterials();
  }, [courseId]);

  const handleView = async (url) => {
    if (!url) return;
    try {
      const token = createMaterialViewerToken(url, {
        title: `Course ${courseId} PDF`,
        subtitle: "Approved lecture material",
        returnTo: `/course-materials/${courseId}`,
      });
      if (!token) throw new Error("Missing material");
      navigate(`/material-viewer/${token}`);
    } catch (err) {
      try {
        await openMaterialUrl(url);
      } catch {
        setError("Unable to open the requested material.");
      }
    }
  };

  return (
    <div className="cm-page">
      <div className="cm-shell">
        <button type="button" className="cm-back-btn" onClick={() => navigate("/")}>
          Back to Dashboard
        </button>

        <div className="cm-hero">
          <div className="cm-hero-copy">
            <h1 className="cm-title">Course Materials</h1>
            <p className="cm-sub">Approved lesson plans and lecture resources for this course.</p>
            <div className="cm-course-badge">Course Code: {courseId}</div>
          </div>
          <div className="cm-hero-stat">
            <span className="cm-hero-stat-value">{materials.length}</span>
            <span className="cm-hero-stat-label">Available Lessons</span>
          </div>
        </div>

        {loading ? (
          <div className="cm-card">
            <p className="cm-empty">Loading materials...</p>
          </div>
        ) : error ? (
          <div className="cm-card">
            <p className="cm-empty">{error}</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="cm-card">
            <p className="cm-empty">No approved materials found.</p>
          </div>
        ) : (
          <div className="cm-card">
            <div className="cm-table-wrap">
              <table className="cm-table">
                <thead>
                  <tr>
                    <th>LP Number</th>
                    <th>Lesson Plan Title</th>
                    <th>Lecture Material</th>
                    <th>Lecture Video</th>
                    <th>Discourse Link</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m, idx) => (
                    <tr key={`${m.lessonNumber}-${idx}`}>
                      <td>
                        <span className="cm-pill">{m.lessonNumber}</span>
                      </td>
                      <td className="cm-title-cell">{m.lessonTitle}</td>
                      <td>
                        <button
                          className="cm-link"
                          onClick={() => handleView(m.pdfUrl)}
                          disabled={!m.pdfUrl}
                        >
                          View PDF
                        </button>
                      </td>
                      <td>
                        <button
                          className="cm-link"
                          onClick={() => handleView(m.videoUrl)}
                          disabled={!m.videoUrl}
                        >
                          View Video
                        </button>
                      </td>
                      <td>
                        <button
                          className="cm-link"
                          onClick={() => handleView(m.discourseUrl)}
                          disabled={!m.discourseUrl}
                        >
                          View Discourse
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseMaterials;
