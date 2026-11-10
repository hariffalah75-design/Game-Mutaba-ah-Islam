import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Lock,
  Unlock,
  KeyRound,
  Mic,
  Square,
  Send,
  HelpCircle,
  BookOpen,
  AlertCircle,
  Calendar,
  Award,
  HeartHandshake,
  History,
  RotateCcw,
} from 'lucide-react';
import {
  DailyTask,
  QuizQuestion,
  SessionPasscodes,
  StudentAccount,
  verifyQuranHafalanPasscode,
} from '../game/rules';
import {
  DAYS_OF_WEEK,
  DayOfWeekId,
  FARDU_PRAYER_ORDER,
  FarduPrayerId,
  HafalanLevel,
  HafalanSurahTarget,
  PrayerPlace,
  QuranReadingSessionConfig,
  SUNNAH_PRAYER_ORDER,
  StudentMutabaahChallengeData,
  SunnahPrayerId,
  TEN_HAFALAN_SURAHS,
  calculateDailyWorshipPoints,
  calculateSingleFarduPoints,
  calculateSingleSunnahPoints,
  calculateTotalHafalanPoints,
  calculateWeeklyWorshipSummaryFromDailySchedule,
  createBlankDailyWorshipSchedule,
  getDailyPrayerWindowStatus,
  getWibWeeklyPeriodInfo,
  getCurrentWibDay,
} from '../game/mutabaahChallenges';
import { soundFX } from '../utils/sound';

interface ChallengesViewProps {
  student: StudentAccount;
  tasks?: DailyTask[];
  questions: QuizQuestion[];
  passcodes: SessionPasscodes;
  challengeData: StudentMutabaahChallengeData;
  quranSessionConfig: QuranReadingSessionConfig;
  onUpdateFardu: (
    dayId: DayOfWeekId,
    prayerId: FarduPrayerId,
    patch: { performed?: boolean; congregation?: boolean; place?: PrayerPlace }
  ) => void;
  onUpdateSunnah: (dayId: DayOfWeekId, prayerId: SunnahPrayerId, performed: boolean) => void;
  onToggleSalatAccessLock: (forceState?: boolean) => void;
  onUnlockSalatWithPin: (pin: string) => { ok: boolean; message: string };
  onSelectDay: (dayId: DayOfWeekId) => void;
  onArchiveAndResetWeek: () => void;
  onSelectQuizOption: (questionId: string, optionIdx: number) => void;
  onSubmitWeeklyQuiz: () => { ok: boolean; message: string };
  onSaveQuranReadingLog: (payload: {
    performed: boolean | null;
    note: string;
  }) => { ok: boolean; message: string };
  onSubmitHafalan: (surah: HafalanSurahTarget) => { ok: boolean; message: string };
  onToggleTask?: (taskId: string) => void;
  onAddTask?: (newTask: Omit<DailyTask, 'id' | 'completed' | 'streakDays'>) => void;
  onAnswerQuestion?: (question: QuizQuestion, selectedIdx: number) => {
    isCorrect: boolean;
    message: string;
  };
  onUnlockQuranHafalan: () => void;
  onSaveReflection: (note: string) => void;
  onGoToBerandaRoom: () => void;
  onGoToRiwayat: () => void;
  onOpenAdminMaster?: () => void;
}

export const ChallengesView: React.FC<ChallengesViewProps> = ({
  student,
  questions,
  passcodes,
  challengeData,
  quranSessionConfig,
  onUpdateFardu,
  onUpdateSunnah,
  onToggleSalatAccessLock,
  onUnlockSalatWithPin,
  onSelectDay,
  onArchiveAndResetWeek,
  onSelectQuizOption,
  onSubmitWeeklyQuiz,
  onSaveQuranReadingLog,
  onSubmitHafalan,
  onUnlockQuranHafalan,
  onSaveReflection,
  onGoToRiwayat,
}) => {
  // Real-time WIB clock & countdown to Sunday 07.00 WIB
  const [wibPeriod, setWibPeriod] = useState(() => getWibWeeklyPeriodInfo());

  useEffect(() => {
    const timer = setInterval(() => {
      setWibPeriod(getWibWeeklyPeriodInfo());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Baca Al-Qur'an form state
  const [quranPerformed, setQuranPerformed] = useState<boolean | null>(true);
  const [quranNote, setQuranNote] = useState('');
  const [quranFeedback, setQuranFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  // Hafalan Al-Qur'an (10 Surahs Kelas 3-4 SD) state
  const [hafalanFilter, setHafalanFilter] = useState<'Semua' | HafalanLevel>('Semua');
  const [selectedSurahId, setSelectedSurahId] = useState<string>(TEN_HAFALAN_SURAHS[0].id);
  const [hafalanFeedback, setHafalanFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  // Weekly Quiz feedback state
  const [quizBanner, setQuizBanner] = useState<{ ok: boolean; text: string } | null>(null);

  // Passcode inputs for Sesi Baca Al-Qur'an & Hafalan (753690)
  const [quranPinInput, setQuranPinInput] = useState('');
  const [quranPinMsg, setQuranPinMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Parent & Teacher Secret PIN Lock Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Reflection note state
  const [reflectionInput, setReflectionInput] = useState(student.reflectionNote);
  const [reflectionSaved, setReflectionSaved] = useState(false);

  useEffect(() => {
    setReflectionInput(student.reflectionNote);
  }, [student.id, student.reflectionNote]);

  const currentWibDay = getCurrentWibDay();
  const dayOrder: DayOfWeekId[] = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
  const currentDayIdx = dayOrder.indexOf(currentWibDay);
  const selectedDayIdx = dayOrder.indexOf(challengeData.selectedDay || 'senin');
  const activeDay: DayOfWeekId = selectedDayIdx <= currentDayIdx ? (challengeData.selectedDay || 'senin') : currentWibDay;
  const [dayLockedNotice, setDayLockedNotice] = useState<string | null>(null);

  const activeDaySchedule =
    challengeData.dailyWorship?.[activeDay] || createBlankDailyWorshipSchedule();
  const activeDayStats = calculateDailyWorshipPoints(activeDaySchedule);

  const worshipSummary = calculateWeeklyWorshipSummaryFromDailySchedule(
    challengeData.dailyWorship || {}
  );

  const totalQuranPoints = challengeData.quranLogs.reduce((acc, item) => acc + item.points, 0);
  const totalHafalanPoints = calculateTotalHafalanPoints(challengeData.hafalanRecords);
  const alreadyClaimedCurrentQuranSession = challengeData.quranLogs.some(
    (log) => log.sessionId === quranSessionConfig.sessionId
  );

  const filteredSurahs =
    hafalanFilter === 'Semua'
      ? TEN_HAFALAN_SURAHS
      : TEN_HAFALAN_SURAHS.filter((s) => s.level === hafalanFilter);

  const selectedSurah =
    TEN_HAFALAN_SURAHS.find((s) => s.id === selectedSurahId) || TEN_HAFALAN_SURAHS[0];
  const selectedSurahRecord = challengeData.hafalanRecords[selectedSurah.id];
  const selectedSurahStatus = selectedSurahRecord
    ? selectedSurahRecord.status
    : 'belum_disetorkan';

  const handleSaveQuranClick = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onSaveQuranReadingLog({
      performed: quranPerformed,
      note: quranNote,
    });
    if (res.ok) {
      soundFX.playCoinReward();
      setQuranNote('');
    } else {
      soundFX.playOuchTouch();
    }
    setQuranFeedback({ ok: res.ok, text: res.message });
  };

  const handleAjukanSetoranClick = () => {
    const res = onSubmitHafalan(selectedSurah);
    if (res.ok) {
      soundFX.playCoinReward();
    } else {
      soundFX.playOuchTouch();
    }
    setHafalanFeedback({ ok: res.ok, text: res.message });
  };

  const handleKirimQuizMingguan = () => {
    const res = onSubmitWeeklyQuiz();
    if (res.ok) {
      soundFX.playCoinReward();
    } else {
      soundFX.playOuchTouch();
    }
    setQuizBanner({ ok: res.ok, text: res.message });
  };

  const handleUnlockQuranByPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyQuranHafalanPasscode(quranPinInput, passcodes.quranHafalanPin)) {
      soundFX.playCleanRoom();
      onUnlockQuranHafalan();
      setQuranPinInput('');
      setQuranPinMsg({
        ok: true,
        text: "Sandi terverifikasi! Akses Sesi Baca Al-Qur'an & Hafalan berhasil dibuka.",
      });
    } else {
      soundFX.playOuchTouch();
      setQuranPinMsg({
        ok: false,
        text: 'Sandi guru salah! Masukkan sandi yang diberikan oleh Ustadz/Guru pendamping.',
      });
    }
  };

  const handleUnlockSalatPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    const res = onUnlockSalatWithPin(pinInput);
    if (res.ok) {
      soundFX.playCoinReward();
      setIsPinModalOpen(false);
      setPinInput('');
    } else {
      soundFX.playOuchTouch();
      setPinError(res.message);
    }
  };

  const handleReflectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveReflection(reflectionInput);
    setReflectionSaved(true);
    setTimeout(() => setReflectionSaved(false), 2500);
  };

  const answeredCount = questions.filter((q) => {
    const map = challengeData.weeklyQuizSubmission
      ? challengeData.weeklyQuizSubmission.answers
      : challengeData.weeklyQuizDraftAnswers;
    return map[q.id] !== undefined;
  }).length;

  return (
    <div className="space-y-6 animate-stage-reveal pb-8">
      {/* =====================================================================
          2B. BANNER UTAMA HIJAU TUA + KARTU POIN IBADAH MINGGU INI (MAKS 60 POIN)
         ===================================================================== */}
      <section
        aria-label="Banner Utama Tantangan Mutaba'ah"
        className="rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#065f46] to-[#047857] text-white p-5 sm:p-7 shadow-lg border border-emerald-800/60"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left 7 Cols: Judul & Deskripsi Banner */}
          <div className="lg:col-span-7 space-y-2.5">
            <div className="text-xs font-extrabold tracking-widest uppercase text-amber-300">
              SISTEM TANTANGAN MUTABA&apos;AH BERKELANJUTAN
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              TANTANGAN MUTABA&apos;AH SISWA &amp; SISWI
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed max-w-2xl">
              Catat ibadah harian berpoin, ikuti pembukaan mingguan (07.00 WIB), dan setorkan hafalan saat sesi pembelajaran agama bersama guru.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-emerald-100/90 font-semibold">
              <span>Murid Aktif: <strong className="text-white">{student.name}</strong> ({student.email})</span>
              <span>&middot;</span>
              <span>Poin Baca Al-Qur&apos;an: <strong className="text-amber-300">{totalQuranPoints} Poin</strong></span>
              <span>&middot;</span>
              <span>Poin Hafalan Tervalidasi: <strong className="text-amber-300">{totalHafalanPoints} Poin</strong></span>
            </div>
          </div>

          {/* Right 5 Cols: Kartu POIN IBADAH MINGGU INI */}
          <div className="lg:col-span-5">
            <div
              data-testid="weekly-points-card"
              className="rounded-2xl bg-white text-slate-900 p-5 shadow-md border border-emerald-100 space-y-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                  POIN IBADAH MINGGU INI
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Maksimal 60 Poin
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <div className="text-3xl sm:text-4xl font-mono-tabular font-extrabold text-emerald-700">
                  {worshipSummary.totalPoints}{' '}
                  <span className="text-base sm:text-lg font-bold text-slate-400">
                    / {worshipSummary.maxTotalPoints} Poin
                  </span>
                </div>
                <span className="text-xs font-mono-tabular font-extrabold text-amber-600">
                  {worshipSummary.progressPercent}% Tercapai
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                  style={{ width: `${worshipSummary.progressPercent}%` }}
                />
              </div>

              {/* Rincian Poin Fardu dan Sunah */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80">
                  <div className="text-[11px] font-bold text-slate-600">Ibadah Fardu (5 Waktu)</div>
                  <div
                    data-testid="fardu-subtotal-banner"
                    className="text-sm sm:text-base font-mono-tabular font-extrabold text-emerald-800"
                  >
                    {worshipSummary.farduPoints} / 50 Poin
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/90">
                  <div className="text-[11px] font-bold text-slate-600">Ibadah Sunah</div>
                  <div
                    data-testid="sunnah-subtotal-banner"
                    className="text-sm sm:text-base font-mono-tabular font-extrabold text-amber-800"
                  >
                    {worshipSummary.sunnahPoints} / 10 Poin
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. SISTEM TANTANGAN MINGGUAN (MINGGU 07.00 WIB, KELOMPOK, KUNCI AKSES, HITUNG MUNDUR WIB)
         ===================================================================== */}
      <section
        aria-label="Sistem Tantangan Mingguan"
        className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-emerald-700">
              <span>{challengeData.groupNumberLabel}</span>
              <span>&middot;</span>
              <span>Pembukaan Mingguan Setiap Hari Minggu Pukul 07.00 WIB</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Tantangan Mingguan
            </h2>
            <p className="text-xs text-slate-600 flex flex-wrap items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                Periode Aktif: <strong>{challengeData.currentPeriodStartLabel}</strong> s/d{' '}
                <strong>{challengeData.currentPeriodEndLabel}</strong>
              </span>
            </p>
          </div>

          {/* Right Controls: Hitung Mundur WIB, Status Akses Salat, Tombol Kunci Akses */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Real-Time WIB Countdown to next Sunday 07.00 WIB */}
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Hitung Mundur Reset Minggu Berikutnya (WIB)
              </div>
              <div
                data-testid="wib-countdown-timer"
                className="text-xs sm:text-sm font-mono-tabular font-extrabold text-emerald-800 flex items-center justify-end gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{wibPeriod.countdownText}</span>
                <span className="text-[11px] font-normal text-slate-500">
                  ({wibPeriod.wibTimeFormatted})
                </span>
              </div>
            </div>

            {/* Status Akses Salat */}
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Status Akses Salat
              </div>
              <div className="text-xs font-extrabold flex items-center gap-1.5 mt-0.5">
                {challengeData.salatAccessLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-amber-700">Akses Salat Terkunci</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Akses Salat Terbuka</span>
                  </>
                )}
              </div>
            </div>

            {/* Tombol Kunci Akses */}
            <button
              type="button"
              onClick={() => {
                if (challengeData.salatAccessLocked) {
                  setPinInput('');
                  setPinError(null);
                  setIsPinModalOpen(true);
                } else {
                  onToggleSalatAccessLock(true);
                }
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer ${
                challengeData.salatAccessLocked
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {challengeData.salatAccessLocked ? (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Buka Kunci (Masukkan PIN Guru)</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Kunci Akses Salat</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Row of Weekly Challenge: Archive to Riwayat & View History */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-500">
            Data minggu sebelumnya otomatis tersimpan ke dalam <strong>Riwayat</strong> setiap pergantian periode Minggu 07.00 WIB.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onArchiveAndResetWeek}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Simpan Minggu Ini ke Riwayat &amp; Mulai Periode Baru</span>
            </button>
            <button
              type="button"
              onClick={onGoToRiwayat}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>Buka Riwayat ({challengeData.archivedPeriods.length} Periode)</span>
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4 & 5. FITUR IBADAH FARDU (5 WAKTU) & SUNAH DENGAN KUNCI GURU / ORANG TUA
         ===================================================================== */}
      {challengeData.salatAccessLocked ? (
        <section
          aria-label="Ibadah Salat Terkunci Khusus Guru atau Orang Tua"
          className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-[#064e3b] text-white p-6 sm:p-8 shadow-xl border-2 border-amber-400/50 space-y-4"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border-2 border-amber-400/60 text-amber-300 flex items-center justify-center shrink-0 shadow-inner">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
                <span>Akses Terkunci Khusus Guru &amp; Orang Tua</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Pencatatan Ibadah Salat Fardu &amp; Sunah Terkunci
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                Demi menjaga ketertiban, kedisiplinan, dan kejujuran mutaba&apos;ah, pencatatan salat 5 waktu dan ibadah sunah hanya dapat dibuka saat didampingi oleh Guru atau Orang Tua.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-amber-200/90 font-semibold">
                <span>🔒 Sandi dirahasiakan dan tidak diperlihatkan kepada siswa</span>
                <span>&middot;</span>
                <span>Dapat dibuka pada pukul 05:00 &ndash; 07:00 WIB atau menggunakan PIN Guru/Orang Tua</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPinInput('');
                setPinError(null);
                setIsPinModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shrink-0"
            >
              <KeyRound className="w-4 h-4 text-slate-950" />
              <span>Buka Kunci (Guru / Orang Tua)</span>
            </button>
          </div>
        </section>
      ) : (
        <section aria-label="Fitur Ibadah Salat Fardu & Sunah 7 Hari" className="space-y-4">
          {/* Unlocked Access Bar with Lock Again button */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Unlock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-emerald-950">
                  Akses Ibadah Terbuka (Didampingi Guru / Orang Tua)
                </h3>
                <p className="text-[11px] text-emerald-800">
                  Silakan pilih hari di bawah ini untuk mencatat salat subuh, dzuhur, ashar, maghrib, isya, rawatib, dan duha.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggleSalatAccessLock(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Kunci Kembali Akses</span>
            </button>
          </div>

          {/* 7 Days of the Week Selection Bar: Senin s/d Minggu */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-extrabold uppercase text-slate-600 tracking-wider">
                PILIH HARI PENCATATAN IBADAH (SENIN &ndash; MINGGU)
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(() => {
                  const windowStatus = getDailyPrayerWindowStatus(activeDay);
                  return (
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                        windowStatus.isOpenAutoWindow
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{windowStatus.statusLabel}</span>
                    </span>
                  );
                })()}
                <div className="text-xs font-bold text-emerald-800">
                  Hari Terpilih: <strong className="text-emerald-700 uppercase">{DAYS_OF_WEEK.find(d => d.id === activeDay)?.label}</strong>
                </div>
              </div>
            </div>
            {dayLockedNotice && (
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
                <span>{dayLockedNotice}</span>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const targetDayIdx = dayOrder.indexOf(day.id);
                const isFutureDay = targetDayIdx > currentDayIdx;
                const stats = worshipSummary.daysBreakdown[day.id] || { totalPoints: 0, farduPoints: 0, sunnahPoints: 0 };
                const isDayActive = activeDay === day.id;

                if (isFutureDay) {
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => {
                        soundFX.playOuchTouch();
                        setDayLockedNotice(`Hari ${day.label} masih terkunci (belum waktunya). Hari ini adalah hari ${DAYS_OF_WEEK.find(d => d.id === currentWibDay)?.label || currentWibDay}.`);
                        setTimeout(() => setDayLockedNotice(null), 4000);
                      }}
                      className="p-3 rounded-2xl border text-left transition-all cursor-not-allowed bg-slate-200/90 text-slate-400 border-slate-300 opacity-75 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs sm:text-sm font-extrabold flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          {day.label}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-300/80 px-1.5 py-0.5 rounded">
                          Terkunci
                        </span>
                      </div>
                      <div className="text-[10px] font-mono-tabular mt-1.5 text-slate-500">
                        Belum Terbuka
                      </div>
                    </button>
                  );
                }

                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => onSelectDay(day.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isDayActive
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-md ring-2 ring-emerald-500/40'
                        : 'bg-slate-50 hover:bg-emerald-50/80 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs sm:text-sm font-extrabold">{day.label}</span>
                      {stats.totalPoints > 0 ? (
                        <span
                          className={`text-[10px] font-mono-tabular font-extrabold px-1.5 py-0.2 rounded-md ${
                            isDayActive ? 'bg-amber-400 text-slate-950' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {stats.totalPoints} P
                        </span>
                      ) : (
                        <span className={`text-[10px] ${isDayActive ? 'text-emerald-200' : 'text-slate-400'}`}>
                          0 P
                        </span>
                      )}
                    </div>
                    <div className={`text-[10px] font-mono-tabular mt-1.5 ${isDayActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                      F: {stats.farduPoints}/50 &middot; S: {stats.sunnahPoints}/10
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5 Salat Fardu Cards for Active Day */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Salat Fardu 5 Waktu &ndash; Hari {DAYS_OF_WEEK.find(d => d.id === activeDay)?.label}
                </h3>
                <p className="text-xs text-slate-600">
                  Pelaksanaan: Ya (+5) / Tidak (0) &middot; Berjamaah: Ya (+3) &middot; Tempat: Masjid (+2) / Rumah (+1). Maksimal 10 poin per salat.
                </p>
              </div>

              <div
                data-testid="fardu-subtotal-display"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white font-mono-tabular text-xs font-extrabold"
              >
                Poin Fardu Hari {DAYS_OF_WEEK.find(d => d.id === activeDay)?.label}: {activeDayStats.farduPoints} / 50 Poin
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              {FARDU_PRAYER_ORDER.map((prayerId) => {
                const rec = activeDaySchedule.fardu[prayerId];
                const cardPoints = calculateSingleFarduPoints(rec);
                const isPerformedYes = rec.performed === true;

                return (
                  <div
                    key={prayerId}
                    data-testid={`fardu-card-${prayerId}`}
                    className={`rounded-2xl bg-white border p-4 shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                      isPerformedYes ? 'border-emerald-500/80' : 'border-slate-200'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{rec.name}</h4>
                        <p className="text-[11px] text-slate-500">{rec.timeRange}</p>
                      </div>
                      <span
                        data-testid={`fardu-points-${prayerId}`}
                        className={`px-2 py-0.5 rounded-lg text-xs font-mono-tabular font-extrabold ${
                          cardPoints > 0
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {cardPoints} / 10 Poin
                      </span>
                    </div>

                    {/* Bagian A: Pelaksanaan */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">A. Pelaksanaan</span>
                        <span className="text-[11px] text-slate-400">Ya (+5) / Tidak (0)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          aria-label={`${rec.name} Pelaksanaan Ya`}
                          onClick={() => onUpdateFardu(activeDay, prayerId, { performed: true })}
                          className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                            rec.performed === true
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          Ya (+5)
                        </button>
                        <button
                          type="button"
                          aria-label={`${rec.name} Pelaksanaan Tidak`}
                          onClick={() => onUpdateFardu(activeDay, prayerId, { performed: false })}
                          className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                            rec.performed === false
                              ? 'bg-red-600 text-white border-red-700 shadow-xs'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          Tidak (0)
                        </button>
                      </div>
                    </div>

                    {/* Bagian B: Berjamaah */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">B. Berjamaah</span>
                        <span className="text-[11px] text-slate-400">
                          {isPerformedYes ? 'Ya (+3)' : 'Terkunci'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={!isPerformedYes}
                          aria-label={`${rec.name} Berjamaah Ya`}
                          onClick={() => onUpdateFardu(activeDay, prayerId, { congregation: true })}
                          className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer disabled:opacity-45 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed ${
                            isPerformedYes && rec.congregation === true
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          Ya (+3)
                        </button>
                        <button
                          type="button"
                          disabled={!isPerformedYes}
                          aria-label={`${rec.name} Berjamaah Tidak`}
                          onClick={() => onUpdateFardu(activeDay, prayerId, { congregation: false })}
                          className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer disabled:opacity-45 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed ${
                            isPerformedYes && rec.congregation === false
                              ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          Tidak (0)
                        </button>
                      </div>
                    </div>

                    {/* Bagian C: Tempat */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">C. Tempat</span>
                        <span className="text-[11px] text-slate-400">
                          {isPerformedYes ? 'Masjid (+2) / Rumah (+1)' : 'Terkunci'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={!isPerformedYes}
                          aria-label={`${rec.name} Tempat Masjid`}
                          onClick={() => onUpdateFardu(activeDay, prayerId, { place: 'masjid' })}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer disabled:opacity-45 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed ${
                            isPerformedYes && rec.place === 'masjid'
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          Masjid (+2)
                        </button>
                        <button
                          type="button"
                          disabled={!isPerformedYes}
                          aria-label={`${rec.name} Tempat Rumah`}
                          onClick={() => onUpdateFardu(activeDay, prayerId, { place: 'rumah' })}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer disabled:opacity-45 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed ${
                            isPerformedYes && rec.place === 'rumah'
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          Rumah (+1)
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2 Salat Sunah Cards for Active Day */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Salat Sunah (Rawatib &amp; Duha) &ndash; Hari {DAYS_OF_WEEK.find(d => d.id === activeDay)?.label}
                </h3>
                <p className="text-xs text-slate-600">
                  Salat Rawatib dan Salat Duha (Ya = 5 poin, Tidak = 0 poin). Maksimal poin sunah harian adalah 10 poin.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  data-testid="sunnah-subtotal-display"
                  className="px-3.5 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-mono-tabular text-xs font-extrabold"
                >
                  Poin Sunah Hari {DAYS_OF_WEEK.find(d => d.id === activeDay)?.label}: {activeDayStats.sunnahPoints} / 10 Poin
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SUNNAH_PRAYER_ORDER.map((sunnahId) => {
                const rec = activeDaySchedule.sunnah[sunnahId];
                const pts = calculateSingleSunnahPoints(rec);

                return (
                  <div
                    key={sunnahId}
                    data-testid={`sunnah-card-${sunnahId}`}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                      rec.performed === true
                        ? 'bg-emerald-50/40 border-emerald-500/80'
                        : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-slate-900">{rec.name}</h4>
                        <span className="text-xs font-mono-tabular font-extrabold text-amber-700">
                          ({pts} / 5 Poin)
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{rec.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        aria-label={`${rec.name} Ya`}
                        onClick={() => onUpdateSunnah(activeDay, sunnahId, true)}
                        className={`py-2 px-4 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                          rec.performed === true
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        Ya (+5 Poin)
                      </button>
                      <button
                        type="button"
                        aria-label={`${rec.name} Tidak`}
                        onClick={() => onUpdateSunnah(activeDay, sunnahId, false)}
                        className={`py-2 px-4 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                          rec.performed === false
                            ? 'bg-red-600 text-white border-red-700 shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        Tidak (0 Poin)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          6. FITUR QUIZ MINGGUAN (KARTU TERPISAH, 4 OPSI A-D, BORDER HIJAU & LATAR HIJAU MUDA)
         ===================================================================== */}
      <section
        aria-label="Fitur Quiz Mingguan"
        className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-700">
              <HelpCircle className="w-4 h-4" />
              <span>EVALUASI AKHLAK, ADAB &amp; IBADAH USIA SD</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Quiz Mingguan Siswa &amp; Siswi
            </h2>
            <p className="text-xs text-slate-600">
              Pilih satu jawaban terbaik (A, B, C, atau D) pada seluruh kartu pertanyaan di bawah ini, lalu klik tombol <strong>KIRIM JAWABAN QUIZ MINGGUAN</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-right">
              <div className="text-[10px] font-bold uppercase text-slate-500">Status Jawaban</div>
              <div className="text-xs font-mono-tabular font-extrabold text-slate-900">
                {answeredCount} / {questions.length} Soal Terjawab
              </div>
            </div>

            {challengeData.weeklyQuizSubmission && (
              <div
                data-testid="weekly-quiz-score-badge"
                className="px-4 py-2 rounded-xl bg-amber-100 border border-amber-300 text-right"
              >
                <div className="text-[10px] font-bold uppercase text-amber-800">Nilai Quiz</div>
                <div className="text-base font-mono-tabular font-extrabold text-amber-950">
                  {challengeData.weeklyQuizSubmission.score} / 100
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hasil Nilai Quiz Setelah Dikirim */}
        {challengeData.weeklyQuizSubmission && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h3 className="text-sm font-extrabold text-emerald-950">
                  Jawaban Quiz Mingguan Telah Dikirim &amp; Dinilai!
                </h3>
                <p className="text-xs text-emerald-800">
                  Nilai Akhir: <strong>{challengeData.weeklyQuizSubmission.score} / 100</strong> (Benar{' '}
                  {challengeData.weeklyQuizSubmission.correctCount} dari{' '}
                  {challengeData.weeklyQuizSubmission.totalQuestions} pertanyaan &middot; Dikirim pada{' '}
                  {challengeData.weeklyQuizSubmission.submittedAt}). Jawaban telah dikunci.
                </p>
              </div>
            </div>
          </div>
        )}

        {quizBanner && (
          <div
            role="alert"
            className={`p-3.5 rounded-xl text-xs font-extrabold border flex items-center gap-2 ${
              quizBanner.ok
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-orange-50 border-orange-300 text-orange-900'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{quizBanner.text}</span>
          </div>
        )}

        {/* Daftar Pertanyaan dalam Kartu Terpisah */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questions.map((q, idx) => {
            const isLocked = Boolean(challengeData.weeklyQuizSubmission?.submitted);
            const activeAnswersMap = isLocked
              ? challengeData.weeklyQuizSubmission!.answers
              : challengeData.weeklyQuizDraftAnswers;
            const selectedOptionIdx = activeAnswersMap[q.id];

            return (
              <div
                key={q.id}
                data-testid={`quiz-card-${idx + 1}`}
                className="rounded-2xl bg-slate-50/70 border border-slate-200 p-4 sm:p-5 flex flex-col justify-between space-y-3.5 shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 font-bold">
                    <span>
                      Pertanyaan {idx + 1} &middot; Kategori:{' '}
                      <strong className="text-emerald-700 uppercase">{q.category}</strong>
                    </span>
                    <span className="font-mono-tabular text-amber-700">+{q.xpReward} XP</span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 leading-relaxed">
                    {q.question}
                  </h3>
                </div>

                {/* 4 Pilihan Jawaban A, B, C, D */}
                <div className="space-y-2">
                  {q.options.map((optText, optIdx) => {
                    const optionLetter = ['A', 'B', 'C', 'D'][optIdx];
                    const isSelected = selectedOptionIdx === optIdx;
                    const isCorrectOption = q.correctIndex === optIdx;

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        disabled={isLocked}
                        onClick={() => onSelectQuizOption(q.id, optIdx)}
                        className={`w-full p-3 rounded-xl border text-left text-xs font-bold flex items-start gap-2.5 transition-all cursor-pointer disabled:cursor-default ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500/40'
                            : 'border-slate-200 bg-white hover:border-emerald-300 text-slate-800'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {optionLetter}
                        </span>
                        <div className="flex-1 pt-0.5 leading-snug">
                          <span>{optText}</span>
                          {isLocked && isCorrectOption && (
                            <span className="ml-2 text-[11px] font-extrabold text-emerald-700">
                              (Kunci Jawaban Benar ✓)
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tombol KIRIM JAWABAN QUIZ MINGGUAN */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Catatan: Seluruh pertanyaan wajib dijawab sebelum dikirim. Setelah dikirim, jawaban terkunci untuk periode ini.
          </span>
          <button
            type="button"
            disabled={Boolean(challengeData.weeklyQuizSubmission?.submitted)}
            onClick={handleKirimQuizMingguan}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer disabled:cursor-not-allowed shadow-sm"
          >
            {challengeData.weeklyQuizSubmission?.submitted
              ? `JAWABAN QUIZ TELAH DIKIRIM (NILAI: ${challengeData.weeklyQuizSubmission.score}/100)`
              : 'KIRIM JAWABAN QUIZ MINGGUAN'}
          </button>
        </div>
      </section>

      {/* =====================================================================
          7. FITUR BACA AL-QUR'AN (MAKSIMAL 5 POIN SETIAP SESI PEMBELAJARAN AGAMA)
         ===================================================================== */}
      <section
        aria-label="Fitur Baca Al-Qur'an"
        className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-700">
              <BookOpen className="w-4 h-4" />
              <span>SESI TILAWAH BERSAMA GURU AGAMA</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              BACA AL-QUR&apos;AN
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Maksimal 5 poin setiap sesi pembelajaran agama.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Total Poin Baca Al-Qur'an */}
            <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-right">
              <div className="text-[10px] font-bold uppercase text-amber-800">
                Total Poin Baca Al-Qur&apos;an
              </div>
              <div
                data-testid="total-quran-points"
                className="text-base font-mono-tabular font-extrabold text-amber-950"
              >
                {totalQuranPoints} Poin
              </div>
            </div>

            {/* Status Pelaksanaan Sesi Pembelajaran Hari Ini */}
            <div
              className={`px-4 py-2 rounded-xl border text-right ${
                quranSessionConfig.isOpen
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-orange-50 border-orange-300 text-orange-900'
              }`}
            >
              <div className="text-[10px] font-bold uppercase">
                Status Sesi Pembelajaran Hari Ini
              </div>
              <div className="text-xs font-extrabold flex items-center justify-end gap-1.5 mt-0.5">
                {quranSessionConfig.isOpen ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sesi Aktif Dibuka Guru ({quranSessionConfig.sessionTitle})</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-orange-600" />
                    <span>Sesi Ditutup Guru (Menunggu Guru Membuka Akses)</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {quranFeedback && (
          <div
            role="status"
            className={`p-3.5 rounded-xl text-xs font-extrabold border flex items-center gap-2 ${
              quranFeedback.ok
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-orange-50 border-orange-300 text-orange-900'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{quranFeedback.text}</span>
          </div>
        )}

        {!quranSessionConfig.isOpen && (
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-950 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-extrabold">
                  Akses Sesi Baca Al-Qur&apos;an Sedang Ditutup oleh Guru
                </div>
                <p className="text-orange-800 mt-0.5">
                  Sesi ini hanya dapat diakses apabila dibuka langsung oleh Guru. Siswa dapat menyimak arahan ustadz/guru saat sesi hafalan dimulai.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Pencatatan Baca Al-Qur'an */}
        <form onSubmit={handleSaveQuranClick} className="space-y-4">
          <div className="space-y-1.5">
            <span className="block text-xs font-extrabold text-slate-700">
              Pilihan Pelaksanaan Sesi Hari Ini:
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={!quranSessionConfig.isOpen || alreadyClaimedCurrentQuranSession}
                onClick={() => setQuranPerformed(true)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  quranPerformed === true
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200'
                }`}
              >
                Dilaksanakan: Ya (+5 Poin)
              </button>

              <button
                type="button"
                disabled={!quranSessionConfig.isOpen || alreadyClaimedCurrentQuranSession}
                onClick={() => setQuranPerformed(false)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  quranPerformed === false
                    ? 'bg-red-600 text-white border-red-700 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Dilaksanakan: Tidak (+0 Poin)
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="quran-tilawah-note"
              className="block text-xs font-extrabold text-slate-700 mb-1.5"
            >
              Catatan Tilawah, Halaman, atau Surah yang Dibaca:
            </label>
            <input
              id="quran-tilawah-note"
              type="text"
              disabled={!quranSessionConfig.isOpen || alreadyClaimedCurrentQuranSession}
              value={quranNote}
              onChange={(e) => setQuranNote(e.target.value)}
              placeholder="Membaca Surah An-Naba' ayat 1–20 bersama guru."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-60"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              {alreadyClaimedCurrentQuranSession
                ? '✓ Kamu sudah menyimpan pencatatan untuk sesi pembelajaran aktif ini.'
                : 'Pastikan catatan surah dan ayat diisi dengan jujur sesuai sesi bersama guru.'}
            </span>

            <button
              type="submit"
              disabled={!quranSessionConfig.isOpen || alreadyClaimedCurrentQuranSession}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold text-xs sm:text-sm transition-colors cursor-pointer disabled:cursor-not-allowed shadow-xs"
            >
              SIMPAN PENCATATAN BACA AL-QUR&apos;AN
            </button>
          </div>
        </form>
      </section>

      {/* =====================================================================
          8. FITUR HAFALAN AL-QUR'AN (TARGET KELAS 3–4 SD) — 10 SURAT & VALIDASI GURU
         ===================================================================== */}
      <section
        aria-label="Hafalan Al-Qur'an Target Kelas 3-4 SD"
        className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-700">
              <Award className="w-4 h-4" />
              <span>PROGRAM TAHFIDZ JUZ &apos;AMMA SD</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              HAFALAN AL-QUR&apos;AN (TARGET KELAS 3–4 SD)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Maksimal 10 poin setiap setoran berhasil. Guru memvalidasi hafalan setelah setoran diselesaikan.
            </p>
          </div>

          <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-right">
            <div className="text-[10px] font-bold uppercase text-emerald-800">
              Total Poin Hafalan Tervalidasi
            </div>
            <div
              data-testid="total-hafalan-points"
              className="text-base font-mono-tabular font-extrabold text-emerald-900"
            >
              {totalHafalanPoints} Poin
            </div>
          </div>
        </div>

        {/* Pemberitahuan Berwarna Oranye: KETENTUAN VALIDASI */}
        <div
          role="note"
          className="p-4 rounded-2xl bg-orange-50 border border-orange-300 text-orange-950 text-xs sm:text-sm leading-relaxed"
        >
          <strong className="font-extrabold text-orange-900 block mb-0.5">
            KETENTUAN VALIDASI:
          </strong>
          Murid tidak menentukan sendiri bahwa hafalannya sudah selesai. Hafalan harus disetorkan kepada guru. Setelah setoran divalidasi oleh guru, sistem memberikan 10 poin penuh.
        </div>

        {/* B. Filter Kategori Tingkat Hafalan */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: 'Semua', label: `Semua (${TEN_HAFALAN_SURAHS.length})` },
              { key: 'Level 1: Mudah', label: 'Level 1: Mudah' },
              { key: 'Level 2: Lanjut', label: 'Level 2: Lanjut' },
              { key: 'Level 3: Menengah', label: 'Level 3: Menengah' },
              { key: 'Level 4: Lanjutan', label: 'Level 4: Lanjutan' },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setHafalanFilter(f.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                hafalanFilter === f.key
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* A. Grid 10 Pilihan Target Hafalan Surat */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {filteredSurahs.map((surah) => {
            const isSelected = selectedSurah.id === surah.id;
            const rec = challengeData.hafalanRecords[surah.id];
            const status = rec ? rec.status : 'belum_disetorkan';

            return (
              <button
                key={surah.id}
                type="button"
                data-testid={`surah-card-${surah.id}`}
                onClick={() => {
                  setSelectedSurahId(surah.id);
                  setHafalanFeedback(null);
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/30 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="space-y-1.5 w-full">
                  <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-slate-500">
                    <span>QS. No. {surah.surahNumber}</span>
                    <span className="text-emerald-700 font-extrabold">{surah.level}</span>
                  </div>

                  <div className="flex items-baseline justify-between gap-2 pt-0.5">
                    <h3 className="text-sm font-extrabold text-slate-900">{surah.name}</h3>
                    <span className="text-base font-bold text-emerald-900">
                      {surah.arabicName}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-600">
                    Jumlah: <strong>{surah.versesCount} ayat</strong>
                  </div>
                </div>

                {/* Status Badge on Surah Card */}
                <div className="pt-2 border-t border-slate-200/70 w-full flex items-center justify-between text-[11px] font-extrabold">
                  {status === 'diterima' && (
                    <span className="text-emerald-700">✓ Diterima (+10 Poin)</span>
                  )}
                  {status === 'menunggu_pemeriksaan' && (
                    <span className="text-amber-700">⏳ Menunggu Guru</span>
                  )}
                  {status === 'perlu_perbaikan' && (
                    <span className="text-red-600">↻ Perlu Perbaikan</span>
                  )}
                  {status === 'belum_disetorkan' && (
                    <span className="text-slate-400">Belum Disetorkan</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* C. Panel Sistem Penyetoran Hafalan untuk Surat yang Dipilih */}
        <div
          data-testid="selected-surah-submission-panel"
          className="p-5 rounded-2xl bg-slate-50 border border-emerald-200 space-y-4"
        >
          {hafalanFeedback && (
            <div
              role="status"
              className={`p-3 rounded-xl text-xs font-extrabold border ${
                hafalanFeedback.ok
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-orange-50 border-orange-300 text-orange-900'
              }`}
            >
              {hafalanFeedback.text}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-emerald-700">
                Surat yang Dipilih &middot; QS. Nomor {selectedSurah.surahNumber} &middot;{' '}
                {selectedSurah.level}
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                {selectedSurah.name} ({selectedSurah.versesCount} ayat) — {selectedSurah.arabicName}
              </h3>
              <p className="text-sm font-bold text-slate-800 pt-0.5">
                {selectedSurah.firstVerseArabic}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Hafalan */}
              <div className="px-4 py-2.5 rounded-xl bg-white border border-slate-200">
                <div className="text-[10px] font-bold uppercase text-slate-500">
                  Status Hafalan Saat Ini
                </div>
                <div
                  data-testid="selected-surah-status"
                  className="text-xs sm:text-sm font-extrabold mt-0.5"
                >
                  {selectedSurahStatus === 'diterima' && (
                    <span className="text-emerald-700">
                      Diterima oleh Guru (+10 Poin Penuh) ✓
                    </span>
                  )}
                  {selectedSurahStatus === 'menunggu_pemeriksaan' && (
                    <span className="text-amber-700">
                      Menunggu Pemeriksaan Guru (0 Poin)
                    </span>
                  )}
                  {selectedSurahStatus === 'perlu_perbaikan' && (
                    <span className="text-red-600">
                      Perlu Perbaikan — Silakan Setorkan Kembali
                    </span>
                  )}
                  {selectedSurahStatus === 'belum_disetorkan' && (
                    <span className="text-slate-700">Belum Disetorkan</span>
                  )}
                </div>
              </div>

              {/* Status Sesi Guru untuk Hafalan */}
              {!quranSessionConfig.isOpen && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2">
                  <Lock className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>Sesi Setoran Hafalan ditutup oleh Guru. Tunggu hingga Guru membuka sesi tilawah/hafalan di Panel Pembimbing.</span>
                </div>
              )}

              {/* Tombol Ajukan Setoran Hafalan */}
              <button
                type="button"
                disabled={
                  !quranSessionConfig.isOpen ||
                  selectedSurahStatus === 'diterima' ||
                  selectedSurahStatus === 'menunggu_pemeriksaan'
                }
                onClick={handleAjukanSetoranClick}
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold text-xs sm:text-sm transition-colors cursor-pointer disabled:cursor-not-allowed shadow-xs"
              >
                {!quranSessionConfig.isOpen
                  ? 'Sesi Hafalan Ditutup Guru'
                  : selectedSurahStatus === 'diterima'
                    ? 'Hafalan Sudah Diterima (+10 Poin)'
                    : selectedSurahStatus === 'menunggu_pemeriksaan'
                      ? 'Menunggu Pemeriksaan Guru...'
                      : 'Ajukan Setoran Hafalan'}
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span>
              Keterangan: Setelah menekan <strong>Ajukan Setoran Hafalan</strong>, siswa menyetorkan bacaan langsung kepada guru dan menunggu hasil evaluasi langsung dari guru pembimbing.
            </span>
            {selectedSurahRecord?.teacherNote && (
              <span className="font-bold text-emerald-800">
                Catatan Guru: &ldquo;{selectedSurahRecord.teacherNote}&rdquo;
              </span>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          9. FITUR PENDUKUNG:
             - VERIFIKASI SANDI SESI AL-QUR'AN & HAFALAN (753690)
             - CATATAN REFLEKSI NURANI HARIAN
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Verifikasi Sandi Sesi Guru (753690) */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="text-xs font-extrabold uppercase text-emerald-800 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>Verifikasi Sandi Sesi Al-Qur&apos;an &amp; Hafalan</span>
            </div>
            <span
              className={`text-xs font-extrabold px-2 py-0.5 rounded-lg ${
                student.unlockedQuranHafalan
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {student.unlockedQuranHafalan ? 'Sesi Terbuka ✓' : 'Terkunci Sandi'}
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Sesi ini dirahasiakan dan hanya dapat dibuka saat didampingi oleh Guru atau Pembimbing dengan memasukkan sandi pembimbing yang sah.
          </p>

          {quranPinMsg && (
            <div
              className={`p-2.5 rounded-xl text-xs font-bold ${
                quranPinMsg.ok
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {quranPinMsg.text}
            </div>
          )}

          <form onSubmit={handleUnlockQuranByPin} className="flex items-center gap-2">
            <input
              type="password"
              aria-label="Masukkan Sandi Sesi Baca Al-Qur'an"
              value={quranPinInput}
              onChange={(e) => setQuranPinInput(e.target.value)}
              placeholder="Masukkan sandi rahasia guru..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold cursor-pointer shrink-0"
            >
              Buka Sesi
            </button>
          </form>
        </div>

        {/* Catatan Refleksi Nurani Harian */}
        <form
          onSubmit={handleReflectionSubmit}
          className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-3.5 shadow-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
              <HeartHandshake className="w-4 h-4 text-amber-600" />
              <span>Catatan Refleksi Nurani Harian</span>
            </div>
            {reflectionSaved && (
              <span className="text-xs font-extrabold text-emerald-700">
                ✓ Tersimpan ke Riwayat &amp; Guru!
              </span>
            )}
          </div>

          <textarea
            rows={2}
            aria-label="Catatan Refleksi Nurani"
            value={reflectionInput}
            onChange={(e) => setReflectionInput(e.target.value)}
            placeholder="Tuliskan rasa syukur, evaluasi diri, atau doa terbaikmu hari ini..."
            className="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
          />

          <div className="flex items-center justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simpan Refleksi</span>
            </button>
          </div>
        </form>
      </div>

      {/* =====================================================================
          MODAL RAHASIA: BUKA KUNCI IBADAH OLEH GURU / ORANG TUA
          (SANDI DIRAHASIAKAN DAN TIDAK DIPERLIHATKAN KEPADA SISWA)
         ===================================================================== */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border-2 border-emerald-800 space-y-4 animate-stage-reveal">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Buka Kunci Akses Ibadah
                  </h3>
                  <p className="text-xs text-slate-500">
                    Khusus Guru atau Orang Tua Pendamping
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Masukkan PIN rahasia untuk membuka pencatatan Salat 5 Waktu &amp; Sunah selama 7 hari. Sandi dirahasiakan dan tidak ditampilkan kepada siswa.
            </p>

            {pinError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs font-bold">
                {pinError}
              </div>
            )}

            <form onSubmit={handleUnlockSalatPinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PIN Khusus Guru / Orang Tua:
                </label>
                <input
                  type="password"
                  autoFocus
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Masukkan PIN rahasia..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-mono tracking-widest text-slate-900 focus:outline-none focus:border-emerald-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  *PIN hanya dimiliki guru atau orang tua. Siswa dilarang membuka sendiri.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPinModalOpen(false);
                    setPinInput('');
                    setPinError(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Buka Kunci Ibadah</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
