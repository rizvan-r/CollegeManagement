import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'Registrar / Admin';
      case 'FACULTY':
        return 'Faculty Member';
      case 'STUDENT':
        return 'Undergraduate Scholar';
      case 'DEPARTMENT_STAFF':
        return 'Department Staff';
      default:
        return 'User';
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'badge-amber';
      case 'FACULTY':
        return 'badge-emerald';
      case 'STUDENT':
        return 'badge-sky';
      default:
        return 'badge-mono';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-[#e2e8f0] px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left University & Term Context */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#0b1c30] leading-none">Veritas University</span>
          <span className="text-[11px] text-[#515f74] leading-tight mt-1">
            {user?.role === 'STUDENT'
              ? 'Student Information System'
              : user?.role === 'FACULTY'
              ? 'Academic Faculty Portal'
              : 'Academic Affairs Administration'}
          </span>
        </div>

        <div className="h-5 w-px bg-[#e2e8f0] hidden md:block"></div>

        <div className="hidden md:flex items-center gap-1.5 bg-[#eff4ff] border border-[#e2e8f0] px-3 py-1 rounded-full">
          <span className="material-symbols-outlined text-[#515f74] text-[15px]">calendar_month</span>
          <span className="text-xs font-semibold text-[#0b1c30]">Fall 2025 Semester</span>
          <span className="text-[10px] text-[#515f74] font-mono">• AY 2025–2026</span>
        </div>
      </div>

      {/* Right Search, Actions & Profile */}
      <div className="flex items-center gap-4">
        {/* Quick Search */}
        <div className="relative hidden lg:block w-64">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#76777d] text-[16px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search UID, course, or faculty..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#f8f9ff] border border-[#e2e8f0] rounded text-xs text-[#0b1c30] placeholder-[#94a3b8] focus:outline-none focus:border-[#0f172a] focus:bg-white"
          />
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2 rounded text-[#515f74] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
        </button>

        {/* User Profile Block */}
        <div className="flex items-center gap-3 border-l border-[#e2e8f0] pl-4">
          <div className="w-8 h-8 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
            {user?.email?.[0] || 'U'}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-[#0b1c30] leading-tight truncate max-w-[140px]">
              {user?.email}
            </span>
            <div className="mt-0.5">
              <span className={getRoleBadgeClass(user?.role)}>
                {getRoleDisplayName(user?.role)}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Sign out of institutional session"
            className="p-1.5 text-[#76777d] hover:text-[#9f1239] hover:bg-[#fff1f2] rounded transition-colors ml-1"
          >
            <span className="material-symbols-outlined text-[19px]">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
