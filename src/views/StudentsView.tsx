import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  Phone, 
  MapPin, 
  Calendar, 
  User, 
  ShieldCheck, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Student, Classroom, StudentStatus, Gender } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useToast } from '../components/Toast.tsx';
import { ConfirmModal } from '../components/ConfirmModal.tsx';

interface StudentsViewProps {
  students: Student[];
  classes: Classroom[];
  onRefresh: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  classes,
  onRefresh
}) => {
  const { success, error } = useToast();
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    studentCode: '',
    gender: 'male' as Gender,
    birthDate: '2010-01-01',
    classId: classes[0]?.id || '',
    parentName: '',
    parentPhone: '',
    address: '',
    status: 'active' as StudentStatus,
    note: ''
  });

  const handleOpenAdd = () => {
    setFormData({
      fullName: '',
      studentCode: `HS${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`,
      gender: 'male',
      birthDate: '2010-01-01',
      classId: classes[0]?.id || '',
      parentName: '',
      parentPhone: '',
      address: '',
      status: 'active',
      note: ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (st: Student) => {
    setEditingStudent(st);
    setFormData({
      fullName: st.fullName,
      studentCode: st.studentCode,
      gender: st.gender,
      birthDate: st.birthDate,
      classId: st.classId,
      parentName: st.parentName || '',
      parentPhone: st.parentPhone || '',
      address: st.address || '',
      status: st.status,
      note: st.note || ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      error('Vui lòng nhập họ và tên học sinh');
      return;
    }
    if (!formData.classId) {
      error('Vui lòng chọn lớp học');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, formData);
        success(`Đã cập nhật học sinh ${formData.fullName}`);
        setEditingStudent(null);
      } else {
        await api.createStudent(formData);
        success(`Đã thêm học sinh ${formData.fullName} vào hệ thống`);
        setIsAddModalOpen(false);
      }
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Lỗi khi lưu thông tin học sinh');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingStudentId) return;
    try {
      setIsDeleting(true);
      await api.deleteStudent(deletingStudentId);
      success('Đã xóa học sinh khỏi cơ sở dữ liệu máy chủ');
      setDeletingStudentId(null);
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Lỗi khi xóa học sinh');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered students
  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || 
      s.fullName.toLowerCase().includes(q) || 
      s.studentCode.toLowerCase().includes(q) ||
      s.parentPhone.includes(q) ||
      s.className.toLowerCase().includes(q);

    const matchesClass = selectedClassId === 'all' || s.classId === selectedClassId;
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;

    return matchesSearch && matchesClass && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hồ sơ Học sinh</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Quản lý thông tin cá nhân, liên hệ phụ huynh và phân lớp học sinh
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm shadow-indigo-200 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tiếp nhận học sinh mới
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, mã HS, SĐT phụ huynh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Lớp:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả lớp ({students.length})</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Lớp {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Trạng thái:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang học</option>
              <option value="transferred">Chuyển trường</option>
              <option value="suspended">Nghỉ học</option>
            </select>
          </div>

          <span className="text-xs font-semibold text-slate-400 ml-auto lg:ml-0">
            Hiển thị: <strong>{filteredStudents.length}</strong> học sinh
          </span>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-base font-bold text-slate-700">Không tìm thấy học sinh phù hợp</p>
            <p className="text-xs text-slate-500 mt-1">Vui lòng điều chỉnh tiêu chí tìm kiếm hoặc lớp học</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">STT</th>
                  <th className="py-3.5 px-4">Mã HS</th>
                  <th className="py-3.5 px-4">Họ và tên</th>
                  <th className="py-3.5 px-4">Lớp</th>
                  <th className="py-3.5 px-4">Giới tính</th>
                  <th className="py-3.5 px-4">Ngày sinh</th>
                  <th className="py-3.5 px-4">Phụ huynh & SĐT</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st, idx) => {
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-4 text-center text-xs font-medium text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-indigo-600">
                        {st.studentCode}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {st.fullName.split(' ').pop()?.charAt(0) || 'H'}
                          </div>
                          <span>{st.fullName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {st.className}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {st.gender === 'male' ? 'Nam' : st.gender === 'female' ? 'Nữ' : 'Khác'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {new Date(st.birthDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <p className="font-semibold text-slate-800">{st.parentName || 'Chưa cập nhật'}</p>
                        <p className="text-slate-500 font-mono text-[11px]">{st.parentPhone || '-'}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            st.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : st.status === 'transferred'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {st.status === 'active' ? 'Đang học' : st.status === 'transferred' ? 'Chuyển trường' : 'Nghỉ học'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingStudent(st)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Xem chi tiết hồ sơ"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(st)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingStudentId(st.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa học sinh"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {editingStudent ? `Cập nhật hồ sơ: ${editingStudent.fullName}` : 'Thêm mới học sinh'}
                  </h3>
                  <p className="text-xs text-slate-500">Nhập đầy đủ thông tin học sinh và thông tin liên lạc phụ huynh</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsAddModalOpen(false); setEditingStudent(null); }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và tên học sinh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn An"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã học sinh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: HS251001"
                    value={formData.studentCode}
                    onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lớp học <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Lớp {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giới tính
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ tên Phụ huynh
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Nguyễn Văn Bình"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    type="tel"
                    placeholder="VD: 0912345678"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Địa chỉ thường trú
                </label>
                <input
                  type="text"
                  placeholder="VD: 123 Phố Huế, Q. Hai Bà Trưng, Hà Nội"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trạng thái học tập
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StudentStatus })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Đang học</option>
                    <option value="transferred">Chuyển trường</option>
                    <option value="suspended">Nghỉ học</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ghi chú học bạ
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Lớp trưởng, đạt giải Toán..."
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingStudent(null); }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? 'Đang lưu...' : (editingStudent ? 'Cập nhật' : 'Lưu hồ sơ')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Profile Detail Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-br from-indigo-700 to-indigo-900 text-white relative">
              <button 
                onClick={() => setViewingStudent(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center text-2xl font-black border border-white/20">
                  {viewingStudent.fullName.split(' ').pop()?.charAt(0) || 'H'}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{viewingStudent.fullName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs bg-white/20 px-2 py-0.5 rounded-md">
                      {viewingStudent.studentCode}
                    </span>
                    <span className="text-xs bg-indigo-400/40 px-2 py-0.5 rounded-md font-bold">
                      Lớp {viewingStudent.className}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block">Giới tính</span>
                  <span className="font-bold text-slate-800">
                    {viewingStudent.gender === 'male' ? 'Nam' : viewingStudent.gender === 'female' ? 'Nữ' : 'Khác'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Ngày sinh</span>
                  <span className="font-bold text-slate-800">
                    {new Date(viewingStudent.birthDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pb-3 border-b border-slate-100 text-xs">
                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block">Phụ huynh học sinh:</span>
                    <span className="font-bold text-slate-800 text-sm">{viewingStudent.parentName || 'Chưa cập nhật'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block">Số điện thoại liên hệ:</span>
                    <span className="font-bold text-slate-800 text-sm font-mono">{viewingStudent.parentPhone || 'Chưa có'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block">Địa chỉ:</span>
                    <span className="text-slate-700">{viewingStudent.address || 'Chưa cập nhật'}</span>
                  </div>
                </div>
              </div>

              {viewingStudent.note && (
                <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600">
                  <span className="font-bold text-slate-800 block mb-1">Ghi chú học bạ:</span>
                  {viewingStudent.note}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const toEdit = viewingStudent;
                  setViewingStudent(null);
                  handleOpenEdit(toEdit);
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Chỉnh sửa hồ sơ
              </button>
              <button
                type="button"
                onClick={() => setViewingStudent(null)}
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
        isOpen={!!deletingStudentId}
        title="Xác nhận xóa học sinh"
        message="Bạn có chắc chắn muốn xóa học sinh này không? Hồ sơ, điểm danh và bảng điểm của học sinh sẽ bị gỡ bỏ khỏi cơ sở dữ liệu máy chủ."
        confirmText="Xóa học sinh"
        cancelText="Hủy bỏ"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingStudentId(null)}
      />
    </div>
  );
};
