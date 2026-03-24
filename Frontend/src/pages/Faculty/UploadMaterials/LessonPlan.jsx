import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Modal,
  TextField,
  Typography,
  Snackbar,
  Alert,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { Edit, Delete, Add, ArrowBack, LibraryAddRounded, AutoDeleteRounded } from "@mui/icons-material";
import image from "../../../assets/images/empty_state_icon.png";
import { useAuth } from "../../../context/AuthContext";
import { apiUrl } from "../../../utils/api";
import { openMaterialUrl } from "../../../utils/materialLinks";
import "./Upload.css";

// ── shared sx helpers ─────────────────────────────────────────
const inputSx = {
  "& .MuiInputLabel-root": { color: "#64748b", fontWeight: 700, fontFamily: "'Outfit', sans-serif" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#673ab7" },
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    fontFamily: "'Outfit', sans-serif",
    "&:hover fieldset": { borderColor: "#9c6edd" },
    "&.Mui-focused fieldset": { borderColor: "#673ab7", borderWidth: "2px" },
  },
};

const safeParseJson = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const sanitizePlansForStorage = (plans) =>
  (Array.isArray(plans) ? plans : []).map((plan) => ({
    number: plan?.number || "",
    name: plan?.name || "",
    pdf: typeof plan?.pdf === "string" && plan.pdf.startsWith("data:") ? "" : plan?.pdf || "",
    video: plan?.video || "",
    discourse: plan?.discourse || "",
    status: plan?.status || "Pending",
  }));

const persistLessonPlans = (key, plans) => {
  try {
    const sanitizedPlans = sanitizePlansForStorage(plans);
    if (!sanitizedPlans.length) {
      localStorage.removeItem(key);
      return true;
    }
    localStorage.setItem(key, JSON.stringify(sanitizedPlans));
    return true;
  } catch (error) {
    console.error("Failed to persist lesson plans locally:", error);
    return false;
  }
};

const persistStorageFlag = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Failed to persist storage flag ${key}:`, error);
  }
};

function LessonPlan() {
  const { unitNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const unitName = location.state?.unitName || "";
  const routeCourseMappingId = location.state?.courseMappingId || "";
  const { user } = useAuth();
  const storagePrefix = user?.user_id ? `faculty-${user.user_id}` : "faculty-unknown";
  const storageKey = (suffix) => `${storagePrefix}-${suffix}`;
  const [resolvedCourseMappingId, setResolvedCourseMappingId] = useState(
    routeCourseMappingId || localStorage.getItem(storageKey("currentCourseMappingId")) || ""
  );

  const [lessonPlans, setLessonPlans] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState({ number: "", name: "", pdf: "", video: "", discourse: "" });
  const [isEdit, setIsEdit] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [fileError, setFileError] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  useEffect(() => {
    const storedPlans = safeParseJson(
      localStorage.getItem(storageKey(`lessonPlans-${unitNumber}`)),
      []
    );
    setLessonPlans(storedPlans || []);
  }, [unitNumber, storagePrefix]);

  useEffect(() => {
    if (routeCourseMappingId) {
      const value = String(routeCourseMappingId);
      setResolvedCourseMappingId(value);
      localStorage.setItem(storageKey("currentCourseMappingId"), value);
      return;
    }

    const storedCourseMappingId = localStorage.getItem(storageKey("currentCourseMappingId")) || "";
    setResolvedCourseMappingId(storedCourseMappingId);
  }, [routeCourseMappingId, storagePrefix]);

  useEffect(() => {
    const resolveCourseMapping = async () => {
      if (resolvedCourseMappingId || !user?.user_id) return;
      try {
        const response = await fetch(apiUrl(`/admin/faculty-courses/${user.user_id}`));
        const data = await response.json();
        const firstCourse = data?.data?.[0];
        if (response.ok && data.success && firstCourse?.course_mapping_id) {
          const value = String(firstCourse.course_mapping_id);
          setResolvedCourseMappingId(value);
          localStorage.setItem(storageKey("currentCourseMappingId"), value);
        }
      } catch (error) {
        console.error("Failed to resolve course mapping id");
      }
    };
    resolveCourseMapping();
  }, [resolvedCourseMappingId, user?.user_id, storagePrefix]);

  useEffect(() => {
    const fetchLessonPlans = async () => {
      if (!user?.user_id) return;
      try {
        const response = await fetch(apiUrl(`/faculty/materials/${user.user_id}`));
        if (!response.ok) return;
        const data = await response.json();
        if (!data.success) return;
        const filtered = (data.data || []).filter(
          (plan) => String(plan.unitNumber || "") === String(unitNumber)
        );
        const mapped = filtered.map((plan) => ({
          number: plan.lessonPlanNumber,
          name: plan.lessonPlanTitle,
          pdf: plan.pdfUrl || "",
          video: plan.videoUrl || "",
          discourse: plan.discourseUrl || "",
          status: plan.status || "Pending",
        }));
        setLessonPlans(mapped);
        if (mapped.length > 0) {
          persistLessonPlans(storageKey(`lessonPlans-${unitNumber}`), mapped);
        } else {
          localStorage.removeItem(storageKey(`lessonPlans-${unitNumber}`));
        }
      } catch (error) {
        console.error("Failed to load lesson plans from backend", error);
      }
    };
    fetchLessonPlans();
  }, [unitNumber, user?.user_id, storagePrefix]);

  useEffect(() => {
    const lessonPlansKey = storageKey(`lessonPlans-${unitNumber}`);
    const hasChangesKey = storageKey(`hasChanges-${unitNumber}`);
    if (lessonPlans.length > 0) {
      const saved = persistLessonPlans(lessonPlansKey, lessonPlans);
      if (saved) {
        persistStorageFlag(hasChangesKey, "true");
      }
    } else {
      localStorage.removeItem(lessonPlansKey);
    }
  }, [lessonPlans, unitNumber, storagePrefix]);

  const handleModalOpen = (plan = null) => {
    if (plan) {
      if (plan.status && plan.status !== "Pending") {
        setSnackbar({ open: true, message: "Approved or rejected lesson plans cannot be edited.", severity: "warning" });
        return;
      }
      setCurrentPlan(plan);
      setIsEdit(true);
    } else {
      setCurrentPlan({ number: "", name: "", pdf: "", video: "", discourse: "" });
      setIsEdit(false);
    }
    setModalOpen(true);
  };

  const handleModalClose = () => { setModalOpen(false); setFileError(false); };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = () => { setCurrentPlan({ ...currentPlan, pdf: reader.result }); setFileError(false); };
      reader.onerror = () => setFileError(true);
      reader.readAsDataURL(file);
    } else {
      setFileError(true);
    }
  };

  const handleSavePlan = async () => {
    setSyncError("");
    if (isEdit) {
      const updatedPlan = { ...currentPlan, status: currentPlan.status || "Pending" };
      setLessonPlans((prev) => prev.map((p) => (p.number === currentPlan.number ? updatedPlan : p)));
      setSnackbar({ open: true, message: "Lesson plan updated successfully!", severity: "info" });
    } else {
      const newPlan = { ...currentPlan, status: "Pending" };
      setLessonPlans((prev) => [...prev, newPlan]);
      setSnackbar({ open: true, message: "Lesson plan added successfully!", severity: "success" });
    }

    const canSync = Boolean(resolvedCourseMappingId && user?.user_id);
    if (!canSync) {
      setSnackbar({ open: true, message: "Saved locally. Assign a course to sync with admin.", severity: "error" });
      handleModalClose();
      return;
    }

    if (resolvedCourseMappingId && user?.user_id) {
      try {
        const response = await fetch(apiUrl("/faculty/lesson-plans"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_mapping_id: resolvedCourseMappingId,
            faculty_id: user.user_id,
            unit_number: unitNumber,
            lesson_plan_number: currentPlan.number,
            lesson_plan_title: currentPlan.name,
            pdf_url: currentPlan.pdf,
            video_url: currentPlan.video,
            discourse_url: currentPlan.discourse,
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data?.message || `Sync failed (HTTP ${response.status})`);
        setSnackbar({ open: true, message: "Lesson plan synced to admin.", severity: "success" });
      } catch (error) {
        setSyncError(error.message || "Lesson plan sync failed.");
        setSnackbar({ open: true, message: error.message || "Saved locally but failed to sync.", severity: "error" });
      }
    }
    handleModalClose();
  };

  const handleDeletePlan = () => {
    if (planToDelete?.status && planToDelete.status !== "Pending") {
      setSnackbar({ open: true, message: "Approved or rejected lesson plans cannot be deleted.", severity: "warning" });
      setDeleteDialogOpen(false);
      return;
    }
    const updatedPlans = lessonPlans.filter((p) => p.number !== planToDelete.number);
    setLessonPlans(updatedPlans);
    persistLessonPlans(storageKey(`lessonPlans-${unitNumber}`), updatedPlans);
    setSnackbar({ open: true, message: "Lesson plan deleted successfully!", severity: "error" });
    setDeleteDialogOpen(false);
  };

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });
  const handleBack = () => navigate("/upload-materials");
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => { setRowsPerPage(+event.target.value); setPage(0); };

  const columns = [
    { id: "number", label: "LP Number", minWidth: 100 },
    { id: "name", label: "Lesson Plan Title", minWidth: 170 },
    { id: "pdf", label: "Lecture Material", minWidth: 150 },
    { id: "video", label: "Lecture Video", minWidth: 150 },
    { id: "discourse", label: "Discourse Link", minWidth: 150 },
    { id: "status", label: "Status", minWidth: 130 },
    { id: "actions", label: "Actions", minWidth: 120 },
  ];
  const tableColumnCount = columns.length;

  const statusColor = (s) =>
    s === "Approved" ? { bg: "#e8f5e9", color: "#1b5e20" } :
    s === "Rejected" ? { bg: "#ffebee", color: "#b71c1c" } :
    { bg: "#fff8e1", color: "#f57f17" };

  const handleMaterialOpen = async (url, label) => {
    if (!url) return;
    try {
      await openMaterialUrl(url);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Unable to open ${label}.`,
        severity: "error",
      });
    }
  };

  return (
    <Box className="lp-page">
      {/* Back */}
      <Button
        startIcon={<ArrowBack />}
        onClick={handleBack}
        className="lp-back-btn"
        sx={{
          mb: 2,
          textTransform: "none",
          fontWeight: 700,
          fontFamily: "'Outfit', sans-serif",
          color: "#757575",
          borderRadius: "20px",
          padding: "6px 14px",
          '&:hover': { color: '#414141', background: '#f0ebff' },
        }}
      >
        Back to Units
      </Button>

      {/* Title */}
      <Typography
        variant="h5"
        align="center"
        sx={{
          mb: 2,
          fontWeight: 800,
          fontFamily: "'Outfit', sans-serif",
          color: "#1a1036",
          fontSize: { xs: '1rem', sm: '1.5rem' },
          animation: "fadeDown 0.4s ease both",
          '@keyframes fadeDown': {
            from: { opacity: 0, transform: 'translateY(-10px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        Unit {unitNumber}:{" "}
        <span style={{ color: "#673ab7" }}>{unitName}</span>
      </Typography>

      {!resolvedCourseMappingId && (
        <Typography variant="body2" sx={{ mb: 2, color: "#b91c1c", fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
          Sync disabled: course assignment not found. Go back and ensure a course is assigned.
        </Typography>
      )}
      {syncError && (
        <Typography variant="body2" sx={{ mb: 2, color: "#b91c1c", fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
          {syncError}
        </Typography>
      )}

      {/* Add button */}
      <Button
        variant="contained"
        onClick={() => handleModalOpen()}
        sx={{
          px: 2,
          py: 1,
          fontWeight: 700,
          fontFamily: "'Outfit', sans-serif",
          textTransform: "none",
          fontSize: { xs: '0.82rem', sm: '0.95rem' },
          background: "#fff",
          color: "#673ab7",
          borderRadius: "40px",
          border: "2px solid #673ab7",
          boxShadow: "0 2px 10px rgba(103,58,183,0.15)",
          transition: "all 0.22s ease",
          mb: 1.5,
          '&:hover': {
            background: "#673ab7",
            color: "#fff",
            boxShadow: "0 6px 20px rgba(103,58,183,0.30)",
            transform: "translateY(-2px)",
          },
        }}
      >
        <LibraryAddRounded sx={{ mr: 1 }} /> Add Lesson Plan
      </Button>

      {/* Table */}
      <Paper
        sx={{
          width: "100%",
          overflow: "hidden",
          mt: 1,
          borderRadius: "16px",
          border: "1.5px solid #e8e3f5",
          boxShadow: "0 4px 20px rgba(103,58,183,0.10)",
        }}
      >
        <TableContainer sx={{ height: { xs: '420px', sm: 'auto' } }}>
          <Table stickyHeader aria-label="lesson plans table">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    sx={{
                      minWidth: column.minWidth,
                      background: "linear-gradient(135deg, #673ab7 0%, #7b1fa2 100%)",
                      color: "#fff",
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      textAlign: "center",
                      padding: "18px 16px",
                      borderBottom: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {lessonPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tableColumnCount} align="center" sx={{ py: 6 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                      <img
                        src={image}
                        alt="No Lesson Plans"
                        style={{ width: "120px", opacity: 0.5, filter: "drop-shadow(0 4px 12px rgba(103,58,183,0.15))" }}
                      />
                      <Typography variant="h6" sx={{ color: '#475569', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                        No Lesson Plans Yet
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8', fontFamily: "'Outfit', sans-serif" }}>
                        Click "Add Lesson Plan" to get started.
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => handleModalOpen()}
                        sx={{
                          mt: 1,
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: 700,
                          textTransform: "none",
                          background: "#fff",
                          color: "#673ab7",
                          border: "2px solid #673ab7",
                          borderRadius: "20px",
                          '&:hover': { background: "#673ab7", color: "#fff" },
                        }}
                      >
                        <LibraryAddRounded />
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                lessonPlans
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((plan, idx) => (
                    <TableRow
                      hover
                      key={plan.number}
                      sx={{
                        transition: "background 0.2s ease",
                        animation: `fadeUp 0.3s ${idx * 0.04}s ease both`,
                        '@keyframes fadeUp': {
                          from: { opacity: 0, transform: 'translateY(10px)' },
                          to: { opacity: 1, transform: 'translateY(0)' },
                        },
                        '&:hover': { background: '#faf7ff !important' },
                      }}
                    >
                      {/* LP Number */}
                      <TableCell sx={{ padding: "14px 16px", textAlign: "center" }}>
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 32, height: 32,
                            borderRadius: "50%",
                            background: "#ede7f6",
                            color: "#673ab7",
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            margin: "auto",
                          }}
                        >
                          {plan.number}
                        </Box>
                      </TableCell>

                      {/* Name */}
                      <TableCell sx={{ padding: "14px 16px", textAlign: "center", fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#334155', fontSize: '0.86rem' }}>
                        {plan.name}
                      </TableCell>

                      {/* PDF */}
                      <TableCell sx={{ padding: "14px 16px", textAlign: "center" }}>
                        {plan.pdf ? (
                          <button
                            type="button"
                            onClick={() => handleMaterialOpen(plan.pdf, "PDF")}
                            style={{
                              fontWeight: 700,
                              fontSize: "0.84rem",
                              color: "#3f51b5",
                              cursor: "pointer",
                              fontFamily: "'Outfit', sans-serif",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              textDecoration: "none",
                              background: "transparent",
                              border: "none",
                              padding: 0,
                            }}
                          >
                            View PDF
                          </button>
                        ) : (
                          <Typography variant="body2" sx={{ color: "#cbd5e1", fontFamily: "'Outfit', sans-serif", fontSize: "0.82rem" }}>—</Typography>
                        )}
                      </TableCell>

                      {/* Video */}
                      <TableCell sx={{ padding: "14px 16px", textAlign: "center" }}>
                        {plan.video ? (
                          <Typography
                            variant="body2"
                            onClick={() => handleMaterialOpen(plan.video, "video")}
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.84rem",
                              color: "#3f51b5",
                              cursor: "pointer",
                              fontFamily: "'Outfit', sans-serif",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              '&:hover': { color: "#673ab7", textDecoration: "underline" },
                            }}
                          >
                            View Video
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ color: "#cbd5e1", fontFamily: "'Outfit', sans-serif", fontSize: "0.82rem" }}>—</Typography>
                        )}
                      </TableCell>

                      {/* Discourse */}
                      <TableCell sx={{ padding: "14px 16px", textAlign: "center" }}>
                        {plan.discourse ? (
                          <Typography
                            variant="body2"
                            onClick={() => handleMaterialOpen(plan.discourse, "link")}
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.84rem",
                              color: "#3f51b5",
                              cursor: "pointer",
                              fontFamily: "'Outfit', sans-serif",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              '&:hover': { color: "#673ab7", textDecoration: "underline" },
                            }}
                          >
                            View Discourse
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ color: "#cbd5e1", fontFamily: "'Outfit', sans-serif", fontSize: "0.82rem" }}>—</Typography>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ padding: "14px 16px", textAlign: "center" }}>
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            borderRadius: "20px",
                            padding: "4px 12px",
                            background: statusColor(plan.status || "Pending").bg,
                            color: statusColor(plan.status || "Pending").color,
                            '&::before': {
                              content: '""',
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: "currentColor",
                              display: "inline-block",
                              ...((plan.status === "Pending" || !plan.status) && {
                                animation: "dot-pulse 1.4s ease infinite",
                              }),
                            },
                            '@keyframes dot-pulse': {
                              '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                              '50%': { opacity: 0.4, transform: 'scale(0.75)' },
                            },
                          }}
                        >
                          {plan.status || "Pending"}
                        </Box>
                      </TableCell>

                      {/* Actions */}
                      <TableCell sx={{ padding: "14px 16px", textAlign: "center" }}>
                        {(() => {
                          const locked = plan.status && plan.status !== "Pending";
                          return (
                            <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                              <IconButton
                                disabled={locked}
                                onClick={() => !locked && handleModalOpen(plan)}
                                sx={{
                                  color: "#673ab7",
                                  border: "1.5px solid #673ab7",
                                  borderRadius: "10px",
                                  width: 34, height: 34,
                                  background: "#fff",
                                  transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                                  '&:hover': {
                                    background: "#673ab7",
                                    color: "#fff",
                                    transform: "scale(1.1) rotate(-5deg)",
                                    boxShadow: "0 4px 12px rgba(103,58,183,0.25)",
                                  },
                                  '&.Mui-disabled': { opacity: 0.3, borderColor: "#c7c7c7", color: "#9ca3af" },
                                }}
                              >
                                <Edit sx={{ fontSize: "1rem" }} />
                              </IconButton>
                              <IconButton
                                disabled={locked}
                                onClick={() => {
                                  if (locked) return;
                                  setPlanToDelete(plan);
                                  setDeleteDialogOpen(true);
                                }}
                                sx={{
                                  color: "#b71c1c",
                                  border: "1.5px solid #b71c1c",
                                  borderRadius: "10px",
                                  width: 34, height: 34,
                                  background: "#fff",
                                  transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                                  '&:hover': {
                                    background: "#b71c1c",
                                    color: "#fff",
                                    transform: "scale(1.1) rotate(-5deg)",
                                    boxShadow: "0 4px 12px rgba(183,28,28,0.25)",
                                  },
                                  '&.Mui-disabled': { opacity: 0.3, borderColor: "#c7c7c7", color: "#9ca3af" },
                                }}
                              >
                                <AutoDeleteRounded sx={{ fontSize: "1rem" }} />
                              </IconButton>
                            </Box>
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={lessonPlans.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ fontFamily: "'Outfit', sans-serif" }}
        />
      </Paper>

      <Typography sx={{ color: '#e53935', fontWeight: 700, opacity: 0.3, mt: 4, textAlign: 'left', fontSize: '0.82rem', fontFamily: "'Outfit', sans-serif" }}>
        Note: Lesson Plans created will only be for Unit {unitNumber} and will be visible to students after approval from Incharge faculty.
      </Typography>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: "16px",
            boxShadow: "0 20px 50px rgba(15,5,40,0.18)",
            fontFamily: "'Outfit', sans-serif",
          }
        }}
      >
        <DialogTitle sx={{ color: '#673ab7', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
          Delete Lesson Plan!
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#64748b', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
            Are you sure you want to delete this lesson plan for Unit {unitNumber}? All materials associated will also be deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ mr: '16px', mb: '12px', gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ textTransform: 'none', fontWeight: 700, color: '#64748b', fontFamily: "'Outfit', sans-serif", borderRadius: "10px", '&:hover': { background: "#f1f5f9" } }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeletePlan}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
              color: '#b71c1c',
              background: '#fff',
              border: '2px solid #b71c1c',
              borderRadius: "10px",
              '&:hover': { background: '#b71c1c', color: '#fff' },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={handleModalClose}>
        <Box
          sx={{
            bgcolor: "background.paper",
            borderRadius: "20px",
            boxShadow: "0 24px 60px rgba(15,5,40,0.22)",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "92%", sm: "500px" },
            maxWidth: "600px",
            overflow: "hidden",
            animation: "modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both",
            '@keyframes modalIn': {
              from: { opacity: 0, transform: 'translate(-50%,-48%) scale(0.94)' },
              to:   { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' },
            },
          }}
        >
          {/* Modal header */}
          <Box sx={{
            background: "linear-gradient(135deg, #f9f6ff 0%, #ede7f6 100%)",
            padding: "20px 24px 14px",
            borderBottom: "1.5px solid #e8e3f5",
            textAlign: "center",
          }}>
            <Typography sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: "#673ab7", fontSize: { xs: "1.1rem", sm: "1.3rem" } }}>
              {isEdit ? "Edit Lesson Plan" : "Add Lesson Plan"}
            </Typography>
          </Box>

          {/* Modal body */}
          <Box sx={{ padding: { xs: 2.5, sm: 3 }, display: "flex", flexDirection: "column", gap: "14px" }}>
            <TextField
              label="Lesson Plan Number"
              value={currentPlan.number}
              onChange={(e) => setCurrentPlan({ ...currentPlan, number: e.target.value })}
              fullWidth
              sx={inputSx}
            />
            <TextField
              label="Lesson Plan Name"
              value={currentPlan.name}
              onChange={(e) => setCurrentPlan({ ...currentPlan, name: e.target.value })}
              fullWidth
              sx={inputSx}
            />

            {/* PDF upload */}
            <Box sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              border: "2px dashed rgba(103,58,183,0.4)",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #f9f6ff, #f3ecff)",
              transition: "border-color 0.2s, background 0.2s",
              '&:hover': { borderColor: "#673ab7", background: "#ede7f6" },
            }}>
              <Typography variant="body1" sx={{ color: "#673ab7", fontWeight: 700, fontFamily: "'Outfit', sans-serif", fontSize: "0.88rem", flex: 1, mr: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentPlan.pdf ? "PDF uploaded" : "No PDF uploaded"}
              </Typography>
              <Button
                variant="contained"
                component="label"
                sx={{
                  textTransform: "none",
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  background: "#ede7f6",
                  color: "#673ab7",
                  borderRadius: "8px",
                  '&:hover': { background: "#673ab7", color: "#fff" },
                }}
              >
                Upload
                <input type="file" hidden accept="application/pdf" onChange={handleFileChange} />
              </Button>
            </Box>
            {fileError && (
              <Typography color="error" variant="body2" sx={{ fontFamily: "'Outfit', sans-serif", mt: -1 }}>
                Please upload a valid PDF file.
              </Typography>
            )}

            <TextField
              label="Video URL"
              value={currentPlan.video}
              onChange={(e) => setCurrentPlan({ ...currentPlan, video: e.target.value })}
              fullWidth
              sx={inputSx}
            />
            <TextField
              label="Discourse Link"
              value={currentPlan.discourse}
              onChange={(e) => setCurrentPlan({ ...currentPlan, discourse: e.target.value })}
              fullWidth
              sx={inputSx}
            />

            {/* Modal actions */}
            <Box display="flex" justifyContent="flex-end" gap={1.5} mt={0.5}>
              <Button
                onClick={handleModalClose}
                sx={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  textTransform: "none",
                  color: "#64748b",
                  borderRadius: "10px",
                  '&:hover': { background: "#ffebee", color: "#b71c1c" },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSavePlan}
                sx={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  textTransform: "none",
                  background: "#fff",
                  color: "#673ab7",
                  border: "2px solid #673ab7",
                  borderRadius: "10px",
                  padding: "7px 22px",
                  '&:hover': { background: "#673ab7", color: "#fff", boxShadow: "0 4px 16px rgba(103,58,183,0.25)" },
                }}
              >
                Save
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default LessonPlan;
