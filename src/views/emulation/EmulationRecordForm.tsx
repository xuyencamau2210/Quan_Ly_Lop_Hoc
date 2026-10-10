import React, { useState, useMemo } from 'react';
import { 
  PlusCircle, 
  Search, 
  Calendar, 
  User, 
  UserCheck,
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Trash2, 
  Edit3, 
  Filter, 
  Clock, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { 
  Classroom, Student, EmulationCategory, EmulationPeriod, EmulationRecord, EmulationType 
} from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../components/Toast.tsx';

interface EmulationRecordFormProps {
  classes: Classroom[];
  students: Student[];
  categories: EmulationCategory[];
  periods: EmulationPeriod[];
  records: EmulationRecord[];
  selectedClassId: string;
  selectedPeriodId: string;
  onRefresh: () => void;
}

export const EmulationRecordForm: React.FC<EmulationRecordFormProps> = ({
  classes,
  students,
  categories,
  periods,
  records,
  selectedClassId,
  selectedPeriodId,
  onRefresh
}) => {
  const { success, error, warning } = useToast();

  // Active form state
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formClassId, setFormClassId] = useState<string>(selectedClassId || classes[0]?.id || '');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.MaLoi || '');
  const [note, setNote] = useState<string>('');
  const [recorder, setRecorder] = useState<string>('Thầy Nguyễn Văn Nam (GVCN)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters for recent records list
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [recordSearch, setRecordSearch] = useState<string>('');

  // Cancel / Invalidate modal state
  const [cancelingRecord, setCancelingRecord] = useState<EmulationRecord | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelerName, setCancelerName] = useState<string>('Thầy Nguyễn Văn Nam (GVCN)');
  const [isCanceling, setIsCanceling] = useState(false);

  // Students of current chosen class
  const classStudents = useMemo(() => {
    return students.filter(s => s.classId === formClassId && s.status === 'active');
  }, [students, formClassId]);

  // Filtered student options matching search
  const filteredStudentOptions = useMemo(() => {
    if (!studentSearch.trim()) return classStudents;
    const q = studentSearch.toLowerCase();
    return classStudents.filter(s => 
      s.fullName.toLowerCase().includes(q) || 
      s.studentCode.toLowerCase().includes(q)
    );
  }, [classStudents, studentSearch]);

  // Active selected student info
  const activeStudent = useMemo(() => {
    return classStudents.find(s => s.id === selectedStudentId);
  }, [classStudents, selectedStudentId]);

  // Selected category info & preview points
  const activeCategory = useMemo(() => {
    return categories.find(c => c.MaLoi === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  const previewScore = useMemo(() => {
    if (!activeCategory) return 0;
    return activeCategory.Loai === 'CONG' ? activeCategory.Diem : -activeCategory.Diem;
  }, [activeCategory]);

  const handleClassChange = (newClassId: string) => {
    setFormClassId(newClassId);
    setSelectedStudentId('');
    setStudentSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      error('Vui lòng chọn học sinh được ghi nhận');
      return;
    }
    if (!selectedCategoryId) {
      error('Vui lòng chọn danh mục thi đua');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createEmulationRecord({
        Ngay: formDate,
        MaLop: formClassId,
        MaHS: selectedStudentId,
        MaLoi: selectedCategoryId,
        GhiChu: note,
        NguoiGhiNhan: recorder,
        MaKy: selectedPeriodId !== 'all' ? selectedPeriodId : undefined
      });

      const scoreText = res.Diem > 0 ? `+${res.Diem}` : `${res.Diem}`;
      success(`Đã ghi nhận "${res.TenLoi}" (${scoreText} điểm) cho học sinh ${res.TenHS}`);
      
      // Reset form fields
      setNote('');
      setSelectedStudentId('');
      setStudentSearch('');
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Lỗi khi ghi nhận thi đua');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCancelRecord = async () => {
    if (!cancelingRecord) return;
    if (!cancelReason.trim()) {
      warning('Vui lòng nhập lý do hủy bản ghi thi đua');
      return;
    }

    try {
      setIsCanceling(true);
      await api.updateEmulationRecord(cancelingRecord.MaGhiNhan, {
        TrangThai: 'DA_HUY',
        NguoiSua: cancelerName,
        LyDoSuaHuy: cancelReason
      });
      success(`Đã hủy bản ghi "${cancelingRecord.MaGhiNhan}" và lưu dấu vết kiểm toán`);
      setCancelingRecord(null);
      setCancelReason('');
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Lỗi khi hủy bản ghi');
    } finally {
      setIsCanceling(false);
    }
  };

  // Filtered record history list
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchType = filterType === 'all' || r.Loai === filterType;
      const matchStatus = filterStatus === 'all' || r.TrangThai === filterStatus;
      const q = recordSearch.toLowerCase().trim();
      const matchSearch = !q || 
        (r.TenHS && r.TenHS.toLowerCase().includes(q)) ||
        (r.TenLoi && r.TenLoi.toLowerCase().includes(q)) ||
        (r.GhiChu && r.GhiChu.toLowerCase().includes(q)) ||
        r.MaGhiNhan.toLowerCase().includes(q);

      return matchType && matchStatus && matchSearch;
    });
  }, [records, filterType, filterStatus, recordSearch]);

  return (
    <div className="space-y-6">
      {/* Top Creation Form Box */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Biểu mẫu Ghi nhận Thành tích & Vi phạm</h2>
            <p className="text-xs text-slate-500">
              Nhập hành vi khen thưởng hoặc trừ điểm vi phạm hàng ngày của học sinh
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Ngày xảy ra */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngày xảy ra sự việc <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Lớp học */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lớp học <span className="text-rose-500">*</span>
              </label>
              <select
                value={formClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full px-3 py-2 text-xs font-extrabold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-indigo-900"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Lớp {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn học sinh từ danh sách hiển thị trực quan */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Học sinh được ghi nhận <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  {classStudents.length} học sinh trong lớp
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Select list with all students directly visible and selectable */}
                <div className="flex-1 relative">
                  <select
                    required
                    value={selectedStudentId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedStudentId(id);
                      if (id) {
                        const st = classStudents.find(s => s.id === id);
                        if (st) setStudentSearch('');
                      }
                    }}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  >
                    <option value="">-- Bấm để chọn học sinh ({classStudents.length} học sinh) --</option>
                    {(studentSearch.trim() ? filteredStudentOptions : classStudents).map((st, idx) => (
                      <option key={st.id} value={st.id}>
                        {idx + 1}. {st.fullName} ({st.studentCode}) {st.gender ? `• ${st.gender}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional quick search / filter box */}
                <div className="relative w-full sm:w-44 shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Lọc tên / mã HS..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-8 pr-6 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  {studentSearch && (
                    <button
                      type="button"
                      onClick={() => setStudentSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      title="Xóa bộ lọc"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Thông tin học sinh đã chọn */}
              {activeStudent && (
                <div className="mt-1.5 flex items-center justify-between text-xs bg-indigo-50/80 border border-indigo-100 rounded-lg px-2.5 py-1 text-indigo-900 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Đang chọn: <strong>{activeStudent.fullName}</strong></span>
                    <span className="text-indigo-600 font-mono text-[11px]">({activeStudent.studentCode})</span>
                    {activeStudent.gender && (
                      <span className="text-[11px] text-slate-500">• {activeStudent.gender}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentId('');
                    }}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 underline font-medium cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Danh mục thi đua */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tiêu chí thi đua / Hành vi <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
              >
                {categories.filter(c => c.TrangThai === 'DANG_DUNG').map((cat) => (
                  <option key={cat.MaLoi} value={cat.MaLoi}>
                    [{cat.Loai === 'CONG' ? 'CỘNG +' : 'TRỪ -'}{cat.Diem}đ] {cat.TenLoi}
                  </option>
                ))}
              </select>
            </div>

            {/* Xem trước điểm cộng / trừ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Xem trước điểm tính tự động
              </label>
              <div className={`px-4 py-2 rounded-xl border text-sm font-black flex items-center justify-between ${
                previewScore > 0 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
                <span>{previewScore > 0 ? 'CỘNG THÀNH TÍCH' : 'TRỪ VI PHẠM'}</span>
                <span className="text-base font-extrabold">{previewScore > 0 ? `+${previewScore}` : `${previewScore}`} điểm</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Ghi chú */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chi tiết hoàn cảnh / Lý do cụ thể
              </label>
              <input
                type="text"
                placeholder="VD: Không hoàn thành bài 3, 4 SGK trang 45 môn Toán..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Người ghi nhận */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Người ghi nhận
              </label>
              <input
                type="text"
                value={recorder}
                onChange={(e) => setRecorder(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Form Submit Button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Lưu sự việc thi đua</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* History Log Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800">Lịch sử sự việc thi đua đã ghi nhận</h3>
            <p className="text-xs text-slate-500">Hiển thị {filteredRecords.length} bản ghi</p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm học sinh, nội dung..."
                value={recordSearch}
                onChange={(e) => setRecordSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="all">Tất cả loại (+/-)</option>
              <option value="CONG">Chỉ khen thưởng (+)</option>
              <option value="TRU">Chỉ vi phạm (-)</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="HIEU_LUC">Hiệu lực</option>
              <option value="DA_HUY">Đã hủy</option>
            </select>
          </div>
        </div>

        {/* Record Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              Chưa có bản ghi thi đua nào phù hợp với bộ lọc
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-3.5 w-24">Ngày</th>
                    <th className="py-3 px-3.5">Học sinh</th>
                    <th className="py-3 px-3.5">Tổ</th>
                    <th className="py-3 px-3.5">Nội dung hành vi</th>
                    <th className="py-3 px-3.5 text-center w-20">Điểm</th>
                    <th className="py-3 px-3.5">Ghi chú chi tiết</th>
                    <th className="py-3 px-3.5">Người ghi</th>
                    <th className="py-3 px-3.5 text-center w-24">Trạng thái</th>
                    <th className="py-3 px-3.5 text-right w-20">Hủy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((r) => {
                    const isPositive = r.Diem > 0;
                    const isValid = r.TrangThai === 'HIEU_LUC';

                    return (
                      <tr 
                        key={r.MaGhiNhan} 
                        className={`hover:bg-slate-50/80 transition-colors ${!isValid ? 'bg-slate-50/50 opacity-60 line-through-text' : ''}`}
                      >
                        <td className="py-3 px-3.5 text-slate-600 font-mono text-xs whitespace-nowrap">
                          {new Date(r.Ngay).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                          {r.TenHS}
                        </td>
                        <td className="py-3 px-3.5 text-xs text-slate-600 whitespace-nowrap">
                          {r.TenTo || '--'}
                        </td>
                        <td className="py-3 px-3.5 font-medium text-slate-800">
                          {r.TenLoi}
                        </td>
                        <td className="py-3 px-3.5 text-center font-black">
                          <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                            {isPositive ? `+${r.Diem}` : `${r.Diem}`}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-xs text-slate-600 max-w-xs">
                          {r.GhiChu || '--'}
                          {r.LyDoSuaHuy && (
                            <span className="block text-[11px] text-rose-600 mt-0.5">
                              (Lý do hủy: {r.LyDoSuaHuy})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-xs text-slate-500 whitespace-nowrap">
                          {r.NguoiGhiNhan}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            isValid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {isValid ? 'Hiệu lực' : 'Đã hủy'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          {isValid && (
                            <button
                              onClick={() => setCancelingRecord(r)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Hủy bản ghi (lưu lý do)"
                            >
                              <X className="w-4 h-4" />
                            </button>
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

      {/* Cancel Record Modal with Required Reason (Audit Trail) */}
      {cancelingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Xác nhận Hủy bản ghi thi đua</h3>
                  <p className="text-xs text-slate-500">Hệ thống lưu giữ dấu vết kiểm toán thay vì xóa vĩnh viễn</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <div>Học sinh: <strong className="text-slate-800">{cancelingRecord.TenHS}</strong></div>
                <div>Nội dung: <strong className="text-slate-800">{cancelingRecord.TenLoi}</strong> ({cancelingRecord.Diem > 0 ? `+${cancelingRecord.Diem}` : cancelingRecord.Diem} điểm)</div>
                <div>Ngày: <strong>{new Date(cancelingRecord.Ngay).toLocaleDateString('vi-VN')}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lý do hủy bản ghi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="VD: Ghi nhầm tên học sinh, hoặc học sinh đã hoàn thành giải trình..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Người thực hiện hủy
                </label>
                <input
                  type="text"
                  value={cancelerName}
                  onChange={(e) => setCancelerName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelingRecord(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Đóng lại
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelRecord}
                disabled={isCanceling}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                {isCanceling ? 'Đang xử lý...' : 'Xác nhận hủy bản ghi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
