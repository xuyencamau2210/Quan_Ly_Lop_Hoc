import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Printer, 
  FileSpreadsheet, 
  Users, 
  CalendarCheck, 
  Trophy, 
  School,
  Download,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { Classroom, Student, DashboardStats, AppSettings } from '../types/index.ts';
import { api } from '../services/api.ts';

interface ReportsViewProps {
  classes: Classroom[];
  students: Student[];
  stats: DashboardStats | null;
  settings: AppSettings | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  classes,
  students,
  stats,
  settings
}) => {
  const [reportDate] = useState<string>(new Date().toLocaleDateString('vi-VN'));

  const totalStudents = students.length;
  const maleCount = students.filter(s => s.gender === 'male').length;
  const femaleCount = students.filter(s => s.gender === 'female').length;
  const malePct = totalStudents > 0 ? Math.round((maleCount / totalStudents) * 100) : 0;
  const femalePct = totalStudents > 0 ? Math.round((femaleCount / totalStudents) * 100) : 0;

  const rankDist = stats?.academicRankDistribution || {
    excellent: 0,
    good: 0,
    fair: 0,
    average: 0,
    weak: 0
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Báo cáo & Thống kê Tổng hợp</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Báo cáo toàn diện về sĩ số, tỷ lệ chuyên cần và nề nếp thi đua học sinh
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => api.downloadExcel()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-200 transition-all cursor-pointer"
            title="Tải toàn bộ cơ sở dữ liệu ứng dụng dưới dạng file Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Xuất file Excel (.xlsx)
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-200 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            In báo cáo tổng hợp
          </button>
        </div>
      </div>

      {/* Printable Report Sheet */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-8 print:border-none print:shadow-none print:p-0">
        {/* School Header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">
              {settings?.schoolName || 'TRƯỜNG THPT CHUYÊN NGUYỄN HUỆ'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hội đồng Sư phạm • Năm học {settings?.academicYear || '2025 - 2026'}
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-500">
            <p className="font-semibold text-slate-800">BÁO CÁO TỔNG HỢP GIÁO DỤC</p>
            <p>Học kỳ: {settings?.currentSemester || 'Học kỳ 1'}</p>
            <p>Ngày lập: {reportDate}</p>
          </div>
        </div>

        {/* 1. Sĩ số & Giới tính */}
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-indigo-600" />
            1. Thống kê Sĩ số và Cơ cấu Giới tính
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-medium block">Tổng số học sinh toàn trường</span>
              <span className="text-2xl font-black text-slate-900">{totalStudents}</span>
              <span className="text-xs text-slate-500 block mt-1">trên tổng số {classes.length} lớp học</span>
            </div>
            <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200">
              <span className="text-xs text-sky-800 font-medium block">Học sinh Nam</span>
              <span className="text-2xl font-black text-sky-900">{maleCount} ({malePct}%)</span>
              <div className="w-full bg-sky-200 rounded-full h-1.5 mt-2">
                <div className="bg-sky-600 h-1.5 rounded-full" style={{ width: `${malePct}%` }} />
              </div>
            </div>
            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
              <span className="text-xs text-rose-800 font-medium block">Học sinh Nữ</span>
              <span className="text-2xl font-black text-rose-900">{femaleCount} ({femalePct}%)</span>
              <div className="w-full bg-rose-200 rounded-full h-1.5 mt-2">
                <div className="bg-rose-600 h-1.5 rounded-full" style={{ width: `${femalePct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Bảng tổng hợp các lớp */}
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-3">
            <School className="w-5 h-5 text-indigo-600" />
            2. Thống kê Chi tiết theo Từng Lớp học
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                  <th className="p-3">Lớp học</th>
                  <th className="p-3">Khối</th>
                  <th className="p-3">GV Chủ nhiệm</th>
                  <th className="p-3">Phòng học</th>
                  <th className="p-3 text-center">Sĩ số</th>
                  <th className="p-3 text-center">Tối đa</th>
                  <th className="p-3 text-center">Tỷ lệ lấp đầy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classes.map((cls) => {
                  const cnt = cls.studentCount || 0;
                  const pct = Math.round((cnt / cls.maxStudents) * 100);
                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-bold text-slate-900">Lớp {cls.name}</td>
                      <td className="p-3">Khối {cls.grade}</td>
                      <td className="p-3 font-medium text-slate-800">{cls.homeroomTeacher}</td>
                      <td className="p-3 text-slate-600">{cls.room}</td>
                      <td className="p-3 text-center font-bold text-indigo-700">{cnt}</td>
                      <td className="p-3 text-center text-slate-500">{cls.maxStudents}</td>
                      <td className="p-3 text-center">
                        <span className="font-semibold text-slate-700">{pct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Chuyên cần & Học lực */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chuyên cần */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              3. Thống kê Chuyên cần hôm nay
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Tỷ lệ có mặt:</span>
                <span className="font-bold text-emerald-700">{stats?.todayAttendance.attendanceRate || 98}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Số lượng có mặt:</span>
                <span className="font-bold text-slate-800">{stats?.todayAttendance.presentCount || 0} học sinh</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Vắng có phép:</span>
                <span className="font-bold text-amber-700">{stats?.todayAttendance.excusedCount || 0} học sinh</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Vắng không phép:</span>
                <span className="font-bold text-rose-700">{stats?.todayAttendance.absentCount || 0} học sinh</span>
              </div>
            </div>
          </div>

          {/* 4. Thi đua & Nề nếp tuần */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-amber-600" />
              4. Theo dõi Nề nếp & Thi đua Tuần
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Trạng thái kỳ thi đua:</span>
                <span className="font-bold text-emerald-700">Đang hoạt động (Kỳ tuần hiện tại)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Điểm chuẩn xuất phát:</span>
                <span className="font-bold text-slate-800">100 điểm / tuần</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Hình thức đánh giá:</span>
                <span className="font-bold text-indigo-700">Theo tổ học sinh & cá nhân</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Quy chế thi đua:</span>
                <span className="font-bold text-slate-800">Cộng điểm thành tích, trừ lỗi vi phạm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Signature */}
        <div className="pt-8 border-t border-slate-200 flex justify-between text-xs text-slate-600">
          <div className="text-center w-48">
            <p className="font-bold">GIÁO VIÊN LẬP BÁO CÁO</p>
            <p className="text-[11px] text-slate-400 mt-1">(Ký và ghi rõ họ tên)</p>
            <div className="h-16" />
            <p className="font-bold text-slate-800">{settings?.teacherName || 'Nguyễn Văn Nam'}</p>
          </div>

          <div className="text-center w-48">
            <p className="font-bold">HIỆU TRƯỞNG DUYỆT</p>
            <p className="text-[11px] text-slate-400 mt-1">(Ký và đóng dấu)</p>
            <div className="h-16" />
            <p className="font-bold text-slate-800">Ban Giám Hiệu</p>
          </div>
        </div>
      </div>
    </div>
  );
};
