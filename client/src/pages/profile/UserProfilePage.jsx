import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

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
      setMessage('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#172B4D] tracking-tight">Institutional Profile Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage credentials, identity tokens, and security settings.</p>
      </div>

      {/* Profile Card */}
      <div className="card-institutional p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#163A63] text-white flex items-center justify-center font-bold text-xl shadow">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#172B4D]">{user?.email}</h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded bg-blue-50 text-[#163A63] border border-blue-200">
                {user?.role}
              </span>
              <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Account Active</span>
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-100 pt-4">
          <div>
            <span className="text-slate-400 block mb-0.5">Account ID</span>
            <span className="font-mono text-slate-700 font-semibold">{user?.id || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Database Sync</span>
            <span className="font-semibold text-teal-700">Neon Cloud Active</span>
          </div>
        </div>
      </div>

      {/* Password Change Form */}
      <div className="card-institutional p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Lock className="w-5 h-5 text-[#0F9D94]" />
          <h2 className="text-base font-bold text-[#172B4D]">Update Password</h2>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9D94]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9D94]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9D94]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary text-xs"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserProfilePage;
