import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  FileSpreadsheet, 
  Folder, 
  ExternalLink, 
  Check, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useToast } from './Toast.tsx';

interface GoogleDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSpreadsheet: (file: { id: string; name: string }) => void;
}

export const GoogleDrivePickerModal: React.FC<GoogleDrivePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectSpreadsheet
}) => {
  const { error } = useToast();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSpreadsheets();
    }
  }, [isOpen]);

  const loadSpreadsheets = async (queryTerm = '') => {
    try {
      setLoading(true);
      const res = await api.listDriveFiles({
        mimeType: 'application/vnd.google-apps.spreadsheet',
        search: queryTerm.trim() || undefined,
        pageSize: 40
      });
      setFiles(res.files || []);
    } catch (err: any) {
      console.error('Error loading spreadsheets:', err);
      error(err.message || 'Không thể tải danh sách bảng tính từ Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSpreadsheets(search);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Chọn Bảng Tính từ Google Drive</h3>
              <p className="text-xs text-slate-500">Chỉ định chính xác tệp Google Sheets bạn muốn sử dụng</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên bảng tính trên Google Drive..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Tìm'}
            </button>
          </form>
        </div>

        {/* File List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
              <p className="text-xs">Đang tìm các tệp Google Sheets từ Google Drive của bạn...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Không tìm thấy bảng tính nào</p>
              <p className="text-xs text-slate-400 mt-1">
                Hãy tạo một bảng tính trên Google Drive hoặc dán trực tiếp liên kết/ID bảng tính vào ô cấu hình.
              </p>
            </div>
          ) : (
            files.map((file) => (
              <div 
                key={file.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-900">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      Mã: {file.id} • Sửa đổi: {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('vi-VN') : 'Mới đây'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {file.webViewLink && (
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-slate-100"
                      title="Mở xem trên Google Sheets"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSpreadsheet({ id: file.id, name: file.name });
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Chọn tệp này</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Tìm thấy {files.length} bảng tính Google Sheets</span>
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 font-medium cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
