import React, { useEffect, useMemo, useState } from "react";
import "./Admin.css";
import { apiUrl } from "../../../utils/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from "recharts";

// ── Animated counter hook ──────────────────────────────────────
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
}

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ label, value, note, accent, icon, loading, delay = 0 }) {
  const count = useCountUp(loading ? 0 : value);
  return (
    <div className="ad-stat" style={{ animationDelay: `${delay}ms` }}>
      <div className="ad-stat-icon" style={{ background: accent + "18", color: accent }}>{icon}</div>
      <div className="ad-stat-body">
        <div className="ad-stat-label">{label}</div>
        <div className="ad-stat-value" style={{ color: accent }}>{loading ? "—" : count}</div>
        <div className="ad-stat-note">{note}</div>
      </div>
      <div className="ad-stat-bar" style={{ background: accent }} />
    </div>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ad-tooltip">
      {label && <p className="ad-tt-label">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
function Admin() {
  const [facultyScores, setFacultyScores] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        const [scoresRes, facultiesRes, complaintsRes, materialsRes] = await Promise.all([
          fetch(apiUrl("/admin/faculty-scores")),
          fetch(apiUrl("/admin/faculties")),
          fetch(apiUrl("/admin/complaints")),
          fetch(apiUrl("/admin/materials")),
        ]);
        const scoresData = await scoresRes.json();
        const facultiesData = await facultiesRes.json();
        const complaintsData = await complaintsRes.json();
        const materialsData = await materialsRes.json();

        setFacultyScores(scoresRes.ok && scoresData.success ? scoresData.data || [] : []);
        setFaculties(facultiesRes.ok && facultiesData.success ? facultiesData.data || [] : []);
        setComplaints(complaintsRes.ok && complaintsData.success ? complaintsData.data || [] : []);
        setMaterials(materialsRes.ok && materialsData.success ? materialsData.data || [] : []);
      } catch (err) {
        setError("Failed to load admin dashboard metrics.");
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const lowScoreCount = facultyScores.filter((f) => Number(f.score) < 80).length;
    const pendingMaterials = materials.filter(
      (m) => String(m.approval_status || m.status || "").toLowerCase() === "pending"
    ).length;
    return {
      lowScoreCount,
      pendingMaterials,
      totalComplaints: complaints.length,
      totalMaterials: materials.length,
      totalActiveFaculty: faculties.length || facultyScores.length,
    };
  }, [facultyScores, faculties.length, complaints.length, materials]);

  // ── Chart data ────────────────────────────────────────────────
  const pieData = useMemo(() => {
    const approved = materials.filter(m => String(m.approval_status || m.status || "").toLowerCase() === "approved").length;
    const pending = materials.filter(m => String(m.approval_status || m.status || "").toLowerCase() === "pending").length;
    const rejected = materials.filter(m => String(m.approval_status || m.status || "").toLowerCase() === "rejected").length;
    const other = materials.length - approved - pending - rejected;
    return [
      { name: "Approved", value: approved || 0 },
      { name: "Pending",  value: pending  || 0 },
      { name: "Rejected", value: rejected || 0 },
      ...(other > 0 ? [{ name: "Other", value: other }] : []),
    ].filter(d => d.value > 0);
  }, [materials]);

  const barData = useMemo(() => {
    if (!facultyScores.length) {
      return [
        { range: "< 60",   count: 0 },
        { range: "60–69",  count: 0 },
        { range: "70–79",  count: 0 },
        { range: "80–89",  count: 0 },
        { range: "90–100", count: 0 },
      ];
    }
    const buckets = { "< 60": 0, "60–69": 0, "70–79": 0, "80–89": 0, "90–100": 0 };
    facultyScores.forEach(f => {
      const s = Number(f.score);
      if (s < 60) buckets["< 60"]++;
      else if (s < 70) buckets["60–69"]++;
      else if (s < 80) buckets["70–79"]++;
      else if (s < 90) buckets["80–89"]++;
      else buckets["90–100"]++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [facultyScores]);

  const complaintTrendData = useMemo(() => {
    if (!complaints.length) {
      return ["Jan","Feb","Mar","Apr","May","Jun"].map(m => ({ month: m, count: 0 }));
    }
    const monthMap = {};
    complaints.forEach(c => {
      const d = new Date(c.created_at || c.date || Date.now());
      const key = d.toLocaleString("default", { month: "short" });
      monthMap[key] = (monthMap[key] || 0) + 1;
    });
    return Object.entries(monthMap).slice(-6).map(([month, count]) => ({ month, count }));
  }, [complaints]);

  const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#5c35d9"];

  return (
    <div className="ad-page">

      {/* ── HEADER ── */}
      <div className="ad-header">
        <div className="ad-header-left">
          <p className="ad-eyebrow">Admin Dashboard</p>
          <h1>Institution Control Center</h1>
          <span>Monitor key academic signals across departments.</span>
        </div>
      </div>

      {error && <div className="ad-banner">{error}</div>}

      {/* ── STAT CARDS ── */}
      <div className="ad-stats-row">
        <StatCard loading={loading} delay={0}   label="Low-Score Faculty"       value={stats.lowScoreCount}       note="Score below 80 — needs review"    accent="#ef4444" icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        }/>
        <StatCard loading={loading} delay={80}  label="Pending Materials"       value={stats.pendingMaterials}    note="Awaiting your approval"           accent="#f59e0b" icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        }/>
        <StatCard loading={loading} delay={160} label="Total Complaints"        value={stats.totalComplaints}     note="All statuses combined"            accent="#5c35d9" icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        }/>
        <StatCard loading={loading} delay={240} label="Total Materials"         value={stats.totalMaterials}      note="Across all departments"           accent="#10b981" icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
        }/>
        <StatCard loading={loading} delay={320} label="Active Faculty"          value={stats.totalActiveFaculty}  note="Registered in the system"         accent="#7c5ce8" icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
        }/>
      </div>

      {/* ── CHARTS ROW 1 ── */}
      <div className="ad-charts-row">

        {/* Faculty Score Distribution */}
        <div className="ad-chart-card ad-chart-wide">
          <div className="ad-chart-header">
            <div>
              <div className="ad-chart-title">Faculty Score Distribution</div>
              <div className="ad-chart-sub">Performance spread across all {stats.totalActiveFaculty} faculty</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={36} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ebff" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 12, fill: "#b0a3d0" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#b0a3d0" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="count" name="Faculty" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.range === "< 60" || entry.range === "60–69" || entry.range === "70–79" ? "#ef4444" : "#10b981"} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="ad-chart-legend-row">
            <span className="ad-legend-dot" style={{ background: "#ef4444" }} /> Below 80 (needs review)
            <span className="ad-legend-dot" style={{ background: "#10b981", marginLeft: 16 }} /> 80+ (good standing)
          </div>
        </div>

        {/* Materials Breakdown Donut */}
        <div className="ad-chart-card">
          <div className="ad-chart-header">
            <div>
              <div className="ad-chart-title">Materials Breakdown</div>
              <div className="ad-chart-sub">Approval status overview</div>
            </div>
          </div>
          {pieData.length === 0 ? (
            <div className="ad-chart-empty">No material data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="48%"
                  innerRadius={62} outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle" iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 12, color: "#9b8fc0" }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── CHARTS ROW 2 ── */}
      <div className="ad-charts-row">

        {/* Complaints Trend */}
        <div className="ad-chart-card">
          <div className="ad-chart-header">
            <div>
              <div className="ad-chart-title">Complaints Trend</div>
              <div className="ad-chart-sub">Monthly complaint volume</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={complaintTrendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5c35d9" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#5c35d9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ebff" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#b0a3d0" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#b0a3d0" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" name="Complaints" stroke="#5c35d9" strokeWidth={2.5} fill="url(#cGrad)" dot={{ r: 4, fill: "#5c35d9" }} activeDot={{ r: 6, fill: "#7c5ce8" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Summary Panel */}
        <div className="ad-chart-card ad-summary-card">
          <div className="ad-chart-title" style={{ marginBottom: 16 }}>Quick Summary</div>
          <div className="ad-summary-list">
            <div className="ad-summary-row">
              <span className="ad-summary-dot" style={{ background: "#ef4444" }} />
              <span className="ad-summary-text">
                <strong>{loading ? "—" : stats.lowScoreCount}</strong> faculty below the 80-point threshold
              </span>
            </div>
            <div className="ad-summary-row">
              <span className="ad-summary-dot" style={{ background: "#f59e0b" }} />
              <span className="ad-summary-text">
                <strong>{loading ? "—" : stats.pendingMaterials}</strong> materials awaiting approval
              </span>
            </div>
            <div className="ad-summary-row">
              <span className="ad-summary-dot" style={{ background: "#5c35d9" }} />
              <span className="ad-summary-text">
                <strong>{loading ? "—" : stats.totalComplaints}</strong> total complaints logged
              </span>
            </div>
            <div className="ad-summary-row">
              <span className="ad-summary-dot" style={{ background: "#10b981" }} />
              <span className="ad-summary-text">
                <strong>{loading ? "—" : stats.totalMaterials}</strong> materials uploaded in total
              </span>
            </div>
            <div className="ad-summary-row">
              <span className="ad-summary-dot" style={{ background: "#7c5ce8" }} />
              <span className="ad-summary-text">
                <strong>{loading ? "—" : stats.totalActiveFaculty}</strong> active faculty registered
              </span>
            </div>
          </div>
          <div className="ad-approval-rate">
            <div className="ad-ar-label">
              Material Approval Rate
              <span>{loading || !stats.totalMaterials ? "—" : `${Math.round(((stats.totalMaterials - stats.pendingMaterials) / stats.totalMaterials) * 100)}%`}</span>
            </div>
            <div className="ad-ar-track">
              <div
                className="ad-ar-fill"
                style={{
                  width: loading || !stats.totalMaterials ? "0%" :
                    `${Math.round(((stats.totalMaterials - stats.pendingMaterials) / stats.totalMaterials) * 100)}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;
