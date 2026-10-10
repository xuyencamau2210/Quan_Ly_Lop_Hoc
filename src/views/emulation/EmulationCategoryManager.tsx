import React, { useState } from 'react';
import { 
  FolderPlus, 
  Plus, 
  Edit3, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  AlertCircle, 
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { EmulationCategory, EmulationType, EmulationCategoryStatus } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../components/Toast.tsx';

interface EmulationCategoryManagerProps {
  categories: EmulationCategory[];
  onRefresh: () => void;
}

export const EmulationCategoryManager: React.FC<EmulationCategoryManagerProps> = ({
  categories,
  onRefresh
}) => {
  const { success, error } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<EmulationCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<{
    TenLoi: string;
    Loai: EmulationType;
    Diem: number;
    MoTa: string;
    TrangThai: EmulationCategoryStatus;
  }>({
    TenLoi: '',
    Loai: 'TRU',
    Diem: 2,
    MoTa: '',
    TrangThai: 'DANG_DUNG'
  });

  const handleOpenAdd = () => {
    setFormData({
      TenLoi: '',
      Loai: 'TRU',
      Diem: 2,
      MoTa: '',
      TrangThai: 'DANG_DUNG'
    });
    setEditingCat(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (cat: EmulationCategory) => {
    setEditingCat(cat);
    setFormData({
      TenLoi: cat.TenLoi,
      Loai: cat.Loai,
      Diem: cat.Diem,
      MoTa: cat.MoTa || '',
      TrangThai: cat.TrangThai
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.TenLoi.trim()) {
      error('Vui lòng nhập tên hành vi / thành tích');
      return;
    }
    if (formData.Diem <= 0) {
      error('Điểm trong danh mục phải là số dương lớn hơn 0');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingCat) {
        await api.updateEmulationCategory(editingCat.MaLoi, formData);
        success(`Đã cập nhật danh mục "${formData.TenLoi}"`);
        setEditingCat(null);
      } else {
        await api.createEmulationCategory(formData);
        success(`Đã thêm mới danh mục "${formData.TenLoi}"`);
        setIsAddModalOpen(false);
      }
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Lỗi khi lưu danh mục');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat: EmulationCategory) => {
    try {
      await api.toggleEmulationCategory(cat.MaLoi);
      const action = cat.TrangThai === 'DANG_DUNG' ? 'Ẩn' : 'Kích hoạt';
      success(`Đã ${action} danh mục "${cat.TenLoi}"`);
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Lỗi khi đổi trạng thái danh mục');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Danh mục Thi đua & Quy định Điểm số</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quy định các hành vi cộng điểm thành tích và trừ điểm vi phạm. Điểm trong danh mục luôn là số dương.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Thêm danh mục mới
        </button>
      </div>

      {/* Notice info banner */}
      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
        <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">Quy tắc tính điểm & Dấu vết lịch sử: </span>
          Khi ghi nhận, hành vi <strong>CỘNG</strong> tự động áp dụng số điểm dương (+) và hành vi <strong>TRỪ</strong> tự động áp dụng số điểm âm (-). Khi chỉnh sửa điểm của danh mục, các bản ghi thi đua trong lịch sử sẽ không bị đổi điểm nhằm đảm bảo tính toàn vẹn kiểm toán.
        </div>
      </div>

      {/* Category Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 w-28">Mã mục</th>
                <th className="py-3 px-4">Tên nội dung</th>
                <th className="py-3 px-4 text-center w-28">Phân loại</th>
                <th className="py-3 px-4 text-center w-24">Mức điểm</th>
                <th className="py-3 px-4">Mô tả / Hướng dẫn áp dụng</th>
                <th className="py-3 px-4 text-center w-32">Trạng thái</th>
                <th className="py-3 px-4 text-right w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat, idx) => {
                const isMerit = cat.Loai === 'CONG';
                const isActive = cat.TrangThai === 'DANG_DUNG';

                return (
                  <tr key={cat.MaLoi} className={`hover:bg-slate-50/80 transition-colors ${!isActive ? 'opacity-60 bg-slate-50/40' : ''}`}>
                    <td className="py-3 px-4 text-center text-xs text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-bold text-slate-600">
                      {cat.MaLoi}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {cat.TenLoi}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        isMerit 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {isMerit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isMerit ? 'Khen thưởng' : 'Vi phạm'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-extrabold text-sm">
                      <span className={isMerit ? 'text-emerald-600' : 'text-rose-600'}>
                        {isMerit ? `+${cat.Diem}` : `-${cat.Diem}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs">
                      {cat.MoTa || '--'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        isActive 
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {isActive ? 'Đang áp dụng' : 'Đã ẩn'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Chỉnh sửa nội dung"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(cat)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isActive 
                              ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' 
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={isActive ? 'Ẩn danh mục' : 'Kích hoạt lại'}
                        >
                          {isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {(isAddModalOpen || editingCat) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {editingCat ? `Sửa danh mục: ${editingCat.TenLoi}` : 'Thêm tiêu chí thi đua mới'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Quy định tên hành vi, loại điểm và mức cộng/trừ</p>
              </div>
              <button 
                onClick={() => { setIsAddModalOpen(false); setEditingCat(null); }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên nội dung thi đua <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Không làm bài tập về nhà"
                  value={formData.TenLoi}
                  onChange={(e) => setFormData({ ...formData, TenLoi: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Loại tính điểm <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.Loai}
                    onChange={(e) => setFormData({ ...formData, Loai: e.target.value as EmulationType })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="TRU">TRỪ điểm vi phạm (-)</option>
                    <option value="CONG">CỘNG điểm khen thưởng (+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điểm (Luôn dương) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    required
                    value={formData.Diem}
                    onChange={(e) => setFormData({ ...formData, Diem: Math.abs(parseFloat(e.target.value) || 0) })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-extrabold text-indigo-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả / Hướng dẫn xử lý
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả hoàn cảnh áp dụng..."
                  value={formData.MoTa}
                  onChange={(e) => setFormData({ ...formData, MoTa: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingCat(null); }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? 'Đang lưu...' : (editingCat ? 'Lưu thay đổi' : 'Tạo danh mục')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
