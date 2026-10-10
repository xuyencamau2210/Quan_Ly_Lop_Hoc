import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  X, 
  Layers, 
  Users, 
  Crown, 
  Grid, 
  Trophy, 
  Calendar, 
  CalendarCheck, 
  Info,
  ExternalLink,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Classroom } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useToast } from './Toast.tsx';

interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: Classroom[];
  defaultClassId?: string;
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  classes,
  defaultClassId
}) => {
  const { success, error } = useToast();
  const [selectedClassId, setSelectedClassId] = useState<string>(defaultClassId || 'all');
  const [summary, setSummary] = useState<any | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSummary();
    }
  }, [isOpen, selectedClassId]);

  const loadSummary = async () => {
    try {
      setLoadingSummary(true);
      const data = await api.getExcelExportSummary(selectedClassId === 'all' ? undefined : selectedClassId);
      setSummary(data);
    } catch (err: any) {
      console.error('Error fetching excel summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  if (!isOpen) return null;

  const handleDownload = () => {
    try {
      setDownloading(true);
      api.downloadExcel(selectedClassId === 'all' ? undefined : selectedClassId);
      success('Đang tải file Excel về máy của bạn!');
      setTimeout(() => {
        setDownloading(false);
      }, 1500);
    } catch (err: any) {
      setDownloading(false);
      error(err.message || 'Lỗi khi tải file Excel');
    }
  };

  const sheetsInfo = [
    { name: 'LopHoc', label: 'Lớp học', icon: Layers, desc: 'Danh sách lớp, phòng học, GVCN, sĩ số' },
    { name: 'HocSinh', label: 'Học sinh', icon: Users, desc: 'Thông tin cá nhân, phụ huynh, SĐT, địa chỉ' },
    { name: 'BanCanSu', label: 'Ban cán sự lớp', icon: Crown, desc: 'Lớp trưởng, các lớp phó, thủ quỹ, nhiệm vụ' },
    { name: 'SoDoChoNgoi', label: 'Sơ đồ chỗ ngồi', icon: Grid, desc: 'Vị trí ghế 4 dãy x 5 hàng bàn, mã HS' },
    { name: 'ToThiDua', label: 'Tổ & Phân tổ', icon: Users, desc: 'Danh sách tổ thi đua và thành viên' },
    { name: 'TuanThiDua', label: 'Tuần thi đua', icon: Calendar, desc: 'Lịch trình tuần bắt đầu từ 07/09/2026' },
    { name: 'DanhMucThiDua', label: 'Nội quy thi đua', icon: Trophy, desc: 'Thang điểm cộng/trừ, tiêu chí nề nếp' },
    { name: 'LichSuThiDua', label: 'Lịch sử ghi nhận', icon: Trophy, desc: 'Nhật ký thi đua, khen thưởng & vi phạm' },
    { name: 'TongKetTuan', label: 'Tổng kết tuần', icon: Trophy, desc: 'Bảng điểm tổng kết, xếp hạng thi đua tuần' },
    { name: 'DiemDanh', label: 'Điểm danh', icon: CalendarCheck, desc: 'Nhật ký chuyên cần, phép/không phép' },
    { name: 'ThongTinHeThong', label: 'Cấu hình hệ thống', icon: Info, desc: 'Thông tin trường, năm học 2026-2027, GVCN' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-xs">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Xuất File Excel (.xlsx) Dữ Liệu Ứng Dụng</h3>
              <p className="text-xs text-emerald-100">
                Lưu trữ toàn bộ dữ liệu quản lý lớp học vào tệp Microsoft Excel chuẩn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Class Filter Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="text-xs font-bold text-slate-800 block">
                Phạm vi xuất dữ liệu:
              </label>
              <p className="text-[11px] text-slate-500">
                Chọn xuất toàn bộ trường hoặc riêng một lớp học
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">Toàn bộ hệ thống (Tất cả các lớp)</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    Chỉ riêng lớp {c.name} ({c.academicYear})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Excel File Specs Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Định dạng</span>
              <span className="text-sm font-extrabold text-emerald-950">.XLSX</span>
            </div>
            <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">Số bảng (Sheets)</span>
              <span className="text-sm font-extrabold text-teal-950">11 Bảng</span>
            </div>
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Bộ mã</span>
              <span className="text-sm font-extrabold text-blue-950">Unicode UTF-8</span>
            </div>
            <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">Tương thích</span>
              <span className="text-sm font-extrabold text-purple-950">Excel / Sheets</span>
            </div>
          </div>

          {/* Sheets List in Workbook */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
              <span>Các Sheet dữ liệu được đóng gói trong file:</span>
              <span className="text-emerald-700 lowercase font-semibold text-[11px]">Đầy đủ 11 bảng</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sheetsInfo.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <div 
                    key={s.name}
                    className="p-2.5 rounded-xl border border-slate-200/90 bg-white hover:border-emerald-300 transition-colors flex items-start gap-2.5"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-800">{idx + 1}. {s.label}</span>
                        <code className="text-[10px] text-emerald-700 font-mono bg-emerald-50 px-1 rounded-sm">
                          {s.name}
                        </code>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Note Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">
                File Excel lưu trữ độc lập và an toàn:
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Bạn có thể mở tệp này bằng Microsoft Excel, Google Sheets, LibreOffice Calc hoặc tải lên Google Drive của bạn để lưu trữ lâu dài và báo cáo nhà trường.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Tên tệp dự kiến: <strong className="text-slate-800 font-mono">Du_Lieu_Quan_Ly_Lop_Hoc_2026_2027.xlsx</strong>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang tải xuống...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Tải file Excel ngay (.xlsx)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
