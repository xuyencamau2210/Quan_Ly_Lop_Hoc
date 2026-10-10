import { classroomStore } from '../data/store.ts';

/**
 * Service Layer prepared for Google Drive API integration
 * Manages document hierarchy, file categories, and Drive URLs.
 */
export class GoogleDriveService {
  /**
   * Check connection status and configuration
   */
  public static checkConnection() {
    const settings = classroomStore.getSettings();
    return {
      connected: settings.googleDrive.connected,
      folderId: settings.googleDrive.folderId,
      folderName: settings.googleDrive.folderName,
      lastSyncTime: settings.googleDrive.lastSyncTime || null,
      statusMessage: settings.googleDrive.statusMessage,
      readyToAuthorize: true
    };
  }

  /**
   * Generates formatted Google Drive link preview and folder hierarchy structure
   */
  public static getDriveStructure(academicYear: string) {
    const classes = classroomStore.getClasses();
    return {
      rootFolderName: `Quản Lý Lớp Học (${academicYear})`,
      folders: classes.map(c => ({
        className: c.name,
        subfolders: ['Đề thi & Kiểm tra', 'Giáo án & Bài giảng', 'Phiếu bài tập', 'Thông báo & Biên bản']
      }))
    };
  }

  /**
   * Test Drive integration readiness
   */
  public static testSync() {
    const documents = classroomStore.getDocuments();
    return {
      success: true,
      mode: 'preparation',
      message: 'Lớp quản lý tài liệu Google Drive đã sẵn sàng kết nối. Hiện tại ứng dụng đang quản lý tài liệu thông qua Server Data Store với đường dẫn Google Drive an toàn.',
      totalIndexedDocuments: documents.length
    };
  }
}
