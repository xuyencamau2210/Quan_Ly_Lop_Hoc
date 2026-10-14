/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar, NavTab } from './components/Sidebar.tsx';
import { ToastProvider, useToast } from './components/Toast.tsx';
import { ConfirmModal } from './components/ConfirmModal.tsx';
import { SyncStatusModal } from './components/SyncStatusModal.tsx';
import { ExcelExportModal } from './components/ExcelExportModal.tsx';

// Views
import { DashboardView } from './views/DashboardView.tsx';
import { ClassesView } from './views/ClassesView.tsx';
import { OrganizationView } from './views/OrganizationView.tsx';
import { StudentsView } from './views/StudentsView.tsx';
import { AttendanceView } from './views/AttendanceView.tsx';
import { EmulationView } from './views/emulation/EmulationView.tsx';
import { ReportsView } from './views/ReportsView.tsx';
import { DocumentsView } from './views/DocumentsView.tsx';
import { SettingsView } from './views/SettingsView.tsx';

// API & Types
import { api } from './services/api.ts';
import { Classroom, Student, DashboardStats, AppSettings } from './types/index.ts';

function MainApp() {
  const { success, error } = useToast();

  // Navigation
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedClassForTab, setSelectedClassForTab] = useState<string | undefined>(undefined);

  // Core Data State
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isExcelExportModalOpen, setIsExcelExportModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Initial load
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [clsData, stuData, statsData, settingsData] = await Promise.all([
        api.getClasses(),
        api.getStudents(),
        api.getStats(),
        api.getSettings()
      ]);

      setClasses(clsData);
      setStudents(stuData);
      setStats(statsData);
      setSettings(settingsData);
    } catch (err: any) {
      console.error('Failed to load initial data:', err);
      error(err.message || 'Không thể kết nối đến máy chủ quản lý');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Refresh stats and counts
  const refreshStatsOnly = useCallback(async () => {
    try {
      const statsData = await api.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error refreshing stats:', err);
    }
  }, []);

  const refreshClassesAndStudents = useCallback(async () => {
    try {
      const [clsData, stuData, statsData] = await Promise.all([
        api.getClasses(),
        api.getStudents(),
        api.getStats()
      ]);
      setClasses(clsData);
      setStudents(stuData);
      setStats(statsData);
    } catch (err: any) {
      error(err.message || 'Lỗi khi đồng bộ danh sách');
    }
  }, [error]);

  const refreshSettings = useCallback(async () => {
    try {
      const settingsData = await api.getSettings();
      setSettings(settingsData);
    } catch (err: any) {
      error(err.message || 'Lỗi khi đồng bộ cài đặt');
    }
  }, [error]);

  // Reset Demo Data
  const handleResetDemo = async () => {
    try {
      setIsResetting(true);
      await api.resetDemoData();
      success('Đã khôi phục dữ liệu mẫu ban đầu thành công!');
      setIsResetModalOpen(false);
      await loadInitialData();
    } catch (err: any) {
      error(err.message || 'Lỗi khi khôi phục dữ liệu mẫu');
    } finally {
      setIsResetting(false);
    }
  };

  // Cross-view quick navigation helpers
  const handleQuickAttendance = (classId: string) => {
    setSelectedClassForTab(classId);
    setActiveTab('attendance');
  };

  const handleQuickEmulation = (classId: string) => {
    setSelectedClassForTab(classId);
    setActiveTab('emulation');
  };

  const handleQuickOrganization = (classId: string) => {
    setSelectedClassForTab(classId);
    setActiveTab('organization');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Navigation */}
      <Navbar
        settings={settings}
        onResetDemo={() => setIsResetModalOpen(true)}
        onOpenSyncStatus={() => setIsSyncModalOpen(true)}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        onOpenExcelExport={() => setIsExcelExportModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab !== 'attendance' && tab !== 'emulation' && tab !== 'organization') {
              setSelectedClassForTab(undefined);
            }
          }}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          classCount={classes.length}
          studentCount={students.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              classes={classes}
              loading={loading}
              onNavigate={(tab) => setActiveTab(tab)}
              onQuickAttendance={handleQuickAttendance}
            />
          )}

          {activeTab === 'classes' && (
            <ClassesView
              classes={classes}
              students={students}
              onRefresh={refreshClassesAndStudents}
              onSelectClassForAttendance={handleQuickAttendance}
              onSelectClassForEmulation={handleQuickEmulation}
              onSelectClassForOrganization={handleQuickOrganization}
            />
          )}

          {activeTab === 'organization' && (
            <OrganizationView
              classes={classes}
              students={students}
              initialClassId={selectedClassForTab}
              onRefresh={refreshClassesAndStudents}
            />
          )}

          {activeTab === 'students' && (
            <StudentsView
              students={students}
              classes={classes}
              onRefresh={refreshClassesAndStudents}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceView
              classes={classes}
              initialClassId={selectedClassForTab}
              onRefreshStats={refreshStatsOnly}
            />
          )}

          {activeTab === 'emulation' && (
            <EmulationView
              classes={classes}
              students={students}
              initialClassId={selectedClassForTab}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              classes={classes}
              students={students}
              stats={stats}
              settings={settings}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsView
              classes={classes}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onRefreshSettings={refreshSettings}
              onResetDemo={() => setIsResetModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Sync & Architecture Modal */}
      <SyncStatusModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onNavigateToSettings={() => setActiveTab('settings')}
      />

      {/* Excel Export Modal */}
      <ExcelExportModal
        isOpen={isExcelExportModalOpen}
        onClose={() => setIsExcelExportModalOpen(false)}
        classes={classes}
        defaultClassId={selectedClassForTab}
      />

      

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
