import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Bell, Plus, Calendar, Tag, AlertCircle } from 'lucide-react';
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

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/notices');
      if (res.success) {
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
    try {
      const res = await axiosClient.post('/notices', formData);
      if (res.success) {
        setShowModal(false);
        setFormData({ title: '', content: '', priority: 'NORMAL', audience: 'COLLEGE_WIDE' });
        fetchNotices();
      }
    } catch (err) {
      setError(err.message || 'Failed to publish notice');
    }
  };

  const priorityStyles = {
    URGENT: 'bg-red-100 text-red-800 border-red-200',
    HIGH: 'bg-amber-100 text-amber-800 border-amber-200',
    NORMAL: 'bg-blue-100 text-blue-800 border-blue-200',
    LOW: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B4D] tracking-tight">Campus Notices & Circulars</h1>
          <p className="text-sm text-slate-500 mt-1">Official circulars, department updates, and academic notifications.</p>
        </div>
        {canPublish && (
          <button onClick={() => setShowModal(true)} className="btn-primary text-xs">
            <Plus className="w-4 h-4" />
            <span>Publish Circular</span>
          </button>
        )}
      </div>

      {/* Notices Feed */}
      {loading ? (
        <LoadingSpinner text="Retrieving institutional circulars..." />
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <div key={notice.id} className="card-institutional p-6 border-l-4 border-l-[#163A63]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      priorityStyles[notice.priority] || priorityStyles.NORMAL
                    }`}
                  >
                    {notice.priority}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-[#0F9D94] border border-teal-200">
                    {notice.audience?.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center text-xs text-slate-400 space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{notice.publish_date}</span>
                </div>
              </div>

              <h2 className="text-lg font-bold text-[#172B4D] mb-2">{notice.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line mb-4">
                {notice.content}
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Published by: <strong>{notice.author_name || 'Administration'}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Publish Notice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-[#172B4D] mb-4">Publish Institutional Notice</h2>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handlePublish} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Circular Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule for Mid-Term Practical Exams"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9D94]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F9D94]"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Audience</label>
                  <select
                    value={formData.audience}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F9D94]"
                  >
                    <option value="COLLEGE_WIDE">College Wide</option>
                    <option value="DEPARTMENT_ONLY">Department Only</option>
                    <option value="FACULTY_ONLY">Faculty Only</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Body Content</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detailed announcement text..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9D94]"
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Broadcast Notice
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
