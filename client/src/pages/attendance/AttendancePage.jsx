import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import StudentCheckInWidget from '../../components/attendance/StudentCheckInWidget';

export const AttendancePage = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';

  // Live Timer State
  const [secondsElapsed, setSecondsElapsed] = useState(2538);
  const [isLocked, setIsLocked] = useState(false);

  // Innovation 1: Dynamic 6-Digit Session Check-In Code
  const [sessionPin, setSessionPin] = useState(null);
  const [pinTimeLeft, setPinTimeLeft] = useState(300); // 5 minutes
  const [checkInNotice, setCheckInNotice] = useState('');

  // Innovation 2: What-If Attendance Forecaster Simulator Modal
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simulatorStudent, setSimulatorStudent] = useState(null);
  const [simAttendedDelta, setSimAttendedDelta] = useState(4);
  const [simMissedDelta, setSimMissedDelta] = useState(1);

  // Dynamic Course Assignments
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [periodNumber, setPeriodNumber] = useState(2);
  const [topic, setTopic] = useState('Relational Normalization & BCNF Integrity');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Current Session Identification & State
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isExistingSession, setIsExistingSession] = useState(false);

  // Live Roster from Neon DB
  const [roster, setRoster] = useState([]);

  // Recorded Sessions History
  const [pastSessions, setPastSessions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Student Attendance Stats (if logged in as student)
  const [studentStats, setStudentStats] = useState(null);

  // 1. Fetch available course assignments
  const fetchAssignments = async () => {
    try {
      const res = await axiosClient.get('/attendance/assignments');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setAssignments(res.data);
        if (!selectedAssignmentId) {
          setSelectedAssignmentId(res.data[0].id);
        }
      } else {
        // Fallback default assignment
        setAssignments([
          {
            id: 'ca111111-1111-1111-1111-111111111101',
            course_code: 'CS301',
            course_title: 'Database Management Systems',
            section: 'A',
            faculty_name: 'Dr. Alan Turing',
            department_name: 'Computer Science and Engineering',
          },
        ]);
        setSelectedAssignmentId('ca111111-1111-1111-1111-111111111101');
      }
    } catch (err) {
      console.warn('Assignments fetch fallback:', err.message);
    }
  };

  // 2. Fetch past recorded sessions
  const fetchPastSessions = async () => {
    try {
      const res = await axiosClient.get('/attendance/sessions');
      if (res.success && Array.isArray(res.data)) {
        setPastSessions(res.data);
      }
    } catch (err) {
      console.warn('Past sessions fetch notice:', err.message);
    }
  };

  // 3. Fetch live roster and check if session already exists in DB for current assignment, date & period
  const fetchRosterAndSession = async (assignmentId, date, period) => {
    if (!assignmentId) return;
    try {
      setLoadingRoster(true);

      // Step A: Load active enrolled students for section
      let baseRoster = [];
      try {
        const rosterRes = await axiosClient.get(`/attendance/roster/${assignmentId}`);
        if (rosterRes.success && Array.isArray(rosterRes.data)) {
          baseRoster = rosterRes.data;
        }
      } catch (rErr) {
        console.warn('Base roster fallback:', rErr.message);
      }

      // Step B: Check if attendance was already recorded for this session
      try {
        const checkRes = await axiosClient.get(
          `/attendance/current-session?courseAssignmentId=${assignmentId}&sessionDate=${date}&periodNumber=${period}`
        );
        if (checkRes.success && checkRes.exists && checkRes.data) {
          const sessionData = checkRes.data;
          setCurrentSessionId(sessionData.id);
          setIsExistingSession(true);
          if (sessionData.topic) {
            setTopic(sessionData.topic);
          }

          const recordMap = new Map();
          if (Array.isArray(sessionData.records)) {
            sessionData.records.forEach((rec) => {
              recordMap.set(rec.student_id, rec.status);
            });
          }

          // Merge saved status into roster so faculty can see and update recorded state
          const mergedRoster = (baseRoster.length > 0 ? baseRoster : sessionData.records.map((r) => ({
            studentId: r.student_id,
            admissionNumber: r.admission_number,
            name: r.student_name,
            major: r.major,
            status: r.status,
            time: 'Recorded',
          }))).map((s) => ({
            ...s,
            status: recordMap.has(s.studentId) ? recordMap.get(s.studentId) : s.status || 'PRESENT',
          }));

          setRoster(mergedRoster);
          return;
        }
      } catch (checkErr) {
        console.warn('Current session check error:', checkErr.message);
      }

      // No recorded session found for this date & period -> ready for fresh submission
      setCurrentSessionId(null);
      setIsExistingSession(false);
      setRoster(baseRoster);
    } catch (err) {
      console.warn('Roster fetch fallback:', err.message);
    } finally {
      setLoadingRoster(false);
    }
  };

  // 4. Fetch student stats if student user
  const fetchStudentStats = async () => {
    if (!isStudent) return;
    try {
      const stuRes = await axiosClient.get('/students');
      const myStu = stuRes.data?.find((s) => s.email?.toLowerCase() === user.email?.toLowerCase());
      const stuId = myStu?.id || stuRes.data?.[0]?.id;
      if (stuId) {
        const statsRes = await axiosClient.get(`/attendance/student/${stuId}`);
        if (statsRes.success) {
          setStudentStats(statsRes.summary);
        }
      }
    } catch (err) {
      console.warn('Student stats fetch notice:', err.message);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchPastSessions();
    if (isStudent) {
      fetchStudentStats();
    }
  }, [isStudent]);

  useEffect(() => {
    if (selectedAssignmentId) {
      fetchRosterAndSession(selectedAssignmentId, sessionDate, periodNumber);
    }
  }, [selectedAssignmentId, sessionDate, periodNumber]);

  // Live timer tick
  useEffect(() => {
    if (isLocked) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isLocked]);

  // Session PIN countdown
  useEffect(() => {
    if (!sessionPin || pinTimeLeft <= 0) return;
    const interval = setInterval(() => {
      setPinTimeLeft((prev) => {
        if (prev <= 1) {
          setSessionPin(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionPin, pinTimeLeft]);

  const generatePin = async () => {
    try {
      const res = await axiosClient.post('/attendance/generate-pin', {
        courseAssignmentId: selectedAssignmentId,
        sessionDate,
        periodNumber: parseInt(periodNumber, 10) || 1,
        topic,
      });
      if (res.success && res.pin) {
        setSessionPin(res.pin);
        setPinTimeLeft(res.expiresInSeconds || 600);
        if (res.sessionId) {
          setCurrentSessionId(res.sessionId);
          setIsExistingSession(true);
        }
        setCheckInNotice(`Live Session PIN ${res.pin} generated and active for 10 minutes! Students can now enter this PIN from their login.`);
        setTimeout(() => setCheckInNotice(''), 8000);
      }
    } catch (err) {
      console.warn('Backend PIN generation fallback:', err.message);
      const code = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
      setSessionPin(code);
      setPinTimeLeft(300);
    }
  };

  const simulateStudentCheckIn = () => {
    if (!sessionPin) return;
    // Pick first absent/late student or first roster item
    const target = roster.find((s) => s.status !== 'PRESENT') || roster[0];
    if (!target) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setRoster((prev) =>
      prev.map((s) =>
        s.studentId === target.studentId
          ? { ...s, status: 'PRESENT', time: timeStr, verifiedByPin: true }
          : s
      )
    );

    setCheckInNotice(`✓ Self check-in verified via PIN ${sessionPin} for ${target.name} (${target.admissionNumber})`);
    setTimeout(() => setCheckInNotice(''), 5000);
  };

  const exportRosterCSV = () => {
    if (roster.length === 0) return;
    const headers = ['Admission Number', 'Student Name', 'Department / Major', 'Status', 'Marked Time', 'Date', 'Course', 'Section'];
    const rows = roster.map((s) => [
      `"${s.admissionNumber || ''}"`,
      `"${s.name || ''}"`,
      `"${s.major || ''}"`,
      `"${s.status || 'PRESENT'}"`,
      `"${s.time || '10:00 AM'}"`,
      `"${sessionDate}"`,
      `"${selectedAssignment.course_code || 'CS301'}"`,
      `"${selectedAssignment.section || 'A'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_${selectedAssignment.course_code || 'CS'}_Sec${selectedAssignment.section || 'A'}_${sessionDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openForecasterModal = (student = null) => {
    setSimulatorStudent(
      student || {
        name: user?.role === 'STUDENT' ? 'Alex Mercer (You)' : 'Selected Student',
        admissionNumber: 'CMP-2025-CSE-0001',
        attended: 14,
        total: 18,
      }
    );
    setSimAttendedDelta(4);
    setSimMissedDelta(1);
    setSimulatorOpen(true);
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m : ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const setStudentStatus = (studentId, status) => {
    if (isLocked) return;
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const markAllPresent = () => {
    if (isLocked) return;
    setRoster((prev) => prev.map((s) => ({ ...s, status: 'PRESENT' })));
  };

  const handleLoadPastSession = (s) => {
    if (s.course_assignment_id) {
      setSelectedAssignmentId(s.course_assignment_id);
    }
    if (s.session_date) {
      const dStr = typeof s.session_date === 'string'
        ? s.session_date.split('T')[0]
        : new Date(s.session_date).toISOString().split('T')[0];
      setSessionDate(dStr);
    }
    if (s.period_number) {
      setPeriodNumber(s.period_number);
    }
    if (s.topic) {
      setTopic(s.topic);
    }
    setShowHistory(false);
  };

  const handleSaveSession = async () => {
    if (roster.length === 0) {
      setErrorMessage('No student records in roster to mark attendance.');
      return;
    }
    setSaving(true);
    setSavedSuccess('');
    setErrorMessage('');
    try {
      let res;
      if (isExistingSession && currentSessionId) {
        // Update existing current session in Neon DB
        res = await axiosClient.put(`/attendance/sessions/${currentSessionId}`, {
          topic,
          records: roster.map((r) => ({ studentId: r.studentId, status: r.status })),
        });
      } else {
        // Create / upsert attendance session in Neon DB
        res = await axiosClient.post('/attendance/sessions', {
          courseAssignmentId: selectedAssignmentId,
          sessionDate,
          periodNumber: parseInt(periodNumber, 10) || 1,
          topic,
          records: roster.map((r) => ({ studentId: r.studentId, status: r.status })),
        });
      }

      if (res.success) {
        const sid = res.data?.id || currentSessionId;
        if (sid) {
          setCurrentSessionId(sid);
          setIsExistingSession(true);
        }
        setSavedSuccess(
          isExistingSession
            ? `Current session updated successfully! Synced ${res.recordsCount || roster.length} student attendance records to Neon PostgreSQL.`
            : `Session recorded successfully! Persisted ${res.recordsCount || roster.length} student records to Neon PostgreSQL.`
        );
        fetchPastSessions();
        if (isStudent) fetchStudentStats();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update attendance session.');
    } finally {
      setSaving(false);
      setTimeout(() => setSavedSuccess(''), 6000);
    }
  };

  const selectedAssignment = assignments.find((a) => a.id === selectedAssignmentId) || assignments[0] || {};

  // Metrics calculation
  const enrolledCount = roster.length || 1;
  const presentCount = roster.filter((r) => r.status === 'PRESENT').length;
  const lateCount = roster.filter((r) => r.status === 'LATE').length;
  const onDutyCount = roster.filter((r) => r.status === 'ON_DUTY').length;
  const absentCount = roster.filter((r) => r.status === 'ABSENT').length;
  const attendanceRate = (((presentCount + onDutyCount + lateCount) / enrolledCount) * 100).toFixed(1);

  const filteredRoster = roster.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.name || '').toLowerCase().includes(q) ||
      (r.admissionNumber || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* 1. Contextual Breadcrumb & Session Banner (Stitch Spec) */}
      <div className="card-stitch p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge-rose">
              <span className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse"></span>
              LIVE SIS SESSION ACTIVE
            </span>
            <span className="text-[#94a3b8] text-xs">•</span>
            <span className="badge-mono text-[10px]">SECTION {selectedAssignment.section || 'A'}</span>
            <span className="text-[#94a3b8] text-xs">•</span>
            <span className="text-xs text-[#515f74] font-medium">
              {selectedAssignment.department_name || 'Engineering Faculty'}
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <h1 className="text-xl font-bold text-[#0b1c30] tracking-tight">
              {selectedAssignment.course_code || 'CS301'}: {selectedAssignment.course_title || 'Curriculum Course'}
            </h1>
            {assignments.length > 1 && (
              <select
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                className="px-2.5 py-1 bg-[#f8f9ff] border border-[#cbd5e1] rounded text-xs font-semibold text-[#0b1c30] focus:outline-none"
              >
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.course_code} - Sec {a.section} ({a.faculty_name})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-[#515f74] flex-wrap pt-0.5">
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-[#515f74]">calendar_today</span>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="border-b border-[#cbd5e1] bg-transparent text-xs text-[#0b1c30] font-medium focus:outline-none"
              />
            </span>
            <span className="text-[#c6c6cd]">•</span>
            <span className="inline-flex items-center gap-1 font-semibold text-[#0b1c30]">
              <span className="material-symbols-outlined text-[15px] text-[#0f172a]">schedule</span>
              Period #{periodNumber}
            </span>
            <span className="text-[#c6c6cd]">•</span>
            <span className="inline-flex items-center gap-1 font-semibold text-[#0b1c30]">
              <span className="material-symbols-outlined text-[15px] text-[#0f172a]">badge</span>
              {selectedAssignment.faculty_name || 'Assigned Faculty'}
            </span>
          </div>
        </div>

        {/* Active Timer & Session Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#eff4ff] border border-[#e2e8f0] rounded">
            <span className="material-symbols-outlined text-[#515f74] text-[18px]">timer</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#515f74] uppercase tracking-wider">Session Time</span>
              <span className="font-mono text-xs font-bold text-[#0b1c30]">{formatTimer(secondsElapsed)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={generatePin}
              className={`p-2 rounded border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                sessionPin
                  ? 'bg-sky-50 border-sky-400 text-sky-800 shadow-xs'
                  : 'bg-white border-[#cbd5e1] text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
              title="Generate live 6-digit check-in code for students"
            >
              <span className="material-symbols-outlined text-[16px] text-sky-600">
                {sessionPin ? 'pin' : 'qr_code_scanner'}
              </span>
              <span>{sessionPin ? 'Regenerate PIN' : 'Session PIN'}</span>
            </button>

            <button
              type="button"
              onClick={() => openForecasterModal()}
              className="p-2 rounded border border-[#cbd5e1] bg-white text-xs font-bold text-indigo-700 hover:bg-indigo-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Calculate projected attendance based on future classes"
            >
              <span className="material-symbols-outlined text-[16px] text-indigo-600">calculate</span>
              <span>What-If Simulator</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLocked(!isLocked)}
              className={`p-2 rounded border text-xs font-bold transition-all flex items-center gap-1 ${
                isLocked
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-white border-[#cbd5e1] text-[#515f74] hover:bg-[#f8f9ff]'
              }`}
              title={isLocked ? 'Unlock roster modifications' : 'Lock session roster'}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isLocked ? 'lock' : 'lock_open'}
              </span>
              <span>{isLocked ? 'Locked' : 'Lock'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded border border-[#cbd5e1] bg-white text-xs font-bold text-[#0b1c30] hover:bg-[#f8f9ff] flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              <span>History ({pastSessions.length})</span>
            </button>

            {!isStudent && (
              <button
                type="button"
                disabled={saving || isLocked}
                onClick={handleSaveSession}
                className="btn-stitch-primary py-2 px-4 shadow-sm flex items-center gap-1.5"
                title={isExistingSession ? "Submit updates to this recorded session in Neon PostgreSQL" : "Submit attendance for this session in Neon PostgreSQL"}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {saving ? 'sync' : isExistingSession ? 'published_with_changes' : 'how_to_reg'}
                </span>
                <span>{saving ? 'Saving...' : isExistingSession ? 'Submit Update for Current Session' : 'Submit Roll Call'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Session PIN Active Banner */}
      {sessionPin && (
        <div className="p-4 rounded-xl bg-linear-to-r from-sky-900 via-indigo-900 to-slate-900 text-white shadow-lg border border-sky-400/30 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 text-2xl font-mono font-bold">
              <span className="material-symbols-outlined text-[28px]">pin</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-400/30">
                  Live Check-In Active
                </span>
                <span className="text-xs text-sky-200 font-mono">
                  Expires in {Math.floor(pinTimeLeft / 60)}:{(pinTimeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <h3 className="text-2xl font-extrabold tracking-widest font-mono text-white mt-0.5">
                {sessionPin}
              </h3>
              <p className="text-[11px] text-sky-200 mt-0.5">
                Students can enter this PIN on their Student Dashboard or Attendance Log to record attendance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={simulateStudentCheckIn}
              className="w-full md:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
              <span>Simulate Student Check-In</span>
            </button>
            <button
              type="button"
              onClick={() => setSessionPin(null)}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
              title="Dismiss PIN"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Live Check-In Success Notice */}
      {checkInNotice && (
        <div className="p-3 bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-md animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span>{checkInNotice}</span>
          </div>
          <button onClick={() => setCheckInNotice('')} className="text-white/80 hover:text-white">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Success / Error Banners */}
      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <span className="material-symbols-outlined text-emerald-700 text-[18px]">check_circle</span>
          <span>{savedSuccess}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded text-xs text-rose-800 flex items-center gap-2 font-medium">
          <span className="material-symbols-outlined text-rose-700 text-[18px]">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Student Session PIN Check-In Widget */}
      {isStudent && (
        <StudentCheckInWidget
          onCheckInSuccess={() => {
            fetchStudentStats();
            if (selectedAssignmentId) {
              fetchRosterAndSession(selectedAssignmentId, sessionDate, periodNumber);
            }
          }}
        />
      )}

      {/* Student Personal Statistics Banner (if Student) */}
      {isStudent && studentStats && (
        <div className="card-stitch p-4 bg-[#f8fafc] border border-[#cbd5e1] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">person_check</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0b1c30]">Your Live Attendance Record</h2>
              <p className="text-xs text-[#515f74]">
                Aggregated from official SIS attendance sessions recorded by your course professors.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="text-center">
              <span className="text-[10px] text-[#515f74] uppercase block">Total Sessions</span>
              <strong className="text-base text-[#0b1c30]">{studentStats.total_sessions}</strong>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-[#515f74] uppercase block">Present</span>
              <strong className="text-base text-emerald-700">{studentStats.present_count}</strong>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-[#515f74] uppercase block">Absent</span>
              <strong className="text-base text-rose-700">{studentStats.absent_count}</strong>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-[#515f74] uppercase block">Compliance</span>
              <span className="badge-emerald text-xs font-bold">{studentStats.attendance_percentage}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Existing Recorded Session Status Banner */}
      {isExistingSession && (
        <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-950 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-indigo-600 text-[22px]">history_edu</span>
            <div>
              <span className="font-bold text-[#0b1c30]">Current Session Active in Database:</span>{' '}
              <span>
                Attendance was previously recorded for <strong>Period #{periodNumber}</strong> on <strong>{sessionDate}</strong>.
                You can adjust attendance statuses below and click <strong>Submit Update for Current Session</strong> to synchronize changes.
              </span>
            </div>
          </div>
          {!isStudent && (
            <button
              type="button"
              disabled={saving || isLocked}
              onClick={handleSaveSession}
              className="btn-stitch-primary py-1.5 px-3 text-xs shrink-0 flex items-center gap-1.5 shadow-xs"
              title="Submit changes for this recorded session"
            >
              <span className="material-symbols-outlined text-[15px]">
                {saving ? 'sync' : 'published_with_changes'}
              </span>
              <span>{saving ? 'Updating...' : 'Submit Update'}</span>
            </button>
          )}
        </div>
      )}

      {/* 2. Topic Input & Period Controls */}
      <div className="card-stitch p-4 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full flex items-center gap-2">
          <span className="material-symbols-outlined text-[#76777d] text-[18px]">edit_note</span>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-[#515f74] uppercase tracking-wider mb-0.5">
              Lecture Topic & Syllabus Objective
            </label>
            <input
              type="text"
              value={topic}
              disabled={isLocked}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Relational Normalization & BCNF Integrity"
              className="w-full px-2.5 py-1 text-xs border border-[#cbd5e1] rounded font-semibold text-[#0b1c30] focus:border-[#0f172a] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          <div>
            <label className="block text-[10px] font-bold text-[#515f74] uppercase tracking-wider mb-0.5">
              Period
            </label>
            <select
              value={periodNumber}
              disabled={isLocked}
              onChange={(e) => setPeriodNumber(e.target.value)}
              className="px-2.5 py-1 text-xs border border-[#cbd5e1] rounded font-bold text-[#0b1c30]"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                <option key={p} value={p}>
                  Period {p}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3">
            <button
              type="button"
              disabled={isLocked}
              onClick={markAllPresent}
              className="px-3 py-1 bg-[#eff4ff] border border-[#cbd5e1] rounded text-xs font-bold text-[#0b1c30] hover:bg-[#e2e8f0] transition-all flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-700">done_all</span>
              <span>Mark All Present</span>
            </button>
          </div>

          {!isStudent && (
            <div className="pt-3">
              <button
                type="button"
                disabled={saving || isLocked}
                onClick={handleSaveSession}
                className="px-3.5 py-1 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                title={isExistingSession ? "Submit updates to this recorded session in Neon PostgreSQL" : "Submit attendance for this session in Neon PostgreSQL"}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {saving ? 'sync' : isExistingSession ? 'published_with_changes' : 'save'}
                </span>
                <span>
                  {saving ? 'Saving...' : isExistingSession ? 'Submit Update for Current Session' : 'Submit Attendance'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="card-stitch p-3 bg-white">
          <span className="text-[10px] font-bold text-[#515f74] uppercase block">Enrolled Students</span>
          <span className="text-xl font-bold text-[#0b1c30] mt-1 block">{roster.length}</span>
          <span className="text-[10px] text-[#515f74]">Active Course Roster</span>
        </div>
        <div className="card-stitch p-3 bg-white">
          <span className="text-[10px] font-bold text-emerald-700 uppercase block">Present</span>
          <span className="text-xl font-bold text-emerald-700 mt-1 block">{presentCount}</span>
          <span className="text-[10px] text-[#515f74]">Verified In-Seat</span>
        </div>
        <div className="card-stitch p-3 bg-white">
          <span className="text-[10px] font-bold text-amber-700 uppercase block">Late Entry</span>
          <span className="text-xl font-bold text-amber-700 mt-1 block">{lateCount}</span>
          <span className="text-[10px] text-[#515f74]">Tardy Arrival</span>
        </div>
        <div className="card-stitch p-3 bg-white">
          <span className="text-[10px] font-bold text-sky-700 uppercase block">On Duty</span>
          <span className="text-xl font-bold text-sky-700 mt-1 block">{onDutyCount}</span>
          <span className="text-[10px] text-[#515f74]">Approved Collegiate Duty</span>
        </div>
        <div className="card-stitch p-3 bg-white">
          <span className="text-[10px] font-bold text-rose-700 uppercase block">Compliance Rate</span>
          <span className="text-xl font-bold text-[#0b1c30] mt-1 block">{attendanceRate}%</span>
          <span className="text-[10px] text-[#515f74]">{absentCount} Absent</span>
        </div>
      </div>

      {/* 4. Past Recorded Sessions History Modal / Drawer */}
      {showHistory && (
        <div className="card-stitch p-4 bg-white border border-[#cbd5e1] space-y-3">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0f172a] text-[18px]">history</span>
              <h2 className="text-sm font-bold text-[#0b1c30]">Historical SIS Attendance Sessions (Neon DB)</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="text-[#76777d] hover:text-[#0b1c30] text-xs font-semibold"
            >
              Close
            </button>
          </div>

          {pastSessions.length === 0 ? (
            <p className="text-xs text-[#515f74] py-4 text-center">No past attendance sessions recorded in database.</p>
          ) : (
            <div className="overflow-x-auto max-h-60">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f1f5f9] border-b border-[#cbd5e1] text-[10px] uppercase font-bold text-[#475569]">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Course</th>
                    <th className="py-2 px-3">Period</th>
                    <th className="py-2 px-3">Topic</th>
                    <th className="py-2 px-3">Faculty</th>
                    <th className="py-2 px-3">Present / Total</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {pastSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-[#f8fafc]">
                      <td className="py-2 px-3 font-mono">{s.session_date ? new Date(s.session_date).toLocaleDateString() : '—'}</td>
                      <td className="py-2 px-3 font-semibold text-[#0b1c30]">{s.course_code} (Sec {s.section})</td>
                      <td className="py-2 px-3">Period {s.period_number}</td>
                      <td className="py-2 px-3 text-[#515f74]">{s.topic}</td>
                      <td className="py-2 px-3">{s.faculty_name}</td>
                      <td className="py-2 px-3">
                        <span className="badge-emerald font-bold">{s.present_count} / {s.total_students}</span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleLoadPastSession(s)}
                          className="px-2 py-0.5 bg-[#eff4ff] hover:bg-[#dbeafe] text-[#1e40af] text-[11px] font-bold rounded border border-[#bfdbfe] transition-all inline-flex items-center gap-1 cursor-pointer"
                          title="Load this session into workspace to update attendance"
                        >
                          <span className="material-symbols-outlined text-[13px]">edit_calendar</span>
                          <span>Load & Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. Live Roster Table */}
      <div className="card-stitch overflow-hidden bg-white">
        <div className="p-3 border-b border-[#e2e8f0] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#76777d] text-[16px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search student by name or admission number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#f8f9ff] border border-[#cbd5e1] rounded text-xs text-[#0b1c30] placeholder-[#94a3b8] focus:outline-none focus:border-[#0f172a] focus:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={exportRosterCSV}
              className="px-3 py-1.5 bg-white border border-[#cbd5e1] rounded text-xs font-semibold text-[#0b1c30] hover:bg-[#eff4ff] flex items-center gap-1.5 shrink-0 shadow-2xs transition-colors cursor-pointer"
              title="Download attendance sheet as CSV spreadsheet"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-600">download</span>
              <span className="hidden md:inline">Export CSV</span>
            </button>
          </div>

          <span className="text-xs text-[#515f74] shrink-0">
            Enrolled Students in Roster: <strong className="text-[#0b1c30]">{roster.length}</strong>
          </span>
        </div>

        {loadingRoster ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="md" text="Loading course roster from database..." />
          </div>
        ) : filteredRoster.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#515f74]">
            <span className="material-symbols-outlined text-[32px] text-[#94a3b8] block mb-2">group_off</span>
            No enrolled students found in this course section.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f1f5f9] border-b border-[#cbd5e1] text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Admission #</th>
                  <th className="py-2.5 px-3">Student Full Name</th>
                  <th className="py-2.5 px-3">Degree & Major</th>
                  <th className="py-2.5 px-3">Roll Call Status</th>
                  <th className="py-2.5 px-3 text-right">Time Log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] text-xs">
                {filteredRoster.map((student) => (
                  <tr key={student.studentId} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="badge-mono font-bold">{student.admissionNumber}</span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#0b1c30]">{student.name}</td>
                    <td className="py-2.5 px-3 text-[#515f74]">{student.major || 'Undergraduate'}</td>
                    <td className="py-2.5 px-3">
                      {isStudent ? (
                        <span className={`badge-mono font-bold ${
                          student.status === 'PRESENT' ? 'text-emerald-800' :
                          student.status === 'ABSENT' ? 'text-rose-800' :
                          student.status === 'LATE' ? 'text-amber-800' : 'text-sky-800'
                        }`}>
                          {student.status}
                        </span>
                      ) : (
                        <div className="inline-flex rounded border border-[#cbd5e1] bg-[#f8f9ff] p-0.5 gap-0.5">
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => setStudentStatus(student.studentId, 'PRESENT')}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                              student.status === 'PRESENT'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-[#515f74] hover:text-[#0b1c30]'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => setStudentStatus(student.studentId, 'LATE')}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                              student.status === 'LATE'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-[#515f74] hover:text-[#0b1c30]'
                            }`}
                          >
                            Late
                          </button>
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => setStudentStatus(student.studentId, 'ON_DUTY')}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                              student.status === 'ON_DUTY'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'text-[#515f74] hover:text-[#0b1c30]'
                            }`}
                          >
                            On-Duty
                          </button>
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => setStudentStatus(student.studentId, 'ABSENT')}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                              student.status === 'ABSENT'
                                ? 'bg-[#ba1a1a] text-white shadow-xs'
                                : 'text-[#515f74] hover:text-[#0b1c30]'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openForecasterModal(student)}
                          className="px-2 py-0.5 rounded border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Simulate future attendance projection for this student"
                        >
                          <span className="material-symbols-outlined text-[12px]">insights</span>
                          <span>What-If</span>
                        </button>
                        <span className="font-mono text-xs text-[#515f74]">{student.time || '10:00 AM'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Bottom Action Footer */}
        {!loadingRoster && filteredRoster.length > 0 && (
          <div className="p-3.5 bg-[#f8fafc] border-t border-[#e2e8f0] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#515f74] flex-wrap">
              <span className="material-symbols-outlined text-[18px] text-[#0f172a]">fact_check</span>
              <span>
                {isExistingSession ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    Current Session Loaded &mdash; Period #{periodNumber} &bull; {sessionDate} ({presentCount}/{enrolledCount} Present)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#0b1c30]">
                    <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                    Current Session &mdash; Period #{periodNumber} &bull; {sessionDate} ({presentCount}/{enrolledCount} Present)
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={isLocked}
                onClick={markAllPresent}
                className="btn-stitch-secondary text-xs py-1.5 px-3 flex items-center gap-1 cursor-pointer"
                title="Mark all students as present"
              >
                <span className="material-symbols-outlined text-[15px] text-emerald-600">done_all</span>
                <span>Mark All Present</span>
              </button>

              <button
                type="button"
                onClick={exportRosterCSV}
                className="btn-stitch-secondary text-xs py-1.5 px-3 flex items-center gap-1 cursor-pointer"
                title="Export current session attendance sheet as CSV"
              >
                <span className="material-symbols-outlined text-[15px] text-sky-600">download</span>
                <span>Export CSV</span>
              </button>

              {!isStudent && (
                <button
                  type="button"
                  disabled={saving || isLocked}
                  onClick={handleSaveSession}
                  className="btn-stitch-primary py-2 px-4 shadow-sm flex items-center gap-1.5"
                  title={isExistingSession ? "Submit updates to this recorded session in Neon PostgreSQL" : "Submit attendance for this session in Neon PostgreSQL"}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {saving ? 'sync' : isExistingSession ? 'published_with_changes' : 'how_to_reg'}
                  </span>
                  <span>
                    {saving ? 'Saving...' : isExistingSession ? 'Submit Update for Current Session' : 'Submit Roll Call'}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Innovation: Predictive "What-If" Attendance Forecaster Modal */}
      {simulatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#cbd5e1] overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 bg-linear-to-r from-[#0b1c30] via-[#122844] to-[#1e3a5f] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md">
                  <span className="material-symbols-outlined text-[20px]">calculate</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Attendance Forecaster & Risk Simulator</h3>
                  <p className="text-[11px] text-sky-200">Predictive academic eligibility projections</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSimulatorOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* Target Student Identity */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-[#e2e8f0]">
                <div>
                  <span className="text-[10px] font-bold text-[#64748b] uppercase block">Scholar Profile</span>
                  <span className="text-sm font-bold text-[#0b1c30]">{simulatorStudent?.name || 'Alex Mercer'}</span>
                </div>
                <span className="badge-mono text-xs font-bold">{simulatorStudent?.admissionNumber || 'CMP-2025-CSE-0001'}</span>
              </div>

              {/* Projection Comparison Meter */}
              {(() => {
                const baseAttended = simulatorStudent?.attended || 14;
                const baseTotal = simulatorStudent?.total || 18;
                const currentPct = Math.round((baseAttended / baseTotal) * 100);

                const newAttended = baseAttended + Number(simAttendedDelta);
                const newTotal = baseTotal + Number(simAttendedDelta) + Number(simMissedDelta);
                const projPct = Math.round((newAttended / Math.max(1, newTotal)) * 100);
                const isShortage = projPct < 75;

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-[#e2e8f0] text-center">
                        <span className="text-[10px] font-bold text-[#64748b] uppercase block">Current Standing</span>
                        <div className="text-2xl font-extrabold text-[#0b1c30] mt-0.5">{currentPct}%</div>
                        <span className="text-[11px] text-[#64748b] font-medium">{baseAttended} of {baseTotal} Classes</span>
                      </div>
                      <div className={`p-3 rounded-xl border text-center transition-all ${
                        isShortage 
                          ? 'bg-rose-50 border-rose-300' 
                          : projPct >= 85 
                          ? 'bg-emerald-50 border-emerald-300' 
                          : 'bg-sky-50 border-sky-300'
                      }`}>
                        <span className={`text-[10px] font-bold uppercase block ${
                          isShortage ? 'text-rose-700' : projPct >= 85 ? 'text-emerald-700' : 'text-sky-700'
                        }`}>
                          Projected Standing
                        </span>
                        <div className={`text-2xl font-extrabold mt-0.5 ${
                          isShortage ? 'text-rose-700' : projPct >= 85 ? 'text-emerald-700' : 'text-sky-700'
                        }`}>
                          {projPct}%
                        </div>
                        <span className="text-[11px] font-medium text-[#475569]">
                          {newAttended} of {newTotal} Classes
                        </span>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[#64748b]">University Minimum: 75%</span>
                        <span className={isShortage ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                          {isShortage ? '⚠️ Exam Eligibility At Risk' : '✅ Eligible for Exams'}
                        </span>
                      </div>
                      <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            isShortage ? 'bg-rose-500' : projPct >= 85 ? 'bg-emerald-500' : 'bg-sky-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, projPct))}%` }}
                        />
                        {/* 75% threshold marker */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-black/60 shadow-xs z-10"
                          style={{ left: '75%' }}
                          title="75% Minimum Threshold"
                        />
                      </div>
                    </div>

                    {/* Interactive Future Simulation Controls */}
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-semibold text-[#0b1c30]">Upcoming Classes You Will Attend:</label>
                          <span className="font-bold text-emerald-700 font-mono">+{simAttendedDelta} Classes</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={simAttendedDelta}
                          onChange={(e) => setSimAttendedDelta(Number(e.target.value))}
                          className="w-full accent-emerald-600 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-semibold text-[#0b1c30]">Upcoming Classes You Will Miss:</label>
                          <span className="font-bold text-rose-700 font-mono">-{simMissedDelta} Classes</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={simMissedDelta}
                          onChange={(e) => setSimMissedDelta(Number(e.target.value))}
                          className="w-full accent-rose-600 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Smart Insight Note */}
                    <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                      isShortage ? 'bg-rose-50/70 border-rose-200 text-rose-900' : 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                    }`}>
                      {isShortage ? (
                        <p>
                          ⚠️ <strong>Critical Shortage Warning</strong>: Under this projection, your attendance ({projPct}%) falls below the 75% requirement. You must avoid unexcused absences in the next {Math.ceil((0.75 * newTotal - newAttended) / 0.25) || 2} sessions.
                        </p>
                      ) : (
                        <p>
                          💡 <strong>Safe Academic Standing</strong>: Attending {simAttendedDelta} more sessions comfortably maintains your standing at {projPct}%, satisfying registrar accreditation criteria.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-[#e2e8f0] flex justify-end">
              <button
                type="button"
                aria-label="Close Forecaster Modal"
                onClick={() => setSimulatorOpen(false)}
                className="px-4 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Close Forecaster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
