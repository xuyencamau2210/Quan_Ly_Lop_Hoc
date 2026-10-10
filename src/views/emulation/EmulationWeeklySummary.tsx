import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  Calendar, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  RefreshCw, 
  History, 
  Plus, 
  Crown,
  FileCheck
} from 'lucide-react';
import { 
  Classroom, Student, EmulationPeriod, WeeklyStudentSummary, WeeklyGroupSummary 
} from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../components/Toast.tsx';

interface EmulationWeeklySummaryProps {
  classes: Classroom[];
  periods: EmulationPeriod[];
  selectedClassId: string;
  selectedPeriodId: string;
  onRefresh: () => void;
}

export const EmulationWeeklySummary: React.FC<EmulationWeeklySummaryProps> = ({
  classes,
  periods,
  selectedClassId,
  selectedPeriodId,
  onRefresh
}) => {
  const { success, error, warning } = useToast();

  const [currentClassId, setCurrentClassId] = useState<string>(selectedClassId || classes[0]?.id || '');
  const [currentPeriodId, setCurrentPeriodId] = useState<string>(selectedPeriodId || periods[0]?.MaKy || '');
  
  const [studentSummaries, setStudentSummaries] = useState<WeeklyStudentSummary[]>([]);
  const [groupSummaries, setGroupSummaries] = useState<WeeklyGroupSummary[]>([]);
  const [loading, setLoading] = useState(false);

  // Lock State
  const [isLocking, setIsLocking] = useState(false);
  const [lockedByName, setLockedByName] = useState<string>('Thầy Nguyễn Văn Nam (GVCN)');

  // Unlock Modal
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState<string>('');
  const [unlockedByName, setUnlockedByName] = useState<string>('Thầy Nguyễn Văn Nam (GVCN)');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Create New Period Modal
  const [isNewPeriodModalOpen, setIsNewPeriodModalOpen] = useState(false);
  const [newPeriodWeekNumber, setNewPeriodWeekNumber] = useState<number>(42);
  const [newPeriodStartDate, setNewPeriodStartDate] = useState<string>('2026-10-12');
  const [newPeriodEndDate, setNewPeriodEndDate] = useState<string>('2026-10-18');
  const [newPeriodStartingScore, setNewPeriodStartingScore] = useState<number>(0);
  const [isCreatingPeriod, setIsCreatingPeriod] = useState(false);

  const activePeriod = periods.find(p => p.MaKy === currentPeriodId);
  const isLocked = activePeriod?.TrangThai === 'DA_KHOA';

  useEffect(() => {
    if (!currentClassId || !currentPeriodId) return;
    loadSummary(currentClassId, currentPeriodId);
  }, [currentClassId, currentPeriodId]);

  const loadSummary = async (clsId: string, pId: string) => {
    try {
      setLoading(true);
      const [studentsData, groupsData] = await Promise.all([
        api.calculateStudentWeeklyScores(clsId, pId),
        api.calculateGroupWeeklyScores(clsId, pId)
      ]);
      setStudentSummaries(studentsData);
      setGroupSummaries(groupsData);
    } catch (err: any) {
      error(err.message || 'Lỗi khi tải bảng tổng kết tuần');
    } finally {
      setLoading(false);
    }
  };

  const handleLockPeriod = async () => {
    if (!currentPeriodId || !currentClassId) return;
    try {
      setIsLocking(true);
      const res = await api.lockWeeklyPeriod(currentPeriodId, currentClassId, lockedByName);
      success(`Đã khóa sổ tuần ${currentPeriodId} thành công! Snapshot kết quả đã được lưu kiên cố.`);
      onRefresh();
      loadSummary(currentClassId, currentPeriodId);
    } catch (err: any) {
      error(err.message || 'Lỗi khi khóa sổ tuần');
    } finally {
      setIsLocking(false);
    }
  };

  const handleUnlockPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockReason.trim()) {
      warning('Bắt buộc phải nhập lý do mở khóa sổ');
      return;
    }

    try {
      setIsUnlocking(true);
      await api.unlockWeeklyPeriod(currentPeriodId, currentClassId, unlockedByName, unlockReason);
      success(`Đã mở khóa sổ tuần ${currentPeriodId}. Đã lưu dấu vết kiểm toán người mở.`);
      setIsUnlockModalOpen(false);
      setUnlockReason('');
      onRefresh();
      loadSummary(currentClassId, currentPeriodId);
    } catch (err: any) {
      error(err.message || 'Lỗi khi mở khóa sổ');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleCreateNewPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreatingPeriod(true);
      const newP = await api.createEmulationPeriod({
        NamHoc: '2025 - 2026',
        TuanSo: newPeriodWeekNumber,
        TuNgay: newPeriodStartDate,
        DenNgay: newPeriodEndDate,
        DiemDauTuan: newPeriodStartingScore,
        GhiChu: `Tuần thi đua ${newPeriodWeekNumber}`
      });
      success(`Đã khởi tạo tuần thi đua mới: ${newP.MaKy}`);
      setIsNewPeriodModalOpen(false);
      onRefresh();
      setCurrentPeriodId(newP.MaKy);
    } catch (err: any) {
      error(err.message || 'Lỗi khi tạo tuần mới');
    } finally {
      setIsCreatingPeriod(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Tổng kết và Khóa sổ Thi đua Tuần</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem bản tổng kết tạm tính, kiểm tra đối chiếu điểm trước khi chốt và lưu snapshot kết quả tuần
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsNewPeriodModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            Tạo tuần thi đua mới
          </button>

          {!isLocked ? (
            <button
              onClick={handleLockPeriod}
              disabled={isLocking}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {isLocking ? 'Đang khóa sổ...' : 'Khóa sổ tuần này'}
            </button>
          ) : (
            <button
              onClick={() => setIsUnlockModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-all cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              Mở khóa sổ tuần
            </button>
          )}
        </div>
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
            <span className="text-xs font-bold text-slate-600">Tuần tổng kết:</span>
            <select
              value={currentPeriodId}
              onChange={(e) => setCurrentPeriodId(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
            >
              {periods.map((p) => (
                <option key={p.MaKy} value={p.MaKy}>
                  Tuần {p.TuanSo} ({p.MaKy}) {p.TrangThai === 'DA_KHOA' ? '[ĐÃ KHÓA]' : '[ĐANG TÍNH]'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lock Status Badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            isLocked 
              ? 'bg-rose-50 text-rose-700 border border-rose-200' 
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            {isLocked ? 'Đã khóa sổ bất biến' : 'Bản tổng kết tạm tính (Idempotent)'}
          </span>
          {activePeriod?.ThoiGianKhoa && (
            <span className="text-[11px] text-slate-400">
              Khóa lúc: {new Date(activePeriod.ThoiGianKhoa).toLocaleDateString('vi-VN')} ({activePeriod.NguoiKhoa})
            </span>
          )}
        </div>
      </div>

      {/* Snapshot / Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            Bảng tổng kết điểm học sinh lớp {classes.find(c => c.id === currentClassId)?.name}
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Điểm đầu tuần mặc định: <strong>{activePeriod?.DiemDauTuan || 0} điểm</strong>
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse text-xs">
            Đang tải dữ liệu tổng kết tuần...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-3.5 text-center w-14">Hạng</th>
                  <th className="py-3 px-3.5 w-24">Mã HS</th>
                  <th className="py-3 px-3.5">Họ và tên</th>
                  <th className="py-3 px-3.5">Tổ</th>
                  <th className="py-3 px-3.5 text-center w-24">Điểm đầu tuần</th>
                  <th className="py-3 px-3.5 text-center w-24">Tổng cộng (+)</th>
                  <th className="py-3 px-3.5 text-center w-24">Tổng trừ (-)</th>
                  <th className="py-3 px-3.5 text-center w-24 bg-indigo-50/60 font-black">Điểm cuối tuần</th>
                  <th className="py-3 px-3.5 text-center w-24">Thành tích</th>
                  <th className="py-3 px-3.5 text-center w-24">Vi phạm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentSummaries.map((s, idx) => {
                  const isTop = s.XepHang === 1;

                  return (
                    <tr key={s.MaHS} className={`hover:bg-slate-50/80 transition-colors ${isTop ? 'bg-amber-50/20' : ''}`}>
                      <td className="py-3 px-3.5 text-center font-black">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                          s.XepHang === 1 
                            ? 'bg-amber-500 text-white shadow-xs' 
                            : s.XepHang === 2 
                            ? 'bg-slate-300 text-slate-800' 
                            : s.XepHang === 3
                            ? 'bg-amber-200 text-amber-900'
                            : 'text-slate-500'
                        }`}>
                          {s.XepHang}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-xs font-bold text-slate-600">
                        {s.MaHS}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-900">
                        {s.TenHS}
                      </td>
                      <td className="py-3 px-3.5 text-xs text-slate-600">
                        {s.TenTo || '--'}
                      </td>
                      <td className="py-3 px-3.5 text-center text-slate-500">
                        {s.DiemDauTuan}
                      </td>
                      <td className="py-3 px-3.5 text-center font-bold text-emerald-700">
                        +{s.TongDiemCong}
                      </td>
                      <td className="py-3 px-3.5 text-center font-bold text-rose-700">
                        {s.TongDiemTru}
                      </td>
                      <td className="py-3 px-3.5 text-center font-black text-sm bg-indigo-50/40 text-indigo-900">
                        {s.DiemCuoiTuan > 0 ? `+${s.DiemCuoiTuan}` : s.DiemCuoiTuan}
                      </td>
                      <td className="py-3 px-3.5 text-center text-emerald-700 font-semibold">
                        {s.SoThanhTich} lượt
                      </td>
                      <td className="py-3 px-3.5 text-center text-rose-700 font-semibold">
                        {s.SoViPham} lượt
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unlock Confirmation Modal */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Mở khóa sổ tuần thi đua</h3>
                  <p className="text-xs text-slate-500">Yêu cầu nhập lý do để lưu vết kiểm toán</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleUnlockPeriod} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lý do mở khóa lại sổ <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="VD: Cần bổ sung thành tích đột xuất hoặc điều chỉnh vi phạm nhầm lẫn..."
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Người thực hiện mở khóa
                </label>
                <input
                  type="text"
                  value={unlockedByName}
                  onChange={(e) => setUnlockedByName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUnlockModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isUnlocking}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  {isUnlocking ? 'Đang mở khóa...' : 'Xác nhận mở khóa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Period Modal */}
      {isNewPeriodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Khởi tạo Tuần thi đua mới</h3>
              <p className="text-xs text-slate-500 mt-0.5">Quy ước tuần từ thứ Hai đến Chủ nhật (Asia/Ho_Chi_Minh)</p>
            </div>

            <form onSubmit={handleCreateNewPeriod} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tuần số <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    required
                    value={newPeriodWeekNumber}
                    onChange={(e) => setNewPeriodWeekNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Điểm đầu tuần (Mặc định 0)
                  </label>
                  <input
                    type="number"
                    value={newPeriodStartingScore}
                    onChange={(e) => setNewPeriodStartingScore(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Từ ngày (Thứ 2) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newPeriodStartDate}
                    onChange={(e) => setNewPeriodStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đến ngày (Chủ nhật) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newPeriodEndDate}
                    onChange={(e) => setNewPeriodEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewPeriodModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPeriod}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  {isCreatingPeriod ? 'Đang tạo...' : 'Khởi tạo tuần mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
