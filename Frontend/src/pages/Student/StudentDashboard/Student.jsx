// src/pages/Student/StudentDashboard/Student.jsx
// ORIGINAL logic — untouched. Only UI/CSS classes updated.

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faGraduationCap,
  faLayerGroup,
  faChartLine,
  faBullseye,
  faInbox,
} from "@fortawesome/free-solid-svg-icons";
import "./Student.css";
import { useAuth } from "../../../context/AuthContext";
import { apiUrl } from "../../../utils/api";

const sum = (arr, key) => arr.reduce((s, c) => s + Number(c[key] || 0), 0);

export default function Student() {
  const navigate = useNavigate();

  const normalizeDept = (code) => {
    const upper = String(code || "").toUpperCase();
    if (upper === "CSE")   return "CS";
    if (upper === "ECE")   return "EC";
    if (upper === "EEE")   return "EE";
    if (upper === "CIVIL") return "CE";
    if (upper === "CE")    return "CE";
    return upper;
  };

  const { user } = useAuth();
  const [sem, setSem]                       = useState(1);
  const [studentName, setStudentName]       = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [departmentCode, setDepartmentCode] = useState("");
  const [courses, setCourses]               = useState([]);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState("");

  useEffect(() => {
    if (!user?.user_id) return;
    const loadProfile = async () => {
      try {
        const response = await fetch(apiUrl(`/student/dashboard/${user.user_id}`));
        const data = await response.json();
        if (!response.ok || !data.success)
          throw new Error(data.message || "Failed to load student profile.");
        const profile = data.data || {};
        setStudentName(profile.name || user.name || user.user_id);
        setDepartmentCode(profile.departmentCode || "");
        setDepartmentName(profile.departmentName || "");
        setSem(Number(profile.currentSemester) || 1);
      } catch (err) {
        setError(err.message || "Failed to load student profile.");
      }
    };
    loadProfile();
  }, [user?.user_id, user?.name]);

  useEffect(() => {
    if (!departmentCode || !sem) return;
    const controller = new AbortController();
    const loadCourses = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          apiUrl(`/courses?department=${encodeURIComponent(normalizeDept(departmentCode))}&semester=${sem}`),
          { signal: controller.signal }
        );
        const data = await response.json();
        if (!response.ok || !data.success)
          throw new Error(data.message || "Failed to load courses.");
        setCourses(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to load courses.");
          setCourses([]);
        }
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
    return () => controller.abort();
  }, [departmentCode, sem]);

  const normalizedCourses = useMemo(
    () =>
      courses.map((course) => ({
        code: course.courseId || course.code || "",
        name: course.courseName || course.name || "",
        L: Number(course.L || 0),
        T: Number(course.T || 0),
        P: Number(course.P || 0),
        C: Number(course.C || 0),
        type:
          String(course.courseType || course.type || "Core").toLowerCase() === "elective"
            ? "elective" : "core",
      })),
    [courses]
  );

  const core       = normalizedCourses.filter((c) => c.type === "core");
  const elective   = normalizedCourses.filter((c) => c.type === "elective");
  const totalC     = sum(core, "C") + sum(elective, "C");
  const minCredits = totalC;

  const initials = (studentName || user?.name || user?.user_id || "S")
    .split(" ").filter(Boolean).slice(0, 2)
    .map((p) => p.charAt(0)).join("").toUpperCase();

  const CourseTable = ({ courses: list, type }) => (
    <table className="sd-table">
      <thead>
        <tr>
          <th className="sd-th-idx">#</th>
          <th className="sd-th-code">Code No.</th>
          <th className="sd-th-name">Course Name</th>
          <th className="sd-th-center">L</th>
          <th className="sd-th-center">T</th>
          <th className="sd-th-center">P</th>
          <th className="sd-th-center">Credits</th>
        </tr>
      </thead>
      <tbody>
        {list.map((c, i) => (
          <tr
            key={`${c.code}-${i}`}
            className="sd-tr"
            onClick={() => navigate(`/course-materials/${c.code}`)}
            style={{ cursor: "pointer" }}
          >
            <td className="sd-td-idx">{i + 1}</td>
            <td><span className={`sd-code-chip ${type}`}>{c.code}</span></td>
            <td className="sd-td-name">{c.name}</td>
            <td className="sd-td-center">{c.L}</td>
            <td className="sd-td-center">{c.T}</td>
            <td className="sd-td-center">{c.P}</td>
            <td className="sd-td-center">
              <span className={`sd-credit-chip ${type}`}>{c.C}</span>
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="sd-tfoot-row">
          <td colSpan={3} className="sd-tfoot-label">Total</td>
          <td className="sd-tfoot-val">{sum(list, "L")}</td>
          <td className="sd-tfoot-val">{sum(list, "T")}</td>
          <td className="sd-tfoot-val">{sum(list, "P")}</td>
          <td className="sd-tfoot-val"><strong>{sum(list, "C")}</strong></td>
        </tr>
      </tfoot>
    </table>
  );

  return (
    <div className="sd-page">

      {/* HERO */}
      <div className="sd-hero">
        <div className="sd-hero-pattern" />
        <div className="sd-hero-content">
          <div className="sd-hero-left">
            <div className="sd-avatar">{initials || "S"}</div>
            <div>
              <h1 className="sd-hero-name">{studentName || user?.name || user?.user_id || "Student"}</h1>
              <p className="sd-hero-sub">
                <span className="sd-dept-tag">{departmentCode || "DEPT"}</span>
                {departmentName || "Department"}
              </p>
            </div>
          </div>
          <div className="sd-hero-right">
            <div className="sd-hero-stat">
              <span className="sd-hero-stat-n">{core.length + elective.length}</span>
              <span className="sd-hero-stat-l">Subjects</span>
            </div>
            <div className="sd-hero-divider" />
            <div className="sd-hero-stat">
              <span className="sd-hero-stat-n">{totalC}</span>
              <span className="sd-hero-stat-l">Credits</span>
            </div>
            <div className="sd-hero-divider" />
            <div className="sd-hero-stat">
              <span className="sd-hero-stat-n">{minCredits}</span>
              <span className="sd-hero-stat-l">Min. Required</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEMESTER TABS */}
      <div className="sd-sem-bar">
        <span className="sd-sem-label">Semester</span>
        <div className="sd-sem-tabs">
          {[1,2,3,4,5,6,7,8].map((s) => (
            <button
              key={s}
              onClick={() => setSem(s)}
              className={`sd-sem-tab${sem === s ? " sd-sem-active" : ""}`}
            >
              <span className="sd-sem-num">{s}</span>
              <span className="sd-sem-sub">Sem</span>
            </button>
          ))}
        </div>
      </div>

      {/* INFO STRIP */}
      <div className="sd-strip">
        <div className="sd-strip-item">
          <span className="sd-strip-icon"><FontAwesomeIcon icon={faBookOpen} /></span>
          <div>
            <div className="sd-strip-val">{core.length}</div>
            <div className="sd-strip-lbl">Core Courses</div>
          </div>
        </div>
        <div className="sd-strip-sep" />
        <div className="sd-strip-item">
          <span className="sd-strip-icon"><FontAwesomeIcon icon={faGraduationCap} /></span>
          <div>
            <div className="sd-strip-val">{elective.length}</div>
            <div className="sd-strip-lbl">Elective Courses</div>
          </div>
        </div>
        <div className="sd-strip-sep" />
        <div className="sd-strip-item">
          <span className="sd-strip-icon"><FontAwesomeIcon icon={faLayerGroup} /></span>
          <div>
            <div className="sd-strip-val">{sum(core, "C")}</div>
            <div className="sd-strip-lbl">Core Credits</div>
          </div>
        </div>
        <div className="sd-strip-sep" />
        <div className="sd-strip-item">
          <span className="sd-strip-icon"><FontAwesomeIcon icon={faChartLine} /></span>
          <div>
            <div className="sd-strip-val">{sum(elective, "C") || 0}</div>
            <div className="sd-strip-lbl">Elective Credits</div>
          </div>
        </div>
        <div className="sd-strip-sep" />
        <div className="sd-strip-item">
          <span className="sd-strip-icon"><FontAwesomeIcon icon={faBullseye} /></span>
          <div>
            <div className="sd-strip-val">{minCredits}</div>
            <div className="sd-strip-lbl">Min. Credits to Earn</div>
          </div>
        </div>
      </div>

      {/* CORE COURSES */}
      <div className="sd-section">
        <div className="sd-section-header sd-core-header">
          <div className="sd-section-header-left">
            <div className="sd-section-accent sd-core-accent" />
            <div>
              <h2 className="sd-section-title">Core Courses</h2>
              <p className="sd-section-sub">
                Semester {sem} · {core.length} subjects · {sum(core, "C")} credits
              </p>
            </div>
          </div>
          <span className="sd-section-badge sd-core-badge">{core.length} Courses</span>
        </div>
        <div className="sd-table-wrap">
          <CourseTable courses={core} type="core" />
        </div>
      </div>

      {/* ELECTIVE COURSES */}
      {elective.length > 0 ? (
        <div className="sd-section">
          <div className="sd-section-header sd-elec-header">
            <div className="sd-section-header-left">
              <div className="sd-section-accent sd-elec-accent" />
              <div>
                <h2 className="sd-section-title">Professional Electives</h2>
                <p className="sd-section-sub">
                  Semester {sem} · {elective.length} subjects · {sum(elective, "C")} credits
                </p>
              </div>
            </div>
            <span className="sd-section-badge sd-elec-badge">{elective.length} Electives</span>
          </div>
          <div className="sd-table-wrap">
            <CourseTable courses={elective} type="elec" />
          </div>
        </div>
      ) : (
        <div className="sd-no-elec">
          <div className="sd-no-elec-icon"><FontAwesomeIcon icon={faInbox} /></div>
          <h3>No Elective Courses</h3>
          <p>Elective courses are offered from Semester 3 onwards.</p>
        </div>
      )}

    </div>
  );
}
