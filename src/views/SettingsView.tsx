import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  School, 
  User, 
  Database, 
  FileSpreadsheet, 
  FolderSync, 
  RotateCcw, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  Server,
  RefreshCw,
  Info,
  ArrowDownCircle,
  ArrowUpCircle,
  FolderOpen,
  PlusCircle,
  AlertTriangle
} from 'lucide-react';
import { AppSettings, Semester } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useToast } from '../components/Toast.tsx';
import { ConfirmModal } from '../components/ConfirmModal.tsx';
import { GoogleSignInButton } from '../components/GoogleSignInButton.tsx';
import { GoogleDrivePickerModal } from '../components/GoogleDrivePickerModal.tsx';
import { getCurrentUser, initAuth } from '../services/auth.ts';

interface SettingsViewProps {
  settings: AppSettings | null;
  onRefreshSettings: () => void;
  onResetDemo: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onRefreshSettings,
  onResetDemo
}) => {
  const { success, error } = useToast();
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  const [formData, setFormData] = useState<AppSettings>(
    settings || {
      academicYear: '2025 - 2026',
      currentSemester: 'HK1',
      schoolName: 'Trường THPT Chuyên Nguyễn Huệ',
      teacherName: 'Thầy Nguyễn Văn Nam',
      teacherEmail: 'nam.nguyen@thptnguyenhue.edu.vn',
      teacherPhone: '0912 345 678',
      department: 'Tổ Toán - Tin học',
      autoCalculateAverages: true,
      storageMode: 'server_store',
      googleSheets: {
        sheetId: '',
        sheetName: '',
        connected: false,
        statusMessage: 'Chưa cấu hình tệp Google Sheets'
      },
      googleDrive: {
        folderId: '',
        folderName: 'QuanLyLopHoc_TaiLieu',
        connected: false,
        statusMessage: 'Chưa kết nối Google Drive'
      }
    }
  );

  const [saving, setSaving] = useState(false);
  const [testingSheets, setTestingSheets] = useState(false);
  const [initializingTabs, setInitializingTabs] = useState(false);
  const [syncingPull, setSyncingPull] = useState(false);
  const [syncingPush, setSyncingPush] = useState(false);
  const [sheetsMetadata, setSheetsMetadata] = useState<any | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Modal confirmations
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    const unsub = initAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      await api.updateSettings(formData);
      success('Đã lưu cấu hình hệ thống thành công');
      onRefreshSettings();
    } catch (err: any) {
      error(err.message || 'Lỗi khi lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const handleInspectSheets = async (customId?: string) => {
    const targetId = customId || formData.googleSheets.sheetId;
    if (!targetId || !targetId.trim()) {
      error('Vui lòng nhập mã hoặc liên kết bảng tính Google Sheets bạn chỉ định');
      return;
    }
    try {
      setTestingSheets(true);
      const meta = await api.getSheetsMetadata(targetId);
      setSheetsMetadata(meta);
      
      const updated = {
        ...formData,
        googleSheets: {
          ...formData.googleSheets,
          sheetId: meta.spreadsheetId,
          sheetName: meta.title,
          connected: true,
          statusMessage: `Đã kết nối với tệp: "${meta.title}" (${meta.foundTabs.length} bảng chuẩn)`
        }
      };
      setFormData(updated);
      await api.updateSettings(updated);
      onRefreshSettings();
      success(`Kết nối thành công với bảng tính: "${meta.title}"`);
    } catch (err: any) {
      console.error('Inspect sheets error:', err);
      setSheetsMetadata(null);
      error(err.message || 'Không thể đọc bảng tính Google Sheets chỉ định');
    } finally {
      setTestingSheets(false);
    }
  };

  const handleInitTabs = async () => {
    if (!formData.googleSheets.sheetId) {
      error('Vui lòng chỉ định bảng tính trước');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Khởi tạo các trang tính chuẩn?',
      message: `Hệ thống sẽ thêm các bảng còn thiếu (${sheetsMetadata?.missingTabs?.join(', ') || 'LopHoc, HocSinh, DiemDanh, DanhMucThiDua, LichSuThiDua, TongKetTuan, GiaoVien, CauHinh'}) vào bảng tính của bạn. Dữ liệu các bảng cũ sẽ được giữ nguyên không thay đổi.`,
      confirmText: 'Đồng ý tạo bảng',
      isDestructive: false,
      onConfirm: async () => {
        try {
          setInitializingTabs(true);
          const res = await api.initSheetsTabs(formData.googleSheets.sheetId);
          success(res.message);
          await handleInspectSheets();
        } catch (err: any) {
          error(err.message || 'Lỗi khi tạo bảng');
        } finally {
          setInitializingTabs(false);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handlePullData = async () => {
    if (!formData.googleSheets.sheetId) {
      error('Vui lòng chỉ định bảng tính trước');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Đồng bộ dữ liệu từ Google Sheets về ứng dụng (PULL)?',
      message: 'Thao tác này sẽ đọc dữ liệu các bảng từ Google Sheets đã chỉ định và cập nhật vào hệ thống quản lý lớp học. Bạn có chắc chắn muốn nạp dữ liệu này không?',
      confirmText: 'Đồng bộ về ứng dụng',
      isDestructive: false,
      onConfirm: async () => {
        try {
          setSyncingPull(true);
          const res = await api.pullFromGoogleSheets(formData.googleSheets.sheetId);
          success(res.message);
          onRefreshSettings();
          await handleInspectSheets();
        } catch (err: any) {
          error(err.message || 'Lỗi khi nạp dữ liệu từ Google Sheets');
        } finally {
          setSyncingPull(false);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handlePushData = async () => {
    if (!formData.googleSheets.sheetId) {
      error('Vui lòng chỉ định bảng tính trước');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Xuất dữ liệu lên Google Sheets (PUSH)?',
      message: `Thao tác này sẽ ghi đè dữ liệu danh sách Lớp học, Học sinh, Điểm danh và Thi đua từ hệ thống lên tệp Google Sheets "${formData.googleSheets.sheetName || formData.googleSheets.sheetId}". Bạn có chắc chắn muốn xuất dữ liệu không?`,
      confirmText: 'Xác nhận xuất dữ liệu',
      isDestructive: true,
      onConfirm: async () => {
        try {
          setSyncingPush(true);
          const res = await api.pushToGoogleSheets(formData.googleSheets.sheetId);
          success(res.message);
          onRefreshSettings();
          await handleInspectSheets();
        } catch (err: any) {
          error(err.message || 'Lỗi khi xuất dữ liệu lên Google Sheets');
        } finally {
          setSyncingPush(false);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cài đặt Hệ thống</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cấu hình năm học, thông tin nhà trường, giáo viên và lớp dịch vụ tích hợp dữ liệu
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm shadow-indigo-200 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Đang lưu...' : 'Lưu tất cả cài đặt'}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Năm học & Nhà trường */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Cấu hình Năm học & Đơn vị trường</h2>
              <p className="text-xs text-slate-500">Thông tin cơ sở đào tạo và chu kỳ đánh giá</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tên trường học <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Năm học hiện tại <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Học kỳ hiện tại
              </label>
              <select
                value={formData.currentSemester}
                onChange={(e) => setFormData({ ...formData, currentSemester: e.target.value as Semester })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold"
              >
                <option value="HK1">Học kỳ 1</option>
                <option value="HK2">Học kỳ 2</option>
                <option value="CaNam">Cả năm</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Thông tin Giáo viên */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Thông tin Giáo viên phụ trách</h2>
              <p className="text-xs text-slate-500">Hiển thị trên bảng điểm, sổ điểm danh và tiêu đề báo cáo</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Họ và tên giáo viên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.teacherName}
                onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tổ bộ môn
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email công vụ
              </label>
              <input
                type="email"
                value={formData.teacherEmail}
                onChange={(e) => setFormData({ ...formData, teacherEmail: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Số điện thoại liên hệ
              </label>
              <input
                type="tel"
                value={formData.teacherPhone}
                onChange={(e) => setFormData({ ...formData, teacherPhone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Kiến trúc Dữ liệu & Tích hợp Google Sheets / Drive */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Kiến trúc Tích hợp Dữ liệu & Lưu trữ</h2>
              <p className="text-xs text-slate-500">
                Phân định rõ lớp Server Store đang hoạt động và các lớp dịch vụ kết nối Google Sheets & Google Drive
              </p>
            </div>
          </div>

          {/* Active Server Store Info */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70">
            <div className="flex items-start gap-3">
              <Server className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-emerald-950">
                    Cơ sở dữ liệu chính: Server Data Store (Máy chủ Node.js)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                    ĐANG HOẠT ĐỘNG
                  </span>
                </div>
                <p className="text-xs text-emerald-800 mt-1">
                  Dữ liệu được lưu trữ trực tiếp trên file hệ thống máy chủ thông qua Server Store REST API. Không sử dụng localStorage làm kho lưu trữ chính.
                </p>
              </div>
            </div>
          </div>

          {/* Google Account Authentication */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Xác thực Tài khoản Google Workspace</h3>
                  <p className="text-xs text-slate-500">
                    Ủy quyền bảo mật OAuth để đọc và ghi tệp Google Sheets & Google Drive bạn chỉ định
                  </p>
                </div>
              </div>
              <GoogleSignInButton onSuccess={() => handleInspectSheets()} />
            </div>

            {currentUser && (
              <div className="p-3 bg-white border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Đã cấp quyền truy cập Google Workspace cho tài khoản: <strong>{currentUser.email}</strong>
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  OAuth Sẵn sàng
                </span>
              </div>
            )}
          </div>

          {/* Google Sheets Specific File Configuration */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Chỉ định Tệp Google Sheets làm Nguồn Dữ Liệu
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hệ thống sẽ sử dụng đúng tệp này và không tự ý tạo bảng tính khác nếu không được bạn cho phép
                  </p>
                </div>
              </div>

              {formData.googleSheets.connected && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ĐÃ KẾT NỐI
                </span>
              )}
            </div>

            {/* Input field + Pick from Drive */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Mã định danh (ID) hoặc Liên kết (URL) của bảng tính Google Sheets:
              </label>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={formData.googleSheets.sheetId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({
                      ...formData,
                      googleSheets: {
                        ...formData.googleSheets,
                        sheetId: val
                      }
                    });
                  }}
                  placeholder="Ví dụ: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms hoặc dán link Google Sheets..."
                  className="flex-1 px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser) {
                        error('Vui lòng đăng nhập Google trước để duyệt tệp từ Drive');
                        return;
                      }
                      setIsPickerOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                    title="Chọn bảng tính trực tiếp từ Google Drive của bạn"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-slate-600" />
                    <span>Chọn từ Drive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInspectSheets()}
                    disabled={testingSheets || !formData.googleSheets.sheetId}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingSheets ? 'animate-spin' : ''}`} />
                    <span>{testingSheets ? 'Đang đọc...' : 'Kiểm tra tệp'}</span>
                  </button>
                </div>
              </div>

              {formData.googleSheets.sheetId && (
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span>Mã ID trích xuất:</span>
                  <code className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-slate-700 font-semibold">
                    {formData.googleSheets.sheetId.includes('/spreadsheets/d/') 
                      ? formData.googleSheets.sheetId.split('/spreadsheets/d/')[1]?.split('/')[0] 
                      : formData.googleSheets.sheetId}
                  </code>
                </div>
              )}
            </div>

            {/* Inspection report if available */}
            {sheetsMetadata && (
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-teal-950 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-teal-700" />
                      {sheetsMetadata.title}
                    </h4>
                    <p className="text-[10px] text-teal-700 mt-0.5">
                      Tổng số tab trong bảng: {sheetsMetadata.sheets?.length || 0}
                    </p>
                  </div>

                  <a
                    href={`https://docs.google.com/spreadsheets/d/${sheetsMetadata.spreadsheetId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 font-semibold underline"
                  >
                    <span>Mở trên Google Sheets</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Found and Missing tables */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-teal-200/60 text-xs">
                  <div>
                    <span className="text-[11px] font-bold text-teal-900 block mb-1">
                      Các bảng dữ liệu chuẩn đã có ({sheetsMetadata.foundTabs?.length || 0}/8):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {sheetsMetadata.foundTabs?.length > 0 ? (
                        sheetsMetadata.foundTabs.map((t: string) => (
                          <span key={t} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                            ✓ {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Chưa có bảng chuẩn nào</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-amber-900 block mb-1">
                      Các bảng còn thiếu ({sheetsMetadata.missingTabs?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {sheetsMetadata.missingTabs?.length > 0 ? (
                        sheetsMetadata.missingTabs.map((t: string) => (
                          <span key={t} className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold">
                            + {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-emerald-700 font-semibold text-[11px]">✓ Đã đủ toàn bộ bảng chuẩn</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* If missing tabs, offer initialization button */}
                {sheetsMetadata.missingTabs?.length > 0 && (
                  <div className="p-3 bg-white border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-900">
                        Bảng tính thiếu một số trang tính tiêu chuẩn. Bạn có muốn tạo thêm các trang tính này vào bảng tính hiện tại không?
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleInitTabs}
                      disabled={initializingTabs}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 self-end sm:self-auto"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{initializingTabs ? 'Đang tạo...' : 'Khởi tạo các bảng còn thiếu'}</span>
                    </button>
                  </div>
                )}

                {/* Sync Action Buttons */}
                <div className="pt-3 border-t border-teal-200/60 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handlePullData}
                    disabled={syncingPull}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-teal-300 hover:bg-teal-50 text-teal-800 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    title="Nạp dữ liệu từ các sheet LopHoc, HocSinh, ThiDua về ứng dụng"
                  >
                    <ArrowDownCircle className={`w-4 h-4 text-teal-600 ${syncingPull ? 'animate-bounce' : ''}`} />
                    <span>{syncingPull ? 'Đang nạp...' : 'Đồng bộ từ Google Sheets về App (PULL)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePushData}
                    disabled={syncingPush}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    title="Ghi đè dữ liệu hiện tại lên các trang tính Google Sheets đã chỉ định"
                  >
                    <ArrowUpCircle className={`w-4 h-4 text-teal-200 ${syncingPush ? 'animate-bounce' : ''}`} />
                    <span>{syncingPush ? 'Đang xuất...' : 'Xuất dữ liệu lên Google Sheets (PUSH)'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Google Drive Status Box */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
                  <FolderSync className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Quản lý Tài liệu với Google Drive
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Liệt kê, tra cứu và tải tài liệu trực tiếp từ tài khoản Google Drive cá nhân hoặc Google Drive lớp học
                  </p>
                </div>
              </div>

              {currentUser && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 shrink-0">
                  GOOGLE DRIVE SẴN SÀNG
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có thể xem và duyệt toàn bộ cây thư mục tệp học liệu (đề thi, giáo án, biên bản) tại mục <strong>"Tài liệu & Học liệu"</strong> trên menu điều hướng bên trái. Mọi thao tác xóa tệp đều yêu cầu xác nhận rõ ràng để bảo vệ an toàn dữ liệu.
            </p>
          </div>
        </div>

        {/* Section 4: Khôi phục & Dữ liệu mẫu */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Khôi phục Dữ liệu Mẫu (Reset Demo)</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-lg">
              Nếu bạn muốn xem lại các lớp 10A1, 10A2, 11B1, 12C3 cùng danh sách học sinh và điểm danh mẫu ban đầu, bấm nút dưới đây.
            </p>
          </div>

          <button
            type="button"
            onClick={onResetDemo}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            Khôi phục dữ liệu mẫu
          </button>
        </div>
      </form>

      {/* Google Drive Picker Modal */}
      <GoogleDrivePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectSpreadsheet={(file) => {
          setFormData(prev => ({
            ...prev,
            googleSheets: {
              ...prev.googleSheets,
              sheetId: file.id,
              sheetName: file.name
            }
          }));
          handleInspectSheets(file.id);
        }}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
