import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Award, 
  Crown, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  UserPlus, 
  Eye,
  X
} from 'lucide-react';
import { Classroom, Student, EmulationPeriod, WeeklyGroupSummary, WeeklyStudentSummary } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../components/Toast.tsx';

interface EmulationGroupRankingProps {
  classes: Classroom[];
  students: Student[];
  periods: EmulationPeriod[];
  selectedClassId: string;
  selectedPeriodId: string;
  onRefresh: () => void;
  onNavigateToGroupManager?: () => void;
}

export const EmulationGroupRanking: React.FC<EmulationGroupRankingProps> = ({
  classes,
  students,
  periods,
  selectedClassId,
  selectedPeriodId,
  onRefresh,
  onNavigateToGroupManager
}) => {
  const { success, error } = useToast();

  const [currentClassId, setCurrentClassId] = useState<string>(selectedClassId || classes[0]?.id || '');
  const [currentPeriodId, setCurrentPeriodId] = useState<string>(selectedPeriodId || periods[0]?.MaKy || '');
  const [groupSummaries, setGroupSummaries] = useState<WeeklyGroupSummary[]>([]);
  const [studentSummaries, setStudentSummaries] = useState<WeeklyStudentSummary[]>([]);
  const [loading, setLoading] = useState(false);

  // Group Details Drawer
  const [viewingGroup, setViewingGroup] = useState<WeeklyGroupSummary | null>(null);

  // Assign Student to Group Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignStudentId, setAssignStudentId] = useState<string>('');
  const [assignGroupId, setAssignGroupId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (!currentClassId || !currentPeriodId) return;
    loadRankings(currentClassId, currentPeriodId);
  }, [currentClassId, currentPeriodId]);

  const loadRankings = async (clsId: string, pId: string) => {
    try {
      setLoading(true);
      const [groups, stuList] = await Promise.all([
        api.calculateGroupWeeklyScores(clsId, pId),
        api.calculateStudentWeeklyScores(clsId, pId)
      ]);
      setGroupSummaries(groups);
      setStudentSummaries(stuList);
    } catch (err: any) {
      error(err.message || 'Lỗi khi tải bảng xếp hạng tổ');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignStudentId || !assignGroupId) {
      error('Vui lòng chọn học sinh và tổ');
      return;
    }

    try {
      setIsAssigning(true);
      await api.assignStudentToGroup({
        MaHS: assignStudentId,
        MaTo: assignGroupId,
        TuNgay: new Date().toISOString().split('T')[0]
      });
      success('Đã cập nhật phân tổ cho học sinh thành công');
      setIsAssignModalOpen(false);
      setAssignStudentId('');
      loadRankings(currentClassId, currentPeriodId);
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Lỗi khi phân tổ học sinh');
    } finally {
      setIsAssigning(false);
    }
  };

  const currentClass = classes.find(c => c.id === currentClassId);
  const classStudents = students.filter(s => s.classId === currentClassId && s.status === 'active');
  const groupMembers = viewingGroup 
    ? studentSummaries.filter(s => s.MaTo === viewingGroup.MaTo)
    : [];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Bảng Xếp hạng Thi đua Theo Tổ</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xếp hạng dựa trên điểm bình quân của các thành viên trong tổ (Điểm bình quân = Tổng điểm / Số thành viên)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onNavigateToGroupManager ? (
            <button
              onClick={onNavigateToGroupManager}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Quản lý tổ & Phân tổ học sinh
            </button>
          ) : (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Phân tổ học sinh
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
            <span className="text-xs font-bold text-slate-600">Tuần thi đua:</span>
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
          Lớp: <strong>{currentClass?.name}</strong> • Sĩ số: <strong>{classStudents.length} học sinh</strong>
        </div>
      </div>

      {/* Group Ranking Cards / Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 animate-pulse text-xs">
          Đang tính điểm xếp hạng các tổ...
        </div>
      ) : groupSummaries.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200">
          Chưa có tổ nào được thiết lập cho lớp học này. Hãy thêm tổ trước.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {groupSummaries.map((g) => {
            const isWinner = g.XepHang === 1 && g.SoThanhVien > 0;
            const hasNoMembers = g.SoThanhVien === 0;

            return (
              <div 
                key={g.MaTo}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-xs hover:shadow-md ${
                  isWinner 
                    ? 'border-amber-300 ring-2 ring-amber-200/60 bg-gradient-to-b from-amber-50/40 to-white' 
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shadow-xs ${
                        isWinner 
                          ? 'bg-amber-500 text-white shadow-amber-200' 
                          : g.XepHang === 2 
                          ? 'bg-slate-300 text-slate-800' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isWinner ? <Crown className="w-4 h-4" /> : `#${g.XepHang}`}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">{g.TenTo}</h3>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {g.SoThanhVien} thành viên
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isWinner ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      Hạng {g.XepHang}
                    </span>
                  </div>

                  {/* Points Highlights */}
                  <div className="my-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-500 font-semibold">Điểm bình quân:</span>
                      <span className="text-xl font-black text-indigo-700">
                        {hasNoMembers ? '--' : g.DiemBinhQuan}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Tổng cộng:</span>
                        <span className="font-bold text-emerald-700">+{g.TongDiemCong}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Tổng trừ:</span>
                        <span className="font-bold text-rose-700">{g.TongDiemTru}</span>
                      </div>
                    </div>

                    <div className="pt-1.5 flex justify-between text-[11px] text-slate-600 border-t border-slate-200/60">
                      <span>Tổng điểm tổ:</span>
                      <strong className="text-slate-900">{g.TongDiem} điểm</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setViewingGroup(g)}
                    className="w-full py-2 px-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100/70 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Xem thành viên ({g.SoThanhVien})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Group Members Detail Modal */}
      {viewingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Danh sách thành viên: {viewingGroup.TenTo}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Điểm tuần {currentPeriodId} • Điểm bình quân: <strong>{viewingGroup.DiemBinhQuan}</strong>
                </p>
              </div>
              <button 
                onClick={() => setViewingGroup(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {groupMembers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Tổ này chưa có thành viên nào được phân vào
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {groupMembers.map((m, idx) => (
                    <div key={m.MaHS} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 text-slate-400 font-bold">{idx + 1}</span>
                        <div>
                          <p className="font-bold text-slate-800">{m.TenHS}</p>
                          <p className="text-[11px] text-slate-400">
                            Hạng cá nhân: #{m.XepHang} • {m.SoThanhTich} khen thưởng, {m.SoViPham} vi phạm
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-sm text-indigo-700">
                          {m.DiemCuoiTuan > 0 ? `+${m.DiemCuoiTuan}` : m.DiemCuoiTuan} đ
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewingGroup(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Student to Group Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Phân tổ học sinh</h3>
                <p className="text-xs text-slate-500 mt-0.5">Xếp hoặc chuyển tổ cho học sinh trong lớp</p>
              </div>
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignStudent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chọn học sinh <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={assignStudentId}
                  onChange={(e) => setAssignStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Chọn học sinh --</option>
                  {classStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.studentCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Xếp vào tổ <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={assignGroupId}
                  onChange={(e) => setAssignGroupId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-indigo-900"
                >
                  <option value="">-- Chọn tổ --</option>
                  {groupSummaries.map((g) => (
                    <option key={g.MaTo} value={g.MaTo}>
                      {g.TenTo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  {isAssigning ? 'Đang lưu...' : 'Lưu phân tổ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
