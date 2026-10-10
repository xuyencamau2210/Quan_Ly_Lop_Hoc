import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, 
  Crown, 
  Shield, 
  BookOpen, 
  Sparkles, 
  Coins, 
  Wrench, 
  Plus, 
  Edit3, 
  Trash2, 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  Printer, 
  RotateCcw, 
  Grid, 
  Maximize2, 
  HelpCircle, 
  Phone, 
  Calendar, 
  Search, 
  X,
  Shuffle,
  ChevronDown,
  Layers,
  Award
} from 'lucide-react';
import { Classroom, Student, ClassOfficer, SeatingChart, SeatPosition, OfficerRole } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useToast } from '../components/Toast.tsx';
import { ConfirmModal } from '../components/ConfirmModal.tsx';

interface OrganizationViewProps {
  classes: Classroom[];
  students: Student[];
  initialClassId?: string;
  onRefresh?: () => void;
}

const OFFICER_ROLE_CONFIG: Record<OfficerRole, { label: string; icon: any; color: string; bg: string; border: string; defaultDuty: string }> = {
  LOP_TRUONG: {
    label: 'Lớp trưởng',
    icon: Crown,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    defaultDuty: 'Phụ trách chung công tác tự quản của lớp, đôn đốc các hoạt động và đại diện tập thể làm việc với GVCN'
  },
  LOP_PHO_HOC_TAP: {
    label: 'Lớp phó Học tập',
    icon: BookOpen,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    defaultDuty: 'Theo dõi bài vở, tổ chức 15 phút truy bài đầu giờ, giúp đỡ các bạn học yếu và báo cáo tình hình học tập'
  },
  LOP_PHO_KY_LUAT: {
    label: 'Lớp phó Kỷ luật',
    icon: Shield,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-300',
    defaultDuty: 'Theo dõi nề nếp kỷ cương, tác phong, trật tự giờ tự quản và phối hợp cùng đội Sao đỏ chấm thi đua'
  },
  LOP_PHO_LAO_DONG: {
    label: 'Lớp phó Lao động',
    icon: Wrench,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    defaultDuty: 'Phân công và đôn đốc trực nhật vệ sinh lớp học, giữ gìn tài sản chung và chăm sóc cây xanh'
  },
  LOP_PHO_PHONG_TRAO: {
    label: 'Lớp phó Phong trào',
    icon: Sparkles,
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    defaultDuty: 'Tổ chức các hoạt động văn nghệ, thể dục thể thao, báo tường và phong trào đoàn đội của trường'
  },
  THU_QUY: {
    label: 'Thủ quỹ',
    icon: Coins,
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-300',
    defaultDuty: 'Quản lý thu chi quỹ lớp công khai minh bạch, mua sắm văn phòng phẩm và chuẩn bị hoạt động tập thể'
  },
  TO_TRUONG: {
    label: 'Tổ trưởng',
    icon: Users,
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-300',
    defaultDuty: 'Điều hành các hoạt động thi đua và tự quản của tổ'
  },
  TO_PHO: {
    label: 'Tổ phó',
    icon: Users,
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-300',
    defaultDuty: 'Hỗ trợ tổ trưởng điều hành công việc của tổ'
  },
  KHAC: {
    label: 'Cán sự khác',
    icon: Award,
    color: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    defaultDuty: 'Nhiệm vụ đặc thù do GVCN phân công'
  }
};

export const OrganizationView: React.FC<OrganizationViewProps> = ({
  classes,
  students,
  initialClassId,
  onRefresh
}) => {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'officers' | 'seating'>('officers');
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || classes[0]?.id || ''
  );

  // Officers State
  const [officers, setOfficers] = useState<ClassOfficer[]>([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);

  // Seating Chart State
  const [seatingChart, setSeatingChart] = useState<SeatingChart | null>(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const [swapSourceSeatId, setSwapSourceSeatId] = useState<string | null>(null);

  // Officer Modals
  const [isOfficerModalOpen, setIsOfficerModalOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<ClassOfficer | null>(null);
  const [officerFormRole, setOfficerFormRole] = useState<OfficerRole>('LOP_TRUONG');
  const [officerFormStudentId, setOfficerFormStudentId] = useState('');
  const [officerFormDuty, setOfficerFormDuty] = useState('');
  const [officerFormPhone, setOfficerFormPhone] = useState('');
  const [officerFormCustomTitle, setOfficerFormCustomTitle] = useState('');
  const [submittingOfficer, setSubmittingOfficer] = useState(false);

  // Delete officer confirm modal
  const [deleteOfficerTarget, setDeleteOfficerTarget] = useState<ClassOfficer | null>(null);

  // Seat Assignment Modal
  const [selectedSeatForAssign, setSelectedSeatForAssign] = useState<SeatPosition | null>(null);
  const [seatAssignStudentId, setSeatAssignStudentId] = useState('');
  const [seatAssignNote, setSeatAssignNote] = useState('');
  const [submittingSeat, setSubmittingSeat] = useState(false);

  // Auto arrange modal
  const [isAutoArrangeModalOpen, setIsAutoArrangeModalOpen] = useState(false);
  const [autoArrangeMode, setAutoArrangeMode] = useState<'byGroup' | 'alternatingGender' | 'alphabetical' | 'clear'>('byGroup');

  // Load Data for Class
  const loadClassData = useCallback(async () => {
    if (!selectedClassId) return;
    try {
      setLoadingOfficers(true);
      setLoadingChart(true);
      const [officersData, chartData] = await Promise.all([
        api.getClassOfficers(selectedClassId),
        api.getSeatingChart(selectedClassId)
      ]);
      setOfficers(officersData);
      setSeatingChart(chartData);
    } catch (err: any) {
      error(err.message || 'Lỗi khi tải dữ liệu tổ chức lớp');
    } finally {
      setLoadingOfficers(false);
      setLoadingChart(false);
    }
  }, [selectedClassId, error]);

  useEffect(() => {
    loadClassData();
    setSwapSourceSeatId(null);
  }, [loadClassData]);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const classStudents = useMemo(() => {
    return students.filter(s => s.classId === selectedClassId && s.status === 'active');
  }, [students, selectedClassId]);

  // Seated vs Unseated Students
  const seatedStudentIds = useMemo(() => {
    if (!seatingChart) return new Set<string>();
    return new Set(seatingChart.seats.map(s => s.studentId).filter(Boolean) as string[]);
  }, [seatingChart]);

  const unseatedStudents = useMemo(() => {
    return classStudents.filter(s => !seatedStudentIds.has(s.id));
  }, [classStudents, seatedStudentIds]);

  // Officer Map for badges
  const officerMap = useMemo(() => {
    const map = new Map<string, ClassOfficer>();
    officers.forEach(o => {
      map.set(o.studentId, o);
    });
    return map;
  }, [officers]);

  // Officer Handlers
  const handleOpenAddOfficer = () => {
    setEditingOfficer(null);
    setOfficerFormRole('LOP_TRUONG');
    setOfficerFormStudentId('');
    setOfficerFormDuty(OFFICER_ROLE_CONFIG.LOP_TRUONG.defaultDuty);
    setOfficerFormPhone('');
    setOfficerFormCustomTitle('');
    setIsOfficerModalOpen(true);
  };

  const handleOpenEditOfficer = (officer: ClassOfficer) => {
    setEditingOfficer(officer);
    setOfficerFormRole(officer.role);
    setOfficerFormStudentId(officer.studentId);
    setOfficerFormDuty(officer.duty || OFFICER_ROLE_CONFIG[officer.role]?.defaultDuty || '');
    setOfficerFormPhone(officer.contactPhone || '');
    setOfficerFormCustomTitle(officer.customRoleTitle || '');
    setIsOfficerModalOpen(true);
  };

  const handleRoleChangeInForm = (role: OfficerRole) => {
    setOfficerFormRole(role);
    if (!editingOfficer) {
      setOfficerFormDuty(OFFICER_ROLE_CONFIG[role]?.defaultDuty || '');
    }
  };

  const handleSubmitOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerFormStudentId) {
      error('Vui lòng chọn học sinh');
      return;
    }
    try {
      setSubmittingOfficer(true);
      if (editingOfficer) {
        await api.updateClassOfficer(selectedClassId, editingOfficer.id, {
          role: officerFormRole,
          studentId: officerFormStudentId,
          customRoleTitle: officerFormRole === 'KHAC' ? officerFormCustomTitle : undefined,
          duty: officerFormDuty.trim(),
          contactPhone: officerFormPhone.trim()
        });
        success('Đã cập nhật thông tin ban cán sự');
      } else {
        await api.assignClassOfficer(selectedClassId, {
          studentId: officerFormStudentId,
          role: officerFormRole,
          customRoleTitle: officerFormRole === 'KHAC' ? officerFormCustomTitle : undefined,
          duty: officerFormDuty.trim(),
          contactPhone: officerFormPhone.trim()
        });
        success('Đã phân công ban cán sự thành công');
      }
      setIsOfficerModalOpen(false);
      await loadClassData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      error(err.message || 'Lỗi khi lưu thông tin ban cán sự');
    } finally {
      setSubmittingOfficer(false);
    }
  };

  const handleDeleteOfficer = async () => {
    if (!deleteOfficerTarget) return;
    try {
      setSubmittingOfficer(true);
      await api.removeClassOfficer(selectedClassId, deleteOfficerTarget.id);
      success('Đã hủy phân công chức vụ ban cán sự');
      setDeleteOfficerTarget(null);
      await loadClassData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      error(err.message || 'Lỗi khi xóa phân công');
    } finally {
      setSubmittingOfficer(false);
    }
  };

  // Seating Chart Handlers
  const handleSeatClick = (seat: SeatPosition) => {
    // If in swap mode
    if (swapSourceSeatId) {
      if (swapSourceSeatId === seat.seatId) {
        // Cancel swap mode
        setSwapSourceSeatId(null);
        return;
      }
      handleExecuteSwap(swapSourceSeatId, seat.seatId);
      return;
    }

    // Normal click: open assign/edit modal
    setSelectedSeatForAssign(seat);
    setSeatAssignStudentId(seat.studentId || '');
    setSeatAssignNote(seat.note || '');
  };

  const handleStartSwap = (e: React.MouseEvent, seatId: string) => {
    e.stopPropagation();
    setSwapSourceSeatId(seatId);
    success('Đã chọn vị trí gốc. Hãy bấm vào vị trí ghế thứ hai để hoán đổi chỗ ngồi.');
  };

  const handleExecuteSwap = async (seatIdA: string, seatIdB: string) => {
    try {
      setLoadingChart(true);
      const updatedChart = await api.swapSeats(selectedClassId, seatIdA, seatIdB);
      setSeatingChart(updatedChart);
      setSwapSourceSeatId(null);
      success('Đã hoán đổi vị trí chỗ ngồi thành công!');
    } catch (err: any) {
      error(err.message || 'Lỗi khi đổi chỗ ngồi');
    } finally {
      setLoadingChart(false);
    }
  };

  const handleSaveSeatAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeatForAssign) return;
    try {
      setSubmittingSeat(true);
      const updatedChart = await api.assignSeat(
        selectedClassId,
        selectedSeatForAssign.seatId,
        seatAssignStudentId || undefined,
        seatAssignNote.trim()
      );
      setSeatingChart(updatedChart);
      setSelectedSeatForAssign(null);
      success('Đã cập nhật vị trí chỗ ngồi!');
    } catch (err: any) {
      error(err.message || 'Lỗi khi xếp chỗ ngồi');
    } finally {
      setSubmittingSeat(false);
    }
  };

  const handleRemoveStudentFromSeat = async (seatId: string) => {
    try {
      setLoadingChart(true);
      const updatedChart = await api.assignSeat(selectedClassId, seatId, undefined);
      setSeatingChart(updatedChart);
      success('Đã để trống vị trí ghế này');
    } catch (err: any) {
      error(err.message || 'Lỗi khi rời chỗ ngồi');
    } finally {
      setLoadingChart(false);
    }
  };

  const handleAutoArrange = async () => {
    try {
      setLoadingChart(true);
      const updatedChart = await api.autoArrangeSeats(selectedClassId, autoArrangeMode);
      setSeatingChart(updatedChart);
      setIsAutoArrangeModalOpen(false);
      success('Đã tự động sắp xếp chỗ ngồi theo yêu cầu!');
    } catch (err: any) {
      error(err.message || 'Lỗi khi tự động sắp xếp chỗ');
    } finally {
      setLoadingChart(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-slate-800">Tổ chức Lớp & Sơ đồ Chỗ ngồi</h2>
          </div>
          <p className="text-xs text-slate-500">
            Phân công ban cán sự lớp (lớp trưởng, lớp phó, thủ quỹ) và quản lý trực quan sơ đồ chỗ ngồi cho học sinh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Class Select Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500">Lớp:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  Lớp {c.name} ({c.academicYear})
                </option>
              ))}
            </select>
          </div>

          {/* Tab Navigation Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('officers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'officers'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Ban cán sự lớp</span>
            </button>
            <button
              onClick={() => setActiveTab('seating')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'seating'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Sơ đồ chỗ ngồi</span>
            </button>
          </div>

          {activeTab === 'officers' ? (
            <button
              onClick={handleOpenAddOfficer}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Phân công chức vụ</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAutoArrangeModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-all cursor-pointer"
                title="Tự động xếp chỗ ngồi theo tổ, xen kẽ nam nữ hoặc theo A-Z"
              >
                <Shuffle className="w-4 h-4" />
                <span>Tự động xếp chỗ</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
                title="In sơ đồ chỗ ngồi"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>In sơ đồ</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: BAN CÁN SỰ LỚP (CLASS OFFICERS)                         */}
      {/* ============================================================ */}
      {activeTab === 'officers' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Chức vụ cán sự</span>
                <Crown className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-800">{officers.length} <span className="text-xs font-medium text-slate-500">vị trí</span></div>
              <div className="text-[11px] text-slate-400 mt-1">Lớp {selectedClass?.name}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Lớp trưởng</span>
                <Crown className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-sm font-black text-slate-800 truncate">
                {officers.find(o => o.role === 'LOP_TRUONG')?.studentName || (
                  <span className="text-slate-400 font-normal italic">Chưa phân công</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Phụ trách chung</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Thủ quỹ</span>
                <Coins className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-sm font-black text-slate-800 truncate">
                {officers.find(o => o.role === 'THU_QUY')?.studentName || (
                  <span className="text-slate-400 font-normal italic">Chưa phân công</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Quản lý quỹ lớp</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Sĩ số lớp</span>
                <Users className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-black text-slate-800">{classStudents.length} <span className="text-xs font-medium text-slate-500">học sinh</span></div>
              <div className="text-[11px] text-slate-400 mt-1">GVCN: {selectedClass?.homeroomTeacher}</div>
            </div>
          </div>

          {/* Officers Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>Danh sách Ban Cán Sự Lớp {selectedClass?.name}</span>
                <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full font-bold">
                  {officers.length} thành viên
                </span>
              </h3>
            </div>

            {loadingOfficers ? (
              <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
                Đang tải danh sách ban cán sự...
              </div>
            ) : officers.length === 0 ? (
              <div className="p-10 bg-white border border-dashed border-slate-200 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Chưa có ban cán sự cho lớp {selectedClass?.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 max-w-md mx-auto">
                    Bấm "Phân công chức vụ" để chỉ định lớp trưởng, các lớp phó học tập, kỷ luật, lao động, phong trào và thủ quỹ.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddOfficer}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl cursor-pointer"
                >
                  + Phân công ngay
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {officers.map(officer => {
                  const cfg = OFFICER_ROLE_CONFIG[officer.role] || OFFICER_ROLE_CONFIG.KHAC;
                  const Icon = cfg.icon;
                  const student = classStudents.find(s => s.id === officer.studentId);
                  const displayTitle = officer.role === 'KHAC' && officer.customRoleTitle ? officer.customRoleTitle : cfg.label;

                  return (
                    <div 
                      key={officer.id}
                      className={`bg-white rounded-2xl p-4.5 border transition-all hover:shadow-sm flex flex-col justify-between ${cfg.border} border-l-4`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`p-2 rounded-xl ${cfg.bg} ${cfg.color}`}>
                              <Icon className="w-5 h-5" />
                            </span>
                            <div>
                              <span className={`text-[11px] font-black uppercase tracking-wider ${cfg.color}`}>
                                {displayTitle}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900 mt-0.5">{officer.studentName}</h4>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditOfficer(officer)}
                              className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="Chỉnh sửa"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteOfficerTarget(officer)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hủy chức vụ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Mã số: <strong>{officer.studentCode}</strong></span>
                            <span>Giới tính: <strong>{student?.gender === 'female' ? 'Nữ' : 'Nam'}</strong></span>
                          </div>

                          {officer.duty && (
                            <p className="text-[11px] text-slate-600 leading-relaxed pt-1 border-t border-slate-200/60">
                              <span className="font-semibold text-slate-700">Nhiệm vụ: </span>
                              {officer.duty}
                            </p>
                          )}

                          {officer.contactPhone && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>Liên hệ: <strong className="text-slate-700">{officer.contactPhone}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Bổ nhiệm: {officer.appointedDate || 'Đầu năm học'}</span>
                        <span className="text-teal-700 font-semibold">Lớp {selectedClass?.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: SƠ ĐỒ CHỖ NGỒI (SEATING CHART)                         */}
      {/* ============================================================ */}
      {activeTab === 'seating' && (
        <div className="space-y-6">
          {/* Swap Mode Alert Banner */}
          {swapSourceSeatId && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <ArrowLeftRight className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>Đang chọn ghế vị trí [{swapSourceSeatId}]. Hãy bấm vào ghế thứ hai bạn muốn hoán đổi.</span>
              </div>
              <button
                onClick={() => setSwapSourceSeatId(null)}
                className="px-3 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100 rounded-lg cursor-pointer"
              >
                Hủy chế độ đổi chỗ
              </button>
            </div>
          )}

          {/* Unseated Students Strip */}
          {unseatedStudents.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Còn {unseatedStudents.length} học sinh chưa được xếp chỗ ngồi:</span>
                </div>
                <span className="text-[11px] text-amber-700 font-medium">Bấm vào ghế trống bất kỳ để xếp học sinh vào</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {unseatedStudents.map(stu => (
                  <span
                    key={stu.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-amber-200 text-slate-800 text-xs font-semibold rounded-xl shadow-2xs"
                  >
                    <span>{stu.fullName}</span>
                    <span className="text-[10px] text-slate-400">({stu.studentCode})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Blackboard / Podium Representation */}
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="p-3.5 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white rounded-2xl text-center shadow-sm border border-slate-700 flex items-center justify-between px-6">
              <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Cửa ra vào</div>
              <div className="font-extrabold text-xs sm:text-sm uppercase tracking-widest text-emerald-300 flex items-center gap-2 justify-center">
                <span>📚 BỤC GIẢNG & BẢNG LỚP HỌC</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Bàn giáo viên 🧑‍🏫</div>
            </div>

            {/* Seating Grid */}
            {loadingChart || !seatingChart ? (
              <div className="p-16 text-center text-slate-400 text-xs animate-pulse">
                Đang tải sơ đồ lớp học...
              </div>
            ) : (
              <div className="bg-slate-100/70 p-5 rounded-3xl border border-slate-200/80 shadow-inner">
                {/* 5 Rows */}
                <div className="space-y-4">
                  {Array.from({ length: seatingChart.rows }, (_, rIdx) => {
                    const rowNum = rIdx + 1;

                    return (
                      <div key={`row-${rowNum}`} className="flex items-center gap-3">
                        <div className="w-8 shrink-0 text-center font-black text-xs text-slate-400">
                          H{rowNum}
                        </div>

                        {/* Columns (Dãy bàn) */}
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                          {Array.from({ length: seatingChart.columns }, (_, cIdx) => {
                            const colNum = cIdx + 1;
                            const seat1Id = `R${rowNum}-C${colNum}-S1`;
                            const seat2Id = `R${rowNum}-C${colNum}-S2`;
                            const seat1 = seatingChart.seats.find(s => s.seatId === seat1Id);
                            const seat2 = seatingChart.seats.find(s => s.seatId === seat2Id);

                            return (
                              <div 
                                key={`desk-${rowNum}-${colNum}`}
                                className="bg-white rounded-2xl p-2 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col"
                              >
                                <div className="text-[10px] font-black text-slate-400 text-center pb-1 border-b border-slate-100 mb-1.5 flex items-center justify-between px-1">
                                  <span>Dãy {colNum}</span>
                                  <span>Bàn {rowNum}</span>
                                </div>

                                {/* 2 Seats per Desk */}
                                <div className="grid grid-cols-2 gap-1.5 flex-1">
                                  {[seat1, seat2].map((seat, sIdx) => {
                                    if (!seat) return null;
                                    const isOccupied = !!seat.studentId;
                                    const officer = seat.studentId ? officerMap.get(seat.studentId) : null;
                                    const isSwapSource = swapSourceSeatId === seat.seatId;
                                    const student = seat.studentId ? classStudents.find(st => st.id === seat.studentId) : null;

                                    return (
                                      <div
                                        key={seat.seatId}
                                        onClick={() => handleSeatClick(seat)}
                                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between min-h-[75px] ${
                                          isSwapSource
                                            ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300 shadow-sm'
                                            : isOccupied
                                              ? 'bg-slate-50/80 hover:bg-slate-100 border-slate-200'
                                              : 'bg-white hover:bg-teal-50/50 border-dashed border-slate-300 hover:border-teal-300'
                                        }`}
                                      >
                                        {isOccupied ? (
                                          <div>
                                            {officer && (
                                              <span className="inline-block px-1.5 py-0.2 text-[9px] font-black rounded-full bg-amber-100 text-amber-800 mb-0.5 truncate max-w-full">
                                                ⭐ {officer.role === 'LOP_TRUONG' ? 'Lớp trưởng' : officer.role === 'THU_QUY' ? 'Thủ quỹ' : 'Cán sự'}
                                              </span>
                                            )}
                                            <p className="text-[11px] font-bold text-slate-800 leading-tight truncate" title={seat.studentName}>
                                              {seat.studentName}
                                            </p>
                                            <div className="flex items-center justify-center gap-1 mt-0.5 text-[9px] text-slate-400">
                                              <span>{seat.studentCode}</span>
                                              {student && (
                                                <span className={student.gender === 'female' ? 'text-pink-500 font-bold' : 'text-blue-500 font-bold'}>
                                                  • {student.gender === 'female' ? 'Nữ' : 'Nam'}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="py-2 text-slate-300 text-[11px] font-medium flex flex-col items-center justify-center">
                                            <span>Trống</span>
                                          </div>
                                        )}

                                        <div className="pt-1 mt-1 border-t border-slate-200/50 flex items-center justify-between text-[9px]">
                                          <span className="text-slate-400 font-mono text-[8px]">{sIdx === 0 ? 'T' : 'P'}</span>
                                          {isOccupied && (
                                            <button
                                              onClick={(e) => handleStartSwap(e, seat.seatId)}
                                              className="p-0.5 text-slate-400 hover:text-amber-600 rounded cursor-pointer"
                                              title="Hoán đổi chỗ này với ghế khác"
                                            >
                                              <ArrowLeftRight className="w-2.5 h-2.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Note & Summary Bar */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span>Tổng chỗ ngồi: <strong>{seatingChart?.seats.length || 40}</strong></span>
                <span>Đã có học sinh: <strong className="text-teal-700">{seatedStudentIds.size}</strong></span>
                <span>Ghế trống: <strong className="text-slate-700">{(seatingChart?.seats.length || 40) - seatedStudentIds.size}</strong></span>
              </div>
              <p className="italic text-[11px] text-slate-400">
                {seatingChart?.teacherNote || 'Quy ước: T = Vị trí Trái, P = Vị trí Phải trong bàn'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ASSIGN/EDIT OFFICER                                   */}
      {/* ============================================================ */}
      {isOfficerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
                  <Crown className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-800">
                  {editingOfficer ? 'Chỉnh sửa chức vụ ban cán sự' : 'Phân công chức vụ mới'}
                </h3>
              </div>
              <button 
                onClick={() => setIsOfficerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitOfficer} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chức vụ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={officerFormRole}
                  onChange={(e) => handleRoleChangeInForm(e.target.value as OfficerRole)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-200 bg-white"
                >
                  <option value="LOP_TRUONG">Lớp trưởng (Phụ trách chung)</option>
                  <option value="LOP_PHO_HOC_TAP">Lớp phó Học tập</option>
                  <option value="LOP_PHO_KY_LUAT">Lớp phó Kỷ luật / Trật tự</option>
                  <option value="LOP_PHO_LAO_DONG">Lớp phó Lao động / Đời sống</option>
                  <option value="LOP_PHO_PHONG_TRAO">Lớp phó Phong trào / Văn thể mỹ</option>
                  <option value="THU_QUY">Thủ quỹ (Quản lý thu chi quỹ lớp)</option>
                  <option value="TO_TRUONG">Tổ trưởng</option>
                  <option value="TO_PHO">Tổ phó</option>
                  <option value="KHAC">Chức vụ khác...</option>
                </select>
              </div>

              {officerFormRole === 'KHAC' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên chức vụ cụ thể <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Cán sự môn Toán, Đội trưởng Sao đỏ..."
                    value={officerFormCustomTitle}
                    onChange={(e) => setOfficerFormCustomTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-200"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Học sinh đảm nhiệm <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={officerFormStudentId}
                  onChange={(e) => setOfficerFormStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-200 bg-white"
                >
                  <option value="">-- Chọn học sinh từ danh sách lớp --</option>
                  {classStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.studentCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả nhiệm vụ
                </label>
                <textarea
                  rows={2}
                  value={officerFormDuty}
                  onChange={(e) => setOfficerFormDuty(e.target.value)}
                  placeholder="Ghi chú cụ thể các đầu việc cần theo dõi..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-200 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số điện thoại liên hệ (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="09xx xxx xxx"
                  value={officerFormPhone}
                  onChange={(e) => setOfficerFormPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOfficerModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingOfficer}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submittingOfficer ? 'Đang lưu...' : 'Xác nhận phân công'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ASSIGN SEAT TO STUDENT                                */}
      {/* ============================================================ */}
      {selectedSeatForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Xếp chỗ ngồi</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vị trí: Hàng {selectedSeatForAssign.row}, Dãy {selectedSeatForAssign.column} (Ghế {selectedSeatForAssign.seatIndex === 1 ? 'Trái' : 'Phải'})
                </p>
              </div>
              <button 
                onClick={() => setSelectedSeatForAssign(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSeatAssignment} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Học sinh ngồi tại vị trí này
                </label>
                <select
                  value={seatAssignStudentId}
                  onChange={(e) => setSeatAssignStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-200 bg-white"
                >
                  <option value="">-- Để trống ghế này --</option>
                  {/* Prioritize unseated students first */}
                  <optgroup label="Học sinh chưa xếp chỗ">
                    {unseatedStudents.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.studentCode})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Tất cả học sinh trong lớp">
                    {classStudents.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.studentCode}) {seatedStudentIds.has(s.id) ? '[Đang ngồi chỗ khác]' : ''}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Nếu chọn học sinh đang ngồi ở ghế khác, vị trí cũ của học sinh đó sẽ tự động được làm trống.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú vị trí (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cận thị, thường mất tập trung..."
                  value={seatAssignNote}
                  onChange={(e) => setSeatAssignNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {selectedSeatForAssign.studentId ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleRemoveStudentFromSeat(selectedSeatForAssign.seatId);
                      setSelectedSeatForAssign(null);
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                  >
                    Rời khỏi chỗ này
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSeatForAssign(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submittingSeat}
                    className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submittingSeat ? 'Đang lưu...' : 'Lưu vị trí'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: AUTO ARRANGE SEATS                                    */}
      {/* ============================================================ */}
      {isAutoArrangeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
                  <Shuffle className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-800">Tự động xếp chỗ ngồi</h3>
              </div>
              <button 
                onClick={() => setIsAutoArrangeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Chọn chế độ sắp xếp vị trí ghế cho toàn bộ {classStudents.length} học sinh lớp {selectedClass?.name}:
              </p>

              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="autoArrangeMode"
                    checked={autoArrangeMode === 'byGroup'}
                    onChange={() => setAutoArrangeMode('byGroup')}
                    className="mt-0.5 text-teal-700"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Xếp theo Tổ thi đua</div>
                    <div className="text-[11px] text-slate-500">Các thành viên cùng tổ (Tổ 1, Tổ 2, ...) sẽ ngồi gần nhau theo từng dãy bàn.</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="autoArrangeMode"
                    checked={autoArrangeMode === 'alternatingGender'}
                    onChange={() => setAutoArrangeMode('alternatingGender')}
                    className="mt-0.5 text-teal-700"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Xếp xen kẽ Nam - Nữ</div>
                    <div className="text-[11px] text-slate-500">Bố trí nam và nữ xen kẽ nhau nhằm giữ nề nếp và kỷ cương trong giờ học.</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="autoArrangeMode"
                    checked={autoArrangeMode === 'alphabetical'}
                    onChange={() => setAutoArrangeMode('alphabetical')}
                    className="mt-0.5 text-teal-700"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Xếp theo thứ tự A - Z</div>
                    <div className="text-[11px] text-slate-500">Theo thứ tự bảng chữ cái họ tên, thuận tiện cho việc điểm danh và kiểm tra bài.</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="autoArrangeMode"
                    checked={autoArrangeMode === 'clear'}
                    onChange={() => setAutoArrangeMode('clear')}
                    className="mt-0.5 text-rose-600"
                  />
                  <div>
                    <div className="text-xs font-bold text-rose-800">Xóa trắng sơ đồ chỗ ngồi</div>
                    <div className="text-[11px] text-rose-600">Làm trống tất cả các ghế để bắt đầu xếp thủ công từ đầu.</div>
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAutoArrangeModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={loadingChart}
                  onClick={handleAutoArrange}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{loadingChart ? 'Đang xếp...' : 'Áp dụng xếp chỗ'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Officer Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteOfficerTarget}
        title="Xác nhận hủy phân công ban cán sự"
        message={`Bạn có chắc chắn muốn hủy phân công chức vụ "${OFFICER_ROLE_CONFIG[deleteOfficerTarget?.role || 'KHAC']?.label}" của học sinh ${deleteOfficerTarget?.studentName}?`}
        confirmText="Hủy phân công"
        cancelText="Giữ lại"
        isDestructive={true}
        isLoading={submittingOfficer}
        onConfirm={handleDeleteOfficer}
        onCancel={() => setDeleteOfficerTarget(null)}
      />
    </div>
  );
};
