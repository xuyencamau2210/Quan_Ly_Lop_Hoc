import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  Classroom, Student, AttendanceRecord, GradeItem, DocumentItem, AppSettings, DashboardStats, AcademicRank,
  EmulationCategory, EmulationGroup, GroupMember, EmulationPeriod, EmulationRecord,
  WeeklyStudentSummary, WeeklyGroupSummary,
  EmulationType, EmulationCategoryStatus, EmulationRecordStatus, EmulationSummaryStatus,
  ClassOfficer, SeatingChart, SeatPosition, OfficerRole
} from '../../src/types/index.ts';
import { 
  initialClasses, initialStudents, initialAttendance, initialGrades, initialDocuments, initialSettings,
  initialEmulationCategories, initialEmulationGroups, initialGroupMembers, initialEmulationPeriods,
  initialEmulationRecords, initialWeeklyStudentSummaries, initialWeeklyGroupSummaries,
  initialClassOfficers, initialSeatingCharts
} from './initialData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'classroom_db.json');

export interface DatabaseState {
  classes: Classroom[];
  students: Student[];
  attendance: AttendanceRecord[];
  grades: GradeItem[];
  documents: DocumentItem[];
  settings: AppSettings;
  emulationCategories: EmulationCategory[];
  emulationGroups: EmulationGroup[];
  groupMembers: GroupMember[];
  emulationPeriods: EmulationPeriod[];
  emulationRecords: EmulationRecord[];
  weeklyStudentSummaries: WeeklyStudentSummary[];
  weeklyGroupSummaries: WeeklyGroupSummary[];
  classOfficers: ClassOfficer[];
  seatingCharts: SeatingChart[];
  lastUpdated: string;
}

export class ClassroomStore {
  private state: DatabaseState;
  private filePath: string;

  constructor(customFilePath?: string) {
    this.filePath = customFilePath || DATA_FILE;
    this.state = this.loadData();
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public setState(newState: Partial<DatabaseState>): void {
    this.state = {
      ...this.state,
      ...newState
    };
    this.saveData();
  }

  private loadData(): DatabaseState {
    if (this.filePath === ':memory:') {
      return {
        classes: [],
        students: [],
        attendance: [],
        grades: [],
        documents: [],
        settings: JSON.parse(JSON.stringify(initialSettings)),
        emulationCategories: JSON.parse(JSON.stringify(initialEmulationCategories)),
        emulationGroups: [],
        groupMembers: [],
        emulationPeriods: [],
        emulationRecords: [],
        weeklyStudentSummaries: [],
        weeklyGroupSummaries: [],
        classOfficers: [],
        seatingCharts: [],
        lastUpdated: new Date().toISOString()
      };
    }
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed.classes && parsed.students) {
          // Gracefully backfill any missing emulation datasets if JSON was created earlier
          if (!parsed.emulationCategories) {
            parsed.emulationCategories = JSON.parse(JSON.stringify(initialEmulationCategories));
          }
          if (!parsed.emulationGroups) {
            parsed.emulationGroups = JSON.parse(JSON.stringify(initialEmulationGroups));
          }
          if (!parsed.groupMembers) {
            parsed.groupMembers = JSON.parse(JSON.stringify(initialGroupMembers));
          }
          if (!parsed.emulationPeriods) {
            parsed.emulationPeriods = JSON.parse(JSON.stringify(initialEmulationPeriods));
          }
          if (!parsed.emulationRecords) {
            parsed.emulationRecords = JSON.parse(JSON.stringify(initialEmulationRecords));
          }
          if (!parsed.weeklyStudentSummaries) {
            parsed.weeklyStudentSummaries = JSON.parse(JSON.stringify(initialWeeklyStudentSummaries));
          }
          if (!parsed.weeklyGroupSummaries) {
            parsed.weeklyGroupSummaries = JSON.parse(JSON.stringify(initialWeeklyGroupSummaries));
          }
          if (!parsed.classOfficers) {
            parsed.classOfficers = JSON.parse(JSON.stringify(initialClassOfficers));
          }
          if (!parsed.seatingCharts) {
            parsed.seatingCharts = JSON.parse(JSON.stringify(initialSeatingCharts));
          }
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not read existing classroom_db.json, initializing fresh data store:', err);
    }

    const defaultState: DatabaseState = {
      classes: JSON.parse(JSON.stringify(initialClasses)),
      students: JSON.parse(JSON.stringify(initialStudents)),
      attendance: JSON.parse(JSON.stringify(initialAttendance)),
      grades: JSON.parse(JSON.stringify(initialGrades)),
      documents: JSON.parse(JSON.stringify(initialDocuments)),
      settings: JSON.parse(JSON.stringify(initialSettings)),
      emulationCategories: JSON.parse(JSON.stringify(initialEmulationCategories)),
      emulationGroups: JSON.parse(JSON.stringify(initialEmulationGroups)),
      groupMembers: JSON.parse(JSON.stringify(initialGroupMembers)),
      emulationPeriods: JSON.parse(JSON.stringify(initialEmulationPeriods)),
      emulationRecords: JSON.parse(JSON.stringify(initialEmulationRecords)),
      weeklyStudentSummaries: JSON.parse(JSON.stringify(initialWeeklyStudentSummaries)),
      weeklyGroupSummaries: JSON.parse(JSON.stringify(initialWeeklyGroupSummaries)),
      classOfficers: JSON.parse(JSON.stringify(initialClassOfficers)),
      seatingCharts: JSON.parse(JSON.stringify(initialSeatingCharts)),
      lastUpdated: new Date().toISOString()
    };

    this.saveData(defaultState);
    return defaultState;
  }

  private saveData(stateToSave?: DatabaseState) {
    if (this.filePath === ':memory:') {
      const data = stateToSave || this.state;
      data.lastUpdated = new Date().toISOString();
      return;
    }
    try {
      const data = stateToSave || this.state;
      data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving classroom_db.json:', err);
    }
  }

  // --- CLASSES CRUD ---
  public getClasses(): Classroom[] {
    // dynamically calculate actual student count for each class
    return this.state.classes.map(cls => {
      const studentCount = this.state.students.filter(s => s.classId === cls.id && s.status === 'active').length;
      return {
        ...cls,
        studentCount
      };
    });
  }

  public getClassById(id: string): Classroom | undefined {
    const cls = this.state.classes.find(c => c.id === id);
    if (!cls) return undefined;
    const studentCount = this.state.students.filter(s => s.classId === cls.id && s.status === 'active').length;
    return { ...cls, studentCount };
  }

  public createClass(data: Omit<Classroom, 'id' | 'createdAt' | 'studentCount'>): Classroom {
    const newClass: Classroom = {
      ...data,
      id: `cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      studentCount: 0
    };
    this.state.classes.push(newClass);
    this.saveData();
    return newClass;
  }

  public updateClass(id: string, data: Partial<Classroom>): Classroom | null {
    const index = this.state.classes.findIndex(c => c.id === id);
    if (index === -1) return null;

    const oldName = this.state.classes[index].name;
    const updatedClass = {
      ...this.state.classes[index],
      ...data,
      id // preserve ID
    };

    this.state.classes[index] = updatedClass;

    // If class name changed, update students and documents accordingly
    if (data.name && data.name !== oldName) {
      this.state.students.forEach(s => {
        if (s.classId === id) s.className = data.name!;
      });
      this.state.documents.forEach(d => {
        if (d.classId === id) d.className = data.name!;
      });
    }

    this.saveData();
    return this.getClassById(id)!;
  }

  public deleteClass(id: string): { success: boolean; message?: string } {
    const classExists = this.state.classes.some(c => c.id === id);
    if (!classExists) return { success: false, message: 'Lớp học không tồn tại' };

    // Also remove or unlink students
    this.state.classes = this.state.classes.filter(c => c.id !== id);
    this.state.students = this.state.students.filter(s => s.classId !== id);
    this.state.attendance = this.state.attendance.filter(a => a.classId !== id);
    this.state.grades = this.state.grades.filter(g => g.classId !== id);

    this.saveData();
    return { success: true };
  }

  // --- STUDENTS CRUD ---
  public getStudents(filters?: { classId?: string; search?: string; status?: string }): Student[] {
    let result = [...this.state.students];

    if (filters?.classId && filters.classId !== 'all') {
      result = result.filter(s => s.classId === filters.classId);
    }

    if (filters?.status && filters.status !== 'all') {
      result = result.filter(s => s.status === filters.status);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(s => 
        s.fullName.toLowerCase().includes(q) || 
        s.studentCode.toLowerCase().includes(q) ||
        s.parentPhone.includes(q) ||
        s.className.toLowerCase().includes(q)
      );
    }

    return result;
  }

  public getStudentById(id: string): Student | undefined {
    return this.state.students.find(s => s.id === id);
  }

  public createStudent(data: Omit<Student, 'id' | 'createdAt'>): Student {
    const targetClass = this.state.classes.find(c => c.id === data.classId);
    const className = targetClass ? targetClass.name : data.className;

    // Generate code if missing
    const studentCode = data.studentCode?.trim() || `HS${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`;

    const newStudent: Student = {
      ...data,
      id: `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      studentCode,
      className,
      createdAt: new Date().toISOString()
    };

    this.state.students.push(newStudent);
    this.saveData();
    return newStudent;
  }

  public updateStudent(id: string, data: Partial<Student>): Student | null {
    const index = this.state.students.findIndex(s => s.id === id);
    if (index === -1) return null;

    if (data.classId && data.classId !== this.state.students[index].classId) {
      const newClass = this.state.classes.find(c => c.id === data.classId);
      if (newClass) data.className = newClass.name;
    }

    const updated = {
      ...this.state.students[index],
      ...data,
      id
    };

    this.state.students[index] = updated;

    // Update names in attendance and grades if student name changed
    if (data.fullName && data.fullName !== updated.fullName) {
      this.state.attendance.forEach(a => {
        if (a.studentId === id) a.studentName = data.fullName!;
      });
      this.state.grades.forEach(g => {
        if (g.studentId === id) g.studentName = data.fullName!;
      });
    }

    this.saveData();
    return updated;
  }

  public deleteStudent(id: string): { success: boolean; message?: string } {
    const exists = this.state.students.some(s => s.id === id);
    if (!exists) return { success: false, message: 'Học sinh không tồn tại' };

    this.state.students = this.state.students.filter(s => s.id !== id);
    this.state.attendance = this.state.attendance.filter(a => a.studentId !== id);
    this.state.grades = this.state.grades.filter(g => g.studentId !== id);

    this.saveData();
    return { success: true };
  }

  // --- ATTENDANCE CRUD ---
  public getAttendance(classId: string, date: string): AttendanceRecord[] {
    // If records exist for this class & date, return them
    const existing = this.state.attendance.filter(a => a.classId === classId && a.date === date);
    
    // Also include any students of this class who don't have a record yet (default to 'present')
    const studentsInClass = this.state.students.filter(s => s.classId === classId && s.status === 'active');
    
    return studentsInClass.map(s => {
      const rec = existing.find(e => e.studentId === s.id);
      if (rec) return rec;

      return {
        id: `att-tmp-${s.id}-${date}`,
        classId,
        date,
        studentId: s.id,
        studentName: s.fullName,
        studentCode: s.studentCode,
        status: 'present' as const,
        note: '',
        updatedAt: new Date().toISOString()
      };
    });
  }

  public saveAttendance(classId: string, date: string, records: AttendanceRecord[]): { success: boolean; savedCount: number } {
    // Remove existing records for this class & date
    this.state.attendance = this.state.attendance.filter(a => !(a.classId === classId && a.date === date));

    // Insert new sanitized records
    const timestamp = new Date().toISOString();
    const preparedRecords = records.map(r => ({
      ...r,
      id: r.id.startsWith('att-tmp-') ? `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` : r.id,
      classId,
      date,
      updatedAt: timestamp
    }));

    this.state.attendance.push(...preparedRecords);
    this.saveData();

    return { success: true, savedCount: preparedRecords.length };
  }

  public getAttendanceHistory(classId?: string): {
    summaries: {
      date: string;
      classId: string;
      className: string;
      total: number;
      present: number;
      excused: number;
      unexcused: number;
      late: number;
      attendanceRate: number;
    }[];
  } {
    const classMap = new Map(this.state.classes.map(c => [c.id, c.name]));
    // Group records by classId + date
    const groups = new Map<string, AttendanceRecord[]>();

    this.state.attendance.forEach(rec => {
      if (classId && classId !== 'all' && rec.classId !== classId) return;
      const key = `${rec.classId}__${rec.date}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(rec);
    });

    const summaries = Array.from(groups.entries()).map(([key, list]) => {
      const [cId, date] = key.split('__');
      const total = list.length;
      const present = list.filter(r => r.status === 'present').length;
      const excused = list.filter(r => r.status === 'excused').length;
      const unexcused = list.filter(r => r.status === 'unexcused').length;
      const late = list.filter(r => r.status === 'late').length;
      const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

      return {
        date,
        classId: cId,
        className: classMap.get(cId) || 'Không xác định',
        total,
        present,
        excused,
        unexcused,
        late,
        attendanceRate
      };
    }).sort((a, b) => b.date.localeCompare(a.date));

    return { summaries };
  }

  // --- GRADES CRUD ---
  public calculateAverageAndRank(
    oral: (number | null)[], 
    test15: (number | null)[], 
    test45: number | null, 
    finalExam: number | null
  ): { average: number | null; rank?: AcademicRank } {
    const validOral = oral.filter((n): n is number => n !== null && !isNaN(n));
    const valid15 = test15.filter((n): n is number => n !== null && !isNaN(n));
    const oralSum = validOral.reduce((acc, v) => acc + v, 0);
    const test15Sum = valid15.reduce((acc, v) => acc + v, 0);
    const oralCount = validOral.length;
    const test15Count = valid15.length;

    let totalWeight = oralCount * 1 + test15Count * 1;
    let weightedSum = oralSum + test15Sum;

    if (test45 !== null && !isNaN(test45)) {
      weightedSum += test45 * 2;
      totalWeight += 2;
    }

    if (finalExam !== null && !isNaN(finalExam)) {
      weightedSum += finalExam * 3;
      totalWeight += 3;
    }

    if (totalWeight === 0) return { average: null, rank: undefined };

    const average = Math.round((weightedSum / totalWeight) * 10) / 10;

    let rank: AcademicRank = 'Yếu';
    if (average >= 9.0) rank = 'Xuất sắc';
    else if (average >= 8.0) rank = 'Giỏi';
    else if (average >= 6.5) rank = 'Khá';
    else if (average >= 5.0) rank = 'Trung bình';
    else if (average >= 3.5) rank = 'Yếu';
    else rank = 'Kém';

    return { average, rank };
  }

  public getGrades(classId: string, subject: string, semester: string): GradeItem[] {
    const existing = this.state.grades.filter(g => 
      g.classId === classId && 
      g.subject === subject && 
      g.semester === semester
    );

    const studentsInClass = this.state.students.filter(s => s.classId === classId && s.status === 'active');

    return studentsInClass.map(s => {
      const found = existing.find(e => e.studentId === s.id);
      if (found) return found;

      return {
        id: `gr-tmp-${s.id}`,
        studentId: s.id,
        studentName: s.fullName,
        studentCode: s.studentCode,
        classId,
        subject,
        semester: semester as any,
        oral: [],
        test15: [],
        test45: null,
        finalExam: null,
        average: null,
        note: '',
        updatedAt: new Date().toISOString()
      };
    });
  }

  public saveGradeBatch(classId: string, subject: string, semester: string, grades: GradeItem[]): { success: boolean; count: number } {
    // Remove existing for this triplet
    this.state.grades = this.state.grades.filter(g => 
      !(g.classId === classId && g.subject === subject && g.semester === semester)
    );

    const timestamp = new Date().toISOString();
    const updated = grades.map(g => {
      const calc = this.calculateAverageAndRank(g.oral || [], g.test15 || [], g.test45, g.finalExam);
      return {
        ...g,
        id: g.id.startsWith('gr-tmp-') ? `gr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` : g.id,
        classId,
        subject,
        semester: semester as any,
        average: calc.average,
        rank: calc.rank,
        updatedAt: timestamp
      };
    });

    this.state.grades.push(...updated);
    this.saveData();

    return { success: true, count: updated.length };
  }

  public saveSingleGrade(grade: GradeItem): GradeItem {
    const calc = this.calculateAverageAndRank(grade.oral || [], grade.test15 || [], grade.test45, grade.finalExam);
    const updatedRecord: GradeItem = {
      ...grade,
      id: grade.id?.startsWith('gr-tmp-') || !grade.id ? `gr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` : grade.id,
      average: calc.average,
      rank: calc.rank,
      updatedAt: new Date().toISOString()
    };

    const index = this.state.grades.findIndex(g => g.id === updatedRecord.id || (
      g.studentId === updatedRecord.studentId && 
      g.subject === updatedRecord.subject && 
      g.semester === updatedRecord.semester
    ));

    if (index !== -1) {
      this.state.grades[index] = updatedRecord;
    } else {
      this.state.grades.push(updatedRecord);
    }

    this.saveData();
    return updatedRecord;
  }

  // --- DOCUMENTS CRUD ---
  public getDocuments(classId?: string, category?: string): DocumentItem[] {
    let result = [...this.state.documents];
    if (classId && classId !== 'all') {
      result = result.filter(d => !d.classId || d.classId === classId);
    }
    if (category && category !== 'all') {
      result = result.filter(d => d.category === category);
    }
    return result.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }

  public createDocument(data: Omit<DocumentItem, 'id' | 'uploadedAt'>): DocumentItem {
    const newDoc: DocumentItem = {
      ...data,
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      uploadedAt: new Date().toISOString()
    };
    this.state.documents.push(newDoc);
    this.saveData();
    return newDoc;
  }

  public deleteDocument(id: string): { success: boolean } {
    this.state.documents = this.state.documents.filter(d => d.id !== id);
    this.saveData();
    return { success: true };
  }

  // --- SETTINGS ---
  public getSettings(): AppSettings {
    return this.state.settings;
  }

  public updateSettings(data: Partial<AppSettings>): AppSettings {
    this.state.settings = {
      ...this.state.settings,
      ...data
    };
    this.saveData();
    return this.state.settings;
  }

  // --- DASHBOARD STATS ---
  public getDashboardStats(): DashboardStats {
    const totalClasses = this.state.classes.length;
    const activeStudents = this.state.students.filter(s => s.status === 'active');
    const totalStudents = activeStudents.length;

    // Today's attendance
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = this.state.attendance.filter(a => a.date === today);
    
    let presentCount = 0;
    let absentCount = 0;
    let excusedCount = 0;
    let lateCount = 0;

    todayRecords.forEach(r => {
      if (r.status === 'present') presentCount++;
      else if (r.status === 'excused') excusedCount++;
      else if (r.status === 'unexcused') absentCount++;
      else if (r.status === 'late') lateCount++;
    });

    const totalTodayRecorded = todayRecords.length;
    const attendanceRate = totalTodayRecorded > 0 
      ? Math.round(((presentCount + lateCount) / totalTodayRecorded) * 100) 
      : 98; // Fallback demo rate if no record yet today

    // Average grade calculation
    const validGrades = this.state.grades.filter(g => g.average !== null && !isNaN(g.average!));
    const averageGrade = validGrades.length > 0
      ? Math.round((validGrades.reduce((sum, g) => sum + (g.average || 0), 0) / validGrades.length) * 10) / 10
      : 8.2;

    // Rank distribution
    const academicRankDistribution = {
      excellent: 0,
      good: 0,
      fair: 0,
      average: 0,
      weak: 0
    };

    validGrades.forEach(g => {
      if (g.rank === 'Xuất sắc') academicRankDistribution.excellent++;
      else if (g.rank === 'Giỏi') academicRankDistribution.good++;
      else if (g.rank === 'Khá') academicRankDistribution.fair++;
      else if (g.rank === 'Trung bình') academicRankDistribution.average++;
      else if (g.rank === 'Yếu' || g.rank === 'Kém') academicRankDistribution.weak++;
    });

    // Class summaries
    const classSummaries = this.state.classes.map(cls => {
      const clsStudents = this.state.students.filter(s => s.classId === cls.id && s.status === 'active');
      const clsAtt = this.state.attendance.filter(a => a.classId === cls.id);
      const clsPresent = clsAtt.filter(a => a.status === 'present' || a.status === 'late').length;
      const recentAttendanceRate = clsAtt.length > 0 ? Math.round((clsPresent / clsAtt.length) * 100) : 98;

      return {
        id: cls.id,
        name: cls.name,
        studentCount: clsStudents.length,
        homeroomTeacher: cls.homeroomTeacher,
        room: cls.room,
        recentAttendanceRate
      };
    });

    // Recent activities
    const recentActivities = [
      {
        id: 'act-1',
        title: 'Điểm danh buổi sáng lớp 10A1 (Sĩ số 5/5 có mặt)',
        time: '07:15 Hôm nay',
        type: 'attendance' as const
      },
      {
        id: 'act-2',
        title: 'Cập nhật điểm kiểm tra 15 phút môn Toán lớp 10A1',
        time: '10:30 Hôm qua',
        type: 'grade' as const
      },
      {
        id: 'act-3',
        title: 'Thêm tài liệu: Đề kiểm tra giữa kỳ 1 môn Toán lên kho lưu trữ',
        time: '14:20 Hôm qua',
        type: 'document' as const
      },
      {
        id: 'act-4',
        title: 'Tiếp nhận học sinh mới: Đặng Thanh Tâm (11B1)',
        time: '3 ngày trước',
        type: 'student' as const
      }
    ];

    return {
      totalClasses,
      totalStudents,
      todayAttendance: {
        date: today,
        presentCount: presentCount || totalStudents,
        absentCount,
        excusedCount,
        lateCount,
        attendanceRate
      },
      averageGrade,
      academicRankDistribution,
      classSummaries,
      recentActivities
    };
  }

  // ==========================================
  // THI ĐUA VÀ VI PHẠM HỌC SINH (BUSINESS LOGIC)
  // ==========================================

  // --- DANH MỤC THI ĐUA ---
  public getEmulationCategories(): EmulationCategory[] {
    return this.state.emulationCategories;
  }

  public createEmulationCategory(data: { TenLoi: string; Loai: EmulationType; Diem: number; MoTa?: string; TrangThai?: EmulationCategoryStatus }): EmulationCategory {
    const MaLoi = `DM-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const newCat: EmulationCategory = {
      MaLoi,
      TenLoi: data.TenLoi.trim(),
      Loai: data.Loai,
      Diem: Math.abs(Number(data.Diem)) || 1, // Điểm trong danh mục luôn là số dương
      MoTa: data.MoTa?.trim() || '',
      TrangThai: data.TrangThai || 'DANG_DUNG'
    };
    this.state.emulationCategories.push(newCat);
    this.saveData();
    return newCat;
  }

  public updateEmulationCategory(MaLoi: string, data: Partial<EmulationCategory>): EmulationCategory | null {
    const idx = this.state.emulationCategories.findIndex(c => c.MaLoi === MaLoi);
    if (idx === -1) return null;

    const existing = this.state.emulationCategories[idx];
    const updated: EmulationCategory = {
      ...existing,
      ...data,
      MaLoi, // Không đổi MaLoi
      Diem: data.Diem !== undefined ? Math.abs(Number(data.Diem)) : existing.Diem
    };

    // Lưu ý: Không tự động đổi điểm của các ghi nhận lịch sử khi danh mục được chỉnh sửa
    this.state.emulationCategories[idx] = updated;
    this.saveData();
    return updated;
  }

  public toggleEmulationCategoryStatus(MaLoi: string): EmulationCategory | null {
    const idx = this.state.emulationCategories.findIndex(c => c.MaLoi === MaLoi);
    if (idx === -1) return null;

    const current = this.state.emulationCategories[idx];
    current.TrangThai = current.TrangThai === 'DANG_DUNG' ? 'AN' : 'DANG_DUNG';
    this.saveData();
    return current;
  }

  // --- TỔ HỌC SINH VÀ THÀNH VIÊN TỔ ---
  public getEmulationGroups(classId?: string): (EmulationGroup & { memberCount: number; members: Student[] })[] {
    let groups = this.state.emulationGroups;
    if (classId && classId !== 'all') {
      groups = groups.filter(g => g.MaLop === classId);
    }

    return groups.map(g => {
      // Find students belonging to this group
      const studentIdsInGroup = this.state.groupMembers
        .filter(m => m.MaTo === g.MaTo)
        .map(m => m.MaHS);
      
      const members = this.state.students.filter(s => studentIdsInGroup.includes(s.id));
      return {
        ...g,
        memberCount: members.length,
        members
      };
    });
  }

  public createEmulationGroup(data: { MaLop: string; TenTo: string; ToTruong?: string }): EmulationGroup {
    const newGroup: EmulationGroup = {
      MaTo: `TO-${Date.now().toString().slice(-6)}`,
      MaLop: data.MaLop,
      TenTo: data.TenTo.trim(),
      ToTruong: data.ToTruong?.trim() || '',
      TrangThai: 'DANG_HOAT_DONG'
    };
    this.state.emulationGroups.push(newGroup);
    this.saveData();
    return newGroup;
  }

  public getGroupMembers(classId?: string): GroupMember[] {
    if (!classId || classId === 'all') return this.state.groupMembers;
    const groupIdsOfClass = this.state.emulationGroups.filter(g => g.MaLop === classId).map(g => g.MaTo);
    return this.state.groupMembers.filter(m => groupIdsOfClass.includes(m.MaTo));
  }

  public assignStudentToGroup(MaHS: string, MaTo: string, TuNgay: string = '2025-09-01', DenNgay?: string): GroupMember {
    // Tìm phân tổ đang hiệu lực của học sinh
    const activeMember = this.state.groupMembers.find(m => m.MaHS === MaHS && (!m.DenNgay || m.DenNgay >= TuNgay));
    if (activeMember && activeMember.MaTo === MaTo) {
      activeMember.TuNgay = TuNgay;
      if (DenNgay) activeMember.DenNgay = DenNgay;
      this.saveData();
      return activeMember;
    }

    if (activeMember) {
      // Đóng phân tổ cũ trước ngày bắt đầu phân tổ mới
      const prevEnd = new Date(new Date(TuNgay).getTime() - 86400000).toISOString().split('T')[0];
      activeMember.DenNgay = prevEnd >= activeMember.TuNgay ? prevEnd : activeMember.TuNgay;
    }

    const newMember: GroupMember = {
      MaPhanTo: `PT-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      MaHS,
      MaTo,
      TuNgay,
      DenNgay
    };
    this.state.groupMembers.push(newMember);
    this.saveData();
    return newMember;
  }

  public updateEmulationGroup(MaTo: string, data: { TenTo?: string; ToTruong?: string; TrangThai?: 'DANG_HOAT_DONG' | 'NGUNG' }): EmulationGroup | undefined {
    const group = this.state.emulationGroups.find(g => g.MaTo === MaTo);
    if (!group) return undefined;
    if (data.TenTo !== undefined) group.TenTo = data.TenTo.trim();
    if (data.ToTruong !== undefined) group.ToTruong = data.ToTruong.trim();
    if (data.TrangThai !== undefined) group.TrangThai = data.TrangThai;
    this.saveData();
    return group;
  }

  public deleteEmulationGroup(MaTo: string): boolean {
    const index = this.state.emulationGroups.findIndex(g => g.MaTo === MaTo);
    if (index === -1) return false;
    this.state.emulationGroups.splice(index, 1);
    // Remove memberships for this group
    this.state.groupMembers = this.state.groupMembers.filter(m => m.MaTo !== MaTo);
    this.saveData();
    return true;
  }

  public unassignStudentFromGroup(MaHS: string): boolean {
    const prevCount = this.state.groupMembers.length;
    this.state.groupMembers = this.state.groupMembers.filter(m => m.MaHS !== MaHS);
    if (this.state.groupMembers.length !== prevCount) {
      this.saveData();
      return true;
    }
    return false;
  }

  public batchAssignStudentsToGroup(assignments: { MaHS: string; MaTo: string }[], TuNgay: string = '2026-09-07'): GroupMember[] {
    const result: GroupMember[] = [];
    for (const item of assignments) {
      if (item.MaHS && item.MaTo) {
        const mem = this.assignStudentToGroup(item.MaHS, item.MaTo, TuNgay);
        result.push(mem);
      } else if (item.MaHS && !item.MaTo) {
        this.unassignStudentFromGroup(item.MaHS);
      }
    }
    return result;
  }

  public autoAssignStudentsEqually(classId: string, groupIds: string[], assignOnlyUnassigned: boolean = false): { assignedCount: number; groups: any[] } {
    const groupsOfClass = this.state.emulationGroups.filter(g => g.MaLop === classId && groupIds.includes(g.MaTo) && g.TrangThai === 'DANG_HOAT_DONG');
    if (groupsOfClass.length === 0) {
      throw new Error('Lớp chưa có tổ hoạt động nào được chọn');
    }

    const studentsInClass = this.state.students.filter(s => s.classId === classId && s.status === 'active');
    let targetStudents = studentsInClass;

    if (assignOnlyUnassigned) {
      const assignedIds = this.state.groupMembers
        .filter(m => groupsOfClass.some(g => g.MaTo === m.MaTo))
        .map(m => m.MaHS);
      targetStudents = studentsInClass.filter(s => !assignedIds.includes(s.id));
    }

    // Sort students by name alphabetically for fair grouping
    targetStudents.sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi'));

    let assignedCount = 0;
    targetStudents.forEach((student, index) => {
      const targetGroup = groupsOfClass[index % groupsOfClass.length];
      this.assignStudentToGroup(student.id, targetGroup.MaTo, '2026-09-07');
      assignedCount++;
    });

    return {
      assignedCount,
      groups: this.getEmulationGroups(classId)
    };
  }

  // --- KỲ THI ĐUA (TUẦN) ---
  public getEmulationPeriods(): EmulationPeriod[] {
    return [...this.state.emulationPeriods].sort((a, b) => a.TuanSo - b.TuanSo);
  }

  public getEmulationPeriodById(MaKy: string): EmulationPeriod | undefined {
    return this.state.emulationPeriods.find(p => p.MaKy === MaKy);
  }

  public createEmulationPeriod(data: { NamHoc?: string; TuanSo: number; TuNgay: string; DenNgay: string; DiemDauTuan?: number; GhiChu?: string; MaKy?: string; TrangThai?: any }): EmulationPeriod {
    const MaKy = data.MaKy || `2026-W${data.TuanSo.toString().padStart(2, '0')}`;
    const existing = this.state.emulationPeriods.find(p => p.MaKy === MaKy);
    if (existing) {
      return existing;
    }

    const newPeriod: EmulationPeriod = {
      MaKy,
      NamHoc: data.NamHoc || '2026 - 2027',
      TuanSo: Number(data.TuanSo),
      TuNgay: data.TuNgay,
      DenNgay: data.DenNgay,
      DiemDauTuan: data.DiemDauTuan !== undefined ? Number(data.DiemDauTuan) : 0,
      TrangThai: data.TrangThai || (new Date(data.DenNgay) < new Date('2026-10-05') ? 'DA_KHOA' : 'DANG_DIEN_RA'),
      GhiChu: data.GhiChu || `Tuần ${data.TuanSo}`,
      LichSuMoKhoa: []
    };

    this.state.emulationPeriods.push(newPeriod);
    this.saveData();
    return newPeriod;
  }

  public updateEmulationPeriod(MaKy: string, data: Partial<EmulationPeriod>): EmulationPeriod | undefined {
    const period = this.state.emulationPeriods.find(p => p.MaKy === MaKy);
    if (!period) return undefined;
    Object.assign(period, data);
    this.saveData();
    return period;
  }

  public deleteEmulationPeriod(MaKy: string): boolean {
    const index = this.state.emulationPeriods.findIndex(p => p.MaKy === MaKy);
    if (index === -1) return false;
    this.state.emulationPeriods.splice(index, 1);
    this.saveData();
    return true;
  }

  public resetEmulationPeriodsToAcademicYear(startDateStr: string = '2026-09-07', totalWeeks: number = 18): EmulationPeriod[] {
    const start = new Date(startDateStr);
    const newPeriods: EmulationPeriod[] = [];

    const weekThemes = [
      'Khai giảng & phát động thi đua năm học mới',
      'Ổn định nề nếp học tập và kỷ cương trường lớp',
      'Phát huy tinh thần tự quản và tinh thần đoàn kết',
      'Phát động thi đua cao điểm chào mừng tháng 10',
      'Trọng tâm học tốt, ôn tập giữa học kỳ 1 (Tuần hiện tại)',
      'Phong trào thi đua chào mừng Ngày Phụ nữ Việt Nam 20/10',
      'Nỗ lực đạt nhiều bông hoa điểm 10',
      'Phát động đợt thi đua chào mừng Ngày Nhà giáo Việt Nam 20/11',
      'Tiết học tốt, giờ học hay dâng tặng thầy cô',
      'Giữ vững nề nếp kỷ cương trường lớp',
      'Tuần lễ tri ân thầy cô giáo 20/11',
      'Đẩy mạnh phong trào tự học và đôi bạn cùng tiến',
      'Chuẩn bị kế hoạch ôn thi cuối học kỳ 1',
      'Ôn tập cao điểm học kỳ 1',
      'Thi học kỳ 1 nghiêm túc, đúng quy chế',
      'Tổng kết thi đua học kỳ 1',
      'Chuẩn bị sơ kết học kỳ 1',
      'Khởi động phong trào thi đua học kỳ 2'
    ];

    for (let i = 1; i <= totalWeeks; i++) {
      const weekMonday = new Date(start);
      weekMonday.setDate(start.getDate() + (i - 1) * 7);
      const weekSunday = new Date(weekMonday);
      weekSunday.setDate(weekMonday.getDate() + 6);

      const monStr = weekMonday.toISOString().split('T')[0];
      const sunStr = weekSunday.toISOString().split('T')[0];
      const code = `2026-W${i.toString().padStart(2, '0')}`;
      const isPast = sunStr < '2026-10-05';

      newPeriods.push({
        MaKy: code,
        NamHoc: '2026 - 2027',
        TuanSo: i,
        TuNgay: monStr,
        DenNgay: sunStr,
        DiemDauTuan: 0,
        TrangThai: isPast ? 'DA_KHOA' : 'DANG_DIEN_RA',
        ThoiGianKhoa: isPast ? `${sunStr}T18:00:00Z` : undefined,
        NguoiKhoa: isPast ? 'Ban Thi Đua' : undefined,
        GhiChu: `Tuần ${i}: ${weekThemes[i - 1] || 'Thi đua nề nếp và học tập'}`
      });
    }

    // Remap records that pointed to old demo codes W40 and W41
    this.state.emulationRecords.forEach(rec => {
      if (rec.MaKy === '2026-W40') rec.MaKy = '2026-W04';
      if (rec.MaKy === '2026-W41') rec.MaKy = '2026-W05';
      if (rec.MaKy === '2026-W42') rec.MaKy = '2026-W06';
    });

    this.state.weeklyStudentSummaries.forEach(s => {
      if (s.MaKy === '2026-W40') s.MaKy = '2026-W04';
      if (s.MaKy === '2026-W41') s.MaKy = '2026-W05';
    });

    this.state.weeklyGroupSummaries.forEach(g => {
      if (g.MaKy === '2026-W40') g.MaKy = '2026-W04';
      if (g.MaKy === '2026-W41') g.MaKy = '2026-W05';
    });

    this.state.emulationPeriods = newPeriods;
    this.saveData();
    return newPeriods;
  }

  // Tự động xác định MaKy từ ngày xảy ra theo múi giờ Việt Nam
  public determinePeriodFromDate(dateStr: string): EmulationPeriod {
    const found = this.state.emulationPeriods.find(p => dateStr >= p.TuNgay && dateStr <= p.DenNgay);
    if (found) return found;

    // Nếu chưa có, tính tuần số từ ngày 07/09/2026 (Tuần 1)
    const baseDate = new Date('2026-09-07');
    const d = new Date(dateStr);
    const day = d.getDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diffToMonday));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const monStr = monday.toISOString().split('T')[0];
    const sunStr = sunday.toISOString().split('T')[0];

    const diffDays = Math.floor((monday.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.max(1, Math.floor(diffDays / 7) + 1);

    return this.createEmulationPeriod({
      NamHoc: '2026 - 2027',
      TuanSo: weekNumber,
      TuNgay: monStr,
      DenNgay: sunStr,
      DiemDauTuan: 0,
      GhiChu: `Tuần ${weekNumber}`
    });
  }

  // --- GHI NHẬN SỰ VIỆC THI ĐUA (LỊCH SỬ THI ĐUA) ---
  public getEmulationRecords(filters?: { classId?: string; periodId?: string; studentId?: string; type?: string; date?: string; status?: string }): EmulationRecord[] {
    let result = [...this.state.emulationRecords];

    if (filters?.classId && filters.classId !== 'all') {
      result = result.filter(r => r.MaLop === filters.classId);
    }
    if (filters?.periodId && filters.periodId !== 'all') {
      result = result.filter(r => r.MaKy === filters.periodId);
    }
    if (filters?.studentId && filters.studentId !== 'all') {
      result = result.filter(r => r.MaHS === filters.studentId);
    }
    if (filters?.type && filters.type !== 'all') {
      result = result.filter(r => r.Loai === filters.type);
    }
    if (filters?.date) {
      result = result.filter(r => r.Ngay === filters.date);
    }
    if (filters?.status && filters.status !== 'all') {
      result = result.filter(r => r.TrangThai === filters.status);
    }

    // Sort newest first
    return result.sort((a, b) => b.ThoiGianTao.localeCompare(a.ThoiGianTao));
  }

  public createEmulationRecord(data: {
    Ngay: string;
    MaLop: string;
    MaHS: string;
    MaLoi: string;
    GhiChu?: string;
    NguoiGhiNhan: string;
    MaKy?: string;
  }): EmulationRecord {
    // 1. Kiểm tra học sinh và khớp lớp
    const student = this.state.students.find(s => s.id === data.MaHS);
    if (!student) {
      throw new Error('Học sinh không tồn tại trong hệ thống');
    }
    if (student.classId !== data.MaLop) {
      throw new Error(`Mã lớp (${data.MaLop}) không khớp với lớp hiện tại của học sinh (${student.classId})`);
    }

    // 2. Kiểm tra danh mục hợp lệ và đang hoạt động
    const category = this.state.emulationCategories.find(c => c.MaLoi === data.MaLoi);
    if (!category) {
      throw new Error('Danh mục thi đua không tồn tại');
    }
    if (category.TrangThai !== 'DANG_DUNG') {
      throw new Error('Danh mục thi đua này đang bị ẩn/ngưng sử dụng');
    }

    // 3. Tự động xác định MaKy từ ngày xảy ra
    const period = data.MaKy 
      ? (this.getEmulationPeriodById(data.MaKy) || this.determinePeriodFromDate(data.Ngay))
      : this.determinePeriodFromDate(data.Ngay);

    // Không cho phép ghi nhận vào kỳ đã khóa
    if (period.TrangThai === 'DA_KHOA') {
      throw new Error(`Tuần thi đua ${period.MaKy} đã bị khóa sổ. Vui lòng mở khóa trước nếu cần ghi nhận thêm.`);
    }

    // 4. Backend tự động xác định điểm theo danh mục hợp lệ (chống giả mạo điểm số từ client)
    const Loai: EmulationType = category.Loai;
    const Diem = Loai === 'CONG' ? Math.abs(category.Diem) : -Math.abs(category.Diem);

    // 5. Chống ghi nhận trùng do người dùng nhấn nút nhiều lần trong 3 giây
    const nowIso = new Date().toISOString();
    const threeSecondsAgo = new Date(Date.now() - 3000).toISOString();
    const recentDuplicate = this.state.emulationRecords.find(r => 
      r.MaHS === data.MaHS &&
      r.MaLoi === data.MaLoi &&
      r.Ngay === data.Ngay &&
      r.GhiChu === (data.GhiChu?.trim() || '') &&
      r.ThoiGianTao >= threeSecondsAgo
    );
    if (recentDuplicate) {
      return recentDuplicate;
    }

    // 6. Tìm tên tổ của học sinh
    const memberEntry = this.state.groupMembers.find(m => m.MaHS === data.MaHS);
    const group = memberEntry ? this.state.emulationGroups.find(g => g.MaTo === memberEntry.MaTo) : undefined;

    const MaGhiNhan = `REC-${Date.now().toString().slice(-7)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const newRecord: EmulationRecord = {
      MaGhiNhan,
      Ngay: data.Ngay,
      MaKy: period.MaKy,
      MaLop: data.MaLop,
      MaHS: data.MaHS,
      TenHS: student.fullName,
      TenTo: group?.TenTo || 'Chưa phân tổ',
      MaLoi: category.MaLoi,
      TenLoi: category.TenLoi,
      Loai,
      Diem,
      GhiChu: data.GhiChu?.trim() || '',
      NguoiGhiNhan: data.NguoiGhiNhan || 'Giáo viên',
      TrangThai: 'HIEU_LUC',
      ThoiGianTao: nowIso
    };

    this.state.emulationRecords.push(newRecord);
    this.saveData();
    return newRecord;
  }

  public updateEmulationRecord(
    MaGhiNhan: string, 
    data: { GhiChu?: string; TrangThai?: EmulationRecordStatus; NguoiSua: string; LyDoSuaHuy?: string }
  ): EmulationRecord | null {
    const idx = this.state.emulationRecords.findIndex(r => r.MaGhiNhan === MaGhiNhan);
    if (idx === -1) return null;

    const rec = this.state.emulationRecords[idx];
    const period = this.getEmulationPeriodById(rec.MaKy);
    if (period && period.TrangThai === 'DA_KHOA') {
      throw new Error(`Tuần thi đua ${rec.MaKy} đã bị khóa sổ. Không thể sửa hoặc hủy bản ghi.`);
    }

    if (data.TrangThai === 'DA_HUY' && !data.LyDoSuaHuy?.trim()) {
      throw new Error('Cần cung cấp lý do hủy bản ghi thi đua để lưu dấu vết kiểm toán.');
    }

    const updated: EmulationRecord = {
      ...rec,
      GhiChu: data.GhiChu !== undefined ? data.GhiChu.trim() : rec.GhiChu,
      TrangThai: data.TrangThai || rec.TrangThai,
      NguoiSua: data.NguoiSua || 'Giáo viên',
      LyDoSuaHuy: data.LyDoSuaHuy?.trim() || rec.LyDoSuaHuy
    };

    this.state.emulationRecords[idx] = updated;
    this.saveData();
    return updated;
  }

  // --- CÔNG THỨC VÀ TÍNH ĐIỂM HỌC SINH (THEO LỚP & TUẦN) ---
  public calculateStudentWeeklyScores(classId: string, periodId: string): WeeklyStudentSummary[] {
    const period = this.getEmulationPeriodById(periodId) || this.getEmulationPeriods()[0];
    if (!period) return [];

    // Nếu tuần đã khóa sổ, ưu tiên trả về snapshot đã lưu trong TongKetTuan
    const lockedSnapshots = this.state.weeklyStudentSummaries.filter(
      s => s.MaKy === period.MaKy && s.MaLop === classId && s.TrangThai === 'DA_KHOA'
    );
    if (period.TrangThai === 'DA_KHOA' && lockedSnapshots.length > 0) {
      return lockedSnapshots.sort((a, b) => a.XepHang - b.XepHang);
    }

    // Nếu tuần đang diễn ra hoặc chưa có snapshot: Tính toán trực tiếp (Idempotent)
    const studentsInClass = this.state.students.filter(s => s.classId === classId && s.status === 'active');
    const validRecords = this.state.emulationRecords.filter(r => 
      r.MaKy === period.MaKy && 
      r.MaLop === classId && 
      r.TrangThai === 'HIEU_LUC'
    );

    const diemDauTuan = period.DiemDauTuan || 0;

    // Tính điểm cho từng học sinh
    const list: (Omit<WeeklyStudentSummary, 'XepHang'> & { DiemCuoiTuan: number })[] = studentsInClass.map(s => {
      const studentRecords = validRecords.filter(r => r.MaHS === s.id);

      // Điểm cộng (dương) & Điểm trừ (âm)
      const positiveRecords = studentRecords.filter(r => r.Diem > 0);
      const negativeRecords = studentRecords.filter(r => r.Diem < 0);

      const TongDiemCong = positiveRecords.reduce((acc, r) => acc + r.Diem, 0);
      const TongDiemTru = negativeRecords.reduce((acc, r) => acc + r.Diem, 0); // là số âm
      const DiemCuoiTuan = diemDauTuan + TongDiemCong + TongDiemTru;

      // Số lượt thành tích và số lượt vi phạm tính theo số bản ghi hợp lệ
      const SoThanhTich = positiveRecords.length;
      const SoViPham = negativeRecords.length;

      // Tìm thông tin tổ (ưu tiên phân tổ có hiệu lực trong khoảng thời gian của kỳ)
      const memberEntry = this.state.groupMembers.find(m => 
        m.MaHS === s.id && 
        (!period || (m.TuNgay <= period.DenNgay && (!m.DenNgay || m.DenNgay >= period.TuNgay)))
      ) || this.state.groupMembers.find(m => m.MaHS === s.id);
      const group = memberEntry ? this.state.emulationGroups.find(g => g.MaTo === memberEntry.MaTo) : undefined;

      return {
        MaKy: period.MaKy,
        MaLop: classId,
        MaHS: s.id,
        TenHS: s.fullName,
        MaTo: group?.MaTo || 'CHUA_CO',
        TenTo: group?.TenTo || 'Chưa phân tổ',
        DiemDauTuan: diemDauTuan,
        TongDiemCong,
        TongDiemTru,
        DiemCuoiTuan,
        SoThanhTich,
        SoViPham,
        TrangThai: (period.TrangThai === 'DA_KHOA' ? 'DA_KHOA' : 'TAM_TINH') as EmulationSummaryStatus
      };
    });

    // Xếp hạng: Điểm cao hơn xếp trước, nếu bằng điểm thì đồng hạng
    list.sort((a, b) => b.DiemCuoiTuan - a.DiemCuoiTuan);

    let currentRank = 1;
    const rankedList: WeeklyStudentSummary[] = list.map((item, idx) => {
      if (idx > 0 && item.DiemCuoiTuan < list[idx - 1].DiemCuoiTuan) {
        currentRank = idx + 1;
      }
      return {
        ...item,
        XepHang: currentRank
      };
    });

    return rankedList;
  }

  // --- CÔNG THỨC VÀ XẾP HẠNG TỔ (THEO LỚP & TUẦN) ---
  public calculateGroupWeeklyScores(classId: string, periodId: string): WeeklyGroupSummary[] {
    const period = this.getEmulationPeriodById(periodId) || this.getEmulationPeriods()[0];
    if (!period) return [];

    // Nếu đã khóa sổ, ưu tiên snapshot trong TongKetTo
    const lockedSnapshots = this.state.weeklyGroupSummaries.filter(
      g => g.MaKy === period.MaKy && g.MaLop === classId && g.TrangThai === 'DA_KHOA'
    );
    if (period.TrangThai === 'DA_KHOA' && lockedSnapshots.length > 0) {
      return lockedSnapshots.sort((a, b) => a.XepHang - b.XepHang);
    }

    // Tính toán trực tiếp dựa trên điểm số các học sinh trong tuần
    const studentSummaries = this.calculateStudentWeeklyScores(classId, period.MaKy);
    const groupsOfClass = this.state.emulationGroups.filter(g => g.MaLop === classId);

    const groupSummaries: (Omit<WeeklyGroupSummary, 'XepHang'> & { DiemBinhQuan: number })[] = groupsOfClass.map(g => {
      const members = studentSummaries.filter(s => s.MaTo === g.MaTo);
      const SoThanhVien = members.length;

      if (SoThanhVien === 0) {
        return {
          MaKy: period.MaKy,
          MaLop: classId,
          MaTo: g.MaTo,
          TenTo: g.TenTo,
          SoThanhVien: 0,
          TongDiemCong: 0,
          TongDiemTru: 0,
          TongDiem: 0,
          DiemBinhQuan: 0,
          TrangThai: (period.TrangThai === 'DA_KHOA' ? 'DA_KHOA' : 'TAM_TINH') as EmulationSummaryStatus
        };
      }

      const TongDiemCong = members.reduce((acc, m) => acc + m.TongDiemCong, 0);
      const TongDiemTru = members.reduce((acc, m) => acc + m.TongDiemTru, 0);
      const rawTongDiem = members.reduce((acc, m) => acc + m.DiemCuoiTuan, 0);
      const TongDiem = rawTongDiem === 0 ? 0 : rawTongDiem;
      const rawBinhQuan = TongDiem === 0 ? 0 : Math.round((TongDiem / SoThanhVien) * 100) / 100;
      const DiemBinhQuan = rawBinhQuan === 0 ? 0 : rawBinhQuan;

      return {
        MaKy: period.MaKy,
        MaLop: classId,
        MaTo: g.MaTo,
        TenTo: g.TenTo,
        SoThanhVien,
        TongDiemCong,
        TongDiemTru,
        TongDiem,
        DiemBinhQuan,
        TrangThai: (period.TrangThai === 'DA_KHOA' ? 'DA_KHOA' : 'TAM_TINH') as EmulationSummaryStatus
      };
    });

    // Xếp hạng tổ: Theo DiemBinhQuan giảm dần, nếu bằng điểm thì đồng hạng
    groupSummaries.sort((a, b) => b.DiemBinhQuan - a.DiemBinhQuan);

    let currentRank = 1;
    const rankedGroups: WeeklyGroupSummary[] = groupSummaries.map((item, idx) => {
      if (idx > 0 && item.DiemBinhQuan < groupSummaries[idx - 1].DiemBinhQuan) {
        currentRank = idx + 1;
      }
      return {
        ...item,
        XepHang: currentRank
      };
    });

    return rankedGroups;
  }

  // --- TỔNG KẾT VÀ KHÓA SỔ TUẦN ---
  public lockWeeklyPeriod(periodId: string, classId: string, lockedBy: string): {
    success: boolean;
    period: EmulationPeriod;
    studentCount: number;
    groupCount: number;
  } {
    const period = this.getEmulationPeriodById(periodId);
    if (!period) throw new Error('Kỳ thi đua không tồn tại');

    // Tính toán snapshot kết quả học sinh và tổ
    const studentSummaries = this.calculateStudentWeeklyScores(classId, periodId).map(s => ({
      ...s,
      TrangThai: 'DA_KHOA' as const
    }));

    const groupSummaries = this.calculateGroupWeeklyScores(classId, periodId).map(g => ({
      ...g,
      TrangThai: 'DA_KHOA' as const
    }));

    // Idempotent snapshot update: Xóa snapshot cũ cùng MaKy và MaLop (nếu có) trước khi ghi mới
    this.state.weeklyStudentSummaries = this.state.weeklyStudentSummaries.filter(
      s => !(s.MaKy === periodId && s.MaLop === classId)
    );
    this.state.weeklyStudentSummaries.push(...studentSummaries);

    this.state.weeklyGroupSummaries = this.state.weeklyGroupSummaries.filter(
      g => !(g.MaKy === periodId && g.MaLop === classId)
    );
    this.state.weeklyGroupSummaries.push(...groupSummaries);

    // Cập nhật trạng thái kỳ
    period.TrangThai = 'DA_KHOA';
    period.ThoiGianKhoa = new Date().toISOString();
    period.NguoiKhoa = lockedBy || 'Ban Thi Đua';

    this.saveData();

    return {
      success: true,
      period,
      studentCount: studentSummaries.length,
      groupCount: groupSummaries.length
    };
  }

  public unlockWeeklyPeriod(periodId: string, classId: string, unlockedBy: string, reason: string): {
    success: boolean;
    period: EmulationPeriod;
  } {
    const period = this.getEmulationPeriodById(periodId);
    if (!period) throw new Error('Kỳ thi đua không tồn tại');
    if (!reason?.trim()) throw new Error('Bắt buộc phải nhập lý do mở khóa sổ tuần');

    if (!period.LichSuMoKhoa) period.LichSuMoKhoa = [];
    period.LichSuMoKhoa.push({
      NguoiMo: unlockedBy || 'Quản trị viên',
      ThoiGian: new Date().toISOString(),
      LyDo: reason.trim()
    });

    period.TrangThai = 'DANG_DIEN_RA';

    // Xóa snapshot khóa để cho phép tính toán động lại
    this.state.weeklyStudentSummaries = this.state.weeklyStudentSummaries.filter(
      s => !(s.MaKy === periodId && s.MaLop === classId)
    );
    this.state.weeklyGroupSummaries = this.state.weeklyGroupSummaries.filter(
      g => !(g.MaKy === periodId && g.MaLop === classId)
    );

    this.saveData();
    return { success: true, period };
  }

  // --- SỔ THEO DÕI TỪNG HỌC SINH ---
  public getStudentEmulationLog(studentId: string, classId?: string, periodId?: string) {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return null;

    let records = this.state.emulationRecords.filter(r => r.MaHS === studentId);
    if (periodId && periodId !== 'all') {
      records = records.filter(r => r.MaKy === periodId);
    }

    const memberEntry = this.state.groupMembers.find(m => m.MaHS === studentId);
    const group = memberEntry ? this.state.emulationGroups.find(g => g.MaTo === memberEntry.MaTo) : undefined;

    // Tổng hợp thành tích và vi phạm hợp lệ
    const valid = records.filter(r => r.TrangThai === 'HIEU_LUC');
    const totalPositive = valid.filter(r => r.Diem > 0).reduce((acc, r) => acc + r.Diem, 0);
    const totalNegative = valid.filter(r => r.Diem < 0).reduce((acc, r) => acc + r.Diem, 0);
    const meritCount = valid.filter(r => r.Diem > 0).length;
    const violationCount = valid.filter(r => r.Diem < 0).length;

    return {
      student,
      group: group?.TenTo || 'Chưa phân tổ',
      totalPositive,
      totalNegative,
      netScore: totalPositive + totalNegative,
      meritCount,
      violationCount,
      records: records.sort((a, b) => b.Ngay.localeCompare(a.Ngay))
    };
  }

  // --- BÁO CÁO THI ĐUA TỔNG HỢP ---
  public getEmulationReport(classId?: string, periodId?: string) {
    const targetPeriod = periodId && periodId !== 'all' 
      ? (this.getEmulationPeriodById(periodId) || this.getEmulationPeriods()[0])
      : this.getEmulationPeriods()[0];

    const targetClassId = classId && classId !== 'all' ? classId : (this.state.classes[0]?.id || 'cls-10a1');
    const targetClass = this.state.classes.find(c => c.id === targetClassId);

    const studentRankings = this.calculateStudentWeeklyScores(targetClassId, targetPeriod.MaKy);
    const groupRankings = this.calculateGroupWeeklyScores(targetClassId, targetPeriod.MaKy);

    const records = this.state.emulationRecords.filter(r => 
      r.MaKy === targetPeriod.MaKy && 
      r.MaLop === targetClassId &&
      r.TrangThai === 'HIEU_LUC'
    );

    // Thống kê theo danh mục vi phạm
    const categoryStats: { MaLoi: string; TenLoi: string; Loai: EmulationType; count: number; totalPoints: number }[] = [];
    this.state.emulationCategories.forEach(cat => {
      const match = records.filter(r => r.MaLoi === cat.MaLoi);
      if (match.length > 0) {
        categoryStats.push({
          MaLoi: cat.MaLoi,
          TenLoi: cat.TenLoi,
          Loai: cat.Loai,
          count: match.length,
          totalPoints: match.reduce((a, b) => a + b.Diem, 0)
        });
      }
    });

    const totalMerits = records.filter(r => r.Diem > 0).length;
    const totalViolations = records.filter(r => r.Diem < 0).length;

    return {
      period: targetPeriod,
      classInfo: targetClass,
      studentRankings,
      groupRankings,
      categoryStats,
      totalMerits,
      totalViolations,
      allPeriods: this.getEmulationPeriods()
    };
  }

  // --- BAN CÁN SỰ LỚP (CLASS OFFICERS) ---
  public getClassOfficers(classId: string): ClassOfficer[] {
    return this.state.classOfficers.filter(o => o.classId === classId);
  }

  public assignClassOfficer(data: {
    classId: string;
    studentId: string;
    role: OfficerRole;
    customRoleTitle?: string;
    duty?: string;
    contactPhone?: string;
  }): ClassOfficer {
    const student = this.state.students.find(s => s.id === data.studentId);
    if (!student) throw new Error('Học sinh không tồn tại');

    // Remove existing officer for single-occupancy roles
    const singleRoles: OfficerRole[] = ['LOP_TRUONG', 'LOP_PHO_HOC_TAP', 'LOP_PHO_KY_LUAT', 'LOP_PHO_LAO_DONG', 'LOP_PHO_PHONG_TRAO', 'THU_QUY'];
    if (singleRoles.includes(data.role)) {
      this.state.classOfficers = this.state.classOfficers.filter(
        o => !(o.classId === data.classId && o.role === data.role)
      );
    }

    const newOfficer: ClassOfficer = {
      id: `OFF-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      classId: data.classId,
      studentId: data.studentId,
      studentName: student.fullName,
      studentCode: student.studentCode,
      role: data.role,
      customRoleTitle: data.customRoleTitle,
      duty: data.duty || '',
      contactPhone: data.contactPhone || student.parentPhone || '',
      appointedDate: new Date().toISOString().split('T')[0]
    };

    this.state.classOfficers.push(newOfficer);
    this.saveData();
    return newOfficer;
  }

  public updateClassOfficer(id: string, data: Partial<ClassOfficer>): ClassOfficer | undefined {
    const officer = this.state.classOfficers.find(o => o.id === id);
    if (!officer) return undefined;
    Object.assign(officer, data);
    this.saveData();
    return officer;
  }

  public removeClassOfficer(id: string): boolean {
    const prevLen = this.state.classOfficers.length;
    this.state.classOfficers = this.state.classOfficers.filter(o => o.id !== id);
    if (this.state.classOfficers.length !== prevLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  // --- SƠ ĐỒ CHỖ NGỒI (SEATING CHART) ---
  public getSeatingChart(classId: string): SeatingChart {
    let chart = this.state.seatingCharts.find(c => c.classId === classId);
    if (!chart) {
      const cls = this.state.classes.find(c => c.id === classId);
      chart = {
        id: `SEAT-${classId}`,
        classId,
        title: `Sơ đồ chỗ ngồi Lớp ${cls?.name || classId}`,
        academicYear: cls?.academicYear || '2026 - 2027',
        term: 'HK1',
        rows: 5,
        columns: 4,
        seatsPerDesk: 2,
        seats: [],
        updatedAt: new Date().toISOString()
      };
      // Khởi tạo các ô ghế (5 hàng x 4 dãy x 2 bàn = 40 vị trí)
      for (let r = 1; r <= 5; r++) {
        for (let c = 1; c <= 4; c++) {
          for (let s = 1; s <= 2; s++) {
            chart.seats.push({
              seatId: `R${r}-C${c}-S${s}`,
              row: r,
              column: c,
              seatIndex: s
            });
          }
        }
      }
      this.state.seatingCharts.push(chart);
      this.saveData();
    } else if (!chart.seats || chart.seats.length === 0) {
      chart.seats = [];
      const rows = chart.rows || 5;
      const cols = chart.columns || 4;
      const spd = chart.seatsPerDesk || 2;
      for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= cols; c++) {
          for (let s = 1; s <= spd; s++) {
            chart.seats.push({
              seatId: `R${r}-C${c}-S${s}`,
              row: r,
              column: c,
              seatIndex: s
            });
          }
        }
      }
      this.saveData();
    }
    return chart;
  }

  public saveSeatingChart(data: SeatingChart): SeatingChart {
    const idx = this.state.seatingCharts.findIndex(c => c.classId === data.classId);
    data.updatedAt = new Date().toISOString();
    if (idx !== -1) {
      this.state.seatingCharts[idx] = data;
    } else {
      this.state.seatingCharts.push(data);
    }
    this.saveData();
    return data;
  }

  public updateSeatAssignment(classId: string, seatId: string, studentId?: string, note?: string): SeatingChart {
    const chart = this.getSeatingChart(classId);
    
    // Nếu gán học sinh vào ghế mới, hủy vị trí cũ của học sinh đó
    if (studentId) {
      chart.seats.forEach(s => {
        if (s.studentId === studentId) {
          s.studentId = undefined;
          s.studentName = undefined;
          s.studentCode = undefined;
        }
      });
    }

    const seat = chart.seats.find(s => s.seatId === seatId);
    if (seat) {
      if (studentId) {
        const student = this.state.students.find(st => st.id === studentId);
        seat.studentId = studentId;
        seat.studentName = student?.fullName || '';
        seat.studentCode = student?.studentCode || '';
      } else {
        seat.studentId = undefined;
        seat.studentName = undefined;
        seat.studentCode = undefined;
      }
      if (note !== undefined) seat.note = note;
    }

    chart.updatedAt = new Date().toISOString();
    this.saveData();
    return chart;
  }

  public swapSeats(classId: string, seatIdA: string, seatIdB: string): SeatingChart {
    const chart = this.getSeatingChart(classId);
    const seatA = chart.seats.find(s => s.seatId === seatIdA);
    const seatB = chart.seats.find(s => s.seatId === seatIdB);
    if (!seatA || !seatB) throw new Error('Không tìm thấy vị trí ghế');

    const tempStudentId = seatA.studentId;
    const tempStudentName = seatA.studentName;
    const tempStudentCode = seatA.studentCode;
    const tempNote = seatA.note;

    seatA.studentId = seatB.studentId;
    seatA.studentName = seatB.studentName;
    seatA.studentCode = seatB.studentCode;
    seatA.note = seatB.note;

    seatB.studentId = tempStudentId;
    seatB.studentName = tempStudentName;
    seatB.studentCode = tempStudentCode;
    seatB.note = tempNote;

    chart.updatedAt = new Date().toISOString();
    this.saveData();
    return chart;
  }

  public autoArrangeSeats(classId: string, mode: 'byGroup' | 'alternatingGender' | 'alphabetical' | 'clear'): SeatingChart {
    const chart = this.getSeatingChart(classId);
    
    // Reset all seats
    chart.seats.forEach(s => {
      s.studentId = undefined;
      s.studentName = undefined;
      s.studentCode = undefined;
    });

    if (mode === 'clear') {
      chart.updatedAt = new Date().toISOString();
      this.saveData();
      return chart;
    }

    const students = this.state.students.filter(s => s.classId === classId && s.status === 'active');
    
    if (mode === 'alphabetical') {
      students.sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi'));
      students.forEach((stu, idx) => {
        if (idx < chart.seats.length) {
          chart.seats[idx].studentId = stu.id;
          chart.seats[idx].studentName = stu.fullName;
          chart.seats[idx].studentCode = stu.studentCode;
        }
      });
    } else if (mode === 'alternatingGender') {
      const males = students.filter(s => s.gender === 'male');
      const females = students.filter(s => s.gender === 'female');
      const combined: Student[] = [];
      const maxLen = Math.max(males.length, females.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < males.length) combined.push(males[i]);
        if (i < females.length) combined.push(females[i]);
      }
      combined.forEach((stu, idx) => {
        if (idx < chart.seats.length) {
          chart.seats[idx].studentId = stu.id;
          chart.seats[idx].studentName = stu.fullName;
          chart.seats[idx].studentCode = stu.studentCode;
        }
      });
    } else if (mode === 'byGroup') {
      const groups = this.state.emulationGroups.filter(g => g.MaLop === classId);
      const groupMembers = this.state.groupMembers;
      const sortedByGroup: Student[] = [];
      
      groups.forEach(g => {
        const studentIdsInG = groupMembers.filter(m => m.MaTo === g.MaTo).map(m => m.MaHS);
        const stisInG = students.filter(s => studentIdsInG.includes(s.id));
        stisInG.sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi'));
        sortedByGroup.push(...stisInG);
      });

      const unassigned = students.filter(s => !sortedByGroup.some(sg => sg.id === s.id));
      sortedByGroup.push(...unassigned);

      sortedByGroup.forEach((stu, idx) => {
        if (idx < chart.seats.length) {
          chart.seats[idx].studentId = stu.id;
          chart.seats[idx].studentName = stu.fullName;
          chart.seats[idx].studentCode = stu.studentCode;
        }
      });
    }

    chart.updatedAt = new Date().toISOString();
    this.saveData();
    return chart;
  }

  // --- RESET & BACKUP ---
  public resetToInitialData(): DatabaseState {
    this.state = {
      classes: JSON.parse(JSON.stringify(initialClasses)),
      students: JSON.parse(JSON.stringify(initialStudents)),
      attendance: JSON.parse(JSON.stringify(initialAttendance)),
      grades: JSON.parse(JSON.stringify(initialGrades)),
      documents: JSON.parse(JSON.stringify(initialDocuments)),
      settings: JSON.parse(JSON.stringify(initialSettings)),
      emulationCategories: JSON.parse(JSON.stringify(initialEmulationCategories)),
      emulationGroups: JSON.parse(JSON.stringify(initialEmulationGroups)),
      groupMembers: JSON.parse(JSON.stringify(initialGroupMembers)),
      emulationPeriods: JSON.parse(JSON.stringify(initialEmulationPeriods)),
      emulationRecords: JSON.parse(JSON.stringify(initialEmulationRecords)),
      weeklyStudentSummaries: JSON.parse(JSON.stringify(initialWeeklyStudentSummaries)),
      weeklyGroupSummaries: JSON.parse(JSON.stringify(initialWeeklyGroupSummaries)),
      classOfficers: JSON.parse(JSON.stringify(initialClassOfficers)),
      seatingCharts: JSON.parse(JSON.stringify(initialSeatingCharts)),
      lastUpdated: new Date().toISOString()
    };
    // Ensure seating charts have valid seats grid
    this.state.seatingCharts.forEach(c => {
      if (!c.seats || c.seats.length === 0) {
        this.autoArrangeSeats(c.classId, 'byGroup');
      }
    });
    this.saveData();
    return this.state;
  }
}

export const classroomStore = new ClassroomStore();
