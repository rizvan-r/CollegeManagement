import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export const AuthLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <LoadingSpinner size="lg" text="Loading portal..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F5F7FA] px-4 py-12 relative overflow-hidden">
      {/* Decorative Brand Accent Background */}
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-[#163A63] to-[#0F2742] -skew-y-2 origin-top-left scale-110 z-0" />
      
      <div className="relative z-10 w-full max-w-md">
        <Outlet />
      </div>

      <div className="relative z-10 mt-8 text-center text-xs text-slate-500">
        College Management Portal &copy; {new Date().getFullYear()} &bull; Academic Enterprise Edition
      </div>
    </div>
  );
};

export default AuthLayout;
