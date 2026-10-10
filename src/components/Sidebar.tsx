import React from 'react';
import { 
  LayoutDashboard, 
  School, 
  Users, 
  CalendarCheck, 
  Trophy,
  BarChart3, 
  FileText, 
  Settings,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

export type NavTab = 
  | 'dashboard' 
  | 'classes' 
  | 'students' 
  | 'attendance' 
  | 'emulation'
  | 'reports' 
  | 'documents' 
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  classCount?: number;
  studentCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile,
  classCount = 0,
  studentCount = 0
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Tổng quan',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'classes' as NavTab,
      label: 'Lớp học',
      icon: School,
      badge: classCount ? `${classCount}` : null
    },
    {
      id: 'students' as NavTab,
      label: 'Học sinh',
      icon: Users,
      badge: studentCount ? `${studentCount}` : null
    },
    {
      id: 'attendance' as NavTab,
      label: 'Điểm danh',
      icon: CalendarCheck,
      badge: null
    },
    {
      id: 'emulation' as NavTab,
      label: 'Thi đua tuần',
      icon: Trophy,
      badge: 'Mới'
    },
    {
      id: 'reports' as NavTab,
      label: 'Báo cáo',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'documents' as NavTab,
      label: 'Tài liệu Drive',
      icon: FileText,
      badge: 'Drive'
    },
    {
      id: 'settings' as NavTab,
      label: 'Cài đặt',
      icon: Settings,
      badge: null
    }
  ];

  const handleSelect = (tab: NavTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="px-3 py-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Danh mục chức năng
            </span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info box */}
        <div className="p-4 border-t border-slate-100">
          <div className="p-3 bg-gradient-to-br from-slate-50 to-indigo-50/50 rounded-xl border border-slate-200/60">
            <div className="flex items-center gap-2 mb-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">Kiến trúc dữ liệu</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Server Store hoạt động • Chuẩn bị kết nối Google Sheets & Drive
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
