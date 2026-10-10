/**
 * KỊCH BẢN KIỂM THỬ ĐỘC LẬP PHÂN HỆ THI ĐUA VÀ VI PHẠM
 * Sử dụng bộ nhớ ảo ':memory:', hoàn toàn không can thiệp hay sửa đổi cơ sở dữ liệu thật.
 */

import { ClassroomStore } from './data/store.ts';
import { Classroom, Student, EmulationCategory } from '../src/types/index.ts';

interface TestResult {
  testNumber: number;
  description: string;
  expected: any;
  actual: any;
  passed: boolean;
  notes?: string;
}

export function runEmulationTestSuite(): { allPassed: boolean; results: TestResult[] } {
  const results: TestResult[] = [];

  // Khởi tạo kho dữ liệu ảo độc lập ':memory:'
  const store = new ClassroomStore(':memory:');

  // 1. Tạo lớp học thử nghiệm độc lập
  const testClass: Classroom = {
    id: 'cls-test-emulation',
    name: '10-Test',
    grade: 10,
    academicYear: '2025 - 2026',
    homeroomTeacher: 'Giáo viên Kiểm Thử',
    room: 'P.Lab-01',
    maxStudents: 40,
    createdAt: new Date().toISOString()
  };

  // 2. Tạo 4 học sinh thử nghiệm A, B, C, D
  const studentA: Student = {
    id: 'hs-a',
    studentCode: 'HS-TEST-A',
    fullName: 'Học sinh A',
    classId: testClass.id,
    className: testClass.name,
    gender: 'male',
    birthDate: '2010-01-01',
    parentName: 'Phụ huynh A',
    parentPhone: '0900000001',
    address: 'Hà Nội',
    status: 'active',
    createdAt: new Date().toISOString()
  };

  const studentB: Student = {
    id: 'hs-b',
    studentCode: 'HS-TEST-B',
    fullName: 'Học sinh B',
    classId: testClass.id,
    className: testClass.name,
    gender: 'female',
    birthDate: '2010-02-02',
    parentName: 'Phụ huynh B',
    parentPhone: '0900000002',
    address: 'Hà Nội',
    status: 'active',
    createdAt: new Date().toISOString()
  };

  const studentC: Student = {
    id: 'hs-c',
    studentCode: 'HS-TEST-C',
    fullName: 'Học sinh C',
    classId: testClass.id,
    className: testClass.name,
    gender: 'male',
    birthDate: '2010-03-03',
    parentName: 'Phụ huynh C',
    parentPhone: '0900000003',
    address: 'Hà Nội',
    status: 'active',
    createdAt: new Date().toISOString()
  };

  const studentD: Student = {
    id: 'hs-d',
    studentCode: 'HS-TEST-D',
    fullName: 'Học sinh D',
    classId: testClass.id,
    className: testClass.name,
    gender: 'female',
    birthDate: '2010-04-04',
    parentName: 'Phụ huynh D',
    parentPhone: '0900000004',
    address: 'Hà Nội',
    status: 'active',
    createdAt: new Date().toISOString()
  };

  // 3. Đăng ký danh mục điểm thi đua
  const catPlus3: EmulationCategory = {
    MaLoi: 'CAT-CONG-3',
    TenLoi: 'Thành tích xuất sắc +3',
    Loai: 'CONG',
    Diem: 3,
    MoTa: 'Cộng 3 điểm',
    TrangThai: 'DANG_DUNG'
  };

  const catPlus2: EmulationCategory = {
    MaLoi: 'CAT-CONG-2',
    TenLoi: 'Phát biểu xây dựng bài +2',
    Loai: 'CONG',
    Diem: 2,
    MoTa: 'Cộng 2 điểm',
    TrangThai: 'DANG_DUNG'
  };

  const catMinus2: EmulationCategory = {
    MaLoi: 'CAT-TRU-2',
    TenLoi: 'Đi học muộn -2',
    Loai: 'TRU',
    Diem: 2,
    MoTa: 'Trừ 2 điểm',
    TrangThai: 'DANG_DUNG'
  };

  const catMinus3: EmulationCategory = {
    MaLoi: 'CAT-TRU-3',
    TenLoi: 'Không làm bài tập -3',
    Loai: 'TRU',
    Diem: 3,
    MoTa: 'Trừ 3 điểm',
    TrangThai: 'DANG_DUNG'
  };

  // Nạp dữ liệu cấu hình vào store ảo
  store.setState({
    classes: [testClass],
    students: [studentA, studentB, studentC, studentD],
    emulationCategories: [catPlus3, catPlus2, catMinus2, catMinus3],
    emulationGroups: [],
    groupMembers: [],
    emulationPeriods: [],
    emulationRecords: [],
    weeklyStudentSummaries: [],
    weeklyGroupSummaries: []
  });

  // 4. Tạo Tổ 1 và gán cả 4 học sinh vào Tổ 1 từ tuần 1 (2026-10-05)
  const group1 = store.createEmulationGroup({ MaLop: testClass.id, TenTo: 'Tổ 1' });
  store.assignStudentToGroup(studentA.id, group1.MaTo, '2026-10-05');
  store.assignStudentToGroup(studentB.id, group1.MaTo, '2026-10-05');
  store.assignStudentToGroup(studentC.id, group1.MaTo, '2026-10-05');
  store.assignStudentToGroup(studentD.id, group1.MaTo, '2026-10-05');

  // 5. Tạo Kỳ thi đua Tuần 1: 2026-W41 với DiemDauTuan = 0
  const period1 = store.createEmulationPeriod({
    MaKy: '2026-W41',
    NamHoc: '2025 - 2026',
    TuanSo: 41,
    TuNgay: '2026-10-05',
    DenNgay: '2026-10-11',
    DiemDauTuan: 0,
    GhiChu: 'Tuần thử nghiệm 41'
  });

  // 6. Ghi nhận các sự việc thi đua cho Tuần 1:
  // - Học sinh A: +3, +2, -2
  store.createEmulationRecord({
    Ngay: '2026-10-05',
    MaLop: testClass.id,
    MaHS: studentA.id,
    MaLoi: catPlus3.MaLoi,
    NguoiGhiNhan: 'Giám thị',
    MaKy: period1.MaKy
  });
  store.createEmulationRecord({
    Ngay: '2026-10-06',
    MaLop: testClass.id,
    MaHS: studentA.id,
    MaLoi: catPlus2.MaLoi,
    NguoiGhiNhan: 'Giám thị',
    MaKy: period1.MaKy
  });
  store.createEmulationRecord({
    Ngay: '2026-10-07',
    MaLop: testClass.id,
    MaHS: studentA.id,
    MaLoi: catMinus2.MaLoi,
    NguoiGhiNhan: 'Giám thị',
    MaKy: period1.MaKy
  });

  // - Học sinh B: +2, -2
  store.createEmulationRecord({
    Ngay: '2026-10-06',
    MaLop: testClass.id,
    MaHS: studentB.id,
    MaLoi: catPlus2.MaLoi,
    NguoiGhiNhan: 'Giám thị',
    MaKy: period1.MaKy
  });
  store.createEmulationRecord({
    Ngay: '2026-10-07',
    MaLop: testClass.id,
    MaHS: studentB.id,
    MaLoi: catMinus2.MaLoi,
    NguoiGhiNhan: 'Giám thị',
    MaKy: period1.MaKy
  });

  // - Học sinh C: không có ghi nhận nào

  // - Học sinh D: -3
  store.createEmulationRecord({
    Ngay: '2026-10-08',
    MaLop: testClass.id,
    MaHS: studentD.id,
    MaLoi: catMinus3.MaLoi,
    NguoiGhiNhan: 'Giám thị',
    MaKy: period1.MaKy
  });

  // - Một ghi nhận -3 cho Học sinh A nhưng đã BỊ HỦY
  const cancelledRecord = store.createEmulationRecord({
    Ngay: '2026-10-09',
    MaLop: testClass.id,
    MaHS: studentA.id,
    MaLoi: catMinus3.MaLoi,
    NguoiGhiNhan: 'Giám thị',
    MaKy: period1.MaKy
  });
  store.updateEmulationRecord(cancelledRecord.MaGhiNhan, {
    TrangThai: 'DA_HUY',
    NguoiSua: 'Ban Thi Đua',
    LyDoSuaHuy: 'Ghi nhầm tên học sinh, đã xác minh lại camera'
  });

  // --- THỰC HIỆN KIỂM THỬ TỪNG MỤC ---

  // Tính điểm học sinh Tuần 1
  const studentScoresW1 = store.calculateStudentWeeklyScores(testClass.id, period1.MaKy);
  const scoreA = studentScoresW1.find(s => s.MaHS === studentA.id);
  const scoreB = studentScoresW1.find(s => s.MaHS === studentB.id);
  const scoreC = studentScoresW1.find(s => s.MaHS === studentC.id);
  const scoreD = studentScoresW1.find(s => s.MaHS === studentD.id);

  // Test 1: Học sinh A (Điểm đầu tuần 0, +3, +2, -2 => 3)
  results.push({
    testNumber: 1,
    description: 'Học sinh A: điểm đầu tuần 0, có điểm +3, +2 và -2. Kết quả phải là 3.',
    expected: 3,
    actual: scoreA?.DiemCuoiTuan,
    passed: scoreA?.DiemCuoiTuan === 3,
    notes: `Tổng cộng: +${scoreA?.TongDiemCong}, Tổng trừ: ${scoreA?.TongDiemTru}, Điểm cuối: ${scoreA?.DiemCuoiTuan}`
  });

  // Test 2: Học sinh B (Điểm đầu tuần 0, +2, -2 => 0)
  results.push({
    testNumber: 2,
    description: 'Học sinh B: điểm đầu tuần 0, có điểm +2 và -2. Kết quả phải là 0.',
    expected: 0,
    actual: scoreB?.DiemCuoiTuan,
    passed: scoreB?.DiemCuoiTuan === 0,
    notes: `Tổng cộng: +${scoreB?.TongDiemCong}, Tổng trừ: ${scoreB?.TongDiemTru}, Điểm cuối: ${scoreB?.DiemCuoiTuan}`
  });

  // Test 3: Học sinh C (Không có ghi nhận => 0)
  results.push({
    testNumber: 3,
    description: 'Học sinh C: không có ghi nhận. Kết quả phải là 0.',
    expected: 0,
    actual: scoreC?.DiemCuoiTuan,
    passed: scoreC?.DiemCuoiTuan === 0,
    notes: `Số thành tích: ${scoreC?.SoThanhTich}, Số vi phạm: ${scoreC?.SoViPham}, Điểm cuối: ${scoreC?.DiemCuoiTuan}`
  });

  // Test 4: Ghi nhận -3 bị hủy không được tính vào tổng điểm
  // Nếu bị tính, điểm của HS A sẽ là 3 + (-3) = 0. Vì điểm là 3 nên đã loại bỏ thành công.
  const allRecordsA = store.getEmulationRecords({ studentId: studentA.id });
  const cancelledInLog = allRecordsA.find(r => r.MaGhiNhan === cancelledRecord.MaGhiNhan);
  const isExcluded = scoreA?.DiemCuoiTuan === 3 && cancelledInLog?.TrangThai === 'DA_HUY';
  results.push({
    testNumber: 4,
    description: 'Một ghi nhận -3 đã bị hủy. Ghi nhận này không được tính vào tổng điểm.',
    expected: 'Không tính vào tổng điểm (Điểm HS A vẫn giữ nguyên 3, bản ghi có trạng thái DA_HUY)',
    actual: `Điểm HS A = ${scoreA?.DiemCuoiTuan}, Trạng thái bản ghi = ${cancelledInLog?.TrangThai}`,
    passed: isExcluded,
    notes: 'Bản ghi bị hủy được lưu vết kiểm toán nhưng bỏ qua trong công thức tính toán điểm.'
  });

  // Test 5: Hai học sinh có cùng điểm cuối tuần phải được đồng hạng
  // HS B = 0, HS C = 0. Kiểm tra thứ hạng XepHang
  const sameRank = scoreB?.XepHang !== undefined && scoreB?.XepHang === scoreC?.XepHang;
  results.push({
    testNumber: 5,
    description: 'Hai học sinh có cùng điểm cuối tuần phải được đồng hạng.',
    expected: `Đồng hạng (Hạng HS B = Hạng HS C)`,
    actual: `Hạng HS B: ${scoreB?.XepHang}, Hạng HS C: ${scoreC?.XepHang}`,
    passed: sameRank,
    notes: `Cả hai học sinh B và C có cùng điểm 0 và cùng được xếp hạng ${scoreB?.XepHang}.`
  });

  // Test 6: Tổ có 4 thành viên (3, 0, 0, -3) có Tổng điểm = 0 và Điểm bình quân = 0
  const groupScoresW1 = store.calculateGroupWeeklyScores(testClass.id, period1.MaKy);
  const group1Score = groupScoresW1.find(g => g.MaTo === group1.MaTo);
  const groupExpected = group1Score?.TongDiem === 0 && group1Score?.DiemBinhQuan === 0 && group1Score?.SoThanhVien === 4;
  results.push({
    testNumber: 6,
    description: 'Tổ có 4 thành viên với điểm cuối tuần lần lượt là 3, 0, 0, -3 phải có tổng điểm 0 và điểm bình quân 0.',
    expected: 'SoThanhVien: 4, TongDiem: 0, DiemBinhQuan: 0',
    actual: `SoThanhVien: ${group1Score?.SoThanhVien}, TongDiem: ${group1Score?.TongDiem}, DiemBinhQuan: ${group1Score?.DiemBinhQuan}`,
    passed: groupExpected,
    notes: `Điểm các thành viên: A=3, B=0, C=0, D=-3 => Tổng = 3+0+0+(-3) = 0, Bình quân = 0/4 = 0.`
  });

  // Test 7: Khóa sổ / tổng kết cùng một kỳ hai lần không nhân đôi dữ liệu
  store.lockWeeklyPeriod(period1.MaKy, testClass.id, 'Kiểm Thử Viên');
  const countStudentsFirstLock = store.getState().weeklyStudentSummaries.filter(
    s => s.MaKy === period1.MaKy && s.MaLop === testClass.id
  ).length;
  const countGroupsFirstLock = store.getState().weeklyGroupSummaries.filter(
    g => g.MaKy === period1.MaKy && g.MaLop === testClass.id
  ).length;

  // Gọi khóa sổ lần 2
  store.lockWeeklyPeriod(period1.MaKy, testClass.id, 'Kiểm Thử Viên Lần 2');
  const countStudentsSecondLock = store.getState().weeklyStudentSummaries.filter(
    s => s.MaKy === period1.MaKy && s.MaLop === testClass.id
  ).length;
  const countGroupsSecondLock = store.getState().weeklyGroupSummaries.filter(
    g => g.MaKy === period1.MaKy && g.MaLop === testClass.id
  ).length;

  const noDuplication = (countStudentsFirstLock === 4 && countStudentsSecondLock === 4) &&
                        (countGroupsFirstLock === 1 && countGroupsSecondLock === 1);
  results.push({
    testNumber: 7,
    description: 'Khi tổng kết cùng một kỳ hai lần, không được nhân đôi dữ liệu hoặc tạo thêm kết quả trùng.',
    expected: 'Số bản ghi không đổi (Học sinh: 4, Tổ: 1)',
    actual: `Lần 1: HS=${countStudentsFirstLock}, Tổ=${countGroupsFirstLock} | Lần 2: HS=${countStudentsSecondLock}, Tổ=${countGroupsSecondLock}`,
    passed: noDuplication,
    notes: 'Thực hiện cơ chế Idempotent snapshot: xóa bản ghi cũ trước khi cập nhật bản ghi mới.'
  });

  // Test 8: Khóa kỳ cũ và tạo kỳ mới với điểm đầu tuần bằng 0.
  // Ghi nhận cũ vẫn tồn tại nhưng không được cộng vào tuần mới.
  const period2 = store.createEmulationPeriod({
    MaKy: '2026-W42',
    NamHoc: '2025 - 2026',
    TuanSo: 42,
    TuNgay: '2026-10-12',
    DenNgay: '2026-10-18',
    DiemDauTuan: 0,
    GhiChu: 'Tuần thử nghiệm 42'
  });

  const studentScoresW2 = store.calculateStudentWeeklyScores(testClass.id, period2.MaKy);
  const scoreA_W2 = studentScoresW2.find(s => s.MaHS === studentA.id);
  const scoreD_W2 = studentScoresW2.find(s => s.MaHS === studentD.id);

  // Số lượng bản ghi cũ trong toàn hệ thống: 7 bản ghi (6 hợp lệ + 1 hủy)
  const countW1 = store.getEmulationRecords({ periodId: period1.MaKy }).length;
  const oldRecordsExist = countW1 === 7;
  const newPeriodIsolated = scoreA_W2?.DiemCuoiTuan === 0 && 
                            scoreA_W2?.TongDiemCong === 0 && 
                            scoreA_W2?.TongDiemTru === 0 &&
                            scoreD_W2?.DiemCuoiTuan === 0;

  results.push({
    testNumber: 8,
    description: 'Sau khi khóa kỳ cũ và tạo kỳ mới với điểm đầu tuần bằng 0, các ghi nhận cũ vẫn phải tồn tại nhưng không được cộng vào điểm tuần mới.',
    expected: 'Bản ghi cũ còn nguyên (7 bản ghi tuần 1: 6 hợp lệ + 1 hủy), điểm tuần mới bắt đầu từ 0 (HS A tuần 2 = 0, HS D tuần 2 = 0)',
    actual: `Số bản ghi tuần 1: ${countW1}, Điểm HS A tuần 2: ${scoreA_W2?.DiemCuoiTuan}, Điểm HS D tuần 2: ${scoreD_W2?.DiemCuoiTuan}`,
    passed: oldRecordsExist && newPeriodIsolated,
    notes: 'Dữ liệu giữa các tuần được phân tách tuyệt đối theo mã kỳ thi đua MaKy.'
  });

  // Test 9: Chuyển học sinh sang tổ khác ở tuần tiếp theo, tổng kết tuần trước vẫn giữ nguyên tổ cũ.
  // Tạo Tổ 2 cho tuần mới
  const group2 = store.createEmulationGroup({ MaLop: testClass.id, TenTo: 'Tổ 2' });
  // Chuyển Học sinh A sang Tổ 2 từ ngày 2026-10-12 (Tuần 2)
  store.assignStudentToGroup(studentA.id, group2.MaTo, '2026-10-12');

  // Kiểm tra snapshot tuần trước (Tuần 1 đã khóa sổ)
  const lockedW1Students = store.calculateStudentWeeklyScores(testClass.id, period1.MaKy);
  const lockedA_W1 = lockedW1Students.find(s => s.MaHS === studentA.id);
  const lockedGroup1_W1 = store.calculateGroupWeeklyScores(testClass.id, period1.MaKy).find(g => g.MaTo === group1.MaTo);

  // Kiểm tra tuần 2 (học sinh A đã ở Tổ 2)
  const currentW2Students = store.calculateStudentWeeklyScores(testClass.id, period2.MaKy);
  const currentA_W2 = currentW2Students.find(s => s.MaHS === studentA.id);

  const retainedOldGroupInW1 = lockedA_W1?.MaTo === group1.MaTo && lockedGroup1_W1?.SoThanhVien === 4;
  const movedToNewGroupInW2 = currentA_W2?.MaTo === group2.MaTo;

  results.push({
    testNumber: 9,
    description: 'Khi chuyển một học sinh sang tổ khác ở tuần tiếp theo, tổng kết tuần trước vẫn phải giữ nguyên tổ cũ.',
    expected: 'Tuần 1 đã khóa: HS A thuộc Tổ 1 (Tổ 1 đủ 4 thành viên); Tuần 2: HS A thuộc Tổ 2',
    actual: `Tuần 1: HS A thuộc ${lockedA_W1?.TenTo} (Mã: ${lockedA_W1?.MaTo}, Số TV Tổ 1: ${lockedGroup1_W1?.SoThanhVien}) | Tuần 2: HS A thuộc ${currentA_W2?.TenTo} (Mã: ${currentA_W2?.MaTo})`,
    passed: retainedOldGroupInW1 && movedToNewGroupInW2,
    notes: 'Bảo toàn snapshot lịch sử tuần cũ thông qua TongKetTuan/TongKetTo kết hợp theo dõi phân tổ theo ngày TuNgay/DenNgay.'
  });

  const allPassed = results.every(r => r.passed);
  return { allPassed, results };
}

// Chạy trực tiếp nếu file được thực thi bằng tsx
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('test_emulation_suite')) {
  console.log('================================================================');
  console.log('   BẮT ĐẦU CHẠY KIỂM THỬ ĐỘC LẬP PHÂN HỆ THI ĐUA TUẦN');
  console.log('================================================================\n');

  const { allPassed, results } = runEmulationTestSuite();

  results.forEach(r => {
    const symbol = r.passed ? '✅ [ĐẠT]' : '❌ [THẤT BẠI]';
    console.log(`${symbol} Test Case ${r.testNumber}: ${r.description}`);
    console.log(`   - Mong đợi : ${r.expected}`);
    console.log(`   - Thực tế  : ${r.actual}`);
    if (r.notes) console.log(`   - Ghi chú  : ${r.notes}`);
    console.log('');
  });

  console.log('================================================================');
  if (allPassed) {
    console.log('🎉 TẤT CẢ 9/9 TEST CASES ĐÃ ĐẠT YÊU CẦU 100%!');
  } else {
    console.log('⚠️ CÓ TEST CASE CHƯA ĐẠT, CẦN KIỂM TRA LẠI.');
  }
  console.log('================================================================');
}
