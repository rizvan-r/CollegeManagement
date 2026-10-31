import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardRouter from './pages/dashboard/DashboardRouter';
import DepartmentListPage from './pages/departments/DepartmentListPage';
import StudentListPage from './pages/students/StudentListPage';
import FacultyListPage from './pages/faculty/FacultyListPage';
import CourseListPage from './pages/courses/CourseListPage';
import AttendancePage from './pages/attendance/AttendancePage';
import NoticesPage from './pages/notices/NoticesPage';
import UserProfilePage from './pages/profile/UserProfilePage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/login/student" element={<LoginPage forcedPortal="STUDENT" />} />
            <Route path="/login/faculty" element={<LoginPage forcedPortal="FACULTY" />} />
            <Route path="/login/admin" element={<LoginPage forcedPortal="ADMIN" />} />
          </Route>

          {/* Protected Application Routes */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardRouter />} />
            <Route path="/departments" element={<DepartmentListPage />} />
            <Route path="/students" element={<StudentListPage />} />
            <Route path="/faculty" element={<FacultyListPage />} />
            <Route path="/courses" element={<CourseListPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/notices" element={<NoticesPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
