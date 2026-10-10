import React, { useState } from 'react';
import { 
  Calendar, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Unlock,
  Sparkles,
  Clock
} from 'lucide-react';
import { EmulationPeriod } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../components/Toast.tsx';
import { ConfirmModal } from '../../components/ConfirmModal.tsx';

interface EmulationPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  periods: EmulationPeriod[];
  onRefresh: () => void;
}

export const EmulationPeriodModal: React.FC<EmulationPeriodModalProps> = ({
  isOpen,
  onClose,
  periods,
  onRefresh
}) => {
  const { success, error } = useToast();

  const [loading, setLoading] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // Form state
  const [formWeekNum, setFormWeekNum] = useState<number>(periods.length + 1);
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formNote, setFormNote] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<EmulationPeriod | null>(null);

  // Reset confirm modal
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    // Suggest next monday and sunday based on last period
    let nextStart = '2026-10-12';
    let nextEnd = '2026-10-18';
    if (periods.length > 0) {
      const last = periods[periods.length - 1];
      const lastEndDate = new Date(last.DenNgay);
      const nextMon = new Date(lastEndDate);
      nextMon.setDate(lastEndDate.getDate() + 1);
      const nextSun = new Date(nextMon);
      nextSun.setDate(nextMon.getDate() + 6);
      nextStart = nextMon.toISOString().split('T')[0];
      nextEnd = nextSun.toISOString().split('T')[0];
    }
    setFormWeekNum(periods.length + 1);
    setFormStartDate(nextStart);
    setFormEndDate(nextEnd);
    setFormNote(`Tuần ${periods.length + 1}`);
    setIsAddFormOpen(true);
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStartDate || !formEndDate) {
      error('Vui lòng chọn từ ngày và đến ngày');
      return;
    }
    try {
      setLoading(true);
      await api.createEmulationPeriod({
        NamHoc: '2026 - 2027',
        TuanSo: Number(formWeekNum),
        TuNgay: formStartDate,
        DenNgay: formEndDate,
        GhiChu: formNote.trim() || `Tuần ${formWeekNum}`,
        DiemDauTuan: 0
      });
      success(`Đã thêm Tuần ${formWeekNum} thành công`);
      setIsAddFormOpen(false);
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Lỗi khi tạo tuần thi đua');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePeriod = async () => {
    if (!deleteTarget) return;
    try {
      setLoading(true);
      await api.deleteEmulationPeriod(deleteTarget.MaKy);
      success(`Đã xóa ${deleteTarget.MaKy} thành công`);
      setDeleteTarget(null);
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Lỗi khi xóa tuần thi đua');
    } finally {
      setLoading(false);
    }
  };

  const handleResetToOfficialYear = async () => {
    try {
      setLoading(true);
      const res = await api.resetEmulationPeriods('2026-09-07', 18);
      success(res.message || 'Đã thiết lập lại tuần thi đua bắt đầu từ 07/09/2026!');
      setIsResetConfirmOpen(false);
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Lỗi khi thiết lập lại tuần thi đua');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-slate-800 text-base">Quản lý Tuần Thi đua (Năm học 2026 - 2027)</h3>
              <p className="text-xs text-slate-500">
                Tuần 1 bắt đầu từ ngày 07/09/2026 và các tuần tiếp theo.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="p-4 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all cursor-pointer"
              title="Đặt lại toàn bộ tuần thi đua từ Tuần 1 bắt đầu 07/09/2026"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Thiết lập lại từ Tuần 1 (07/09/2026)</span>
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm tuần mới</span>
          </button>
        </div>

        {/* Add Period Inline Form */}
        {isAddFormOpen && (
          <form onSubmit={handleCreatePeriod} className="p-4 bg-indigo-50/50 border-b border-indigo-100 animate-in fade-in duration-150 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900">Thêm tuần thi đua mới:</span>
              <button 
                type="button" 
                onClick={() => setIsAddFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Tuần số</label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  required
                  value={formWeekNum}
                  onChange={(e) => setFormWeekNum(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Từ ngày (Thứ 2)</label>
                <input
                  type="date"
                  required
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Đến ngày (Chủ nhật)</label>
                <input
                  type="date"
                  required
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Chủ đề / Ghi chú</label>
                <input
                  type="text"
                  placeholder="Ghi chú tuần..."
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddFormOpen(false)}
                className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200/60 rounded-lg cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-3.5 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all cursor-pointer"
              >
                Lưu tuần mới
              </button>
            </div>
          </form>
        )}

        {/* Periods List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {periods.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p className="font-semibold text-sm">Chưa có tuần thi đua nào</p>
              <p className="text-xs mt-1">Bấm "Thiết lập lại từ Tuần 1" để tự động tạo lịch năm học.</p>
            </div>
          ) : (
            periods.map((p) => {
              const isLocked = p.TrangThai === 'DA_KHOA';
              const isCurrentWeek = p.TuNgay <= '2026-10-10' && p.DenNgay >= '2026-10-10';

              return (
                <div key={p.MaKy} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                      isCurrentWeek 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : isLocked 
                          ? 'bg-slate-100 text-slate-600' 
                          : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      W{p.TuanSo.toString().padStart(2, '0')}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs">{p.MaKy}</span>
                        {isCurrentWeek && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-bold text-[10px]">
                            Tuần hiện tại
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          isLocked ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isLocked ? 'Đã khóa sổ' : 'Đang diễn ra'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{p.TuNgay} → {p.DenNgay}</span>
                        {p.GhiChu && <span className="text-slate-400">| {p.GhiChu}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Xóa tuần này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Tổng số: <strong>{periods.length}</strong> tuần thi đua</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Delete Target Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Xác nhận xóa tuần thi đua"
        message={`Bạn có chắc chắn muốn xóa "${deleteTarget?.MaKy}" (${deleteTarget?.TuNgay} đến ${deleteTarget?.DenNgay})?`}
        confirmText="Xóa tuần"
        cancelText="Giữ lại"
        isDestructive={true}
        isLoading={loading}
        onConfirm={handleDeletePeriod}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Reset Calendar Confirm Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Thiết lập lại danh sách tuần thi đua"
        message="Hệ thống sẽ thiết lập lại danh sách tuần thi đua bắt đầu từ Tuần 1 ngày 07/09/2026 (18 tuần học kỳ 1) và tự động đồng bộ lại các dữ liệu thi đua tương ứng. Bạn có muốn tiếp tục?"
        confirmText="Đồng ý thiết lập lại"
        cancelText="Hủy bỏ"
        isDestructive={false}
        isLoading={loading}
        onConfirm={handleResetToOfficialYear}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
