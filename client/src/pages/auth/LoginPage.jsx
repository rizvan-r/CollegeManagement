import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@college.edu');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(searchParams.get('expired') ? 'Your session has expired. Please sign in again.' : '');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message || 'Invalid email or password.');
    }
  };

  const setDemoAccount = (demoEmail, demoPass = 'Password@123') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-[#163A63] text-white rounded-2xl mx-auto flex items-center justify-center font-black text-2xl shadow-md mb-4">
          CMP
        </div>
        <h2 className="text-2xl font-bold text-[#172B4D] tracking-tight">College Portal Login</h2>
        <p className="text-sm text-slate-500 mt-1">One Campus. One Platform. Complete Management.</p>
      </div>

      {/* Error Feedback */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Institutional Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@college.edu"
              required
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#0F9D94] focus:outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#0F9D94] focus:outline-none transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#163A63] hover:bg-[#0F2742] text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-70 cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Demo Credentials Quick Switcher */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
          Quick Demo Accounts (Password: Password@123)
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setDemoAccount('admin@college.edu')}
            className="p-2 text-left rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <span className="font-bold text-[#163A63] block">Admin</span>
            <span className="text-[11px] text-slate-500 truncate block">admin@college.edu</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoAccount('hod.cse@college.edu')}
            className="p-2 text-left rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <span className="font-bold text-teal-700 block">HOD / Staff</span>
            <span className="text-[11px] text-slate-500 truncate block">hod.cse@college.edu</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoAccount('faculty.alan@college.edu')}
            className="p-2 text-left rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <span className="font-bold text-blue-700 block">Faculty</span>
            <span className="text-[11px] text-slate-500 truncate block">faculty.alan@college.edu</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoAccount('student.alex@college.edu')}
            className="p-2 text-left rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <span className="font-bold text-emerald-700 block">Student</span>
            <span className="text-[11px] text-slate-500 truncate block">student.alex@college.edu</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
