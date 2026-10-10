import { classroomStore } from '../data/store.ts';
import { 
  Classroom, Student, AttendanceRecord,
  EmulationCategory, EmulationRecord, WeeklyStudentSummary 
} from '../../src/types/index.ts';

export const STANDARD_SHEET_TABS = {
  LopHoc: {
    headers: ['MaLop', 'TenLop', 'Khoi', 'NamHoc', 'GVCN', 'PhongHoc', 'SiSo', 'GhiChu', 'NgayTao'],
    idColumn: 'MaLop'
  },
  HocSinh: {
    headers: ['MaHS', 'HoTen', 'GioiTinh', 'NgaySinh', 'MaLop', 'TenLop', 'TenPhuHuynh', 'SDTPhuHuynh', 'DiaChi', 'TrangThai', 'GhiChu', 'NgayTao'],
    idColumn: 'MaHS'
  },
  DiemDanh: {
    headers: ['MaDiemDanh', 'Ngay', 'MaLop', 'MaHS', 'HoTen', 'TrangThai', 'LyDo', 'ThoiGianTao'],
    idColumn: 'MaDiemDanh'
  },
  DanhMucThiDua: {
    headers: ['MaLoi', 'TenLoi', 'Loai', 'Diem', 'MoTa', 'TrangThai'],
    idColumn: 'MaLoi'
  },
  LichSuThiDua: {
    headers: ['MaGhiNhan', 'Ngay', 'MaKy', 'MaLop', 'MaHS', 'MaLoi', 'Loai', 'Diem', 'GhiChu', 'NguoiGhiNhan', 'TrangThai', 'ThoiGianTao', 'NguoiSua', 'LyDoSuaHuy'],
    idColumn: 'MaGhiNhan'
  },
  TongKetTuan: {
    headers: ['MaKy', 'MaLop', 'MaHS', 'MaTo', 'DiemDauTuan', 'TongDiemCong', 'TongDiemTru', 'DiemCuoiTuan', 'SoThanhTich', 'SoViPham', 'XepHang', 'TrangThai'],
    idColumn: 'MaHS'
  },
  GiaoVien: {
    headers: ['MaGV', 'HoTen', 'Email', 'SoDienThoai', 'BoMon', 'ToBoMon', 'VaiTro'],
    idColumn: 'MaGV'
  },
  CauHinh: {
    headers: ['Khoa', 'GiaTri', 'MoTa', 'NgayCapNhat'],
    idColumn: 'Khoa'
  }
};

export class GoogleWorkspaceService {
  /**
   * Helper to parse Google Sheets ID from raw ID or full Google Drive/Sheets URL
   */
  public static extractSpreadsheetId(input: string): string {
    if (!input) return '';
    const trimmed = input.trim();
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return trimmed;
  }

  /**
   * Helper to execute Google API calls with unified error handling
   */
  private static async fetchGoogleApi(url: string, token: string, options: RequestInit = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (!res.ok) {
      let errorBody: any = null;
      try {
        errorBody = await res.json();
      } catch {
        // ignore
      }

      const status = res.status;
      const apiMessage = errorBody?.error?.message || res.statusText;

      if (status === 401) {
        throw new Error('Phiên xác thực Google đã hết hạn. Vui lòng đăng nhập lại Google.');
      }
      if (status === 403) {
        throw new Error(`Tài khoản Google chưa được cấp quyền truy cập vào bảng tính/tệp này (${apiMessage}). Vui lòng kiểm tra quyền truy cập hoặc chia sẻ tệp cho tài khoản này.`);
      }
      if (status === 404) {
        throw new Error('Không tìm thấy bảng tính hoặc tài nguyên trên Google Drive / Sheets.');
      }

      throw new Error(`Lỗi Google API (${status}): ${apiMessage}`);
    }

    return res.json();
  }

  /**
   * Fetch spreadsheet details, titles, and existing sheets
   */
  public static async getSpreadsheetMetadata(token: string, spreadsheetIdInput: string) {
    const spreadsheetId = this.extractSpreadsheetId(spreadsheetIdInput);
    if (!spreadsheetId) {
      throw new Error('Vui lòng cung cấp mã (ID) hoặc liên kết Google Sheets hợp lệ');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties(sheetId,title,index,gridProperties)`;
    const data = await this.fetchGoogleApi(url, token);

    const sheetList = (data.sheets || []).map((s: any) => ({
      sheetId: s.properties.sheetId,
      title: s.properties.title,
      rowCount: s.properties.gridProperties?.rowCount || 0,
      columnCount: s.properties.gridProperties?.columnCount || 0
    }));

    const existingTabNames = new Set(sheetList.map((s: any) => s.title));
    const requiredTabs = Object.keys(STANDARD_SHEET_TABS);
    const missingTabs = requiredTabs.filter(t => !existingTabNames.has(t));
    const foundTabs = requiredTabs.filter(t => existingTabNames.has(t));

    return {
      spreadsheetId: data.spreadsheetId,
      title: data.properties?.title || 'Bảng tính Google Sheets',
      sheets: sheetList,
      foundTabs,
      missingTabs,
      isFullyConfigured: missingTabs.length === 0
    };
  }

  /**
   * Initialize standard sheet tabs with schema headers in the user's chosen spreadsheet
   */
  public static async initializeSpreadsheetTabs(token: string, spreadsheetIdInput: string) {
    const spreadsheetId = this.extractSpreadsheetId(spreadsheetIdInput);
    const meta = await this.getSpreadsheetMetadata(token, spreadsheetId);

    const missingTabs = meta.missingTabs;
    if (missingTabs.length === 0) {
      return {
        message: 'Tất cả các bảng tiêu chuẩn đã tồn tại trong Google Sheets.',
        createdTabs: []
      };
    }

    // 1. Create missing sheets via batchUpdate
    const requests = missingTabs.map(tabName => ({
      addSheet: {
        properties: {
          title: tabName
        }
      }
    }));

    await this.fetchGoogleApi(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({ requests })
      }
    );

    // 2. Write headers for each created sheet
    for (const tabName of missingTabs) {
      const headers = (STANDARD_SHEET_TABS as any)[tabName]?.headers || [];
      if (headers.length > 0) {
        await this.fetchGoogleApi(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A1:Z1?valueInputOption=USER_ENTERED`,
          token,
          {
            method: 'PUT',
            body: JSON.stringify({
              range: `${tabName}!A1:Z1`,
              majorDimension: 'ROWS',
              values: [headers]
            })
          }
        );
      }
    }

    return {
      message: `Đã khởi tạo thành công ${missingTabs.length} bảng chuẩn trên Google Sheets: ${missingTabs.join(', ')}`,
      createdTabs: missingTabs
    };
  }

  /**
   * Read rows of a given sheet, returned as list of objects keyed by header names
   */
  public static async readSheetRows(token: string, spreadsheetIdInput: string, sheetName: string): Promise<Record<string, any>[]> {
    const spreadsheetId = this.extractSpreadsheetId(spreadsheetIdInput);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z5000`;
    
    try {
      const data = await this.fetchGoogleApi(url, token);
      const rows: any[][] = data.values || [];
      if (rows.length < 2) {
        return [];
      }

      const headers = rows[0].map((h: any) => String(h).trim());
      const records: Record<string, any>[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || !row[0]) continue;
        const record: Record<string, any> = {};
        headers.forEach((header, colIdx) => {
          record[header] = row[colIdx] !== undefined ? row[colIdx] : '';
        });
        records.push(record);
      }

      return records;
    } catch (err: any) {
      if (err.message && err.message.includes('404')) {
        return [];
      }
      throw err;
    }
  }

  /**
   * Append a single row with specific headers to a sheet
   */
  public static async insertSheetRow(
    token: string, 
    spreadsheetIdInput: string, 
    sheetName: string, 
    recordData: Record<string, any>
  ) {
    const spreadsheetId = this.extractSpreadsheetId(spreadsheetIdInput);
    const schema = (STANDARD_SHEET_TABS as any)[sheetName];
    const headers: string[] = schema ? schema.headers : Object.keys(recordData);

    const rowValues = headers.map(h => recordData[h] !== undefined ? recordData[h] : '');

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:Z:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const res = await this.fetchGoogleApi(url, token, {
      method: 'POST',
      body: JSON.stringify({
        values: [rowValues]
      })
    });

    return {
      success: true,
      updatedRange: res.updates?.updatedRange,
      updatedRows: res.updates?.updatedRows
    };
  }

  /**
   * Update a row identified by a unique ID column
   */
  public static async updateSheetRow(
    token: string,
    spreadsheetIdInput: string,
    sheetName: string,
    idValue: string,
    updatedData: Record<string, any>
  ) {
    const spreadsheetId = this.extractSpreadsheetId(spreadsheetIdInput);
    const schema = (STANDARD_SHEET_TABS as any)[sheetName];
    const idColumn = schema ? schema.idColumn : 'id';
    const headers: string[] = schema ? schema.headers : [];

    // Fetch existing rows to locate row index
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z5000`;
    const sheetData = await this.fetchGoogleApi(readUrl, token);
    const rows: any[][] = sheetData.values || [];

    if (rows.length < 2) {
      throw new Error(`Bảng ${sheetName} chưa có dữ liệu để cập nhật`);
    }

    const currentHeaders = rows[0].map((h: any) => String(h).trim());
    const idColIndex = currentHeaders.indexOf(idColumn);
    if (idColIndex === -1) {
      throw new Error(`Không tìm thấy cột định danh "${idColumn}" trong bảng ${sheetName}`);
    }

    let targetRowIndex = -1;
    let existingRow: any[] = [];
    for (let r = 1; r < rows.length; r++) {
      if (String(rows[r][idColIndex]).trim() === String(idValue).trim()) {
        targetRowIndex = r + 1; // 1-based for Sheets A1 notation
        existingRow = rows[r];
        break;
      }
    }

    if (targetRowIndex === -1) {
      throw new Error(`Không tìm thấy bản ghi với mã "${idValue}" trong bảng ${sheetName}`);
    }

    // Merge existing row with updated values
    const effectiveHeaders = headers.length > 0 ? headers : currentHeaders;
    const newRow = effectiveHeaders.map((h, idx) => {
      if (updatedData[h] !== undefined) {
        return updatedData[h];
      }
      const existingIdx = currentHeaders.indexOf(h);
      return existingIdx !== -1 && existingRow[existingIdx] !== undefined ? existingRow[existingIdx] : '';
    });

    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A${targetRowIndex}:Z${targetRowIndex}?valueInputOption=USER_ENTERED`;
    const res = await this.fetchGoogleApi(updateUrl, token, {
      method: 'PUT',
      body: JSON.stringify({
        range: `${sheetName}!A${targetRowIndex}:Z${targetRowIndex}`,
        values: [newRow]
      })
    });

    return {
      success: true,
      updatedRange: res.updatedRange,
      updatedRows: res.updatedRows
    };
  }

  /**
   * Delete a row identified by a unique ID column
   */
  public static async deleteSheetRow(
    token: string,
    spreadsheetIdInput: string,
    sheetName: string,
    idValue: string
  ) {
    const spreadsheetId = this.extractSpreadsheetId(spreadsheetIdInput);
    const meta = await this.getSpreadsheetMetadata(token, spreadsheetId);
    const targetSheet = meta.sheets.find((s: any) => s.title === sheetName);
    if (!targetSheet) {
      throw new Error(`Không tìm thấy bảng ${sheetName} trong Google Sheets`);
    }

    const schema = (STANDARD_SHEET_TABS as any)[sheetName];
    const idColumn = schema ? schema.idColumn : 'id';

    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z5000`;
    const sheetData = await this.fetchGoogleApi(readUrl, token);
    const rows: any[][] = sheetData.values || [];

    if (rows.length < 2) {
      throw new Error(`Bảng ${sheetName} không có dữ liệu để xóa`);
    }

    const currentHeaders = rows[0].map((h: any) => String(h).trim());
    const idColIndex = currentHeaders.indexOf(idColumn);
    if (idColIndex === -1) {
      throw new Error(`Không tìm thấy cột định danh "${idColumn}" trong bảng ${sheetName}`);
    }

    let zeroBasedRowIndex = -1;
    for (let r = 1; r < rows.length; r++) {
      if (String(rows[r][idColIndex]).trim() === String(idValue).trim()) {
        zeroBasedRowIndex = r;
        break;
      }
    }

    if (zeroBasedRowIndex === -1) {
      throw new Error(`Không tìm thấy bản ghi với mã "${idValue}" trong bảng ${sheetName}`);
    }

    // Delete row via batchUpdate deleteDimension
    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    await this.fetchGoogleApi(batchUrl, token, {
      method: 'POST',
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: targetSheet.sheetId,
                dimension: 'ROWS',
                startIndex: zeroBasedRowIndex,
                endIndex: zeroBasedRowIndex + 1
              }
            }
          }
        ]
      })
    });

    return {
      success: true,
      message: `Đã xóa bản ghi ${idValue} khỏi bảng ${sheetName} trên Google Sheets`
    };
  }

  /**
   * Pull all data from user's designated Google Sheets spreadsheet into local server store
   */
  public static async pullAllFromGoogleSheets(token: string, spreadsheetIdInput: string) {
    const spreadsheetId = this.extractSpreadsheetId(spreadsheetIdInput);
    const meta = await this.getSpreadsheetMetadata(token, spreadsheetId);

    const resultStats: Record<string, number> = {};

    // 1. Read LopHoc
    if (meta.foundTabs.includes('LopHoc')) {
      const classRows = await this.readSheetRows(token, spreadsheetId, 'LopHoc');
      if (classRows.length > 0) {
        const mappedClasses: Classroom[] = classRows.map(r => ({
          id: String(r.MaLop || `CLASS_${Date.now()}`),
          name: String(r.TenLop || ''),
          grade: Number(r.Khoi) || 10,
          academicYear: String(r.NamHoc || '2025 - 2026'),
          homeroomTeacher: String(r.GVCN || 'Chưa phân công'),
          room: String(r.PhongHoc || ''),
          maxStudents: 45,
          studentCount: Number(r.SiSo) || 0,
          note: String(r.GhiChu || ''),
          createdAt: String(r.NgayTao || new Date().toISOString())
        }));
        classroomStore.setState({ classes: mappedClasses });
        resultStats['LopHoc'] = mappedClasses.length;
      }
    }

    // 2. Read HocSinh
    if (meta.foundTabs.includes('HocSinh')) {
      const studentRows = await this.readSheetRows(token, spreadsheetId, 'HocSinh');
      if (studentRows.length > 0) {
        const mappedStudents: Student[] = studentRows.map(r => ({
          id: String(r.MaHS),
          studentCode: String(r.MaHS),
          fullName: String(r.HoTen || ''),
          gender: r.GioiTinh === 'Nam' ? 'male' : r.GioiTinh === 'Nữ' ? 'female' : 'other',
          birthDate: String(r.NgaySinh || '2008-01-01'),
          classId: String(r.MaLop || ''),
          className: String(r.TenLop || ''),
          parentName: String(r.TenPhuHuynh || ''),
          parentPhone: String(r.SDTPhuHuynh || ''),
          address: String(r.DiaChi || ''),
          status: (r.TrangThai === 'Đình chỉ' || r.TrangThai === 'Nghỉ học') ? 'suspended' : r.TrangThai === 'Chuyển trường' ? 'transferred' : 'active',
          note: String(r.GhiChu || ''),
          createdAt: String(r.NgayTao || new Date().toISOString())
        }));
        classroomStore.setState({ students: mappedStudents });
        resultStats['HocSinh'] = mappedStudents.length;
      }
    }

    // 3. Read DanhMucThiDua
    if (meta.foundTabs.includes('DanhMucThiDua')) {
      const catRows = await this.readSheetRows(token, spreadsheetId, 'DanhMucThiDua');
      if (catRows.length > 0) {
        const mappedCats: EmulationCategory[] = catRows.map(r => ({
          MaLoi: String(r.MaLoi),
          TenLoi: String(r.TenLoi || ''),
          Loai: String(r.Loai) === 'CONG' ? 'CONG' : 'TRU',
          Diem: Math.abs(Number(r.Diem) || 0),
          MoTa: String(r.MoTa || ''),
          TrangThai: String(r.TrangThai) === 'AN' ? 'AN' : 'DANG_DUNG'
        }));
        classroomStore.setState({ emulationCategories: mappedCats });
        resultStats['DanhMucThiDua'] = catRows.length;
      }
    }

    // 4. Read LichSuThiDua
    if (meta.foundTabs.includes('LichSuThiDua')) {
      const recRows = await this.readSheetRows(token, spreadsheetId, 'LichSuThiDua');
      if (recRows.length > 0) {
        const mappedRecs: EmulationRecord[] = recRows.map(r => ({
          MaGhiNhan: String(r.MaGhiNhan),
          Ngay: String(r.Ngay || ''),
          MaKy: String(r.MaKy || ''),
          MaLop: String(r.MaLop || ''),
          MaHS: String(r.MaHS || ''),
          MaLoi: String(r.MaLoi || ''),
          Loai: String(r.Loai) === 'CONG' ? 'CONG' : 'TRU',
          Diem: Number(r.Diem) || 0,
          GhiChu: String(r.GhiChu || ''),
          NguoiGhiNhan: String(r.NguoiGhiNhan || 'Giáo viên'),
          TrangThai: String(r.TrangThai) === 'DA_HUY' ? 'DA_HUY' : 'HIEU_LUC',
          ThoiGianTao: String(r.ThoiGianTao || new Date().toISOString()),
          NguoiSua: r.NguoiSua ? String(r.NguoiSua) : undefined,
          LyDoSuaHuy: r.LyDoSuaHuy ? String(r.LyDoSuaHuy) : undefined
        }));
        classroomStore.setState({ emulationRecords: mappedRecs });
        resultStats['LichSuThiDua'] = mappedRecs.length;
      }
    }

    // Update settings with last sync
    const settings = classroomStore.getSettings();
    settings.googleSheets = {
      ...settings.googleSheets,
      connected: true,
      sheetId: spreadsheetId,
      sheetName: meta.title,
      lastSyncTime: new Date().toISOString(),
      statusMessage: `Đã đồng bộ thành công dữ liệu từ Google Sheets: "${meta.title}"`
    };
    classroomStore.updateSettings(settings);

    return {
      success: true,
      spreadsheetId,
      title: meta.title,
      stats: resultStats,
      message: `Đã nạp thành công dữ liệu từ Google Sheets "${meta.title}" vào ứng dụng.`
    };
  }

  /**
   * Push current state from server store to Google Sheets spreadsheet
   */
  public static async pushAllToGoogleSheets(token: string, spreadsheetIdInput: string) {
    const spreadsheetId = this.extractSpreadsheetId(spreadsheetIdInput);
    // Ensure tabs exist
    await this.initializeSpreadsheetTabs(token, spreadsheetId);

    const state = classroomStore.getState();
    const resultStats: Record<string, number> = {};

    // 1. Write LopHoc
    const classRows = state.classes.map(c => [
      c.id, c.name, c.grade, c.academicYear, c.homeroomTeacher, c.room, c.studentCount || 0, c.note || '', c.createdAt
    ]);
    await this.writeSheetTable(token, spreadsheetId, 'LopHoc', STANDARD_SHEET_TABS.LopHoc.headers, classRows);
    resultStats['LopHoc'] = classRows.length;

    // 2. Write HocSinh
    const studentRows = state.students.map(s => [
      s.studentCode, s.fullName, s.gender === 'male' ? 'Nam' : s.gender === 'female' ? 'Nữ' : 'Khác',
      s.birthDate, s.classId, s.className, s.parentName, s.parentPhone, s.address,
      s.status === 'active' ? 'Đang học' : s.status === 'transferred' ? 'Chuyển trường' : 'Nghỉ học',
      s.note || '', s.createdAt
    ]);
    await this.writeSheetTable(token, spreadsheetId, 'HocSinh', STANDARD_SHEET_TABS.HocSinh.headers, studentRows);
    resultStats['HocSinh'] = studentRows.length;

    // 3. Write DiemDanh
    const attendanceRows = state.attendance.map(a => [
      a.id, a.date, a.classId, a.studentCode, a.studentName,
      a.status === 'present' ? 'Có mặt' : a.status === 'late' ? 'Đi trễ' : a.status === 'excused' ? 'Có phép' : 'Không phép',
      a.note || '', a.updatedAt
    ]);
    await this.writeSheetTable(token, spreadsheetId, 'DiemDanh', STANDARD_SHEET_TABS.DiemDanh.headers, attendanceRows);
    resultStats['DiemDanh'] = attendanceRows.length;

    // 4. Write DanhMucThiDua
    const catRows = state.emulationCategories.map(c => [
      c.MaLoi, c.TenLoi, c.Loai, c.Diem, c.MoTa, c.TrangThai
    ]);
    await this.writeSheetTable(token, spreadsheetId, 'DanhMucThiDua', STANDARD_SHEET_TABS.DanhMucThiDua.headers, catRows);
    resultStats['DanhMucThiDua'] = catRows.length;

    // 5. Write LichSuThiDua
    const recRows = state.emulationRecords.map(r => [
      r.MaGhiNhan, r.Ngay, r.MaKy, r.MaLop, r.MaHS, r.MaLoi,
      r.Loai, r.Diem, r.GhiChu || '', r.NguoiGhiNhan, r.TrangThai, r.ThoiGianTao, r.NguoiSua || '', r.LyDoSuaHuy || ''
    ]);
    await this.writeSheetTable(token, spreadsheetId, 'LichSuThiDua', STANDARD_SHEET_TABS.LichSuThiDua.headers, recRows);
    resultStats['LichSuThiDua'] = recRows.length;

    // 6. Write TongKetTuan
    const sumRows = state.weeklyStudentSummaries.map(s => [
      s.MaKy, s.MaLop, s.MaHS, s.MaTo, s.DiemDauTuan,
      s.TongDiemCong, s.TongDiemTru, s.DiemCuoiTuan, s.SoThanhTich, s.SoViPham,
      s.XepHang, s.TrangThai
    ]);
    await this.writeSheetTable(token, spreadsheetId, 'TongKetTuan', STANDARD_SHEET_TABS.TongKetTuan.headers, sumRows);
    resultStats['TongKetTuan'] = sumRows.length;

    // 7. Write CauHinh
    const configRows = [
      ['SchoolName', state.settings.schoolName, 'Tên trường học', new Date().toISOString()],
      ['AcademicYear', state.settings.academicYear, 'Năm học hiện tại', new Date().toISOString()],
      ['CurrentSemester', state.settings.currentSemester, 'Học kỳ hiện tại', new Date().toISOString()],
      ['TeacherName', state.settings.teacherName, 'Giáo viên phụ trách', new Date().toISOString()],
      ['Department', state.settings.department, 'Tổ bộ môn', new Date().toISOString()]
    ];
    await this.writeSheetTable(token, spreadsheetId, 'CauHinh', STANDARD_SHEET_TABS.CauHinh.headers, configRows);
    resultStats['CauHinh'] = configRows.length;

    // Update settings
    const settings = classroomStore.getSettings();
    settings.googleSheets = {
      ...settings.googleSheets,
      connected: true,
      sheetId: spreadsheetId,
      lastSyncTime: new Date().toISOString(),
      statusMessage: `Đã đẩy dữ liệu thành công lên Google Sheets lúc ${new Date().toLocaleTimeString('vi-VN')}`
    };
    classroomStore.updateSettings(settings);

    return {
      success: true,
      spreadsheetId,
      stats: resultStats,
      message: `Đã xuất dữ liệu lên ${Object.keys(resultStats).length} bảng trong Google Sheets thành công!`
    };
  }

  /**
   * Helper to write complete table (clear and set rows)
   */
  private static async writeSheetTable(
    token: string,
    spreadsheetId: string,
    sheetName: string,
    headers: string[],
    dataRows: any[][]
  ) {
    // 1. Clear old data from A2 downwards
    try {
      await this.fetchGoogleApi(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A2:Z5000:clear`,
        token,
        { method: 'POST', body: '{}' }
      );
    } catch {
      // ignore
    }

    // 2. Put headers and rows
    const fullValues = [headers, ...dataRows];
    await this.fetchGoogleApi(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z${fullValues.length}?valueInputOption=USER_ENTERED`,
      token,
      {
        method: 'PUT',
        body: JSON.stringify({
          range: `${sheetName}!A1:Z${fullValues.length}`,
          majorDimension: 'ROWS',
          values: fullValues
        })
      }
    );
  }

  // ==========================================
  // GOOGLE DRIVE API METHODS
  // ==========================================

  /**
   * List Google Drive files and folders for user
   */
  public static async listDriveFiles(token: string, options: {
    folderId?: string;
    mimeType?: string;
    search?: string;
    pageSize?: number;
  } = {}) {
    const qParts: string[] = ['trashed = false'];

    if (options.folderId) {
      qParts.push(`'${options.folderId}' in parents`);
    }

    if (options.mimeType) {
      qParts.push(`mimeType = '${options.mimeType}'`);
    }

    if (options.search) {
      const sanitized = options.search.replace(/'/g, "\\'");
      qParts.push(`name contains '${sanitized}'`);
    }

    const q = encodeURIComponent(qParts.join(' and '));
    const fields = encodeURIComponent('nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, iconLink, thumbnailLink, parents)');
    const pageSize = options.pageSize || 50;

    const url = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=${fields}&q=${q}&orderBy=folder,name`;
    const data = await this.fetchGoogleApi(url, token);

    return {
      files: data.files || [],
      nextPageToken: data.nextPageToken || null
    };
  }

  /**
   * Create a folder on Google Drive
   */
  public static async createDriveFolder(token: string, folderName: string, parentId?: string) {
    if (!folderName.trim()) {
      throw new Error('Vui lòng nhập tên thư mục');
    }

    const metadata: any = {
      name: folderName.trim(),
      mimeType: 'application/vnd.google-apps.folder'
    };

    if (parentId) {
      metadata.parents = [parentId];
    }

    const url = 'https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,webViewLink,createdTime';
    const res = await this.fetchGoogleApi(url, token, {
      method: 'POST',
      body: JSON.stringify(metadata)
    });

    return res;
  }

  /**
   * Delete a file or folder from Google Drive
   */
  public static async deleteDriveFile(token: string, fileId: string) {
    if (!fileId) {
      throw new Error('Mã tệp Google Drive không hợp lệ');
    }

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok && res.status !== 204) {
      let msg = 'Lỗi xóa tệp trên Google Drive';
      try {
        const body = await res.json();
        msg = body?.error?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    return { success: true, message: 'Đã xóa tệp trên Google Drive thành công' };
  }
}
