import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Printer, 
  Download, 
  FolderSync, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  Crown, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Classroom, EmulationPeriod } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../components/Toast.tsx';

interface EmulationReportsProps {
  classes: Classroom[];
  periods: EmulationPeriod[];
  selectedClassId: string;
  selectedPeriodId: string;
}

export const EmulationReports: React.FC<EmulationReportsProps> = ({
  classes,
  periods,
  selectedClassId,
  selectedPeriodId
}) => {
  const { success, error, warning } = useToast();

  const [currentClassId, setCurrentClassId] = useState<string>(selectedClassId || classes[0]?.id || '');
  const [currentPeriodId, setCurrentPeriodId] = useState<string>(selectedPeriodId || periods[0]?.MaKy || '');
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportingDrive, setExportingDrive] = useState(false);

  useEffect(() => {
    if (!currentClassId || !currentPeriodId) return;
    loadReport(currentClassId, currentPeriodId);
  }, [currentClassId, currentPeriodId]);

  const loadReport = async (clsId: string, pId: string) => {
    try {
      setLoading(true);
      const data = await api.getEmulationReport(clsId, pId);
      setReportData(data);
    } catch (err: any) {
      error(err.message || 'Lỗi khi tải báo cáo thi đua');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportDrive = () => {
    // As per prompt:
    // "Chỉ báo xuất thành công khi tệp đã được tạo thật và có thể truy cập theo quyền được cấp."
    // Explain clearly that Google Drive OAuth is staged and prompt user to print/download or connect Drive.
    warning('Tài khoản Google Drive hiện chưa liên kết OAuth thực tế. Báo cáo đã được tạo sẵn sàng để in hoặc tải file.');
  };

  const currentClass = classes.find(c => c.id === currentClassId);
  const currentPeriod = periods.find(p => p.MaKy === currentPeriodId);

  return (
    <div className="space-y-6">
      {/* Header & Print Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Báo cáo Thi đua & Vi phạm Học sinh Hằng tuần</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Báo cáo tổng hợp số liệu thi đua, phổ điểm tổ và phân tích các tiêu chí vi phạm trọng điểm
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportDrive}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors cursor-pointer"
          >
            <FolderSync className="w-4 h-4 text-sky-600" />
            Lưu báo cáo vào Google Drive
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-200 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            In báo cáo tuần
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Lớp báo cáo:</span>
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
            <span className="text-xs font-bold text-slate-600">Tuần báo cáo:</span>
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

        <div className="text-xs text-slate-500 font-medium">
          Thời gian: <strong>{currentPeriod ? `${new Date(currentPeriod.TuNgay).toLocaleDateString('vi-VN')} - ${new Date(currentPeriod.DenNgay).toLocaleDateString('vi-VN')}` : ''}</strong>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 animate-pulse text-xs">
          Đang tính toán dữ liệu báo cáo thi đua...
        </div>
      ) : !reportData ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          Không tìm thấy dữ liệu báo cáo
        </div>
      ) : (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-8 print:border-none print:shadow-none print:p-0">
          {/* Official School Header */}
          <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                TRƯỜNG THPT CHUYÊN NGUYỄN HUỆ
              </p>
              <h1 className="text-xl font-black text-slate-900 mt-0.5">
                BÁO CÁO TỔNG KẾT THI ĐUA TUẦN {currentPeriod?.TuanSo}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Lớp: <strong>{currentClass?.name}</strong> • GVCN: <strong>{currentClass?.homeroomTeacher}</strong>
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-500">
              <p>Mã kỳ: <strong className="font-mono text-slate-800">{currentPeriod?.MaKy}</strong></p>
              <p>Tuần lễ: {new Date(currentPeriod?.TuNgay || '').toLocaleDateString('vi-VN')} - {new Date(currentPeriod?.DenNgay || '').toLocaleDateString('vi-VN')}</p>
              <p>Ngày in: {new Date().toLocaleDateString('vi-VN')}</p>
            </div>
          </div>

          {/* Section 1: Overview Highlights */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              1. Thống kê chung về thi đua trong tuần
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-500 block uppercase">Sĩ số tham gia</span>
                <span className="text-2xl font-black text-slate-900">{reportData.studentRankings.length}</span>
                <span className="text-[11px] text-slate-400 block">học sinh</span>
              </div>
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <span className="text-[11px] font-bold text-emerald-700 block uppercase">Lượt khen thưởng</span>
                <span className="text-2xl font-black text-emerald-800">{reportData.totalMerits}</span>
                <span className="text-[11px] text-emerald-600 block">thành tích tốt</span>
              </div>
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-center">
                <span className="text-[11px] font-bold text-rose-700 block uppercase">Lượt vi phạm</span>
                <span className="text-2xl font-black text-rose-800">{reportData.totalViolations}</span>
                <span className="text-[11px] text-rose-600 block">bị trừ điểm</span>
              </div>
              <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-200 text-center">
                <span className="text-[11px] font-bold text-indigo-700 block uppercase">Tổ dẫn đầu</span>
                <span className="text-lg font-black text-indigo-900 truncate block">
                  {reportData.groupRankings[0]?.TenTo || '--'}
                </span>
                <span className="text-[11px] text-indigo-600 block">
                  ĐBQ: {reportData.groupRankings[0]?.DiemBinhQuan || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Group Rankings */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800 mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              2. Kết quả Xếp hạng Thi đua các Tổ
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                    <th className="p-2.5 text-center w-14">Thứ hạng</th>
                    <th className="p-2.5">Tên tổ</th>
                    <th className="p-2.5 text-center">Số thành viên</th>
                    <th className="p-2.5 text-center">Tổng điểm cộng (+)</th>
                    <th className="p-2.5 text-center">Tổng điểm trừ (-)</th>
                    <th className="p-2.5 text-center">Tổng điểm tổ</th>
                    <th className="p-2.5 text-center font-bold">Điểm bình quân</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.groupRankings.map((g: any) => (
                    <tr key={g.MaTo} className="hover:bg-slate-50/60">
                      <td className="p-2.5 text-center font-black">#{g.XepHang}</td>
                      <td className="p-2.5 font-bold text-slate-900">{g.TenTo}</td>
                      <td className="p-2.5 text-center">{g.SoThanhVien}</td>
                      <td className="p-2.5 text-center text-emerald-700 font-bold">+{g.TongDiemCong}</td>
                      <td className="p-2.5 text-center text-rose-700 font-bold">{g.TongDiemTru}</td>
                      <td className="p-2.5 text-center font-bold text-slate-900">{g.TongDiem}</td>
                      <td className="p-2.5 text-center font-black text-indigo-700 text-sm">{g.DiemBinhQuan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Infraction Categories Breakdown */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              3. Thống kê theo Danh mục Vi phạm & Thành tích
            </h3>
            {reportData.categoryStats.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Không có ghi nhận vi phạm hay thành tích nào trong tuần này.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {reportData.categoryStats.map((cs: any) => {
                  const isPos = cs.Loai === 'CONG';
                  return (
                    <div key={cs.MaLoi} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">{cs.TenLoi}</span>
                        <span className="text-[11px] text-slate-400">
                          {isPos ? 'Khen thưởng' : 'Vi phạm'} • {cs.count} lượt ghi nhận
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`font-black text-sm ${isPos ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {cs.totalPoints > 0 ? `+${cs.totalPoints}` : cs.totalPoints} đ
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="pt-8 border-t border-slate-200 flex justify-between text-xs text-slate-600">
            <div className="text-center w-48">
              <p className="font-bold">LỚP TRƯỞNG</p>
              <p className="text-[11px] text-slate-400 mt-0.5">(Ký và ghi rõ họ tên)</p>
              <div className="h-14" />
              <p className="font-bold text-slate-800">Ban Cán Sự Lớp</p>
            </div>

            <div className="text-center w-48">
              <p className="font-bold">GIÁO VIÊN CHỦ NHIỆM</p>
              <p className="text-[11px] text-slate-400 mt-0.5">(Ký và duyệt sổ)</p>
              <div className="h-14" />
              <p className="font-bold text-slate-800">{currentClass?.homeroomTeacher || 'Nguyễn Văn Nam'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
