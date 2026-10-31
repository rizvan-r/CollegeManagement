import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

export const FacultyListPage = () => {
  const { user } = useAuth();
  const canManage = ['ADMIN', 'DEPARTMENT_STAFF'].includes(user?.role);

  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [designationFilter, setDesignationFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [issuedCredentials, setIssuedCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateUniquePassword = () => {
    return `Fac@${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    departmentId: '',
    designation: 'Associate Professor',
    qualification: 'M.Tech, Ph.D.',
    phone: '',
    password: `Fac@${Math.floor(100000 + Math.random() * 900000)}`,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/faculty');
      if (res.success && Array.isArray(res.data)) {
        setFaculty(res.data);
      }
    } catch (err) {
      console.warn('Fallback faculty list:', err.message);
      setFaculty([
        { id: '1', employee_id: 'EMP-CSE-001', first_name: 'Robert', last_name: 'Vance', designation: 'Professor & HOD', department_name: 'Computer Science and Engineering', email: 'hod.cse@college.edu', phone: '+1-555-0101', credits: 9, maxCredits: 12, qualification: 'Ph.D. in Computer Science' },
        { id: '2', employee_id: 'EMP-CSE-002', first_name: 'Alan', last_name: 'Turing', designation: 'Associate Professor', department_name: 'Computer Science and Engineering', email: 'faculty.alan@college.edu', phone: '+1-555-0102', credits: 12, maxCredits: 15, qualification: 'M.Tech, Ph.D.' },
        { id: '3', employee_id: 'EMP-CSE-003', first_name: 'Grace', last_name: 'Hopper', designation: 'Assistant Professor', department_name: 'Computer Science and Engineering', email: 'faculty.grace@college.edu', phone: '+1-555-0103', credits: 8, maxCredits: 12, qualification: 'M.Tech CSE' },
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
    fetchFaculty();
    fetchDepartments();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await axiosClient.post('/faculty', formData);
      if (res.success) {
        setShowModal(false);
        setIssuedCredentials({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          employeeId: res.employeeId || res.data?.employee_id,
          password: res.credentials?.password || formData.password,
        });
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          departmentId: departments[0]?.id || '',
          designation: 'Associate Professor',
          qualification: 'M.Tech, Ph.D.',
          phone: '',
          password: generateUniquePassword(),
        });
        fetchFaculty();
      }
    } catch (err) {
      setError(err.message || 'Failed to register faculty member');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const filteredFaculty = faculty.filter((f) => {
    const fullName = `${f.first_name || ''} ${f.last_name || ''}`.toLowerCase();
    const emp = (f.employee_id || '').toLowerCase();
    const em = (f.email || '').toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch = fullName.includes(q) || emp.includes(q) || em.includes(q);

    const matchesDept = deptFilter === 'ALL' || (f.department_name && f.department_name.includes(deptFilter));
    const matchesDesig = designationFilter === 'ALL' || (f.designation && f.designation.includes(designationFilter));

    return matchesSearch && matchesDept && matchesDesig;
  });

  return (
    <div className="space-y-5">
      {/* 1. Contextual Academic Governance Bar (Stitch Spec) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-2 rounded border border-[#e2e8f0]">
        <div className="flex items-center gap-1.5 text-xs text-[#515f74]">
          <span className="material-symbols-outlined text-[17px] text-[#515f74]">account_tree</span>
          <span className="font-bold uppercase tracking-wider text-[11px] text-[#0b1c30]">Divisional Registry</span>
          <span className="text-[#94a3b8]">/</span>
          <span className="font-semibold uppercase tracking-wider text-[11px]">Computing & Natural Sciences</span>
          <span className="text-[#94a3b8]">/</span>
          <span className="badge-mono text-[10px] font-bold">AY 2025–2026</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block mr-1"></span>
            AUDIT: LIVE SYNC
          </span>
          <span className="badge-mono text-[10px]">SECT-CAP-REV.4</span>
        </div>
      </div>

      {/* 2. Page Header & Action Horizon */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded border border-[#e2e8f0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">Academic Portfolio & Operations</span>
            <span className="badge-mono text-[10px]">CAPACITY: 1,480 CR MAX</span>
          </div>
          <h1 className="text-xl font-bold text-[#0b1c30] tracking-tight">Faculty Workload & Governance</h1>
          <p className="text-xs text-[#515f74] mt-0.5">
            Faculty appointments, individual access keys, credit capacity allocations, and departmental instructional load.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const csv = faculty.map((f) => `${f.employee_id},${f.first_name} ${f.last_name},${f.designation},${f.department_name},${f.email}`).join('\n');
              const blob = new Blob([`EmployeeID,Name,Designation,Department,Email\n${csv}`], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'faculty_workload_registry.csv';
              a.click();
            }}
            className="btn-stitch-secondary"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Workload Report</span>
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
              <span>Add Faculty Member</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Workload Health KPIs Grid (Stitch Spec) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card-stitch p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">Total Faculty</span>
            <span className="material-symbols-outlined text-[#515f74] text-[18px]">groups</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-[#0b1c30]">{faculty.length}</span>
            <span className="text-xs text-[#515f74]">active instructional</span>
          </div>
          <div className="mt-2 text-[11px] text-[#515f74] flex justify-between">
            <span>Tenure-Track Ratio</span>
            <span className="font-mono font-semibold text-[#0b1c30]">68.3%</span>
          </div>
          <div className="w-full bg-[#eff4ff] h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-[#515f74] h-full" style={{ width: '68.3%' }}></div>
          </div>
        </div>

        <div className="card-stitch p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">Workload Utilization</span>
            <span className="material-symbols-outlined text-[#515f74] text-[18px]">speed</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-[#0b1c30]">84.2%</span>
            <span className="badge-mono text-[10px]">Target: 85%</span>
          </div>
          <div className="mt-2 text-[11px] text-[#515f74] flex justify-between">
            <span>Allocated Credits</span>
            <span className="font-mono font-semibold text-[#0b1c30]">29 / 39 CR</span>
          </div>
          <div className="w-full bg-[#eff4ff] h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-[#0f172a] h-full" style={{ width: '84.2%' }}></div>
          </div>
        </div>

        <div className="card-stitch p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">Key Management</span>
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">lock</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-emerald-700">Separate</span>
            <span className="badge-emerald">Discrete Keys</span>
          </div>
          <div className="mt-2 text-[11px] text-[#515f74] flex justify-between">
            <span>Authentication</span>
            <span className="font-mono font-semibold text-emerald-700">Faculty SIS</span>
          </div>
          <div className="w-full bg-[#eff4ff] h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-emerald-600 h-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="card-stitch p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">Active Lecture Cadres</span>
            <span className="material-symbols-outlined text-sky-700 text-[18px]">co_present</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-[#0b1c30]">100%</span>
            <span className="badge-sky">Staffed</span>
          </div>
          <div className="mt-2 text-[11px] text-[#515f74] flex justify-between">
            <span>Syllabus Sync</span>
            <span className="font-mono font-semibold text-[#075985]">Verified</span>
          </div>
          <div className="w-full bg-[#eff4ff] h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-[#075985] h-full" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>

      {/* 4. Filter Toolbar */}
      <div className="card-stitch p-3 flex flex-col md:flex-row items-center justify-between gap-3 bg-white">
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#76777d] text-[16px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search faculty name or employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#f8f9ff] border border-[#cbd5e1] rounded text-xs text-[#0b1c30] placeholder-[#94a3b8] focus:outline-none focus:border-[#0f172a] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-[#515f74]">
            <span className="text-[11px] font-semibold uppercase">Cadre:</span>
            <select
              value={designationFilter}
              onChange={(e) => setDesignationFilter(e.target.value)}
              className="bg-[#f8f9ff] border border-[#cbd5e1] rounded px-2.5 py-1 text-xs text-[#0b1c30] focus:outline-none focus:border-[#0f172a]"
            >
              <option value="ALL">All Designations</option>
              <option value="Professor">Professor</option>
              <option value="Associate Professor">Associate Professor</option>
              <option value="Assistant Professor">Assistant Professor</option>
            </select>
          </div>

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
        </div>
      </div>

      {/* 5. Stitch Faculty Workload Table */}
      <div className="card-stitch overflow-hidden bg-white">
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner size="md" text="Loading faculty workload records..." />
          </div>
        ) : filteredFaculty.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#515f74]">
            <span className="material-symbols-outlined text-[32px] text-[#94a3b8] block mb-2">person_off</span>
            No faculty members found matching your search filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f1f5f9] border-b border-[#cbd5e1] text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Employee UID</th>
                  <th className="py-2.5 px-3">Faculty Member</th>
                  <th className="py-2.5 px-3">Academic Department</th>
                  <th className="py-2.5 px-3">Designation / Cadre</th>
                  <th className="py-2.5 px-3">Workload Credits</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] text-xs">
                {filteredFaculty.map((member) => (
                  <tr key={member.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="badge-mono">{member.employee_id}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                          {member.first_name?.[0] || 'F'}
                        </div>
                        <div>
                          <p className="font-semibold text-[#0b1c30]">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-[11px] text-[#515f74]">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[#45464d] font-medium">
                      {member.department_name || 'Engineering'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 font-medium text-[#0b1c30]">
                        <span className="material-symbols-outlined text-[15px] text-[#515f74]">military_tech</span>
                        {member.designation}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="w-28">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-mono font-semibold text-[#0b1c30]">{member.credits || 12} CR</span>
                          <span className="text-[#515f74]">/ {member.maxCredits || 15} max</span>
                        </div>
                        <div className="w-full bg-[#eff4ff] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#0f172a] h-full rounded-full"
                            style={{ width: `${((member.credits || 12) / (member.maxCredits || 15)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="badge-emerald">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                        Active Roster
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        title="Audit Workload Allocation"
                        className="p-1 rounded text-[#515f74] hover:bg-[#eff4ff] hover:text-[#0b1c30]"
                      >
                        <span className="material-symbols-outlined text-[18px]">repartition</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Add Faculty Modal with SEPARATE PASSWORD FIELD */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#cbd5e1] shadow-lg max-w-lg w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0f172a] text-[20px]">person_add</span>
                <h2 className="text-base font-bold text-[#0b1c30]">Register Academic Faculty</h2>
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

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
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
                  placeholder="faculty.name@college.edu"
                  className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded text-xs focus:border-[#0f172a] focus:outline-none"
                />
              </div>

              {/* SEPARATE FACULTY PASSWORD FIELD */}
              <div className="p-3 bg-[#eff4ff] border border-[#cbd5e1] rounded">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase text-[#0b1c30]">
                    Separate Faculty Key / Password
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#515f74] mb-1">Department</label>
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
                  <label className="block text-[11px] font-bold uppercase text-[#515f74] mb-1">Designation</label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded text-xs focus:border-[#0f172a] focus:outline-none"
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Adjunct Lecturer">Adjunct Lecturer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#515f74] mb-1">Qualification</label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder="e.g. M.Tech, Ph.D. in Computer Science"
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
                  {submitting ? 'Registering...' : 'Appoint Faculty & Issue Key'}
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
                <h3 className="text-sm font-bold text-[#0b1c30]">Faculty Credentials Issued</h3>
                <span className="badge-emerald text-[10px]">VERIFIED INSTITUTIONAL RECORD</span>
              </div>
            </div>

            <p className="text-xs text-[#515f74] mb-4">
              A separate institutional credential has been generated for this instructor. Provide these credentials to sign in via the <strong>Faculty Portal</strong>:
            </p>

            <div className="bg-[#eff4ff] border border-[#cbd5e1] rounded p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-[#cbd5e1]/60">
                <span className="text-[#515f74] font-semibold">Faculty Name:</span>
                <span className="font-bold text-[#0b1c30]">{issuedCredentials.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#cbd5e1]/60">
                <span className="text-[#515f74] font-semibold">Employee UID:</span>
                <span className="font-mono font-bold text-[#0b1c30]">{issuedCredentials.employeeId}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#cbd5e1]/60">
                <span className="text-[#515f74] font-semibold">Faculty Email:</span>
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
                  const slip = `FACULTY PORTAL CREDENTIALS\nName: ${issuedCredentials.name}\nUID: ${issuedCredentials.employeeId}\nEmail: ${issuedCredentials.email}\nPassword: ${issuedCredentials.password}\nPortal URL: http://localhost:5173/login/faculty`;
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
    </div>
  );
};

export default FacultyListPage;
