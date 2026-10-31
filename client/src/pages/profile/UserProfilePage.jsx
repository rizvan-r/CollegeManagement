import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export const UserProfilePage = () => {
  const { user, changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setMessage('Institutional security key changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update security key.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge-amber">REGISTRAR / ADMIN</span>;
      case 'FACULTY':
        return <span className="badge-emerald">FACULTY CADRE</span>;
      case 'STUDENT':
        return <span className="badge-sky">UNDERGRADUATE SCHOLAR</span>;
      default:
        return <span className="badge-mono">{role}</span>;
    }
  };

  return (
    <div className="max-w-3xl space-y-5">
      {/* 1. Academic Governance Context Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-2 rounded border border-[#e2e8f0]">
        <div className="flex items-center gap-1.5 text-xs text-[#515f74]">
          <span className="material-symbols-outlined text-[17px] text-[#515f74]">security</span>
          <span className="font-bold uppercase tracking-wider text-[11px] text-[#0b1c30]">Security Governance</span>
          <span className="text-[#94a3b8]">/</span>
          <span className="font-semibold uppercase tracking-wider text-[11px]">Identity & FERPA Compliance</span>
          <span className="text-[#94a3b8]">/</span>
          <span className="badge-mono text-[10px] font-bold">256-BIT TOKEN</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block mr-1"></span>
            ACTIVE SESSION
          </span>
        </div>
      </div>

      {/* 2. Page Header */}
      <div className="card-stitch p-5 bg-white border border-[#e2e8f0]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">Identity Management</span>
          <span className="badge-mono text-[10px]">NEON-DB AUTH</span>
        </div>
        <h1 className="text-xl font-bold text-[#0b1c30] tracking-tight">Institutional Profile & Credentials</h1>
        <p className="text-xs text-[#515f74] mt-0.5">
          View your institutional identity credentials, active role permissions, and rotate security access keys.
        </p>
      </div>

      {/* 3. Profile Card */}
      <div className="card-stitch p-5 bg-white border border-[#e2e8f0]">
        <div className="flex items-center gap-4 pb-4 border-b border-[#e2e8f0]">
          <div className="w-12 h-12 rounded bg-[#0f172a] text-white flex items-center justify-center font-bold text-lg shadow-xs">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0b1c30]">{user?.email}</h2>
            <div className="flex items-center gap-2 mt-1">
              {getRoleBadge(user?.role)}
              <span className="badge-mono text-[10px]">ID: {user?.id?.slice(0, 8)}...</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
          <div>
            <span className="text-[11px] font-bold uppercase text-[#515f74] block">Institutional Domain</span>
            <span className="font-mono text-[#0b1c30] mt-0.5 block">veritas.edu</span>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase text-[#515f74] block">Account Status</span>
            <span className="text-emerald-700 font-semibold mt-0.5 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              Active &amp; Verified
            </span>
          </div>
        </div>
      </div>

      {/* 4. Password Rotation Card */}
      <div className="card-stitch p-5 bg-white border border-[#e2e8f0]">
        <div className="pb-3 border-b border-[#e2e8f0] mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0f172a] text-[18px]">lock_reset</span>
            <h2 className="text-sm font-bold text-[#0b1c30]">Rotate Security Access Key</h2>
          </div>
          <span className="badge-mono text-[10px]">BCRYPT VERIFIED</span>
        </div>

        {message && (
          <div className="mb-4 p-2.5 rounded bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] text-xs">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-2.5 rounded bg-[#fff1f2] border border-[#fecdd3] text-[#9f1239] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md text-xs">
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#515f74] mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded text-xs focus:border-[#0f172a] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-[#515f74] mb-1">New Security Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded text-xs focus:border-[#0f172a] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-[#515f74] mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded text-xs focus:border-[#0f172a] focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-stitch-primary"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfilePage;
