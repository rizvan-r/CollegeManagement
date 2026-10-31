import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ onToggleMobileMenu, onOpenCommandPalette, onOpenAI }) => {
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
    <header className="h-16 bg-white border-b border-[#e2e8f0] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left University & Term Context */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Open navigation menu"
          className="p-1.5 -ml-1 rounded text-[#515f74] hover:bg-[#eff4ff] hover:text-[#0b1c30] lg:hidden"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>
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
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Interactive Spotlight Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="relative hidden sm:flex items-center justify-between w-56 md:w-64 pl-3 pr-2 py-1.5 bg-[#f8f9ff] hover:bg-[#f1f5f9] border border-[#e2e8f0] rounded-xl text-xs text-[#64748b] transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="material-symbols-outlined text-[#94a3b8] group-hover:text-indigo-600 text-[18px] transition-colors">
              search
            </span>
            <span className="text-xs text-[#94a3b8] group-hover:text-[#475569]">Search & commands...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white border border-[#cbd5e1] text-[10px] font-mono font-medium text-[#475569] shadow-2xs">
            Ctrl K
          </kbd>
        </button>

        {/* Campus AI Copilot Trigger Button */}
        <button
          type="button"
          onClick={onOpenAI}
          aria-label="Open Campus AI Copilot"
          className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-linear-to-r from-[#0b1c30] via-[#122844] to-[#1e3a5f] hover:from-[#172e4c] hover:to-[#2b5282] text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer border border-sky-400/20 group"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
          </span>
          <span className="text-sky-300 group-hover:text-white transition-colors">✦ Campus AI</span>
          <span className="hidden xl:inline text-[10px] text-sky-200/80 font-mono font-normal">
            Ctrl+J
          </span>
        </button>

        {/* Mobile Search Icon */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          aria-label="Search"
          className="sm:hidden p-2 rounded-lg text-[#515f74] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">search</span>
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={() => navigate('/notices')}
          aria-label="Notifications"
          className="relative p-2 rounded-lg text-[#515f74] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors"
          title="View recent notices"
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
