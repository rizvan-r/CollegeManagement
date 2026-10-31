import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Bell,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role;

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'DEPARTMENT_STAFF', 'FACULTY', 'STUDENT'],
    },
    {
      label: 'Departments',
      path: '/departments',
      icon: Building2,
      roles: ['ADMIN', 'DEPARTMENT_STAFF'],
    },
    {
      label: 'Faculty',
      path: '/faculty',
      icon: Users,
      roles: ['ADMIN', 'DEPARTMENT_STAFF'],
    },
    {
      label: 'Students',
      path: '/students',
      icon: GraduationCap,
      roles: ['ADMIN', 'DEPARTMENT_STAFF', 'FACULTY'],
    },
    {
      label: 'Courses',
      path: '/courses',
      icon: BookOpen,
      roles: ['ADMIN', 'DEPARTMENT_STAFF', 'FACULTY'],
    },
    {
      label: 'Attendance',
      path: '/attendance',
      icon: CalendarCheck,
      roles: ['ADMIN', 'DEPARTMENT_STAFF', 'FACULTY', 'STUDENT'],
    },
    {
      label: 'Notices',
      path: '/notices',
      icon: Bell,
      roles: ['ADMIN', 'DEPARTMENT_STAFF', 'FACULTY', 'STUDENT'],
    },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-[#163A63] text-white flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center space-x-3 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-[#0F9D94] flex items-center justify-center font-black text-white text-lg tracking-wider shadow">
          CMP
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight leading-tight">Campus Portal</h1>
          <p className="text-[11px] text-teal-300 font-medium">College Management</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-300 uppercase">
          Menu Navigation
        </div>
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#0F9D94] text-white shadow-sm font-semibold'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Institutional Footer Badge */}
      <div className="p-4 border-t border-white/10">
        <div className="bg-white/5 rounded-lg p-3 text-xs text-slate-300 space-y-1">
          <div className="flex items-center space-x-1.5 text-teal-300 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure System</span>
          </div>
          <p className="text-[11px] text-slate-400">PostgreSQL Cloud Sync</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
