import React, { useState, useEffect } from 'react';
import { 
  History, 
  Lock, 
  Unlock, 
  Calendar, 
  CheckCircle2, 
  Users, 
  Award, 
  Crown, 
  Eye, 
  Clock,
  Sparkles
} from 'lucide-react';
import { Classroom, EmulationPeriod, WeeklyStudentSummary, WeeklyGroupSummary } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../components/Toast.tsx';

interface EmulationSummaryHistoryProps {
  classes: Classroom[];
  periods: EmulationPeriod[];
  selectedClassId: string;
}

export const EmulationSummaryHistory: React.FC<EmulationSummaryHistoryProps> = ({
  classes,
  periods,
  selectedClassId
}) => {
  const { error } = useToast();

  const [currentClassId, setCurrentClassId] = useState<string>(selectedClassId || classes[0]?.id || '');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [studentSnapshots, setStudentSnapshots] = useState<WeeklyStudentSummary[]>([]);
  const [groupSnapshots, setGroupSnapshots] = useState<WeeklyGroupSummary[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter periods that are locked (DA_KHOA)
  const lockedPeriods = periods.filter(p => p.TrangThai === 'DA_KHOA');

  useEffect(() => {
    if (lockedPeriods.length > 0 && !selectedPeriodId) {
      setSelectedPeriodId(lockedPeriods[0].MaKy);
    }
  }, [lockedPeriods, selectedPeriodId]);

  useEffect(() => {
    if (!selectedPeriodId || !currentClassId) return;
    loadPeriodSnapshots(currentClassId, selectedPeriodId);
  }, [selectedPeriodId, currentClassId]);

  const loadPeriodSnapshots = async (clsId: string, pId: string) => {
    try {
      setLoading(true);
      const [studentsData, groupsData] = await Promise.all([
        api.calculateStudentWeeklyScores(clsId, pId),
        api.calculateGroupWeeklyScores(clsId, pId)
      ]);
      setStudentSnapshots(studentsData);
      setGroupSnapshots(groupsData);
    } catch (err: any) {
      error(err.message || 'Lỗi khi tải lịch sử snapshot tuần');
    } finally {
      setLoading(false);
    }
  };

  const currentPeriod = periods.find(p => p.MaKy === selectedPeriodId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-800">Lịch sử Các Tuần Đã Tổng Kết (Snapshots)</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Kho lưu trữ bất biến các kết quả thi đua đã khóa sổ theo từng tuần học
        </p>
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
            <span className="text-xs font-bold text-slate-600">Tuần đã khóa:</span>
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
            >
              {lockedPeriods.length === 0 ? (
                <option value="">Chưa có tuần nào khóa sổ</option>
              ) : (
                lockedPeriods.map((p) => (
                  <option key={p.MaKy} value={p.MaKy}>
                    Tuần {p.TuanSo} ({p.MaKy}) - Khóa bởi: {p.NguoiKhoa}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {currentPeriod && (
          <div className="text-xs text-slate-500">
            Từ <strong>{new Date(currentPeriod.TuNgay).toLocaleDateString('vi-VN')}</strong> đến{' '}
            <strong>{new Date(currentPeriod.DenNgay).toLocaleDateString('vi-VN')}</strong>
          </div>
        )}
      </div>

      {lockedPeriods.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-slate-700 text-sm">Chưa có tuần thi đua nào được khóa sổ</p>
          <p className="text-xs text-slate-500 mt-1">
            Vào màn hình "Tổng kết và khóa sổ tuần" để thực hiện chốt kết quả tuần đầu tiên.
          </p>
        </div>
      ) : loading ? (
        <div className="p-12 text-center text-slate-400 animate-pulse text-xs">
          Đang tải dữ liệu lưu trữ tuần đã khóa...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Group Rankings Snapshot Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                Snapshot Xếp Hạng Tổ ({currentPeriod?.MaKy})
              </h3>
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                Đã khóa bất biến
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {groupSnapshots.map((g) => (
                <div key={g.MaTo} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm">{g.TenTo}</span>
                    <span className="text-xs font-black bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700">
                      Hạng {g.XepHang}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1 pt-1">
                    <div className="flex justify-between">
                      <span>Điểm bình quân:</span>
                      <strong className="text-indigo-700 font-black">{g.DiemBinhQuan}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Tổng điểm tổ:</span>
                      <strong className="text-slate-800">{g.TongDiem}</strong>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Số thành viên:</span>
                      <span>{g.SoThanhVien} em</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Rankings Snapshot Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                Snapshot Xếp Hạng Học Sinh ({currentPeriod?.MaKy})
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {studentSnapshots.length} học sinh
              </span>
            </div>

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
                  {studentSnapshots.map((s) => (
                    <tr key={s.MaHS} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 text-center font-black">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                          s.XepHang === 1 
                            ? 'bg-amber-500 text-white' 
                            : s.XepHang === 2 
                            ? 'bg-slate-300 text-slate-800' 
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
