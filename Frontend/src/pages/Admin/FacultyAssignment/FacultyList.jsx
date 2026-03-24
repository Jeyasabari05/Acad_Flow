import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Box, Typography, Snackbar, Alert, Modal, Button, Paper, TablePagination, Chip,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import { AutoDeleteRounded } from "@mui/icons-material";

const theme = createTheme({
  typography: { fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif" },
  shape: { borderRadius: 12 },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13 },
      },
    },
  },
});

const AssignedFacultiesTable = ({ onDelete, onEdit, onStatusChange }) => {
  const [assignments, setAssignments] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [deleteAssignmentId, setDeleteAssignmentId] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Fetch once on mount — no recursive self-call inside
  const fetchAssignments = async () => {
    try {
      const response = await fetch("https://acad-backend-ve2l.onrender.com/api/admin/faculty-courses");
      const data = await response.json();
      if (data.success) {
        setAssignments(data.data);
      } else {
        setSnackbarMessage(data.message);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } catch {
      setSnackbarMessage("Failed to fetch assignments.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  useEffect(() => { fetchAssignments(); }, []);

  const confirmDelete = async () => {
    if (!deleteAssignmentId) return;
    try {
      await handleDelete(deleteAssignmentId);
      setDeleteModalOpen(false);
      setSnackbarMessage("Assignment deleted successfully.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      fetchAssignments();
    } catch {
      setSnackbarMessage("Failed to delete assignment.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

  const calculateRemainingDays = (deadline) => {
    const diff = new Date(deadline) - new Date();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const handleDeleteConfirmation = (assignmentId) => {
    setDeleteAssignmentId(assignmentId);
    setDeleteModalOpen(true);
  };

  const handleDelete = async (assignmentId) => {
    try {
      const response = await axios.delete(`https://acad-backend-ve2l.onrender.com/api/admin/delete-assignment/${assignmentId}`);
      if (response.status !== 200) console.error("Failed to delete assignment.");
    } catch (error) {
      console.error("Error occurred during deletion:", error);
    }
  };

  const handleSnackbarClose = () => setSnackbarOpen(false);
  const handleChangePage = (e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    if (assignments.length > 0 && page > 0 && page * rowsPerPage >= assignments.length) {
      setPage((prev) => Math.max(0, prev - 1));
    }
  }, [assignments, page, rowsPerPage]);

  const headers = ["Course", "Course Name", "Incharge", "Creating Faculties", "Assigned At", "Deadline", "Actions"];

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ mt: 2 }}>

        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#1a0f3c", letterSpacing: "-0.01em" }}>
              Assigned Faculties
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", color: "#a091cc", mt: 0.3 }}>
              {assignments.length} total assignment{assignments.length !== 1 ? "s" : ""}
            </Typography>
          </Box>
          <Chip
            label={`${assignments.length} Records`}
            size="small"
            sx={{ background: "#ede5ff", color: "#5c35d9", fontWeight: 700, fontSize: 11 }}
          />
        </Box>

        <Paper sx={{
          overflow: "hidden",
          borderRadius: "16px",
          border: "1px solid #ede5ff",
          boxShadow: "0 4px 24px rgba(92,53,217,0.08)",
        }}>
          <TableContainer sx={{ maxHeight: 460 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {headers.map((h) => (
                    <TableCell key={h} sx={{
                      background: "linear-gradient(135deg, #5c35d9 0%, #7c5ce8 100%)",
                      color: "#fff", fontWeight: 800, fontSize: 11,
                      letterSpacing: "0.07em", textTransform: "uppercase",
                      py: "14px", px: "18px", whiteSpace: "nowrap", borderBottom: "none",
                    }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((assignment, index) => {
                    const remainingDays = calculateRemainingDays(assignment.deadline_date);
                    const isUrgent = remainingDays <= 3;
                    const isOverdue = remainingDays < 0;

                    return (
                      <TableRow hover key={index} sx={{
                        "&:hover": { background: "#faf8ff" },
                        "&:last-child td": { borderBottom: "none" },
                        transition: "background 0.15s ease",
                      }}>

                        {/* Course Code */}
                        <TableCell sx={{ px: "18px", py: "14px" }}>
                          <Box sx={{
                            display: "inline-flex", px: 1.5, py: 0.5,
                            background: "#ede5ff", borderRadius: "8px",
                            color: "#5c35d9", fontWeight: 800, fontSize: 12,
                          }}>
                            {assignment.course_code}
                          </Box>
                        </TableCell>

                        {/* Course Name */}
                        <TableCell sx={{ px: "18px", maxWidth: 180 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1a0f3c", lineHeight: 1.4 }}>
                            {assignment.course_name}
                          </Typography>
                        </TableCell>

                        {/* Incharge */}
                        <TableCell sx={{ px: "18px" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box sx={{
                              width: 30, height: 30, borderRadius: "50%",
                              background: "linear-gradient(135deg, #ede5ff, #ddd4ff)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 11, fontWeight: 800, color: "#5c35d9", flexShrink: 0,
                            }}>
                              {(assignment.incharge_faculty_name || "").slice(0, 2).toUpperCase()}
                            </Box>
                            <Box>
                              <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#1a0f3c", lineHeight: 1.2 }}>
                                {assignment.incharge_faculty_name}
                              </Typography>
                              <Typography sx={{ fontSize: 11, color: "#a091cc" }}>
                                {assignment.incharge_faculty_id}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Creating Faculties */}
                        <TableCell sx={{ px: "18px", maxWidth: 220 }}>
                          {assignment.creating_faculties ? (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                              {assignment.creating_faculties.split(",").slice(0, 3).map((name, i) => (
                                <Chip key={i} size="small"
                                  label={`${name.trim()} (${assignment.wetting_faculty_ids?.[i] || "N/A"})`}
                                  sx={{ fontSize: 10, fontWeight: 600, background: "#f5f0ff", color: "#5c35d9", height: 22 }}
                                />
                              ))}
                              {assignment.creating_faculties.split(",").length > 3 && (
                                <Chip size="small"
                                  label={`+${assignment.creating_faculties.split(",").length - 3} more`}
                                  sx={{ fontSize: 10, fontWeight: 700, background: "#ede5ff", color: "#5c35d9", height: 22 }}
                                />
                              )}
                            </Box>
                          ) : (
                            <Typography sx={{ fontSize: 12, color: "#c4b8e8", fontStyle: "italic" }}>None assigned</Typography>
                          )}
                        </TableCell>

                        {/* Assigned At */}
                        <TableCell sx={{ px: "18px" }}>
                          <Typography sx={{ fontSize: 12, color: "#8b7db8", fontWeight: 500 }}>
                            {assignment.created_at ? new Date(assignment.created_at).toLocaleDateString("en-GB") : "N/A"}
                          </Typography>
                        </TableCell>

                        {/* Deadline */}
                        <TableCell sx={{ px: "18px" }}>
                          <Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 700, color: isOverdue ? "#dc2626" : "#1a0f3c" }}>
                              {formatDate(assignment.deadline_date)}
                            </Typography>
                            <Box sx={{
                              display: "inline-flex", mt: 0.3, px: 1, py: 0.3,
                              borderRadius: "6px", fontSize: 10, fontWeight: 700,
                              background: isOverdue ? "#fee2e2" : isUrgent ? "#fff3e0" : "#f0fdf4",
                              color: isOverdue ? "#dc2626" : isUrgent ? "#f57c00" : "#16a34a",
                            }}>
                              {isOverdue ? "Overdue" : `${remainingDays}d left`}
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Actions */}
                        <TableCell sx={{ px: "18px" }}>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <IconButton size="small" onClick={() => onEdit(assignment)} sx={{
                              color: "#5c35d9", border: "1.5px solid #e0d7f8",
                              background: "#faf8ff", width: 32, height: 32,
                              "&:hover": { background: "#5c35d9", color: "#fff", borderColor: "#5c35d9", transform: "scale(1.08)" },
                              transition: "all 0.18s ease",
                            }}>
                              <EditIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeleteConfirmation(assignment.id)} sx={{
                              color: "#dc2626", border: "1.5px solid #fecaca",
                              background: "#fff5f5", width: 32, height: 32,
                              "&:hover": { background: "#dc2626", color: "#fff", borderColor: "#dc2626", transform: "scale(1.08)" },
                              transition: "all 0.18s ease",
                            }}>
                              <AutoDeleteRounded sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[20, 50, 100]}
            component="div"
            count={assignments.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: "1px solid #f0ebff",
              background: "#faf8ff",
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                fontSize: 12, color: "#8b7db8", fontWeight: 600,
              },
            }}
          />
        </Paper>

        {/* Delete Modal */}
        <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
          <Box sx={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "88%", sm: 460 }, bgcolor: "#fff",
            borderRadius: "20px", p: { xs: 3, sm: 4 },
            boxShadow: "0 24px 60px rgba(220,38,38,0.18)",
            border: "1px solid #fecaca",
          }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
              <AutoDeleteRounded sx={{ color: "#dc2626", fontSize: 22 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#1a0f3c", mb: 1 }}>
              Delete Assignment
            </Typography>
            <Typography sx={{ color: "#8b7db8", fontSize: "0.88rem", lineHeight: 1.7, mb: 3 }}>
              This action is <strong style={{ color: "#dc2626" }}>permanent</strong> and cannot be undone. The assignment will be removed and the faculty will be notified.
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button fullWidth variant="outlined"
                onClick={() => setDeleteModalOpen(false)}
                sx={{ borderColor: "#e0d7f8", color: "#8b7db8", "&:hover": { borderColor: "#5c35d9", color: "#5c35d9" } }}
              >Keep It</Button>
              <Button fullWidth variant="contained" onClick={confirmDelete}
                sx={{
                  background: "linear-gradient(135deg, #dc2626, #ef4444)",
                  color: "#fff", boxShadow: "0 4px 16px rgba(220,38,38,0.3)",
                  "&:hover": { background: "linear-gradient(135deg, #b91c1c, #dc2626)" },
                }}
              >Delete Assignment</Button>
            </Box>
          </Box>
        </Modal>

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

export default AssignedFacultiesTable;