import React from 'react';
import { 
  School, 
  Users, 
  CheckCircle2, 
  Award, 
  Trophy,
  ArrowRight, 
  CalendarCheck, 
  FileText, 
  PlusCircle, 
  TrendingUp, 
  Server, 
  Database,
  Clock,
  Sparkles,
  LayoutGrid
} from 'lucide-react';
import { DashboardStats, Classroom } from '../types/index.ts';
import { NavTab } from '../components/Sidebar.tsx';

interface DashboardViewProps {
  stats: DashboardStats | null;
  classes: Classroom[];
  loading: boolean;
  onNavigate: (tab: NavTab) => void;
  onQuickAttendance: (classId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  classes,
  loading,
  onNavigate,
  onQuickAttendance
}) => {
  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const today = stats?.todayAttendance;
  const rankDist = stats?.academicRankDistribution || { excellent: 0, good: 0, fair: 0, average: 0, weak: 0 };
  const totalRanked = Object.values(rankDist).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Welcome & Data Architecture Notice Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-indigo-100 mb-3 border border-white/20">
            <Server className="w-3.5 h-3.5 text-emerald-300" />
            <span>Hệ thống Quản lý Dữ liệu Thực tế (Full-stack Server REST API)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Chào mừng đến với QUẢN LÝ LỚP HỌC
          </h1>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
            Hệ thống quản lý lớp học toàn diện: quản lý hồ sơ học sinh, điểm danh theo ngày, theo dõi thi đua - vi phạm tuần và liên kết tài liệu Google Drive. Mọi thay đổi được lưu trực tiếp lên cơ sở dữ liệu máy chủ.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('emulation')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-slate-900" />
              Thi đua tuần
            </button>
            <button
              onClick={() => onNavigate('organization')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
            >
              <LayoutGrid className="w-4 h-4 text-slate-900" />
              Tổ chức & Sơ đồ
            </button>
            <button
              onClick={() => onNavigate('attendance')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-700 font-bold text-xs sm:text-sm hover:bg-indigo-50 shadow-sm transition-all cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              Điểm danh hôm nay
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-800/80 hover:bg-indigo-800 text-white font-semibold text-xs sm:text-sm border border-indigo-400/30 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Báo cáo tổng hợp
            </button>
            <button
              onClick={() => onNavigate('students')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-800/80 hover:bg-indigo-800 text-white font-semibold text-xs sm:text-sm border border-indigo-400/30 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              Quản lý học sinh
            </button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Classes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng số lớp</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <School className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats?.totalClasses || 0}</span>
            <span className="text-xs text-slate-500">lớp đang hoạt động</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Khối 10, 11, 12</span>
            <button
              onClick={() => onNavigate('classes')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Xem lớp <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng học sinh</span>
            <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats?.totalStudents || 0}</span>
            <span className="text-xs text-slate-500">học sinh toàn trường</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-emerald-600 font-medium">100% hồ sơ đầy đủ</span>
            <button
              onClick={() => onNavigate('students')}
              className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1"
            >
              Danh sách <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: Attendance Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Chuyên cần hôm nay</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {today ? `${today.attendanceRate}%` : '98%'}
            </span>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              {today?.presentCount || 0} có mặt
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Vắng phép: {today?.excusedCount || 0} • Không phép: {today?.absentCount || 0}</span>
            <button
              onClick={() => onNavigate('attendance')}
              className="font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Chi tiết
            </button>
          </div>
        </div>

        {/* Card 4: Emulation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Thi đua tuần này</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">100</span>
            <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
              Điểm chuẩn đầu tuần
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Theo dõi nề nếp</span>
            <button
              onClick={() => onNavigate('emulation')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
            >
              Sổ thi đua <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Class Status Cards & Academic Classification */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Class Overview Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Tình hình các lớp học</h2>
              <p className="text-xs text-slate-500">Sĩ số, giáo viên chủ nhiệm và phòng học</p>
            </div>
            <button
              onClick={() => onNavigate('classes')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Xem tất cả ({classes.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {classes.map((cls) => {
              const summary = stats?.classSummaries.find(c => c.id === cls.id);
              const studentCount = cls.studentCount || 0;
              const percentCapacity = Math.round((studentCount / cls.maxStudents) * 100);

              return (
                <div 
                  key={cls.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-extrabold text-slate-900">Lớp {cls.name}</span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700">
                            Khối {cls.grade}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">GVCN: {cls.homeroomTeacher}</p>
                      </div>
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {cls.room}
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500">Sĩ số hiện tại:</span>
                        <span className="font-bold text-slate-800">
                          {studentCount} / {cls.maxStudents} học sinh
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(percentCapacity, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onQuickAttendance(cls.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      Điểm danh lớp
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('emulation')}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      Thi đua
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Academic Classification & Recent Activities */}
        <div className="space-y-6">
          {/* Classification Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Phân loại học lực</h3>
              <span className="text-xs text-slate-400">HK1</span>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Xuất sắc (9.0 - 10)', count: rankDist.excellent, color: 'bg-indigo-500', text: 'text-indigo-600' },
                { label: 'Giỏi (8.0 - 8.9)', count: rankDist.good, color: 'bg-emerald-500', text: 'text-emerald-600' },
                { label: 'Khá (6.5 - 7.9)', count: rankDist.fair, color: 'bg-sky-500', text: 'text-sky-600' },
                { label: 'Trung bình (5.0 - 6.4)', count: rankDist.average, color: 'bg-amber-500', text: 'text-amber-600' },
                { label: 'Yếu / Cần cố gắng (< 5.0)', count: rankDist.weak, color: 'bg-rose-500', text: 'text-rose-600' }
              ].map((item, idx) => {
                const pct = Math.round((item.count / totalRanked) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">{item.label}</span>
                      <span className="font-bold text-slate-800">{item.count} em ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`${item.color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activities list */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Hoạt động gần đây</h3>
            <div className="space-y-3">
              {(stats?.recentActivities || []).map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{act.title}</p>
                    <span className="text-[11px] text-slate-400">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
