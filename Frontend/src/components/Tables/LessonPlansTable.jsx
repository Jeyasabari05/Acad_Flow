// LessonPlansTable.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Stack,
  Chip,
  IconButton,
  Link,
  Typography,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { createMaterialViewerToken, openMaterialUrl } from '../../utils/materialLinks';

export default function LessonPlansTable({ lessonPlans, selectedUnitId, setEditingLesson, setEditLessonModalOpen, handleDeleteLessonPlan }) {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const columns = [
    { id: 'number', label: 'LP Number', minWidth: 60, align: 'center' },
    { id: 'name', label: 'LP Title', minWidth: 200, align: 'center' },
    { id: 'material', label: 'Lecture Material', minWidth: 200, align: 'center' },
    { id: 'videoUrl', label: 'Video Link', minWidth: 150, align: 'center' },
    { id: 'discourseLink', label: 'Discourse Link', minWidth: 150, align: 'center' },
    { id: 'status', label: 'Status', minWidth: 150, align: 'center' },
    { id: 'actions', label: 'Actions', minWidth: 150, align: 'center' },
  ];

  const rows = lessonPlans[selectedUnitId] || [];

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleOpenPdf = async (material) => {
    if (!material) return;
    try {
      if (material instanceof Blob) {
        const blobUrl = URL.createObjectURL(material);
        const token = createMaterialViewerToken(blobUrl, {
          title: "Lesson Plan PDF",
          subtitle: "Document viewer",
        });
        navigate(`/material-viewer/${token}`);
        window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        return;
      }
      const token = createMaterialViewerToken(material, {
        title: "Lesson Plan PDF",
        subtitle: "Document viewer",
      });
      if (!token) throw new Error("Missing material");
      navigate(`/material-viewer/${token}`);
    } catch (error) {
      try {
        await openMaterialUrl(material);
      } catch (fallbackError) {
        console.error("Unable to open PDF", fallbackError);
      }
    }
  };

  return (
    <Paper sx={{ width: '100%', mt: 3, borderRadius: 2, boxShadow: 4 }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{
                    minWidth: column.minWidth,
                    fontWeight: 'bold',
                    backgroundColor: '#f4f6f8',
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length > 0 ? (
              rows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow hover key={row.id}>
                    <TableCell align="center">{row.number}</TableCell>
                    <TableCell align="center">{row.name}</TableCell>
                    <TableCell align="center">
                      {row.material ? (
                        <Link
                          component="button"
                          type="button"
                          onClick={() => handleOpenPdf(row.material)}
                          sx={{
                            color: '#2563eb',
                            textDecoration: 'none',
                            background: 'transparent',
                            border: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          View PDF
                        </Link>
                      ) : (
                        'No Material'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {row.videoUrl ? (
                        <Link
                          href={row.videoUrl}
                          target="_blank"
                          rel="noopener"
                          sx={{
                            color: '#2563eb',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          Watch Video
                        </Link>
                      ) : (
                        'No Video'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {row.discourseLink ? (
                        <Link
                          href={row.discourseLink}
                          target="_blank"
                          rel="noopener"
                          sx={{
                            color: '#2563eb',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          Discussion
                        </Link>
                      ) : (
                        'No Link'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={row.status}
                        color={
                          row.status === 'Approved'
                            ? 'success'
                            : row.status === 'Rejected'
                            ? 'error'
                            : 'warning'
                        }
                        sx={{
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          px: 1.5,
                          py: 0.5,
                          fontSize: '0.9rem',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton
                          onClick={() => {
                            setEditingLesson(row);
                            setEditLessonModalOpen(true);
                          }}
                          sx={{
                            color: 'info.main',
                            '&:hover': {
                              backgroundColor: 'info.light',
                            },
                          }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteLessonPlan(selectedUnitId, row.id)}
                          sx={{
                            color: 'error.main',
                            '&:hover': {
                              backgroundColor: 'error.light',
                            },
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Stack alignItems="center" spacing={2}>
                    <img
                      src="https://via.placeholder.com/150"
                      alt="Empty State"
                      style={{
                        width: '150px',
                        height: '150px',
                        opacity: 0.6,
                      }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#6b7280' }}>
                      No Lesson Plans Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                      Click the "Add Lesson Plan" button to create one.
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
