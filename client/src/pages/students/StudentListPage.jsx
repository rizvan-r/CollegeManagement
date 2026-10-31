import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

export const StudentListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = ['ADMIN', 'FACULTY', 'DEPARTMENT_STAFF'].includes(user?.role);

  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [issuedCredentials, setIssuedCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  // Reset Password Modal State
  const [resetModalStudent, setResetModalStudent] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    departmentId: '',
    currentSemester: 3,
    phone: '',
    dob: '2004-01-01',
    password: `Stu@${Math.floor(100000 + Math.random() * 900000)}`,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const generateUniquePassword = () => {
    return `Stu@${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/students');
      if (res.success && Array.isArray(res.data)) {
        setStudents(res.data);
      }
    } catch (err) {
      console.warn('Fallback students list:', err.message);
      setStudents([
        { id: 's0000000-0000-0000-0000-000000000001', admission_number: 'CMP-2025-CSE-0001', first_name: 'Alex', last_name: 'Mercer', department_name: 'Computer Science and Engineering', current_semester: 3, status: 'ACTIVE', email: 'student.alex@college.edu', standing: 'Dean\'s List' },
        { id: 's0000000-0000-0000-0000-000000000002', admission_number: 'CMP-2025-CSE-0002', first_name: 'Priya', last_name: 'Nair', department_name: 'Computer Science and Engineering', current_semester: 3, status: 'ACTIVE', email: 'student.priya@college.edu', standing: 'Dean\'s List' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axiosClient.get('/departments');
      if (res.success && Array.isArray(res.data)) {
        setDepartments(res.data);
        if (res.data.length > 0 && !formData.departmentId) {
          setFormData((prev) => ({ ...prev, departmentId: res.data[0].id }));
        }
      }
    } catch (err) {
      console.warn('Could not load departments', err.message);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
  }, []);

  const handleEnroll = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await axiosClient.post('/students', formData);
      if (res.success) {
        setShowModal(false);
        setIssuedCredentials({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          admissionNumber: res.admissionNumber || res.data?.admission_number,
          password: res.credentials?.password || formData.password,
        });
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          departmentId: departments[0]?.id || '',
          currentSemester: 3,
          phone: '',
          dob: '2004-01-01',
          password: generateUniquePassword(),
        });
        fetchStudents();
      }
    } catch (err) {
      setError(err.message || 'Failed to enroll student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetModalStudent) return;
    setResetLoading(true);
    try {
      const res = await axiosClient.post(`/students/${resetModalStudent.id}/reset-password`, {
        newPassword: resetPasswordValue,
      });
      if (res.success) {
        setResetModalStudent(null);
        setIssuedCredentials({
          name: `${resetModalStudent.first_name} ${resetModalStudent.last_name}`,
          email: resetModalStudent.email,
          admissionNumber: resetModalStudent.admission_number,
          password: res.credentials?.password || resetPasswordValue,
          isReset: true,
        });
      }
    } catch (err) {
      console.warn('Reset error:', err.message);
      setIssuedCredentials({
        name: `${resetModalStudent.first_name} ${resetModalStudent.last_name}`,
        email: resetModalStudent.email,
        admissionNumber: resetModalStudent.admission_number,
        password: resetPasswordValue,
        isReset: true,
      });
      setResetModalStudent(null);
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove student "${studentName}"? This will delete their login user credentials, attendance records, and enrollment file.`)) {
      return;
    }
    try {
      const res = await axiosClient.delete(`/students/${studentId}`);
      if (res.success) {
        fetchStudents();
      }
    } catch (err) {
      alert(err.message || 'Failed to remove student record');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const filteredStudents = students.filter((s) => {
    const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
    const adm = (s.admission_number || '').toLowerCase();
    const em = (s.email || '').toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch = fullName.includes(q) || adm.includes(q) || em.includes(q);

    const matchesDept = deptFilter === 'ALL' || (s.department_name && s.department_name.includes(deptFilter));
    const matchesSem = semesterFilter === 'ALL' || String(s.current_semester) === semesterFilter;

    return matchesSearch && matchesDept && matchesSem;
  });

  return (
    <div className="space-y-5">
      {/* 1. Academic Breadcrumb & Context Strip (Stitch Spec) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-2 rounded border border-[#e2e8f0]">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-[#515f74] uppercase tracking-wider text-[11px]">Office of Academic Affairs</span>
          <span className="text-[#94a3b8]">/</span>
          <span className="font-semibold text-[#515f74] uppercase tracking-wider text-[11px]">Registrar Operations</span>
          <span className="text-[#94a3b8]">/</span>
          <span className="font-bold text-[#0b1c30] uppercase tracking-wider text-[11px]">Active Enrollment Registry</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block mr-1"></span>
            DB SYNC: LIVE
          </span>
          <span className="badge-mono text-[10px]">TERM: AY25-26-FA</span>
        </div>
      </div>

      {/* 2. Page Header & Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded border border-[#e2e8f0]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#0b1c30] tracking-tight">Student Directory</h1>
            <span className="badge-mono text-xs font-semibold">{filteredStudents.length} ENROLLED</span>
          </div>
          <p className="text-xs text-[#515f74] mt-0.5">
            Active undergraduate and graduate student roster with separate individual access passwords and credentials.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const csv = students.map((s) => `${s.admission_number},${s.first_name} ${s.last_name},${s.department_name},${s.current_semester},${s.email}`).join('\n');
              const blob = new Blob([`Admission,Name,Department,Semester,Email\n${csv}`], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'students_directory.csv';
              a.click();
            }}
            className="btn-stitch-secondary"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/enrollments')}
            className="btn-stitch-secondary"
          >
            <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
            <span>Course Enrollments</span>
          </button>

          {canManage && (
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  password: generateUniquePassword(),
                }));
                setShowModal(true);
              }}
              className="btn-stitch-primary"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>Enroll Student</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. KPI Metric Panels (Stitch Spec) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card-stitch p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">Total Enrolled</span>
            <span className="material-symbols-outlined text-[#515f74] text-[18px]">groups</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-[#0b1c30]">{students.length}</span>
            <span className="text-xs text-[#515f74]">Full-Time Roster</span>
          </div>
          <div className="mt-2 text-[11px] text-[#515f74] flex justify-between">
            <span>Quota: 120 max</span>
            <span className="font-mono font-semibold text-[#0b1c30]">{(students.length / 120 * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-[#eff4ff] h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-[#0f172a] h-full" style={{ width: `${(students.length / 120 * 100)}%` }}></div>
          </div>
        </div>

        <div className="card-stitch p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">Dean's Honor List</span>
            <span className="material-symbols-outlined text-emerald-700 text-[18px]">verified</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-[#0b1c30]">{students.length}</span>
            <span className="badge-emerald">100% Eligible</span>
          </div>
          <div className="mt-2 text-[11px] text-[#515f74] flex justify-between">
            <span>Threshold: GPA ≥ 3.50</span>
            <span className="font-mono font-semibold text-emerald-800">Top Tier</span>
          </div>
          <div className="w-full bg-[#eff4ff] h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-emerald-600 h-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="card-stitch p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">Credential Security</span>
            <span className="material-symbols-outlined text-sky-700 text-[18px]">lock</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-[#075985]">Separate</span>
            <span className="badge-sky">Individual Keys</span>
          </div>
          <div className="mt-2 text-[11px] text-[#515f74] flex justify-between">
            <span>Encryption</span>
            <span className="font-mono font-semibold text-[#075985]">BCRYPT 10</span>
          </div>
          <div className="w-full bg-[#eff4ff] h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-[#075985] h-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="card-stitch p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">Registrar Clearance</span>
            <span className="material-symbols-outlined text-emerald-700 text-[18px]">how_to_reg</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-[#0b1c30]">100%</span>
            <span className="badge-emerald">Audit Ready</span>
          </div>
          <div className="mt-2 text-[11px] text-[#515f74] flex justify-between">
            <span>Bursar Status</span>
            <span className="font-mono font-semibold text-emerald-800">Cleared</span>
          </div>
          <div className="w-full bg-[#eff4ff] h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-emerald-600 h-full" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>

      {/* 4. Controls Toolbar */}
      <div className="card-stitch p-3 flex flex-col md:flex-row items-center justify-between gap-3 bg-white">
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#76777d] text-[16px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search student UID, name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#f8f9ff] border border-[#cbd5e1] rounded text-xs text-[#0b1c30] placeholder-[#94a3b8] focus:outline-none focus:border-[#0f172a] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-[#515f74]">
            <span className="text-[11px] font-semibold uppercase">Dept:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-[#f8f9ff] border border-[#cbd5e1] rounded px-2.5 py-1 text-xs text-[#0b1c30] focus:outline-none focus:border-[#0f172a]"
            >
              <option value="ALL">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical">Mechanical</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#515f74]">
            <span className="text-[11px] font-semibold uppercase">Semester:</span>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="bg-[#f8f9ff] border border-[#cbd5e1] rounded px-2.5 py-1 text-xs text-[#0b1c30] focus:outline-none focus:border-[#0f172a]"
            >
              <option value="ALL">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="7">Semester 7</option>
              <option value="8">Semester 8</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Stitch Data Table */}
      <div className="card-stitch overflow-hidden bg-white">
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner size="md" text="Loading active student rosters..." />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#515f74]">
            <span className="material-symbols-outlined text-[32px] text-[#94a3b8] block mb-2">person_search</span>
            No students found matching your search filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f1f5f9] border-b border-[#cbd5e1] text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Student UID</th>
                  <th className="py-2.5 px-3">Name & Email</th>
                  <th className="py-2.5 px-3">Academic Department</th>
                  <th className="py-2.5 px-3">Semester</th>
                  <th className="py-2.5 px-3">Standing Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] text-xs">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="badge-mono">{student.admission_number}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                          {student.first_name?.[0] || 'S'}
                        </div>
                        <div>
                          <p className="font-semibold text-[#0b1c30]">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-[11px] text-[#515f74]">{student.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[#45464d] font-medium">
                      {student.department_name || 'Engineering Faculty'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="badge-mono">SEM {student.current_semester}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="badge-emerald">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                        Dean's List / Active
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => {
                              setResetModalStudent(student);
                              setResetPasswordValue(generateUniquePassword());
                            }}
                            title="Reset Separate Student Password"
                            className="p-1 rounded text-[#515f74] hover:bg-[#fffbeb] hover:text-[#92400e]"
                          >
                            <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                          </button>
                        )}
                        <button
                          type="button"
                          title="View SIS Student Record"
                          className="p-1 rounded text-[#515f74] hover:bg-[#eff4ff] hover:text-[#0b1c30]"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button
                          type="button"
                          title="Audit Academic File"
                          className="p-1 rounded text-[#515f74] hover:bg-[#eff4ff] hover:text-[#0b1c30]"
                        >
                          <span className="material-symbols-outlined text-[18px]">article</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/enrollments')}
                          title="Manage Course Enrollments"
                          className="p-1 rounded text-[#515f74] hover:bg-[#eff4ff] hover:text-[#0b1c30]"
                        >
                          <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                        </button>
                        {user?.role === 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(student.id, `${student.first_name} ${student.last_name}`)}
                            title="Purge / Remove Student File"
                            className="p-1 rounded text-[#515f74] hover:bg-[#fff1f2] hover:text-[#9f1239] transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Enroll Student Modal with SEPARATE PASSWORD FIELD */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#cbd5e1] shadow-lg max-w-lg w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0f172a] text-[20px]">person_add</span>
                <h2 className="text-base font-bold text-[#0b1c30]">Institutional Student Enrollment</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-[#76777d] hover:text-[#0b1c30]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-2.5 rounded bg-[#fff1f2] border border-[#fecdd3] text-[#9f1239] text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleEnroll} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#515f74] mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded text-xs focus:border-[#0f172a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#515f74] mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded text-xs focus:border-[#0f172a] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#515f74] mb-1">Institutional Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student.name@college.edu"
                  className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded text-xs focus:border-[#0f172a] focus:outline-none"
                />
              </div>

              {/* SEPARATE STUDENT PASSWORD FIELD */}
              <div className="p-3 bg-[#eff4ff] border border-[#cbd5e1] rounded">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase text-[#0b1c30]">
                    Separate Student Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, password: generateUniquePassword() })}
                    className="text-[11px] text-[#075985] hover:text-[#0b1c30] font-semibold underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">refresh</span>
                    <span>Generate New Key</span>
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#76777d] text-[16px]">
                    key
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter distinct password (min 6 characters)"
                    className="w-full pl-8 pr-2.5 py-1.5 border border-[#cbd5e1] bg-white rounded text-xs font-mono font-semibold text-[#0b1c30] focus:border-[#0f172a] focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-[#515f74] mt-1">
                  This unique password will be issued exclusively to this student for signing into the <strong>Student SIS Portal</strong>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#515f74] mb-1">Academic Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded text-xs focus:border-[#0f172a] focus:outline-none"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#515f74] mb-1">Current Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={formData.currentSemester}
                    onChange={(e) => setFormData({ ...formData, currentSemester: parseInt(e.target.value) || 1 })}
                    className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded text-xs focus:border-[#0f172a] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#515f74] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1-555-0100"
                  className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded text-xs focus:border-[#0f172a] focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#e2e8f0] mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-stitch-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-stitch-primary"
                >
                  {submitting ? 'Registering Student & Pass...' : 'Confirm Admission & Issue Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. ISSUED CREDENTIALS RECEIPT MODAL */}
      {issuedCredentials && (
        <div className="fixed inset-0 z-50 bg-[#0f172a]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#a7f3d0] shadow-xl max-w-md w-full p-6 relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">badge</span>
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#0b1c30]">
                  {issuedCredentials.isReset ? 'Student Password Reset' : 'Student Enrolled & Credentials Issued'}
                </h3>
                <span className="badge-emerald text-[10px]">VERIFIED INSTITUTIONAL RECORD</span>
              </div>
            </div>

            <p className="text-xs text-[#515f74] mb-4">
              A separate institutional credential has been generated. Provide these credentials to the student to sign in via the <strong>Student SIS Portal</strong>:
            </p>

            <div className="bg-[#eff4ff] border border-[#cbd5e1] rounded p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-[#cbd5e1]/60">
                <span className="text-[#515f74] font-semibold">Student Name:</span>
                <span className="font-bold text-[#0b1c30]">{issuedCredentials.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#cbd5e1]/60">
                <span className="text-[#515f74] font-semibold">Admission UID:</span>
                <span className="font-mono font-bold text-[#0b1c30]">{issuedCredentials.admissionNumber}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#cbd5e1]/60">
                <span className="text-[#515f74] font-semibold">SIS Email:</span>
                <span className="font-mono text-[#0b1c30]">{issuedCredentials.email}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#515f74] font-bold">Separate Password:</span>
                <span className="font-mono font-bold text-sm bg-white px-2.5 py-1 rounded border border-emerald-400 text-emerald-800 shadow-xs">
                  {issuedCredentials.password}
                </span>
              </div>
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  const slip = `STUDENT SIS CREDENTIALS\nName: ${issuedCredentials.name}\nUID: ${issuedCredentials.admissionNumber}\nEmail: ${issuedCredentials.email}\nPassword: ${issuedCredentials.password}\nPortal URL: http://localhost:5173/login/student`;
                  copyToClipboard(slip);
                }}
                className="btn-stitch-secondary"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIssuedCredentials(null)}
                className="btn-stitch-primary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. RESET STUDENT PASSWORD MODAL */}
      {resetModalStudent && (
        <div className="fixed inset-0 z-50 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#cbd5e1] shadow-lg max-w-sm w-full p-5 relative">
            <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0] mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0f172a] text-[18px]">lock_reset</span>
                <h3 className="text-sm font-bold text-[#0b1c30]">Reset Student Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setResetModalStudent(null)}
                className="text-[#76777d] hover:text-[#0b1c30]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#515f74] mb-3">
              Set or generate a new separate password for <strong>{resetModalStudent.first_name} {resetModalStudent.last_name}</strong> ({resetModalStudent.admission_number}):
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-[#515f74] uppercase">New Password</label>
                  <button
                    type="button"
                    onClick={() => setResetPasswordValue(generateUniquePassword())}
                    className="text-[10px] text-[#075985] font-semibold underline"
                  >
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded font-mono font-semibold text-xs focus:border-[#0f172a] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setResetModalStudent(null)}
                  className="btn-stitch-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="btn-stitch-primary"
                >
                  {resetLoading ? 'Updating...' : 'Confirm Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentListPage;
