import { 
  Classroom, Student, AttendanceRecord, GradeItem, DocumentItem, AppSettings, DashboardStats,
  EmulationCategory, EmulationGroup, GroupMember, EmulationPeriod, EmulationRecord,
  WeeklyStudentSummary, WeeklyGroupSummary,
  ClassOfficer, SeatingChart
} from '../types/index.ts';
import { getAccessToken } from './auth.ts';

const BASE_URL = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Bạn chưa đăng nhập Google Workspace hoặc phiên đã hết hạn. Vui lòng bấm "Đăng nhập Google" ở góc trên hoặc mục Cài đặt.');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = 'Đã có lỗi xảy ra';
    try {
      const errorData = await res.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch {
      errorMsg = `Lỗi hệ thống (${res.status})`;
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Stats
  getStats: async (): Promise<DashboardStats> => {
    const res = await fetch(`${BASE_URL}/stats`);
    return handleResponse<DashboardStats>(res);
  },

  // Classes
  getClasses: async (): Promise<Classroom[]> => {
    const res = await fetch(`${BASE_URL}/classes`);
    return handleResponse<Classroom[]>(res);
  },
  getClassById: async (id: string): Promise<Classroom> => {
    const res = await fetch(`${BASE_URL}/classes/${id}`);
    return handleResponse<Classroom>(res);
  },
  createClass: async (data: Partial<Classroom>): Promise<Classroom> => {
    const res = await fetch(`${BASE_URL}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<Classroom>(res);
  },
  updateClass: async (id: string, data: Partial<Classroom>): Promise<Classroom> => {
    const res = await fetch(`${BASE_URL}/classes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<Classroom>(res);
  },
  deleteClass: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${BASE_URL}/classes/${id}`, {
      method: 'DELETE'
    });
    return handleResponse<{ message: string }>(res);
  },

  // Ban cán sự lớp (Class Officers)
  getClassOfficers: async (classId: string): Promise<ClassOfficer[]> => {
    const res = await fetch(`${BASE_URL}/classes/${encodeURIComponent(classId)}/officers`);
    return handleResponse<ClassOfficer[]>(res);
  },
  assignClassOfficer: async (classId: string, data: {
    studentId: string;
    role: string;
    customRoleTitle?: string;
    duty?: string;
    contactPhone?: string;
  }): Promise<ClassOfficer> => {
    const res = await fetch(`${BASE_URL}/classes/${encodeURIComponent(classId)}/officers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<ClassOfficer>(res);
  },
  updateClassOfficer: async (classId: string, officerId: string, data: Partial<ClassOfficer>): Promise<ClassOfficer> => {
    const res = await fetch(`${BASE_URL}/classes/${encodeURIComponent(classId)}/officers/${encodeURIComponent(officerId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<ClassOfficer>(res);
  },
  removeClassOfficer: async (classId: string, officerId: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${BASE_URL}/classes/${encodeURIComponent(classId)}/officers/${encodeURIComponent(officerId)}`, {
      method: 'DELETE'
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  // Sơ đồ chỗ ngồi (Seating Chart)
  getSeatingChart: async (classId: string): Promise<SeatingChart> => {
    const res = await fetch(`${BASE_URL}/classes/${encodeURIComponent(classId)}/seating-chart`);
    return handleResponse<SeatingChart>(res);
  },
  saveSeatingChart: async (classId: string, chart: SeatingChart): Promise<SeatingChart> => {
    const res = await fetch(`${BASE_URL}/classes/${encodeURIComponent(classId)}/seating-chart`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chart)
    });
    return handleResponse<SeatingChart>(res);
  },
  assignSeat: async (classId: string, seatId: string, studentId?: string, note?: string): Promise<SeatingChart> => {
    const res = await fetch(`${BASE_URL}/classes/${encodeURIComponent(classId)}/seating-chart/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seatId, studentId, note })
    });
    return handleResponse<SeatingChart>(res);
  },
  swapSeats: async (classId: string, seatIdA: string, seatIdB: string): Promise<SeatingChart> => {
    const res = await fetch(`${BASE_URL}/classes/${encodeURIComponent(classId)}/seating-chart/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seatIdA, seatIdB })
    });
    return handleResponse<SeatingChart>(res);
  },
  autoArrangeSeats: async (classId: string, mode: 'byGroup' | 'alternatingGender' | 'alphabetical' | 'clear'): Promise<SeatingChart> => {
    const res = await fetch(`${BASE_URL}/classes/${encodeURIComponent(classId)}/seating-chart/auto-arrange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    return handleResponse<SeatingChart>(res);
  },

  // Students
  getStudents: async (params?: { classId?: string; search?: string; status?: string }): Promise<Student[]> => {
    const searchParams = new URLSearchParams();
    if (params?.classId) searchParams.append('classId', params.classId);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status) searchParams.append('status', params.status);
    const res = await fetch(`${BASE_URL}/students?${searchParams.toString()}`);
    return handleResponse<Student[]>(res);
  },
  getStudentById: async (id: string): Promise<Student> => {
    const res = await fetch(`${BASE_URL}/students/${id}`);
    return handleResponse<Student>(res);
  },
  createStudent: async (data: Partial<Student>): Promise<Student> => {
    const res = await fetch(`${BASE_URL}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<Student>(res);
  },
  updateStudent: async (id: string, data: Partial<Student>): Promise<Student> => {
    const res = await fetch(`${BASE_URL}/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<Student>(res);
  },
  deleteStudent: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${BASE_URL}/students/${id}`, {
      method: 'DELETE'
    });
    return handleResponse<{ message: string }>(res);
  },

  // Attendance
  getAttendance: async (classId: string, date: string): Promise<AttendanceRecord[]> => {
    const res = await fetch(`${BASE_URL}/attendance?classId=${encodeURIComponent(classId)}&date=${encodeURIComponent(date)}`);
    return handleResponse<AttendanceRecord[]>(res);
  },
  saveAttendance: async (classId: string, date: string, records: AttendanceRecord[]): Promise<{ success: boolean; savedCount: number }> => {
    const res = await fetch(`${BASE_URL}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, date, records })
    });
    return handleResponse<{ success: boolean; savedCount: number }>(res);
  },
  getAttendanceHistory: async (classId?: string): Promise<{ summaries: any[] }> => {
    const url = classId ? `${BASE_URL}/attendance/history?classId=${encodeURIComponent(classId)}` : `${BASE_URL}/attendance/history`;
    const res = await fetch(url);
    return handleResponse<{ summaries: any[] }>(res);
  },

  // Grades
  getGrades: async (classId: string, subject: string, semester: string): Promise<GradeItem[]> => {
    const res = await fetch(`${BASE_URL}/grades?classId=${encodeURIComponent(classId)}&subject=${encodeURIComponent(subject)}&semester=${encodeURIComponent(semester)}`);
    return handleResponse<GradeItem[]>(res);
  },
  saveGradeBatch: async (classId: string, subject: string, semester: string, grades: GradeItem[]): Promise<{ success: boolean; count: number }> => {
    const res = await fetch(`${BASE_URL}/grades/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, subject, semester, grades })
    });
    return handleResponse<{ success: boolean; count: number }>(res);
  },
  saveSingleGrade: async (grade: GradeItem): Promise<GradeItem> => {
    const res = await fetch(`${BASE_URL}/grades`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(grade)
    });
    return handleResponse<GradeItem>(res);
  },

  // Documents
  getDocuments: async (classId?: string, category?: string): Promise<DocumentItem[]> => {
    const searchParams = new URLSearchParams();
    if (classId) searchParams.append('classId', classId);
    if (category) searchParams.append('category', category);
    const res = await fetch(`${BASE_URL}/documents?${searchParams.toString()}`);
    return handleResponse<DocumentItem[]>(res);
  },
  createDocument: async (data: Partial<DocumentItem>): Promise<DocumentItem> => {
    const res = await fetch(`${BASE_URL}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<DocumentItem>(res);
  },
  deleteDocument: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${BASE_URL}/documents/${id}`, {
      method: 'DELETE'
    });
    return handleResponse<{ success: boolean }>(res);
  },

  // Settings & Sync
  getSettings: async (): Promise<AppSettings> => {
    const res = await fetch(`${BASE_URL}/settings`);
    return handleResponse<AppSettings>(res);
  },
  updateSettings: async (settings: Partial<AppSettings>): Promise<AppSettings> => {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return handleResponse<AppSettings>(res);
  },
  getSyncStatus: async (): Promise<any> => {
    const res = await fetch(`${BASE_URL}/sync/status`);
    return handleResponse<any>(res);
  },
  testSheetsSync: async (): Promise<any> => {
    const res = await fetch(`${BASE_URL}/sync/sheets/test`, { method: 'POST' });
    return handleResponse<any>(res);
  },
  testDriveSync: async (): Promise<any> => {
    const res = await fetch(`${BASE_URL}/sync/drive/test`, { method: 'POST' });
    return handleResponse<any>(res);
  },
  resetDemoData: async (): Promise<{ message: string }> => {
    const res = await fetch(`${BASE_URL}/sync/reset-demo`, { method: 'POST' });
    return handleResponse<{ message: string }>(res);
  },

  // Reports
  getReportsSummary: async (): Promise<any> => {
    const res = await fetch(`${BASE_URL}/reports/summary`);
    return handleResponse<any>(res);
  },

  // ==========================================
  // THI ĐUA VÀ VI PHẠM HỌC SINH (CLIENT API)
  // ==========================================

  // Categories
  getEmulationCategories: async (): Promise<EmulationCategory[]> => {
    const res = await fetch(`${BASE_URL}/emulation/categories`);
    return handleResponse<EmulationCategory[]>(res);
  },
  createEmulationCategory: async (data: Partial<EmulationCategory>): Promise<EmulationCategory> => {
    const res = await fetch(`${BASE_URL}/emulation/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<EmulationCategory>(res);
  },
  updateEmulationCategory: async (id: string, data: Partial<EmulationCategory>): Promise<EmulationCategory> => {
    const res = await fetch(`${BASE_URL}/emulation/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<EmulationCategory>(res);
  },
  toggleEmulationCategory: async (id: string): Promise<EmulationCategory> => {
    const res = await fetch(`${BASE_URL}/emulation/categories/${id}/toggle`, {
      method: 'PATCH'
    });
    return handleResponse<EmulationCategory>(res);
  },

  // Groups
  getEmulationGroups: async (classId?: string): Promise<any[]> => {
    const url = classId ? `${BASE_URL}/emulation/groups?classId=${encodeURIComponent(classId)}` : `${BASE_URL}/emulation/groups`;
    const res = await fetch(url);
    return handleResponse<any[]>(res);
  },
  createEmulationGroup: async (data: { MaLop: string; TenTo: string; ToTruong?: string }): Promise<EmulationGroup> => {
    const res = await fetch(`${BASE_URL}/emulation/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<EmulationGroup>(res);
  },
  updateEmulationGroup: async (id: string, data: { TenTo?: string; ToTruong?: string; TrangThai?: any }): Promise<EmulationGroup> => {
    const res = await fetch(`${BASE_URL}/emulation/groups/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<EmulationGroup>(res);
  },
  deleteEmulationGroup: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${BASE_URL}/emulation/groups/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },
  getGroupMembers: async (classId?: string): Promise<GroupMember[]> => {
    const url = classId ? `${BASE_URL}/emulation/groups/members?classId=${encodeURIComponent(classId)}` : `${BASE_URL}/emulation/groups/members`;
    const res = await fetch(url);
    return handleResponse<GroupMember[]>(res);
  },
  assignStudentToGroup: async (data: { MaHS: string; MaTo: string; TuNgay?: string }): Promise<GroupMember> => {
    const res = await fetch(`${BASE_URL}/emulation/groups/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<GroupMember>(res);
  },
  unassignStudentFromGroup: async (MaHS: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${BASE_URL}/emulation/groups/unassign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ MaHS })
    });
    return handleResponse<{ success: boolean }>(res);
  },
  batchAssignStudentsToGroup: async (assignments: { MaHS: string; MaTo: string }[], TuNgay?: string): Promise<any> => {
    const res = await fetch(`${BASE_URL}/emulation/groups/batch-assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignments, TuNgay })
    });
    return handleResponse<any>(res);
  },
  autoDivideStudentsIntoGroups: async (classId: string, groupIds: string[], assignOnlyUnassigned: boolean = false): Promise<{ assignedCount: number; groups: any[] }> => {
    const res = await fetch(`${BASE_URL}/emulation/groups/auto-divide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, groupIds, assignOnlyUnassigned })
    });
    return handleResponse<{ assignedCount: number; groups: any[] }>(res);
  },

  // Periods
  getEmulationPeriods: async (): Promise<EmulationPeriod[]> => {
    const res = await fetch(`${BASE_URL}/emulation/periods`);
    return handleResponse<EmulationPeriod[]>(res);
  },
  createEmulationPeriod: async (data: Partial<EmulationPeriod>): Promise<EmulationPeriod> => {
    const res = await fetch(`${BASE_URL}/emulation/periods`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<EmulationPeriod>(res);
  },
  updateEmulationPeriod: async (id: string, data: Partial<EmulationPeriod>): Promise<EmulationPeriod> => {
    const res = await fetch(`${BASE_URL}/emulation/periods/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<EmulationPeriod>(res);
  },
  deleteEmulationPeriod: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${BASE_URL}/emulation/periods/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },
  resetEmulationPeriods: async (startDate: string = '2026-09-07', totalWeeks: number = 18): Promise<{ success: boolean; message: string; periods: EmulationPeriod[] }> => {
    const res = await fetch(`${BASE_URL}/emulation/periods/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, totalWeeks })
    });
    return handleResponse<{ success: boolean; message: string; periods: EmulationPeriod[] }>(res);
  },

  // Records
  getEmulationRecords: async (params?: {
    classId?: string;
    periodId?: string;
    studentId?: string;
    type?: string;
    date?: string;
    status?: string;
  }): Promise<EmulationRecord[]> => {
    const searchParams = new URLSearchParams();
    if (params?.classId) searchParams.append('classId', params.classId);
    if (params?.periodId) searchParams.append('periodId', params.periodId);
    if (params?.studentId) searchParams.append('studentId', params.studentId);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.date) searchParams.append('date', params.date);
    if (params?.status) searchParams.append('status', params.status);

    const res = await fetch(`${BASE_URL}/emulation/records?${searchParams.toString()}`);
    return handleResponse<EmulationRecord[]>(res);
  },
  createEmulationRecord: async (data: {
    Ngay: string;
    MaLop: string;
    MaHS: string;
    MaLoi: string;
    GhiChu?: string;
    NguoiGhiNhan?: string;
    MaKy?: string;
  }): Promise<EmulationRecord> => {
    const res = await fetch(`${BASE_URL}/emulation/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<EmulationRecord>(res);
  },
  updateEmulationRecord: async (
    id: string,
    data: { GhiChu?: string; TrangThai?: string; NguoiSua: string; LyDoSuaHuy?: string }
  ): Promise<EmulationRecord> => {
    const res = await fetch(`${BASE_URL}/emulation/records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<EmulationRecord>(res);
  },

  // Calculations & Ranking
  calculateStudentWeeklyScores: async (classId: string, periodId: string): Promise<WeeklyStudentSummary[]> => {
    const res = await fetch(`${BASE_URL}/emulation/calculate-students?classId=${encodeURIComponent(classId)}&periodId=${encodeURIComponent(periodId)}`);
    return handleResponse<WeeklyStudentSummary[]>(res);
  },
  calculateGroupWeeklyScores: async (classId: string, periodId: string): Promise<WeeklyGroupSummary[]> => {
    const res = await fetch(`${BASE_URL}/emulation/calculate-groups?classId=${encodeURIComponent(classId)}&periodId=${encodeURIComponent(periodId)}`);
    return handleResponse<WeeklyGroupSummary[]>(res);
  },

  // Lock & Unlock
  lockWeeklyPeriod: async (periodId: string, classId: string, lockedBy: string): Promise<any> => {
    const res = await fetch(`${BASE_URL}/emulation/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ periodId, classId, lockedBy })
    });
    return handleResponse<any>(res);
  },
  unlockWeeklyPeriod: async (periodId: string, classId: string, unlockedBy: string, reason: string): Promise<any> => {
    const res = await fetch(`${BASE_URL}/emulation/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ periodId, classId, unlockedBy, reason })
    });
    return handleResponse<any>(res);
  },

  // Student Log
  getStudentEmulationLog: async (studentId: string, classId?: string, periodId?: string): Promise<any> => {
    const searchParams = new URLSearchParams({ studentId });
    if (classId) searchParams.append('classId', classId);
    if (periodId) searchParams.append('periodId', periodId);

    const res = await fetch(`${BASE_URL}/emulation/student-log?${searchParams.toString()}`);
    return handleResponse<any>(res);
  },

  // Reports
  getEmulationReport: async (classId?: string, periodId?: string): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (classId) searchParams.append('classId', classId);
    if (periodId) searchParams.append('periodId', periodId);

    const res = await fetch(`${BASE_URL}/emulation/reports?${searchParams.toString()}`);
    return handleResponse<any>(res);
  },

  // ==========================================
  // GOOGLE WORKSPACE API (SHEETS & DRIVE)
  // ==========================================

  getSheetsMetadata: async (spreadsheetId: string): Promise<any> => {
    const res = await fetch(`${BASE_URL}/workspace/sheets/metadata`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ spreadsheetId })
    });
    return handleResponse<any>(res);
  },

  initSheetsTabs: async (spreadsheetId: string): Promise<any> => {
    const res = await fetch(`${BASE_URL}/workspace/sheets/init-tabs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ spreadsheetId })
    });
    return handleResponse<any>(res);
  },

  pullFromGoogleSheets: async (spreadsheetId: string): Promise<any> => {
    const res = await fetch(`${BASE_URL}/workspace/sheets/pull`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ spreadsheetId })
    });
    return handleResponse<any>(res);
  },

  pushToGoogleSheets: async (spreadsheetId: string): Promise<any> => {
    const res = await fetch(`${BASE_URL}/workspace/sheets/push`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ spreadsheetId })
    });
    return handleResponse<any>(res);
  },

  readSheetTable: async (spreadsheetId: string, sheetName: string): Promise<any[]> => {
    const res = await fetch(`${BASE_URL}/workspace/sheets/read-table`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ spreadsheetId, sheetName })
    });
    return handleResponse<any[]>(res);
  },

  insertSheetRow: async (spreadsheetId: string, sheetName: string, data: Record<string, any>): Promise<any> => {
    const res = await fetch(`${BASE_URL}/workspace/sheets/insert-row`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ spreadsheetId, sheetName, data })
    });
    return handleResponse<any>(res);
  },

  updateSheetRow: async (spreadsheetId: string, sheetName: string, idValue: string, data: Record<string, any>): Promise<any> => {
    const res = await fetch(`${BASE_URL}/workspace/sheets/update-row`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ spreadsheetId, sheetName, idValue, data })
    });
    return handleResponse<any>(res);
  },

  deleteSheetRow: async (spreadsheetId: string, sheetName: string, idValue: string): Promise<any> => {
    const res = await fetch(`${BASE_URL}/workspace/sheets/delete-row`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ spreadsheetId, sheetName, idValue })
    });
    return handleResponse<any>(res);
  },

  listDriveFiles: async (options?: { folderId?: string; search?: string; mimeType?: string; pageSize?: number }): Promise<any> => {
    const params = new URLSearchParams();
    if (options?.folderId) params.append('folderId', options.folderId);
    if (options?.search) params.append('search', options.search);
    if (options?.mimeType) params.append('mimeType', options.mimeType);
    if (options?.pageSize) params.append('pageSize', String(options.pageSize));

    const res = await fetch(`${BASE_URL}/workspace/drive/files?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<any>(res);
  },

  createDriveFolder: async (name: string, parentId?: string): Promise<any> => {
    const res = await fetch(`${BASE_URL}/workspace/drive/folders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, parentId })
    });
    return handleResponse<any>(res);
  },

  deleteDriveFile: async (fileId: string): Promise<any> => {
    const res = await fetch(`${BASE_URL}/workspace/drive/files/${fileId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse<any>(res);
  },

  // Excel Export (.xlsx)
  getExcelExportSummary: async (classId?: string): Promise<any> => {
    const url = classId ? `${BASE_URL}/export/excel/summary?classId=${encodeURIComponent(classId)}` : `${BASE_URL}/export/excel/summary`;
    const res = await fetch(url);
    return handleResponse<any>(res);
  },

  downloadExcel: (classId?: string) => {
    const url = classId ? `${BASE_URL}/export/excel?classId=${encodeURIComponent(classId)}` : `${BASE_URL}/export/excel`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', classId ? `Du_Lieu_Lop_${classId}_2026_2027.xlsx` : 'Du_Lieu_Quan_Ly_Lop_Hoc_2026_2027.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  generateExcelOnServer: async (): Promise<any> => {
    const res = await fetch(`${BASE_URL}/export/excel/generate`, { method: 'POST' });
    return handleResponse<any>(res);
  }
};
