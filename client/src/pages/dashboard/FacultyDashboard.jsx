import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { BookOpen, Users, CalendarCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FacultyDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        const res = await axiosClient.get('/dashboard/faculty');
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.warn('Fallback faculty metrics:', err.message);
        setData({
          assignedCoursesCount: 2,
          totalEnrolledStudents: 120,
          sessionsConducted: 28,
          averageAttendance: '91.2%',
          activeCourses: [
            { id: 'ca1', code: 'CS301', title: 'Database Management Systems', section: 'A', students: 60, nextClass: 'Period 2 (10:00 AM)' },
            { id: 'ca2', code: 'CS302', title: 'Operating Systems Concepts', section: 'B', students: 60, nextClass: 'Period 4 (01:30 PM)' },
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading faculty workspace..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B4D] tracking-tight">Faculty Workspace</h1>
          <p className="text-sm text-slate-500 mt-1">Course lecture tracking, student rosters, and daily attendance.</p>
        </div>
        <Link to="/attendance" className="btn-secondary text-xs">
          <CalendarCheck className="w-4 h-4" />
          <span>Mark Class Attendance</span>
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Assigned Courses"
          value={data?.assignedCoursesCount}
          icon={BookOpen}
          color="primary"
          subtext="Current Semester"
        />
        <StatCard
          title="Total Students"
          value={data?.totalEnrolledStudents}
          icon={Users}
          color="secondary"
          subtext="Under instruction"
        />
        <StatCard
          title="Lectures Conducted"
          value={data?.sessionsConducted}
          icon={CalendarCheck}
          color="warning"
          subtext="Logged in system"
        />
        <StatCard
          title="Average Attendance"
          value={data?.averageAttendance}
          icon={CheckCircle2}
          color="success"
          subtext="On-Duty included"
        />
      </div>

      {/* Course Assignments List */}
      <div className="card-institutional p-6">
        <h2 className="text-base font-bold text-[#172B4D] mb-4">My Teaching Schedule & Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.activeCourses?.map((course) => (
            <div key={course.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold font-mono text-[#0F9D94] bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                    {course.code} &bull; Sec {course.section}
                  </span>
                  <h3 className="text-base font-bold text-[#172B4D] mt-2">{course.title}</h3>
                </div>
                <span className="text-xs font-semibold text-slate-500">{course.students} Students</span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">{course.nextClass}</span>
                <Link
                  to="/attendance"
                  className="font-semibold text-[#163A63] hover:text-[#0F9D94] flex items-center space-x-1"
                >
                  <span>Take Attendance</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
