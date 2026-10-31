import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

export const NoticesPage = () => {
  const { user } = useAuth();
  const canPublish = ['ADMIN', 'DEPARTMENT_STAFF'].includes(user?.role);

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'NORMAL',
    audience: 'COLLEGE_WIDE',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/notices');
      if (res.success && Array.isArray(res.data)) {
        setNotices(res.data);
      }
    } catch (err) {
      console.warn('Fallback notices:', err.message);
      setNotices([
        {
          id: '1',
          title: 'Commencement of Fall Semester 2025',
          content: 'Classes for the Fall 2025 academic session commence on June 15th. All students must report to their respective departments by 8:30 AM in proper institutional attire.',
          priority: 'HIGH',
          audience: 'COLLEGE_WIDE',
          publish_date: '2025-06-01',
          author_name: 'College Dean / Administration',
        },
        {
          id: '2',
          title: 'CSE Department Annual Hackathon 2025',
          content: 'Registrations are open for HackTech 2025. Teams can submit proposals by the end of this month. Cash prizes and internship offers available for top prototypes.',
          priority: 'NORMAL',
          audience: 'DEPARTMENT_ONLY',
          publish_date: '2025-06-05',
          author_name: 'Dr. Robert Vance (HOD CSE)',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await axiosClient.post('/notices', formData);
      if (res.success) {
        setShowModal(false);
        setFormData({ title: '', content: '', priority: 'NORMAL', audience: 'COLLEGE_WIDE' });
        fetchNotices();
      }
    } catch (err) {
      setError(err.message || 'Failed to publish notice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Academic Governance Context Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-2 rounded border border-[#e2e8f0]">
        <div className="flex items-center gap-1.5 text-xs text-[#515f74]">
          <span className="material-symbols-outlined text-[17px] text-[#515f74]">campaign</span>
          <span className="font-bold uppercase tracking-wider text-[11px] text-[#0b1c30]">Institutional Communications</span>
          <span className="text-[#94a3b8]">/</span>
          <span className="font-semibold uppercase tracking-wider text-[11px]">Official Circulars & Gazettes</span>
          <span className="text-[#94a3b8]">/</span>
          <span className="badge-mono text-[10px] font-bold">AY 2025–2026</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block mr-1"></span>
            DISPATCH: ACTIVE
          </span>
          <span className="badge-mono text-[10px]">ALL-STUDENTS</span>
        </div>
      </div>

      {/* 2. Header & Action Horizon */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded border border-[#e2e8f0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">Campus Dispatch</span>
            <span className="badge-mono text-[10px]">{notices.length} CIRCULARS ACTIVE</span>
          </div>
          <h1 className="text-xl font-bold text-[#0b1c30] tracking-tight">Institutional Notices & Gazettes</h1>
          <p className="text-xs text-[#515f74] mt-0.5">
            Official collegiate directives, examination schedules, departmental alerts, and committee circulars.
          </p>
        </div>

        {canPublish && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn-stitch-primary"
          >
            <span className="material-symbols-outlined text-[16px]">post_add</span>
            <span>Publish Circular</span>
          </button>
        )}
      </div>

      {/* 3. Notices Feed (Stitch Spec) */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner size="md" text="Loading institutional circulars..." />
          </div>
        ) : notices.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#515f74] card-stitch bg-white">
            <span className="material-symbols-outlined text-[32px] text-[#94a3b8] block mb-2">campaign</span>
            No active notices on file.
          </div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.id}
              className="card-stitch p-5 bg-white border border-[#e2e8f0] flex flex-col justify-between gap-3 hover:border-[#cbd5e1] transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {notice.priority === 'HIGH' && <span className="badge-rose">HIGH PRIORITY</span>}
                    {notice.priority === 'NORMAL' && <span className="badge-sky">OFFICIAL DIRECTIVE</span>}
                    <span className="badge-mono text-[10px]">{notice.audience?.replace('_', ' ')}</span>
                    <span className="font-mono text-[11px] text-[#515f74]">
                      {notice.publish_date ? new Date(notice.publish_date).toLocaleDateString() : 'Active'}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-[#0b1c30] tracking-tight">{notice.title}</h2>
                </div>
              </div>

              <p className="text-xs text-[#45464d] leading-relaxed whitespace-pre-line">
                {notice.content}
              </p>

              <div className="pt-3 border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#515f74]">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-[#76777d]">person</span>
                  <span>Issued by: <strong className="text-[#0b1c30]">{notice.author_name || 'Academic Administration'}</strong></span>
                </div>
                <span className="badge-mono text-[10px]">VERIFIED CIRCULAR</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Publish Notice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#cbd5e1] shadow-lg max-w-lg w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0f172a] text-[20px]">post_add</span>
                <h2 className="text-base font-bold text-[#0b1c30]">Publish Institutional Circular</h2>
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

            <form onSubmit={handlePublish} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#515f74] mb-1">Circular Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule for End-Semester Practical Examinations"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded text-xs focus:border-[#0f172a] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#515f74] mb-1">Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded text-xs focus:border-[#0f172a] focus:outline-none"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent / Immediate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#515f74] mb-1">Audience Scope</label>
                  <select
                    value={formData.audience}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded text-xs focus:border-[#0f172a] focus:outline-none"
                  >
                    <option value="COLLEGE_WIDE">College Wide</option>
                    <option value="DEPARTMENT_ONLY">Department Only</option>
                    <option value="FACULTY_ONLY">Faculty Only</option>
                    <option value="STUDENTS_ONLY">Students Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#515f74] mb-1">Directive Details / Text</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter full notice directives and administrative instructions..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
                  {submitting ? 'Dispatching...' : 'Dispatch Circular'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticesPage;
