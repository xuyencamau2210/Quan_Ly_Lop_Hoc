import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  ExternalLink, 
  Trash2, 
  FolderSync, 
  Search, 
  FileCheck, 
  FileSpreadsheet, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  X,
  Folder,
  FolderPlus,
  RefreshCw,
  HardDrive,
  Download,
  Share2,
  FileCode,
  FileImage,
  File
} from 'lucide-react';
import { DocumentItem, DocumentCategory, Classroom } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useToast } from '../components/Toast.tsx';
import { ConfirmModal } from '../components/ConfirmModal.tsx';
import { GoogleSignInButton } from '../components/GoogleSignInButton.tsx';
import { getCurrentUser, initAuth } from '../services/auth.ts';

interface DocumentsViewProps {
  classes: Classroom[];
}

const CATEGORY_NAMES: Record<DocumentCategory, string> = {
  exam: 'Đề thi & Kiểm tra',
  lesson_plan: 'Giáo án & Bài giảng',
  assignment: 'Phiếu bài tập',
  notice: 'Thông báo & Văn bản',
  handbook: 'Sổ tay & Nội quy',
  other: 'Tài liệu khác'
};

export const DocumentsView: React.FC<DocumentsViewProps> = ({ classes }) => {
  const { success, error } = useToast();
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [viewMode, setViewMode] = useState<'class_docs' | 'drive_explorer'>('class_docs');

  // Documents state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Google Drive Explorer state
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [driveSearch, setDriveSearch] = useState('');
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [deletingDriveFile, setDeletingDriveFile] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add document form
  const [formData, setFormData] = useState({
    title: '',
    category: 'exam' as DocumentCategory,
    classId: '',
    subject: 'Toán học',
    driveUrl: '',
    fileSize: '1.2 MB',
    fileExtension: 'PDF',
    uploadedBy: 'Giáo viên bộ môn',
    description: ''
  });

  useEffect(() => {
    const unsub = initAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (viewMode === 'class_docs') {
      loadDocuments();
    } else if (viewMode === 'drive_explorer' && currentUser) {
      loadDriveFiles();
    }
  }, [selectedClassId, selectedCategory, viewMode, currentUser]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.getDocuments(selectedClassId, selectedCategory);
      setDocuments(data);
    } catch (err: any) {
      error(err.message || 'Lỗi khi tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const loadDriveFiles = async (queryTerm = '') => {
    try {
      setLoadingDrive(true);
      const res = await api.listDriveFiles({
        search: queryTerm.trim() || undefined,
        pageSize: 50
      });
      setDriveFiles(res.files || []);
    } catch (err: any) {
      console.error('Error loading drive files:', err);
      error(err.message || 'Không thể tải tệp từ Google Drive');
    } finally {
      setLoadingDrive(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      category: 'exam',
      classId: classes[0]?.id || '',
      subject: 'Toán học',
      driveUrl: '',
      fileSize: '1.5 MB',
      fileExtension: 'PDF',
      uploadedBy: currentUser?.displayName || 'Thầy Nguyễn Văn Nam',
      description: ''
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      error('Vui lòng nhập tiêu đề tài liệu');
      return;
    }
    if (!formData.driveUrl.trim()) {
      error('Vui lòng nhập liên kết Google Drive');
      return;
    }

    try {
      setIsSubmitting(true);
      const targetClass = classes.find(c => c.id === formData.classId);
      await api.createDocument({
        ...formData,
        className: targetClass ? targetClass.name : 'Chung'
      });
      success(`Đã thêm tài liệu "${formData.title}" vào kho quản lý`);
      setIsAddModalOpen(false);
      loadDocuments();
    } catch (err: any) {
      error(err.message || 'Lỗi khi thêm tài liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDocId) return;
    try {
      setIsDeleting(true);
      await api.deleteDocument(deletingDocId);
      success('Đã xóa tài liệu khỏi hệ thống');
      setDeletingDocId(null);
      loadDocuments();
    } catch (err: any) {
      error(err.message || 'Lỗi khi xóa tài liệu');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      error('Vui lòng nhập tên thư mục');
      return;
    }
    try {
      setCreatingFolder(true);
      await api.createDriveFolder(newFolderName.trim());
      success(`Đã tạo thư mục "${newFolderName}" trên Google Drive`);
      setNewFolderName('');
      setIsCreateFolderOpen(false);
      loadDriveFiles();
    } catch (err: any) {
      error(err.message || 'Lỗi khi tạo thư mục Google Drive');
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteDriveFile = async () => {
    if (!deletingDriveFile) return;
    try {
      setIsDeleting(true);
      await api.deleteDriveFile(deletingDriveFile.id);
      success(`Đã xóa "${deletingDriveFile.name}" khỏi Google Drive`);
      setDeletingDriveFile(null);
      loadDriveFiles();
    } catch (err: any) {
      error(err.message || 'Lỗi khi xóa tệp Google Drive');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickLinkDriveFile = (file: any) => {
    setFormData({
      title: file.name,
      category: file.mimeType?.includes('sheet') ? 'exam' : file.mimeType?.includes('pdf') ? 'exam' : 'lesson_plan',
      classId: classes[0]?.id || '',
      subject: 'Toán học',
      driveUrl: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      fileSize: file.size ? `${(Number(file.size) / (1024 * 1024)).toFixed(1)} MB` : '1.0 MB',
      fileExtension: file.mimeType?.includes('pdf') ? 'PDF' : file.mimeType?.includes('sheet') ? 'SHEET' : 'DOC',
      uploadedBy: currentUser?.displayName || 'Giáo viên',
      description: `Tài liệu liên kết trực tiếp từ Google Drive (${file.name})`
    });
    setIsAddModalOpen(true);
  };

  const filteredDocs = documents.filter((d) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      d.title.toLowerCase().includes(q) ||
      (d.subject && d.subject.toLowerCase().includes(q)) ||
      (d.className && d.className.toLowerCase().includes(q)) ||
      (d.description && d.description.toLowerCase().includes(q))
    );
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return <Folder className="w-5 h-5 text-amber-500 fill-amber-100" />;
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('sheet')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    if (mimeType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-rose-500" />;
    }
    if (mimeType.includes('image')) {
      return <FileImage className="w-5 h-5 text-sky-500" />;
    }
    return <File className="w-5 h-5 text-slate-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Tài liệu & Google Drive</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Lưu trữ giáo án, đề thi, bảng tính và phân phối tài liệu học tập qua Google Workspace
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => api.downloadExcel()}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-sm shadow-emerald-200 transition-all cursor-pointer"
            title="Tải toàn bộ cơ sở dữ liệu ứng dụng dưới dạng file Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Tải file Excel (.xlsx)</span>
          </button>

          {viewMode === 'class_docs' ? (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-indigo-200 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Liên kết tài liệu mới</span>
            </button>
          ) : (
            <button
              onClick={() => setIsCreateFolderOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              Tạo thư mục Drive
            </button>
          )}
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setViewMode('class_docs')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
            viewMode === 'class_docs'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Tài liệu lớp học ({documents.length})</span>
        </button>

        <button
          onClick={() => setViewMode('drive_explorer')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
            viewMode === 'drive_explorer'
              ? 'text-emerald-700 border-b-2 border-emerald-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Google Drive thật {currentUser ? `(${driveFiles.length})` : ''}</span>
          {currentUser && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      {/* VIEW MODE 1: CLASS DOCUMENTS */}
      {viewMode === 'class_docs' && (
        <div className="space-y-5">
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tiêu đề, môn học, lớp..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Class Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Lớp:</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Tất cả lớp</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Lớp {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Phân loại:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Tất cả thể loại</option>
                  <option value="exam">Đề thi & Kiểm tra</option>
                  <option value="lesson_plan">Giáo án & Bài giảng</option>
                  <option value="assignment">Phiếu bài tập</option>
                  <option value="notice">Thông báo & Biên bản</option>
                  <option value="handbook">Sổ tay & Nội quy</option>
                </select>
              </div>
            </div>
          </div>

          {/* Document Grid */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 animate-pulse">
              Đang tải danh sách tài liệu...
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-800">Không tìm thấy tài liệu phù hợp</p>
              <p className="text-xs text-slate-500 mt-1">Hãy thêm tài liệu Google Drive đầu tiên của lớp</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {CATEGORY_NAMES[doc.category] || doc.category}
                      </span>

                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                          {doc.fileExtension || 'PDF'}
                        </span>
                        <button
                          onClick={() => setDeletingDocId(doc.id)}
                          className="p-1 text-slate-300 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                          title="Xóa tài liệu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {doc.title}
                    </h3>

                    {doc.description && (
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {doc.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      {doc.className && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold">
                          Lớp {doc.className}
                        </span>
                      )}
                      {doc.subject && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {doc.subject}
                        </span>
                      )}
                      <span>{doc.fileSize}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {doc.uploadedBy}
                    </span>

                    <a
                      href={doc.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      <span>Mở Google Drive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: REAL GOOGLE DRIVE EXPLORER */}
      {viewMode === 'drive_explorer' && (
        <div className="space-y-5">
          {!currentUser ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Đăng nhập Google để quản lý Google Drive</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Khám phá các tệp tài liệu, bảng tính và thư mục lớp học trực tiếp từ tài khoản Google của bạn
                </p>
              </div>
              <div className="pt-2 flex justify-center">
                <GoogleSignInButton onSuccess={() => loadDriveFiles()} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Drive search & actions */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm tệp trên Google Drive..."
                    value={driveSearch}
                    onChange={(e) => setDriveSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') loadDriveFiles(driveSearch);
                    }}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => loadDriveFiles(driveSearch)}
                    disabled={loadingDrive}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingDrive ? 'animate-spin' : ''}`} />
                    <span>Làm mới</span>
                  </button>

                  <button
                    onClick={() => setIsCreateFolderOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Tạo thư mục mới</span>
                  </button>
                </div>
              </div>

              {/* Drive File List */}
              {loadingDrive ? (
                <div className="py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                  <p className="text-xs">Đang tải danh sách tệp từ Google Drive...</p>
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <Folder className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-800">Không tìm thấy tệp hoặc thư mục nào</p>
                  <p className="text-xs text-slate-500 mt-1">Hãy tạo thư mục mới hoặc tải tài liệu lên Google Drive</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
                  {driveFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="shrink-0 p-2 rounded-xl bg-slate-100">
                          {getFileIcon(file.mimeType)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {file.mimeType === 'application/vnd.google-apps.folder' ? 'Thư mục' : file.size ? `${(Number(file.size) / (1024 * 1024)).toFixed(2)} MB` : 'Tài liệu Google'} • Sửa: {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('vi-VN') : 'Gần đây'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {file.mimeType !== 'application/vnd.google-apps.folder' && (
                          <button
                            type="button"
                            onClick={() => handleQuickLinkDriveFile(file)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold cursor-pointer"
                            title="Đưa vào mục Tài liệu lớp học"
                          >
                            <Plus className="w-3 h-3" />
                            <span className="hidden sm:inline">Liên kết vào lớp</span>
                          </button>
                        )}

                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Xem trên Google Drive"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setDeletingDriveFile(file)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa khỏi Google Drive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Document Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Thêm tài liệu vào Lớp học</h3>
                  <p className="text-xs text-slate-500">Liên kết tệp bài giảng, đề thi hoặc biểu mẫu</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề tài liệu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Đề kiểm tra học kỳ 1 môn Toán"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phân loại
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as DocumentCategory })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="exam">Đề thi & Kiểm tra</option>
                    <option value="lesson_plan">Giáo án & Bài giảng</option>
                    <option value="assignment">Phiếu bài tập</option>
                    <option value="notice">Thông báo & Biên bản</option>
                    <option value="handbook">Sổ tay & Nội quy</option>
                    <option value="other">Tài liệu khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lớp áp dụng
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Áp dụng chung toàn trường</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Lớp {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Môn học
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Toán học"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Định dạng & Dung lượng
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="PDF"
                      value={formData.fileExtension}
                      onChange={(e) => setFormData({ ...formData, fileExtension: e.target.value })}
                      className="px-2.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl uppercase text-center"
                    />
                    <input
                      type="text"
                      placeholder="1.5 MB"
                      value={formData.fileSize}
                      onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                      className="px-2.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-center"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Đường dẫn Google Drive <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/file/d/.../view"
                  value={formData.driveUrl}
                  onChange={(e) => setFormData({ ...formData, driveUrl: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả nội dung
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả tóm tắt tài liệu..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? 'Đang thêm...' : 'Lưu tài liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Google Drive Folder Modal */}
      {isCreateFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Tạo Thư mục Mới trên Google Drive</h3>
              </div>
              <button 
                onClick={() => setIsCreateFolderOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên thư mục <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Quản lý lớp 10A1 (2025 - 2026)"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateFolderOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingFolder}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
                >
                  {creatingFolder ? 'Đang tạo...' : 'Tạo thư mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation (Local Document Index) */}
      <ConfirmModal
        isOpen={!!deletingDocId}
        title="Xác nhận gỡ tài liệu"
        message="Bạn có chắc chắn muốn gỡ liên kết tài liệu này khỏi danh mục lớp học không?"
        confirmText="Gỡ tài liệu"
        cancelText="Hủy bỏ"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingDocId(null)}
      />

      {/* Delete Confirmation (Real Google Drive File) */}
      <ConfirmModal
        isOpen={!!deletingDriveFile}
        title="Xác nhận xóa tệp trên Google Drive"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn tệp "${deletingDriveFile?.name}" khỏi Google Drive của bạn không? Thao tác này sẽ xóa tệp trên tài khoản Google và không thể hoàn tác.`}
        confirmText="Xóa tệp Google Drive"
        cancelText="Giữ lại"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteDriveFile}
        onCancel={() => setDeletingDriveFile(null)}
      />
    </div>
  );
};
