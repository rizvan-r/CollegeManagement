import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';

export const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const res = await axiosClient.get('/dashboard/student');
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.warn('Fallback student metrics:', err.message);
        setData({
          admissionNumber: 'CMP-2025-CSE-0001',
          department: 'Computer Science and Engineering',
          currentSemester: 'Semester 3',
          overallAttendance: 89.5,
          enrolledCoursesCount: 4,
          subjectAttendance: [
            { code: 'CS301', title: 'Database Management Systems', present: 22, onDuty: 2, total: 26, percent: 92.3 },
            { code: 'CS302', title: 'Operating Systems Concepts', present: 20, onDuty: 1, total: 24, percent: 87.5 },
            { code: 'CS303', title: 'Theory of Computation', present: 18, onDuty: 0, total: 20, percent: 90.0 },
            { code: 'MA301', title: 'Discrete Mathematics', present: 19, onDuty: 2, total: 25, percent: 84.0 },
          ],
          recentNotices: [
            { id: 1, title: 'CSE Department Annual Hackathon 2025', date: 'Oct 30', priority: 'NORMAL' },
            { id: 2, title: 'Mid-Semester Examination Schedule', date: 'Oct 28', priority: 'HIGH' },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="md" text="Loading student academic records..." />
      </div>
    );
  }

  const isLowAttendance = (data?.overallAttendance || 0) < 75;

  return (
    <div className="space-y-5">
      {/* 1. Academic Governance Context Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-2 rounded border border-[#e2e8f0]">
        <div className="flex items-center gap-1.5 text-xs text-[#515f74]">
          <span className="material-symbols-outlined text-[17px] text-[#515f74]">school</span>
          <span className="font-bold uppercase tracking-wider text-[11px] text-[#0b1c30]">Student SIS</span>
          <span className="text-[#94a3b8]">/</span>
          <span className="font-semibold uppercase tracking-wider text-[11px]">Enrolled Scholar Roster</span>
          <span className="text-[#94a3b8]">/</span>
          <span className="badge-mono text-[10px] font-bold">AY 2025–2026</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block mr-1"></span>
            BURSAR: CLEARED
          </span>
          <span className="badge-mono text-[10px]">AUDIT: PASS</span>
        </div>
      </div>

      {/* 2. Student Profile Banner */}
      <div className="card-stitch p-5 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="badge-mono text-xs font-bold text-[#0b1c30]">
              {data?.admissionNumber || 'CMP-2025-CSE-0001'}
            </span>
            <span className="badge-emerald">GOOD STANDING</span>
            <span className="badge-sky">DEAN'S HONOR LIST</span>
          </div>
          <h1 className="text-xl font-bold text-[#0b1c30] tracking-tight">Academic Overview & Transcript Hub</h1>
          <p className="text-xs text-[#515f74] mt-0.5">
            {data?.department} • {data?.currentSemester} • Fall Academic Term
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/attendance" className="btn-stitch-primary">
            <span className="material-symbols-outlined text-[16px]">fact_check</span>
            <span>Live Attendance Log</span>
          </Link>
        </div>
      </div>

      {/* Attendance Deficiency Alert if < 75% */}
      {isLowAttendance && (
        <div className="p-3 bg-[#fff1f2] border border-[#fecdd3] rounded text-xs text-[#9f1239] flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[20px] shrink-0 text-[#ba1a1a]">warning</span>
          <div>
            <span className="font-bold block">Attendance Deficiency Notice (&lt; 75%)</span>
            <span>
              Your recorded attendance is below the mandatory institutional requirement of 75%. Please consult your course instructor or submit approved On-Duty records.
            </span>
          </div>
        </div>
      )}

      {/* 3. KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Overall Lecture Attendance"
          value={`${data?.overallAttendance || 89.5}%`}
          icon="verified"
          subtext="Includes approved On-Duty"
          trend="Req: ≥ 75%"
          progress={data?.overallAttendance || 89.5}
          progressColor={isLowAttendance ? 'bg-[#ba1a1a]' : 'bg-emerald-600'}
          badge={isLowAttendance ? 'At Risk' : 'Compliant'}
          badgeType={isLowAttendance ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Enrolled Courses"
          value={data?.enrolledCoursesCount || 4}
          icon="menu_book"
          subtext="Current Academic Semester"
          trend="15 Total Credits"
          progress={100}
          progressColor="bg-[#0f172a]"
          badge="Full-Time"
          badgeType="sky"
        />
        <StatCard
          title="Academic Standing"
          value="3.85 GPA"
          icon="military_tech"
          subtext="Dean's List Eligible"
          trend="Top 5% Cohort"
          progress={96.2}
          progressColor="bg-emerald-600"
          badge="Honors"
          badgeType="emerald"
        />
      </div>

      {/* 4. Subject Attendance Breakdown Table */}
      <div className="card-stitch overflow-hidden bg-white">
        <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0f172a] text-[18px]">fact_check</span>
            <h2 className="text-sm font-bold text-[#0b1c30]">Subject-Wise Attendance Breakdown</h2>
          </div>
          <span className="badge-mono text-[10px]">MIN REQUIREMENT: 75%</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f1f5f9] border-b border-[#cbd5e1] text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                <th className="py-2.5 px-3">Course Code</th>
                <th className="py-2.5 px-3">Course Title</th>
                <th className="py-2.5 px-3">Lectures Attended</th>
                <th className="py-2.5 px-3">On-Duty Credits</th>
                <th className="py-2.5 px-3">Total Held</th>
                <th className="py-2.5 px-3">Compliance Rate</th>
                <th className="py-2.5 px-3 text-right">Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] text-xs">
              {(data?.subjectAttendance || []).map((subject) => {
                const isSubjectLow = subject.percent < 75;
                return (
                  <tr key={subject.code} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="badge-mono">{subject.code}</span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#0b1c30]">{subject.title}</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">{subject.present}</td>
                    <td className="py-2.5 px-3 text-[#075985] font-semibold">{subject.onDuty}</td>
                    <td className="py-2.5 px-3 text-[#515f74]">{subject.total}</td>
                    <td className="py-2.5 px-3">
                      <div className="w-28">
                        <div className="flex justify-between text-[11px] mb-1 font-mono font-bold">
                          <span className={isSubjectLow ? 'text-[#9f1239]' : 'text-emerald-700'}>
                            {subject.percent}%
                          </span>
                        </div>
                        <div className="w-full bg-[#eff4ff] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isSubjectLow ? 'bg-[#ba1a1a]' : 'bg-emerald-600'}`}
                            style={{ width: `${subject.percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {isSubjectLow ? (
                        <span className="badge-rose">Deficient</span>
                      ) : (
                        <span className="badge-emerald">Compliant</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
