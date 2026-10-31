import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

export const CourseEnrollmentPage = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  const canManage = ['ADMIN', 'DEPARTMENT_STAFF', 'FACULTY'].includes(user?.role);

  // Data States
  const [availableCourses, setAvailableCourses] = useState([]);
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('ALL');

  // Active Tab (for Students)
  const [activeTab, setActiveTab] = useState('MY_COURSES'); // 'MY_COURSES' | 'CATALOG'

  // Modal State (for Admin / Staff)
  const [showModal, setShowModal] = useState(false);
  const [selectedCourseAssignmentId, setSelectedCourseAssignmentId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Notification Banners
  const [successBanner, setSuccessBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');

  // Fetch Available Courses Catalog
  const fetchAvailableCourses = async () => {
    try {
      const res = await axiosClient.get('/enrollments/available-courses');
      if (res.success && Array.isArray(res.data)) {
        setAvailableCourses(res.data);
        if (!selectedCourseAssignmentId && res.data.length > 0) {
          setSelectedCourseAssignmentId(res.data[0].course_assignment_id);
        }
      }
    } catch (err) {
      console.warn('Available courses fetch warning:', err.message);
    }
  };

  // Fetch All Enrollments (Admin / Faculty)
  const fetchAllEnrollments = async () => {
    try {
      const res = await axiosClient.get('/enrollments');
      if (res.success && Array.isArray(res.data)) {
        setAllEnrollments(res.data);
      }
    } catch (err) {
      console.warn('All enrollments fetch warning:', err.message);
    }
  };

  // Fetch Current Student's Enrolled Courses
  const fetchMyCourses = async () => {
    try {
      // Find current student profile
      const stuRes = await axiosClient.get('/students');
      const myStu = stuRes.data?.find((s) => s.email?.toLowerCase() === user.email?.toLowerCase());
      const stuId = myStu?.id || stuRes.data?.[0]?.id;
      if (stuId) {
        const enrRes = await axiosClient.get(`/enrollments/student/${stuId}`);
        if (enrRes.success && Array.isArray(enrRes.data)) {
          setMyCourses(enrRes.data);
        }
      }
    } catch (err) {
      console.warn('Student courses fetch warning:', err.message);
    }
  };

  // Fetch All Students (for enrollment modal)
  const fetchStudentsList = async () => {
    try {
      const res = await axiosClient.get('/students');
      if (res.success && Array.isArray(res.data)) {
        setStudentsList(res.data);
      }
    } catch (err) {
      console.warn('Students list fetch warning:', err.message);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAvailableCourses(),
      canManage ? fetchAllEnrollments() : Promise.resolve(),
      isStudent ? fetchMyCourses() : Promise.resolve(),
      canManage ? fetchStudentsList() : Promise.resolve(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  // Handle Student Self-Enrollment
  const handleStudentEnroll = async (courseAssignmentId, courseTitle) => {
    setSuccessBanner('');
    setErrorBanner('');
    try {
      const res = await axiosClient.post('/enrollments', {
        courseAssignmentId,
      });
      if (res.success) {
        setSuccessBanner(`Successfully enrolled in ${courseTitle}!`);
        await loadAllData();
      }
    } catch (err) {
      setErrorBanner(err.message || 'Failed to enroll in course');
    } finally {
      setTimeout(() => setSuccessBanner(''), 5000);
    }
  };

  // Handle Unenroll / Drop Course
  const handleDropEnrollment = async (enrollmentId, courseTitle) => {
    if (!window.confirm(`Are you sure you want to drop enrollment for ${courseTitle}?`)) return;
    setSuccessBanner('');
    setErrorBanner('');
    try {
      const res = await axiosClient.delete(`/enrollments/${enrollmentId}`);
      if (res.success) {
        setSuccessBanner(`Course ${courseTitle} dropped successfully.`);
        await loadAllData();
      }
    } catch (err) {
      setErrorBanner(err.message || 'Failed to drop course enrollment');
    } finally {
      setTimeout(() => setSuccessBanner(''), 5000);
    }
  };

  // Handle Admin Batch Enrollment
  const handleBatchEnroll = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!selectedCourseAssignmentId) {
      setModalError('Please select a course section.');
      return;
    }
    if (selectedStudentIds.length === 0) {
      setModalError('Please select at least one student to enroll.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axiosClient.post('/enrollments/batch', {
        courseAssignmentId: selectedCourseAssignmentId,
        studentIds: selectedStudentIds,
      });
      if (res.success) {
        setShowModal(false);
        setSelectedStudentIds([]);
        setSuccessBanner(`Successfully enrolled ${res.enrolledCount} students into the course section!`);
        await loadAllData();
      }
    } catch (err) {
      setModalError(err.message || 'Batch enrollment failed.');
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccessBanner(''), 6000);
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    const ids = filteredModalStudents.map((s) => s.id);
    setSelectedStudentIds(ids);
  };

  const clearStudentSelection = () => {
    setSelectedStudentIds([]);
  };

  // Filter calculations
  const filteredModalStudents = studentsList.filter((s) => {
    const q = studentSearch.toLowerCase();
    return (
      (s.first_name || '').toLowerCase().includes(q) ||
      (s.last_name || '').toLowerCase().includes(q) ||
      (s.admission_number || '').toLowerCase().includes(q) ||
      (s.department_code || '').toLowerCase().includes(q)
    );
  });

  const filteredEnrollments = allEnrollments.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (e.student_first_name || '').toLowerCase().includes(q) ||
      (e.student_last_name || '').toLowerCase().includes(q) ||
      (e.admission_number || '').toLowerCase().includes(q) ||
      (e.course_code || '').toLowerCase().includes(q) ||
      (e.course_title || '').toLowerCase().includes(q);

    const matchesCourse = courseFilter === 'ALL' || e.course_code === courseFilter;
    return matchesSearch && matchesCourse;
  });

  // Calculate Student Credit Load
  const myTotalCredits = myCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);

  return (
    <div className="space-y-5">
      {/* 1. Contextual Academic Governance Bar (Stitch Spec) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-2 rounded border border-[#e2e8f0]">
        <div className="flex items-center gap-1.5 text-xs text-[#515f74]">
          <span className="material-symbols-outlined text-[17px] text-[#515f74]">how_to_reg</span>
          <span className="font-bold uppercase tracking-wider text-[11px] text-[#0b1c30]">Curricular Registry</span>
          <span className="text-[#94a3b8]">/</span>
          <span className="font-semibold uppercase tracking-wider text-[11px]">Course Enrollment Horizon</span>
          <span className="text-[#94a3b8]">/</span>
          <span className="badge-mono text-[10px] font-bold">AY 2025–2026</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block mr-1"></span>
            REGISTRATION: OPEN
          </span>
          <span className="badge-mono text-[10px]">SIS-SYNC: LIVE</span>
        </div>
      </div>

      {/* 2. Header & Action Horizon */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded border border-[#e2e8f0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">
              {isStudent ? 'Student Academic Enrollment Portal' : 'Institutional Enrollment Governance'}
            </span>
            <span className="badge-mono text-[10px]">
              {isStudent ? `${myCourses.length} COURSES REGISTERED` : `${allEnrollments.length} TOTAL ENROLLMENTS`}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0b1c30] tracking-tight">
            {isStudent ? 'Course Enrollment & Registration' : 'Student Course Enrollments & Roster Management'}
          </h1>
          <p className="text-xs text-[#515f74] mt-0.5">
            {isStudent
              ? 'Select semester electives and core courses, verify faculty instructors, and track your total registered credit capacity.'
              : 'Enroll students into curriculum course sections, manage cross-departmental rosters, and audit student workloads.'}
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowModal(true);
                setModalError('');
                setSelectedStudentIds([]);
              }}
              className="btn-stitch-primary py-2 px-4 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">person_add_alt</span>
              <span>Enroll Students</span>
            </button>
          </div>
        )}
      </div>

      {/* Notification Banners */}
      {successBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <span className="material-symbols-outlined text-emerald-700 text-[18px]">check_circle</span>
          <span>{successBanner}</span>
        </div>
      )}
      {errorBanner && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded text-xs text-rose-800 flex items-center gap-2 font-medium">
          <span className="material-symbols-outlined text-rose-700 text-[18px]">error</span>
          <span>{errorBanner}</span>
        </div>
      )}

      {/* 3. KPI Metric Cards */}
      {isStudent ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-stitch p-4 flex flex-col justify-between bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">Enrolled Courses</span>
              <span className="material-symbols-outlined text-[#0f172a] text-[18px]">menu_book</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-[#0b1c30]">{myCourses.length}</span>
              <span className="text-xs text-[#515f74]">Active Sections</span>
            </div>
            <div className="mt-2 text-[11px] text-[#515f74] flex justify-between">
              <span>Required: 4 min</span>
              <span className="font-semibold text-emerald-700">Satisfied</span>
            </div>
          </div>

          <div className="card-stitch p-4 flex flex-col justify-between bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">Credit Load</span>
              <span className="material-symbols-outlined text-sky-700 text-[18px]">credit_card</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-[#075985]">{myTotalCredits}</span>
              <span className="text-xs text-[#515f74]">/ 24 Max Credits</span>
            </div>
            <div className="w-full bg-[#eff4ff] h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-[#0f172a] h-full" style={{ width: `${(myTotalCredits / 24) * 100}%` }}></div>
            </div>
          </div>

          <div className="card-stitch p-4 flex flex-col justify-between bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">Academic Standing</span>
              <span className="material-symbols-outlined text-emerald-700 text-[18px]">verified</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-[#0b1c30]">Good Standing</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold mt-2">Eligible for all electives</span>
          </div>

          <div className="card-stitch p-4 flex flex-col justify-between bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">Catalog Offerings</span>
              <span className="material-symbols-outlined text-amber-700 text-[18px]">local_library</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-[#0b1c30]">{availableCourses.length}</span>
              <span className="text-xs text-[#515f74]">Sections Open</span>
            </div>
            <span className="text-[11px] text-[#515f74] mt-2">Registration window active</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-stitch p-4 flex flex-col justify-between bg-white">
            <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">Total Enrollments</span>
            <span className="text-2xl font-bold text-[#0b1c30] mt-2">{allEnrollments.length}</span>
            <span className="text-[11px] text-[#515f74] mt-1">Cross-departmental seats</span>
          </div>
          <div className="card-stitch p-4 flex flex-col justify-between bg-white">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Available Courses</span>
            <span className="text-2xl font-bold text-emerald-700 mt-2">{availableCourses.length}</span>
            <span className="text-[11px] text-[#515f74] mt-1">Active teaching sections</span>
          </div>
          <div className="card-stitch p-4 flex flex-col justify-between bg-white">
            <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">Enrolled Students</span>
            <span className="text-2xl font-bold text-[#075985] mt-2">
              {new Set(allEnrollments.map((e) => e.student_id)).size}
            </span>
            <span className="text-[11px] text-[#515f74] mt-1">Unique enrolled individuals</span>
          </div>
          <div className="card-stitch p-4 flex flex-col justify-between bg-white">
            <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">Avg Class Size</span>
            <span className="text-2xl font-bold text-[#0b1c30] mt-2">
              {availableCourses.length > 0
                ? (allEnrollments.length / availableCourses.length).toFixed(1)
                : '0'}
            </span>
            <span className="text-[11px] text-[#515f74] mt-1">Students per section</span>
          </div>
        </div>
      )}

      {/* 4. Student View Tabs */}
      {isStudent && (
        <div className="flex items-center gap-2 border-b border-[#cbd5e1] pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('MY_COURSES')}
            className={`px-4 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'MY_COURSES'
                ? 'bg-[#0f172a] text-white shadow-xs'
                : 'text-[#515f74] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">school</span>
            <span>My Enrolled Courses ({myCourses.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CATALOG')}
            className={`px-4 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'CATALOG'
                ? 'bg-[#0f172a] text-white shadow-xs'
                : 'text-[#515f74] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">add_task</span>
            <span>Available Course Catalog ({availableCourses.length})</span>
          </button>
        </div>
      )}

      {/* 5. Main Content Area */}
      {loading ? (
        <div className="py-20 flex justify-center bg-white card-stitch">
          <LoadingSpinner size="md" text="Loading course enrollment registers from database..." />
        </div>
      ) : isStudent && activeTab === 'MY_COURSES' ? (
        // STUDENT VIEW: My Enrolled Courses
        <div className="card-stitch overflow-hidden bg-white">
          <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0b1c30]">Your Active Course Enrollments</h2>
            <span className="badge-mono text-xs">{myTotalCredits} Total Registered Credits</span>
          </div>

          {myCourses.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#515f74]">
              <span className="material-symbols-outlined text-[36px] text-[#94a3b8] block mb-2">assignment_late</span>
              <p className="font-semibold text-sm text-[#0b1c30]">No courses currently enrolled.</p>
              <p className="mt-1">Switch to the "Available Course Catalog" tab to select and register your semester courses.</p>
              <button
                type="button"
                onClick={() => setActiveTab('CATALOG')}
                className="btn-stitch-primary mt-4 py-1.5 px-3 text-xs"
              >
                Browse Course Catalog
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f1f5f9] border-b border-[#cbd5e1] text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Course Code</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Credits</th>
                    <th className="py-2.5 px-3">Section</th>
                    <th className="py-2.5 px-3">Instructor</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Enrolled Date</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] text-xs">
                  {myCourses.map((c) => (
                    <tr key={c.enrollment_id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="badge-mono font-bold">{c.course_code}</span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#0b1c30]">{c.course_title}</td>
                      <td className="py-2.5 px-3">
                        <span className="badge-sky">{c.credits} CR</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">Sec {c.section}</td>
                      <td className="py-2.5 px-3 font-medium text-[#0b1c30]">{c.faculty_name}</td>
                      <td className="py-2.5 px-3 text-[#515f74]">{c.department_name}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#515f74]">
                        {c.enrolled_at ? new Date(c.enrolled_at).toLocaleDateString() : 'Active'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDropEnrollment(c.enrollment_id, `${c.course_code}: ${c.course_title}`)}
                          className="px-2 py-1 rounded bg-[#fff1f2] border border-[#fecdd3] text-[#9f1239] hover:bg-[#ffe4e6] text-xs font-semibold transition-all"
                        >
                          Drop Course
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : isStudent && activeTab === 'CATALOG' ? (
        // STUDENT VIEW: Available Catalog for Self-Enrollment
        <div className="card-stitch overflow-hidden bg-white">
          <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#0b1c30]">Curriculum Course Offerings</h2>
              <p className="text-xs text-[#515f74] mt-0.5">Click "Enroll in Course" to instantly register a seat in the section.</p>
            </div>
            <span className="badge-mono text-xs">{availableCourses.length} Offerings Available</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f1f5f9] border-b border-[#cbd5e1] text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                  <th className="py-2.5 px-3">SIS Code</th>
                  <th className="py-2.5 px-3">Course Title</th>
                  <th className="py-2.5 px-3">Credits</th>
                  <th className="py-2.5 px-3">Semester</th>
                  <th className="py-2.5 px-3">Section</th>
                  <th className="py-2.5 px-3">Professor</th>
                  <th className="py-2.5 px-3">Enrolled</th>
                  <th className="py-2.5 px-3 text-right">Status / Enrollment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] text-xs">
                {availableCourses.map((c) => {
                  const isAlreadyEnrolled = myCourses.some((my) => my.course_assignment_id === c.course_assignment_id);
                  const matchingEnrollment = myCourses.find((my) => my.course_assignment_id === c.course_assignment_id);

                  return (
                    <tr key={c.course_assignment_id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="badge-mono font-bold">{c.course_code}</span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#0b1c30]">{c.course_title}</td>
                      <td className="py-2.5 px-3">
                        <span className="badge-sky">{c.credits} CR</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">SEM {c.semester}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">Sec {c.section}</td>
                      <td className="py-2.5 px-3 font-medium text-[#0b1c30]">{c.faculty_name}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-[#0b1c30]">{c.enrolled_count} Students</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isAlreadyEnrolled ? (
                          <div className="inline-flex items-center gap-2">
                            <span className="badge-emerald font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block mr-1"></span>
                              Enrolled
                            </span>
                            {matchingEnrollment && (
                              <button
                                type="button"
                                onClick={() => handleDropEnrollment(matchingEnrollment.enrollment_id, `${c.course_code}: ${c.course_title}`)}
                                className="text-[11px] text-[#9f1239] hover:underline"
                              >
                                Drop
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStudentEnroll(c.course_assignment_id, `${c.course_code}: ${c.course_title}`)}
                            className="btn-stitch-primary py-1 px-3 text-xs"
                          >
                            <span className="material-symbols-outlined text-[15px]">add_circle</span>
                            <span>Enroll in Course</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // ADMIN / FACULTY VIEW: All Enrolled Students Table
        <div className="card-stitch overflow-hidden bg-white">
          <div className="p-3 border-b border-[#e2e8f0] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#76777d] text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search student name, admission #, course..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#f8f9ff] border border-[#cbd5e1] rounded text-xs text-[#0b1c30] placeholder-[#94a3b8] focus:outline-none focus:border-[#0f172a] focus:bg-white"
                />
              </div>

              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="w-full sm:w-44 px-2.5 py-1.5 bg-[#f8f9ff] border border-[#cbd5e1] rounded text-xs text-[#0b1c30] font-semibold focus:outline-none"
              >
                <option value="ALL">All Courses</option>
                {Array.from(new Set(allEnrollments.map((e) => e.course_code))).map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs text-[#515f74]">
              Enrolled Seats: <strong className="text-[#0b1c30]">{filteredEnrollments.length}</strong>
            </span>
          </div>

          {filteredEnrollments.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#515f74]">
              <span className="material-symbols-outlined text-[36px] text-[#94a3b8] block mb-2">person_search</span>
              No enrollments matching the selected filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f1f5f9] border-b border-[#cbd5e1] text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Admission #</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Enrolled Course</th>
                    <th className="py-2.5 px-3">Section</th>
                    <th className="py-2.5 px-3">Credits</th>
                    <th className="py-2.5 px-3">Instructor</th>
                    <th className="py-2.5 px-3">Enrolled Date</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] text-xs">
                  {filteredEnrollments.map((enr) => (
                    <tr key={enr.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="badge-mono font-bold">{enr.admission_number}</span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#0b1c30]">
                        {enr.student_first_name} {enr.student_last_name}
                      </td>
                      <td className="py-2.5 px-3 text-[#515f74]">{enr.department_code || enr.department_name}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="badge-mono font-bold">{enr.course_code}</span>
                          <span className="font-medium text-[#0b1c30] truncate max-w-xs">{enr.course_title}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">Sec {enr.section}</td>
                      <td className="py-2.5 px-3">
                        <span className="badge-sky">{enr.course_credits} CR</span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#0b1c30]">{enr.faculty_name}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#515f74]">
                        {enr.enrolled_at ? new Date(enr.enrolled_at).toLocaleDateString() : 'Active'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleDropEnrollment(enr.id, `${enr.student_first_name} in ${enr.course_code}`)
                          }
                          title="Unenroll student"
                          className="p-1 rounded text-[#515f74] hover:bg-[#fff1f2] hover:text-[#9f1239] transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">person_remove</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. Enroll Students Modal (Admin / Staff) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#cbd5e1] shadow-xl max-w-2xl w-full p-6 relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0f172a] text-[22px]">how_to_reg</span>
                <div>
                  <h2 className="text-base font-bold text-[#0b1c30]">Enroll Students into Course Section</h2>
                  <p className="text-[11px] text-[#515f74]">Select teaching section and choose students to register.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-[#76777d] hover:text-[#0b1c30]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {modalError && (
              <div className="mb-3 p-2.5 rounded bg-[#fff1f2] border border-[#fecdd3] text-[#9f1239] text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleBatchEnroll} className="space-y-4 flex-1 flex flex-col min-h-0 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#515f74] mb-1">
                  Target Course Section
                </label>
                <select
                  required
                  value={selectedCourseAssignmentId}
                  onChange={(e) => setSelectedCourseAssignmentId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-[#cbd5e1] rounded text-xs font-semibold text-[#0b1c30] focus:border-[#0f172a] focus:outline-none"
                >
                  {availableCourses.map((c) => (
                    <option key={c.course_assignment_id} value={c.course_assignment_id}>
                      {c.course_code} - {c.course_title} (Sec {c.section} • {c.faculty_name} • {c.credits} CR)
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Picker Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-[#e2e8f0]">
                <div className="relative w-full sm:w-64">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#76777d] text-[15px]">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Search candidate students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1 text-xs border border-[#cbd5e1] rounded focus:outline-none focus:border-[#0f172a]"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={selectAllStudents}
                    className="text-[#075985] font-semibold hover:underline"
                  >
                    Select All ({filteredModalStudents.length})
                  </button>
                  <span className="text-[#cbd5e1]">|</span>
                  <button
                    type="button"
                    onClick={clearStudentSelection}
                    className="text-[#515f74] font-semibold hover:underline"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>

              {/* Student Checklist Table */}
              <div className="flex-1 overflow-y-auto border border-[#cbd5e1] rounded divide-y divide-[#e2e8f0] min-h-48 max-h-64">
                {filteredModalStudents.length === 0 ? (
                  <p className="p-4 text-center text-xs text-[#515f74]">No students found.</p>
                ) : (
                  filteredModalStudents.map((stu) => {
                    const isSelected = selectedStudentIds.includes(stu.id);
                    return (
                      <label
                        key={stu.id}
                        className={`flex items-center justify-between p-2.5 cursor-pointer hover:bg-[#f8fafc] transition-colors ${
                          isSelected ? 'bg-[#eff4ff]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleStudentSelection(stu.id)}
                            className="rounded text-[#0f172a] focus:ring-0 w-4 h-4"
                          />
                          <div>
                            <p className="font-semibold text-[#0b1c30]">
                              {stu.first_name} {stu.last_name}
                            </p>
                            <p className="text-[11px] text-[#515f74]">
                              {stu.admission_number} • {stu.department_name || stu.department_code} (SEM {stu.current_semester})
                            </p>
                          </div>
                        </div>

                        <span className="badge-mono text-[10px]">{stu.department_code || 'SIS'}</span>
                      </label>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#e2e8f0]">
                <span className="text-xs text-[#515f74]">
                  Selected Students: <strong className="text-[#0b1c30]">{selectedStudentIds.length}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1.5 border border-[#cbd5e1] rounded text-[#515f74] hover:bg-[#f8f9ff] text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || selectedStudentIds.length === 0}
                    className="btn-stitch-primary py-1.5 px-4 text-xs font-bold"
                  >
                    {submitting ? 'Registering...' : `Enroll Selected (${selectedStudentIds.length})`}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseEnrollmentPage;
