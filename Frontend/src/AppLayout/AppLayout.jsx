import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar/Navbar';
import Student from '../pages/Student/StudentDashboard/Student';
import ComplaintStatus from '../pages/Student/ComplaintStatus/ComplaintStatus'; 
import Materials from '../pages/Student/LectureMaterials/Materials';
import CourseMaterials from '../pages/Student/CourseMaterials/CourseMaterials';
import Faculty from '../pages/Faculty/FacultyDashboard/Faculty';
import Notifications from '../pages/Faculty/Notifications/Notifications';
import Upload from '../pages/Faculty/UploadMaterials/Upload';
import Status from '../pages/Faculty/ActivityStatus/Status';
import Admin from '../pages/Admin/AdminDashboard/Admin';
import FacultyAssign from '../pages/Admin/FacultyAssignment/FacultyAssign';
import ComplaintReview from '../pages/Admin/ComplaintReview/ComplaintReview';
import FacultyScoreMonitoring from '../pages/Admin/FacultyScoreMonitoring/FacultyScoreMonitoring';
import LectureMaterialsMonitoring from '../pages/Admin/LectureMaterialsMonitoring/LectureMaterialsMonitoring';
import LessonPlan from '../pages/Faculty/UploadMaterials/LessonPlan';
import MaterialViewer from '../pages/Shared/MaterialViewer/MaterialViewer';
import Login from '../components/LoginPage/Login';

function AppLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    // Sidebar drawer state
    const [open, setOpen] = useState(true);
    const [hidden, setHidden] = useState(false);

    // Handle sidebar responsiveness
    const handleResize = () => {
        if (window.innerWidth > 1200) {
            setOpen(true);
            setHidden(false);
        } else if (window.innerWidth > 500) {
            setOpen(false);
            setHidden(false);
        } else {
            setOpen(false);
            setHidden(true);
        }
    };

    useEffect(() => {
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Redirect user ONLY on first login, not on every navigation
    useEffect(() => {
        if (user && location.pathname === '/') {
            switch (user.role) {
                case 'Student':
                    navigate('/'); // Default student page
                    break;
                case 'Faculty':
                    navigate('/'); // Default faculty page
                    break;
                case 'Admin':
                    navigate('/'); // Default admin page
                    break;
                default:
                    navigate('/');
            }
        }
    }, [user]);

    // If user is NOT logged in, show the login page
    if (!user) {
        return <Login />;
    }

    // Calculate margin for sidebar
    const getPageMarginLeft = () => {
        if (window.innerWidth < 500) return '0px';
        if (hidden) return '0px';
        return open ? '240px' : '65px';
    };

    return (
        <div className="app-layout-page">
            {/* Navbar */}
            <Navbar
                role={user.role}
                userName={user.name || user.user_id}
                isDrawerOpen={open}
                setDrawerOpen={setOpen}
                isDrawerHidden={hidden}
                setDrawerHidden={setHidden}
                onLogout={logout}
            />

            {/* Routed Pages */}
            <div
                className="routed-pages"
                style={{
                    marginLeft: getPageMarginLeft(),
                    marginTop: '60px',
                    transition: 'margin-left 0.3s ease-in-out',
                }}
            >
                <Routes>
                    {/* Student Routes */}
                    {user.role === 'Student' && (
                        <>
                            <Route path="/" element={<Student />} />
                            <Route path="/ComplaintStatus" element={<ComplaintStatus />} />
                            <Route path="/lecture-materials" element={<Materials />} />
                            <Route path="/course-materials/:courseId" element={<CourseMaterials />} />
                        </>
                    )}

                    {/* Faculty Routes */}
                    {user.role === 'Faculty' && (
                        <>
                            <Route path="/" element={<Faculty />} />
                            <Route path="/notifications" element={<Notifications />} />
                            <Route path="/upload-materials" element={<Upload />} />
                            <Route path="/activity-status" element={<Status />} />
                            
                            <Route path="/lesson-plan/:unitNumber" element={<LessonPlan />} />
                        </>
                    )}

                    {/* Admin Routes */}
                    {user.role === 'Admin' && (
                        <>
                            <Route path="/" element={<Admin />} />
                            <Route path="/faculty-assignment" element={<FacultyAssign />} />
                            <Route path="/complaint-review" element={<ComplaintReview />} />
                            <Route path="/faculty-score-monitoring" element={<FacultyScoreMonitoring />} />
                            <Route path="/lecture-materials-monitoring" element={<LectureMaterialsMonitoring />} />
                        </>
                    )}

                    {/* Catch-all route */}
                    <Route path="/material-viewer/:token" element={<MaterialViewer />} />
                    <Route path="*" element={null} />
                </Routes>
            </div>
        </div>
    );
}

export default AppLayout;
