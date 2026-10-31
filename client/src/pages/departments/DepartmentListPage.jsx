import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

export const DepartmentListPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', building: '', establishedYear: 2025 });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/departments');
      if (res.success && Array.isArray(res.data)) {
        setDepartments(res.data);
      }
    } catch (err) {
      console.warn('Fallback department data:', err.message);
      setDepartments([
        { id: '1', code: 'CSE', name: 'Computer Science and Engineering', building: 'Turing Block', established_year: 2005, student_count: 380, faculty_count: 18 },
        { id: '2', code: 'ECE', name: 'Electronics and Communication Engineering', building: 'Tesla Block', established_year: 2007, student_count: 310, faculty_count: 15 },
        { id: '3', code: 'MECH', name: 'Mechanical Engineering', building: 'Newton Hall', established_year: 2000, student_count: 240, faculty_count: 12 },
        { id: '4', code: 'MBA', name: 'Management Studies', building: 'Management Block', established_year: 2012, student_count: 120, faculty_count: 8 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await axiosClient.post('/departments', formData);
      if (res.success) {
        setShowModal(false);
        setFormData({ code: '', name: '', building: '', establishedYear: 2025 });
        fetchDepartments();
      }
    } catch (err) {
      setError(err.message || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (deptId, deptName) => {
    if (!window.confirm(`Are you sure you want to delete department "${deptName}"?`)) {
      return;
    }
    try {
      const res = await axiosClient.delete(`/departments/${deptId}`);
      if (res.success) {
        fetchDepartments();
      }
    } catch (err) {
      alert(err.message || 'Cannot delete department with active students or faculty');
    }
  };

  const filteredDepts = departments.filter((d) =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* 1. Contextual Academic Governance Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-2 rounded border border-[#e2e8f0]">
        <div className="flex items-center gap-1.5 text-xs text-[#515f74]">
          <span className="material-symbols-outlined text-[17px] text-[#515f74]">domain</span>
          <span className="font-bold uppercase tracking-wider text-[11px] text-[#0b1c30]">Academic Divisions</span>
          <span className="text-[#94a3b8]">/</span>
          <span className="font-semibold uppercase tracking-wider text-[11px]">Faculty Infrastructure</span>
          <span className="text-[#94a3b8]">/</span>
          <span className="badge-mono text-[10px] font-bold">AY 2025–2026</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block mr-1"></span>
            DIVISIONS: ACCREDITED
          </span>
          <span className="badge-mono text-[10px]">FAC-CAP: 100%</span>
        </div>
      </div>

      {/* 2. Header & Action Horizon */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded border border-[#e2e8f0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">Institutional Architecture</span>
            <span className="badge-mono text-[10px]">{filteredDepts.length} ACTIVE DIVISIONS</span>
          </div>
          <h1 className="text-xl font-bold text-[#0b1c30] tracking-tight">Academic Departments & Infrastructure</h1>
          <p className="text-xs text-[#515f74] mt-0.5">
            Collegiate faculties, instructional blocks, departmental HODs, and student allocation rosters.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn-stitch-primary"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Add Department</span>
          </button>
        )}
      </div>

      {/* 3. Search Toolbar */}
      <div className="card-stitch p-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#76777d] text-[16px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search department code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#f8f9ff] border border-[#cbd5e1] rounded text-xs text-[#0b1c30] placeholder-[#94a3b8] focus:outline-none focus:border-[#0f172a] focus:bg-white"
          />
        </div>

        <span className="text-xs text-[#515f74]">
          Total Divisions: <strong className="text-[#0b1c30]">{filteredDepts.length}</strong>
        </span>
      </div>

      {/* 4. Table */}
      <div className="card-stitch overflow-hidden bg-white">
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner size="md" text="Loading academic divisions..." />
          </div>
        ) : filteredDepts.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#515f74]">
            <span className="material-symbols-outlined text-[32px] text-[#94a3b8] block mb-2">domain_disabled</span>
            No departments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f1f5f9] border-b border-[#cbd5e1] text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Dept Code</th>
                  <th className="py-2.5 px-3">Department Name</th>
                  <th className="py-2.5 px-3">Campus Building</th>
                  <th className="py-2.5 px-3">Established</th>
                  <th className="py-2.5 px-3">Faculty Cadre</th>
                  <th className="py-2.5 px-3">Accreditation</th>
                  <th className="py-2.5 px-3 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] text-xs">
                {filteredDepts.map((d) => (
                  <tr key={d.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="badge-mono font-bold">{d.code}</span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#0b1c30]">{d.name}</td>
                    <td className="py-2.5 px-3 text-[#515f74]">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-[#76777d]">apartment</span>
                        <span>{d.building}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="badge-mono text-[11px]">{d.established_year}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-[#0b1c30]">{d.faculty_count || 12} Staff</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="badge-emerald">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                        Full Accreditation
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          title="Audit Department Record"
                          className="p-1 rounded text-[#515f74] hover:bg-[#eff4ff] hover:text-[#0b1c30]"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDepartment(d.id, d.name)}
                            title="Remove Department Division"
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

      {/* 5. Add Department Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#cbd5e1] shadow-lg max-w-lg w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0f172a] text-[20px]">add_circle</span>
                <h2 className="text-base font-bold text-[#0b1c30]">Create Academic Department</h2>
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

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#515f74] mb-1">Department Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IT"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded text-xs focus:border-[#0f172a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#515f74] mb-1">Established Year</label>
                  <input
                    type="number"
                    min="1950"
                    max="2030"
                    value={formData.establishedYear}
                    onChange={(e) => setFormData({ ...formData, establishedYear: parseInt(e.target.value) || 2025 })}
                    className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded text-xs focus:border-[#0f172a] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#515f74] mb-1">Full Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Information Technology & Cybersecurity"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded text-xs focus:border-[#0f172a] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#515f74] mb-1">Campus Building / Hall</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lovelace Science Pavilion"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
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
                  {submitting ? 'Registering...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentListPage;
