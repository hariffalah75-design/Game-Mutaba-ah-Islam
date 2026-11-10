import { TaskCategory } from './rules';

export type FarduPrayerId = 'subuh' | 'zuhur' | 'asar' | 'magrib' | 'isya';
export type SunnahPrayerId = 'rawatib' | 'duha';
export type PrayerPlace = 'masjid' | 'rumah';

export interface FarduPrayerRecord {
  id: FarduPrayerId;
  name: string;
  timeRange: string;
  performed: boolean | null; // true = Ya (+5), false = Tidak (0), null = belum dipilih
  congregation: boolean | null; // true = Ya (+3), false = Tidak (0) (only active when performed === true)
  place: PrayerPlace | null; // 'masjid' (+2) | 'rumah' (+1) (only active when performed === true)
}

export interface SunnahPrayerRecord {
  id: SunnahPrayerId;
  name: string;
  description: string;
  performed: boolean | null; // true = Ya (+5), false = Tidak (0), null = belum dipilih
}

export type HafalanLevel =
  | 'Level 1: Mudah'
  | 'Level 2: Lanjut'
  | 'Level 3: Menengah'
  | 'Level 4: Lanjutan';

export interface HafalanSurahTarget {
  id: string;
  surahNumber: number;
  name: string;
  arabicName: string;
  versesCount: number;
  level: HafalanLevel;
  firstVerseArabic: string;
}

export type HafalanValidationStatus =
  | 'belum_disetorkan'
  | 'menunggu_pemeriksaan'
  | 'diterima'
  | 'perlu_perbaikan';

export interface HafalanSubmissionRecord {
  surahId: string;
  surahName: string;
  surahNumber: number;
  versesCount: number;
  level: HafalanLevel;
  status: HafalanValidationStatus;
  pointsAwarded: number; // 10 only when status === 'diterima', never duplicated
  submittedAt: string;
  validatedAt?: string;
  teacherNote?: string;
}

export interface QuranReadingSessionConfig {
  isOpen: boolean;
  sessionId: string;
  sessionTitle: string;
  openedBy: string;
  openedAt: string;
}

export interface QuranReadingLogEntry {
  id: string;
  sessionId: string;
  dateLabel: string;
  performed: boolean;
  points: number; // +5 if performed === true, 0 if false
  note: string;
  periodLabel: string;
}

export type DayOfWeekId =
  | 'senin'
  | 'selasa'
  | 'rabu'
  | 'kamis'
  | 'jumat'
  | 'sabtu'
  | 'minggu';

export interface DayOfWeekInfo {
  id: DayOfWeekId;
  label: string;
  shortLabel: string;
}

export const DAYS_OF_WEEK: DayOfWeekInfo[] = [
  { id: 'senin', label: 'Senin', shortLabel: 'Sen' },
  { id: 'selasa', label: 'Selasa', shortLabel: 'Sel' },
  { id: 'rabu', label: 'Rabu', shortLabel: 'Rab' },
  { id: 'kamis', label: 'Kamis', shortLabel: 'Kam' },
  { id: 'jumat', label: "Jum'at", shortLabel: 'Jum' },
  { id: 'sabtu', label: 'Sabtu', shortLabel: 'Sab' },
  { id: 'minggu', label: 'Minggu', shortLabel: 'Min' },
];

export interface DailyWorshipSchedule {
  fardu: Record<FarduPrayerId, FarduPrayerRecord>;
  sunnah: Record<SunnahPrayerId, SunnahPrayerRecord>;
}

export type WeeklyDailyWorshipMap = Record<DayOfWeekId, DailyWorshipSchedule>;

export const DEFAULT_PARENT_TEACHER_PIN = '987654';

export function verifyParentTeacherPin(
  inputPin: string,
  correctPin: string = DEFAULT_PARENT_TEACHER_PIN
): boolean {
  return inputPin.trim() === correctPin.trim();
}

export function getCurrentWibDay(nowMs: number = Date.now()): DayOfWeekId {
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  const wibDate = new Date(nowMs + WIB_OFFSET_MS);
  const utcDay = wibDate.getUTCDay();
  const dayMap: Record<number, DayOfWeekId> = {
    0: 'minggu',
    1: 'senin',
    2: 'selasa',
    3: 'rabu',
    4: 'kamis',
    5: 'jumat',
    6: 'sabtu',
  };
  return dayMap[utcDay] || 'senin';
}

/**
 * Returns current WIB (UTC+7) day of week and hour status.
 * Window: Daily from 05:00 WIB to 07:00 WIB.
 */
export function getDailyPrayerWindowStatus(
  targetDay: DayOfWeekId,
  nowMs: number = Date.now()
): {
  isOpenAutoWindow: boolean;
  currentWibDay: DayOfWeekId;
  wibHour: number;
  wibMinute: number;
  wibTimeText: string;
  statusLabel: string;
  isPastDay: boolean;
} {
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  const wibDate = new Date(nowMs + WIB_OFFSET_MS);

  // UTC Day: 0 = Sunday, 1 = Monday, 2 = Tuesday, ... 6 = Saturday
  const utcDay = wibDate.getUTCDay();
  const dayMap: Record<number, DayOfWeekId> = {
    0: 'minggu',
    1: 'senin',
    2: 'selasa',
    3: 'rabu',
    4: 'kamis',
    5: 'jumat',
    6: 'sabtu',
  };

  const currentWibDay = dayMap[utcDay] || 'senin';
  const wibHour = wibDate.getUTCHours();
  const wibMinute = wibDate.getUTCMinutes();
  const wibTimeText = `${String(wibHour).padStart(2, '0')}:${String(wibMinute).padStart(2, '0')} WIB`;

  // Daily Window: 05:00 to 07:00 WIB (inclusive of 05:00 to 06:59:59)
  const isTimeInWindow = wibHour >= 5 && wibHour < 7;
  const isTargetSameDay = targetDay === currentWibDay;

  const dayOrder: DayOfWeekId[] = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
  const currentDayIdx = dayOrder.indexOf(currentWibDay);
  const targetDayIdx = dayOrder.indexOf(targetDay);
  const isPastDay = targetDayIdx < currentDayIdx;

  if (isTargetSameDay && isTimeInWindow) {
    return {
      isOpenAutoWindow: true,
      currentWibDay,
      wibHour,
      wibMinute,
      wibTimeText,
      statusLabel: `Sesi Terbuka Otomatis (05:00 – 07:00 WIB Hari Ini · ${wibTimeText})`,
      isPastDay: false,
    };
  }

  if (isTargetSameDay && wibHour >= 7) {
    return {
      isOpenAutoWindow: false,
      currentWibDay,
      wibHour,
      wibMinute,
      wibTimeText,
      statusLabel: `Waktu Otomatis Hari Ini Berakhir (Lewat 07:00 WIB) · Buka dengan Sandi Guru`,
      isPastDay: false,
    };
  }

  if (isTargetSameDay && wibHour < 5) {
    return {
      isOpenAutoWindow: false,
      currentWibDay,
      wibHour,
      wibMinute,
      wibTimeText,
      statusLabel: `Menunggu Jam 05:00 WIB Hari Ini · Buka dengan Sandi Guru`,
      isPastDay: false,
    };
  }

  return {
    isOpenAutoWindow: false,
    currentWibDay,
    wibHour,
    wibMinute,
    wibTimeText,
    statusLabel: isPastDay
      ? `Hari Ini Sudah Terlewat · Terkunci (Buka dengan Sandi Guru)`
      : `Bukan Hari Aktif · Terkunci (Buka dengan Sandi Guru)`,
    isPastDay,
  };
}

export interface WeeklyQuizSubmissionResult {
  submitted: boolean;
  submittedAt: string;
  periodLabel: string;
  answers: Record<string, number>; // questionId -> optionIndex (0..3)
  correctCount: number;
  totalQuestions: number;
  score: number; // 0..100
}

export interface MutabaahHistoryEntry {
  id: string;
  studentId: string;
  category:
    | 'salat_fardu'
    | 'ibadah_sunah'
    | 'quiz_mingguan'
    | 'baca_alquran'
    | 'hafalan_alquran'
    | 'periode_mingguan';
  title: string;
  detail: string;
  points: number;
  statusLabel: string;
  timestamp: string;
  periodLabel: string;
  dayId?: DayOfWeekId;
}

export interface ArchivedWeeklyPeriod {
  id: string;
  periodLabel: string;
  startDateLabel: string;
  endDateLabel: string;
  archivedAt: string;
  farduPoints: number;
  sunnahPoints: number;
  totalWeeklyWorshipPoints: number; // out of 60
  quizScore: number | null;
  quranPoints: number;
  hafalanPoints: number;
  dailyWorshipSnapshot: WeeklyDailyWorshipMap;
  farduSnapshot: Record<FarduPrayerId, FarduPrayerRecord>;
  sunnahSnapshot: Record<SunnahPrayerId, SunnahPrayerRecord>;
}

export interface StudentMutabaahChallengeData {
  studentId: string;
  groupNumberLabel: string;
  currentPeriodKey: string;
  currentPeriodStartLabel: string;
  currentPeriodEndLabel: string;
  salatAccessLocked: boolean;
  parentTeacherPin: string;
  selectedDay: DayOfWeekId;
  dailyWorship: WeeklyDailyWorshipMap;
  fardu: Record<FarduPrayerId, FarduPrayerRecord>;
  sunnah: Record<SunnahPrayerId, SunnahPrayerRecord>;
  weeklyQuizDraftAnswers: Record<string, number>;
  weeklyQuizSubmission: WeeklyQuizSubmissionResult | null;
  quranLogs: QuranReadingLogEntry[];
  hafalanRecords: Record<string, HafalanSubmissionRecord>; // surahId -> record
  historyEntries: MutabaahHistoryEntry[];
  archivedPeriods: ArchivedWeeklyPeriod[];
}

export const TEN_HAFALAN_SURAHS: HafalanSurahTarget[] = [
  {
    id: 'surah_alkautsar',
    surahNumber: 108,
    name: 'Surah Al-Kautsar',
    arabicName: 'الكوثر',
    versesCount: 3,
    level: 'Level 1: Mudah',
    firstVerseArabic: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ ﴿١﴾',
  },
  {
    id: 'surah_annasr',
    surahNumber: 110,
    name: 'Surah An-Nasr',
    arabicName: 'النصر',
    versesCount: 3,
    level: 'Level 1: Mudah',
    firstVerseArabic: 'إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ ﴿١﴾',
  },
  {
    id: 'surah_alashr',
    surahNumber: 103,
    name: "Surah Al-'Ashr",
    arabicName: 'العصر',
    versesCount: 3,
    level: 'Level 1: Mudah',
    firstVerseArabic: 'وَالْعَصْرِ ﴿١﴾ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ ﴿٢﴾',
  },
  {
    id: 'surah_quraisy',
    surahNumber: 106,
    name: 'Surah Quraisy',
    arabicName: 'قريش',
    versesCount: 4,
    level: 'Level 2: Lanjut',
    firstVerseArabic: 'لِإِيلَافِ قُرَيْشٍ ﴿١﴾',
  },
  {
    id: 'surah_alfil',
    surahNumber: 105,
    name: 'Surah Al-Fil',
    arabicName: 'الفيل',
    versesCount: 5,
    level: 'Level 2: Lanjut',
    firstVerseArabic: 'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ الْفِيلِ ﴿١﴾',
  },
  {
    id: 'surah_allahab',
    surahNumber: 111,
    name: 'Surah Al-Lahab',
    arabicName: 'المسد',
    versesCount: 5,
    level: 'Level 2: Lanjut',
    firstVerseArabic: 'تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ ﴿١﴾',
  },
  {
    id: 'surah_almaun',
    surahNumber: 107,
    name: "Surah Al-Ma'un",
    arabicName: 'الماعون',
    versesCount: 7,
    level: 'Level 3: Menengah',
    firstVerseArabic: 'أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ ﴿١﴾',
  },
  {
    id: 'surah_alkafirun',
    surahNumber: 109,
    name: 'Surah Al-Kafirun',
    arabicName: 'الكافرون',
    versesCount: 6,
    level: 'Level 3: Menengah',
    firstVerseArabic: 'قُلْ يَا أَيُّهَا الْكَافِرُونَ ﴿١﴾',
  },
  {
    id: 'surah_alqadr',
    surahNumber: 97,
    name: 'Surah Al-Qadr',
    arabicName: 'القدر',
    versesCount: 5,
    level: 'Level 4: Lanjutan',
    firstVerseArabic: 'إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ ﴿١﴾',
  },
  {
    id: 'surah_attin',
    surahNumber: 95,
    name: 'Surah At-Tin',
    arabicName: 'التين',
    versesCount: 8,
    level: 'Level 4: Lanjutan',
    firstVerseArabic: 'وَالتِّينِ وَالزَّيْتُونِ ﴿١﴾',
  },
];

export const FARDU_PRAYER_ORDER: FarduPrayerId[] = [
  'subuh',
  'zuhur',
  'asar',
  'magrib',
  'isya',
];

export const SUNNAH_PRAYER_ORDER: SunnahPrayerId[] = ['rawatib', 'duha'];

export function createInitialFarduRecords(): Record<FarduPrayerId, FarduPrayerRecord> {
  return {
    subuh: {
      id: 'subuh',
      name: 'Salat Subuh',
      timeRange: '04.30 – 05.45 WIB',
      performed: true,
      congregation: true,
      place: 'masjid',
    },
    zuhur: {
      id: 'zuhur',
      name: 'Salat Zuhur',
      timeRange: '11.55 – 15.00 WIB',
      performed: true,
      congregation: true,
      place: 'masjid',
    },
    asar: {
      id: 'asar',
      name: 'Salat Asar',
      timeRange: '15.15 – 17.45 WIB',
      performed: true,
      congregation: false,
      place: 'rumah',
    },
    magrib: {
      id: 'magrib',
      name: 'Salat Magrib',
      timeRange: '17.55 – 19.00 WIB',
      performed: null,
      congregation: null,
      place: null,
    },
    isya: {
      id: 'isya',
      name: 'Salat Isya',
      timeRange: '19.10 – 04.15 WIB',
      performed: null,
      congregation: null,
      place: null,
    },
  };
}

export function createBlankFarduRecords(): Record<FarduPrayerId, FarduPrayerRecord> {
  return {
    subuh: {
      id: 'subuh',
      name: 'Salat Subuh',
      timeRange: '04.30 – 05.45 WIB',
      performed: null,
      congregation: null,
      place: null,
    },
    zuhur: {
      id: 'zuhur',
      name: 'Salat Zuhur',
      timeRange: '11.55 – 15.00 WIB',
      performed: null,
      congregation: null,
      place: null,
    },
    asar: {
      id: 'asar',
      name: 'Salat Asar',
      timeRange: '15.15 – 17.45 WIB',
      performed: null,
      congregation: null,
      place: null,
    },
    magrib: {
      id: 'magrib',
      name: 'Salat Magrib',
      timeRange: '17.55 – 19.00 WIB',
      performed: null,
      congregation: null,
      place: null,
    },
    isya: {
      id: 'isya',
      name: 'Salat Isya',
      timeRange: '19.10 – 04.15 WIB',
      performed: null,
      congregation: null,
      place: null,
    },
  };
}

export function createInitialSunnahRecords(): Record<SunnahPrayerId, SunnahPrayerRecord> {
  return {
    rawatib: {
      id: 'rawatib',
      name: 'Salat Rawatib',
      description: 'Salat sunah pengiring sebelum/sesudah salat fardu lima waktu.',
      performed: true,
    },
    duha: {
      id: 'duha',
      name: 'Salat Duha',
      description: 'Salat sunah pagi hari minimal 2 rakaat sebelum memulai belajar.',
      performed: null,
    },
  };
}

export function createBlankSunnahRecords(): Record<SunnahPrayerId, SunnahPrayerRecord> {
  return {
    rawatib: {
      id: 'rawatib',
      name: 'Salat Rawatib',
      description: 'Salat sunah pengiring sebelum/sesudah salat fardu lima waktu.',
      performed: null,
    },
    duha: {
      id: 'duha',
      name: 'Salat Duha',
      description: 'Salat sunah pagi hari minimal 2 rakaat sebelum memulai belajar.',
      performed: null,
    },
  };
}

/**
 * Pure point calculation for a single Fardu prayer (max 10 points):
 * - Pelaksanaan: Ya = 5, Tidak = 0
 * - Berjamaah: Ya = 3, Tidak = 0 (only if performed === true)
 * - Tempat: Masjid = 2, Rumah = 1 (only if performed === true)
 *
 * Examples verified:
 * - Ya + Berjamaah + Masjid = 5 + 3 + 2 = 10 poin
 * - Ya + Berjamaah + Rumah = 5 + 3 + 1 = 9 poin
 * - Ya + Sendiri + Masjid = 5 + 0 + 2 = 7 poin
 * - Ya + Sendiri + Rumah = 5 + 0 + 1 = 6 poin
 * - Tidak dilaksanakan = 0 poin
 */
export function calculateSingleFarduPoints(record: FarduPrayerRecord): number {
  if (record.performed !== true) {
    return 0;
  }
  let points = 5;
  if (record.congregation === true) {
    points += 3;
  }
  if (record.place === 'masjid') {
    points += 2;
  } else if (record.place === 'rumah') {
    points += 1;
  }
  return Math.min(10, points);
}

export function calculateTotalFarduPoints(
  farduMap: Record<FarduPrayerId, FarduPrayerRecord>
): number {
  const sum = FARDU_PRAYER_ORDER.reduce(
    (acc, id) => acc + calculateSingleFarduPoints(farduMap[id]),
    0
  );
  return Math.min(50, sum);
}

export function calculateSingleSunnahPoints(record: SunnahPrayerRecord): number {
  return record.performed === true ? 5 : 0;
}

export function calculateTotalSunnahPoints(
  sunnahMap: Record<SunnahPrayerId, SunnahPrayerRecord>
): number {
  const sum = SUNNAH_PRAYER_ORDER.reduce(
    (acc, id) => acc + calculateSingleSunnahPoints(sunnahMap[id]),
    0
  );
  return Math.min(10, sum);
}

export function calculateWeeklyWorshipSummary(
  farduMap: Record<FarduPrayerId, FarduPrayerRecord>,
  sunnahMap: Record<SunnahPrayerId, SunnahPrayerRecord>
): {
  farduPoints: number;
  maxFarduPoints: number;
  sunnahPoints: number;
  maxSunnahPoints: number;
  totalPoints: number;
  maxTotalPoints: number;
  progressPercent: number;
} {
  const farduPoints = calculateTotalFarduPoints(farduMap);
  const sunnahPoints = calculateTotalSunnahPoints(sunnahMap);
  const totalPoints = Math.min(60, farduPoints + sunnahPoints);
  const maxTotalPoints = 60;
  const progressPercent = Math.round((totalPoints / maxTotalPoints) * 100);

  return {
    farduPoints,
    maxFarduPoints: 50,
    sunnahPoints,
    maxSunnahPoints: 10,
    totalPoints,
    maxTotalPoints,
    progressPercent,
  };
}

export function createBlankDailyWorshipSchedule(): DailyWorshipSchedule {
  return {
    fardu: createBlankFarduRecords(),
    sunnah: createBlankSunnahRecords(),
  };
}

export function createBlankWeeklyDailyWorship(): WeeklyDailyWorshipMap {
  const map: Partial<WeeklyDailyWorshipMap> = {};
  for (const day of DAYS_OF_WEEK) {
    map[day.id] = createBlankDailyWorshipSchedule();
  }
  return map as WeeklyDailyWorshipMap;
}

export function createInitialWeeklyDailyWorship(isInitialStudent: boolean = false): WeeklyDailyWorshipMap {
  const map: Partial<WeeklyDailyWorshipMap> = {};
  for (const day of DAYS_OF_WEEK) {
    if (isInitialStudent && day.id === 'senin') {
      map[day.id] = {
        fardu: createInitialFarduRecords(),
        sunnah: createInitialSunnahRecords(),
      };
    } else {
      map[day.id] = createBlankDailyWorshipSchedule();
    }
  }
  return map as WeeklyDailyWorshipMap;
}

export function normalizeStudentChallengeData(
  data: StudentMutabaahChallengeData | null | undefined,
  studentId: string,
  studentIndex = 0
): StudentMutabaahChallengeData {
  if (!data) {
    return createInitialStudentMutabaahData(studentId, studentIndex);
  }

  const baseBlankDaily = createBlankWeeklyDailyWorship();
  const rawDaily = data.dailyWorship || ({} as Partial<WeeklyDailyWorshipMap>);
  const safeDaily: Partial<WeeklyDailyWorshipMap> = {};

  for (const day of DAYS_OF_WEEK) {
    const existingDay = rawDaily[day.id];
    if (existingDay && existingDay.fardu && existingDay.sunnah) {
      safeDaily[day.id] = existingDay;
    } else if (day.id === (data.selectedDay || 'senin') && data.fardu && data.sunnah) {
      safeDaily[day.id] = {
        fardu: data.fardu,
        sunnah: data.sunnah,
      };
    } else {
      safeDaily[day.id] = baseBlankDaily[day.id];
    }
  }

  return {
    ...data,
    salatAccessLocked:
      typeof data.salatAccessLocked === 'boolean' ? data.salatAccessLocked : true,
    parentTeacherPin: data.parentTeacherPin || DEFAULT_PARENT_TEACHER_PIN,
    selectedDay: data.selectedDay || 'senin',
    dailyWorship: safeDaily as WeeklyDailyWorshipMap,
    fardu: data.fardu || (safeDaily.senin as DailyWorshipSchedule).fardu,
    sunnah: data.sunnah || (safeDaily.senin as DailyWorshipSchedule).sunnah,
  };
}

export function calculateDailyWorshipPoints(schedule: DailyWorshipSchedule): {
  farduPoints: number;
  sunnahPoints: number;
  totalPoints: number;
} {
  const farduPoints = calculateTotalFarduPoints(schedule.fardu);
  const sunnahPoints = calculateTotalSunnahPoints(schedule.sunnah);
  return {
    farduPoints,
    sunnahPoints,
    totalPoints: farduPoints + sunnahPoints,
  };
}

export function calculateWeeklyWorshipSummaryFromDailySchedule(
  dailyMap?: WeeklyDailyWorshipMap | null
): {
  farduPoints: number;
  maxFarduPoints: number;
  sunnahPoints: number;
  maxSunnahPoints: number;
  totalPoints: number;
  maxTotalPoints: number;
  progressPercent: number;
  daysBreakdown: Record<DayOfWeekId, { farduPoints: number; sunnahPoints: number; totalPoints: number }>;
} {
  let rawFarduSum = 0;
  let rawSunnahSum = 0;
  const daysBreakdown: Partial<
    Record<DayOfWeekId, { farduPoints: number; sunnahPoints: number; totalPoints: number }>
  > = {};

  const safeMap = dailyMap || ({} as Partial<WeeklyDailyWorshipMap>);

  for (const day of DAYS_OF_WEEK) {
    const rawSchedule = safeMap[day.id];
    const schedule: DailyWorshipSchedule =
      rawSchedule && rawSchedule.fardu && rawSchedule.sunnah
        ? rawSchedule
        : createBlankDailyWorshipSchedule();

    const dayStats = calculateDailyWorshipPoints(schedule);
    daysBreakdown[day.id] = dayStats;
    rawFarduSum += dayStats.farduPoints;
    rawSunnahSum += dayStats.sunnahPoints;
  }

  const farduPoints = Math.min(50, rawFarduSum);
  const sunnahPoints = Math.min(10, rawSunnahSum);
  const totalPoints = Math.min(60, farduPoints + sunnahPoints);
  const maxTotalPoints = 60;
  const progressPercent = Math.round((totalPoints / maxTotalPoints) * 100);

  return {
    farduPoints,
    maxFarduPoints: 50,
    sunnahPoints,
    maxSunnahPoints: 10,
    totalPoints,
    maxTotalPoints,
    progressPercent,
    daysBreakdown: daysBreakdown as Record<
      DayOfWeekId,
      { farduPoints: number; sunnahPoints: number; totalPoints: number }
    >,
  };
}

/**
 * Calculates cumulative Sholat points earned across the daily worship schedule (up to 60 points/day = 420 points/week)
 * so that 3 full days of Sholat yields 150 (Fardu full) to 180 (Fardu + Sunnah full) points.
 */
export function calculateTotalEarnedSholatPoints(
  dailyMap?: WeeklyDailyWorshipMap | null
): number {
  let sum = 0;
  const safeMap = dailyMap || ({} as Partial<WeeklyDailyWorshipMap>);
  for (const day of DAYS_OF_WEEK) {
    const rawSchedule = safeMap[day.id];
    if (rawSchedule && rawSchedule.fardu && rawSchedule.sunnah) {
      const stats = calculateDailyWorshipPoints(rawSchedule);
      sum += stats.totalPoints;
    }
  }
  return sum;
}

/**
 * Updates a Fardu prayer record while enforcing the rule:
 * If performed is set to false ("Tidak"), congregation and place are cleared/locked so they cannot award points.
 */
export function updateFarduPrayerChoice(
  current: FarduPrayerRecord,
  patch: {
    performed?: boolean;
    congregation?: boolean;
    place?: PrayerPlace;
  }
): FarduPrayerRecord {
  const nextPerformed =
    patch.performed !== undefined ? patch.performed : current.performed;

  if (nextPerformed !== true) {
    return {
      ...current,
      performed: nextPerformed,
      congregation: null,
      place: null,
    };
  }

  // When switching performed from false/null to true, provide sensible default if not yet chosen or apply patch
  const nextCongregation =
    patch.congregation !== undefined ? patch.congregation : current.congregation;
  const nextPlace = patch.place !== undefined ? patch.place : current.place;

  return {
    ...current,
    performed: true,
    congregation: nextCongregation,
    place: nextPlace,
  };
}

/**
 * Computes the active weekly period (Sunday 07:00 WIB to next Sunday 07:00 WIB)
 * and real-time countdown in WIB (UTC+7).
 */
export function getWibWeeklyPeriodInfo(nowMs: number = Date.now()): {
  periodKey: string;
  startDateLabel: string;
  endDateLabel: string;
  countdownText: string;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  wibTimeFormatted: string;
} {
  // WIB is UTC + 7 hours
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  const wibInstant = new Date(nowMs + WIB_OFFSET_MS);

  const utcYear = wibInstant.getUTCFullYear();
  const utcMonth = wibInstant.getUTCMonth();
  const utcDate = wibInstant.getUTCDate();
  const utcDay = wibInstant.getUTCDay(); // 0 = Sunday
  const utcHours = wibInstant.getUTCHours();

  // Determine how many days since the most recent Sunday 07:00 WIB
  let daysSinceStart = utcDay;
  if (utcDay === 0 && utcHours < 7) {
    daysSinceStart = 7;
  }

  const startWibUtcMs =
    Date.UTC(utcYear, utcMonth, utcDate - daysSinceStart, 7, 0, 0, 0) - WIB_OFFSET_MS;
  const endWibUtcMs = startWibUtcMs + 7 * 24 * 60 * 60 * 1000;

  const diffMs = Math.max(0, endWibUtcMs - nowMs);
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const monthsId = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const startWib = new Date(startWibUtcMs + WIB_OFFSET_MS);
  const endWib = new Date(endWibUtcMs + WIB_OFFSET_MS);

  const formatWibDate = (d: Date) =>
    `Minggu, ${d.getUTCDate()} ${monthsId[d.getUTCMonth()]} ${d.getUTCFullYear()} (07.00 WIB)`;

  const startDateLabel = formatWibDate(startWib);
  const endDateLabel = formatWibDate(endWib);
  const periodKey = `periode_${startWib.getUTCFullYear()}_${startWib.getUTCMonth() + 1}_${startWib.getUTCDate()}`;

  const pad = (n: number) => String(n).padStart(2, '0');
  const countdownText = `${days}h ${pad(hours)}j ${pad(minutes)}m ${pad(seconds)}d`;
  const wibTimeFormatted = `${pad(wibInstant.getUTCHours())}.${pad(
    wibInstant.getUTCMinutes()
  )}.${pad(wibInstant.getUTCSeconds())} WIB`;

  return {
    periodKey,
    startDateLabel,
    endDateLabel,
    countdownText,
    days,
    hours,
    minutes,
    seconds,
    wibTimeFormatted,
  };
}

/**
 * Calculates total validated Hafalan points for a student (10 points per 'diterima' surah, never duplicated).
 */
export function calculateTotalHafalanPoints(
  records: Record<string, HafalanSubmissionRecord>
): number {
  return Object.values(records).reduce(
    (acc, rec) => acc + (rec.status === 'diterima' ? 10 : 0),
    0
  );
}

/**
 * Submits a student's Hafalan request for a target surah to the teacher.
 * Does NOT award points immediately — status becomes 'menunggu_pemeriksaan'.
 */
export function submitHafalanSetoran(
  records: Record<string, HafalanSubmissionRecord>,
  surah: HafalanSurahTarget,
  timestampLabel: string
): {
  ok: boolean;
  message: string;
  updatedRecords: Record<string, HafalanSubmissionRecord>;
} {
  const existing = records[surah.id];
  if (existing && existing.status === 'diterima') {
    return {
      ok: false,
      message: `${surah.name} sudah divalidasi Diterima (+10 poin) oleh guru dan tidak dapat diklaim berulang.`,
      updatedRecords: records,
    };
  }
  if (existing && existing.status === 'menunggu_pemeriksaan') {
    return {
      ok: false,
      message: `Setoran ${surah.name} sedang menunggu pemeriksaan guru.`,
      updatedRecords: records,
    };
  }

  const nextRec: HafalanSubmissionRecord = {
    surahId: surah.id,
    surahName: surah.name,
    surahNumber: surah.surahNumber,
    versesCount: surah.versesCount,
    level: surah.level,
    status: 'menunggu_pemeriksaan',
    pointsAwarded: 0,
    submittedAt: timestampLabel,
  };

  return {
    ok: true,
    message: `Setoran ${surah.name} (${surah.versesCount} ayat) berhasil diajukan dan menunggu pemeriksaan guru.`,
    updatedRecords: {
      ...records,
      [surah.id]: nextRec,
    },
  };
}

/**
 * Teacher/Admin validates a student's Hafalan submission:
 * - 'diterima' -> awards 10 points (once per surah)
 * - 'perlu_perbaikan' -> 0 points, student must re-submit
 */
export function validateHafalanByTeacher(
  records: Record<string, HafalanSubmissionRecord>,
  surahId: string,
  decision: 'diterima' | 'perlu_perbaikan',
  teacherNote: string,
  timestampLabel: string
): {
  ok: boolean;
  pointsDelta: number;
  updatedRecords: Record<string, HafalanSubmissionRecord>;
  message: string;
} {
  const existing = records[surahId];
  if (!existing) {
    return {
      ok: false,
      pointsDelta: 0,
      updatedRecords: records,
      message: 'Data pengajuan setoran tidak ditemukan.',
    };
  }

  // Prevent duplicate point grant if already accepted
  if (existing.status === 'diterima' && decision === 'diterima') {
    return {
      ok: false,
      pointsDelta: 0,
      updatedRecords: records,
      message: 'Hafalan ini sudah dinyatakan Diterima sebelumnya (poin tidak digandakan).',
    };
  }

  const isAccepted = decision === 'diterima';
  const pointsDelta = isAccepted ? 10 : 0;

  const updatedRec: HafalanSubmissionRecord = {
    ...existing,
    status: decision,
    pointsAwarded: isAccepted ? 10 : 0,
    validatedAt: timestampLabel,
    teacherNote:
      teacherNote.trim() ||
      (isAccepted
        ? 'Alhamdulillah bacaan tartil, makhraj tepat, dan hafalan lancar.'
        : 'Perlu murajaah ulang pada panjang pendek ayat, silakan setorkan kembali.'),
  };

  return {
    ok: true,
    pointsDelta,
    updatedRecords: {
      ...records,
      [surahId]: updatedRec,
    },
    message: isAccepted
      ? `Setoran ${existing.surahName} divalidasi Diterima (+10 Poin).`
      : `Setoran ${existing.surahName} ditandai Perlu Perbaikan (0 Poin).`,
  };
}

/**
 * Records a Baca Al-Qur'an log entry for an active teacher session.
 * Enforces:
 * 1. Session must be open (`sessionConfig.isOpen === true`)
 * 2. Student cannot claim twice for the same `sessionId`
 * 3. Note is required when performed is true
 */
export function recordQuranSessionLog(
  existingLogs: QuranReadingLogEntry[],
  sessionConfig: QuranReadingSessionConfig,
  payload: {
    performed: boolean | null;
    note: string;
    dateLabel: string;
    periodLabel: string;
  }
): {
  ok: boolean;
  pointsEarned: number;
  newEntry?: QuranReadingLogEntry;
  updatedLogs: QuranReadingLogEntry[];
  message: string;
} {
  if (!sessionConfig.isOpen) {
    return {
      ok: false,
      pointsEarned: 0,
      updatedLogs: existingLogs,
      message:
        'Akses sesi Baca Al-Qur\'an sedang ditutup oleh guru. Pencatatan hanya dapat dilakukan saat sesi pembelajaran agama dibuka guru.',
    };
  }

  if (existingLogs.some((log) => log.sessionId === sessionConfig.sessionId)) {
    return {
      ok: false,
      pointsEarned: 0,
      updatedLogs: existingLogs,
      message:
        'Kamu sudah menyimpan pencatatan Baca Al-Qur\'an pada sesi aktif ini. Klaim poin tidak dapat diulang pada sesi yang sama.',
    };
  }

  if (payload.performed === null) {
    return {
      ok: false,
      pointsEarned: 0,
      updatedLogs: existingLogs,
      message: 'Pilih status pelaksanaan terlebih dahulu: Ya (+5 Poin) atau Tidak (+0 Poin).',
    };
  }

  const cleanNote = payload.note.trim();
  if (payload.performed && !cleanNote) {
    return {
      ok: false,
      pointsEarned: 0,
      updatedLogs: existingLogs,
      message: 'Tuliskan catatan tilawah, halaman, atau surah yang dibaca bersama guru.',
    };
  }

  const pointsEarned = payload.performed ? 5 : 0;
  const newEntry: QuranReadingLogEntry = {
    id: `quran_${Date.now()}`,
    sessionId: sessionConfig.sessionId,
    dateLabel: payload.dateLabel,
    performed: payload.performed,
    points: pointsEarned,
    note: cleanNote || 'Tidak melaksanakan tilawah pada sesi ini.',
    periodLabel: payload.periodLabel,
  };

  return {
    ok: true,
    pointsEarned,
    newEntry,
    updatedLogs: [newEntry, ...existingLogs],
    message: payload.performed
      ? 'Alhamdulillah! Pencatatan Baca Al-Qur\'an berhasil disimpan (+5 Poin).'
      : 'Pencatatan Baca Al-Qur\'an (Tidak dilaksanakan: +0 Poin) berhasil disimpan.',
  };
}

/**
 * Evaluates and locks Weekly Quiz answers.
 * Enforces:
 * - Student cannot submit until ALL questions have a selected option
 * - Once submitted for the active period, answers cannot be modified arbitrarily
 */
export function submitWeeklyQuizBatch(
  questions: { id: string; correctIndex: number }[],
  draftAnswers: Record<string, number>,
  existingSubmission: WeeklyQuizSubmissionResult | null,
  periodLabel: string,
  submittedAt: string
): {
  ok: boolean;
  submission?: WeeklyQuizSubmissionResult;
  message: string;
} {
  if (existingSubmission && existingSubmission.submitted) {
    return {
      ok: false,
      message: 'Jawaban Quiz Mingguan sudah dikirim untuk periode ini dan tidak dapat diubah kembali.',
    };
  }

  if (questions.length === 0) {
    return {
      ok: false,
      message: 'Belum ada pertanyaan kuis mingguan yang tersedia.',
    };
  }

  const unansweredCount = questions.filter((q) => draftAnswers[q.id] === undefined).length;
  if (unansweredCount > 0) {
    return {
      ok: false,
      message: `Masih ada ${unansweredCount} pertanyaan wajib yang belum dijawab. Jawab seluruh pertanyaan sebelum mengirim!`,
    };
  }

  let correctCount = 0;
  for (const q of questions) {
    if (draftAnswers[q.id] === q.correctIndex) {
      correctCount += 1;
    }
  }

  const score = Math.round((correctCount / questions.length) * 100);
  const submission: WeeklyQuizSubmissionResult = {
    submitted: true,
    submittedAt,
    periodLabel,
    answers: { ...draftAnswers },
    correctCount,
    totalQuestions: questions.length,
    score,
  };

  return {
    ok: true,
    submission,
    message: `Alhamdulillah! Jawaban Quiz Mingguan berhasil dikirim. Nilai kamu: ${score}/100 (${correctCount} benar dari ${questions.length} soal).`,
  };
}

/**
 * Archives the current week's data into `archivedPeriods` and `historyEntries` and starts a fresh week.
 */
export function archiveAndResetWeeklyChallenge(
  data: StudentMutabaahChallengeData,
  newPeriodStartLabel: string,
  newPeriodEndLabel: string,
  newPeriodKey: string,
  archivedAtLabel: string
): StudentMutabaahChallengeData {
  const summary = calculateWeeklyWorshipSummaryFromDailySchedule(data.dailyWorship);
  const quranPoints = data.quranLogs.reduce((acc, item) => acc + item.points, 0);
  const hafalanPoints = calculateTotalHafalanPoints(data.hafalanRecords);
  const periodLabel = `${data.currentPeriodStartLabel} – ${data.currentPeriodEndLabel}`;

  const archivedItem: ArchivedWeeklyPeriod = {
    id: `arch_${Date.now()}`,
    periodLabel,
    startDateLabel: data.currentPeriodStartLabel,
    endDateLabel: data.currentPeriodEndLabel,
    archivedAt: archivedAtLabel,
    farduPoints: summary.farduPoints,
    sunnahPoints: summary.sunnahPoints,
    totalWeeklyWorshipPoints: summary.totalPoints,
    quizScore: data.weeklyQuizSubmission ? data.weeklyQuizSubmission.score : null,
    quranPoints,
    hafalanPoints,
    dailyWorshipSnapshot: JSON.parse(JSON.stringify(data.dailyWorship)),
    farduSnapshot: JSON.parse(JSON.stringify(data.fardu)),
    sunnahSnapshot: JSON.parse(JSON.stringify(data.sunnah)),
  };

  const archiveHistoryEntry: MutabaahHistoryEntry = {
    id: `hist_arch_${Date.now()}`,
    studentId: data.studentId,
    category: 'periode_mingguan',
    title: 'Arsip Periode Tantangan Mingguan',
    detail: `Fardu ${summary.farduPoints}/50 · Sunah ${summary.sunnahPoints}/10 · Total ${summary.totalPoints}/60 Poin`,
    points: summary.totalPoints,
    statusLabel: 'Tersimpan di Riwayat',
    timestamp: archivedAtLabel,
    periodLabel,
  };

  const freshDaily = createBlankWeeklyDailyWorship();

  return {
    ...data,
    currentPeriodKey: newPeriodKey,
    currentPeriodStartLabel: newPeriodStartLabel,
    currentPeriodEndLabel: newPeriodEndLabel,
    salatAccessLocked: true, // locked by default for each new period
    selectedDay: 'senin',
    dailyWorship: freshDaily,
    fardu: freshDaily.senin.fardu,
    sunnah: freshDaily.senin.sunnah,
    weeklyQuizDraftAnswers: {},
    weeklyQuizSubmission: null,
    archivedPeriods: [archivedItem, ...data.archivedPeriods],
    historyEntries: [archiveHistoryEntry, ...data.historyEntries],
  };
}

export function createInitialStudentMutabaahData(
  studentId: string,
  studentIndex = 0
): StudentMutabaahChallengeData {
  const period = getWibWeeklyPeriodInfo();
  const periodLabel = `${period.startDateLabel} – ${period.endDateLabel}`;
  const groupNumberLabel = `Kelompok ${(studentIndex % 4) + 1} · Regu Mutaba'ah SD`;

  const initialHafalan: Record<string, HafalanSubmissionRecord> =
    studentId === 'student_putri' || studentId === 'student_fatimah'
      ? {
          surah_alkautsar: {
            surahId: 'surah_alkautsar',
            surahName: 'Surah Al-Kautsar',
            surahNumber: 108,
            versesCount: 3,
            level: 'Level 1: Mudah',
            status: 'diterima',
            pointsAwarded: 10,
            submittedAt: 'Minggu Lalu, 09.15 WIB',
            validatedAt: 'Minggu Lalu, 10.00 WIB',
            teacherNote: 'Alhamdulillah hafalan Surah Al-Kautsar sangat lancar dan tartil.',
          },
          surah_annasr: {
            surahId: 'surah_annasr',
            surahName: 'Surah An-Nasr',
            surahNumber: 110,
            versesCount: 3,
            level: 'Level 1: Mudah',
            status: 'menunggu_pemeriksaan',
            pointsAwarded: 0,
            submittedAt: 'Hari ini, 08.20 WIB',
          },
        }
      : {
          surah_alkautsar: {
            surahId: 'surah_alkautsar',
            surahName: 'Surah Al-Kautsar',
            surahNumber: 108,
            versesCount: 3,
            level: 'Level 1: Mudah',
            status: 'menunggu_pemeriksaan',
            pointsAwarded: 0,
            submittedAt: 'Hari ini, 08.05 WIB',
          },
        };

  const initialDaily = createInitialWeeklyDailyWorship(true);
  const prevDaily = createInitialWeeklyDailyWorship(true);

  const initialArchived: ArchivedWeeklyPeriod[] = [
    {
      id: `arch_prev_${studentId}`,
      periodLabel: 'Minggu, 1 November 2026 (07.00 WIB) – Minggu, 8 November 2026 (07.00 WIB)',
      startDateLabel: 'Minggu, 1 November 2026 (07.00 WIB)',
      endDateLabel: 'Minggu, 8 November 2026 (07.00 WIB)',
      archivedAt: 'Minggu, 8 November 2026 (07.00 WIB)',
      farduPoints: 44,
      sunnahPoints: 10,
      totalWeeklyWorshipPoints: 54,
      quizScore: 100,
      quranPoints: 5,
      hafalanPoints: 10,
      dailyWorshipSnapshot: prevDaily,
      farduSnapshot: prevDaily.senin.fardu,
      sunnahSnapshot: prevDaily.senin.sunnah,
    },
  ];

  const initialHistory: MutabaahHistoryEntry[] = [
    {
      id: `hist_init_1_${studentId}`,
      studentId,
      category: 'periode_mingguan',
      title: 'Arsip Periode Minggu Lalu (Otomatis 07.00 WIB)',
      detail: 'Fardu 44/50 · Sunah 10/10 · Total 54/60 Poin · Kuis 100/100',
      points: 54,
      statusLabel: 'Tersimpan di Riwayat',
      timestamp: 'Minggu, 07.00 WIB',
      periodLabel: 'Minggu, 1 November 2026 – 8 November 2026',
    },
    {
      id: `hist_init_2_${studentId}`,
      studentId,
      category: 'salat_fardu',
      title: 'Pencatatan Salat Subuh & Zuhur Berjamaah di Masjid (Senin)',
      detail: 'Salat dilaksanakan (+5), Berjamaah (+3), di Masjid (+2) = 10 Poin per salat',
      points: 20,
      statusLabel: 'Tercatat',
      timestamp: 'Hari ini, 12.15 WIB',
      periodLabel,
      dayId: 'senin',
    },
  ];

  return {
    studentId,
    groupNumberLabel,
    currentPeriodKey: period.periodKey,
    currentPeriodStartLabel: period.startDateLabel,
    currentPeriodEndLabel: period.endDateLabel,
    salatAccessLocked: true, // Locked by default as requested: ngga bisa dibuka oleh murid, sandi jangan diperlihatkan
    parentTeacherPin: DEFAULT_PARENT_TEACHER_PIN,
    selectedDay: 'senin',
    dailyWorship: initialDaily,
    fardu: initialDaily.senin.fardu,
    sunnah: initialDaily.senin.sunnah,
    weeklyQuizDraftAnswers: {},
    weeklyQuizSubmission: null,
    quranLogs: [],
    hafalanRecords: initialHafalan,
    historyEntries: initialHistory,
    archivedPeriods: initialArchived,
  };
}

export const SD_WEEKLY_QUIZ_QUESTIONS: {
  id: string;
  category: TaskCategory;
  topicLabel: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  xpReward: number;
  coinReward: number;
  createdBy: string;
}[] = [
  {
    id: 'soal_sd_1',
    category: 'akhlak',
    topicLabel: 'Akhlak kepada Guru & Orang Tua',
    question:
      'Ketika guru sedang menjelaskan pelajaran agama di depan kelas, sikap adab murid SD yang mulia adalah...',
    options: [
      'Mengobrol keras dengan teman sebangku',
      'Mendengarkan dengan sopan, tenang, dan mencatat ilmu yang disampaikan',
      'Berjalan-jalan keluar kelas tanpa izin',
      'Bermain sendiri di bangku belakang',
    ],
    correctIndex: 1,
    xpReward: 75,
    coinReward: 50,
    createdBy: 'Guru Pendidikan Agama',
  },
  {
    id: 'soal_sd_2',
    category: 'mengaji',
    topicLabel: "Adab Membaca Al-Qur'an",
    question:
      "Sebelum kita memegang dan membaca mushaf Al-Qur'an bersama guru, adab utama yang harus kita lakukan adalah...",
    options: [
      "Berwudhu terlebih dahulu dan mengawali dengan membaca Ta'awudz serta Basmalah",
      'Langsung membuka halaman sambil makan camilan',
      "Meletakkan Al-Qur'an di lantai tempat berjalan",
      'Membaca dengan tergesa-gesa tanpa memperhatikan tajwid',
    ],
    correctIndex: 0,
    xpReward: 80,
    coinReward: 55,
    createdBy: 'Guru Pendidikan Agama',
  },
  {
    id: 'soal_sd_3',
    category: 'sholat',
    topicLabel: 'Ibadah & Pengetahuan Agama Islam',
    question:
      'Berapakah jumlah total rakaat salat fardu lima waktu (Subuh, Zuhur, Asar, Magrib, dan Isya) dalam sehari semalam?',
    options: ['15 Rakaat', '17 Rakaat', '19 Rakaat', '20 Rakaat'],
    correctIndex: 1,
    xpReward: 75,
    coinReward: 50,
    createdBy: 'Guru Pendidikan Agama',
  },
  {
    id: 'soal_sd_4',
    category: 'hafalan',
    topicLabel: 'Menuntut Ilmu & Kebiasaan Baik',
    question:
      'Doa "Rabbi zidnii \'ilman warzuqnii fahman" yang selalu kita baca sebelum belajar memiliki arti...',
    options: [
      'Ya Tuhanku, berikanlah aku kesehatan jasmani',
      'Ya Tuhanku, tambahkanlah ilmu kepadaku dan berilah aku pemahaman yang baik',
      'Ya Tuhanku, ampunilah kesalahan teman-temanku',
      'Segala puji bagi Allah yang telah memberi kami makan',
    ],
    correctIndex: 1,
    xpReward: 80,
    coinReward: 60,
    createdBy: 'Guru Pendidikan Agama',
  },
];
