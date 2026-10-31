import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ onClose }) => {
  const { user } = useAuth();
  const role = user?.role;

  const navSections = [
    {
      title: 'Governance & Ops',
      items: [
        {
          label: 'Overview / Dashboard',
          path: '/dashboard',
          icon: 'grid_view',
          roles: ['ADMIN', 'DEPARTMENT_STAFF', 'FACULTY', 'STUDENT'],
        },
        {
          label: 'Student Directory',
          path: '/students',
          icon: 'school',
          roles: ['ADMIN', 'DEPARTMENT_STAFF', 'FACULTY'],
        },
        {
          label: 'Faculty Workload',
          path: '/faculty',
          icon: 'co_present',
          roles: ['ADMIN', 'DEPARTMENT_STAFF'],
        },
        {
          label: 'Lecture Roll Call',
          path: '/attendance',
          icon: 'fact_check',
          roles: ['ADMIN', 'DEPARTMENT_STAFF', 'FACULTY', 'STUDENT'],
        },
        {
          label: 'Academic Departments',
          path: '/departments',
          icon: 'domain',
          roles: ['ADMIN', 'DEPARTMENT_STAFF'],
        },
      ],
    },
    {
      title: 'Curriculum & Records',
      items: [
        {
          label: 'Course Registration',
          path: '/enrollments',
          icon: 'how_to_reg',
          roles: ['ADMIN', 'DEPARTMENT_STAFF', 'FACULTY', 'STUDENT'],
        },
        {
          label: 'Course Catalog',
          path: '/courses',
          icon: 'menu_book',
          roles: ['ADMIN', 'DEPARTMENT_STAFF', 'FACULTY', 'STUDENT'],
        },
        {
          label: 'Notices & Circulars',
          path: '/notices',
          icon: 'campaign',
          roles: ['ADMIN', 'DEPARTMENT_STAFF', 'FACULTY', 'STUDENT'],
        },
        {
          label: 'Institutional Profile',
          path: '/profile',
          icon: 'badge',
          roles: ['ADMIN', 'DEPARTMENT_STAFF', 'FACULTY', 'STUDENT'],
        },
      ],
    },
  ];

  const getRoleBadge = (userRole) => {
    switch (userRole) {
      case 'ADMIN':
        return 'Registrar Rail';
      case 'FACULTY':
        return 'Faculty Portal';
      case 'STUDENT':
        return 'Student SIS';
      case 'DEPARTMENT_STAFF':
        return 'Dept Registry';
      default:
        return 'Campus Portal';
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-[#e2e8f0] flex flex-col justify-between shrink-0 min-h-screen z-30 select-none">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#e2e8f0] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#0f172a] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-sm">
              <span className="material-symbols-outlined text-[19px]">account_balance</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-[#0b1c30] truncate tracking-tight">Veritas CMS</span>
              <span className="text-[10px] font-semibold text-[#515f74] truncate uppercase tracking-wider">
                {getRoleBadge(role)}
              </span>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-[#515f74] hover:bg-[#eff4ff] hover:text-[#0b1c30] lg:hidden"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-4 overflow-y-auto">
          {navSections.map((section, idx) => {
            const visibleItems = section.items.filter((item) => item.roles.includes(role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx}>
                <div className="px-3 py-1 mb-1 text-[10px] font-bold text-[#515f74] uppercase tracking-wider">
                  {section.title}
                </div>
                <nav className="flex flex-col gap-1">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded text-xs transition-colors ${
                          isActive
                            ? 'bg-[#e5eeff] text-[#0b1c30] font-semibold shadow-xs'
                            : 'text-[#45464d] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                        }`
                      }
                    >
                      <span className="material-symbols-outlined text-[19px]">
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Build & Status Footer */}
      <div className="p-3 border-t border-[#e2e8f0] bg-white">
        <div className="px-3 py-2 rounded bg-[#eff4ff] border border-[#e2e8f0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="font-mono text-[10px] text-[#45464d] font-semibold">NEON-DB LIVE</span>
          </div>
          <span className="text-[10px] uppercase font-mono text-[#76777d]">v4.18</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
