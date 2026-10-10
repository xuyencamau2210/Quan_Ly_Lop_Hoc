import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Calendar, 
  Check, 
  X, 
  Clock, 
  AlertCircle, 
  Save, 
  History, 
  UserCheck, 
  CheckCircle2, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Classroom, AttendanceRecord, AttendanceStatus } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useToast } from '../components/Toast.tsx';

interface AttendanceViewProps {
  classes: Classroom[];
  initialClassId?: string;
  onRefreshStats: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  classes,
  initialClassId,
  onRefreshStats
}) => {
  const { success, error, warning } = useToast();
  
  // Tab: 'daily' (Điểm danh) or 'history' (Lịch sử)
  const [activeTab, setActiveTab] = useState<'daily' | 'history'>('daily');

  // Selected filters
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || (classes[0]?.id || '')
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Attendance records state
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // History state
  const [historySummaries, setHistorySummaries] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load attendance records when class or date changes
  useEffect(() => {
    if (!selectedClassId) return;
    loadAttendanceRecords();
  }, [selectedClassId, selectedDate]);

  // Load history when tab is 'history'
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, selectedClassId]);

  const loadAttendanceRecords = async () => {
    try {
      setLoading(true);
      const data = await api.getAttendance(selectedClassId, selectedDate);
      setRecords(data);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      error(err.message || 'Lỗi khi tải dữ liệu điểm danh');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.getAttendanceHistory(selectedClassId);
      setHistorySummaries(res.summaries || []);
    } catch (err: any) {
      error(err.message || 'Lỗi khi tải lịch sử điểm danh');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
    setHasUnsavedChanges(true);
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, note } : r))
    );
    setHasUnsavedChanges(true);
  };

  const handleMarkAllPresent = () => {
    setRecords((prev) =>
      prev.map((r) => ({ ...r, status: 'present' as AttendanceStatus }))
    );
    setHasUnsavedChanges(true);
    success('Đã đánh dấu tất cả học sinh CÓ MẶT');
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId || !selectedDate) return;
    try {
      setSaving(true);
      await api.saveAttendance(selectedClassId, selectedDate, records);
      success(`Đã lưu điểm danh ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')} lên máy chủ!`);
      setHasUnsavedChanges(false);
      onRefreshStats();
    } catch (err: any) {
      error(err.message || 'Lỗi khi lưu điểm danh');
    } finally {
      setSaving(false);
    }
  };

  // Calculations for today's selected view
  const total = records.length;
  const presentCount = records.filter((r) => r.status === 'present').length;
  const excusedCount = records.filter((r) => r.status === 'excused').length;
  const unexcusedCount = records.filter((r) => r.status === 'unexcused').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const attendanceRate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 100;

  const currentClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Điểm danh Lớp học</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ghi nhận hiện diện hàng ngày và theo dõi lịch sử chuyên cần của học sinh
          </p>
        </div>

        {/* Tab switchers */}
        <div className="inline-flex p-1 bg-slate-200/80 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'daily'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            Điểm danh ngày
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            Lịch sử chuyên cần
          </button>
        </div>
      </div>

      {/* Class & Date Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Class Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Lớp học:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3.5 py-2 text-sm font-extrabold bg-slate-50 border border-slate-200 rounded-xl text-indigo-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Lớp {c.name} ({c.homeroomTeacher})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          {activeTab === 'daily' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Ngày:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {activeTab === 'daily' && (
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={handleMarkAllPresent}
              className="px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
            >
              Tất cả có mặt
            </button>

            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-2 ${
                hasUnsavedChanges
                  ? 'bg-indigo-600 hover:bg-indigo-700 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu điểm danh lên máy chủ'}
            </button>
          </div>
        )}
      </div>

      {/* DAILY ATTENDANCE VIEW */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar for Today */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Sĩ số lớp</span>
              <span className="text-2xl font-black text-slate-800">{total}</span>
              <span className="text-[11px] text-slate-500 block">học sinh</span>
            </div>
            <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-700 block uppercase">Có mặt</span>
              <span className="text-2xl font-black text-emerald-800">{presentCount}</span>
              <span className="text-[11px] text-emerald-600 block">đúng giờ</span>
            </div>
            <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200">
              <span className="text-[11px] font-bold text-amber-700 block uppercase">Vắng có phép</span>
              <span className="text-2xl font-black text-amber-800">{excusedCount}</span>
              <span className="text-[11px] text-amber-600 block">phụ huynh báo</span>
            </div>
            <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200">
              <span className="text-[11px] font-bold text-rose-700 block uppercase">Không phép</span>
              <span className="text-2xl font-black text-rose-800">{unexcusedCount}</span>
              <span className="text-[11px] text-rose-600 block">cần liên hệ PH</span>
            </div>
            <div className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-200 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-purple-700 block uppercase">Đi trễ</span>
              <span className="text-2xl font-black text-purple-800">{lateCount}</span>
              <span className="text-[11px] text-purple-600 block">Tỉ lệ: {attendanceRate}%</span>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 animate-pulse">
                Đang tải danh sách điểm danh lớp...
              </div>
            ) : records.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-bold">Chưa có học sinh nào trong lớp này</p>
                <p className="text-xs text-slate-400 mt-1">Vui lòng thêm học sinh vào lớp học trước</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 w-12 text-center">STT</th>
                      <th className="py-3 px-4 w-28">Mã HS</th>
                      <th className="py-3 px-4">Họ và tên</th>
                      <th className="py-3 px-4 text-center">Trạng thái điểm danh</th>
                      <th className="py-3 px-4">Lý do / Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((r, idx) => {
                      return (
                        <tr key={r.studentId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 text-center text-xs font-medium text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs font-bold text-indigo-600">
                            {r.studentCode}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {r.studentName}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(r.studentId, 'present')}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                                  r.status === 'present'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Có mặt
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(r.studentId, 'excused')}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                                  r.status === 'excused'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Có phép
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(r.studentId, 'unexcused')}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                                  r.status === 'unexcused'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Không phép
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(r.studentId, 'late')}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                                  r.status === 'late'
                                    ? 'bg-purple-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Đi trễ
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder="Lý do nghỉ hoặc ghi chú..."
                              value={r.note || ''}
                              onChange={(e) => handleNoteChange(r.studentId, e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
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
      )}

      {/* ATTENDANCE HISTORY VIEW */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">
              Nhật ký điểm danh lớp {currentClass?.name || ''}
            </h3>
            <span className="text-xs text-slate-500">
              Tổng số ngày ghi nhận: {historySummaries.length} ngày
            </span>
          </div>

          {loadingHistory ? (
            <div className="p-12 text-center text-slate-400">Đang tải lịch sử...</div>
          ) : historySummaries.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-bold">Chưa có bản ghi điểm danh nào cho lớp này</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Ngày điểm danh</th>
                    <th className="py-3.5 px-4">Lớp</th>
                    <th className="py-3.5 px-4 text-center">Sĩ số</th>
                    <th className="py-3.5 px-4 text-center">Có mặt</th>
                    <th className="py-3.5 px-4 text-center">Có phép</th>
                    <th className="py-3.5 px-4 text-center">Không phép</th>
                    <th className="py-3.5 px-4 text-center">Đi trễ</th>
                    <th className="py-3.5 px-4 text-center">Tỉ lệ chuyên cần</th>
                    <th className="py-3.5 px-4 text-right">Xem lại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historySummaries.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {new Date(item.date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700">
                          {item.className}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {item.total}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                        {item.present}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-amber-700">
                        {item.excused}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-rose-700">
                        {item.unexcused}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-purple-700">
                        {item.late}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          {item.attendanceRate}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedDate(item.date);
                            setActiveTab('daily');
                          }}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                        >
                          Mở ngày này
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
    </div>
  );
};
