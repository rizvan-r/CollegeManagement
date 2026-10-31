import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Bell, Calendar, Shield } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  const roleColors = {
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    DEPARTMENT_STAFF: 'bg-blue-100 text-blue-800 border-blue-200',
    FACULTY: 'bg-teal-100 text-teal-800 border-teal-200',
    STUDENT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700">
          <Calendar className="w-4 h-4 text-[#0F9D94]" />
          <span>Academic Year: <strong>2025-2026</strong></span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* User Info & Role Badge */}
        <div className="flex items-center space-x-3 text-right">
          <div>
            <p className="text-sm font-semibold text-[#172B4D] leading-tight">
              {user?.email || 'Authenticated User'}
            </p>
            <div className="flex items-center justify-end mt-0.5">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  roleColors[user?.role] || 'bg-slate-100 text-slate-700'
                }`}
              >
                {user?.role?.replace('_', ' ') || 'USER'}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#163A63] text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>

        {/* Logout Action */}
        <button
          onClick={logout}
          title="Sign out of portal"
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
