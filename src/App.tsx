/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  ChatMessage,
  DEFAULT_SESSION_PASSCODES,
  DailyTask,
  INITIAL_CHAT_MESSAGES,
  INITIAL_DAILY_TASKS,
  INITIAL_PRAYER_SUBMISSIONS,
  INITIAL_STUDENTS,
  JUBAH_DESIGNS,
  LanguageCode,
  PrayerPromptItem,
  PrayerRecordingSubmission,
  QuizQuestion,
  SessionPasscodes,
  StudentAccount,
  answerQuizQuestion,
  cleanBedroomItem,
  feedCharacter,
  getAvailableSholatPoints,
  makeBedroomMessy,
  purchaseJubahWithSholatPoints,
  toggleTaskCompletion,
  updateStudentPassword,
} from './game/rules';
import {
  DAYS_OF_WEEK,
  DEFAULT_PARENT_TEACHER_PIN,
  DayOfWeekId,
  FarduPrayerId,
  HafalanSurahTarget,
  MutabaahHistoryEntry,
  PrayerPlace,
  QuranReadingSessionConfig,
  SD_WEEKLY_QUIZ_QUESTIONS,
  StudentMutabaahChallengeData,
  SunnahPrayerId,
  WeeklyDailyWorshipMap,
  archiveAndResetWeeklyChallenge,
  calculateDailyWorshipPoints,
  calculateSingleFarduPoints,
  calculateTotalEarnedSholatPoints,
  calculateWeeklyWorshipSummary,
  calculateWeeklyWorshipSummaryFromDailySchedule,
  createBlankDailyWorshipSchedule,
  createInitialStudentMutabaahData,
  getWibWeeklyPeriodInfo,
  normalizeStudentChallengeData,
  recordQuranSessionLog,
  submitHafalanSetoran,
  submitWeeklyQuizBatch,
  updateFarduPrayerChoice,
  validateHafalanByTeacher,
  verifyParentTeacherPin,
} from './game/mutabaahChallenges';
import { LoginPage } from './components/LoginPage';
import { ActiveTab, DashboardHeader } from './components/DashboardHeader';
import { RobloxCharacterCanvas } from './components/RobloxCharacterCanvas';
import { ChallengesView } from './components/ChallengesView';
import { RiwayatView } from './components/RiwayatView';
import { StudentChatDrawer } from './components/StudentChatDrawer';
import { SettingsView } from './components/SettingsView';
import { AdminMasterDashboard } from './components/AdminMasterDashboard';
import { soundFX } from './utils/sound';
import {
  ClipboardCheck,
  History,
  MessageCircle,
  Shield,
} from 'lucide-react';

const STORAGE_KEY = 'mutabaah_perilaku_persisted_v2';

function loadPersistedState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function App() {
  const persisted = loadPersistedState();

  const [language, setLanguage] = useState<LanguageCode>(
    () => persisted?.language || 'id'
  );
  const [students, setStudents] = useState<StudentAccount[]>(() => {
    const baseList: StudentAccount[] = Array.isArray(persisted?.students)
      ? persisted.students
      : INITIAL_STUDENTS;
    const trialAccounts = INITIAL_STUDENTS.filter(
      (s) => s.id === 'student_putra' || s.id === 'student_putri'
    );
    const missingTrials = trialAccounts.filter(
      (t) =>
        !baseList.some(
          (b) => b.id === t.id || b.email.toLowerCase() === t.email.toLowerCase()
        )
    );
    return [...missingTrials, ...baseList];
  });
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return INITIAL_STUDENTS[0].id;
      }
      if (params.get('tab') === 'tantangan') {
        return persisted?.currentStudentId || INITIAL_STUDENTS[0].id;
      }
    }
    return persisted?.currentStudentId ?? null;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tab');
      if (t === 'tantangan' || t === 'riwayat' || t === 'pengaturan' || t === 'beranda') {
        return t;
      }
    }
    return persisted?.activeTab || 'beranda';
  });

  const [tasksByStudent, setTasksByStudent] = useState<Record<string, DailyTask[]>>(
    () =>
      persisted?.tasksByStudent || {
        student_putra: INITIAL_DAILY_TASKS,
        student_putri: INITIAL_DAILY_TASKS.map((t) =>
          t.id === 'hafalan_juz_amma' ? { ...t, completed: true } : t
        ),
      }
  );

  // Per-student Tantangan Mutaba'ah data (Fardu 5 waktu, Sunah, Quiz Mingguan, Baca Al-Qur'an, 10 Hafalan Surahs, Riwayat)
  const [challengeDataByStudent, setChallengeDataByStudent] = useState<
    Record<string, StudentMutabaahChallengeData>
  >(() => {
    const map: Record<string, StudentMutabaahChallengeData> = {};
    const persistedMap = persisted?.challengeDataByStudent || {};

    INITIAL_STUDENTS.forEach((st, idx) => {
      map[st.id] = normalizeStudentChallengeData(
        persistedMap[st.id],
        st.id,
        idx
      );
    });

    // Also preserve any dynamic students registered during session
    Object.keys(persistedMap).forEach((stId, idx) => {
      if (!map[stId]) {
        map[stId] = normalizeStudentChallengeData(
          persistedMap[stId],
          stId,
          idx
        );
      }
    });

    return map;
  });

  // Teacher / Admin Sesi Baca Al-Qur'an Configuration (open by default so students can test & teacher can close/open)
  const [quranSessionConfig, setQuranSessionConfig] =
    useState<QuranReadingSessionConfig>(
      () =>
        persisted?.quranSessionConfig || {
          isOpen: true,
          sessionId: 'sesi_agama_1',
          sessionTitle: "Sesi Pembelajaran Agama & Tilawah Al-Qur'an",
          openedBy: 'Guru Pendidikan Agama',
          openedAt: 'Hari ini, 07.30 WIB',
        }
    );

  // Quiz Mingguan Questions (SD-appropriate)
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    () => persisted?.questions || SD_WEEKLY_QUIZ_QUESTIONS
  );
  const [passcodes, setPasscodes] = useState<SessionPasscodes>(
    () => persisted?.passcodes || DEFAULT_SESSION_PASSCODES
  );
  const [prayerSubmissions, setPrayerSubmissions] = useState<
    PrayerRecordingSubmission[]
  >(() => persisted?.prayerSubmissions || INITIAL_PRAYER_SUBMISSIONS);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(
    INITIAL_CHAT_MESSAGES
  );
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(2);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'info';
    text: string;
  } | null>(null);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          language,
          students,
          currentStudentId,
          activeTab,
          tasksByStudent,
          challengeDataByStudent,
          quranSessionConfig,
          questions,
          passcodes,
          prayerSubmissions,
        })
      );
    } catch {
      // ignore storage quota errors
    }
  }, [
    language,
    students,
    currentStudentId,
    activeTab,
    tasksByStudent,
    challengeDataByStudent,
    quranSessionConfig,
    questions,
    passcodes,
    prayerSubmissions,
  ]);

  const currentStudent = students.find((s) => s.id === currentStudentId) || null;
  const currentTasks = currentStudent
    ? tasksByStudent[currentStudent.id] || INITIAL_DAILY_TASKS
    : INITIAL_DAILY_TASKS;

  const rawChallengeData = currentStudent
    ? challengeDataByStudent[currentStudent.id] ||
      createInitialStudentMutabaahData(currentStudent.id, 0)
    : createInitialStudentMutabaahData('student_putra', 0);

  const currentChallengeData: StudentMutabaahChallengeData =
    normalizeStudentChallengeData(
      rawChallengeData,
      currentStudent?.id || 'student_putra',
      0
    );

  useEffect(() => {
    document.body.dataset.state =
      currentStudent || isAdminLoggedIn ? 'playing' : 'title';
  }, [currentStudent, isAdminLoggedIn]);

  const updateCurrentStudent = (updated: StudentAccount) => {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const updateStudentChallengeData = (
    studentId: string,
    updater: (prev: StudentMutabaahChallengeData) => StudentMutabaahChallengeData
  ) => {
    setChallengeDataByStudent((prev) => {
      const existing =
        prev[studentId] || createInitialStudentMutabaahData(studentId, 0);
      return {
        ...prev,
        [studentId]: updater(existing),
      };
    });
  };

  const getNowWibLabel = () => {
    const info = getWibWeeklyPeriodInfo();
    return `Hari ini, ${info.wibTimeFormatted}`;
  };

  const handleLoginSuccess = (student: StudentAccount) => {
    soundFX.playCoinReward();
    setIsAdminLoggedIn(false);
    setStudents((prev) => {
      if (prev.some((s) => s.id === student.id)) return prev;
      return [...prev, student];
    });
    setChallengeDataByStudent((prev) => {
      if (prev[student.id]) return prev;
      return {
        ...prev,
        [student.id]: createInitialStudentMutabaahData(
          student.id,
          Object.keys(prev).length
        ),
      };
    });
    setCurrentStudentId(student.id);
    setActiveTab('beranda');
    setFeedbackBanner(null);
  };

  const handleAdminLoginSuccess = () => {
    soundFX.playCoinReward();
    setIsAdminLoggedIn(true);
    setCurrentStudentId(null);
    setFeedbackBanner(null);
  };

  const handleLogout = () => {
    setIsChatOpen(false);
    setIsAdminLoggedIn(false);
    setCurrentStudentId(null);
    setActiveTab('beranda');
  };

  // =========================================================================
  // HANDLERS FOR TANTANGAN MUTABA'AH SISWA & SISWI (7 HARI: SENIN - MINGGU)
  // =========================================================================
  const handleSelectDay = (dayId: DayOfWeekId) => {
    if (!currentStudent) return;
    updateStudentChallengeData(currentStudent.id, (prev) => ({
      ...prev,
      selectedDay: dayId,
    }));
  };

  const handleUnlockSalatWithPin = (
    inputPin: string
  ): { ok: boolean; message: string } => {
    if (!currentStudent) {
      return { ok: false, message: 'Siswa belum masuk.' };
    }
    const correctPin =
      currentChallengeData.parentTeacherPin || DEFAULT_PARENT_TEACHER_PIN;
    const isValid = verifyParentTeacherPin(inputPin, correctPin);

    if (!isValid) {
      return {
        ok: false,
        message: 'Kata sandi / PIN Guru & Orang Tua tidak sesuai.',
      };
    }

    soundFX.playCoinReward();
    updateStudentChallengeData(currentStudent.id, (prev) => ({
      ...prev,
      salatAccessLocked: false,
    }));

    return {
      ok: true,
      message:
        'Akses pencatatan ibadah berhasil dibuka oleh Guru / Orang Tua!',
    };
  };

  const handleUpdateFardu = (
    dayId: DayOfWeekId,
    prayerId: FarduPrayerId,
    patch: { performed?: boolean; congregation?: boolean; place?: PrayerPlace }
  ) => {
    if (!currentStudent) return;
    soundFX.playCleanRoom();

    updateStudentChallengeData(currentStudent.id, (prev) => {
      if (prev.salatAccessLocked) return prev;
      const daySchedule =
        prev.dailyWorship?.[dayId] || createBlankDailyWorshipSchedule();
      const currentRec = daySchedule.fardu[prayerId];
      const nextRec = updateFarduPrayerChoice(currentRec, patch);
      const nextFardu = {
        ...daySchedule.fardu,
        [prayerId]: nextRec,
      };

      const updatedDailyWorship: WeeklyDailyWorshipMap = {
        ...prev.dailyWorship,
        [dayId]: {
          ...daySchedule,
          fardu: nextFardu,
        },
      };

      const pts = calculateSingleFarduPoints(nextRec);
      const periodLabel = `${prev.currentPeriodStartLabel} – ${prev.currentPeriodEndLabel}`;
      const dayLabel = DAYS_OF_WEEK.find((d) => d.id === dayId)?.label || dayId;
      const newHist: MutabaahHistoryEntry = {
        id: `hist_fardu_${Date.now()}`,
        studentId: currentStudent.id,
        category: 'salat_fardu',
        title: `Pencatatan ${nextRec.name} (Hari ${dayLabel})`,
        detail:
          nextRec.performed === true
            ? `Dilaksanakan: Ya (+5) · Berjamaah: ${
                nextRec.congregation ? 'Ya (+3)' : 'Tidak (+0)'
              } · Tempat: ${
                nextRec.place === 'masjid'
                  ? 'Masjid (+2)'
                  : nextRec.place === 'rumah'
                    ? 'Rumah (+1)'
                    : 'Belum dipilih'
              }`
            : 'Dilaksanakan: Tidak (0 Poin — Berjamaah & Tempat Terkunci)',
        points: pts,
        statusLabel: 'Tersimpan',
        timestamp: `${dayLabel}, ${getNowWibLabel()}`,
        periodLabel,
      };

      return {
        ...prev,
        fardu: dayId === prev.selectedDay ? nextFardu : prev.fardu,
        dailyWorship: updatedDailyWorship,
        historyEntries: [newHist, ...prev.historyEntries],
      };
    });
  };

  const handleUpdateSunnah = (
    dayId: DayOfWeekId,
    prayerId: SunnahPrayerId,
    performed: boolean
  ) => {
    if (!currentStudent) return;
    soundFX.playCleanRoom();

    updateStudentChallengeData(currentStudent.id, (prev) => {
      if (prev.salatAccessLocked) return prev;
      const daySchedule =
        prev.dailyWorship?.[dayId] || createBlankDailyWorshipSchedule();
      const currentRec = daySchedule.sunnah[prayerId];
      const nextRec = { ...currentRec, performed };
      const nextSunnah = {
        ...daySchedule.sunnah,
        [prayerId]: nextRec,
      };

      const updatedDailyWorship: WeeklyDailyWorshipMap = {
        ...prev.dailyWorship,
        [dayId]: {
          ...daySchedule,
          sunnah: nextSunnah,
        },
      };

      const pts = performed ? 5 : 0;
      const periodLabel = `${prev.currentPeriodStartLabel} – ${prev.currentPeriodEndLabel}`;
      const dayLabel = DAYS_OF_WEEK.find((d) => d.id === dayId)?.label || dayId;
      const newHist: MutabaahHistoryEntry = {
        id: `hist_sunnah_${Date.now()}`,
        studentId: currentStudent.id,
        category: 'ibadah_sunah',
        title: `Pencatatan ${nextRec.name} - Hari ${dayLabel} (Sunah)`,
        detail: performed
          ? 'Dilaksanakan: Ya (+5 Poin)'
          : 'Dilaksanakan: Tidak (0 Poin)',
        points: pts,
        statusLabel: 'Tersimpan',
        timestamp: `${dayLabel}, ${getNowWibLabel()}`,
        periodLabel,
      };

      return {
        ...prev,
        sunnah: dayId === prev.selectedDay ? nextSunnah : prev.sunnah,
        dailyWorship: updatedDailyWorship,
        historyEntries: [newHist, ...prev.historyEntries],
      };
    });
  };

  const handleToggleSalatAccessLock = (forceState?: boolean) => {
    if (!currentStudent) return;
    soundFX.playCleanRoom();
    updateStudentChallengeData(currentStudent.id, (prev) => ({
      ...prev,
      salatAccessLocked:
        typeof forceState === 'boolean' ? forceState : !prev.salatAccessLocked,
    }));
  };

  const handleArchiveAndResetWeek = () => {
    if (!currentStudent) return;
    soundFX.playCoinReward();
    const wib = getWibWeeklyPeriodInfo();
    updateStudentChallengeData(currentStudent.id, (prev) =>
      archiveAndResetWeeklyChallenge(
        prev,
        wib.startDateLabel,
        wib.endDateLabel,
        `${wib.periodKey}_${Date.now()}`,
        getNowWibLabel()
      )
    );
  };

  const handleSelectQuizOption = (questionId: string, optionIdx: number) => {
    if (!currentStudent) return;
    updateStudentChallengeData(currentStudent.id, (prev) => {
      if (prev.weeklyQuizSubmission?.submitted) return prev;
      return {
        ...prev,
        weeklyQuizDraftAnswers: {
          ...prev.weeklyQuizDraftAnswers,
          [questionId]: optionIdx,
        },
      };
    });
  };

  const handleSubmitWeeklyQuiz = (): { ok: boolean; message: string } => {
    if (!currentStudent) {
      return { ok: false, message: 'Siswa belum masuk.' };
    }
    const periodLabel = `${currentChallengeData.currentPeriodStartLabel} – ${currentChallengeData.currentPeriodEndLabel}`;
    const res = submitWeeklyQuizBatch(
      questions,
      currentChallengeData.weeklyQuizDraftAnswers,
      currentChallengeData.weeklyQuizSubmission,
      periodLabel,
      getNowWibLabel()
    );

    if (res.ok && res.submission) {
      const submissionObj = res.submission;
      updateStudentChallengeData(currentStudent.id, (prev) => ({
        ...prev,
        weeklyQuizSubmission: submissionObj,
        historyEntries: [
          {
            id: `hist_quiz_${Date.now()}`,
            studentId: currentStudent.id,
            category: 'quiz_mingguan',
            title: `Pengiriman Quiz Mingguan (Nilai: ${submissionObj.score}/100)`,
            detail: `Menjawab benar ${submissionObj.correctCount} dari ${submissionObj.totalQuestions} pertanyaan wajib`,
            points: submissionObj.score,
            statusLabel: 'Selesai & Dinilai',
            timestamp: submissionObj.submittedAt,
            periodLabel,
          },
          ...prev.historyEntries,
        ],
      }));

      updateCurrentStudent({
        ...currentStudent,
        xp: currentStudent.xp + submissionObj.correctCount * 40,
        coins: currentStudent.coins + submissionObj.correctCount * 25,
      });
    }

    return { ok: res.ok, message: res.message };
  };

  const handleSaveQuranReadingLog = (payload: {
    performed: boolean | null;
    note: string;
  }): { ok: boolean; message: string } => {
    if (!currentStudent) {
      return { ok: false, message: 'Siswa belum masuk.' };
    }
    const periodLabel = `${currentChallengeData.currentPeriodStartLabel} – ${currentChallengeData.currentPeriodEndLabel}`;
    const res = recordQuranSessionLog(
      currentChallengeData.quranLogs,
      quranSessionConfig,
      {
        performed: payload.performed,
        note: payload.note,
        dateLabel: getNowWibLabel(),
        periodLabel,
      }
    );

    if (res.ok && res.newEntry) {
      const entry = res.newEntry;
      updateStudentChallengeData(currentStudent.id, (prev) => ({
        ...prev,
        quranLogs: res.updatedLogs,
        historyEntries: [
          {
            id: `hist_quran_${Date.now()}`,
            studentId: currentStudent.id,
            category: 'baca_alquran',
            title: `Baca Al-Qur'an (${quranSessionConfig.sessionTitle})`,
            detail: entry.note,
            points: entry.points,
            statusLabel: entry.performed ? 'Dilaksanakan (+5 Poin)' : 'Tidak Dilaksanakan (0 Poin)',
            timestamp: entry.dateLabel,
            periodLabel,
          },
          ...prev.historyEntries,
        ],
      }));
    }

    return { ok: res.ok, message: res.message };
  };

  const handleSubmitHafalan = (
    surah: HafalanSurahTarget
  ): { ok: boolean; message: string } => {
    if (!currentStudent) {
      return { ok: false, message: 'Siswa belum masuk.' };
    }
    const nowLabel = getNowWibLabel();
    const res = submitHafalanSetoran(
      currentChallengeData.hafalanRecords,
      surah,
      nowLabel
    );

    if (res.ok) {
      const periodLabel = `${currentChallengeData.currentPeriodStartLabel} – ${currentChallengeData.currentPeriodEndLabel}`;
      updateStudentChallengeData(currentStudent.id, (prev) => ({
        ...prev,
        hafalanRecords: res.updatedRecords,
        historyEntries: [
          {
            id: `hist_hafalan_sub_${Date.now()}`,
            studentId: currentStudent.id,
            category: 'hafalan_alquran',
            title: `Pengajuan Setoran Hafalan: ${surah.name} (${surah.versesCount} ayat)`,
            detail: `${surah.level} · Menunggu pemeriksaan & validasi guru`,
            points: 0,
            statusLabel: 'Menunggu Pemeriksaan Guru',
            timestamp: nowLabel,
            periodLabel,
          },
          ...prev.historyEntries,
        ],
      }));
    }

    return { ok: res.ok, message: res.message };
  };

  const handleValidateStudentHafalan = (
    studentId: string,
    surahId: string,
    decision: 'diterima' | 'perlu_perbaikan',
    teacherNote: string
  ) => {
    const nowLabel = getNowWibLabel();
    updateStudentChallengeData(studentId, (prev) => {
      const res = validateHafalanByTeacher(
        prev.hafalanRecords,
        surahId,
        decision,
        teacherNote,
        nowLabel
      );
      if (!res.ok) return prev;

      const surahRec = res.updatedRecords[surahId];
      const periodLabel = `${prev.currentPeriodStartLabel} – ${prev.currentPeriodEndLabel}`;
      const newHist: MutabaahHistoryEntry = {
        id: `hist_hafalan_val_${Date.now()}`,
        studentId,
        category: 'hafalan_alquran',
        title: `Validasi Guru: ${surahRec.surahName} — ${
          decision === 'diterima' ? 'Diterima (+10 Poin)' : 'Perlu Perbaikan'
        }`,
        detail: surahRec.teacherNote || '',
        points: res.pointsDelta,
        statusLabel:
          decision === 'diterima' ? 'Diterima Guru (+10 Poin)' : 'Perlu Perbaikan',
        timestamp: nowLabel,
        periodLabel,
      };

      return {
        ...prev,
        hafalanRecords: res.updatedRecords,
        historyEntries: [newHist, ...prev.historyEntries],
      };
    });
  };

  const handleToggleQuranSessionOpen = (
    nextOpen: boolean,
    sessionTitle: string
  ) => {
    setQuranSessionConfig((prev) => ({
      isOpen: nextOpen,
      sessionId: nextOpen ? `sesi_agama_${Date.now()}` : prev.sessionId,
      sessionTitle:
        sessionTitle.trim() || "Sesi Pembelajaran Agama & Tilawah Al-Qur'an",
      openedBy: 'Guru Pendidikan Agama',
      openedAt: getNowWibLabel(),
    }));
  };

  // =========================================================================
  // EXISTING BERANDA & BEDROOM HANDLERS (PRESERVED 100%)
  // =========================================================================
  const handleToggleTask = (taskId: string) => {
    if (!currentStudent) return;
    const res = toggleTaskCompletion(currentTasks, currentStudent, taskId);
    setTasksByStudent((prev) => ({
      ...prev,
      [currentStudent.id]: res.updatedTasks,
    }));
    updateCurrentStudent(res.updatedStudent);

    if (res.deltaCoins > 0) {
      soundFX.playCoinReward();
      if (res.unlockedNewJubah) {
        setFeedbackBanner({
          type: 'success',
          text: `MasyaAllah! Tantangan selesai (+${res.deltaXp} XP) dan membuka ${res.unlockedNewJubah.name}!`,
        });
      } else {
        setFeedbackBanner({
          type: 'success',
          text: `Alhamdulillah! Tantangan ibadah selesai (+${res.deltaXp} XP).`,
        });
      }
    } else {
      setFeedbackBanner(null);
    }
  };

  const handleAddCustomTask = (
    newTask: Omit<DailyTask, 'id' | 'completed' | 'streakDays'>
  ) => {
    if (!currentStudent) return;
    const created: DailyTask = {
      ...newTask,
      id: `task_${Date.now()}`,
      completed: false,
      streakDays: 1,
    };
    setTasksByStudent((prev) => ({
      ...prev,
      [currentStudent.id]: [
        created,
        ...(prev[currentStudent.id] || INITIAL_DAILY_TASKS),
      ],
    }));
  };

  const handleAnswerQuestion = (question: QuizQuestion, selectedIdx: number) => {
    if (!currentStudent) {
      return { isCorrect: false, message: 'Siswa belum masuk.' };
    }
    const res = answerQuizQuestion(currentStudent, question, selectedIdx);
    if (res.isCorrect && !res.alreadyAnswered) {
      updateCurrentStudent(res.updatedStudent);
      setFeedbackBanner({
        type: 'success',
        text: res.message,
      });
    }
    return {
      isCorrect: res.isCorrect,
      message: res.message,
    };
  };

  const handleUnlockQuranHafalan = () => {
    if (!currentStudent) return;
    updateCurrentStudent({
      ...currentStudent,
      unlockedQuranHafalan: true,
    });
    setFeedbackBanner({
      type: 'success',
      text: "Alhamdulillah! Sesi Baca Al-Qur'an & Sesi Hafalan berhasil dibuka dengan sandi 753690.",
    });
  };

  const handleUnlockPrayerRecording = () => {
    if (!currentStudent) return;
    updateCurrentStudent({
      ...currentStudent,
      unlockedPrayerRecording: true,
    });
    setFeedbackBanner({
      type: 'success',
      text: 'Alhamdulillah! Sesi Rekaman Doa berhasil dibuka dengan sandi 1234LIMA.',
    });
  };

  const handleSubmitPrayerRecording = (
    prayer: PrayerPromptItem,
    durationSec: number
  ) => {
    if (!currentStudent) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newSub: PrayerRecordingSubmission = {
      id: `rec_${Date.now()}`,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      studentEmail: currentStudent.email,
      prayerId: prayer.id,
      prayerTitle: prayer.title,
      durationSeconds: durationSec,
      submittedAt: timeStr,
      notes: 'Rekaman suara doa harian lancar & jelas',
      verifiedByAdmin: false,
    };

    setPrayerSubmissions((prev) => [newSub, ...prev]);
    updateCurrentStudent({
      ...currentStudent,
      xp: currentStudent.xp + prayer.xpReward,
      coins: currentStudent.coins + 65,
    });
    setFeedbackBanner({
      type: 'success',
      text: `Alhamdulillah! Rekaman ${prayer.title} (${durationSec} detik) terkirim ke Guru/Admin Master (+${prayer.xpReward} XP)!`,
    });
  };

  const handleCleanRoom = (target: 'bed' | 'clothes' | 'all') => {
    if (!currentStudent) return;
    const res = cleanBedroomItem(currentStudent, target);
    updateCurrentStudent(res.updatedStudent);
    setFeedbackBanner({
      type: 'success',
      text: res.message,
    });
  };

  const handleMakeRoomMessy = () => {
    if (!currentStudent) return;
    const messy = makeBedroomMessy(currentStudent);
    updateCurrentStudent(messy);
    setFeedbackBanner({
      type: 'info',
      text: 'Kamar kembali berantakan! Lihat wajah karaktermu menjadi merah & marah.',
    });
  };

  const handleFeedCharacter = (foodName: string) => {
    if (!currentStudent) return;
    const res = feedCharacter(currentStudent, foodName);
    updateCurrentStudent(res.updatedStudent);
    setFeedbackBanner({
      type: 'success',
      text: res.message,
    });
  };

  const handleSelectJubah = (
    jubahId: string
  ): { ok: boolean; message: string; purchasedNew: boolean } => {
    if (!currentStudent) {
      return { ok: false, message: 'Siswa belum masuk.', purchasedNew: false };
    }
    const totalEarnedSholatPts = calculateTotalEarnedSholatPoints(
      currentChallengeData.dailyWorship
    );
    const res = purchaseJubahWithSholatPoints(
      currentStudent,
      jubahId,
      totalEarnedSholatPts
    );
    if (res.ok) {
      if (res.purchasedNew) {
        soundFX.playCoinReward();
      }
      updateCurrentStudent(res.updatedStudent);
      setFeedbackBanner({
        type: 'success',
        text: res.message,
      });
    } else {
      setFeedbackBanner({
        type: 'info',
        text: res.message,
      });
    }
    return {
      ok: res.ok,
      message: res.message,
      purchasedNew: res.purchasedNew,
    };
  };

  const handleSendMessage = (
    recipientId: string,
    text: string,
    sharedOutfitLabel?: string
  ) => {
    if (!currentStudent) return;
    soundFX.playChatPing();

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: currentStudent.id,
      senderName: currentStudent.name,
      senderEmail: currentStudent.email,
      senderGender: currentStudent.gender,
      recipientId,
      text,
      timestamp: timeStr,
      sharedOutfitLabel,
    };

    setChatMessages((prev) => [...prev, newMsg]);
  };

  const handleShareCharacterToChat = () => {
    if (!currentStudent) return;
    const activeJubah =
      JUBAH_DESIGNS.find((j) => j.id === currentStudent.selectedJubahId) ||
      JUBAH_DESIGNS[0];
    setIsChatOpen(true);
    setUnreadChatCount(0);
    handleSendMessage(
      'group',
      `Assalamu'alaikum teman-teman! Ini karakterku dengan ${activeJubah.name} di Kamar Beranda mutaba'ah.id!`,
      `${activeJubah.name} · Kamar Rapi ${currentStudent.bedroom.cleanliness}%`
    );
  };

  // Render Teacher & Admin Master Dashboard when logged in as Admin/Guru
  if (isAdminLoggedIn) {
    return (
      <AdminMasterDashboard
        questions={questions}
        students={students}
        passcodes={passcodes}
        prayerSubmissions={prayerSubmissions}
        challengeDataByStudent={challengeDataByStudent}
        quranSessionConfig={quranSessionConfig}
        onToggleQuranSessionOpen={handleToggleQuranSessionOpen}
        onValidateStudentHafalan={handleValidateStudentHafalan}
        onToggleSalatAccessLockForStudent={(studentId, forceLocked) => {
          setChallengeDataByStudent((prev) => {
            const current = prev[studentId];
            if (!current) return prev;
            return {
              ...prev,
              [studentId]: {
                ...current,
                salatAccessLocked:
                  typeof forceLocked === 'boolean'
                    ? forceLocked
                    : !current.salatAccessLocked,
              },
            };
          });
        }}
        onToggleQuranHafalanLockForStudent={(studentId) => {
          setStudents((prev) =>
            prev.map((s) =>
              s.id === studentId
                ? { ...s, unlockedQuranHafalan: !s.unlockedQuranHafalan }
                : s
            )
          );
        }}
        onUpdateParentTeacherPin={(newPin) => {
          setChallengeDataByStudent((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach((sId) => {
              next[sId] = {
                ...next[sId],
                parentTeacherPin: newPin,
              };
            });
            return next;
          });
        }}
        onUpdateQuestions={setQuestions}
        onUpdatePasscodes={setPasscodes}
        onVerifySubmission={(submissionId) =>
          setPrayerSubmissions((prev) =>
            prev.map((item) =>
              item.id === submissionId ? { ...item, verifiedByAdmin: true } : item
            )
          )
        }
        onSwitchToStudentPreview={(student) => {
          setIsAdminLoggedIn(false);
          setCurrentStudentId(student.id);
          setActiveTab('tantangan');
        }}
        onDeleteStudent={(studentId) => {
          setStudents((prev) => prev.filter((s) => s.id !== studentId));
          setTasksByStudent((prev) => {
            const next = { ...prev };
            delete next[studentId];
            return next;
          });
          setChallengeDataByStudent((prev) => {
            const next = { ...prev };
            delete next[studentId];
            return next;
          });
          if (currentStudentId === studentId) {
            setCurrentStudentId(null);
          }
        }}
        onLogout={handleLogout}
      />
    );
  }

  if (!currentStudent) {
    return (
      <LoginPage
        students={students}
        language={language}
        onLanguageChange={setLanguage}
        onLoginSuccess={handleLoginSuccess}
        onAdminLoginSuccess={handleAdminLoginSuccess}
        onStudentsUpdate={(updatedList) => {
          setStudents(updatedList);
          setChallengeDataByStudent((prev) => {
            const copy = { ...prev };
            updatedList.forEach((st, idx) => {
              if (!copy[st.id]) {
                copy[st.id] = createInitialStudentMutabaahData(st.id, idx);
              }
            });
            return copy;
          });
        }}
      />
    );
  }

  const remainingTasksCount = currentTasks.filter((t) => !t.completed).length;
  const worshipSummary = calculateWeeklyWorshipSummaryFromDailySchedule(
    currentChallengeData.dailyWorship
  );

  const totalEarnedSholatPoints = calculateTotalEarnedSholatPoints(
    currentChallengeData.dailyWorship
  );
  const availableSholatPoints = getAvailableSholatPoints(
    currentStudent,
    totalEarnedSholatPoints
  );

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-100 text-slate-900 flex flex-col"
    >
      {/* Top Navigation Bar for MUTABA'AH PERILAKU - PORTAL SISWA & SISWI */}
      <DashboardHeader
        student={currentStudent}
        language={language}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setFeedbackBanner(null);
        }}
        remainingTasksCount={remainingTasksCount}
        unreadChatCount={unreadChatCount}
        isChatOpen={isChatOpen}
        onToggleChat={() => {
          setIsChatOpen((prev) => !prev);
          setUnreadChatCount(0);
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {activeTab === 'beranda' && (
          <div className="space-y-4">
            {/* Interactive Pou-Style Bedroom & Multi-Jubah Character ONLY on Beranda */}
            <RobloxCharacterCanvas
              student={currentStudent}
              tasks={currentTasks}
              passcodes={passcodes}
              availableSholatPoints={availableSholatPoints}
              totalEarnedSholatPoints={totalEarnedSholatPoints}
              onToggleTask={handleToggleTask}
              onUnlockQuranHafalan={handleUnlockQuranHafalan}
              onCleanRoom={handleCleanRoom}
              onMakeRoomMessy={handleMakeRoomMessy}
              onFeedCharacter={handleFeedCharacter}
              onSelectJubah={handleSelectJubah}
              onShareCharacterToChat={handleShareCharacterToChat}
              onGoToChallenges={() => setActiveTab('tantangan')}
              feedbackBanner={feedbackBanner}
            />
          </div>
        )}

        {activeTab === 'tantangan' && (
          <ChallengesView
            student={currentStudent}
            tasks={currentTasks}
            questions={questions}
            passcodes={passcodes}
            challengeData={currentChallengeData}
            quranSessionConfig={quranSessionConfig}
            onSelectDay={handleSelectDay}
            onUnlockSalatWithPin={handleUnlockSalatWithPin}
            onUpdateFardu={handleUpdateFardu}
            onUpdateSunnah={handleUpdateSunnah}
            onToggleSalatAccessLock={handleToggleSalatAccessLock}
            onArchiveAndResetWeek={handleArchiveAndResetWeek}
            onSelectQuizOption={handleSelectQuizOption}
            onSubmitWeeklyQuiz={handleSubmitWeeklyQuiz}
            onSaveQuranReadingLog={handleSaveQuranReadingLog}
            onSubmitHafalan={handleSubmitHafalan}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddCustomTask}
            onAnswerQuestion={handleAnswerQuestion}
            onUnlockQuranHafalan={handleUnlockQuranHafalan}
            onSaveReflection={(note) =>
              updateCurrentStudent({ ...currentStudent, reflectionNote: note })
            }
            onGoToBerandaRoom={() => setActiveTab('beranda')}
            onGoToRiwayat={() => setActiveTab('riwayat')}
          />
        )}

        {activeTab === 'riwayat' && (
          <RiwayatView
            student={currentStudent}
            challengeData={currentChallengeData}
            onBackToChallenges={() => setActiveTab('tantangan')}
          />
        )}

        {activeTab === 'pengaturan' && (
          <SettingsView
            student={currentStudent}
            language={language}
            soundEnabled={soundEnabled}
            onLanguageChange={setLanguage}
            onToggleSound={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              soundFX.enabled = next;
            }}
            onUpdateProfile={({ name, grade, gender }) =>
              updateCurrentStudent({ ...currentStudent, name, grade, gender })
            }
            onChangePassword={(newPass) => {
              const res = updateStudentPassword(
                students,
                currentStudent.email,
                newPass
              );
              if (res.ok) {
                setStudents(res.updatedStudents);
                return { ok: true, message: res.message };
              }
              return { ok: false, message: res.error };
            }}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Floating Student Chat Drawer in Top Bar */}
      <StudentChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentStudent={currentStudent}
        allStudents={students}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
