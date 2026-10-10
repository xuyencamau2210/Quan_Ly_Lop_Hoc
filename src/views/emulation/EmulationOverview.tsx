import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Award, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Crown, 
  Calendar, 
  ArrowRight, 
  PlusCircle, 
  ShieldCheck, 
  Lock,
  Clock,
  Sparkles
} from 'lucide-react';
import { Classroom, Student, EmulationPeriod, EmulationRecord } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../components/Toast.tsx';

interface EmulationOverviewProps {
  classes: Classroom[];
  periods: EmulationPeriod[];
  records: EmulationRecord[];
  selectedClassId: string;
  selectedPeriodId: string;
  onNavigateSubScreen: (screenId: string) => void;
}

export const EmulationOverview: React.FC<EmulationOverviewProps> = ({
  classes,
  periods,
  records,
  selectedClassId,
  selectedPeriodId,
  onNavigateSubScreen
}) => {
  const { error } = useToast();

  const [currentClassId, setCurrentClassId] = useState<string>(selectedClassId || classes[0]?.id || '');
  const [currentPeriodId, setCurrentPeriodId] = useState<string>(selectedPeriodId || periods[0]?.MaKy || '');
  const [studentSummaries, setStudentSummaries] = useState<any[]>([]);
  const [groupSummaries, setGroupSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentClassId || !currentPeriodId) return;
    loadOverviewData(currentClassId, currentPeriodId);
  }, [currentClassId, currentPeriodId]);

  const loadOverviewData = async (clsId: string, pId: string) => {
    try {
      setLoading(true);
      const [stu, grp] = await Promise.all([
        api.calculateStudentWeeklyScores(clsId, pId),
        api.calculateGroupWeeklyScores(clsId, pId)
      ]);
      setStudentSummaries(stu);
      setGroupSummaries(grp);
    } catch (err: any) {
      error(err.message || 'Lỗi khi tải tổng quan thi đua');
    } finally {
      setLoading(false);
    }
  };

  const activePeriod = periods.find(p => p.MaKy === currentPeriodId);
  const currentClass = classes.find(c => c.id === currentClassId);

  // Filter records for this class & period
  const periodRecords = records.filter(r => 
    r.MaLop === currentClassId && 
    r.MaKy === currentPeriodId && 
    r.TrangThai === 'HIEU_LUC'
  );

  const totalMerits = periodRecords.filter(r => r.Diem > 0).length;
  const totalViolations = periodRecords.filter(r => r.Diem < 0).length;

  const topStudents = [...studentSummaries].filter(s => s.DiemCuoiTuan > 0).slice(0, 3);
  const attentionStudents = [...studentSummaries].filter(s => s.SoViPham > 0).sort((a, b) => b.SoViPham - a.SoViPham).slice(0, 3);
  const topGroup = groupSummaries[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner for Emulation */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 p-6 sm:p-7 text-white shadow-md">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-teal-100 mb-3 border border-white/20">
            <Trophy className="w-3.5 h-3.5 text-teal-300" />
            <span>Phân hệ Thi đua & Vi phạm Học sinh Hằng tuần</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Phong trào Thi đua Lớp {currentClass?.name}
          </h2>
          <p className="mt-2 text-teal-50/90 text-xs sm:text-sm leading-relaxed">
            Theo dõi nề nếp kỷ cương, tuyên dương hành vi việc tốt, xếp hạng các tổ theo điểm bình quân và tổng kết khóa sổ tuần công bằng, minh bạch.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateSubScreen('records')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-teal-900 font-bold text-xs hover:bg-teal-50 shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-teal-700" />
              Ghi nhận sự việc mới
            </button>
            <button
              onClick={() => onNavigateSubScreen('group-ranking')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-900/60 hover:bg-teal-900/90 text-white font-semibold text-xs border border-white/20 transition-all cursor-pointer"
            >
              <Crown className="w-4 h-4 text-teal-200" />
              Bảng xếp hạng tổ
            </button>
            <button
              onClick={() => onNavigateSubScreen('weekly-summary')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-900/60 hover:bg-teal-900/90 text-white font-semibold text-xs border border-white/20 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              Tổng kết & Khóa sổ
            </button>
          </div>
        </div>

        {/* Background shape */}
        <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Lớp:</span>
            <select
              value={currentClassId}
              onChange={(e) => setCurrentClassId(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-indigo-900"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Lớp {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Tuần thi đua:</span>
            <select
              value={currentPeriodId}
              onChange={(e) => setCurrentPeriodId(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
            >
              {periods.map((p) => (
                <option key={p.MaKy} value={p.MaKy}>
                  Tuần {p.TuanSo} ({p.MaKy}) {p.TrangThai === 'DA_KHOA' ? '[Đã khóa]' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold ${
            activePeriod?.TrangThai === 'DA_KHOA'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {activePeriod?.TrangThai === 'DA_KHOA' ? <Lock className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            {activePeriod?.TrangThai === 'DA_KHOA' ? 'Tuần đã khóa sổ' : 'Tuần đang diễn ra'}
          </span>
        </div>
      </div>

      {/* 4 Primary Emulation Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổ Dẫn Đầu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổ dẫn đầu tuần</span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
              <Crown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 block truncate">
              {topGroup?.TenTo || 'Chưa xếp hạng'}
            </span>
            <span className="text-xs text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded-md inline-block mt-1">
              Điểm BQ: {topGroup?.DiemBinhQuan || 0} đ
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">{topGroup?.SoThanhVien || 0} thành viên</span>
            <button
              onClick={() => onNavigateSubScreen('group-ranking')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              Chi tiết <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Lượt Khen Thưởng */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Lượt khen thưởng</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700">+{totalMerits}</span>
            <span className="text-xs text-slate-500">lượt được cộng điểm</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-emerald-600 font-medium">Học tập & việc tốt</span>
            <button
              onClick={() => onNavigateSubScreen('records')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Xem sổ <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: Lượt Vi Phạm */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Lượt vi phạm</span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-700">-{totalViolations}</span>
            <span className="text-xs text-slate-500">lần bị trừ điểm nề nếp</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-rose-600 font-medium">Muộn, BTVN, đồng phục</span>
            <button
              onClick={() => onNavigateSubScreen('records')}
              className="text-xs font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1"
            >
              Chi tiết <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 4: Sĩ Số Học Sinh */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sĩ số theo dõi</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{studentSummaries.length}</span>
            <span className="text-xs text-slate-500">học sinh đã phân tổ</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-indigo-600 font-medium">4 tổ thi đua</span>
            <button
              onClick={() => onNavigateSubScreen('student-log')}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 flex items-center gap-1"
            >
              Sổ cá nhân <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Top Achievers & Attention Needed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Top Học Sinh Xuất Sắc */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">Biểu dương Học sinh Tiêu biểu tuần</h3>
            </div>
            <button
              onClick={() => onNavigateSubScreen('weekly-summary')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Xem tất cả
            </button>
          </div>

          {topStudents.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Chưa có học sinh nào đạt điểm cộng tuần này</p>
          ) : (
            <div className="space-y-3">
              {topStudents.map((st, idx) => (
                <div key={st.MaHS} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-black text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{st.TenHS}</p>
                      <p className="text-[11px] text-slate-400">{st.TenTo} • {st.SoThanhTich} khen thưởng</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-700">+{st.DiemCuoiTuan} đ</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Học Sinh Cần Lưu Ý */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-800">Học sinh cần đôn đốc nề nếp</h3>
            </div>
            <span className="text-[11px] text-slate-400">Nhiều vi phạm nhất</span>
          </div>

          {attentionStudents.length === 0 ? (
            <p className="text-xs text-emerald-600 py-4 text-center font-medium">Tuyệt vời! Tuần này không có học sinh nào vi phạm.</p>
          ) : (
            <div className="space-y-3">
              {attentionStudents.map((st) => (
                <div key={st.MaHS} className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center">
                      !
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{st.TenHS}</p>
                      <p className="text-[11px] text-slate-500">{st.TenTo} • {st.SoViPham} lần vi phạm</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-rose-700">{st.DiemCuoiTuan} đ</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
