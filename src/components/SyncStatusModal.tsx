import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  FileSpreadsheet, 
  FolderSync, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  Server,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useToast } from './Toast.tsx';
import { getCurrentUser, initAuth } from '../services/auth.ts';
import { GoogleSignInButton } from './GoogleSignInButton.tsx';
import { AppSettings } from '../types/index.ts';

interface SyncStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSettings?: () => void;
}

export const SyncStatusModal: React.FC<SyncStatusModalProps> = ({ 
  isOpen, 
  onClose,
  onNavigateToSettings 
}) => {
  const { success, error } = useToast();
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [testingSheets, setTestingSheets] = useState(false);
  const [sheetsResult, setSheetsResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getSettings().then(setSettings).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = initAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleTestSheets = async () => {
    if (!settings?.googleSheets?.sheetId) {
      error('Chưa có mã bảng tính Google Sheets để kiểm tra. Hãy chỉ định trong Cài đặt.');
      return;
    }
    try {
      setTestingSheets(true);
      const meta = await api.getSheetsMetadata(settings.googleSheets.sheetId);
      setSheetsResult(`Kết nối thành công: "${meta.title}" (${meta.foundTabs.length}/8 bảng chuẩn)`);
      success(`Bảng tính "${meta.title}" hoạt động tốt`);
    } catch (err: any) {
      setSheetsResult(null);
      error(err.message || 'Lỗi kiểm tra Google Sheets');
    } finally {
      setTestingSheets(false);
    }
  };

  const isConnected = settings?.googleSheets?.connected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Kiến trúc Lưu trữ & Dữ liệu</h3>
              <p className="text-xs text-slate-500">Trạng thái Server Store, Google Sheets & Google Drive</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Google Account Authentication */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-xs text-slate-900">Xác thực Google Workspace</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {currentUser ? `Đang đăng nhập: ${currentUser.email}` : 'Chưa đăng nhập Google'}
                </p>
              </div>

              <GoogleSignInButton onSuccess={() => api.getSettings().then(setSettings)} />
            </div>
          </div>

          {/* Active Storage */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-emerald-950">
                      Cơ sở dữ liệu chính: Server Data Store (Máy chủ Node.js)
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                      ĐANG HOẠT ĐỘNG
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    Mọi thao tác CRUD (thêm, sửa, xóa lớp học, học sinh, điểm danh, thi đua tuần) được lưu trữ kiên cố trên máy chủ qua REST API an toàn.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Google Sheets Connection Box */}
          <div className={`p-4 rounded-xl border transition-all ${
            isConnected ? 'border-teal-300 bg-teal-50/50' : 'border-slate-200 bg-slate-50'
          }`}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${isConnected ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-700'}`}>
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      Tệp Google Sheets Chính Thức
                    </span>
                    {isConnected ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-600 text-white">
                        ✓ ĐÃ LIÊN KẾT
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                        CHƯA LIÊN KẾT TỆP
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {isConnected 
                      ? `Đang liên kết với bảng tính "${settings?.googleSheets?.sheetName || settings?.googleSheets?.sheetId}". Hệ thống hỗ trợ đọc danh sách, đồng bộ 2 chiều PUSH / PULL.`
                      : 'Hệ thống tuân thủ nguyên tắc không tự tạo file rác. Hãy chỉ định mã hoặc dán liên kết Google Sheets của bạn trong mục Cài đặt.'}
                  </p>
                </div>
              </div>
            </div>

            {sheetsResult && (
              <div className="mb-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{sheetsResult}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
              <span className="text-[11px] text-slate-500 truncate max-w-xs">
                Mã Sheet: <code>{settings?.googleSheets?.sheetId || 'Chưa thiết lập'}</code>
              </span>
              <div className="flex items-center gap-2">
                {settings?.googleSheets?.sheetId && (
                  <button
                    type="button"
                    onClick={handleTestSheets}
                    disabled={testingSheets}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingSheets ? 'animate-spin' : ''}`} />
                    Kiểm tra
                  </button>
                )}
                {onNavigateToSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToSettings();
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Cấu hình tệp</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Google Drive Status Box */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-sky-100 text-sky-700 shrink-0">
                  <FolderSync className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      Tài liệu Google Drive
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-800">
                      ĐÃ TÍCH HỢP
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Khám phá, tạo thư mục và liên kết tài liệu trực tiếp từ tài khoản Google Drive cá nhân của bạn trong mục "Tài liệu & Học liệu".
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
