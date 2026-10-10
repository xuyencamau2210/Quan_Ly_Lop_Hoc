import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trophy, 
  PlusCircle, 
  BookOpen, 
  UserCheck, 
  Crown, 
  ShieldCheck, 
  History, 
  BarChart3,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { 
  Classroom, Student, EmulationCategory, EmulationPeriod, EmulationRecord 
} from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../components/Toast.tsx';

// Sub-screens
import { EmulationOverview } from './EmulationOverview.tsx';
import { EmulationRecordForm } from './EmulationRecordForm.tsx';
import { EmulationCategoryManager } from './EmulationCategoryManager.tsx';
import { EmulationStudentLog } from './EmulationStudentLog.tsx';
import { EmulationGroupRanking } from './EmulationGroupRanking.tsx';
import { EmulationWeeklySummary } from './EmulationWeeklySummary.tsx';
import { EmulationSummaryHistory } from './EmulationSummaryHistory.tsx';
import { EmulationReports } from './EmulationReports.tsx';

import { EmulationGroupManager } from './EmulationGroupManager.tsx';
import { EmulationPeriodModal } from './EmulationPeriodModal.tsx';
import { Users } from 'lucide-react';

export type EmulationSubScreen = 
  | 'overview'
  | 'records'
  | 'group-manager'
  | 'catalog'
  | 'student-log'
  | 'group-ranking'
  | 'weekly-summary'
  | 'summary-history'
  | 'reports';

interface EmulationViewProps {
  classes: Classroom[];
  students: Student[];
  initialClassId?: string;
}

export const EmulationView: React.FC<EmulationViewProps> = ({
  classes,
  students,
  initialClassId
}) => {
  const { error } = useToast();

  const [activeSubScreen, setActiveSubScreen] = useState<EmulationSubScreen>('overview');
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);

  // Shared Filters
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || classes[0]?.id || ''
  );
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');

  // Emulation Data State
  const [categories, setCategories] = useState<EmulationCategory[]>([]);
  const [periods, setPeriods] = useState<EmulationPeriod[]>([]);
  const [records, setRecords] = useState<EmulationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Emulation Core Data
  const loadEmulationData = useCallback(async () => {
    try {
      setLoading(true);
      const [cats, perList, recList] = await Promise.all([
        api.getEmulationCategories(),
        api.getEmulationPeriods(),
        api.getEmulationRecords()
      ]);

      setCategories(cats);
      setPeriods(perList);
      setRecords(recList);

      if (perList.length > 0 && !selectedPeriodId) {
        setSelectedPeriodId(perList[0].MaKy);
      }
    } catch (err: any) {
      error(err.message || 'Lỗi khi tải dữ liệu phân hệ thi đua');
    } finally {
      setLoading(false);
    }
  }, [error, selectedPeriodId]);

  useEffect(() => {
    loadEmulationData();
  }, [loadEmulationData]);

  const navItems: { id: EmulationSubScreen; label: string; icon: any }[] = [
    { id: 'overview', label: '1. Tổng quan thi đua', icon: Trophy },
    { id: 'records', label: '2. Ghi nhận sự việc', icon: PlusCircle },
    { id: 'group-manager', label: '3. Quản lý tổ & Phân tổ', icon: Users },
    { id: 'catalog', label: '4. Danh mục thi đua', icon: BookOpen },
    { id: 'student-log', label: '5. Sổ theo dõi học sinh', icon: UserCheck },
    { id: 'group-ranking', label: '6. Xếp hạng theo tổ', icon: Crown },
    { id: 'weekly-summary', label: '7. Tổng kết & Khóa sổ', icon: ShieldCheck },
    { id: 'summary-history', label: '8. Lịch sử đã tổng kết', icon: History },
    { id: 'reports', label: '9. Báo cáo thi đua', icon: BarChart3 }
  ];

  return (
    <div className="space-y-6">
      {/* Sub-navigation tabs with Calendar Period Manager trigger */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSubScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveSubScreen(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-xs shadow-teal-200 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsPeriodModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 rounded-xl whitespace-nowrap transition-all cursor-pointer shrink-0 shadow-2xs"
          title="Quản lý lịch các tuần thi đua bắt đầu từ 07/09/2026"
        >
          <Calendar className="w-3.5 h-3.5 text-teal-700" />
          <span>Lịch tuần thi đua</span>
        </button>
      </div>

      {/* Screen Container */}
      <div>
        {activeSubScreen === 'overview' && (
          <EmulationOverview
            classes={classes}
            periods={periods}
            records={records}
            selectedClassId={selectedClassId}
            selectedPeriodId={selectedPeriodId}
            onNavigateSubScreen={(id) => setActiveSubScreen(id as EmulationSubScreen)}
          />
        )}

        {activeSubScreen === 'records' && (
          <EmulationRecordForm
            classes={classes}
            students={students}
            categories={categories}
            periods={periods}
            records={records}
            selectedClassId={selectedClassId}
            selectedPeriodId={selectedPeriodId}
            onRefresh={loadEmulationData}
          />
        )}

        {activeSubScreen === 'group-manager' && (
          <EmulationGroupManager
            classes={classes}
            students={students}
            selectedClassId={selectedClassId}
            onSelectClassId={setSelectedClassId}
            onRefresh={loadEmulationData}
          />
        )}

        {activeSubScreen === 'catalog' && (
          <EmulationCategoryManager
            categories={categories}
            onRefresh={loadEmulationData}
          />
        )}

        {activeSubScreen === 'student-log' && (
          <EmulationStudentLog
            classes={classes}
            students={students}
            periods={periods}
            selectedClassId={selectedClassId}
            selectedPeriodId={selectedPeriodId}
          />
        )}

        {activeSubScreen === 'group-ranking' && (
          <EmulationGroupRanking
            classes={classes}
            students={students}
            periods={periods}
            selectedClassId={selectedClassId}
            selectedPeriodId={selectedPeriodId}
            onRefresh={loadEmulationData}
            onNavigateToGroupManager={() => setActiveSubScreen('group-manager')}
          />
        )}

        {activeSubScreen === 'weekly-summary' && (
          <EmulationWeeklySummary
            classes={classes}
            periods={periods}
            selectedClassId={selectedClassId}
            selectedPeriodId={selectedPeriodId}
            onRefresh={loadEmulationData}
          />
        )}

        {activeSubScreen === 'summary-history' && (
          <EmulationSummaryHistory
            classes={classes}
            periods={periods}
            selectedClassId={selectedClassId}
          />
        )}

        {activeSubScreen === 'reports' && (
          <EmulationReports
            classes={classes}
            periods={periods}
            selectedClassId={selectedClassId}
            selectedPeriodId={selectedPeriodId}
          />
        )}
      </div>

      {/* Emulation Period Calendar & Reset Modal */}
      <EmulationPeriodModal
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        periods={periods}
        onRefresh={loadEmulationData}
      />
    </div>
  );
};
