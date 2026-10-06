import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { attendanceApi, AttendanceRecord } from '../services/api';
import {
  CalendarCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  GraduationCap,
  MessageSquare,
  Users,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isMentor } = useAuth();

  // Selected date in YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Load attendance data whenever selectedDate changes
  const fetchAttendance = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await attendanceApi.getAttendanceByDate(date);
      setRecords(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching attendance:', err);
      setError(err?.message || 'Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin || isMentor) {
      void fetchAttendance(selectedDate);
    }
  }, [selectedDate, isAdmin, isMentor]);

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 1);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 1);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleToday = () => {
    setSelectedDate(getTodayString());
  };

  // Formatted date string e.g. "29 September 2026"
  const formattedDateTitle = useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    } catch {
      // Fallback
    }
    return selectedDate;
  }, [selectedDate]);

  // Format timestamp as IST 12h AM/PM time (explicit Asia/Kolkata timezone)
  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return '--:--';
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return '--:--';
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      });
    } catch {
      return '--:--';
    }
  };

  // Metrics
  const totalCount = records.length;
  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const absentCount = totalCount - presentCount;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Search
      const matchesSearch =
        searchQuery === '' ||
        r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.role?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;

      // Role
      const matchesRole = roleFilter === 'ALL' || r.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [records, searchQuery, statusFilter, roleFilter]);

  // Avatar Gradients
  const getAvatarGradient = (idx: number) => {
    const list = [
      'from-[#0062E0] to-[#0091FF]',
      'from-[#00B388] to-[#00D9A5]',
      'from-[#6366F1] to-[#818CF8]',
      'from-[#0284C7] to-[#38BDF8]',
    ];
    return list[idx % list.length];
  };

  // Guard for non-admin / non-mentor
  if (!isAdmin && !isMentor) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center mt-12 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <AlertCircle className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="text-lg font-bold text-[#0F172A] mb-2">Access Restricted</h2>
        <p className="text-sm text-[#64748B] mb-6">
          Attendance records and history are only accessible to Administrators and Mentors. Regular users can view active colleagues via the Active Today header icon.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-[#0062E0] hover:bg-[#0051B8] text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Top Header & Title ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0062E0] to-[#00B388] p-0.5 shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <CalendarCheck className="w-5 h-5 text-[#0062E0]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight font-mono">
                  ATTENDANCE — {formattedDateTitle}
                </h1>
                <span className="w-2 h-2 rounded-full bg-[#00B388]" />
              </div>
              <p className="text-xs text-[#64748B] font-medium">
                {isAdmin
                  ? 'System-Wide Daily Attendance Records'
                  : `Mentor View (${user?.department || 'Department'}) — Assigned Mentees & Colleagues`}
              </p>
            </div>
          </div>
        </div>

        {/* Date Selector & Controls */}
        <div className="flex items-center space-x-2 bg-white p-1.5 rounded-xl border border-[#E2E8F0] shadow-sm">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 text-[#0062E0] absolute left-2.5 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-8 pr-2.5 py-1 text-xs font-semibold text-[#0F172A] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0062E0]"
            />
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleToday}
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#0062E0] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] transition-colors"
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => fetchAttendance(selectedDate)}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
            title="Refresh Attendance"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mentor Scope Notice */}
      {isMentor && !isAdmin && (
        <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-900 text-xs flex items-center space-x-2.5">
          <GraduationCap className="w-4 h-4 text-purple-700 flex-shrink-0" />
          <span>
            <strong>Mentor Scope:</strong> Showing attendance for users assigned to you as mentor and active colleagues in the <strong>{user?.department || 'Testing/Development'}</strong> department.
          </span>
        </div>
      )}

      {/* ── Summary Metric Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-[#64748B] font-semibold">Total Users</p>
            <p className="text-2xl font-bold text-[#0F172A] mt-1">{totalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Present */}
        <div className="p-4 rounded-xl bg-white border border-[#A7F3D0] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-[#008766] font-semibold">Present</p>
            <p className="text-2xl font-bold text-[#008766] mt-1">{presentCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F0FDF9] border border-[#A7F3D0] flex items-center justify-center text-[#00B388]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Absent */}
        <div className="p-4 rounded-xl bg-white border border-[#CBD5E1] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-[#64748B] font-semibold">Absent</p>
            <p className="text-2xl font-bold text-[#64748B] mt-1">{absentCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8]">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Rate */}
        <div className="p-4 rounded-xl bg-white border border-[#BFDBFE] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-[#0062E0] font-semibold">Attendance Rate</p>
            <p className="text-2xl font-bold text-[#0062E0] mt-1">{attendanceRate}%</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#0062E0]">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ─────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search person..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#F8FAFC] text-[#0F172A] border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0062E0] focus:bg-white"
          />
        </div>

        {/* Status & Role Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Buttons */}
          <div className="inline-flex rounded-lg border border-[#E2E8F0] p-0.5 bg-[#F8FAFC]">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('PRESENT')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === 'PRESENT'
                  ? 'bg-[#00B388] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#008766]'
              }`}
            >
              Present ({presentCount})
            </button>
            <button
              onClick={() => setStatusFilter('ABSENT')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === 'ABSENT'
                  ? 'bg-[#64748B] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Absent ({absentCount})
            </button>
          </div>

          {/* Role Dropdown */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-semibold text-[#475569] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="MENTOR">Mentor</option>
            <option value="TESTER">Tester</option>
            <option value="DEVELOPER">Developer</option>
          </select>
        </div>
      </div>

      {/* ── Attendance Table ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-[#64748B]">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-[#0062E0] mb-2" />
            <p>Loading attendance for {formattedDateTitle}...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#94A3B8]">
            <Users className="w-8 h-8 mx-auto text-[#CBD5E1] mb-2" />
            <p>No records found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-mono uppercase text-[#64748B]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Name</th>
                  <th className="py-3.5 px-4 font-semibold">Role</th>
                  <th className="py-3.5 px-4 font-semibold">Attendance</th>
                  <th className="py-3.5 px-4 font-semibold">First Active</th>
                  <th className="py-3.5 px-4 font-semibold">Last Active</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredRecords.map((item, idx) => {
                  const isPresent = item.status === 'PRESENT';
                  const initial = item.name ? item.name.charAt(0).toUpperCase() : 'U';
                  const isSelf = (user?.userId && String(item.id) === String(user.userId)) ||
                                 (user?.email && item.email && user.email.toLowerCase() === item.email.toLowerCase());

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#F8FAFC] transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`
                              w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient(idx)}
                              text-white font-bold flex items-center justify-center text-xs shadow-xs
                            `}
                          >
                            {initial}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-semibold text-[#0F172A]">{item.name}</span>
                              {isSelf && (
                                <span className="text-[10px] font-bold text-[#64748B] bg-[#E2E8F0] px-1.5 py-0.2 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#64748B] block truncate max-w-[200px]">
                              {item.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role & Department */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`
                              px-2 py-0.5 rounded text-[10px] font-bold capitalize
                              ${
                                item.role === 'ADMIN'
                                  ? 'bg-blue-50 text-[#0062E0] border border-blue-200'
                                  : item.role === 'MENTOR'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : item.role === 'TESTER'
                                  ? 'bg-emerald-50 text-[#008766] border border-emerald-200'
                                  : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                              }
                            `}
                          >
                            {item.role?.toLowerCase()}
                          </span>
                          {item.department && (
                            <span className="text-[11px] text-[#64748B]">
                              ({item.department})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#008766] border border-[#A7F3D0] text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00B388]" />
                            PRESENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F8FAFC] text-[#64748B] border border-[#CBD5E1] text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
                            ABSENT
                          </span>
                        )}
                      </td>

                      {/* First Active */}
                      <td className="py-3 px-4 font-mono text-[#475569]">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <span>{formatTime(item.firstActiveAt)}</span>
                        </div>
                      </td>

                      {/* Last Active */}
                      <td className="py-3 px-4 font-mono text-[#475569]">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <span>{formatTime(item.lastActiveAt)}</span>
                        </div>
                      </td>

                      {/* Chat Action */}
                      <td className="py-3 px-4 text-right">
                        {!isSelf ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/chat?userId=${item.id}`)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-[#0062E0] bg-[#EFF6FF] hover:bg-[#DBEAFE] rounded-lg border border-[#BFDBFE] transition-colors"
                            title={`Chat with ${item.name}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Chat</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#94A3B8] italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
