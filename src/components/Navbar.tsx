import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Database, 
  RotateCcw, 
  User, 
  Menu, 
  CheckCircle,
  FolderSync,
  FileSpreadsheet,
  LogIn
} from 'lucide-react';
import { AppSettings } from '../types/index.ts';
import { getCurrentUser, initAuth, googleSignIn } from '../services/auth.ts';
import { useToast } from './Toast.tsx';

interface NavbarProps {
  settings: AppSettings | null;
  onResetDemo: () => void;
  onOpenSyncStatus: () => void;
  onToggleMobileMenu: () => void;
  onOpenExcelExport?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onResetDemo,
  onOpenSyncStatus,
  onToggleMobileMenu,
  onOpenExcelExport
}) => {
  const { success, error } = useToast();
  const [googleUser, setGoogleUser] = useState(getCurrentUser());
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const unsub = initAuth((user) => {
      setGoogleUser(user);
    });
    return () => unsub();
  }, []);

  const handleQuickSignIn = async () => {
    try {
      setSigningIn(true);
      const res = await googleSignIn();
      success(`Đã đăng nhập Google: ${res.user.displayName || res.user.email}`);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        error(err.message || 'Lỗi khi đăng nhập Google');
      }
    } finally {
      setSigningIn(false);
    }
  };

  const isSheetsConnected = settings?.googleSheets?.connected;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg lg:hidden hover:bg-slate-100 transition-colors"
            title="Mở menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 block leading-tight">
                QUẢN LÝ LỚP HỌC
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
                {settings?.schoolName || 'Hệ thống Quản lý Giáo dục'}
              </span>
            </div>
          </div>
        </div>

        {/* Center / Academic Year Info & Workspace Storage Status */}
        <div className="hidden md:flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/80 text-xs font-semibold text-indigo-700">
            <span>Năm học: {settings?.academicYear || '2025 - 2026'}</span>
            <span className="text-indigo-300">•</span>
            <span>{settings?.currentSemester || 'HK1'}</span>
          </div>

          <button
            onClick={onOpenSyncStatus}
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer group ${
              isSheetsConnected
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title="Xem chi tiết trạng thái lưu trữ & Google Workspace"
          >
            <span className={`w-2 h-2 rounded-full ${isSheetsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {isSheetsConnected ? (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="truncate max-w-[160px] font-bold">
                  {settings?.googleSheets?.sheetName || 'Google Sheets'}
                </span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <span>Server Store</span>
              </>
            )}
            <FolderSync className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenExcelExport && (
            <button
              onClick={onOpenExcelExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200/90 cursor-pointer shadow-2xs"
              title="Xuất file Excel (.xlsx) lưu trữ toàn bộ dữ liệu ứng dụng"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Xuất Excel</span>
            </button>
          )}

          <button
            onClick={onResetDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200/60 cursor-pointer"
            title="Khôi phục dữ liệu mẫu ban đầu để xem trước"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Dữ liệu mẫu</span>
          </button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Google Account or Teacher Profile */}
          {googleUser ? (
            <div className="flex items-center gap-2 pl-1">
              {googleUser.photoURL ? (
                <img 
                  src={googleUser.photoURL} 
                  alt={googleUser.displayName || 'Google'} 
                  className="w-8 h-8 rounded-full border border-emerald-400 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  {googleUser.displayName ? googleUser.displayName.charAt(0) : 'G'}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {googleUser.displayName || 'Tài khoản Google'}
                </p>
                <p className="text-[10px] text-emerald-600 mt-0.5 leading-none font-medium truncate max-w-[140px]">
                  {googleUser.email}
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={handleQuickSignIn}
              disabled={signingIn}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Đăng nhập tài khoản Google để đồng bộ Google Sheets và Drive"
            >
              <div className="w-3.5 h-3.5 shrink-0">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-full h-full block">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
              </div>
              <span className="hidden sm:inline">{signingIn ? 'Đang kết nối...' : 'Đăng nhập Google'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
