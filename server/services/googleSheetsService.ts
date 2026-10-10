import { classroomStore } from '../data/store.ts';
import { Classroom, Student, GradeItem, AttendanceRecord } from '../../src/types/index.ts';

/**
 * Service Layer prepared for Google Sheets API integration
 * Formats data into 2D arrays (tables) suitable for Google Sheets spreadsheets.
 */
export class GoogleSheetsService {
  /**
   * Check connection status and configuration
   */
  public static checkConnection() {
    const settings = classroomStore.getSettings();
    return {
      connected: settings.googleSheets.connected,
      sheetId: settings.googleSheets.sheetId,
      sheetName: settings.googleSheets.sheetName,
      lastSyncTime: settings.googleSheets.lastSyncTime || null,
      statusMessage: settings.googleSheets.statusMessage,
      readyToAuthorize: true
    };
  }

  /**
   * Transforms class list into Google Sheets row matrix
   */
  public static formatClassesToSheetsData(classes: Classroom[]): (string | number)[][] {
    const header = ['Mã Lớp (ID)', 'Tên Lớp', 'Khối', 'Năm Học', 'Giáo Viên Chủ Nhiệm', 'Phòng Học', 'Sĩ Số', 'Ghi Chú', 'Ngày Tạo'];
    const rows = classes.map(c => [
      c.id,
      c.name,
      c.grade,
      c.academicYear,
      c.homeroomTeacher,
      c.room,
      c.studentCount || 0,
      c.note || '',
      c.createdAt
    ]);
    return [header, ...rows];
  }

  /**
   * Transforms students list into Google Sheets row matrix
   */
  public static formatStudentsToSheetsData(students: Student[]): (string | number)[][] {
    const header = ['Mã Học Sinh', 'Họ Và Tên', 'Giới Tính', 'Ngày Sinh', 'Lớp', 'Tên Phụ Huynh', 'SĐT Phụ Huynh', 'Địa Chỉ', 'Trạng Thái', 'Ghi Chú'];
    const rows = students.map(s => [
      s.studentCode,
      s.fullName,
      s.gender === 'male' ? 'Nam' : s.gender === 'female' ? 'Nữ' : 'Khác',
      s.birthDate,
      s.className,
      s.parentName,
      s.parentPhone,
      s.address,
      s.status === 'active' ? 'Đang học' : s.status === 'transferred' ? 'Chuyển trường' : 'Nghỉ học',
      s.note || ''
    ]);
    return [header, ...rows];
  }

  /**
   * Transforms gradebook into Google Sheets row matrix
   */
  public static formatGradesToSheetsData(grades: GradeItem[]): (string | number)[][] {
    const header = ['Mã HS', 'Họ Tên', 'Lớp', 'Môn Học', 'Học Kỳ', 'Điểm Miệng', 'Điểm 15P', 'Điểm Giữa Kỳ (x2)', 'Điểm Cuối Kỳ (x3)', 'Điểm Trung Bình', 'Xếp Loại', 'Ghi Chú'];
    const rows = grades.map(g => [
      g.studentCode,
      g.studentName,
      g.classId,
      g.subject,
      g.semester,
      (g.oral || []).join(', '),
      (g.test15 || []).join(', '),
      g.test45 ?? '',
      g.finalExam ?? '',
      g.average ?? '',
      g.rank ?? '',
      g.note || ''
    ]);
    return [header, ...rows];
  }

  /**
   * Transforms attendance into Google Sheets row matrix
   */
  public static formatAttendanceToSheetsData(attendance: AttendanceRecord[]): (string | number)[][] {
    const header = ['Ngày', 'Mã Lớp', 'Mã Học Sinh', 'Họ Tên', 'Trạng Thái', 'Lý Do / Ghi Chú', 'Thời Gian Ghi Nhận'];
    const statusMap = {
      present: 'Có mặt',
      excused: 'Vắng có phép',
      unexcused: 'Vắng không phép',
      late: 'Đi trễ'
    };
    const rows = attendance.map(a => [
      a.date,
      a.classId,
      a.studentCode,
      a.studentName,
      statusMap[a.status] || a.status,
      a.note || '',
      a.updatedAt
    ]);
    return [header, ...rows];
  }

  /**
   * Transforms ToHocSinh (Student Groups) to Google Sheets rows
   */
  public static formatToHocSinhToSheetsData(groups: any[]): (string | number)[][] {
    const header = ['MaTo', 'MaLop', 'TenTo', 'ToTruong', 'TrangThai'];
    const rows = groups.map(g => [
      g.MaTo,
      g.MaLop,
      g.TenTo,
      g.ToTruong || '',
      g.TrangThai
    ]);
    return [header, ...rows];
  }

  /**
   * Transforms ThanhVienTo (Group Members) to Google Sheets rows
   */
  public static formatThanhVienToToSheetsData(members: any[]): (string | number)[][] {
    const header = ['MaPhanTo', 'MaHS', 'MaTo', 'TuNgay', 'DenNgay'];
    const rows = members.map(m => [
      m.MaPhanTo,
      m.MaHS,
      m.MaTo,
      m.TuNgay,
      m.DenNgay || ''
    ]);
    return [header, ...rows];
  }

  /**
   * Transforms DanhMucThiDua (Emulation Categories) to Google Sheets rows
   */
  public static formatDanhMucThiDuaToSheetsData(categories: any[]): (string | number)[][] {
    const header = ['MaLoi', 'TenLoi', 'Loai', 'Diem', 'MoTa', 'TrangThai'];
    const rows = categories.map(c => [
      c.MaLoi,
      c.TenLoi,
      c.Loai,
      c.Diem,
      c.MoTa || '',
      c.TrangThai
    ]);
    return [header, ...rows];
  }

  /**
   * Transforms LichSuThiDua (Emulation Log) to Google Sheets rows
   */
  public static formatLichSuThiDuaToSheetsData(records: any[]): (string | number)[][] {
    const header = [
      'MaGhiNhan', 'Ngay', 'MaKy', 'MaLop', 'MaHS', 'MaLoi', 'Loai', 'Diem',
      'GhiChu', 'NguoiGhiNhan', 'TrangThai', 'ThoiGianTao', 'NguoiSua', 'LyDoSuaHuy'
    ];
    const rows = records.map(r => [
      r.MaGhiNhan,
      r.Ngay,
      r.MaKy,
      r.MaLop,
      r.MaHS,
      r.MaLoi,
      r.Loai,
      r.Diem,
      r.GhiChu || '',
      r.NguoiGhiNhan,
      r.TrangThai,
      r.ThoiGianTao,
      r.NguoiSua || '',
      r.LyDoSuaHuy || ''
    ]);
    return [header, ...rows];
  }

  /**
   * Transforms KyThiDua (Emulation Periods) to Google Sheets rows
   */
  public static formatKyThiDuaToSheetsData(periods: any[]): (string | number)[][] {
    const header = ['MaKy', 'NamHoc', 'TuanSo', 'TuNgay', 'DenNgay', 'DiemDauTuan', 'TrangThai', 'ThoiGianKhoa', 'NguoiKhoa', 'GhiChu'];
    const rows = periods.map(p => [
      p.MaKy,
      p.NamHoc,
      p.TuanSo,
      p.TuNgay,
      p.DenNgay,
      p.DiemDauTuan,
      p.TrangThai,
      p.ThoiGianKhoa || '',
      p.NguoiKhoa || '',
      p.GhiChu || ''
    ]);
    return [header, ...rows];
  }

  /**
   * Transforms TongKetTuan (Student Weekly Summaries) to Google Sheets rows
   */
  public static formatTongKetTuanToSheetsData(summaries: any[]): (string | number)[][] {
    const header = [
      'MaKy', 'MaLop', 'MaHS', 'MaTo', 'DiemDauTuan', 'TongDiemCong',
      'TongDiemTru', 'DiemCuoiTuan', 'SoThanhTich', 'SoViPham', 'XepHang', 'TrangThai'
    ];
    const rows = summaries.map(s => [
      s.MaKy,
      s.MaLop,
      s.MaHS,
      s.MaTo,
      s.DiemDauTuan,
      s.TongDiemCong,
      s.TongDiemTru,
      s.DiemCuoiTuan,
      s.SoThanhTich,
      s.SoViPham,
      s.XepHang,
      s.TrangThai
    ]);
    return [header, ...rows];
  }

  /**
   * Transforms TongKetTo (Group Weekly Summaries) to Google Sheets rows
   */
  public static formatTongKetToToSheetsData(groupSummaries: any[]): (string | number)[][] {
    const header = [
      'MaKy', 'MaLop', 'MaTo', 'SoThanhVien', 'TongDiemCong',
      'TongDiemTru', 'TongDiem', 'DiemBinhQuan', 'XepHang', 'TrangThai'
    ];
    const rows = groupSummaries.map(g => [
      g.MaKy,
      g.MaLop,
      g.MaTo,
      g.SoThanhVien,
      g.TongDiemCong,
      g.TongDiemTru,
      g.TongDiem,
      g.DiemBinhQuan,
      g.XepHang,
      g.TrangThai
    ]);
    return [header, ...rows];
  }

  /**
   * Simulates/Prepares test sync
   */
  public static testSync() {
    const classes = classroomStore.getClasses();
    const students = classroomStore.getStudents();
    const categories = classroomStore.getEmulationCategories();
    const records = classroomStore.getEmulationRecords();
    
    return {
      success: true,
      mode: 'preparation',
      message: 'Lớp truy cập dữ liệu Google Sheets đã được khởi tạo và sẵn sàng liên kết đầy đủ 11 bảng dữ liệu (Bao gồm phân hệ Quản lý Lớp học và Thi đua Tuần). Dữ liệu hiện tại được đồng bộ an toàn qua Server Data Store.',
      previewPayload: {
        totalClassesRows: classes.length,
        totalStudentsRows: students.length,
        totalEmulationCategories: categories.length,
        totalEmulationRecords: records.length,
        sheetsConfigured: [
          'Trang 1: DanhSach_LopHoc',
          'Trang 2: DanhSach_HocSinh',
          'Trang 3: SoDiem_TongHop',
          'Trang 4: NhatKy_DiemDanh',
          'Trang 5: ToHocSinh',
          'Trang 6: ThanhVienTo',
          'Trang 7: DanhMucThiDua',
          'Trang 8: LichSuThiDua',
          'Trang 9: KyThiDua',
          'Trang 10: TongKetTuan',
          'Trang 11: TongKetTo'
        ]
      }
    };
  }
}
