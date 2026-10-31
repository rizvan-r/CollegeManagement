import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const LoginPage = ({ forcedPortal }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Detect portal from URL or prop
  const getInitialPortal = () => {
    if (forcedPortal) return forcedPortal;
    if (location.pathname.includes('/student')) return 'STUDENT';
    if (location.pathname.includes('/faculty')) return 'FACULTY';
    if (location.pathname.includes('/admin')) return 'ADMIN';
    return 'STUDENT'; // default friendly portal
  };

  const [activePortal, setActivePortal] = useState(getInitialPortal);
  const [email, setEmail] = useState('student.alex@college.edu');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync state when URL route changes
  useEffect(() => {
    const portal = getInitialPortal();
    setActivePortal(portal);
    if (portal === 'STUDENT') {
      setEmail('student.alex@college.edu');
    } else if (portal === 'FACULTY') {
      setEmail('faculty.alan@college.edu');
    } else {
      setEmail('admin@college.edu');
    }
    setPassword('Password@123');
    setError('');
  }, [location.pathname]);

  const handlePortalChange = (portal) => {
    setActivePortal(portal);
    setError('');
    if (portal === 'STUDENT') {
      navigate('/login/student');
    } else if (portal === 'FACULTY') {
      navigate('/login/faculty');
    } else {
      navigate('/login/admin');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide institutional credentials.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message || 'Authentication rejected. Verify your institutional email and password.');
    }
  };

  const setDemoCredentials = (demoEmail, demoPass = 'Password@123') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="card-stitch p-6 sm:p-8 bg-white shadow-sm border border-[#e2e8f0]">
      {/* Top Portal Switcher Tabs */}
      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#515f74] mb-2 flex items-center justify-between">
          <span>Select Institutional Gateway</span>
          <span className="font-mono text-[10px] text-[#94a3b8]">PORTAL SEPARATION ACTIVE</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#eff4ff] rounded border border-[#e2e8f0]">
          <button
            type="button"
            onClick={() => handlePortalChange('STUDENT')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded text-xs font-semibold tracking-tight transition-all ${
              activePortal === 'STUDENT'
                ? 'bg-white text-[#0b1c30] shadow-sm border border-[#c6c6cd]'
                : 'text-[#515f74] hover:text-[#0b1c30] hover:bg-white/60'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">school</span>
            <span className="truncate">Student SIS</span>
          </button>

          <button
            type="button"
            onClick={() => handlePortalChange('FACULTY')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded text-xs font-semibold tracking-tight transition-all ${
              activePortal === 'FACULTY'
                ? 'bg-white text-[#0b1c30] shadow-sm border border-[#c6c6cd]'
                : 'text-[#515f74] hover:text-[#0b1c30] hover:bg-white/60'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">co_present</span>
            <span className="truncate">Faculty Portal</span>
          </button>

          <button
            type="button"
            onClick={() => handlePortalChange('ADMIN')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded text-xs font-semibold tracking-tight transition-all ${
              activePortal === 'ADMIN'
                ? 'bg-white text-[#0b1c30] shadow-sm border border-[#c6c6cd]'
                : 'text-[#515f74] hover:text-[#0b1c30] hover:bg-white/60'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">shield</span>
            <span className="truncate">Admin / Registrar</span>
          </button>
        </div>
      </div>

      {/* Header Context by Portal */}
      <div className="mb-6 pb-4 border-b border-[#e2e8f0]">
        {activePortal === 'STUDENT' && (
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="badge-sky">
                <span className="material-symbols-outlined text-[14px]">school</span>
                STUDENT SIS PORTAL
              </span>
              <span className="font-mono text-[11px] text-[#515f74]">SECURE ACCESS</span>
            </div>
            <h1 className="text-xl font-bold text-[#0b1c30] tracking-tight">Student Information System</h1>
            <p className="text-xs text-[#515f74] mt-1">
              Sign in to view enrolled course rosters, real-time lecture attendance records, and academic standing.
            </p>
          </div>
        )}

        {activePortal === 'FACULTY' && (
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="badge-emerald">
                <span className="material-symbols-outlined text-[14px]">co_present</span>
                FACULTY & INSTRUCTOR PORTAL
              </span>
              <span className="font-mono text-[11px] text-[#515f74]">ACADEMIC AFFAIRS</span>
            </div>
            <h1 className="text-xl font-bold text-[#0b1c30] tracking-tight">Faculty Workload & Roll Call</h1>
            <p className="text-xs text-[#515f74] mt-1">
              Sign in to administer live roll call, manage instructional workload, and record student grades.
            </p>
          </div>
        )}

        {activePortal === 'ADMIN' && (
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="badge-amber">
                <span className="material-symbols-outlined text-[14px]">account_balance</span>
                REGISTRAR & EXECUTIVE PORTAL
              </span>
              <span className="font-mono text-[11px] text-[#515f74]">MASTER CONTROLS</span>
            </div>
            <h1 className="text-xl font-bold text-[#0b1c30] tracking-tight">Academic Governance Command</h1>
            <p className="text-xs text-[#515f74] mt-1">
              Sign in to manage academic departments, student rosters, faculty appointments, and institutional audits.
            </p>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-5 p-3 rounded bg-[#fff1f2] border border-[#fecdd3] text-[#9f1239] text-xs flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[18px] shrink-0 text-[#9f1239]">error</span>
          <div className="leading-relaxed">
            <span className="font-semibold block">Authentication Unsuccessful</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#45464d] mb-1.5">
            {activePortal === 'STUDENT'
              ? 'Student Institutional Email / UID'
              : activePortal === 'FACULTY'
              ? 'Faculty Institutional Email'
              : 'Administrative Email'}
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] text-[18px]">
              mail
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@college.edu"
              required
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#cbd5e1] rounded text-xs font-medium text-[#0b1c30] placeholder-[#94a3b8] focus:outline-none focus:border-[#0f172a] focus:ring-1 focus:ring-[#0f172a]"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#45464d]">
              Password
            </label>
            <span className="text-[11px] text-[#515f74] hover:text-[#0b1c30] cursor-pointer">
              Forgot security key?
            </span>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] text-[18px]">
              lock
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#cbd5e1] rounded text-xs font-medium text-[#0b1c30] placeholder-[#94a3b8] focus:outline-none focus:border-[#0f172a] focus:ring-1 focus:ring-[#0f172a]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-stitch-primary py-2.5 text-xs font-semibold justify-center mt-2"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Authenticating Credentials...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span>Sign In to {activePortal === 'STUDENT' ? 'Student SIS' : activePortal === 'FACULTY' ? 'Faculty Portal' : 'Admin Hub'}</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </span>
          )}
        </button>
      </form>

      {/* Preset Fast Login Section */}
      <div className="mt-6 pt-5 border-t border-[#e2e8f0]">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#515f74]">
            Instant Demo Credentials
          </span>
          <span className="font-mono text-[10px] text-[#94a3b8]">PASS: Password@123</span>
        </div>

        {activePortal === 'STUDENT' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('student.alex@college.edu')}
              className="text-left p-2.5 rounded border border-[#e2e8f0] bg-[#eff4ff] hover:bg-[#e5eeff] hover:border-[#cbd5e1] transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0b1c30]">Alex Mercer</span>
                <span className="badge-mono text-[10px]">SEM 3</span>
              </div>
              <p className="text-[11px] text-[#515f74] truncate mt-0.5">student.alex@college.edu</p>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials('student.priya@college.edu')}
              className="text-left p-2.5 rounded border border-[#e2e8f0] bg-[#eff4ff] hover:bg-[#e5eeff] hover:border-[#cbd5e1] transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0b1c30]">Priya Nair</span>
                <span className="badge-mono text-[10px]">SEM 3</span>
              </div>
              <p className="text-[11px] text-[#515f74] truncate mt-0.5">student.priya@college.edu</p>
            </button>
          </div>
        )}

        {activePortal === 'FACULTY' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('faculty.alan@college.edu')}
              className="text-left p-2.5 rounded border border-[#e2e8f0] bg-[#ecfdf5] hover:bg-[#d1fae5] hover:border-[#a7f3d0] transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#065f46]">Dr. Alan Turing</span>
                <span className="badge-mono text-[10px]">EMP-002</span>
              </div>
              <p className="text-[11px] text-[#065f46]/80 truncate mt-0.5">faculty.alan@college.edu</p>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials('faculty.grace@college.edu')}
              className="text-left p-2.5 rounded border border-[#e2e8f0] bg-[#ecfdf5] hover:bg-[#d1fae5] hover:border-[#a7f3d0] transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#065f46]">Prof. Grace Hopper</span>
                <span className="badge-mono text-[10px]">EMP-003</span>
              </div>
              <p className="text-[11px] text-[#065f46]/80 truncate mt-0.5">faculty.grace@college.edu</p>
            </button>
          </div>
        )}

        {activePortal === 'ADMIN' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('admin@college.edu')}
              className="text-left p-2.5 rounded border border-[#e2e8f0] bg-[#fffbeb] hover:bg-[#fef3c7] hover:border-[#fde68a] transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#92400e]">System Admin</span>
                <span className="badge-mono text-[10px]">SUPER</span>
              </div>
              <p className="text-[11px] text-[#92400e]/80 truncate mt-0.5">admin@college.edu</p>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials('hod.cse@college.edu')}
              className="text-left p-2.5 rounded border border-[#e2e8f0] bg-[#fffbeb] hover:bg-[#fef3c7] hover:border-[#fde68a] transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#92400e]">Dr. Robert Vance</span>
                <span className="badge-mono text-[10px]">HOD CSE</span>
              </div>
              <p className="text-[11px] text-[#92400e]/80 truncate mt-0.5">hod.cse@college.edu</p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
