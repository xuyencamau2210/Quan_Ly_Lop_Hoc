import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  Crown, 
  ShieldCheck, 
  ArrowRight, 
  RotateCcw,
  Check,
  X,
  Layers,
  UserX,
  Shuffle
} from 'lucide-react';
import { Classroom, Student, EmulationGroup, GroupMember } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../components/Toast.tsx';
import { ConfirmModal } from '../../components/ConfirmModal.tsx';

interface EmulationGroupManagerProps {
  classes: Classroom[];
  students: Student[];
  selectedClassId: string;
  onSelectClassId: (classId: string) => void;
  onRefresh?: () => void;
}

export const EmulationGroupManager: React.FC<EmulationGroupManagerProps> = ({
  classes,
  students,
  selectedClassId,
  onSelectClassId,
  onRefresh
}) => {
  const { success, error } = useToast();

  const [groups, setGroups] = useState<any[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroupTab, setFilterGroupTab] = useState<string>('all'); // 'all', 'unassigned', or MaTo
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAutoDivideModalOpen, setIsAutoDivideModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);

  // Group Form state
  const [formGroupName, setFormGroupName] = useState('');
  const [formGroupLeader, setFormGroupLeader] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto divide settings
  const [autoDivideOnlyUnassigned, setAutoDivideOnlyUnassigned] = useState(true);

  // Batch action selection
  const [batchTargetGroup, setBatchTargetGroup] = useState('');

  // Delete Confirm Modal
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    groupId: string;
    groupName: string;
  }>({
    isOpen: false,
    groupId: '',
    groupName: ''
  });

  // Load Groups and Members for current selected class
  const loadClassGroups = useCallback(async () => {
    if (!selectedClassId) return;
    try {
      setLoading(true);
      const [groupsData, membersData] = await Promise.all([
        api.getEmulationGroups(selectedClassId),
        api.getGroupMembers(selectedClassId)
      ]);
      setGroups(groupsData);
      setGroupMembers(membersData);
    } catch (err: any) {
      error(err.message || 'Lỗi khi tải dữ liệu tổ học sinh');
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, error]);

  useEffect(() => {
    loadClassGroups();
    setSelectedStudentIds([]);
    setFilterGroupTab('all');
  }, [loadClassGroups]);

  // Students belonging to current class
  const classStudents = useMemo(() => {
    return students.filter(s => s.classId === selectedClassId && s.status === 'active');
  }, [students, selectedClassId]);

  // Map each student to their assigned group
  const studentGroupMap = useMemo(() => {
    const map = new Map<string, { group: any; memberEntry: GroupMember }>();
    groupMembers.forEach(mem => {
      const g = groups.find(gr => gr.MaTo === mem.MaTo);
      if (g) {
        map.set(mem.MaHS, { group: g, memberEntry: mem });
      }
    });
    return map;
  }, [groupMembers, groups]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = classStudents.length;
    let assigned = 0;
    classStudents.forEach(s => {
      if (studentGroupMap.has(s.id)) assigned++;
    });
    const unassigned = total - assigned;
    return {
      total,
      assigned,
      unassigned,
      groupCount: groups.length
    };
  }, [classStudents, studentGroupMap, groups]);

  // Filtered students according to tab & search
  const filteredStudents = useMemo(() => {
    return classStudents.filter(s => {
      const matchSearch = searchQuery.trim() === '' || 
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentCode.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (filterGroupTab === 'all') return true;
      if (filterGroupTab === 'unassigned') return !studentGroupMap.has(s.id);
      
      const assigned = studentGroupMap.get(s.id);
      return assigned?.group.MaTo === filterGroupTab;
    });
  }, [classStudents, filterGroupTab, searchQuery, studentGroupMap]);

  // Handlers for Group CRUD
  const handleOpenCreateModal = () => {
    const nextGroupNum = groups.length + 1;
    setFormGroupName(`Tổ ${nextGroupNum}`);
    setFormGroupLeader('');
    setIsCreateModalOpen(true);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGroupName.trim()) {
      error('Vui lòng nhập tên tổ');
      return;
    }
    try {
      setSubmitting(true);
      await api.createEmulationGroup({
        MaLop: selectedClassId,
        TenTo: formGroupName.trim(),
        ToTruong: formGroupLeader.trim()
      });
      success(`Đã tạo thành công "${formGroupName.trim()}"`);
      setIsCreateModalOpen(false);
      await loadClassGroups();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      error(err.message || 'Lỗi khi tạo tổ mới');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (group: any) => {
    setEditingGroup(group);
    setFormGroupName(group.TenTo);
    setFormGroupLeader(group.ToTruong || '');
    setIsEditModalOpen(true);
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup || !formGroupName.trim()) return;
    try {
      setSubmitting(true);
      await api.updateEmulationGroup(editingGroup.MaTo, {
        TenTo: formGroupName.trim(),
        ToTruong: formGroupLeader.trim()
      });
      success(`Đã cập nhật thông tin tổ "${formGroupName.trim()}"`);
      setIsEditModalOpen(false);
      setEditingGroup(null);
      await loadClassGroups();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      error(err.message || 'Lỗi khi cập nhật tổ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteModalState.groupId) return;
    try {
      setSubmitting(true);
      await api.deleteEmulationGroup(deleteModalState.groupId);
      success(`Đã xóa "${deleteModalState.groupName}". Học sinh thuộc tổ đã được chuyển về chưa phân tổ.`);
      setDeleteModalState({ isOpen: false, groupId: '', groupName: '' });
      await loadClassGroups();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      error(err.message || 'Lỗi khi xóa tổ');
    } finally {
      setSubmitting(false);
    }
  };

  // Handlers for Student Assignment
  const handleAssignSingleStudent = async (studentId: string, targetMaTo: string) => {
    try {
      if (targetMaTo === 'unassign') {
        await api.unassignStudentFromGroup(studentId);
        success('Đã đưa học sinh về trạng thái chưa phân tổ');
      } else {
        await api.assignStudentToGroup({
          MaHS: studentId,
          MaTo: targetMaTo,
          TuNgay: '2026-09-07'
        });
        const gName = groups.find(g => g.MaTo === targetMaTo)?.TenTo || 'tổ mới';
        success(`Đã xếp học sinh vào ${gName}`);
      }
      await loadClassGroups();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      error(err.message || 'Lỗi khi phân tổ cho học sinh');
    }
  };

  const handleSetGroupLeader = async (group: any, studentName: string) => {
    try {
      await api.updateEmulationGroup(group.MaTo, {
        ToTruong: studentName
      });
      success(`Đã chỉ định học sinh "${studentName}" làm tổ trưởng ${group.TenTo}`);
      await loadClassGroups();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      error(err.message || 'Lỗi khi chỉ định tổ trưởng');
    }
  };

  // Batch actions
  const handleSelectAllFiltered = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleToggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleApplyBatchAssign = async () => {
    if (selectedStudentIds.length === 0) {
      error('Chưa chọn học sinh nào để phân tổ');
      return;
    }
    if (!batchTargetGroup) {
      error('Vui lòng chọn tổ đích');
      return;
    }

    try {
      setSubmitting(true);
      if (batchTargetGroup === 'unassign') {
        const assignments = selectedStudentIds.map(id => ({ MaHS: id, MaTo: '' }));
        await api.batchAssignStudentsToGroup(assignments, '2026-09-07');
        success(`Đã hủy phân tổ cho ${selectedStudentIds.length} học sinh đã chọn`);
      } else {
        const assignments = selectedStudentIds.map(id => ({ MaHS: id, MaTo: batchTargetGroup }));
        await api.batchAssignStudentsToGroup(assignments, '2026-09-07');
        const gName = groups.find(g => g.MaTo === batchTargetGroup)?.TenTo || '';
        success(`Đã phân ${selectedStudentIds.length} học sinh vào "${gName}"`);
      }
      setSelectedStudentIds([]);
      setBatchTargetGroup('');
      await loadClassGroups();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      error(err.message || 'Lỗi khi phân tổ hàng loạt');
    } finally {
      setSubmitting(false);
    }
  };

  // Auto divide students equally
  const handleAutoDivide = async () => {
    if (groups.length === 0) {
      error('Lớp học chưa có tổ nào. Vui lòng bấm "Tạo tổ mới" trước.');
      return;
    }
    try {
      setSubmitting(true);
      const activeGroupIds = groups.map(g => g.MaTo);
      const res = await api.autoDivideStudentsIntoGroups(
        selectedClassId, 
        activeGroupIds, 
        autoDivideOnlyUnassigned
      );
      success(`Tự động phân tổ thành công cho ${res.assignedCount} học sinh!`);
      setIsAutoDivideModalOpen(false);
      setSelectedStudentIds([]);
      await loadClassGroups();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      error(err.message || 'Lỗi khi tự động chia đều tổ');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-slate-800">Quản lý Tổ & Phân tổ Học sinh</h2>
          </div>
          <p className="text-xs text-slate-500">
            Tạo lập các tổ thi đua, chỉ định tổ trưởng và xếp học sinh vào các tổ phục vụ tổng kết & thi đua hàng tuần.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Class Select Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500">Lớp:</span>
            <select
              value={selectedClassId}
              onChange={(e) => onSelectClassId(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.academicYear})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Auto Divide Button */}
          <button
            onClick={() => setIsAutoDivideModalOpen(true)}
            disabled={groups.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            title="Tự động chia đều học sinh vào các tổ có sẵn"
          >
            <Shuffle className="w-4 h-4" />
            <span>Tự động chia đều</span>
          </button>

          {/* Create Group Button */}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo tổ mới</span>
          </button>
        </div>
      </div>

      {/* Summary Stats Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Số tổ hiện tại</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{stats.groupCount} <span className="text-xs font-medium text-slate-500">tổ</span></div>
          <div className="text-[11px] text-slate-400 mt-1">Lớp {selectedClass?.name || ''}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Sĩ số học sinh</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{stats.total} <span className="text-xs font-medium text-slate-500">em</span></div>
          <div className="text-[11px] text-slate-400 mt-1">Học sinh đang học</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-semibold">Đã phân tổ</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {stats.assigned}
            <span className="text-xs font-normal text-slate-400 ml-1.5">
              ({stats.total > 0 ? Math.round((stats.assigned / stats.total) * 100) : 0}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Đã vào danh sách tổ</div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-xs transition-colors ${
          stats.unassigned > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold ${stats.unassigned > 0 ? 'text-amber-800' : 'text-slate-500'}`}>
              Chưa phân tổ
            </span>
            <UserX className={`w-4 h-4 ${stats.unassigned > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-black ${stats.unassigned > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
            {stats.unassigned} <span className="text-xs font-medium text-slate-500">em</span>
          </div>
          {stats.unassigned > 0 ? (
            <button
              onClick={() => setFilterGroupTab('unassigned')}
              className="text-[11px] font-bold text-amber-700 hover:text-amber-900 mt-1 flex items-center gap-1 cursor-pointer"
            >
              Xem ngay <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <div className="text-[11px] text-emerald-600 font-medium mt-1">100% đã được phân tổ</div>
          )}
        </div>
      </div>

      {/* Grid of Groups Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <span>Danh sách các tổ của lớp</span>
            <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full font-bold">
              {groups.length}
            </span>
          </h3>

          {groups.length === 0 && (
            <span className="text-xs text-amber-600 font-medium">Chưa có tổ nào, hãy bấm nút "Tạo tổ mới"</span>
          )}
        </div>

        {groups.length === 0 ? (
          <div className="p-8 bg-white border border-dashed border-slate-200 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Lớp {selectedClass?.name} chưa có tổ thi đua nào</p>
              <p className="text-xs text-slate-400 mt-0.5 max-w-md mx-auto">
                Hãy tạo các tổ (ví dụ: Tổ 1, Tổ 2, Tổ 3, Tổ 4) để bắt đầu phân công học sinh và theo dõi điểm thi đua theo tổ.
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
            >
              + Tạo tổ đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {groups.map((g) => {
              // Members of this group in class
              const groupStudents = classStudents.filter(s => {
                const assigned = studentGroupMap.get(s.id);
                return assigned?.group.MaTo === g.MaTo;
              });

              const isViewingThisGroup = filterGroupTab === g.MaTo;

              return (
                <div 
                  key={g.MaTo} 
                  className={`bg-white rounded-2xl p-4 border transition-all ${
                    isViewingThisGroup ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-sm' : 'border-slate-200/90 shadow-xs hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-black text-slate-800">{g.TenTo}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="font-semibold text-slate-700 truncate max-w-[130px]">
                          {g.ToTruong ? g.ToTruong : <span className="text-slate-400 italic font-normal">Chưa có tổ trưởng</span>}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(g)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Chỉnh sửa tên tổ / tổ trưởng"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteModalState({
                          isOpen: true,
                          groupId: g.MaTo,
                          groupName: g.TenTo
                        })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa tổ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-3 text-xs">
                    <span className="text-slate-500 font-medium">Thành viên:</span>
                    <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {groupStudents.length} học sinh
                    </span>
                  </div>

                  <button
                    onClick={() => setFilterGroupTab(isViewingThisGroup ? 'all' : g.MaTo)}
                    className={`w-full mt-3 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      isViewingThisGroup 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{isViewingThisGroup ? 'Đang lọc xem tổ này' : 'Xem danh sách thành viên'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Student Assignment Board / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Header toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Bảng phân tổ học sinh chi tiết</h3>
            <p className="text-xs text-slate-500">
              Chuyển đổi tổ trực tiếp cho từng học sinh hoặc chọn nhiều học sinh để phân tổ cùng lúc.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên hoặc mã..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 w-44"
              />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterGroupTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filterGroupTab === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tất cả học sinh ({classStudents.length})
          </button>

          <button
            onClick={() => setFilterGroupTab('unassigned')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filterGroupTab === 'unassigned'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-700 bg-amber-50/60 hover:bg-amber-100/60'
            }`}
          >
            Chưa phân tổ ({stats.unassigned})
          </button>

          {groups.map(g => {
            const count = classStudents.filter(s => {
              const assigned = studentGroupMap.get(s.id);
              return assigned?.group.MaTo === g.MaTo;
            }).length;

            return (
              <button
                key={g.MaTo}
                onClick={() => setFilterGroupTab(g.MaTo)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filterGroupTab === g.MaTo
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {g.TenTo} ({count})
              </button>
            );
          })}
        </div>

        {/* Batch Action Toolbar when students are selected */}
        {selectedStudentIds.length > 0 && (
          <div className="px-4 py-2.5 bg-indigo-50/80 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>Đang chọn {selectedStudentIds.length} học sinh</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-700 font-semibold">Chuyển sang:</span>
              <select
                value={batchTargetGroup}
                onChange={(e) => setBatchTargetGroup(e.target.value)}
                className="text-xs font-bold bg-white border border-indigo-200 px-3 py-1.5 rounded-xl focus:outline-hidden"
              >
                <option value="">-- Chọn tổ đích --</option>
                {groups.map(g => (
                  <option key={g.MaTo} value={g.MaTo}>{g.TenTo}</option>
                ))}
                <option value="unassign">Hủy phân tổ (Chưa có tổ)</option>
              </select>

              <button
                onClick={handleApplyBatchAssign}
                disabled={submitting || !batchTargetGroup}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Đang lưu...' : 'Áp dụng'}
              </button>

              <button
                onClick={() => setSelectedStudentIds([])}
                className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Bỏ chọn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Students Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                    onChange={handleSelectAllFiltered}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 w-12 text-center">STT</th>
                <th className="py-3 px-4">Họ và tên học sinh</th>
                <th className="py-3 px-4">Mã số</th>
                <th className="py-3 px-3">Giới tính</th>
                <th className="py-3 px-4">Phân tổ hiện tại</th>
                <th className="py-3 px-4 text-center">Vai trò</th>
                <th className="py-3 px-4 text-right">Thao tác nhanh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-sm">Không tìm thấy học sinh phù hợp</p>
                    <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const assignedInfo = studentGroupMap.get(student.id);
                  const isAssigned = !!assignedInfo;
                  const currentGroup = assignedInfo?.group;
                  const isLeader = currentGroup && currentGroup.ToTruong === student.fullName;
                  const isSelected = selectedStudentIds.includes(student.id);

                  return (
                    <tr 
                      key={student.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectStudent(student.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase">
                            {student.fullName.charAt(0)}
                          </div>
                          <span>{student.fullName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {student.studentCode}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          student.gender === 'female' ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {student.gender === 'female' ? 'Nữ' : 'Nam'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {/* Inline Group Select Dropdown for instant change */}
                        <select
                          value={currentGroup?.MaTo || 'unassign'}
                          onChange={(e) => handleAssignSingleStudent(student.id, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border focus:outline-hidden cursor-pointer transition-all ${
                            isAssigned 
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          <option value="unassign">-- Chưa phân tổ --</option>
                          {groups.map(g => (
                            <option key={g.MaTo} value={g.MaTo}>{g.TenTo}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isLeader ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[11px]">
                            <Crown className="w-3 h-3 text-amber-600" />
                            Tổ trưởng
                          </span>
                        ) : isAssigned ? (
                          <button
                            onClick={() => handleSetGroupLeader(currentGroup, student.fullName)}
                            className="text-[11px] font-medium text-slate-400 hover:text-amber-600 hover:bg-amber-50 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                            title="Đặt làm tổ trưởng"
                          >
                            ⭐ Đặt làm tổ trưởng
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isAssigned ? (
                          <button
                            onClick={() => handleAssignSingleStudent(student.id, 'unassign')}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                            title="Rời khỏi tổ"
                          >
                            Rời tổ
                          </button>
                        ) : (
                          <span className="text-xs text-amber-600 font-semibold italic">
                            Chờ xếp tổ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create New Group */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-800">Thêm tổ mới cho lớp {selectedClass?.name}</h3>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên tổ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tổ 1 (Tiên Phong), Tổ 2..."
                  value={formGroupName}
                  onChange={(e) => setFormGroupName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tổ trưởng (Tùy chọn)
                </label>
                <select
                  value={formGroupLeader}
                  onChange={(e) => setFormGroupLeader(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-200 bg-white"
                >
                  <option value="">-- Chọn học sinh làm tổ trưởng --</option>
                  {classStudents.map(s => (
                    <option key={s.id} value={s.fullName}>{s.fullName} ({s.studentCode})</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Có thể chỉ định hoặc thay đổi tổ trưởng bất kỳ lúc nào sau khi phân tổ.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo tổ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Group */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Edit3 className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-800">Chỉnh sửa thông tin tổ</h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateGroup} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên tổ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formGroupName}
                  onChange={(e) => setFormGroupName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tổ trưởng
                </label>
                <select
                  value={formGroupLeader}
                  onChange={(e) => setFormGroupLeader(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-200 bg-white"
                >
                  <option value="">-- Chưa có tổ trưởng --</option>
                  {classStudents.map(s => (
                    <option key={s.id} value={s.fullName}>{s.fullName} ({s.studentCode})</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Auto Divide Students */}
      {isAutoDivideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Shuffle className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-800">Tự động chia đều vào các tổ</h3>
              </div>
              <button 
                onClick={() => setIsAutoDivideModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Hệ thống sẽ sắp xếp học sinh theo thứ tự bảng chữ cái và chia đều lần lượt vào{' '}
                <strong className="text-indigo-700">{groups.length} tổ</strong> hiện có của lớp {selectedClass?.name}.
              </p>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="radio"
                    name="autoDivideScope"
                    checked={autoDivideOnlyUnassigned}
                    onChange={() => setAutoDivideOnlyUnassigned(true)}
                    className="text-indigo-600"
                  />
                  <span>Chỉ chia các học sinh chưa phân tổ ({stats.unassigned} em)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="radio"
                    name="autoDivideScope"
                    checked={!autoDivideOnlyUnassigned}
                    onChange={() => setAutoDivideOnlyUnassigned(false)}
                    className="text-indigo-600"
                  />
                  <span>Chia lại toàn bộ tất cả học sinh trong lớp ({stats.total} em)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAutoDivideModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleAutoDivide}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Đang phân chia...' : 'Bắt đầu chia đều'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirm Modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        title="Xác nhận xóa tổ"
        message={`Bạn có chắc chắn muốn xóa "${deleteModalState.groupName}"? Các học sinh thuộc tổ này sẽ được chuyển về trạng thái "Chưa phân tổ".`}
        confirmText="Xóa tổ"
        cancelText="Giữ lại"
        isDestructive={true}
        isLoading={submitting}
        onConfirm={handleDeleteGroup}
        onCancel={() => setDeleteModalState({ isOpen: false, groupId: '', groupName: '' })}
      />
    </div>
  );
};
