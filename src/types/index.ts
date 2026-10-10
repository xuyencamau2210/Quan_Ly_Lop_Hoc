export type Gender = 'male' | 'female' | 'other';
export type StudentStatus = 'active' | 'transferred' | 'suspended';
export type AttendanceStatus = 'present' | 'excused' | 'unexcused' | 'late';
export type Semester = 'HK1' | 'HK2' | 'CaNam';
export type AcademicRank = 'Xuất sắc' | 'Giỏi' | 'Khá' | 'Trung bình' | 'Yếu' | 'Kém';

export interface Classroom {
  id: string;
  name: string;
  grade: number; // 10, 11, 12
  academicYear: string; // e.g. "2025 - 2026"
  homeroomTeacher: string;
  room: string;
  studentCount?: number;
  maxStudents: number;
  note?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  studentCode: string;
  fullName: string;
  gender: Gender;
  birthDate: string; // YYYY-MM-DD
  classId: string;
  className: string;
  parentName: string;
  parentPhone: string;
  address: string;
  status: StudentStatus;
  note?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  studentName: string;
  studentCode: string;
  status: AttendanceStatus;
  note?: string;
  updatedAt: string;
}

export interface DailyAttendanceSummary {
  date: string;
  classId: string;
  className: string;
  total: number;
  present: number;
  excused: number;
  unexcused: number;
  late: number;
  attendanceRate: number; // percentage
  submittedAt: string;
}

export interface GradeItem {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  classId: string;
  subject: string;
  semester: Semester;
  oral: (number | null)[]; // 2-3 điểm kiểm tra miệng
  test15: (number | null)[]; // 2 điểm 15 phút
  test45: number | null; // Điểm giữa kỳ (hệ số 2)
  finalExam: number | null; // Điểm cuối kỳ (hệ số 3)
  average: number | null;
  rank?: AcademicRank;
  note?: string;
  updatedAt: string;
}

export type DocumentCategory = 'exam' | 'lesson_plan' | 'assignment' | 'notice' | 'handbook' | 'other';

export interface DocumentItem {
  id: string;
  title: string;
  category: DocumentCategory;
  classId?: string; // Optional: all classes or specific class
  className?: string;
  subject?: string;
  driveUrl: string;
  driveFileId?: string;
  fileSize?: string;
  fileExtension: string;
  uploadedBy: string;
  uploadedAt: string;
  isGoogleDriveSynced: boolean;
  description?: string;
}

export interface AppSettings {
  academicYear: string;
  currentSemester: Semester;
  schoolName: string;
  teacherName: string;
  teacherEmail: string;
  teacherPhone: string;
  department: string;
  autoCalculateAverages: boolean;
  storageMode: 'server_store' | 'google_sheets_ready';
  googleSheets: {
    sheetId: string;
    sheetName: string;
    connected: boolean;
    lastSyncTime?: string;
    statusMessage: string;
  };
  googleDrive: {
    folderId: string;
    folderName: string;
    connected: boolean;
    lastSyncTime?: string;
    statusMessage: string;
  };
}

export interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  todayAttendance: {
    date: string;
    presentCount: number;
    absentCount: number;
    excusedCount: number;
    lateCount: number;
    attendanceRate: number;
  };
  averageGrade: number;
  academicRankDistribution: {
    excellent: number; // Xuất sắc
    good: number; // Giỏi
    fair: number; // Khá
    average: number; // Trung bình
    weak: number; // Yếu
  };
  classSummaries: {
    id: string;
    name: string;
    studentCount: number;
    homeroomTeacher: string;
    room: string;
    recentAttendanceRate: number;
  }[];
  recentActivities: {
    id: string;
    title: string;
    time: string;
    type: 'attendance' | 'grade' | 'student' | 'class' | 'document' | 'emulation';
  }[];
}

// ==========================================
// THI ĐUA VÀ VI PHẠM HỌC SINH HẰNG TUẦN (TYPES)
// ==========================================

export type EmulationType = 'CONG' | 'TRU';
export type EmulationCategoryStatus = 'DANG_DUNG' | 'AN';
export type EmulationRecordStatus = 'HIEU_LUC' | 'DA_HUY';
export type EmulationPeriodStatus = 'DANG_DIEN_RA' | 'DA_KHOA';
export type EmulationSummaryStatus = 'TAM_TINH' | 'DA_KHOA';
export type GroupStatus = 'DANG_HOAT_DONG' | 'NGUNG';

export interface EmulationGroup {
  MaTo: string;
  MaLop: string;
  TenTo: string;
  ToTruong?: string; // Tên hoặc Mã HS
  TrangThai: GroupStatus;
}

export interface GroupMember {
  MaPhanTo: string;
  MaHS: string;
  MaTo: string;
  TuNgay: string; // YYYY-MM-DD
  DenNgay?: string; // YYYY-MM-DD or undefined
}

export interface EmulationCategory {
  MaLoi: string;
  TenLoi: string;
  Loai: EmulationType;
  Diem: number; // Luôn dương trong danh mục
  MoTa: string;
  TrangThai: EmulationCategoryStatus;
}

export interface EmulationRecord {
  MaGhiNhan: string;
  Ngay: string; // YYYY-MM-DD
  MaKy: string; // e.g. "2026-W41"
  MaLop: string;
  MaHS: string;
  TenHS?: string;
  TenTo?: string;
  MaLoi: string;
  TenLoi?: string;
  Loai: EmulationType;
  Diem: number; // Dương nếu CONG, Âm nếu TRU
  GhiChu?: string;
  NguoiGhiNhan: string;
  TrangThai: EmulationRecordStatus;
  ThoiGianTao: string;
  NguoiSua?: string;
  LyDoSuaHuy?: string;
}

export interface EmulationPeriod {
  MaKy: string; // e.g. "2026-W41"
  NamHoc: string;
  TuanSo: number;
  TuNgay: string; // Thứ 2 YYYY-MM-DD
  DenNgay: string; // Chủ nhật YYYY-MM-DD
  DiemDauTuan: number; // Mặc định 0
  TrangThai: EmulationPeriodStatus;
  ThoiGianKhoa?: string;
  NguoiKhoa?: string;
  GhiChu?: string;
  LichSuMoKhoa?: {
    NguoiMo: string;
    ThoiGian: string;
    LyDo: string;
  }[];
}

export interface WeeklyStudentSummary {
  MaKy: string;
  MaLop: string;
  MaHS: string;
  TenHS?: string;
  MaTo: string;
  TenTo?: string;
  DiemDauTuan: number;
  TongDiemCong: number;
  TongDiemTru: number;
  DiemCuoiTuan: number;
  SoThanhTich: number; // Số lượt cộng hợp lệ
  SoViPham: number; // Số lượt trừ hợp lệ
  XepHang: number;
  TrangThai: EmulationSummaryStatus;
}

export interface WeeklyGroupSummary {
  MaKy: string;
  MaLop: string;
  MaTo: string;
  TenTo: string;
  SoThanhVien: number;
  TongDiemCong: number;
  TongDiemTru: number;
  TongDiem: number;
  DiemBinhQuan: number;
  XepHang: number;
  TrangThai: EmulationSummaryStatus;
}

// ==========================================
// TỔ CHỨC LỚP & BAN CÁN SỰ & SƠ ĐỒ CHỖ NGỒI
// ==========================================

export type OfficerRole = 
  | 'LOP_TRUONG' 
  | 'LOP_PHO_HOC_TAP' 
  | 'LOP_PHO_KY_LUAT' 
  | 'LOP_PHO_LAO_DONG' 
  | 'LOP_PHO_PHONG_TRAO' 
  | 'THU_QUY' 
  | 'TO_TRUONG'
  | 'TO_PHO'
  | 'KHAC';

export interface ClassOfficer {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  role: OfficerRole;
  customRoleTitle?: string;
  duty?: string; // Nhiệm vụ cụ thể
  contactPhone?: string;
  appointedDate?: string;
}

export interface SeatPosition {
  seatId: string; // e.g. "R1-C1-S1"
  row: number; // 1-indexed (Hàng bàn 1 -> rows)
  column: number; // 1-indexed (Dãy bàn 1 -> columns)
  seatIndex: number; // 1 or 2 (Vị trí bàn: trái / phải)
  studentId?: string;
  studentName?: string;
  studentCode?: string;
  note?: string;
}

export interface SeatingChart {
  id: string;
  classId: string;
  title: string;
  academicYear: string;
  term?: string; // HK1, HK2
  rows: number; // số hàng bàn (mặc định 5)
  columns: number; // số dãy bàn (mặc định 4)
  seatsPerDesk: number; // số chỗ ngồi mỗi bàn (1 hoặc 2, mặc định 2)
  seats: SeatPosition[];
  updatedAt: string;
  teacherNote?: string;
}

