import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box, Typography, Grid, Button, Modal, TextField, Autocomplete,
  Checkbox, Snackbar, Alert, FormControl, FormControlLabel,
  MenuItem, Select, InputLabel, Switch, Stack
} from "@mui/material";
import { styled, createTheme, ThemeProvider } from "@mui/material/styles";
import AssignedFacultiesTable from "./FacultyList";
import image from "../../../assets/images/empty_state_icon.png";
import { LibraryAddRounded } from "@mui/icons-material";

// ── Theme ──────────────────────────────────────────────────────
const theme = createTheme({
  palette: {
    primary: { main: "#5c35d9" },
    secondary: { main: "#f0ebff" },
  },
  typography: { fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif" },
  shape: { borderRadius: 12 },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: "#fff",
          transition: "box-shadow 0.2s ease, border-color 0.2s ease",
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#5c35d9" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#5c35d9", borderWidth: 2 },
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0d7f8" },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { color: "#8b7db8", fontWeight: 600, fontSize: 13, "&.Mui-focused": { color: "#5c35d9" } },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: 13, fontWeight: 500,
          "&:hover": { backgroundColor: "#f0ebff" },
          "&.Mui-selected": { backgroundColor: "#ede5ff", color: "#5c35d9", fontWeight: 700 },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, textTransform: "none", fontWeight: 700, letterSpacing: 0.3 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          "&.MuiMenu-paper": { boxShadow: "0 8px 32px rgba(92,53,217,0.15)", border: "1px solid #ede5ff" },
        },
      },
    },
  },
});

// ── iOS Toggle ─────────────────────────────────────────────────
const IOSSwitch = styled((props) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 44, height: 26, padding: 0,
  "& .MuiSwitch-switchBase": {
    padding: 0, margin: 2, transitionDuration: "300ms",
    "&.Mui-checked": {
      transform: "translateX(18px)", color: "#fff",
      "& + .MuiSwitch-track": { backgroundColor: "#5c35d9", opacity: 1 },
    },
  },
  "& .MuiSwitch-thumb": { width: 22, height: 22, boxShadow: "0 2px 6px rgba(0,0,0,0.2)" },
  "& .MuiSwitch-track": { borderRadius: 13, backgroundColor: "#ddd6f5", opacity: 1 },
}));

// ── Styled Select ──────────────────────────────────────────────
const StyledSelect = ({ label, value, onChange, children }) => (
  <FormControl fullWidth variant="outlined" size="small">
    <InputLabel>{label}</InputLabel>
    <Select value={value} onChange={onChange} label={label}
      MenuProps={{ PaperProps: { sx: { maxHeight: 220, overflowY: "auto", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } } } }}
    >
      {children}
    </Select>
  </FormControl>
);

// ── Section Label ──────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a091cc", mb: 1, mt: 2.5 }}>
    {children}
  </Typography>
);

// ── Main Component ─────────────────────────────────────────────
const FacultyAssign = () => {
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [filteredFaculties, setFilteredFaculties] = useState([]);
  const [inchargeFaculty, setInchargeFaculty] = useState(null);
  const [creatingFaculties, setCreatingFaculties] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [disableFilter, setDisableFilter] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [assignments, setAssignments] = useState([0]);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [deadline, setDeadline] = useState("");
  const currentDate = new Date().toISOString().split("T")[0];
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [editConfirmationModalOpen, setEditConfirmationModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);

  // ── Fetch assignment count once on mount ──────────────────────
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch("https://acad-backend-ve2l.onrender.com/api/admin/faculty-courses");
        const datacount = await response.json();
        setCount(datacount.data.length);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCount();
  }, []);

  // ── Fetch courses + faculties once on mount ───────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, facultiesRes] = await Promise.all([
          fetch("https://acad-backend-ve2l.onrender.com/api/admin/courses"),
          fetch("https://acad-backend-ve2l.onrender.com/api/admin/faculties"),
        ]);
        if (!coursesRes.ok || !facultiesRes.ok) throw new Error("Failed to fetch data");
        const coursesData = await coursesRes.json();
        const facultiesData = await facultiesRes.json();
        setCourses(coursesData.data);
        setFaculties(facultiesData.data.filter((f) => f.role === "Faculty"));
        setFilteredCourses(coursesData.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Update filtered faculties when course changes ─────────────
  useEffect(() => {
    if (selectedCourse) {
      const filtered = faculties.filter((f) => f.department_code === selectedCourse.department_code);
      setFilteredFaculties(filtered);
    } else {
      setFilteredFaculties(faculties);
    }
  }, [selectedCourse, faculties]);

  // ── Filter courses by dropdowns ───────────────────────────────
  useEffect(() => { filterCourses(); }, [departmentFilter, semesterFilter, yearFilter]);

  const filterCourses = () => {
    let filtered = [...courses];
    if (departmentFilter) filtered = filtered.filter((c) => c.department_code === departmentFilter);
    if (semesterFilter) filtered = filtered.filter((c) => c.semester === semesterFilter);
    if (yearFilter === "2024-2025") filtered = [...filtered];
    setFilteredCourses(filtered);
  };

  // ── Handlers ─────────────────────────────────────────────────
  const handleCourseChange = (event, value) => {
    setSelectedCourse(value);
    if (value && !disableFilter) {
      setFilteredFaculties(faculties.filter((f) => f.department === value.department));
    } else {
      setFilteredFaculties(faculties);
    }
  };

  const handleInchargeChange = (event, value) => setInchargeFaculty(value);

  const handleCreatingFacultiesChange = (event, value) => {
    const dups = new Set();
    const hasDups = value.some((f) => { if (dups.has(f.id)) return true; dups.add(f.id); return false; });
    if (hasDups) {
      setSnackbarMessage("Duplicate faculty selected.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } else {
      setCreatingFaculties(value);
    }
  };

  const handleFilterToggle = () => {
    setDisableFilter((prev) => !prev);
    if (selectedCourse && disableFilter) {
      setFilteredFaculties(faculties.filter((f) => f.department === selectedCourse.department));
    } else {
      setFilteredFaculties(faculties);
      setSnackbarMessage("Filter disabled. Showing all faculties.");
      setSnackbarSeverity("info");
      setSnackbarOpen(true);
    }
  };

  const handleSubmit = () => {
    if (selectedCourse && inchargeFaculty && deadline && creatingFaculties.length > 0) {
      isEditMode ? setEditConfirmationModalOpen(true) : setConfirmationModalOpen(true);
    } else {
      setSnackbarMessage("Please select a Course, Incharge Faculty, at least one creating faculty, and set a deadline.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleEditConfirmSubmit = async () => {
    const updatedAssignment = {
      assignmentId: currentAssignment.id,
      courseMappingId: selectedCourse.course_id,
      inchargeId: inchargeFaculty.user_id,
      creatingFaculties: creatingFaculties.map((f) => f.user_id),
      deadline,
    };
    try {
      const response = await fetch("https://acad-backend-ve2l.onrender.com/api/admin/update-assignment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedAssignment),
      });
      if (!response.ok) throw new Error("Failed to update assignment");
      setAssignments(assignments.map((a) => a.id === currentAssignment.id ? { ...a, ...updatedAssignment } : a));
      setSnackbarMessage("Assignment updated successfully.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setEditConfirmationModalOpen(false);
      setModalOpen(false);
    } catch {
      setSnackbarMessage("Error updating assignment.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = async () => {
    const newAssignment = {
      courseMappingId: selectedCourse?.course_id,
      inchargeId: inchargeFaculty?.user_id,
      creatingFaculties: creatingFaculties.map((f) => f.user_id),
      deadline,
    };
    try {
      const response = await fetch("https://acad-backend-ve2l.onrender.com/api/admin/assign-faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAssignment),
      });
      if (!response.ok) throw new Error("Failed to save assignment");
      setSnackbarMessage("Faculty assignment successful!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setConfirmationModalOpen(false);
      setModalOpen(false);
    } catch {
      setSnackbarMessage("Error saving assignment.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assignmentId) => {
    try {
      const response = await axios.delete(`https://acad-backend-ve2l.onrender.com/api/admin/delete-assignment/:${assignmentId}`);
      if (response.status === 200) console.log("Assignment deleted successfully.");
      else console.error("Failed to delete assignment.");
    } catch (error) {
      console.error("Error occurred during deletion:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (assignment) => {
    if (!assignment) return;
    const courseToEdit = courses.find((c) => c.course_code === assignment.course_code);
    const assignedFacultyNames = assignment.creating_faculties
      ? assignment.creating_faculties.split(",").map((n) => n.trim()) : [];
    const facultiesToEdit = faculties.filter((f) => assignedFacultyNames.includes(f.name));
    const inchargeToEdit = faculties.find((f) => f.user_id === assignment.incharge_faculty_id);
    const formattedDeadline = formatDateForDateInput(assignment.deadline_date);
    setSelectedCourse(courseToEdit || null);
    setInchargeFaculty(inchargeToEdit || null);
    setCreatingFaculties(facultiesToEdit || []);
    setDeadline(formattedDeadline || "");
    setCurrentAssignment(assignment);
    setIsEditMode(true);
    setModalOpen(true);
  };

  const formatDateForDateInput = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const handleStatusChange = (index, status) => {
    setAssignments(assignments.map((a, i) => i === index ? { ...a, status } : a));
  };

  const handleSnackbarClose = () => setSnackbarOpen(false);

  const handleOpenModal = () => {
    setIsEditMode(false);
    setSelectedCourse(null);
    setInchargeFaculty(null);
    setCreatingFaculties([]);
    setDeadline("");
    setModalOpen(true);
  };

  // ── Shared field style ────────────────────────────────────────
  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      backgroundColor: "#faf8ff",
      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#5c35d9" },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#5c35d9", borderWidth: 2 },
    },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0d7f8" },
  };

  const depts = [
    ["CS","CSE"],["ME","Mechanical"],["EC","ECE"],["EE","EEE"],["CE","Civil"],
    ["EI","E&I"],["AG","Agri"],["FD","Food Design"],["FT","Food Tech"],["MZ","Mechatronics"],
    ["IT","IT"],["SE","ISE"],["CB","CSBS"],["CD","Computer Design"],["CT","Computer Tech"],
    ["AD","AIDS"],["AL","AIML"],["BT","Biotech"],["BM","Biomedical"],["TX","Textile"],
  ];

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{
        p: { xs: 2, sm: 4 },
        minHeight: "calc(100vh - 60px)",
        background: "linear-gradient(145deg, #f7f5ff 0%, #faf9ff 60%, #f0f4ff 100%)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>

        {/* ── Page Header ── */}
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#a091cc", mb: 0.5 }}>
            Administration
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: { xs: "1.5rem", sm: "2rem" }, fontWeight: 800, color: "#1a0f3c", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                Faculty Assignment
              </Typography>
              <Typography sx={{ color: "#8b7db8", fontSize: "0.88rem", mt: 0.5 }}>
                Assign and manage faculty to courses by department
              </Typography>
            </Box>
            {count > 0 && (
              <Button variant="contained" onClick={handleOpenModal} startIcon={<LibraryAddRounded />}
                sx={{
                  background: "linear-gradient(135deg, #5c35d9 0%, #7c5ce8 100%)",
                  color: "#fff", px: 3, py: 1.2, borderRadius: "40px", fontSize: "0.88rem",
                  boxShadow: "0 6px 20px rgba(92,53,217,0.3)",
                  "&:hover": { background: "linear-gradient(135deg, #4a27c7 0%, #6a4ad6 100%)", boxShadow: "0 8px 28px rgba(92,53,217,0.45)", transform: "translateY(-1px)" },
                  transition: "all 0.2s ease",
                }}
              >
                Assign Course & Faculty
              </Button>
            )}
          </Box>
        </Box>

        {/* ── Empty State or Table ── */}
        {count <= 0 ? (
          <Box sx={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            textAlign: "center", mt: 4, py: 8,
            background: "#fff", borderRadius: 4,
            border: "1.5px dashed #d6cbf5",
            boxShadow: "0 4px 24px rgba(92,53,217,0.06)",
          }}>
            <Box sx={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #ede5ff, #ddd4ff)", display: "flex", alignItems: "center", justifyContent: "center", mb: 3 }}>
              <img src={image} alt="No Assignments" style={{ width: 44, opacity: 0.8 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.2rem", sm: "1.5rem" }, color: "#1a0f3c", mb: 1 }}>
              No Assignments Yet
            </Typography>
            <Typography sx={{ color: "#8b7db8", fontWeight: 500, maxWidth: 420, mb: 4, lineHeight: 1.7, fontSize: "0.92rem" }}>
              Click the button below to create your first faculty assignment and start managing course allocations effectively.
            </Typography>
            <Button variant="contained" onClick={handleOpenModal} startIcon={<LibraryAddRounded />}
              sx={{
                background: "linear-gradient(135deg, #5c35d9 0%, #7c5ce8 100%)",
                color: "#fff", px: 4, py: 1.4, borderRadius: "40px", fontSize: "0.92rem",
                boxShadow: "0 6px 20px rgba(92,53,217,0.3)",
                "&:hover": { background: "linear-gradient(135deg, #4a27c7 0%, #6a4ad6 100%)", transform: "translateY(-1px)" },
                transition: "all 0.2s ease",
              }}
            >
              Assign Course & Faculty
            </Button>
            <Typography sx={{ color: "#c4b8e8", fontWeight: 600, fontSize: "0.75rem", mt: 3 }}>
              Note: Assignments will be notified to the corresponding faculties.
            </Typography>
          </Box>
        ) : (
          <AssignedFacultiesTable assignments={assignments} onDelete={handleDelete} onEdit={handleEdit} onStatusChange={handleStatusChange} />
        )}

        {/* ── Assignment Modal ── */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <Box sx={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "92%", sm: 580 }, maxWidth: 580,
            bgcolor: "#fff", borderRadius: "20px",
            boxShadow: "0 32px 80px rgba(92,53,217,0.22)",
            border: "1px solid #ede5ff",
            display: "flex", flexDirection: "column",
            maxHeight: "90vh", overflow: "hidden",
          }}>
            {/* Header */}
            <Box sx={{ px: 4, pt: 3.5, pb: 2.5, borderBottom: "1px solid #f0ebff", background: "linear-gradient(135deg, #faf8ff 0%, #f5f0ff 100%)", flexShrink: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: "10px", background: "linear-gradient(135deg, #5c35d9, #7c5ce8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <LibraryAddRounded sx={{ color: "#fff", fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#1a0f3c", lineHeight: 1.2 }}>
                    {isEditMode ? "Edit Assignment" : "New Assignment"}
                  </Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: "#a091cc" }}>
                    {isEditMode ? "Update the course-faculty mapping" : "Assign faculty to a course"}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Scrollable body */}
            <Box sx={{ px: 4, py: 2, overflowY: "auto", flex: 1, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
              <SectionLabel>Filter Courses</SectionLabel>
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={4}>
                  <StyledSelect label="Department" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {depts.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                  </StyledSelect>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <StyledSelect label="Semester" value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {[1,2,3,4,5,6,7,8].map(n => <MenuItem key={n} value={String(n)}>{n}</MenuItem>)}
                  </StyledSelect>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <StyledSelect label="Year" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {["2023-2024","2024-2025","2025-2026"].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                  </StyledSelect>
                </Grid>
              </Grid>

              <SectionLabel>Course & Faculty</SectionLabel>
              <Autocomplete
                options={filteredCourses} value={selectedCourse || null}
                getOptionLabel={(o) => `${o.course_code} - ${o.course_name}`}
                onChange={handleCourseChange}
                renderOption={(props, option) => (
                  <li {...props} key={`${option.course_code}-${option.course_name}`}>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 13, color: "#1a0f3c" }}>{option.course_code}</Typography>
                      <Typography sx={{ fontSize: 12, color: "#8b7db8" }}>{option.course_name}</Typography>
                    </Box>
                  </li>
                )}
                renderInput={(params) => <TextField {...params} label="Select Course" size="small" fullWidth sx={fieldSx} />}
              />

              <Box sx={{ mt: 1.5 }}>
                <Autocomplete
                  options={disableFilter ? faculties : filteredFaculties}
                  value={inchargeFaculty}
                  getOptionLabel={(o) => `${o.user_id} - ${o.name}`}
                  onChange={handleInchargeChange}
                  renderOption={(props, option) => (
                    <li {...props} key={option.user_id ?? `fb-${option.name}`}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 28, height: 28, borderRadius: "50%", background: "#ede5ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#5c35d9" }}>
                          {(option.name || "").slice(0, 2).toUpperCase()}
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 700, fontSize: 13, color: "#1a0f3c" }}>{option.name}</Typography>
                          <Typography sx={{ fontSize: 11, color: "#a091cc" }}>{option.user_id}</Typography>
                        </Box>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => <TextField {...params} label="Incharge Faculty" size="small" fullWidth sx={fieldSx} />}
                />
              </Box>

              <Box sx={{ mt: 1.5 }}>
                <Autocomplete
                  multiple disableCloseOnSelect
                  options={disableFilter ? faculties : filteredFaculties}
                  value={creatingFaculties}
                  getOptionLabel={(o) => `${o.user_id} - ${o.name}`}
                  onChange={handleCreatingFacultiesChange}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Checkbox
                        checked={creatingFaculties.indexOf(option) > -1}
                        sx={{ color: "#c4b8e8", "&.Mui-checked": { color: "#5c35d9" }, p: 0.5, mr: 1 }}
                        size="small"
                      />
                      <Typography sx={{ fontSize: 13, color: "#1a0f3c" }}>{option.user_id} — {option.name}</Typography>
                    </li>
                  )}
                  renderInput={(params) => <TextField {...params} label="Select Faculties (multiple)" size="small" fullWidth sx={fieldSx} />}
                />
              </Box>

              <SectionLabel>Deadline</SectionLabel>
              <TextField
                label="Deadline Date" type="date" value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                fullWidth size="small"
                InputLabelProps={{ shrink: true }}
                InputProps={{ inputProps: { min: currentDate } }}
                sx={fieldSx}
              />

              <Box sx={{
                mt: 2.5, p: 2, borderRadius: "12px",
                background: disableFilter ? "linear-gradient(135deg, #ede5ff, #e0d7f8)" : "#faf8ff",
                border: "1px solid", borderColor: disableFilter ? "#c4b8e8" : "#ede5ff",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                transition: "all 0.2s ease",
              }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#1a0f3c" }}>Disable Department Filter</Typography>
                  <Typography sx={{ fontSize: "0.73rem", color: "#a091cc" }}>Show faculty from all departments</Typography>
                </Box>
                <IOSSwitch checked={disableFilter} onChange={handleFilterToggle} />
              </Box>
            </Box>

            {/* Footer */}
            <Box sx={{ px: 4, py: 2.5, borderTop: "1px solid #f0ebff", flexShrink: 0 }}>
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Button fullWidth variant="outlined" onClick={() => setModalOpen(false)}
                  sx={{ borderColor: "#e0d7f8", color: "#8b7db8", "&:hover": { borderColor: "#5c35d9", color: "#5c35d9", background: "#faf8ff" } }}
                >Cancel</Button>
                <Button fullWidth variant="contained" onClick={handleSubmit}
                  sx={{ background: "linear-gradient(135deg, #5c35d9 0%, #7c5ce8 100%)", color: "#fff", py: 1.2, boxShadow: "0 4px 16px rgba(92,53,217,0.35)", "&:hover": { background: "linear-gradient(135deg, #4a27c7 0%, #6a4ad6 100%)", boxShadow: "0 6px 20px rgba(92,53,217,0.45)" } }}
                >
                  {isEditMode ? "Save Changes" : "Assign Faculty"}
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>

        {/* ── Confirm New Modal ── */}
        <Modal open={confirmationModalOpen} onClose={() => setConfirmationModalOpen(false)}>
          <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: { xs: "85%", sm: 480 }, bgcolor: "#fff", borderRadius: "20px", p: { xs: 3, sm: 4 }, boxShadow: "0 24px 60px rgba(92,53,217,0.2)", border: "1px solid #ede5ff" }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: "#ede5ff", display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
              <LibraryAddRounded sx={{ color: "#5c35d9", fontSize: 22 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#1a0f3c", mb: 1 }}>Confirm Assignment</Typography>
            <Typography sx={{ color: "#8b7db8", fontSize: "0.88rem", lineHeight: 1.7, mb: 3 }}>
              Assign faculties to <strong style={{ color: "#1a0f3c" }}>{selectedCourse?.course_name} ({selectedCourse?.course_code})</strong> with incharge <strong style={{ color: "#1a0f3c" }}>{inchargeFaculty?.name}</strong>?
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button fullWidth variant="outlined" onClick={() => setConfirmationModalOpen(false)}
                sx={{ borderColor: "#e0d7f8", color: "#8b7db8", "&:hover": { borderColor: "#5c35d9", color: "#5c35d9" } }}
              >Cancel</Button>
              <Button fullWidth variant="contained" onClick={handleConfirmSubmit}
                sx={{ background: "linear-gradient(135deg, #5c35d9, #7c5ce8)", color: "#fff", boxShadow: "0 4px 16px rgba(92,53,217,0.3)", "&:hover": { background: "linear-gradient(135deg, #4a27c7, #6a4ad6)" } }}
              >Confirm & Assign</Button>
            </Box>
          </Box>
        </Modal>

        {/* ── Confirm Edit Modal ── */}
        <Modal open={editConfirmationModalOpen} onClose={() => setEditConfirmationModalOpen(false)}>
          <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: { xs: "85%", sm: 480 }, bgcolor: "#fff", borderRadius: "20px", p: { xs: 3, sm: 4 }, boxShadow: "0 24px 60px rgba(92,53,217,0.2)", border: "1px solid #ede5ff" }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: "#fff3e0", display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
              <LibraryAddRounded sx={{ color: "#f57c00", fontSize: 22 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#1a0f3c", mb: 1 }}>Save Changes</Typography>
            <Typography sx={{ color: "#8b7db8", fontSize: "0.88rem", lineHeight: 1.7, mb: 3 }}>
              Update assignment for <strong style={{ color: "#1a0f3c" }}>{selectedCourse?.course_name}</strong> with incharge <strong style={{ color: "#1a0f3c" }}>{inchargeFaculty?.name}</strong>?
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button fullWidth variant="outlined" onClick={() => setEditConfirmationModalOpen(false)}
                sx={{ borderColor: "#e0d7f8", color: "#8b7db8", "&:hover": { borderColor: "#5c35d9", color: "#5c35d9" } }}
              >Cancel</Button>
              <Button fullWidth variant="contained" onClick={handleEditConfirmSubmit}
                sx={{ background: "linear-gradient(135deg, #5c35d9, #7c5ce8)", color: "#fff", boxShadow: "0 4px 16px rgba(92,53,217,0.3)", "&:hover": { background: "linear-gradient(135deg, #4a27c7, #6a4ad6)" } }}
              >Save Changes</Button>
            </Box>
          </Box>
        </Modal>

        {/* ── Snackbar ── */}
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}
            sx={{ borderRadius: "12px", fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default FacultyAssign;