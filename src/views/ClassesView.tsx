import React, { useState } from 'react';
import { 
  School, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  Users, 
  DoorOpen, 
  UserCheck, 
  Calendar,
  X,
  AlertCircle
} from 'lucide-react';
import { Classroom, Student } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useToast } from '../components/Toast.tsx';
import { ConfirmModal } from '../components/ConfirmModal.tsx';

interface ClassesViewProps {
  classes: Classroom[];
  students: Student[];
  onRefresh: () => void;
  onSelectClassForAttendance: (classId: string) => void;
  onSelectClassForEmulation?: (classId: string) => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  classes,
  students,
  onRefresh,
  onSelectClassForAttendance,
  onSelectClassForEmulation
}) => {
  const { success, error } = useToast();
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Classroom | null>(null);
  const [viewingClass, setViewingClass] = useState<Classroom | null>(null);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    grade: 10,
    academicYear: '2025 - 2026',
    homeroomTeacher: '',
    room: '',
    maxStudents: 45,
    note: ''
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      grade: 10,
      academicYear: '2025 - 2026',
      homeroomTeacher: '',
      room: '',
      maxStudents: 45,
      note: ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (cls: Classroom) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      grade: cls.grade,
      academicYear: cls.academicYear,
      homeroomTeacher: cls.homeroomTeacher,
      room: cls.room,
      maxStudents: cls.maxStudents,
      note: cls.note || ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('Vui lòng nhập tên lớp học');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingClass) {
        await api.updateClass(editingClass.id, formData);
        success(`Đã cập nhật thông tin lớp ${formData.name}`);
        setEditingClass(null);
      } else {
        await api.createClass(formData);
        success(`Đã thêm mới lớp ${formData.name} thành công`);
        setIsAddModalOpen(false);
      }
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Lỗi khi lưu thông tin lớp học');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingClassId) return;
    try {
      setIsDeleting(true);
      await api.deleteClass(deletingClassId);
      success('Đã xóa lớp học thành công');
      setDeletingClassId(null);
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Lỗi khi xóa lớp học');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered classes
  const filteredClasses = classes.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.homeroomTeacher.toLowerCase().includes(search.toLowerCase()) ||
                          c.room.toLowerCase().includes(search.toLowerCase());
    const matchesGrade = selectedGrade === 'all' || c.grade.toString() === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  const classStudents = viewingClass 
    ? students.filter(s => s.classId === viewingClass.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Lớp học</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Danh sách tất cả các khối và lớp học trong năm học hiện tại
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm shadow-indigo-200 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Thêm lớp học mới
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên lớp, GVCN, phòng học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Lọc theo khối:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {['all', '10', '11', '12'].map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                  selectedGrade === g
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {g === 'all' ? 'Tất cả khối' : `Khối ${g}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <School className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy lớp học nào</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn khối khác, hoặc thêm lớp học mới vào hệ thống.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((cls) => {
            const studentCount = cls.studentCount || 0;
            const percent = Math.round((studentCount / cls.maxStudents) * 100);

            return (
              <div
                key={cls.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                          Lớp {cls.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700">
                          Khối {cls.grade}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{cls.academicYear}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(cls)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                        title="Chỉnh sửa lớp"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingClassId(cls.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Xóa lớp"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 my-4">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>GVCN: <strong className="text-slate-800">{cls.homeroomTeacher}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DoorOpen className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Phòng học: <strong className="text-slate-800">{cls.room}</strong></span>
                    </div>
                    {cls.note && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                        "{cls.note}"
                      </div>
                    )}
                  </div>

                  {/* Sĩ số progress bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        Sĩ số:
                      </span>
                      <span className="font-bold text-slate-800">
                        {studentCount} / {cls.maxStudents} HS ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setViewingClass(cls)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Xem danh sách
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectClassForAttendance(cls.id)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      Điểm danh
                    </button>
                    {onSelectClassForEmulation && (
                      <button
                        onClick={() => onSelectClassForEmulation(cls.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        Thi đua
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Class Modal */}
      {(isAddModalOpen || editingClass) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {editingClass ? `Chỉnh sửa lớp ${editingClass.name}` : 'Thêm lớp học mới'}
                  </h3>
                  <p className="text-xs text-slate-500">Thông tin cơ bản về lớp học và giáo viên phụ trách</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsAddModalOpen(false); setEditingClass(null); }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên lớp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 10A1"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khối học <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={10}>Khối 10</option>
                    <option value={11}>Khối 11</option>
                    <option value={12}>Khối 12</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giáo viên chủ nhiệm
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Thầy Nguyễn Văn Nam"
                    value={formData.homeroomTeacher}
                    onChange={(e) => setFormData({ ...formData, homeroomTeacher: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phòng học
                  </label>
                  <input
                    type="text"
                    placeholder="VD: P.201 - Nhà A"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Năm học
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sĩ số tối đa
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú / Mô tả lớp
                </label>
                <textarea
                  rows={2}
                  placeholder="VD: Lớp chuyên Toán, ngoại ngữ 1 tiếng Anh..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingClass(null); }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? 'Đang lưu...' : (editingClass ? 'Lưu thay đổi' : 'Tạo lớp học')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Class Students Detail Drawer/Modal */}
      {viewingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">Danh sách học sinh lớp {viewingClass.name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                    {classStudents.length} học sinh
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  GVCN: {viewingClass.homeroomTeacher} • Phòng {viewingClass.room}
                </p>
              </div>
              <button 
                onClick={() => setViewingClass(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {classStudents.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm">Chưa có học sinh nào trong lớp này.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {classStudents.map((st, idx) => (
                    <div key={st.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}</span>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{st.fullName}</p>
                          <p className="text-xs text-slate-500">
                            Mã: {st.studentCode} • Sinh ngày: {new Date(st.birthDate).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <p className="text-slate-700 font-medium">PH: {st.parentName || 'Chưa cập nhật'}</p>
                        <p className="text-slate-500">{st.parentPhone || 'Chưa có SĐT'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewingClass(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletingClassId}
        title="Xác nhận xóa lớp học"
        message="Bạn có chắc chắn muốn xóa lớp học này không? Tất cả dữ liệu học sinh, điểm danh và thi đua tuần liên quan sẽ bị xóa khỏi cơ sở dữ liệu máy chủ."
        confirmText="Xóa lớp học"
        cancelText="Hủy bỏ"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingClassId(null)}
      />
    </div>
  );
};
