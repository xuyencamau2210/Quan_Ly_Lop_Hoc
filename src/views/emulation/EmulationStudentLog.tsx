import React, { useState, useEffect } from 'react';
import { 
  User, 
  Search, 
  Award, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Printer
} from 'lucide-react';
import { Classroom, Student, EmulationPeriod } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../components/Toast.tsx';

interface EmulationStudentLogProps {
  classes: Classroom[];
  students: Student[];
  periods: EmulationPeriod[];
  selectedClassId: string;
  selectedPeriodId: string;
}

export const EmulationStudentLog: React.FC<EmulationStudentLogProps> = ({
  classes,
  students,
  periods,
  selectedClassId,
  selectedPeriodId
}) => {
  const { error } = useToast();

  const [currentClassId, setCurrentClassId] = useState<string>(selectedClassId || classes[0]?.id || '');
  const [currentPeriodId, setCurrentPeriodId] = useState<string>(selectedPeriodId || 'all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentLogData, setStudentLogData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Available students in current class
  const classStudents = students.filter(s => s.classId === currentClassId && s.status === 'active');

  // Auto-select first student if none selected
  useEffect(() => {
    if (classStudents.length > 0 && !selectedStudentId) {
      setSelectedStudentId(classStudents[0].id);
    }
  }, [classStudents, selectedStudentId]);

  // Load student log
  useEffect(() => {
    if (!selectedStudentId) return;
    loadStudentLog(selectedStudentId, currentClassId, currentPeriodId);
  }, [selectedStudentId, currentClassId, currentPeriodId]);

  const loadStudentLog = async (stId: string, clsId: string, pId: string) => {
    try {
      setLoading(true);
      const data = await api.getStudentEmulationLog(stId, clsId, pId);
      setStudentLogData(data);
    } catch (err: any) {
      error(err.message || 'Lỗi khi tải sổ theo dõi học sinh');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Sổ Theo dõi Thi đua Từng Học sinh</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem toàn bộ quá trình phấn đấu, biểu dương thành tích và các lần nhắc nhở vi phạm
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          In sổ theo dõi
        </button>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          {/* Class Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Lớp:</span>
            <select
              value={currentClassId}
              onChange={(e) => {
                setCurrentClassId(e.target.value);
                setSelectedStudentId('');
              }}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-indigo-900"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Lớp {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Student Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Học sinh:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 max-w-xs"
            >
              {classStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentCode})
                </option>
              ))}
            </select>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Tuần:</span>
            <select
              value={currentPeriodId}
              onChange={(e) => setCurrentPeriodId(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
            >
              <option value="all">Tất cả các tuần</option>
              {periods.map((p) => (
                <option key={p.MaKy} value={p.MaKy}>
                  Tuần {p.TuanSo} ({p.MaKy})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 animate-pulse text-xs">
          Đang tải thông tin sổ theo dõi học sinh...
        </div>
      ) : !studentLogData ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          Không tìm thấy dữ liệu học sinh
        </div>
      ) : (
        <div className="space-y-6">
          {/* Student Profile & Emulation Stats Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white text-2xl font-black flex items-center justify-center shadow-md shadow-indigo-100">
                {studentLogData.student.fullName.split(' ').pop()?.charAt(0) || 'H'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">{studentLogData.student.fullName}</h3>
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 font-mono">
                    {studentLogData.student.studentCode}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Lớp: <strong className="text-slate-700">{studentLogData.student.className}</strong> • Phân tổ: <strong className="text-indigo-700">{studentLogData.group}</strong>
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center min-w-[90px]">
                <span className="text-[10px] font-bold uppercase text-emerald-700 block">Khen thưởng</span>
                <span className="text-lg font-black text-emerald-800">+{studentLogData.totalPositive}</span>
                <span className="text-[10px] text-emerald-600 block">{studentLogData.meritCount} lượt</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center min-w-[90px]">
                <span className="text-[10px] font-bold uppercase text-rose-700 block">Vi phạm</span>
                <span className="text-lg font-black text-rose-800">{studentLogData.totalNegative}</span>
                <span className="text-[10px] text-rose-600 block">{studentLogData.violationCount} lượt</span>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-center min-w-[90px]">
                <span className="text-[10px] font-bold uppercase text-indigo-700 block">Điểm ròng</span>
                <span className={`text-lg font-black ${studentLogData.netScore >= 0 ? 'text-indigo-800' : 'text-rose-800'}`}>
                  {studentLogData.netScore > 0 ? `+${studentLogData.netScore}` : studentLogData.netScore}
                </span>
                <span className="text-[10px] text-indigo-600 block">Tổng kết</span>
              </div>
            </div>
          </div>

          {/* Detailed Timeline Events */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">
                Nhật ký sự việc chi tiết ({studentLogData.records.length} sự kiện)
              </h4>
              <span className="text-xs text-slate-500">Sắp xếp theo ngày giảm dần</span>
            </div>

            {studentLogData.records.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Học sinh chưa có ghi nhận thi đua nào trong kỳ này
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {studentLogData.records.map((r: any) => {
                  const isPositive = r.Diem > 0;
                  const isValid = r.TrangThai === 'HIEU_LUC';

                  return (
                    <div 
                      key={r.MaGhiNhan} 
                      className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors ${!isValid ? 'opacity-50 line-through-text bg-slate-50/50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">{r.TenLoi}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600">
                              {r.MaKy}
                            </span>
                            {!isValid && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                Đã hủy
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            {r.GhiChu || 'Không có ghi chú bổ sung'}
                          </p>
                          {r.LyDoSuaHuy && (
                            <p className="text-[11px] text-rose-600 mt-0.5">
                              Lý do hủy: {r.LyDoSuaHuy} (bởi {r.NguoiSua})
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                            <span>Ngày: {new Date(r.Ngay).toLocaleDateString('vi-VN')}</span>
                            <span>• Người ghi: {r.NguoiGhiNhan}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right sm:self-center shrink-0">
                        <span className={`text-base font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isPositive ? `+${r.Diem}` : `${r.Diem}`} điểm
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
