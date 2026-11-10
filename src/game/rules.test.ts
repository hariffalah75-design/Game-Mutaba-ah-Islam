import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_STUDENTS,
  INITIAL_DAILY_TASKS,
  INITIAL_QUIZ_QUESTIONS,
  authenticateStudent,
  verifyQuranHafalanPasscode,
  verifyPrayerRecordingPasscode,
  createQuizQuestion,
  answerQuizQuestion,
  deleteStudentAccount,
  computeBaseExpression,
  cleanBedroomItem,
} from './rules';
import {
  TEN_HAFALAN_SURAHS,
  calculateSingleFarduPoints,
  calculateWeeklyWorshipSummary,
  updateFarduPrayerChoice,
  createBlankFarduRecords,
  createBlankSunnahRecords,
  submitHafalanSetoran,
  validateHafalanByTeacher,
  calculateTotalHafalanPoints,
  recordQuranSessionLog,
  submitWeeklyQuizBatch,
  archiveAndResetWeeklyChallenge,
  createInitialStudentMutabaahData,
  getDailyPrayerWindowStatus,
} from './mutabaahChallenges';

test('Student and Admin Master accounts authenticate properly', () => {
  const resPutri = authenticateStudent(INITIAL_STUDENTS, 'putri@murid.id', 'siswi123');
  assert.equal(resPutri.ok, true);
  if (resPutri.ok && resPutri.role === 'student') {
    assert.equal(resPutri.student.email, 'putri@murid.id');
  }

  // Official Admin Master login: hariffalah75@mutabaah.id / Ferarizky123#
  const resAdminOfficial = authenticateStudent(
    INITIAL_STUDENTS,
    'hariffalah75@mutabaah.id',
    'Ferarizky123#'
  );
  assert.equal(resAdminOfficial.ok, true);
  if (resAdminOfficial.ok) {
    assert.equal(resAdminOfficial.role, 'admin');
  }

  // Email alias hariffalah75@gmail.com
  const resAdminAlias = authenticateStudent(
    INITIAL_STUDENTS,
    'hariffalah75@gmail.com',
    'Ferarizky123#'
  );
  assert.equal(resAdminAlias.ok, true);
  if (resAdminAlias.ok) {
    assert.equal(resAdminAlias.role, 'admin');
  }

  // Wrong password rejected
  const resAdminWrong = authenticateStudent(
    INITIAL_STUDENTS,
    'hariffalah75@mutabaah.id',
    'wrongpassword'
  );
  assert.equal(resAdminWrong.ok, false);
});

test('Daily prayer window 05:00 - 07:00 WIB calculation behaves correctly', () => {
  // Test Monday at 06:15 WIB (UTC 23:15 on Sunday or 06:15 WIB)
  // Construct a known Monday 06:15 WIB date
  // 2026-11-09 is a Monday. 06:15 WIB = 2026-11-08 23:15:00 UTC
  const mondayMorningWibMs = Date.UTC(2026, 10, 8, 23, 15, 0); // 06:15 WIB on Monday Nov 9
  const statusOpen = getDailyPrayerWindowStatus('senin', mondayMorningWibMs);
  assert.equal(statusOpen.currentWibDay, 'senin');
  assert.equal(statusOpen.wibHour, 6);
  assert.equal(statusOpen.isOpenAutoWindow, true);

  // Test Monday at 08:30 WIB (UTC 01:30 on Monday) -> Closed, requires teacher PIN
  const mondayLateWibMs = Date.UTC(2026, 10, 9, 1, 30, 0); // 08:30 WIB on Monday Nov 9
  const statusClosed = getDailyPrayerWindowStatus('senin', mondayLateWibMs);
  assert.equal(statusClosed.currentWibDay, 'senin');
  assert.equal(statusClosed.wibHour, 8);
  assert.equal(statusClosed.isOpenAutoWindow, false);

  // Different day (Tuesday queried while it is Monday) -> Closed
  const statusDifferentDay = getDailyPrayerWindowStatus('selasa', mondayMorningWibMs);
  assert.equal(statusDifferentDay.isOpenAutoWindow, false);
});

test('Admin can delete a student account; deleted student is removed and cannot log in', () => {
  // Initial state has 4 registered students (Putra, Putri, Ahmad, Fatimah)
  assert.equal(INITIAL_STUDENTS.length, 4);

  // Deleting trial student (Putra or Putri) must be rejected
  const resDeleteTrial = deleteStudentAccount(INITIAL_STUDENTS, 'student_putri');
  assert.equal(resDeleteTrial.ok, false);
  assert.equal(resDeleteTrial.message.includes('tidak dapat dihapus'), true);

  // Deleting regular student (Ahmad) succeeds
  const targetId = 'student_ahmad';
  const resDelete = deleteStudentAccount(INITIAL_STUDENTS, targetId);
  assert.equal(resDelete.ok, true);
  assert.equal(resDelete.deletedStudent?.id, 'student_ahmad');
  assert.equal(resDelete.updatedStudents.length, 3);
  assert.equal(resDelete.updatedStudents.some((s) => s.id === 'student_ahmad'), false);

  // Attempting to log in with deleted student email must now fail
  const resLoginDeleted = authenticateStudent(
    resDelete.updatedStudents,
    'ahmad@santri.id',
    'santri123'
  );
  assert.equal(resLoginDeleted.ok, false);
  assert.equal(resLoginDeleted.error?.includes('tidak ditemukan'), true);

  // Trial students (Putra and Putri) can always log in normally
  const resLoginPutra = authenticateStudent(
    resDelete.updatedStudents,
    'putra@murid.id',
    'siswa123'
  );
  assert.equal(resLoginPutra.ok, true);
  if (resLoginPutra.ok && resLoginPutra.role === 'student') {
    assert.equal(resLoginPutra.student.id, 'student_putra');
  }

  const resLoginPutri = authenticateStudent(
    resDelete.updatedStudents,
    'putri@murid.id',
    'siswi123'
  );
  assert.equal(resLoginPutri.ok, true);
  if (resLoginPutri.ok && resLoginPutri.role === 'student') {
    assert.equal(resLoginPutri.student.id, 'student_putri');
  }
});

test('Session passcodes 753690 (Baca Al-Quran & Hafalan) and 1234LIMA (Rekaman Doa) validate accurately', () => {
  assert.equal(verifyQuranHafalanPasscode('753690'), true);
  assert.equal(verifyQuranHafalanPasscode('000000'), false);

  assert.equal(verifyPrayerRecordingPasscode('1234LIMA'), true);
  assert.equal(verifyPrayerRecordingPasscode('1234lima'), true);
  assert.equal(verifyPrayerRecordingPasscode('SALAH'), false);
});

test('Admin Master can create new quiz questions and students earn XP when answering correctly', () => {
  const created = createQuizQuestion(INITIAL_QUIZ_QUESTIONS, {
    category: 'hafalan',
    question: 'Ada berapa ayat dalam Surat Al-Fatihah?',
    options: ['5 Ayat', '6 Ayat', '7 Ayat', '8 Ayat'],
    correctIndex: 2,
    xpReward: 90,
    coinReward: 70,
  });
  assert.equal(created.ok, true);
  if (created.ok) {
    assert.equal(created.updatedQuestions.length, INITIAL_QUIZ_QUESTIONS.length + 1);
    const putra = INITIAL_STUDENTS[0];
    const wrongTry = answerQuizQuestion(putra, created.newQuestion, 0);
    assert.equal(wrongTry.isCorrect, false);

    const rightTry = answerQuizQuestion(putra, created.newQuestion, 2);
    assert.equal(rightTry.isCorrect, true);
    assert.equal(rightTry.updatedStudent.xp, putra.xp + 90);
  }
});

test('Pou-style bedroom mechanics work alongside challenges', () => {
  const putra = INITIAL_STUDENTS[0];
  assert.equal(computeBaseExpression(putra.bedroom), 'marah');
  const cleaned = cleanBedroomItem(putra, 'all');
  assert.equal(computeBaseExpression(cleaned.updatedStudent.bedroom), 'bangga');
  assert.equal(INITIAL_DAILY_TASKS.length > 0, true);
});

test('Fardu 5 Waktu point calculations match exact specifications (10, 9, 7, 6, 0) and lock Berjamaah/Tempat when Tidak', () => {
  // 1. Salat dilaksanakan (5) + Berjamaah (3) + Masjid (2) = 10 poin
  assert.equal(
    calculateSingleFarduPoints({
      id: 'subuh',
      name: 'Salat Subuh',
      timeRange: '',
      performed: true,
      congregation: true,
      place: 'masjid',
    }),
    10
  );

  // 2. Salat dilaksanakan (5) + Berjamaah (3) + Rumah (1) = 9 poin
  assert.equal(
    calculateSingleFarduPoints({
      id: 'zuhur',
      name: 'Salat Zuhur',
      timeRange: '',
      performed: true,
      congregation: true,
      place: 'rumah',
    }),
    9
  );

  // 3. Salat dilaksanakan (5) + Sendiri (0) + Masjid (2) = 7 poin
  assert.equal(
    calculateSingleFarduPoints({
      id: 'asar',
      name: 'Salat Asar',
      timeRange: '',
      performed: true,
      congregation: false,
      place: 'masjid',
    }),
    7
  );

  // 4. Salat dilaksanakan (5) + Sendiri (0) + Rumah (1) = 6 poin
  assert.equal(
    calculateSingleFarduPoints({
      id: 'magrib',
      name: 'Salat Magrib',
      timeRange: '',
      performed: true,
      congregation: false,
      place: 'rumah',
    }),
    6
  );

  // 5. Tidak dilaksanakan = 0 poin even if congregation/place were previously selected
  const lockedRecord = updateFarduPrayerChoice(
    {
      id: 'isya',
      name: 'Salat Isya',
      timeRange: '',
      performed: true,
      congregation: true,
      place: 'masjid',
    },
    { performed: false }
  );
  assert.equal(lockedRecord.performed, false);
  assert.equal(lockedRecord.congregation, null);
  assert.equal(lockedRecord.place, null);
  assert.equal(calculateSingleFarduPoints(lockedRecord), 0);
});

test('Weekly Worship Summary combines Fardu (max 50) and Sunnah (max 10) up to 60 points', () => {
  const fardu = createBlankFarduRecords();
  for (const id of ['subuh', 'zuhur', 'asar', 'magrib', 'isya'] as const) {
    fardu[id] = {
      ...fardu[id],
      performed: true,
      congregation: true,
      place: 'masjid',
    };
  }
  const sunnah = createBlankSunnahRecords();
  sunnah.rawatib.performed = true;
  sunnah.duha.performed = true;

  const summary = calculateWeeklyWorshipSummary(fardu, sunnah);
  assert.equal(summary.farduPoints, 50);
  assert.equal(summary.sunnahPoints, 10);
  assert.equal(summary.totalPoints, 60);
  assert.equal(summary.progressPercent, 100);
});

test('Hafalan 10 Surahs awards 10 points ONLY after teacher validates as diterima and prevents duplicate points', () => {
  assert.equal(TEN_HAFALAN_SURAHS.length, 10);
  const kausar = TEN_HAFALAN_SURAHS[0];

  // Student submits setoran -> 0 points while waiting for teacher
  const subRes = submitHafalanSetoran({}, kausar, '10.00 WIB');
  assert.equal(subRes.ok, true);
  assert.equal(calculateTotalHafalanPoints(subRes.updatedRecords), 0);
  assert.equal(subRes.updatedRecords[kausar.id].status, 'menunggu_pemeriksaan');

  // Teacher marks Perlu Perbaikan -> still 0 points, allows re-submission
  const needsFix = validateHafalanByTeacher(
    subRes.updatedRecords,
    kausar.id,
    'perlu_perbaikan',
    'Ulangi ayat ke-2',
    '10.15 WIB'
  );
  assert.equal(needsFix.ok, true);
  assert.equal(calculateTotalHafalanPoints(needsFix.updatedRecords), 0);

  // Student re-submits and Teacher marks Diterima -> 10 points awarded
  const resubRes = submitHafalanSetoran(needsFix.updatedRecords, kausar, '10.30 WIB');
  assert.equal(resubRes.ok, true);
  const accepted = validateHafalanByTeacher(
    resubRes.updatedRecords,
    kausar.id,
    'diterima',
    'Lancar dan tartil',
    '10.45 WIB'
  );
  assert.equal(accepted.ok, true);
  assert.equal(calculateTotalHafalanPoints(accepted.updatedRecords), 10);

  // Cannot submit again or earn duplicate points once diterima
  const duplicateTry = submitHafalanSetoran(accepted.updatedRecords, kausar, '11.00 WIB');
  assert.equal(duplicateTry.ok, false);
  assert.equal(calculateTotalHafalanPoints(duplicateTry.updatedRecords), 10);
});

test('Baca Al-Quran requires teacher session to be open and prevents duplicate claims in the same session', () => {
  const closedSession = {
    isOpen: false,
    sessionId: 'sesi_1',
    sessionTitle: 'Sesi Tilawah Kelas 3-4 SD',
    openedBy: 'Guru Agama',
    openedAt: '08.00 WIB',
  };
  const blocked = recordQuranSessionLog([], closedSession, {
    performed: true,
    note: "Membaca Surah An-Naba' ayat 1-20 bersama guru.",
    dateLabel: 'Hari ini',
    periodLabel: 'Minggu Ini',
  });
  assert.equal(blocked.ok, false);

  const openSession = { ...closedSession, isOpen: true };
  const firstClaim = recordQuranSessionLog([], openSession, {
    performed: true,
    note: "Membaca Surah An-Naba' ayat 1-20 bersama guru.",
    dateLabel: 'Hari ini',
    periodLabel: 'Minggu Ini',
  });
  assert.equal(firstClaim.ok, true);
  assert.equal(firstClaim.pointsEarned, 5);

  const duplicateClaim = recordQuranSessionLog(firstClaim.updatedLogs, openSession, {
    performed: true,
    note: "Membaca Surah An-Naba' ayat 1-20 bersama guru.",
    dateLabel: 'Hari ini',
    periodLabel: 'Minggu Ini',
  });
  assert.equal(duplicateClaim.ok, false);
});

test('Weekly Quiz requires all questions answered before submitting and locks after submission', () => {
  const sampleQs = [
    { id: 'q1', correctIndex: 1 },
    { id: 'q2', correctIndex: 0 },
  ];
  const incomplete = submitWeeklyQuizBatch(sampleQs, { q1: 1 }, null, 'Minggu Ini', '09.00 WIB');
  assert.equal(incomplete.ok, false);

  const complete = submitWeeklyQuizBatch(
    sampleQs,
    { q1: 1, q2: 0 },
    null,
    'Minggu Ini',
    '09.05 WIB'
  );
  assert.equal(complete.ok, true);
  assert.equal(complete.submission?.score, 100);

  const secondSubmit = submitWeeklyQuizBatch(
    sampleQs,
    { q1: 0, q2: 0 },
    complete.submission || null,
    'Minggu Ini',
    '09.10 WIB'
  );
  assert.equal(secondSubmit.ok, false);
});

test('Weekly period archiving preserves previous week in archivedPeriods and resets current week', () => {
  const initData = createInitialStudentMutabaahData('student_putra', 0);
  const prevArchCount = initData.archivedPeriods.length;
  const archived = archiveAndResetWeeklyChallenge(
    initData,
    'Minggu, 15 November 2026 (07.00 WIB)',
    'Minggu, 22 November 2026 (07.00 WIB)',
    'periode_2026_11_15',
    'Minggu, 15 November 2026 (07.00 WIB)'
  );
  assert.equal(archived.archivedPeriods.length, prevArchCount + 1);
  assert.equal(archived.salatAccessLocked, true);
  assert.equal(archived.fardu.subuh.performed, null);
  assert.equal(archived.sunnah.rawatib.performed, null);
});

test('Parent & Teacher Secret PIN verifies correctly and keeps PIN hidden from student', async () => {
  const { verifyParentTeacherPin, DEFAULT_PARENT_TEACHER_PIN } = await import(
    './mutabaahChallenges'
  );
  assert.equal(DEFAULT_PARENT_TEACHER_PIN, '987654');
  assert.equal(verifyParentTeacherPin('987654', '987654'), true);
  assert.equal(verifyParentTeacherPin(' 987654 ', '987654'), true);
  assert.equal(verifyParentTeacherPin('123456', '987654'), false);
  assert.equal(verifyParentTeacherPin('', '987654'), false);
});

test('7-day worship schedule (Senin to Minggu) accumulates points across days up to 60 points', async () => {
  const {
    createBlankWeeklyDailyWorship,
    calculateDailyWorshipPoints,
    calculateWeeklyWorshipSummaryFromDailySchedule,
    updateFarduPrayerChoice,
  } = await import('./mutabaahChallenges');

  const weeklySchedule = createBlankWeeklyDailyWorship();
  assert.equal(Boolean(weeklySchedule.senin), true);
  assert.equal(Boolean(weeklySchedule.minggu), true);

  // Record Subuh in Senin: Dilaksanakan (5) + Berjamaah (3) + Masjid (2) = 10 pts
  weeklySchedule.senin.fardu.subuh = updateFarduPrayerChoice(
    weeklySchedule.senin.fardu.subuh,
    { performed: true, congregation: true, place: 'masjid' }
  );
  const seninPts = calculateDailyWorshipPoints(weeklySchedule.senin);
  assert.equal(seninPts.farduPoints, 10);
  assert.equal(seninPts.totalPoints, 10);

  // Record Zuhur in Selasa: Dilaksanakan (5) + Berjamaah (3) + Rumah (1) = 9 pts
  weeklySchedule.selasa.fardu.zuhur = updateFarduPrayerChoice(
    weeklySchedule.selasa.fardu.zuhur,
    { performed: true, congregation: true, place: 'rumah' }
  );

  // Record Rawatib Sunnah in Rabu (+5)
  weeklySchedule.rabu.sunnah.rawatib.performed = true;

  // Calculate accumulated weekly worship summary
  const summary = calculateWeeklyWorshipSummaryFromDailySchedule(weeklySchedule);
  assert.equal(summary.farduPoints, 19); // 10 + 9
  assert.equal(summary.sunnahPoints, 5);  // 5
  assert.equal(summary.totalPoints, 24);  // 19 + 5
});

test('Jubah Kemuliaan designs (Polos, Biru-Ungu Aurora, Hijau-Kuning Api, Merah-Oranye Panda, Ungu-Kuning Naga) can be purchased with Poin Sholat', async () => {
  const {
    JUBAH_DESIGNS,
    purchaseJubahWithSholatPoints,
    getAvailableSholatPoints,
  } = await import('./rules');

  assert.equal(JUBAH_DESIGNS.length, 5);
  assert.equal(JUBAH_DESIGNS[0].corakType, 'polos');
  assert.equal(JUBAH_DESIGNS[0].pointCost, 0);

  assert.equal(JUBAH_DESIGNS[1].corakType, 'aurora');
  assert.equal(JUBAH_DESIGNS[1].pointCost, 150);

  assert.equal(JUBAH_DESIGNS[2].corakType, 'api');
  assert.equal(JUBAH_DESIGNS[2].pointCost, 180);

  assert.equal(JUBAH_DESIGNS[3].corakType, 'panda');
  assert.equal(JUBAH_DESIGNS[3].pointCost, 240);

  assert.equal(JUBAH_DESIGNS[4].corakType, 'naga');
  assert.equal(JUBAH_DESIGNS[4].pointCost, 300);

  const student = {
    ...INITIAL_STUDENTS[0],
    ownedJubahIds: ['jubah_1_pengembara'],
    spentSholatPoints: 0,
  };

  // With only 100 points (< 150 points = 3 full days of Sholat), cannot buy Jubah 2
  const failBuy = purchaseJubahWithSholatPoints(
    student,
    'jubah_2_zamrud',
    100
  );
  assert.equal(failBuy.ok, false);
  assert.equal(failBuy.purchasedNew, false);

  // With 180 points (3 full days of Sholat Fardu + Sunnah), can buy Jubah 3 (Hijau-Kuning Corak Api, 180 Poin)
  const successBuy = purchaseJubahWithSholatPoints(
    student,
    'jubah_3_tilawah',
    180
  );
  assert.equal(successBuy.ok, true);
  assert.equal(successBuy.purchasedNew, true);
  assert.equal(successBuy.updatedStudent.selectedJubahId, 'jubah_3_tilawah');
  assert.equal(
    getAvailableSholatPoints(successBuy.updatedStudent, 180),
    0
  );
});


