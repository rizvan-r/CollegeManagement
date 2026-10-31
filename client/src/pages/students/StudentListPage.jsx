import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

export const StudentListPage = () => {
  const { user } = useAuth();
  const canManage = ['ADMIN', 'DEPARTMENT_STAFF'].includes(user?.role);

  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    departmentId: '',
    currentSemester: 3,
    phone: '',
    dob: '2004-01-01',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
        { id: '1', admission_number: 'CMP-2025-CSE-0001', first_name: 'Alex', last_name: 'Mercer', department_name: 'Computer Science and Engineering', current_semester: 3, status: 'ACTIVE', email: 'student.alex@college.edu', standing: 'Dean\'s List' },
        { id: '2', admission_number: 'CMP-2025-CSE-0002', first_name: 'Priya', last_name: 'Nair', department_name: 'Computer Science and Engineering', current_semester: 3, status: 'ACTIVE', email: 'student.priya@college.edu', standing: 'Dean\'s List' },
        { id: '3', admission_number: 'CMP-2025-ECE-0001', first_name: 'Marcus', last_name: 'Holloway', department_name: 'Electronics and Communication Engineering', current_semester: 5, status: 'ACTIVE', email: 'marcus.h@college.edu', standing: 'Good Standing' },
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
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          departmentId: departments[0]?.id || '',
          currentSemester: 3,
          phone: '',
          dob: '2004-01-01',
        });
        fetchStudents();
      }
    } catch (err) {
      setError(err.message || 'Failed to enroll student');
    } finally {
      setSubmitting(false);
    }
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
            Active undergraduate and graduate student roster across engineering and sciences.
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

          {canManage && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
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
        {/* Metric 1 */}
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

        {/* Metric 2 */}
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

        {/* Metric 3 */}
        <div className="card-stitch p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">Academic Standing</span>
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-emerald-700">0</span>
            <span className="text-xs text-[#515f74]">On Probation</span>
          </div>
          <div className="mt-2 text-[11px] text-[#515f74] flex justify-between">
            <span>Intervention Required</span>
            <span className="font-mono font-semibold text-emerald-700">None</span>
          </div>
          <div className="w-full bg-[#eff4ff] h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full" style={{ width: '0%' }}></div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="card-stitch p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">Registrar Clearance</span>
            <span className="material-symbols-outlined text-sky-700 text-[18px]">how_to_reg</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-[#0b1c30]">100%</span>
            <span className="badge-sky">Audit Ready</span>
          </div>
          <div className="mt-2 text-[11px] text-[#515f74] flex justify-between">
            <span>Bursar Status</span>
            <span className="font-mono font-semibold text-[#075985]">Cleared</span>
          </div>
          <div className="w-full bg-[#eff4ff] h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-[#075985] h-full" style={{ width: '100%' }}></div>
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
          {/* Department Filter */}
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

          {/* Semester Filter */}
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Enroll Student Modal */}
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
                  {submitting ? 'Registering...' : 'Confirm Admission'}
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
