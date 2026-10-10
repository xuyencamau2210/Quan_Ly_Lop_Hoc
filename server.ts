import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { classroomStore } from './server/data/store.ts';
import { GoogleSheetsService } from './server/services/googleSheetsService.ts';
import { GoogleDriveService } from './server/services/googleDriveService.ts';
import { GoogleWorkspaceService } from './server/services/workspaceService.ts';
import { ExcelExportService } from './server/services/excelExportService.ts';
import { runEmulationTestSuite } from './server/test_emulation_suite.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Phục vụ tải tệp Excel tĩnh
app.use('/downloads', express.static(path.resolve(__dirname, 'public', 'downloads')));

// --- XUẤT TỆP EXCEL (.xlsx) LƯU TRỮ DỮ LIỆU ---
app.get('/api/export/excel', (req: Request, res: Response) => {
  try {
    const classId = req.query.classId as string | undefined;
    const buffer = ExcelExportService.generateExcelBuffer(classId);
    const fileName = classId 
      ? `Du_Lieu_Lop_${classId}_2026_2027.xlsx`
      : 'Du_Lieu_Quan_Ly_Lop_Hoc_2026_2027.xlsx';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.send(buffer);
  } catch (error: any) {
    console.error('Lỗi khi xuất file Excel:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi tạo và xuất file Excel' });
  }
});

app.get('/api/export/excel/summary', (req: Request, res: Response) => {
  try {
    const classId = req.query.classId as string | undefined;
    const summary = ExcelExportService.getExportSummary(classId);
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi lấy thông tin tệp Excel' });
  }
});

app.post('/api/export/excel/generate', (_req: Request, res: Response) => {
  try {
    const result = ExcelExportService.saveExcelFilesToDisk();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi ghi tệp Excel lên ổ đĩa' });
  }
});

// API Routes

// 1. Dashboard Stats
app.get('/api/stats', (_req: Request, res: Response) => {
  try {
    const stats = classroomStore.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Lỗi khi tải dữ liệu thống kê' });
  }
});

// 2. Classes API
app.get('/api/classes', (_req: Request, res: Response) => {
  try {
    const classes = classroomStore.getClasses();
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tải danh sách lớp học' });
  }
});

app.get('/api/classes/:id', (req: Request, res: Response) => {
  try {
    const cls = classroomStore.getClassById(req.params.id);
    if (!cls) return res.status(404).json({ error: 'Không tìm thấy lớp học' });
    res.json(cls);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy thông tin lớp học' });
  }
});

app.post('/api/classes', (req: Request, res: Response) => {
  try {
    const { name, grade, academicYear, homeroomTeacher, room, maxStudents, note } = req.body;
    if (!name || !grade) {
      return res.status(400).json({ error: 'Tên lớp và khối học là bắt buộc' });
    }
    const newClass = classroomStore.createClass({
      name: name.trim(),
      grade: Number(grade),
      academicYear: academicYear || '2025 - 2026',
      homeroomTeacher: homeroomTeacher || 'Chưa phân công',
      room: room || 'Chưa xếp phòng',
      maxStudents: Number(maxStudents) || 45,
      note: note || ''
    });
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tạo lớp học' });
  }
});

app.put('/api/classes/:id', (req: Request, res: Response) => {
  try {
    const updated = classroomStore.updateClass(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy lớp học' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật lớp học' });
  }
});

app.delete('/api/classes/:id', (req: Request, res: Response) => {
  try {
    const result = classroomStore.deleteClass(req.params.id);
    if (!result.success) return res.status(400).json({ error: result.message });
    res.json({ message: 'Xóa lớp học thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa lớp học' });
  }
});

// Class Officers (Ban cán sự lớp)
app.get('/api/classes/:id/officers', (req: Request, res: Response) => {
  try {
    const officers = classroomStore.getClassOfficers(req.params.id);
    res.json(officers);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi tải danh sách ban cán sự' });
  }
});

app.post('/api/classes/:id/officers', (req: Request, res: Response) => {
  try {
    const { studentId, role, customRoleTitle, duty, contactPhone } = req.body;
    if (!studentId || !role) {
      return res.status(400).json({ error: 'Cần chọn học sinh và chức vụ ban cán sự' });
    }
    const officer = classroomStore.assignClassOfficer({
      classId: req.params.id,
      studentId,
      role,
      customRoleTitle,
      duty,
      contactPhone
    });
    res.status(201).json(officer);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi phân công ban cán sự' });
  }
});

app.put('/api/classes/:id/officers/:officerId', (req: Request, res: Response) => {
  try {
    const updated = classroomStore.updateClassOfficer(req.params.officerId, req.body);
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy chức vụ ban cán sự' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi cập nhật ban cán sự' });
  }
});

app.delete('/api/classes/:id/officers/:officerId', (req: Request, res: Response) => {
  try {
    const success = classroomStore.removeClassOfficer(req.params.officerId);
    if (!success) return res.status(404).json({ error: 'Không tìm thấy chức vụ để xóa' });
    res.json({ success: true, message: 'Đã hủy phân công ban cán sự' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi xóa phân công ban cán sự' });
  }
});

// Seating Chart (Sơ đồ chỗ ngồi)
app.get('/api/classes/:id/seating-chart', (req: Request, res: Response) => {
  try {
    const chart = classroomStore.getSeatingChart(req.params.id);
    res.json(chart);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi tải sơ đồ chỗ ngồi' });
  }
});

app.put('/api/classes/:id/seating-chart', (req: Request, res: Response) => {
  try {
    const chart = classroomStore.saveSeatingChart(req.body);
    res.json(chart);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi lưu sơ đồ chỗ ngồi' });
  }
});

app.post('/api/classes/:id/seating-chart/assign', (req: Request, res: Response) => {
  try {
    const { seatId, studentId, note } = req.body;
    if (!seatId) return res.status(400).json({ error: 'Cần cung cấp mã vị trí ghế' });
    const chart = classroomStore.updateSeatAssignment(req.params.id, seatId, studentId, note);
    res.json(chart);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi xếp chỗ ngồi học sinh' });
  }
});

app.post('/api/classes/:id/seating-chart/swap', (req: Request, res: Response) => {
  try {
    const { seatIdA, seatIdB } = req.body;
    if (!seatIdA || !seatIdB) return res.status(400).json({ error: 'Cần cung cấp 2 vị trí ghế để đổi chỗ' });
    const chart = classroomStore.swapSeats(req.params.id, seatIdA, seatIdB);
    res.json(chart);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi đổi chỗ ngồi' });
  }
});

app.post('/api/classes/:id/seating-chart/auto-arrange', (req: Request, res: Response) => {
  try {
    const { mode } = req.body;
    if (!mode) return res.status(400).json({ error: 'Cần chọn chế độ xếp chỗ' });
    const chart = classroomStore.autoArrangeSeats(req.params.id, mode);
    res.json(chart);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi tự động xếp chỗ ngồi' });
  }
});

// 3. Students API
app.get('/api/students', (req: Request, res: Response) => {
  try {
    const { classId, search, status } = req.query;
    const students = classroomStore.getStudents({
      classId: classId as string,
      search: search as string,
      status: status as string
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tải danh sách học sinh' });
  }
});

app.get('/api/students/:id', (req: Request, res: Response) => {
  try {
    const student = classroomStore.getStudentById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Không tìm thấy học sinh' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy thông tin học sinh' });
  }
});

app.post('/api/students', (req: Request, res: Response) => {
  try {
    const { fullName, classId, birthDate, gender, parentName, parentPhone, address, status, note, studentCode } = req.body;
    if (!fullName || !classId) {
      return res.status(400).json({ error: 'Họ tên và lớp học là bắt buộc' });
    }
    const newStudent = classroomStore.createStudent({
      fullName: fullName.trim(),
      studentCode: studentCode || '',
      classId,
      className: '',
      gender: gender || 'male',
      birthDate: birthDate || '2010-01-01',
      parentName: parentName || '',
      parentPhone: parentPhone || '',
      address: address || '',
      status: status || 'active',
      note: note || ''
    });
    res.status(201).json(newStudent);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi thêm học sinh' });
  }
});

app.put('/api/students/:id', (req: Request, res: Response) => {
  try {
    const updated = classroomStore.updateStudent(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy học sinh' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật học sinh' });
  }
});

app.delete('/api/students/:id', (req: Request, res: Response) => {
  try {
    const result = classroomStore.deleteStudent(req.params.id);
    if (!result.success) return res.status(400).json({ error: result.message });
    res.json({ message: 'Xóa học sinh thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa học sinh' });
  }
});

// 4. Attendance API
app.get('/api/attendance', (req: Request, res: Response) => {
  try {
    const { classId, date } = req.query;
    if (!classId || !date) {
      return res.status(400).json({ error: 'Cần cung cấp classId và date' });
    }
    const records = classroomStore.getAttendance(classId as string, date as string);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy thông tin điểm danh' });
  }
});

app.post('/api/attendance', (req: Request, res: Response) => {
  try {
    const { classId, date, records } = req.body;
    if (!classId || !date || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Dữ liệu điểm danh không hợp lệ' });
    }
    const result = classroomStore.saveAttendance(classId, date, records);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lưu điểm danh' });
  }
});

app.get('/api/attendance/history', (req: Request, res: Response) => {
  try {
    const { classId } = req.query;
    const history = classroomStore.getAttendanceHistory(classId as string);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy lịch sử điểm danh' });
  }
});

// 5. Grades API
app.get('/api/grades', (req: Request, res: Response) => {
  try {
    const { classId, subject, semester } = req.query;
    if (!classId) {
      return res.status(400).json({ error: 'Cần chọn lớp học' });
    }
    const grades = classroomStore.getGrades(
      classId as string,
      (subject as string) || 'Toán học',
      (semester as string) || 'HK1'
    );
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tải bảng điểm' });
  }
});

app.post('/api/grades/batch', (req: Request, res: Response) => {
  try {
    const { classId, subject, semester, grades } = req.body;
    if (!classId || !subject || !semester || !Array.isArray(grades)) {
      return res.status(400).json({ error: 'Thông tin bảng điểm không hợp lệ' });
    }
    const result = classroomStore.saveGradeBatch(classId, subject, semester, grades);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lưu bảng điểm' });
  }
});

app.put('/api/grades', (req: Request, res: Response) => {
  try {
    const grade = req.body;
    const updated = classroomStore.saveSingleGrade(grade);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật điểm học sinh' });
  }
});

// 6. Documents API
app.get('/api/documents', (req: Request, res: Response) => {
  try {
    const { classId, category } = req.query;
    const docs = classroomStore.getDocuments(classId as string, category as string);
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tải danh sách tài liệu' });
  }
});

app.post('/api/documents', (req: Request, res: Response) => {
  try {
    const { title, category, classId, className, subject, driveUrl, fileSize, fileExtension, uploadedBy, description } = req.body;
    if (!title || !category || !driveUrl) {
      return res.status(400).json({ error: 'Tiêu đề, phân loại và liên kết Google Drive là bắt buộc' });
    }
    const newDoc = classroomStore.createDocument({
      title: title.trim(),
      category,
      classId,
      className,
      subject,
      driveUrl: driveUrl.trim(),
      fileSize: fileSize || '1.0 MB',
      fileExtension: fileExtension || 'PDF',
      uploadedBy: uploadedBy || 'Giáo viên',
      isGoogleDriveSynced: false,
      description: description || ''
    });
    res.status(201).json(newDoc);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi thêm tài liệu' });
  }
});

app.delete('/api/documents/:id', (req: Request, res: Response) => {
  try {
    const result = classroomStore.deleteDocument(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa tài liệu' });
  }
});

// 7. Settings & Sync API
app.get('/api/settings', (_req: Request, res: Response) => {
  try {
    const settings = classroomStore.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tải cài đặt hệ thống' });
  }
});

app.put('/api/settings', (req: Request, res: Response) => {
  try {
    const updated = classroomStore.updateSettings(req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lưu cài đặt' });
  }
});

app.get('/api/sync/status', (_req: Request, res: Response) => {
  try {
    const settings = classroomStore.getSettings();
    const sheetsStatus = GoogleSheetsService.checkConnection();
    const driveStatus = GoogleDriveService.checkConnection();

    res.json({
      storageMode: settings.storageMode,
      activeStorage: 'Server Data Store (Tệp JSON kiên cố trên máy chủ)',
      googleSheets: sheetsStatus,
      googleDrive: driveStatus,
      message: 'Hệ thống đang hoạt động trên Server Data Store độc lập. Đã chuẩn bị sẵn sàng kiến trúc đồng bộ 2 chiều với Google Sheets & Google Drive.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi kiểm tra trạng thái dịch vụ lưu trữ' });
  }
});

app.post('/api/sync/sheets/test', (_req: Request, res: Response) => {
  try {
    const result = GoogleSheetsService.testSync();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi kiểm tra dịch vụ Google Sheets' });
  }
});

app.post('/api/sync/drive/test', (_req: Request, res: Response) => {
  try {
    const result = GoogleDriveService.testSync();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi kiểm tra dịch vụ Google Drive' });
  }
});

app.post('/api/sync/reset-demo', (_req: Request, res: Response) => {
  try {
    classroomStore.resetToInitialData();
    res.json({ message: 'Đã khôi phục dữ liệu mẫu chuẩn thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi khôi phục dữ liệu mẫu' });
  }
});

// 8. Reports API
app.get('/api/reports/summary', (_req: Request, res: Response) => {
  try {
    const classes = classroomStore.getClasses();
    const students = classroomStore.getStudents();
    const stats = classroomStore.getDashboardStats();
    
    res.json({
      schoolName: classroomStore.getSettings().schoolName,
      academicYear: classroomStore.getSettings().academicYear,
      generatedDate: new Date().toLocaleDateString('vi-VN'),
      classes,
      totalStudents: students.length,
      maleCount: students.filter(s => s.gender === 'male').length,
      femaleCount: students.filter(s => s.gender === 'female').length,
      stats
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xuất dữ liệu báo cáo' });
  }
});

// ==========================================
// 9. THI ĐUA VÀ VI PHẠM HỌC SINH (API ROUTES)
// ==========================================

// Danh mục thi đua
app.get('/api/emulation/categories', (_req: Request, res: Response) => {
  try {
    const categories = classroomStore.getEmulationCategories();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi tải danh mục thi đua' });
  }
});

app.post('/api/emulation/categories', (req: Request, res: Response) => {
  try {
    const { TenLoi, Loai, Diem, MoTa, TrangThai } = req.body;
    if (!TenLoi || !Loai || Diem === undefined) {
      return res.status(400).json({ error: 'Tên lỗi/thành tích, loại (CONG/TRU) và điểm số là bắt buộc' });
    }
    const cat = classroomStore.createEmulationCategory({ TenLoi, Loai, Diem, MoTa, TrangThai });
    res.status(201).json(cat);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi tạo danh mục' });
  }
});

app.put('/api/emulation/categories/:id', (req: Request, res: Response) => {
  try {
    const updated = classroomStore.updateEmulationCategory(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy danh mục' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi cập nhật danh mục' });
  }
});

app.patch('/api/emulation/categories/:id/toggle', (req: Request, res: Response) => {
  try {
    const updated = classroomStore.toggleEmulationCategoryStatus(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy danh mục' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi đổi trạng thái danh mục' });
  }
});

// Tổ và Thành viên
app.get('/api/emulation/groups', (req: Request, res: Response) => {
  try {
    const { classId } = req.query;
    const groups = classroomStore.getEmulationGroups(classId as string);
    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi tải danh sách tổ' });
  }
});

app.post('/api/emulation/groups', (req: Request, res: Response) => {
  try {
    const { MaLop, TenTo, ToTruong } = req.body;
    if (!MaLop || !TenTo) {
      return res.status(400).json({ error: 'Mã lớp và tên tổ là bắt buộc' });
    }
    const group = classroomStore.createEmulationGroup({ MaLop, TenTo, ToTruong });
    res.status(201).json(group);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi tạo tổ học sinh' });
  }
});

app.put('/api/emulation/groups/:id', (req: Request, res: Response) => {
  try {
    const { TenTo, ToTruong, TrangThai } = req.body;
    const updated = classroomStore.updateEmulationGroup(req.params.id, { TenTo, ToTruong, TrangThai });
    if (!updated) {
      return res.status(404).json({ error: 'Không tìm thấy tổ học sinh' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi cập nhật tổ học sinh' });
  }
});

app.delete('/api/emulation/groups/:id', (req: Request, res: Response) => {
  try {
    const success = classroomStore.deleteEmulationGroup(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Không tìm thấy tổ học sinh để xóa' });
    }
    res.json({ success: true, message: 'Đã xóa tổ học sinh thành công' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi xóa tổ học sinh' });
  }
});

app.get('/api/emulation/groups/members', (req: Request, res: Response) => {
  try {
    const { classId } = req.query;
    const members = classroomStore.getGroupMembers(classId as string);
    res.json(members);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi lấy danh sách thành viên tổ' });
  }
});

app.post('/api/emulation/groups/assign', (req: Request, res: Response) => {
  try {
    const { MaHS, MaTo, TuNgay } = req.body;
    if (!MaHS || !MaTo) {
      return res.status(400).json({ error: 'Cần cung cấp mã học sinh và mã tổ' });
    }
    const member = classroomStore.assignStudentToGroup(MaHS, MaTo, TuNgay);
    res.json(member);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi phân tổ học sinh' });
  }
});

app.post('/api/emulation/groups/unassign', (req: Request, res: Response) => {
  try {
    const { MaHS } = req.body;
    if (!MaHS) {
      return res.status(400).json({ error: 'Cần cung cấp mã học sinh' });
    }
    const success = classroomStore.unassignStudentFromGroup(MaHS);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi hủy phân tổ học sinh' });
  }
});

app.post('/api/emulation/groups/batch-assign', (req: Request, res: Response) => {
  try {
    const { assignments, TuNgay } = req.body;
    if (!Array.isArray(assignments)) {
      return res.status(400).json({ error: 'assignments phải là một danh sách' });
    }
    const results = classroomStore.batchAssignStudentsToGroup(assignments, TuNgay);
    res.json({ success: true, count: results.length, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi phân tổ hàng loạt' });
  }
});

app.post('/api/emulation/groups/auto-divide', (req: Request, res: Response) => {
  try {
    const { classId, groupIds, assignOnlyUnassigned } = req.body;
    if (!classId || !Array.isArray(groupIds) || groupIds.length === 0) {
      return res.status(400).json({ error: 'Cần chọn lớp và ít nhất một tổ để phân chia' });
    }
    const result = classroomStore.autoAssignStudentsEqually(classId, groupIds, Boolean(assignOnlyUnassigned));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi tự động chia đều tổ' });
  }
});

// Kỳ thi đua
app.get('/api/emulation/periods', (_req: Request, res: Response) => {
  try {
    const periods = classroomStore.getEmulationPeriods();
    res.json(periods);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi tải danh sách tuần thi đua' });
  }
});

app.post('/api/emulation/periods', (req: Request, res: Response) => {
  try {
    const { NamHoc, TuanSo, TuNgay, DenNgay, DiemDauTuan, GhiChu, MaKy, TrangThai } = req.body;
    if (!TuanSo || !TuNgay || !DenNgay) {
      return res.status(400).json({ error: 'Cần cung cấp tuần số, từ ngày và đến ngày' });
    }
    const period = classroomStore.createEmulationPeriod({ NamHoc, TuanSo, TuNgay, DenNgay, DiemDauTuan, GhiChu, MaKy, TrangThai });
    res.status(201).json(period);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi tạo tuần thi đua' });
  }
});

app.put('/api/emulation/periods/:id', (req: Request, res: Response) => {
  try {
    const updated = classroomStore.updateEmulationPeriod(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Không tìm thấy tuần thi đua' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi cập nhật tuần thi đua' });
  }
});

app.delete('/api/emulation/periods/:id', (req: Request, res: Response) => {
  try {
    const success = classroomStore.deleteEmulationPeriod(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Không tìm thấy tuần thi đua để xóa' });
    }
    res.json({ success: true, message: 'Đã xóa tuần thi đua' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi xóa tuần thi đua' });
  }
});

app.post('/api/emulation/periods/reset', (req: Request, res: Response) => {
  try {
    const { startDate, totalWeeks } = req.body;
    const periods = classroomStore.resetEmulationPeriodsToAcademicYear(
      startDate || '2026-09-07',
      totalWeeks ? Number(totalWeeks) : 18
    );
    res.json({
      success: true,
      message: 'Đã thiết lập lại danh sách tuần thi đua bắt đầu từ 07/09/2026 thành công',
      count: periods.length,
      periods
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi thiết lập lại tuần thi đua' });
  }
});

// Ghi nhận sự việc
app.get('/api/emulation/records', (req: Request, res: Response) => {
  try {
    const { classId, periodId, studentId, type, date, status } = req.query;
    const records = classroomStore.getEmulationRecords({
      classId: classId as string,
      periodId: periodId as string,
      studentId: studentId as string,
      type: type as string,
      date: date as string,
      status: status as string
    });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi tải lịch sử thi đua' });
  }
});

app.post('/api/emulation/records', (req: Request, res: Response) => {
  try {
    const { Ngay, MaLop, MaHS, MaLoi, GhiChu, NguoiGhiNhan, MaKy } = req.body;
    if (!Ngay || !MaLop || !MaHS || !MaLoi) {
      return res.status(400).json({ error: 'Ngày, lớp học, học sinh và danh mục là bắt buộc' });
    }
    const record = classroomStore.createEmulationRecord({
      Ngay,
      MaLop,
      MaHS,
      MaLoi,
      GhiChu,
      NguoiGhiNhan: NguoiGhiNhan || 'Giáo viên',
      MaKy
    });
    res.status(201).json(record);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Lỗi khi ghi nhận thi đua' });
  }
});

app.patch('/api/emulation/records/:id', (req: Request, res: Response) => {
  try {
    const { GhiChu, TrangThai, NguoiSua, LyDoSuaHuy } = req.body;
    const updated = classroomStore.updateEmulationRecord(req.params.id, {
      GhiChu,
      TrangThai,
      NguoiSua,
      LyDoSuaHuy
    });
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy bản ghi' });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Lỗi khi cập nhật bản ghi' });
  }
});

// Tính toán & Xếp hạng
app.get('/api/emulation/calculate-students', (req: Request, res: Response) => {
  try {
    const { classId, periodId } = req.query;
    if (!classId || !periodId) {
      return res.status(400).json({ error: 'Cần chọn lớp học và tuần thi đua' });
    }
    const list = classroomStore.calculateStudentWeeklyScores(classId as string, periodId as string);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi tính điểm học sinh' });
  }
});

app.get('/api/emulation/calculate-groups', (req: Request, res: Response) => {
  try {
    const { classId, periodId } = req.query;
    if (!classId || !periodId) {
      return res.status(400).json({ error: 'Cần chọn lớp học và tuần thi đua' });
    }
    const list = classroomStore.calculateGroupWeeklyScores(classId as string, periodId as string);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi tính điểm xếp hạng tổ' });
  }
});

// Khóa & Mở khóa sổ tuần
app.post('/api/emulation/lock', (req: Request, res: Response) => {
  try {
    const { periodId, classId, lockedBy } = req.body;
    if (!periodId || !classId) {
      return res.status(400).json({ error: 'Cần cung cấp mã kỳ và mã lớp để khóa sổ' });
    }
    const result = classroomStore.lockWeeklyPeriod(periodId, classId, lockedBy);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Lỗi khi khóa sổ tuần' });
  }
});

app.post('/api/emulation/unlock', (req: Request, res: Response) => {
  try {
    const { periodId, classId, unlockedBy, reason } = req.body;
    if (!periodId || !classId || !reason) {
      return res.status(400).json({ error: 'Cần cung cấp mã kỳ, mã lớp và lý do mở khóa' });
    }
    const result = classroomStore.unlockWeeklyPeriod(periodId, classId, unlockedBy, reason);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Lỗi khi mở khóa sổ tuần' });
  }
});

// Sổ theo dõi học sinh
app.get('/api/emulation/student-log', (req: Request, res: Response) => {
  try {
    const { studentId, classId, periodId } = req.query;
    if (!studentId) {
      return res.status(400).json({ error: 'Cần cung cấp studentId' });
    }
    const log = classroomStore.getStudentEmulationLog(
      studentId as string,
      classId as string,
      periodId as string
    );
    if (!log) return res.status(404).json({ error: 'Không tìm thấy học sinh' });
    res.json(log);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi tải sổ theo dõi học sinh' });
  }
});

// Báo cáo thi đua
app.get('/api/emulation/reports', (req: Request, res: Response) => {
  try {
    const { classId, periodId } = req.query;
    const report = classroomStore.getEmulationReport(classId as string, periodId as string);
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi tải báo cáo thi đua' });
  }
});

// Chạy bộ kiểm thử độc lập phân hệ thi đua
app.get('/api/emulation/test-suite', (_req: Request, res: Response) => {
  try {
    const testResults = runEmulationTestSuite();
    res.json(testResults);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi khi chạy bộ kiểm thử' });
  }
});

// ==========================================
// GOOGLE WORKSPACE API ROUTES (SHEETS & DRIVE)
// ==========================================

const getBearerToken = (req: Request): string => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Chưa đăng nhập Google hoặc thiếu mã xác thực (Bearer token)');
  }
  return authHeader.substring(7).trim();
};

// 1. Google Sheets: Lấy thông tin cấu trúc & các tab của bảng tính
app.post('/api/workspace/sheets/metadata', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    const { spreadsheetId } = req.body;
    if (!spreadsheetId) {
      return res.status(400).json({ error: 'Vui lòng cung cấp mã bảng tính Google Sheets' });
    }
    const metadata = await GoogleWorkspaceService.getSpreadsheetMetadata(token, spreadsheetId);
    res.json(metadata);
  } catch (error: any) {
    console.error('Sheets metadata error:', error);
    res.status(400).json({ error: error.message || 'Lỗi khi đọc bảng tính Google Sheets' });
  }
});

// 2. Google Sheets: Khởi tạo các bảng chuẩn (tabs)
app.post('/api/workspace/sheets/init-tabs', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    const { spreadsheetId } = req.body;
    if (!spreadsheetId) {
      return res.status(400).json({ error: 'Vui lòng cung cấp mã bảng tính Google Sheets' });
    }
    const result = await GoogleWorkspaceService.initializeSpreadsheetTabs(token, spreadsheetId);
    res.json(result);
  } catch (error: any) {
    console.error('Sheets init-tabs error:', error);
    res.status(400).json({ error: error.message || 'Lỗi khi tạo bảng trong Google Sheets' });
  }
});

// 3. Google Sheets: Đồng bộ toàn bộ dữ liệu từ Google Sheets về hệ thống (PULL)
app.post('/api/workspace/sheets/pull', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    const { spreadsheetId } = req.body;
    if (!spreadsheetId) {
      return res.status(400).json({ error: 'Vui lòng cung cấp mã bảng tính Google Sheets' });
    }
    const result = await GoogleWorkspaceService.pullAllFromGoogleSheets(token, spreadsheetId);
    res.json(result);
  } catch (error: any) {
    console.error('Sheets pull error:', error);
    res.status(400).json({ error: error.message || 'Lỗi khi tải dữ liệu từ Google Sheets' });
  }
});

// 4. Google Sheets: Xuất toàn bộ dữ liệu hiện tại lên Google Sheets (PUSH)
app.post('/api/workspace/sheets/push', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    const { spreadsheetId } = req.body;
    if (!spreadsheetId) {
      return res.status(400).json({ error: 'Vui lòng cung cấp mã bảng tính Google Sheets' });
    }
    const result = await GoogleWorkspaceService.pushAllToGoogleSheets(token, spreadsheetId);
    res.json(result);
  } catch (error: any) {
    console.error('Sheets push error:', error);
    res.status(400).json({ error: error.message || 'Lỗi khi đồng bộ lên Google Sheets' });
  }
});

// 5. Google Sheets: CRUD từng bảng (Đọc, Thêm, Sửa, Xóa bản ghi theo ID duy nhất)
app.post('/api/workspace/sheets/read-table', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    const { spreadsheetId, sheetName } = req.body;
    const records = await GoogleWorkspaceService.readSheetRows(token, spreadsheetId, sheetName);
    res.json(records);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Lỗi khi đọc bảng' });
  }
});

app.post('/api/workspace/sheets/insert-row', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    const { spreadsheetId, sheetName, data } = req.body;
    const result = await GoogleWorkspaceService.insertSheetRow(token, spreadsheetId, sheetName, data);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Lỗi khi thêm dòng vào Google Sheets' });
  }
});

app.put('/api/workspace/sheets/update-row', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    const { spreadsheetId, sheetName, idValue, data } = req.body;
    const result = await GoogleWorkspaceService.updateSheetRow(token, spreadsheetId, sheetName, idValue, data);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Lỗi khi sửa dòng trên Google Sheets' });
  }
});

app.delete('/api/workspace/sheets/delete-row', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    const { spreadsheetId, sheetName, idValue } = req.body;
    const result = await GoogleWorkspaceService.deleteSheetRow(token, spreadsheetId, sheetName, idValue);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Lỗi khi xóa dòng trên Google Sheets' });
  }
});

// 6. Google Drive: Danh sách tệp và thư mục từ Drive
app.get('/api/workspace/drive/files', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    const { folderId, search, mimeType, pageSize } = req.query;
    const data = await GoogleWorkspaceService.listDriveFiles(token, {
      folderId: folderId as string,
      search: search as string,
      mimeType: mimeType as string,
      pageSize: pageSize ? Number(pageSize) : 50
    });
    res.json(data);
  } catch (error: any) {
    console.error('Drive files error:', error);
    res.status(400).json({ error: error.message || 'Lỗi khi tải tệp từ Google Drive' });
  }
});

// 7. Google Drive: Tạo thư mục mới
app.post('/api/workspace/drive/folders', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    const { name, parentId } = req.body;
    const result = await GoogleWorkspaceService.createDriveFolder(token, name, parentId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Lỗi khi tạo thư mục trên Google Drive' });
  }
});

// 8. Google Drive: Xóa tệp khỏi Google Drive
app.delete('/api/workspace/drive/files/:id', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    const result = await GoogleWorkspaceService.deleteDriveFile(token, req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Lỗi khi xóa tệp trên Google Drive' });
  }
});

// Vite middleware mounting for Full-Stack development / static serve for production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[QUẢN LÝ LỚP HỌC] Máy chủ đang chạy tại http://localhost:${PORT}`);
  });
}

startServer();
