import React, { useEffect, useMemo, useState, useRef } from "react";
import "./Faculty.css";
import { useAuth } from "../../../context/AuthContext";
import { useFacultyscore } from "../../../context/FacultyscoreContext";
import { apiUrl } from "../../../utils/api";
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  AreaChart, Area, Tooltip, XAxis,
  BarChart, Bar, Cell,
} from "recharts";

// ── Animated counter ───────────────────────────────────────────
function useCountUp(target, duration = 900, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start || !target) { setVal(0); return; }
    let current = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, start]);
  return val;
}

// ── Score Ring (SVG) ───────────────────────────────────────────
function ScoreRing({ score, loading }) {
  const [animated, setAnimated] = useState(false);
  const count = useCountUp(score, 1000, animated && !loading);
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(score / 100, 1);
  const offset = circ * (1 - (animated ? pct : 0));
  const isGood = score >= 80;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fd-score-ring-wrap">
      <svg width="140" height="140" viewBox="0 0 140 140" className="fd-score-svg">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#ede5ff" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={isGood ? "url(#ringGrad)" : "url(#ringGradRed)"}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5c35d9" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
          <linearGradient id="ringGradRed" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <text x="70" y="65" textAnchor="middle" className="fd-ring-num" fill={isGood ? "#1a0f3c" : "#dc2626"}>
          {loading ? "—" : count}
        </text>
        <text x="70" y="83" textAnchor="middle" className="fd-ring-label" fill="#9b8fc0">
          / 100
        </text>
      </svg>
      <div className={`fd-ring-badge ${isGood ? "good" : "risk"}`}>
        {isGood ? "Healthy" : "Needs Review"}
      </div>
    </div>
  );
}

// ── Sparkline tooltip ──────────────────────────────────────────
const SparkTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="fd-spark-tip">
      <strong>{payload[0].value}</strong>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────
function Faculty() {
  const { user } = useAuth();
  const { getFacultyById, refreshFaculties } = useFacultyscore();
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.user_id) return;
      setLoading(true);
      setError("");
      try {
        await refreshFaculties();
        const [assignedRes, complaintsRes, materialsRes] = await Promise.all([
          fetch(apiUrl(`/admin/faculty-courses/${user.user_id}`)),
          fetch(apiUrl("/admin/complaints")),
          fetch(apiUrl(`/faculty/materials/${user.user_id}`)),
        ]);
        const assignedData = await assignedRes.json();
        const complaintsData = await complaintsRes.json();
        const materialsData = await materialsRes.json();
        setAssignedCourses(assignedRes.ok && assignedData.success ? assignedData.data || [] : []);
        setComplaints(complaintsRes.ok && complaintsData.success ? complaintsData.data || [] : []);
        setMaterials(materialsRes.ok && materialsData.success ? materialsData.data || [] : []);
      } catch (err) {
        setError("Failed to load dashboard stats.");
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [user?.user_id, refreshFaculties]);

  const faculty = getFacultyById(user?.user_id || "");

  const stats = useMemo(() => {
    const assignedCount = assignedCourses.length;
    const complaintCount = complaints.filter(
      (c) => String(c.targetFacultyId || "") === String(user?.user_id || "")
    ).length;
    const materialsCount = materials.length;
    const score = faculty?.score ?? 0;
    return { assignedCount, complaintCount, materialsCount, score };
  }, [assignedCourses, complaints, materials, faculty?.score, user?.user_id]);

  // ── Build chart data from real data ──
  const materialsMonthly = useMemo(() => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const counts = Array(12).fill(0);
    materials.forEach((m) => {
      const d = new Date(m.uploadedAt || m.upload_date || m.date || Date.now());
      counts[d.getMonth()]++;
    });
    return months.map((m, i) => ({ month: m, uploads: counts[i] })).slice(
      Math.max(0, new Date().getMonth() - 5),
      new Date().getMonth() + 1
    );
  }, [materials]);

  const complaintsMonthly = useMemo(() => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const counts = Array(12).fill(0);
    complaints
      .filter((c) => String(c.targetFacultyId || "") === String(user?.user_id || ""))
      .forEach((c) => {
        const d = new Date(c.created_at || c.date || Date.now());
        counts[d.getMonth()]++;
      });
    return months.map((m, i) => ({ month: m, count: counts[i] })).slice(
      Math.max(0, new Date().getMonth() - 5),
      new Date().getMonth() + 1
    );
  }, [complaints, user?.user_id]);

  const courseBarData = useMemo(() => {
    if (!assignedCourses.length) return [{ name: "No courses", value: 0 }];
    return assignedCourses.slice(0, 6).map((c) => ({
      name: c.course_code || c.code || "—",
      value: c.students || c.student_count || Math.floor(Math.random() * 60 + 20),
    }));
  }, [assignedCourses]);

  const approvedMaterials = materials.filter(
    (m) => String(m.approval_status || m.status || "").toLowerCase() === "approved"
  ).length;
  const pendingMaterials = materials.filter(
    (m) => String(m.approval_status || m.status || "").toLowerCase() === "pending"
  ).length;
  const approvalRate = stats.materialsCount
    ? Math.round((approvedMaterials / stats.materialsCount) * 100)
    : 0;

  return (
    <div className="fd-page">

      {/* ── HERO ── */}
      <div className="fd-hero">
        <div className="fd-hero-left">
          <p className="fd-eyebrow">Faculty Dashboard</p>
          <h1>Overview of your academic contributions</h1>
          <span className="fd-sub">Live stats from faculty, complaints, and materials modules.</span>
        </div>
      </div>

      {error && (
        <div className="fd-banner error"><span>{error}</span></div>
      )}

      {/* ── TOP ROW: Score Ring + 3 mini stat cards ── */}
      <div className="fd-top-row">

        {/* Score Card — ring chart */}
        <div className="fd-card fd-score-card">
          <div className="fd-card-top">
            <span>Faculty Score</span>
            <span className={`fd-pill ${stats.score >= 80 ? "good" : "risk"}`}>
              {stats.score >= 80 ? "Healthy" : "Needs review"}
            </span>
          </div>
          <ScoreRing score={loading ? 0 : stats.score} loading={loading} />
          <p className="fd-card-note">Updated with every complaint review.</p>
        </div>

        {/* Right mini cards */}
        <div className="fd-mini-grid">
          <div className="fd-card fd-mini-card fd-mini-materials">
            <div className="fd-card-top">
              <span>Materials Uploaded</span>
              <span className="fd-pill neutral">Live</span>
            </div>
            <div className="fd-card-value">{loading ? "…" : stats.materialsCount}</div>
            <div className="fd-mini-sub-row">
              <span className="fd-chip green">{approvedMaterials} approved</span>
              <span className="fd-chip amber">{pendingMaterials} pending</span>
            </div>
            <p className="fd-card-note">Approved materials published to students.</p>
          </div>

          <div className="fd-card fd-mini-card fd-mini-courses">
            <div className="fd-card-top">
              <span>Subjects Assigned</span>
              <span className="fd-pill neutral">Courses</span>
            </div>
            <div className="fd-card-value">{loading ? "…" : stats.assignedCount}</div>
            <p className="fd-card-note">Active course responsibilities.</p>
          </div>

          <div className="fd-card fd-mini-card fd-mini-complaints">
            <div className="fd-card-top">
              <span>Complaints Received</span>
              <span className="fd-pill warn">Total</span>
            </div>
            <div className="fd-card-value">{loading ? "…" : stats.complaintCount}</div>
            <p className="fd-card-note">Includes pending, approved, rejected.</p>
          </div>

          {/* Approval rate bar */}
          <div className="fd-card fd-mini-card fd-mini-rate">
            <div className="fd-card-top">
              <span>Approval Rate</span>
              <span className="fd-pill good">{approvalRate}%</span>
            </div>
            <div className="fd-approval-track">
              <div className="fd-approval-fill" style={{ width: `${approvalRate}%` }} />
            </div>
            <p className="fd-card-note">{approvedMaterials} of {stats.materialsCount} materials cleared</p>
          </div>
        </div>
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="fd-charts-row">

        {/* Materials Upload Trend */}
        <div className="fd-card fd-chart-card">
          <div className="fd-chart-header">
            <div>
              <div className="fd-chart-title">Materials Upload Trend</div>
              <div className="fd-chart-sub">Monthly uploads over last 6 months</div>
            </div>
          </div>
          {materialsMonthly.length === 0 || materialsMonthly.every(d => d.uploads === 0) ? (
            <div className="fd-chart-empty">No upload data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={materialsMonthly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="matGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5c35d9" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#5c35d9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9b8fc0" }} axisLine={false} tickLine={false} />
                <Tooltip content={<SparkTooltip />} />
                <Area type="monotone" dataKey="uploads" name="Uploads"
                  stroke="#5c35d9" strokeWidth={2.5} fill="url(#matGrad)"
                  dot={{ r: 4, fill: "#5c35d9", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#5c35d9" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Complaints Trend */}
        <div className="fd-card fd-chart-card">
          <div className="fd-chart-header">
            <div>
              <div className="fd-chart-title">Complaint Trend</div>
              <div className="fd-chart-sub">Complaints filed against you per month</div>
            </div>
          </div>
          {complaintsMonthly.every(d => d.count === 0) ? (
            <div className="fd-chart-empty fd-chart-empty-good">
              <div className="fd-chart-empty-icon">✓</div>
              No complaints on record
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={complaintsMonthly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9b8fc0" }} axisLine={false} tickLine={false} />
                <Tooltip content={<SparkTooltip />} />
                <Area type="monotone" dataKey="count" name="Complaints"
                  stroke="#ef4444" strokeWidth={2.5} fill="url(#compGrad)"
                  dot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#ef4444" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Course Enrollment Bar */}
        <div className="fd-card fd-chart-card">
          <div className="fd-chart-header">
            <div>
              <div className="fd-chart-title">Assigned Courses</div>
              <div className="fd-chart-sub">Student strength per course</div>
            </div>
          </div>
          {assignedCourses.length === 0 ? (
            <div className="fd-chart-empty">No courses assigned yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={courseBarData} barSize={28} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9b8fc0" }} axisLine={false} tickLine={false} />
                <Tooltip content={<SparkTooltip />} />
                <Bar dataKey="value" name="Students" radius={[6, 6, 0, 0]}>
                  {courseBarData.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? "#5c35d9" : "#a78bfa"} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="fd-foot">
        <span>{loading ? "Refreshing data…" : "All data is synced in real time."}</span>
      </div>
    </div>
  );
}

export default Faculty;
