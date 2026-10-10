import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { classroomStore } from '../data/store.ts';

const OFFICER_ROLE_LABELS: Record<string, string> = {
  LOP_TRUONG: 'Lớp trưởng',
  LOP_PHO_HOC_TAP: 'Lớp phó Học tập',
  LOP_PHO_KY_LUAT: 'Lớp phó Kỷ luật',
  LOP_PHO_LAO_DONG: 'Lớp phó Lao động',
  LOP_PHO_PHONG_TRAO: 'Lớp phó Phong trào',
  THU_QUY: 'Thủ quỹ',
  TO_TRUONG: 'Tổ trưởng',
  TO_PHO: 'Tổ phó',
  KHAC: 'Cán sự khác'
};

export class ExcelExportService {
  /**
   * Builds a multi-sheet XLSX workbook containing all application data
   */
  public static generateFullWorkbook(classIdFilter?: string): XLSX.WorkBook {
    const state = classroomStore.getState();
    const wb = XLSX.utils.book_new();

    const classes = classIdFilter 
      ? state.classes.filter(c => c.id === classIdFilter)
      : state.classes;
    const allowedClassIds = new Set(classes.map(c => c.id));

    const students = state.students.filter(s => allowedClassIds.has(s.classId));
    const officers = state.classOfficers.filter(o => allowedClassIds.has(o.classId));
    const seatingCharts = state.seatingCharts.filter(sc => allowedClassIds.has(sc.classId));
    const groups = state.emulationGroups.filter(g => allowedClassIds.has(g.MaLop));
    const allowedGroupIds = new Set(groups.map(g => g.MaTo));
    const groupMembers = state.groupMembers.filter(m => allowedGroupIds.has(m.MaTo));
    const periods = state.emulationPeriods;
    const categories = state.emulationCategories;
    const records = state.emulationRecords.filter(r => allowedClassIds.has(r.MaLop));
    const weeklySummaries = state.weeklyStudentSummaries.filter(w => allowedClassIds.has(w.MaLop));
    const attendance = state.attendance.filter(a => allowedClassIds.has(a.classId));

    // 1. Tab LopHoc
    const lopHocRows = classes.map(c => {
      const stuCount = students.filter(s => s.classId === c.id).length;
      return {
        'Mã Lớp': c.id,
        'Tên Lớp': c.name,
        'Khối': c.grade,
        'Năm Học': c.academicYear,
        'Giáo Viên Chủ Nhiệm': c.homeroomTeacher,
        'Phòng Học': c.room,
        'Sĩ Số Hiện Tại': stuCount,
        'Sĩ Số Tối Đa': c.maxStudents,
        'Ghi Chú': c.note || '',
        'Ngày Tạo': c.createdAt ? c.createdAt.split('T')[0] : ''
      };
    });
    const wsLopHoc = XLSX.utils.json_to_sheet(lopHocRows);
    wsLopHoc['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 14 },
      { wch: 24 }, { wch: 22 }, { wch: 14 }, { wch: 14 },
      { wch: 30 }, { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(wb, wsLopHoc, 'LopHoc');

    // 2. Tab HocSinh
    const hocSinhRows = students.map((s, idx) => {
      const cls = classes.find(c => c.id === s.classId);
      const memberEntry = groupMembers.find(m => m.MaHS === s.id);
      const grp = memberEntry ? groups.find(g => g.MaTo === memberEntry.MaTo) : null;
      return {
        'STT': idx + 1,
        'Mã Học Sinh': s.id,
        'Mã Định Danh': s.studentCode || '',
        'Họ Và Tên': s.fullName,
        'Giới Tính': s.gender === 'female' ? 'Nữ' : 'Nam',
        'Ngày Sinh': s.birthDate || '',
        'Mã Lớp': s.classId,
        'Tên Lớp': cls?.name || s.classId,
        'Tổ Thi Đua': grp?.TenTo || 'Chưa phân tổ',
        'Họ Tên Phụ Huynh': s.parentName || '',
        'SĐT Phụ Huynh': s.parentPhone || '',
        'Địa Chỉ Thường Trú': s.address || '',
        'Trạng Thái': s.status === 'active' ? 'Đang học' : s.status === 'transferred' ? 'Chuyển trường' : 'Nghỉ học',
        'Ghi Chú': s.note || ''
      };
    });
    const wsHocSinh = XLSX.utils.json_to_sheet(hocSinhRows);
    wsHocSinh['!cols'] = [
      { wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 26 },
      { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 12 },
      { wch: 14 }, { wch: 22 }, { wch: 16 }, { wch: 32 },
      { wch: 14 }, { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(wb, wsHocSinh, 'HocSinh');

    // 3. Tab BanCanSu (Ban Cán sự lớp)
    const banCanSuRows = officers.map((o, idx) => {
      const cls = classes.find(c => c.id === o.classId);
      const stu = students.find(s => s.id === o.studentId);
      return {
        'STT': idx + 1,
        'Mã Cán Sự': o.id,
        'Mã Lớp': o.classId,
        'Tên Lớp': cls?.name || o.classId,
        'Mã Học Sinh': o.studentId,
        'Họ Và Tên': o.studentName || stu?.fullName || '',
        'Chức Vụ': OFFICER_ROLE_LABELS[o.role] || o.role,
        'Chức Danh Riêng': o.customRoleTitle || '',
        'Nhiệm Vụ Phân Công': o.duty || '',
        'SĐT Liên Hệ': o.contactPhone || stu?.parentPhone || '',
        'Ngày Bổ Nhiệm': o.appointedDate || '2026-09-07'
      };
    });
    const wsBanCanSu = XLSX.utils.json_to_sheet(banCanSuRows);
    wsBanCanSu['!cols'] = [
      { wch: 6 }, { wch: 14 }, { wch: 10 }, { wch: 12 },
      { wch: 14 }, { wch: 24 }, { wch: 20 }, { wch: 18 },
      { wch: 45 }, { wch: 16 }, { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(wb, wsBanCanSu, 'BanCanSu');

    // 4. Tab SoDoChoNgoi (Sơ đồ chỗ ngồi học sinh)
    const soDoRows: any[] = [];
    seatingCharts.forEach(sc => {
      const cls = classes.find(c => c.id === sc.classId);
      (sc.seats || []).forEach(seat => {
        const stu = seat.studentId ? students.find(s => s.id === seat.studentId) : null;
        const officer = seat.studentId ? officers.find(o => o.studentId === seat.studentId) : null;
        soDoRows.push({
          'Mã Lớp': sc.classId,
          'Tên Lớp': cls?.name || sc.classId,
          'Tên Sơ Đồ': sc.title,
          'Mã Vị Trí': seat.seatId,
          'Hàng Ghế (Row)': `Hàng ${seat.row}`,
          'Dãy Bàn (Col)': `Dãy ${seat.column}`,
          'Vị Trí Ghế': `Bàn số ${seat.seatIndex}`,
          'Mã Học Sinh': seat.studentId || '(Trống)',
          'Họ Và Tên Học Sinh': stu?.fullName || seat.studentName || '(Bàn trống)',
          'Chức Vụ Cán Sự': officer ? (OFFICER_ROLE_LABELS[officer.role] || officer.role) : '',
          'Ghi Chú Ghế': seat.note || ''
        });
      });
    });
    const wsSoDo = XLSX.utils.json_to_sheet(soDoRows);
    wsSoDo['!cols'] = [
      { wch: 10 }, { wch: 12 }, { wch: 30 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
      { wch: 24 }, { wch: 20 }, { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(wb, wsSoDo, 'SoDoChoNgoi');

    // 5. Tab ToThiDua & PhanTo
    const toRows: any[] = [];
    let toMemberIdx = 1;
    groups.forEach(g => {
      const cls = classes.find(c => c.id === g.MaLop);
      const membersInG = groupMembers.filter(m => m.MaTo === g.MaTo);
      if (membersInG.length === 0) {
        toRows.push({
          'STT': toMemberIdx++,
          'Mã Lớp': g.MaLop,
          'Tên Lớp': cls?.name || g.MaLop,
          'Mã Tổ': g.MaTo,
          'Tên Tổ': g.TenTo,
          'Tổ Trưởng': g.ToTruong || '',
          'Mã Học Sinh': '',
          'Tên Học Sinh': '(Chưa có học sinh)',
          'Ngày Vào Tổ': '',
          'Trạng Thái Tổ': g.TrangThai === 'DANG_HOAT_DONG' ? 'Đang hoạt động' : 'Ngưng'
        });
      } else {
        membersInG.forEach(m => {
          const stu = students.find(s => s.id === m.MaHS);
          toRows.push({
            'STT': toMemberIdx++,
            'Mã Lớp': g.MaLop,
            'Tên Lớp': cls?.name || g.MaLop,
            'Mã Tổ': g.MaTo,
            'Tên Tổ': g.TenTo,
            'Tổ Trưởng': g.ToTruong || '',
            'Mã Học Sinh': m.MaHS,
            'Tên Học Sinh': stu?.fullName || '',
            'Ngày Vào Tổ': m.TuNgay || '2026-09-07',
            'Trạng Thái Tổ': g.TrangThai === 'DANG_HOAT_DONG' ? 'Đang hoạt động' : 'Ngưng'
          });
        });
      }
    });
    const wsToThiDua = XLSX.utils.json_to_sheet(toRows);
    wsToThiDua['!cols'] = [
      { wch: 6 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
      { wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 24 },
      { wch: 14 }, { wch: 16 }
    ];
    XLSX.utils.book_append_sheet(wb, wsToThiDua, 'ToThiDua');

    // 6. Tab TuanThiDua (Các tuần thi đua)
    const tuanRows = periods.map(p => ({
      'Mã Kỳ (MaKy)': p.MaKy,
      'Tuần Số': p.TuanSo,
      'Năm Học': p.NamHoc,
      'Từ Ngày (Thứ Hai)': p.TuNgay,
      'Đến Ngày (Chủ Nhật)': p.DenNgay,
      'Điểm Khởi Điểm': p.DiemDauTuan,
      'Trạng Thái': p.TrangThai === 'DA_KHOA' ? 'Đã khóa sổ' : 'Đang diễn ra',
      'Thời Gian Khóa': p.ThoiGianKhoa ? p.ThoiGianKhoa.replace('T', ' ').slice(0, 19) : '',
      'Người Khóa': p.NguoiKhoa || '',
      'Chủ Đề Thi Đua / Ghi Chú': p.GhiChu || ''
    }));
    const wsTuan = XLSX.utils.json_to_sheet(tuanRows);
    wsTuan['!cols'] = [
      { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 18 },
      { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 20 },
      { wch: 16 }, { wch: 40 }
    ];
    XLSX.utils.book_append_sheet(wb, wsTuan, 'TuanThiDua');

    // 7. Tab DanhMucThiDua (Quy định & Thang điểm)
    const danhMucRows = categories.map(cat => ({
      'Mã Tiêu Chí': cat.MaLoi,
      'Nội Dung / Tiêu Chí': cat.TenLoi,
      'Phân Loại': cat.Loai === 'CONG' ? 'Cộng điểm (Khen thưởng)' : 'Trừ điểm (Vi phạm)',
      'Điểm Số': cat.Loai === 'CONG' ? `+${cat.Diem}` : `-${Math.abs(cat.Diem)}`,
      'Mô Tả Quy Định': cat.MoTa || '',
      'Trạng Thái Áp Dụng': cat.TrangThai === 'DANG_DUNG' ? 'Đang áp dụng' : 'Tạm ẩn'
    }));
    const wsDanhMuc = XLSX.utils.json_to_sheet(danhMucRows);
    wsDanhMuc['!cols'] = [
      { wch: 14 }, { wch: 30 }, { wch: 24 }, { wch: 10 },
      { wch: 40 }, { wch: 18 }
    ];
    XLSX.utils.book_append_sheet(wb, wsDanhMuc, 'DanhMucThiDua');

    // 8. Tab LichSuThiDua (Sổ ghi nhận thi đua chi tiết)
    const lichSuRows = records.map((r, idx) => {
      const cls = classes.find(c => c.id === r.MaLop);
      return {
        'STT': idx + 1,
        'Mã Ghi Nhận': r.MaGhiNhan,
        'Ngày Xảy Ra': r.Ngay,
        'Tuần Thi Đua': r.MaKy,
        'Mã Lớp': r.MaLop,
        'Lớp': cls?.name || r.MaLop,
        'Mã Học Sinh': r.MaHS,
        'Tên Học Sinh': r.TenHS,
        'Tổ': r.TenTo || '',
        'Tiêu Chí': r.TenLoi,
        'Phân Loại': r.Loai === 'CONG' ? 'Khen thưởng (+)' : 'Vi phạm (-)',
        'Điểm': r.Diem,
        'Ghi Chú': r.GhiChu || '',
        'Người Ghi Nhận': r.NguoiGhiNhan || 'Sao đỏ / GVCN',
        'Trạng Thái': r.TrangThai === 'HIEU_LUC' ? 'Hiệu lực' : 'Đã hủy',
        'Thời Gian Tạo': r.ThoiGianTao ? r.ThoiGianTao.replace('T', ' ').slice(0, 19) : ''
      };
    });
    const wsLichSu = XLSX.utils.json_to_sheet(lichSuRows);
    wsLichSu['!cols'] = [
      { wch: 6 }, { wch: 16 }, { wch: 14 }, { wch: 14 },
      { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 24 },
      { wch: 14 }, { wch: 26 }, { wch: 16 }, { wch: 8 },
      { wch: 25 }, { wch: 18 }, { wch: 12 }, { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(wb, wsLichSu, 'LichSuThiDua');

    // 9. Tab TongKetTuan (Tổng kết điểm theo tuần)
    const tongKetRows = weeklySummaries.map((w, idx) => {
      const cls = classes.find(c => c.id === w.MaLop);
      const stu = students.find(s => s.id === w.MaHS);
      return {
        'STT': idx + 1,
        'Tuần Thi Đua': w.MaKy,
        'Mã Lớp': w.MaLop,
        'Lớp': cls?.name || w.MaLop,
        'Mã Học Sinh': w.MaHS,
        'Tên Học Sinh': stu?.fullName || '',
        'Điểm Đầu Tuần': w.DiemDauTuan,
        'Tổng Điểm Cộng': w.TongDiemCong,
        'Tổng Điểm Trừ': w.TongDiemTru,
        'Điểm Cuối Tuần': w.DiemCuoiTuan,
        'Số Thành Tích': w.SoThanhTich,
        'Số Vi Phạm': w.SoViPham,
        'Xếp Hạng': w.XepHang,
        'Trạng Thái Tuần': w.TrangThai === 'DA_KHOA' ? 'Đã khóa sổ' : 'Đang tính'
      };
    });
    const wsTongKet = XLSX.utils.json_to_sheet(tongKetRows);
    wsTongKet['!cols'] = [
      { wch: 6 }, { wch: 14 }, { wch: 10 }, { wch: 10 },
      { wch: 14 }, { wch: 24 }, { wch: 14 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
      { wch: 10 }, { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(wb, wsTongKet, 'TongKetTuan');

    // 10. Tab DiemDanh (Nhật ký điểm danh)
    const diemDanhRows = attendance.map((a, idx) => {
      const cls = classes.find(c => c.id === a.classId);
      const stu = students.find(s => s.id === a.studentId);
      return {
        'STT': idx + 1,
        'Mã Điểm Danh': a.id,
        'Ngày Điểm Danh': a.date,
        'Mã Lớp': a.classId,
        'Lớp': cls?.name || a.classId,
        'Mã Học Sinh': a.studentId,
        'Tên Học Sinh': stu?.fullName || a.studentId,
        'Trạng Thái': a.status === 'present' ? 'Có mặt' : a.status === 'excused' ? 'Nghỉ có phép' : 'Nghỉ không phép',
        'Lý Do / Ghi Chú': a.note || ''
      };
    });
    const wsDiemDanh = XLSX.utils.json_to_sheet(diemDanhRows);
    wsDiemDanh['!cols'] = [
      { wch: 6 }, { wch: 16 }, { wch: 14 }, { wch: 10 },
      { wch: 10 }, { wch: 14 }, { wch: 24 }, { wch: 18 },
      { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, wsDiemDanh, 'DiemDanh');

    // 11. Tab ThongTinHeThong (Cấu hình & Giới thiệu)
    const thongTinRows = [
      { 'Hạng Mục': 'Tên Ứng Dụng', 'Giá Trị': 'HỆ THỐNG QUẢN LÝ LỚP HỌC TOÀN DIỆN', 'Ghi Chú': 'Phần mềm quản lý sư phạm' },
      { 'Hạng Mục': 'Tên Trường', 'Giá Trị': state.settings?.schoolName || 'TRƯỜNG THPT CHUYÊN NGUYỄN HUỆ', 'Ghi Chú': 'Đơn vị giáo dục' },
      { 'Hạng Mục': 'Năm Học', 'Giá Trị': state.settings?.academicYear || '2026 - 2027', 'Ghi Chú': 'Năm học hiện hành' },
      { 'Hạng Mục': 'Học Kỳ Hiện Tại', 'Giá Trị': state.settings?.currentSemester || 'Học kỳ 1', 'Ghi Chú': 'Kỳ học' },
      { 'Hạng Mục': 'Giáo Viên Phụ Trách', 'Giá Trị': state.settings?.teacherName || 'Nguyễn Văn Xuyên', 'Ghi Chú': 'GVCN' },
      { 'Hạng Mục': 'Email Giáo Viên', 'Giá Trị': state.settings?.teacherEmail || 'xuyencamau2210@gmail.com', 'Ghi Chú': 'Email liên hệ' },
      { 'Hạng Mục': 'Số Điện Thoại GV', 'Giá Trị': state.settings?.teacherPhone || '0912 345 678', 'Ghi Chú': 'SĐT' },
      { 'Hạng Mục': 'Tổ Bộ Môn', 'Giá Trị': state.settings?.department || 'Tổ Toán - Tin học', 'Ghi Chú': 'Chuyên môn' },
      { 'Hạng Mục': 'Khởi Điểm Tuần 1', 'Giá Trị': '2026-09-07', 'Ghi Chú': 'Bắt đầu năm học mới' },
      { 'Hạng Mục': 'Thời Gian Xuất Tệp', 'Giá Trị': new Date().toLocaleString('vi-VN'), 'Ghi Chú': 'Thời điểm tạo file Excel' }
    ];
    const wsThongTin = XLSX.utils.json_to_sheet(thongTinRows);
    wsThongTin['!cols'] = [
      { wch: 24 }, { wch: 45 }, { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, wsThongTin, 'ThongTinHeThong');

    return wb;
  }

  /**
   * Generates a binary buffer of the Excel file
   */
  public static generateExcelBuffer(classIdFilter?: string): Buffer {
    const wb = this.generateFullWorkbook(classIdFilter);
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Saves the Excel file to disk at the specified paths
   */
  public static saveExcelFilesToDisk(): { mainFilePath: string; publicDownloadPath: string; fileName: string; size: number } {
    const buffer = this.generateExcelBuffer();
    const fileName = 'Du_Lieu_Quan_Ly_Lop_Hoc_2026_2027.xlsx';
    
    // Save to root directory
    const mainFilePath = path.resolve(process.cwd(), fileName);
    fs.writeFileSync(mainFilePath, buffer);

    // Save to public/downloads for static download serving
    const downloadsDir = path.resolve(process.cwd(), 'public', 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }
    const publicDownloadPath = path.resolve(downloadsDir, fileName);
    fs.writeFileSync(publicDownloadPath, buffer);

    return {
      mainFilePath,
      publicDownloadPath,
      fileName,
      size: buffer.length
    };
  }

  /**
   * Summary information about the Excel export datasets
   */
  public static getExportSummary(classIdFilter?: string) {
    const state = classroomStore.getState();
    const classes = classIdFilter 
      ? state.classes.filter(c => c.id === classIdFilter)
      : state.classes;
    const allowedClassIds = new Set(classes.map(c => c.id));

    return {
      fileName: 'Du_Lieu_Quan_Ly_Lop_Hoc_2026_2027.xlsx',
      downloadUrl: '/api/export/excel',
      staticUrl: '/downloads/Du_Lieu_Quan_Ly_Lop_Hoc_2026_2027.xlsx',
      totalSheets: 11,
      sheetNames: [
        'LopHoc',
        'HocSinh',
        'BanCanSu',
        'SoDoChoNgoi',
        'ToThiDua',
        'TuanThiDua',
        'DanhMucThiDua',
        'LichSuThiDua',
        'TongKetTuan',
        'DiemDanh',
        'ThongTinHeThong'
      ],
      counts: {
        classes: classes.length,
        students: state.students.filter(s => allowedClassIds.has(s.classId)).length,
        officers: state.classOfficers.filter(o => allowedClassIds.has(o.classId)).length,
        seatingCharts: state.seatingCharts.filter(sc => allowedClassIds.has(sc.classId)).length,
        groups: state.emulationGroups.filter(g => allowedClassIds.has(g.MaLop)).length,
        periods: state.emulationPeriods.length,
        categories: state.emulationCategories.length,
        records: state.emulationRecords.filter(r => allowedClassIds.has(r.MaLop)).length,
        attendance: state.attendance.filter(a => allowedClassIds.has(a.classId)).length
      },
      exportedAt: new Date().toISOString()
    };
  }
}
