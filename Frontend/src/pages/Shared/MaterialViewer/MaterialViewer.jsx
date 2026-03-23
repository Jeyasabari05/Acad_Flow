import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMaterialViewerPayload } from "../../../utils/materialLinks";
import "./MaterialViewer.css";

export default function MaterialViewer() {
  const navigate = useNavigate();
  const { token } = useParams();

  const payload = useMemo(() => getMaterialViewerPayload(token), [token]);

  const handleBack = () => {
    if (payload?.returnTo) {
      navigate(payload.returnTo);
      return;
    }
    navigate(-1);
  };

  if (!payload?.src) {
    return (
      <div className="mv-page">
        <div className="mv-shell">
          <div className="mv-empty">
            <h2>PDF Not Available</h2>
            <p>The selected document could not be loaded.</p>
            <button type="button" className="mv-back-btn" onClick={handleBack}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mv-page">
      <div className="mv-shell">
        <div className="mv-topbar">
          <div className="mv-copy">
            <p className="mv-eyebrow">Document Viewer</p>
            <h1>{payload.title || "PDF Viewer"}</h1>
            {payload.subtitle ? <p className="mv-subtitle">{payload.subtitle}</p> : null}
          </div>
          <button type="button" className="mv-back-btn" onClick={handleBack}>
            Back
          </button>
        </div>

        <div className="mv-frame-wrap">
          <iframe
            title={payload.title || "PDF Viewer"}
            src={payload.src}
            className="mv-frame"
          />
        </div>
      </div>
    </div>
  );
}
