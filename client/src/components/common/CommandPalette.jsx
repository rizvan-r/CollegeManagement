import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

export const CommandPalette = ({ isOpen, onClose, onOpenAI }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Pre-fetch live courses and students for instant fuzzy search
  useEffect(() => {
    if (!isOpen) return;
    const fetchQuickData = async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          axiosClient.get('/courses').catch(() => ({ data: [] })),
          axiosClient.get('/students').catch(() => ({ data: [] })),
        ]);
        if (cRes.data) setCourses(cRes.data);
        if (sRes.data) setStudents(sRes.data);
      } catch (err) {
        // quiet fallback
      }
    };
    fetchQuickData();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Static navigation and action shortcuts
  const baseActions = [
    {
      id: 'ai-copilot',
      category: 'AI Intelligence',
      title: '✦ Launch Campus AI Copilot',
      subtitle: 'Ask about attendance risk, courses, or draft notices',
      icon: 'auto_awesome',
      badge: 'Smart Copilot',
      action: () => {
        onClose();
        onOpenAI();
      },
    },
    {
      id: 'nav-dashboard',
      category: 'Navigation',
      title: 'Dashboard Overview',
      subtitle: 'View institutional KPIs, statistics, and recent updates',
      icon: 'dashboard',
      path: '/dashboard',
    },
    {
      id: 'nav-enrollments',
      category: 'Navigation',
      title: 'Course Enrollment Portal',
      subtitle: 'Browse sections, register courses, and manage academic load',
      icon: 'how_to_reg',
      badge: 'Active Term',
      path: '/enrollments',
    },
    {
      id: 'nav-attendance',
      category: 'Navigation',
      title: 'Attendance & Live Roll Call',
      subtitle: 'Session records, dynamic PIN verification, and what-if simulation',
      icon: 'fact_check',
      path: '/attendance',
    },
    {
      id: 'nav-courses',
      category: 'Navigation',
      title: 'Course Catalog & Syllabus',
      subtitle: 'Explore degree requirements and semester credit structures',
      icon: 'menu_book',
      path: '/courses',
    },
    {
      id: 'nav-students',
      category: 'Navigation',
      title: 'Student Directory',
      subtitle: 'Search scholars, track admission status and semesters',
      icon: 'school',
      path: '/students',
    },
    {
      id: 'nav-faculty',
      category: 'Navigation',
      title: 'Faculty Workload & Roster',
      subtitle: 'Professors, teaching assignments, and department contacts',
      icon: 'badge',
      path: '/faculty',
    },
    {
      id: 'nav-departments',
      category: 'Navigation',
      title: 'Academic Departments',
      subtitle: 'Schools, buildings, student counts, and departmental labs',
      icon: 'domain',
      path: '/departments',
    },
    {
      id: 'nav-notices',
      category: 'Navigation',
      title: 'Official Circulars & Notices',
      subtitle: 'Institutional announcements, exam schedules, and circulars',
      icon: 'campaign',
      path: '/notices',
    },
    {
      id: 'act-logout',
      category: 'Account',
      title: 'Switch Role / Sign Out',
      subtitle: `Currently authenticated as ${user?.email || 'User'}`,
      icon: 'logout',
      action: () => {
        onClose();
        logout();
        navigate('/login');
      },
    },
  ];

  // Dynamic search matching
  const q = query.toLowerCase().trim();

  // Matched dynamic course results
  const courseResults = courses
    .filter((c) => c.code?.toLowerCase().includes(q) || c.title?.toLowerCase().includes(q))
    .slice(0, 4)
    .map((c) => ({
      id: `crs_${c.id}`,
      category: 'Courses',
      title: `${c.code}: ${c.title}`,
      subtitle: `${c.credits} Credits • Sem ${c.semester} • ${c.department_name || 'CSE'}`,
      icon: 'book',
      path: '/courses',
    }));

  // Matched dynamic student results
  const studentResults = students
    .filter(
      (s) =>
        s.first_name?.toLowerCase().includes(q) ||
        s.last_name?.toLowerCase().includes(q) ||
        s.admission_number?.toLowerCase().includes(q)
    )
    .slice(0, 4)
    .map((s) => ({
      id: `stu_${s.id}`,
      category: 'Students',
      title: `${s.first_name} ${s.last_name}`,
      subtitle: `${s.admission_number} • ${s.department_name || 'Engineering'} • Sem ${s.current_semester}`,
      icon: 'person',
      path: '/students',
    }));

  // Filter base actions
  const actionResults = baseActions.filter(
    (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
  );

  const allResults = q ? [...actionResults, ...courseResults, ...studentResults] : baseActions;

  // Key navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % allResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allResults.length) % allResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allResults[selectedIndex]) {
        executeItem(allResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const executeItem = (item) => {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#cbd5e1] overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Universal Command Palette"
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3 border-b border-[#e2e8f0] bg-white shrink-0">
          <span className="material-symbols-outlined text-[#64748b] text-[22px] mr-3">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search students, courses, faculty, or type an action..."
            className="w-full bg-transparent text-sm text-[#0b1c30] placeholder-[#94a3b8] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
          <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 divide-y divide-slate-100/60 max-h-[480px]">
          {allResults.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#64748b]">
              <span className="material-symbols-outlined text-[32px] text-slate-300 block mb-2">search_off</span>
              No matching resources or actions found for "{query}".
            </div>
          ) : (
            allResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected ? 'bg-indigo-50/80 text-indigo-900 shadow-2xs' : 'hover:bg-slate-50 text-[#0b1c30]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[18px] ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-[#f1f5f9] text-[#475569]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold truncate leading-tight">{item.title}</span>
                        {item.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#64748b] truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wider shrink-0 ml-2">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-50 border-t border-[#e2e8f0] flex items-center justify-between text-[11px] text-[#64748b] shrink-0">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">↑</kbd>{' '}
              <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">↵</kbd> to select
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Veritas OmniSearch</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
