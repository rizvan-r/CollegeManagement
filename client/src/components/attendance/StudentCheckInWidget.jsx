import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';

export const StudentCheckInWidget = ({ onCheckInSuccess, compact = false }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const formatPinInput = (val) => {
    // Only allow alphanumeric / digits, auto-insert dash after 3 characters
    const clean = val.replace(/[^0-9a-zA-Z]/g, '').toUpperCase().slice(0, 6);
    if (clean.length > 3) {
      return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    }
    return clean;
  };

  const handlePinChange = (e) => {
    setErrorMessage('');
    setPin(formatPinInput(e.target.value));
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    const clean = pin.replace(/-/g, '').trim();
    if (clean.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit Session PIN (e.g. 123-456)');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessResult(null);

    try {
      const res = await axiosClient.post('/attendance/check-in', { pin: clean });
      if (res.success) {
        setSuccessResult(res);
        setPin('');
        if (typeof onCheckInSuccess === 'function') {
          onCheckInSuccess(res);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to verify Session PIN. Please confirm the code with your professor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`card-stitch bg-white border border-[#cbd5e1] overflow-hidden ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2e8f0] pb-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0f172a] text-white flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[22px]">pin</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#0b1c30]">Live Lecture Check-In</h2>
              <span className="badge-rose text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-pulse"></span>
                LIVE CODE
              </span>
            </div>
            <p className="text-xs text-[#515f74]">
              Enter the 6-digit Session PIN displayed on the lecture hall screen to log attendance.
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#515f74]">
          <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
          <span className="font-semibold text-[11px]">Instant SIS Sync</span>
        </div>
      </div>

      {/* Check-In Form */}
      <form onSubmit={handleCheckIn} className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#515f74] text-[20px]">
              key
            </span>
            <input
              type="text"
              value={pin}
              onChange={handlePinChange}
              placeholder="000-000"
              maxLength={7}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9ff] border-2 border-[#cbd5e1] focus:border-[#0f172a] rounded-lg text-lg font-mono font-bold tracking-widest text-[#0b1c30] placeholder-[#94a3b8] focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || pin.replace(/-/g, '').length < 6}
            className="btn-stitch-primary py-2.5 px-6 text-xs font-bold flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">
              {loading ? 'sync' : 'check_circle'}
            </span>
            <span>{loading ? 'Verifying PIN...' : 'Submit Session PIN'}</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in duration-150">
            <span className="material-symbols-outlined text-rose-600 text-[18px] shrink-0 mt-0.5">error</span>
            <div className="flex-1">
              <span className="font-bold">Check-In Failed:</span> {errorMessage}
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="text-rose-600 hover:text-rose-800"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Success Confirmation Card */}
        {successResult && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 text-xs text-emerald-950 animate-in zoom-in-95 duration-150 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 text-[22px]">verified</span>
                <span className="font-bold text-sm text-emerald-900">
                  Attendance Confirmed! Marked PRESENT
                </span>
              </div>
              <span className="badge-emerald font-bold">LIVE SYNCED</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/70 text-[11px]">
              <div>
                <span className="text-[#515f74] block">Course:</span>
                <strong className="text-[#0b1c30]">
                  {successResult.data?.session?.courseCode}: {successResult.data?.session?.courseTitle}
                </strong>
              </div>
              <div>
                <span className="text-[#515f74] block">Section & Period:</span>
                <strong className="text-[#0b1c30]">
                  Sec {successResult.data?.session?.section} &bull; Period #{successResult.data?.session?.periodNumber}
                </strong>
              </div>
              <div>
                <span className="text-[#515f74] block">Faculty Cadre:</span>
                <strong className="text-[#0b1c30]">
                  {successResult.data?.session?.facultyName || 'Course Professor'}
                </strong>
              </div>
              <div>
                <span className="text-[#515f74] block">Timestamp:</span>
                <strong className="text-emerald-800 font-mono">
                  {successResult.data?.checkInTime || 'Just now'}
                </strong>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default StudentCheckInWidget;
