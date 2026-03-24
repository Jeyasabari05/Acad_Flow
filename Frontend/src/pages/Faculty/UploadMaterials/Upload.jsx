import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Modal,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { Edit, Delete, Add, AutoDeleteRounded, LibraryAddRounded, ScheduleSendRounded, UploadFile, CloudUploadRounded, InfoRounded, CalendarMonthRounded } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import image from '../../../assets/images/empty_state_icon.png';
import UnitInfo from "../../../components/DownloadPDF/UnitInfo";
import UnitCard from "./UnitCard";
import UnitDetailsModal from "./UnitDetailsModal";
import UnitModal from "./UnitCreateModal";
import { useAuth } from "../../../context/AuthContext.jsx";
import axios from "axios";
import "./Upload.css";

function Upload() {
  const [units, setUnits] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentUnit, setCurrentUnit] = useState({ number: "", name: "" });
  const [isEdit, setIsEdit] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [unitError, setUnitError] = useState({ number: false, name: false });
  const navigate = useNavigate();
  const { user } = useAuth();

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [uploadedUnits, setUploadedUnits] = useState([]);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [unitDetails, setUnitDetails] = useState(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState("");

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const storagePrefix = user?.user_id ? `faculty-${user.user_id}` : "faculty-unknown";
  const storageKey = (suffix) => `${storagePrefix}-${suffix}`;
  const courseName = courses.length > 0 ? courses[0].course_name : "No Course Assigned";
  const courseCode = courses.length > 0 ? courses[0].course_code : "---";
  const courseId = courses.length > 0 ? courses[0].course_mapping_id : "---";
  const deadline =
    courses.length > 0
      ? new Date(courses[0].deadline_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : "No Deadline";

  const today = new Date();
  const [day, month, year] = deadline.split('/');
  const deadlineDate = new Date(`${year}-${month}-${day}T00:00:00`);
  const timeDifference = deadlineDate - today;
  const daysRemaining = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
  const deadlineMessage = daysRemaining > 0
    ? `Deadline in ${daysRemaining} days`
    : `Deadline passed ${Math.abs(daysRemaining)} days ago`;

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.user_id) return;
      try {
        const response = await axios.get(`https://acad-backend-ve2l.onrender.com/api/faculty/wetting-faculty/${user.user_id}`);
        setCourses(response.data.data);
        const firstCourse = response.data.data?.[0];
        if (firstCourse?.course_mapping_id) {
          localStorage.setItem(storageKey("currentCourseMappingId"), String(firstCourse.course_mapping_id));
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [user?.user_id]);

  const handleOpenConfirmation = (actionType) => { setConfirmationAction(actionType); setIsConfirmationOpen(true); };
  const handleCloseConfirmation = () => setIsConfirmationOpen(false);
  const handleConfirmAction = () => { setIsConfirmationOpen(false); handleSaveUnit(); };

  const handleSaveUnit = () => {
    const now = new Date().toISOString();
    const isDuplicateNumber = units.some((unit) => unit.number === currentUnit.number);
    if (isDuplicateNumber && !isEdit) {
      setSnackbar({ open: true, message: `Unit number ${currentUnit.number} already exists.`, severity: "error" });
      return;
    }
    if (isEdit) {
      setUnits((prev) => prev.map((u) => u.number === currentUnit.number ? { ...currentUnit, lastUpdated: now } : u));
      setSnackbar({ open: true, message: "Unit updated successfully!", severity: "info" });
    } else {
      setUnits((prev) => [...prev, { ...currentUnit, status: "Pending", created: now, lastUpdated: now }]);
      setSnackbar({ open: true, message: "Unit added successfully!", severity: "success" });
    }
    localStorage.setItem(storageKey("units"), JSON.stringify([...units]));
    handleModalClose();
  };

  const handleDetailsModalOpen = (unit) => {
    setUnitDetails({
      number: unit.number,
      name: unit.name,
      introduction: unit.introduction || "N/A",
      summary: unit.summary || "N/A",
      mindMap: unit.mindMap || "Not uploaded",
      references: unit.references || "N/A",
      objectives: unit.objectives || "N/A",
      outcomes: unit.outcomes || "N/A",
      lastUpdated: unit.lastUpdated || "N/A",
      created: unit.created || "N/A",
      lessonPlanCount: JSON.parse(localStorage.getItem(storageKey(`lessonPlans-${unit.number}`)))?.length || 0,
    });
    setDetailsModalOpen(true);
  };

  const handleDetailsModalClose = () => setDetailsModalOpen(false);

  useEffect(() => {
    const savedUnits = JSON.parse(localStorage.getItem(storageKey("uploadedUnits"))) || [];
    setUploadedUnits(savedUnits);
  }, [storagePrefix]);

  useEffect(() => {
    if (!user?.user_id) {
      setUnits([]);
      setUploadedUnits([]);
      setSelectedUnit(null);
    }
  }, [storagePrefix]);

  const handleUploadClick = (unit) => { setSelectedUnit(unit); setUploadModalOpen(true); };

  const handleUploadConfirm = async () => {
    if (selectedUnit) {
      try {
        const unitData = {
          course_mapping_id: courseId,
          faculty_id: user?.user_id,
          unit_number: selectedUnit.number,
          unit_name: selectedUnit.name,
          introduction: selectedUnit.introduction || "",
          summary: selectedUnit.summary || "",
          reference: selectedUnit.references || "",
          mind_map: selectedUnit.mindMap || "",
          objective: selectedUnit.objectives || "",
          outcomes: selectedUnit.outcomes || "",
          approval_status: "Pending",
        };
        if (!courseId) {
          setSnackbar({ open: true, message: "Error: Course Mapping ID is missing.", severity: "error" });
          return;
        }
        const response = await fetch("https://acad-backend-ve2l.onrender.com/api/faculty/unit-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(unitData),
        });
        if (!response.ok) throw new Error("Failed to upload unit");
        const updatedUploadedUnits = [...uploadedUnits, selectedUnit.number];
        setUploadedUnits(updatedUploadedUnits);
        localStorage.setItem(storageKey("uploadedUnits"), JSON.stringify(updatedUploadedUnits));
        localStorage.setItem(storageKey(`hasChanges-${selectedUnit.number}`), "false");
        setUploadModalOpen(false);
        setSnackbar({ open: true, message: `Unit ${selectedUnit.number} uploaded successfully!`, severity: "success" });
      } catch (error) {
        setSnackbar({ open: true, message: "Failed to upload unit. Please try again.", severity: "error" });
      }
    }
  };

  useEffect(() => {
    const checkForChanges = () => {
      if (selectedUnit) {
        const hasChanges = localStorage.getItem(storageKey(`hasChanges-${selectedUnit.number}`)) === "true";
        if (hasChanges) {
          setUploadedUnits((prev) => prev.filter((unit) => unit !== selectedUnit.number));
        }
      }
    };
    checkForChanges();
    window.addEventListener("storage", checkForChanges);
    return () => window.removeEventListener("storage", checkForChanges);
  }, [selectedUnit, storagePrefix]);

  useEffect(() => {
    const storedUnits = JSON.parse(localStorage.getItem(storageKey("units")));
    setUnits(storedUnits || []);
  }, [storagePrefix]);

  useEffect(() => {
    if (units.length > 0) localStorage.setItem(storageKey("units"), JSON.stringify(units));
  }, [units, storagePrefix]);

  const handleModalOpen = (unit = null) => {
    if (unit) {
      setCurrentUnit(unit);
      setIsEdit(true);
    } else {
      setCurrentUnit({ number: "", name: "" });
      setIsEdit(false);
    }
    setModalOpen(true);
    if (unit) localStorage.setItem(storageKey(`hasChanges-${unit.number}`), "true");
  };

  const handleModalClose = () => setModalOpen(false);
  const handleDeleteDialogOpen = (unit) => { setUnitToDelete(unit); setDeleteDialogOpen(true); };
  const handleDeleteDialogClose = () => setDeleteDialogOpen(false);
  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  const handleDeleteUnit = () => {
    const updatedUnits = units.filter((u) => u.number !== unitToDelete.number);
    localStorage.removeItem(storageKey(`lessonPlans-${unitToDelete.number}`));
    setUploadedUnits((prev) => prev.filter((unit) => unit !== unitToDelete.number));
    localStorage.setItem(storageKey("uploadedUnits"), JSON.stringify(uploadedUnits.filter((unit) => unit !== unitToDelete.number)));
    setUnits(updatedUnits);
    localStorage.setItem(storageKey("units"), JSON.stringify(updatedUnits));
    setSnackbar({ open: true, message: "Unit and corresponding lesson plans deleted successfully!", severity: "success" });
    handleDeleteDialogClose();
  };

  const dialogPaperSx = {
    borderRadius: "16px",
    boxShadow: "0 20px 50px rgba(15,5,40,0.18)",
    fontFamily: "'Outfit', sans-serif",
  };

  return (
    <Box className="up-page">
      {/* Title */}
      <Typography className="up-title" sx={{ fontFamily: "'Outfit', sans-serif !important" }}>
        Upload Materials for{" "}
        <span className="accent">{courseName}</span>{" "}
        <span style={{ color: "#94a3b8", fontWeight: 500 }}>·</span>{" "}
        <span className="accent">{courseCode}</span>
      </Typography>

      {/* Empty state */}
      {units.length === 0 ? (
        <Box className="up-empty">
          {/* Deadline bar */}
          <Box
            className="up-deadline"
            sx={{ display: 'inline-flex', mb: 3 }}
          >
            <CalendarMonthRounded className="up-deadline-icon" />
            <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography className="up-deadline-label">Deadline: {deadline}</Typography>
              <Typography className="up-deadline-msg">({deadlineMessage})</Typography>
            </Box>
          </Box>

          <br />
          <img src={image} alt="No Units" style={{ width: "130px", marginBottom: "16px", opacity: 0.5, filter: "drop-shadow(0 4px 12px rgba(103,58,183,0.15))" }} />
          <Typography variant="h6" sx={{ color: '#1a1036', fontSize: '1.4rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", mb: 1 }}>
            No Units Created Yet
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', fontFamily: "'Outfit', sans-serif", fontWeight: 500, mb: 3, maxWidth: "420px", margin: "0 auto 24px" }}>
            Click "Add Unit" below to create a new unit and start adding lesson plans.
          </Typography>
          <Button
            variant="contained"
            onClick={() => handleModalOpen()}
            className="up-btn-add"
            sx={{ fontFamily: "'Outfit', sans-serif !important" }}
          >
            <Add sx={{ mr: 1 }} /> Add Unit
          </Button>
          <Typography className="up-note" sx={{ mt: 4, fontFamily: "'Outfit', sans-serif !important" }}>
            Note: Units will only be visible to students after approval from Incharge faculty.
          </Typography>
        </Box>
      ) : (
        <>
          {/* Toolbar */}
          <Box className="up-toolbar">
            <Button
              variant="contained"
              onClick={() => handleModalOpen()}
              className="up-btn-add"
              sx={{ fontFamily: "'Outfit', sans-serif !important" }}
            >
              <LibraryAddRounded sx={{ mr: 1 }} /> Add Unit
            </Button>

            {/* Deadline */}
            <Box
              className="up-deadline"
              sx={{ display: 'inline-flex' }}
            >
              <CalendarMonthRounded className="up-deadline-icon" />
              <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography className="up-deadline-label">Deadline: {deadline}</Typography>
                <Typography className="up-deadline-msg">({deadlineMessage})</Typography>
              </Box>
            </Box>
          </Box>

          {/* Unit cards */}
          <Grid container spacing={2}>
            {units.map((unit, idx) => {
              const lessonPlanCount = JSON.parse(localStorage.getItem(storageKey(`lessonPlans-${unit.number}`)))?.length || 0;
              return (
                <Grid item xs={12} sm={6} md={4} key={unit.number} className="up-grid-item" sx={{ animationDelay: `${idx * 0.06}s` }}>
                  <UnitCard
                    unit={unit}
                    courseMappingId={courseId}
                    handleUploadClick={handleUploadClick}
                    uploadedUnits={uploadedUnits}
                    getHasChanges={(unitNumber) => localStorage.getItem(storageKey(`hasChanges-${unitNumber}`))}
                    handleDetailsModalOpen={handleDetailsModalOpen}
                    handleModalOpen={handleModalOpen}
                    handleDeleteDialogOpen={handleDeleteDialogOpen}
                    navigate={navigate}
                    lessonPlanCount={lessonPlanCount}
                  />
                </Grid>
              );
            })}
          </Grid>
          <Typography className="up-note" sx={{ mt: 4, pl: { xs: 1, sm: 1.5 }, pb: { xs: 2, sm: 3 }, textAlign: 'left', fontFamily: "'Outfit', sans-serif !important" }}>
            Note: Units created will only be for your allocated subject and displayed to students after approval from Incharge faculty.
          </Typography>
        </>
      )}

      {/* Unit Details Modal */}
      <UnitDetailsModal open={detailsModalOpen} handleClose={handleDetailsModalClose} unitDetails={unitDetails} />

      {/* Unit Create/Edit Modal */}
      <UnitModal
        modalOpen={modalOpen}
        handleModalClose={handleModalClose}
        isEdit={isEdit}
        currentUnit={currentUnit}
        setCurrentUnit={setCurrentUnit}
        unitError={unitError}
        setUnitError={setUnitError}
        snackbar={snackbar}
        handleOpenConfirmation={handleOpenConfirmation}
      />

      {/* Confirmation Dialog */}
      <Dialog
        open={isConfirmationOpen}
        onClose={handleCloseConfirmation}
        fullWidth
        PaperProps={{ sx: { ...dialogPaperSx, maxWidth: "480px" } }}
      >
        <DialogTitle sx={{ color: "#673ab7", fontWeight: 800, fontFamily: "'Outfit', sans-serif", textAlign: "center", fontSize: { xs: "1rem", sm: "1.2rem" } }}>
          {confirmationAction === "edit" ? "Edit this Unit!" : "Create this Unit!"}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#64748b", fontWeight: 600, fontFamily: "'Outfit', sans-serif", fontSize: { xs: "0.88rem", sm: "0.95rem" }, lineHeight: 1.6 }}>
            {confirmationAction === "edit"
              ? "Are you sure you want to save the changes to this unit? Changes will be sent to the Incharge for approval."
              : "Are you sure you want to create this new unit? It will be sent to Incharge for approval."}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, mb: 1.5, gap: 1 }}>
          <Button
            onClick={handleCloseConfirmation}
            sx={{ textTransform: "none", fontWeight: 700, color: "#64748b", fontFamily: "'Outfit', sans-serif", borderRadius: "10px", '&:hover': { color: "#b71c1c", background: "#ffebee" } }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
              color: "#673ab7",
              background: "#fff",
              border: "2px solid #673ab7",
              borderRadius: "10px",
              '&:hover': { background: "#673ab7", color: "#fff", boxShadow: "0 4px 16px rgba(103,58,183,0.25)" },
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload confirm modal */}
      <Modal open={uploadModalOpen} onClose={() => setUploadModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "92%", sm: "460px" },
            bgcolor: "#fff",
            borderRadius: "20px",
            boxShadow: "0 24px 60px rgba(15,5,40,0.22)",
            overflow: "hidden",
            animation: "modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both",
            '@keyframes modalIn': {
              from: { opacity: 0, transform: 'translate(-50%,-48%) scale(0.94)' },
              to:   { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' },
            },
          }}
        >
          <Box sx={{ background: "linear-gradient(135deg, #f9f6ff, #ede7f6)", padding: "18px 24px 14px", borderBottom: "1.5px solid #e8e3f5", textAlign: "center" }}>
            <Typography sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: "#673ab7", fontSize: "1.2rem" }}>
              Confirm Upload
            </Typography>
          </Box>
          <Box sx={{ padding: "20px 24px" }}>
            <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 600, fontFamily: "'Outfit', sans-serif", mb: 3, lineHeight: 1.6 }}>
              Are you sure you want to upload all lesson plans for Unit{" "}
              <strong style={{ color: "#673ab7" }}>{selectedUnit?.number || "N/A"}</strong> for approval?
            </Typography>
            <Box display="flex" justifyContent="flex-end" gap={1.5}>
              <Button
                onClick={() => setUploadModalOpen(false)}
                sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, textTransform: "none", color: "#64748b", borderRadius: "10px", '&:hover': { color: "red", background: "#ffebee" } }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadConfirm}
                sx={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  textTransform: "none",
                  color: "#673ab7",
                  background: "#fff",
                  border: "2px solid #673ab7",
                  borderRadius: "10px",
                  '&:hover': { background: "#673ab7", color: "#fff" },
                }}
              >
                Upload
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose} PaperProps={{ sx: dialogPaperSx }}>
        <DialogTitle sx={{ color: '#673ab7', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
          Delete Unit!
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#64748b', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
            Are you sure you want to delete Unit {unitToDelete?.number}? All associated lesson plans will also be deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ mr: '16px', mb: '12px', gap: 1 }}>
          <Button
            onClick={handleDeleteDialogClose}
            sx={{ textTransform: 'none', fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#64748b', borderRadius: "10px", '&:hover': { background: "#f1f5f9" } }}
          >
            Cancel
          </Button>
          <Button
            color="error"
            onClick={handleDeleteUnit}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
              color: '#b71c1c',
              background: '#fff',
              border: '2px solid #b71c1c',
              borderRadius: "10px",
              '&:hover': { background: '#b71c1c', color: '#fff', boxShadow: "0 4px 12px rgba(183,28,28,0.25)" },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Upload;
