import React, { useState } from 'react';
import {
  ShieldAlert,
  PlusCircle,
  Trash2,
  KeyRound,
  BookOpen,
  CheckCircle2,
  Users,
  LogOut,
  Eye,
  HelpCircle,
  Lock,
  Unlock,
  Award,
  Edit3,
  Sparkles,
  ClipboardList,
} from 'lucide-react';
import {
  PrayerRecordingSubmission,
  QuizQuestion,
  SessionPasscodes,
  StudentAccount,
  TaskCategory,
  createQuizQuestion,
  isTrialStudent,
} from '../game/rules';
import {
  QuranReadingSessionConfig,
  StudentMutabaahChallengeData,
  calculateTotalHafalanPoints,
  calculateWeeklyWorshipSummaryFromDailySchedule,
} from '../game/mutabaahChallenges';
import { soundFX } from '../utils/sound';

export type AdminTab =
  | 'beranda_siswa'
  | 'kelola_kuis'
  | 'sesi_dan_sandi'
  | 'validasi_hafalan';

interface AdminMasterDashboardProps {
  questions: QuizQuestion[];
  students: StudentAccount[];
  passcodes: SessionPasscodes;
  prayerSubmissions: PrayerRecordingSubmission[];
  challengeDataByStudent: Record<string, StudentMutabaahChallengeData>;
  quranSessionConfig: QuranReadingSessionConfig;
  onToggleQuranSessionOpen: (nextOpen: boolean, sessionTitle: string) => void;
  onValidateStudentHafalan: (
    studentId: string,
    surahId: string,
    decision: 'diterima' | 'perlu_perbaikan',
    teacherNote: string
  ) => void;
  onToggleSalatAccessLockForStudent: (
    studentId: string,
    forceLocked?: boolean
  ) => void;
  onToggleQuranHafalanLockForStudent?: (studentId: string) => void;
  onUpdateParentTeacherPin: (newPin: string) => void;
  onUpdateQuestions: (updated: QuizQuestion[]) => void;
  onUpdatePasscodes: (updated: SessionPasscodes) => void;
  onVerifySubmission: (submissionId: string) => void;
  onSwitchToStudentPreview: (student: StudentAccount) => void;
  onDeleteStudent?: (studentId: string) => void;
  onLogout: () => void;
}

export const AdminMasterDashboard: React.FC<AdminMasterDashboardProps> = ({
  questions,
  students,
  passcodes,
  challengeDataByStudent,
  quranSessionConfig,
  onToggleQuranSessionOpen,
  onValidateStudentHafalan,
  onToggleSalatAccessLockForStudent,
  onToggleQuranHafalanLockForStudent,
  onUpdateParentTeacherPin,
  onUpdateQuestions,
  onUpdatePasscodes,
  onSwitchToStudentPreview,
  onDeleteStudent,
  onLogout,
}) => {
  // Horizontal Active Tab State (Beranda Siswa, Kelola Kuis, Sesi & Sandi, Validasi Hafalan)
  const [activeTab, setActiveTab] = useState<AdminTab>('beranda_siswa');

  // Delete Student confirmation state
  const [studentToDelete, setStudentToDelete] = useState<StudentAccount | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  // New / Edit Question Form State
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [category, setCategory] = useState<TaskCategory>('akhlak');
  const [questionText, setQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [xpReward, setXpReward] = useState<number>(80);
  const [formFeedback, setFormFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  // Quran session title state
  const [sessionTitleInput, setSessionTitleInput] = useState(
    quranSessionConfig.sessionTitle || "Sesi Pembelajaran Agama & Tilawah Al-Qur'an"
  );

  // Teacher note map for Hafalan validation
  const [teacherNotes, setTeacherNotes] = useState<Record<string, string>>({});

  // Passcode editor state
  const [quranPin, setQuranPin] = useState(passcodes.quranHafalanPin || '753690');
  const [parentPin, setParentPin] = useState(
    challengeDataByStudent[students[0]?.id]?.parentTeacherPin || '987654'
  );
  const [pinSavedMsg, setPinSavedMsg] = useState<string | null>(null);

  const handleCreateOrEditQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    if (editingQuestionId) {
      if (!questionText.trim() || [optA, optB, optC, optD].some((o) => !o.trim())) {
        setFormFeedback({
          ok: false,
          text: 'Pertanyaan dan keempat pilihan jawaban (A, B, C, D) wajib diisi.',
        });
        return;
      }
      const updated = questions.map((q) =>
        q.id === editingQuestionId
          ? {
              ...q,
              category,
              question: questionText.trim(),
              options: [
                optA.trim(),
                optB.trim(),
                optC.trim(),
                optD.trim(),
              ] as [string, string, string, string],
              correctIndex,
              xpReward,
            }
          : q
      );
      soundFX.playCoinReward();
      onUpdateQuestions(updated);
      setEditingQuestionId(null);
      setQuestionText('');
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
      setFormFeedback({
        ok: true,
        text: 'Alhamdulillah! Soal Quiz Mingguan berhasil diperbarui!',
      });
      return;
    }

    const res = createQuizQuestion(questions, {
      category,
      question: questionText,
      options: [optA, optB, optC, optD],
      correctIndex,
      xpReward,
      coinReward: 60,
    });

    if (!res.ok) {
      setFormFeedback({ ok: false, text: res.error });
      return;
    }

    soundFX.playCoinReward();
    onUpdateQuestions(res.updatedQuestions);
    setQuestionText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectIndex(0);
    setFormFeedback({
      ok: true,
      text: 'Alhamdulillah! Soal baru berhasil diterbitkan ke Quiz Mingguan Siswa!',
    });
  };

  const handleStartEditQuestion = (q: QuizQuestion) => {
    setEditingQuestionId(q.id);
    setCategory(q.category);
    setQuestionText(q.question);
    setOptA(q.options[0]);
    setOptB(q.options[1]);
    setOptC(q.options[2]);
    setOptD(q.options[3]);
    setCorrectIndex(q.correctIndex);
    setXpReward(q.xpReward);
    setFormFeedback(null);
    // Smooth scroll to editor
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleDeleteQuestion = (id: string) => {
    onUpdateQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSavePasscodes = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePasscodes({
      ...passcodes,
      quranHafalanPin: quranPin.trim() || '753690',
    });
    if (parentPin.trim()) {
      onUpdateParentTeacherPin(parentPin.trim());
    }
    soundFX.playCleanRoom();
    setPinSavedMsg('Sandi pengunci sesi & PIN Guru/Orang Tua berhasil disimpan!');
    setTimeout(() => setPinSavedMsg(null), 2500);
  };

  // Gather all student Hafalan submissions across all students
  const allHafalanSubmissions: {
    student: StudentAccount;
    surahId: string;
    surahName: string;
    surahNumber: number;
    versesCount: number;
    level: string;
    status: string;
    submittedAt: string;
    teacherNote?: string;
  }[] = [];

  for (const st of students) {
    const cData = challengeDataByStudent[st.id];
    if (!cData) continue;
    for (const rec of Object.values(cData.hafalanRecords)) {
      allHafalanSubmissions.push({
        student: st,
        surahId: rec.surahId,
        surahName: rec.surahName,
        surahNumber: rec.surahNumber,
        versesCount: rec.versesCount,
        level: rec.level,
        status: rec.status,
        submittedAt: rec.submittedAt,
        teacherNote: rec.teacherNote,
      });
    }
  }

  const pendingHafalanCount = allHafalanSubmissions.filter(
    (h) => h.status === 'menunggu_pemeriksaan'
  ).length;

  return (
    <div className="min-h-screen beranda-bright-bg text-slate-900 flex flex-col">
      {/* Top Bar Guru & Admin Master */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-amber-400/40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold shadow-sm">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display-serif font-extrabold text-base sm:text-lg tracking-wide text-white">
                  PANEL GURU &amp; ADMIN MASTER
                </span>
              </div>
              <p className="text-[11px] text-emerald-300 font-medium hidden sm:block">
                Evaluasi Terpadu · Mutaba&apos;ah Perilaku Siswa &amp; Siswi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onSwitchToStudentPreview(students[0])}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Pratinjau Siswa ({students[0]?.name.split(' ')[0]})</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* HORIZONTAL TABS IN HEADER (Like Student Portal Navbar) */}
        <div className="bg-slate-950/80 border-t border-slate-800 px-4 sm:px-6">
          <nav
            aria-label="Navigasi Menu Admin"
            className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-3 overflow-x-auto py-2.5 scrollbar-none"
          >
            <button
              type="button"
              onClick={() => {
                soundFX.playCleanRoom();
                setActiveTab('beranda_siswa');
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                activeTab === 'beranda_siswa'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Users className="w-4 h-4 text-amber-300" />
              <span>Beranda Siswa &amp; Kontrol Sesi</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-900/60 font-mono">
                {students.filter((s) => !isTrialStudent(s)).length} Murid
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playCleanRoom();
                setActiveTab('kelola_kuis');
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                activeTab === 'kelola_kuis'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-amber-300" />
              <span>Pembuatan &amp; Kelola Kuis</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-900/60 font-mono">
                {questions.length} Soal
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playCleanRoom();
                setActiveTab('sesi_dan_sandi');
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                activeTab === 'sesi_dan_sandi'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <KeyRound className="w-4 h-4 text-amber-300" />
              <span>Kontrol Sesi &amp; Pengaturan Sandi</span>
              {quranSessionConfig.isOpen && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 font-bold">
                  Sesi Buka
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playCleanRoom();
                setActiveTab('validasi_hafalan');
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                activeTab === 'validasi_hafalan'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>Validasi Hafalan 10 Surat</span>
              {pendingHafalanCount > 0 && (
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-extrabold font-mono">
                  {pendingHafalanCount} Menunggu
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content per Horizontal Tab */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* =========================================================================
            TAB 1: BERANDA SISWA (NAMA NAMA SISWA & KONTROL SESI LANGSUNG DI SAMPINGNYA)
           ========================================================================= */}
        {activeTab === 'beranda_siswa' && (
          <div className="space-y-6 animate-stage-reveal">
            {/* Top Banner Beranda Siswa */}
            <div className="rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#065f46] to-[#047857] text-white p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  <Users className="w-4 h-4" />
                  <span>BERANDA NAMA SISWA &amp; PEMBUKA SESI TERPADU</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Daftar Nama Siswa &amp; Kontrol Akses Sesi Langsung
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                  Semua nama siswa disatukan di sini. Guru dapat langsung membuka atau mengunci{' '}
                  <strong>Akses Salat Ibadah</strong> dan <strong>Sesi Qur&apos;an/Hafalan</strong> tepat di samping nama masing-masing murid.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-center">
                  <div className="text-xs text-emerald-200">Total Murid</div>
                  <div className="text-xl font-extrabold font-mono text-amber-300">
                    {students.filter((s) => !isTrialStudent(s)).length} Santri
                  </div>
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-center">
                  <div className="text-xs text-emerald-200">Sesi Qur&apos;an</div>
                  <div className="text-sm font-extrabold text-white">
                    {quranSessionConfig.isOpen ? '✓ Dibuka Guru' : 'Ditutup'}
                  </div>
                </div>
              </div>
            </div>

            {/* List of Students with Session Controls Directly Beside Each Student */}
            {/* Akun uji coba (Putra & Putri) disembunyikan dari daftar siswa admin sesuai arahan */}
            <div className="space-y-3.5">
              {students
                .filter((st) => !isTrialStudent(st))
                .map((st) => {
                const cData = challengeDataByStudent[st.id];
                const summary = calculateWeeklyWorshipSummaryFromDailySchedule(
                  cData?.dailyWorship
                );
                const hafalanPts = cData ? calculateTotalHafalanPoints(cData.hafalanRecords) : 0;
                const isSalatLocked = cData ? cData.salatAccessLocked : true;
                const isQuranUnlocked = Boolean(st.unlockedQuranHafalan);

                return (
                  <div
                    key={st.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Left: Student Identity & Point Stats */}
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-amber-300 flex items-center justify-center font-extrabold text-lg shadow-sm shrink-0">
                        {st.name.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-extrabold text-slate-900">
                            {st.name}
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            {st.email}
                          </span>
                          <span className="text-xs text-slate-500 font-semibold">
                            &middot; {st.grade}
                          </span>
                        </div>

                        {/* Point Badges */}
                        <div className="flex items-center gap-2.5 flex-wrap text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1 font-semibold">
                            Ibadah Minggu Ini:
                            <strong className="text-emerald-800 font-mono font-extrabold">
                              {summary.totalPoints}/60 Poin
                            </strong>
                          </span>
                          <span>&middot;</span>
                          <span className="inline-flex items-center gap-1 font-semibold">
                            Hafalan:
                            <strong className="text-amber-800 font-mono font-extrabold">
                              {hafalanPts} Poin
                            </strong>
                          </span>
                          <span>&middot;</span>
                          <span className="inline-flex items-center gap-1 font-semibold">
                            Pahala:
                            <strong className="text-slate-800 font-mono font-extrabold">
                              {st.xp} XP
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Controls Directly Beside The Student's Name */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {/* Sesi 1: Kunci / Buka Ibadah Fardu & Sunnah */}
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playCleanRoom();
                          onToggleSalatAccessLockForStudent(st.id);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors ${
                          isSalatLocked
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                        }`}
                        title="Buka atau kunci pencatatan salat 5 waktu dan sunnah untuk siswa ini"
                      >
                        {isSalatLocked ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Buka Sesi Ibadah</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Kunci Sesi Ibadah</span>
                          </>
                        )}
                      </button>

                      {/* Sesi 2: Kunci / Buka Sesi Qur'an & Hafalan */}
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playCleanRoom();
                          if (onToggleQuranHafalanLockForStudent) {
                            onToggleQuranHafalanLockForStudent(st.id);
                          }
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors ${
                          !isQuranUnlocked
                            ? 'bg-emerald-800 hover:bg-emerald-900 text-amber-300'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                        }`}
                        title="Buka atau kunci akses sesi Baca Al-Qur'an dan Hafalan (sandi 753690)"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {isQuranUnlocked ? 'Kunci Qur\'an/Hafalan' : 'Buka Qur\'an/Hafalan'}
                        </span>
                      </button>

                      {/* Sesi 3: Buka Dasbor Murid */}
                      <button
                        type="button"
                        onClick={() => onSwitchToStudentPreview(st)}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Buka Dasbor Murid</span>
                      </button>

                      {/* Hapus Murid: Tombol Kotak Sampah */}
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playOuchTouch();
                          setStudentToDelete(st);
                        }}
                        className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        aria-label={`Hapus Akun Murid ${st.name}`}
                        title={`Hapus Akun Murid ${st.name}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                        <span className="hidden sm:inline">Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {students.filter((s) => !isTrialStudent(s)).length === 0 && (
                <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-2">
                  <Users className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Belum ada akun murid terdaftar.</p>
                  <p className="text-xs text-slate-500">
                    Siswa baru dapat mendaftarkan diri secara mandiri melalui formulir Pendaftaran di halaman login. (Akun uji coba Putra &amp; Putri tidak ditampilkan di sini).
                  </p>
                </div>
              )}
            </div>

            {/* Notification alert banner if a student was recently deleted */}
            {deleteNotice && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-xs">
                <span>{deleteNotice}</span>
                <button
                  type="button"
                  onClick={() => setDeleteNotice(null)}
                  className="text-xs font-bold text-red-700 hover:underline cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal Konfirmasi Hapus Akun Murid */}
        {studentToDelete && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-delete-student-title"
          >
            <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-5 animate-scale-in">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3
                    id="modal-delete-student-title"
                    className="text-lg font-extrabold text-slate-900"
                  >
                    Hapus Akun Murid?
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Tindakan ini akan menghapus akun murid secara permanen dari sistem.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 space-y-1.5 text-xs text-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Nama Murid:</span>
                  <strong className="text-slate-900 font-extrabold">{studentToDelete.name}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Email:</span>
                  <code className="text-red-700 font-mono font-bold">{studentToDelete.email}</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Kelas:</span>
                  <span className="font-semibold">{studentToDelete.grade}</span>
                </div>
                <p className="text-red-800 font-medium pt-1 text-[11px] leading-relaxed">
                  ⚠️ Setelah dihapus, murid tidak dapat masuk lagi dan namanya tidak akan muncul di daftar siswa maupun menu uji coba login.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStudentToDelete(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const deletedName = studentToDelete.name;
                    const deletedEmail = studentToDelete.email;
                    soundFX.playOuchTouch();
                    if (onDeleteStudent) {
                      onDeleteStudent(studentToDelete.id);
                    }
                    setStudentToDelete(null);
                    setDeleteNotice(
                      `Akun murid "${deletedName}" (${deletedEmail}) telah berhasil dihapus dari sistem.`
                    );
                  }}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/20 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Ya, Hapus Akun Murid</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: PEMBUATAN & KELOLA KUIS (FORM TAMBAH/EDIT SOAL & BANK SOAL TERPISAH)
           ========================================================================= */}
        {activeTab === 'kelola_kuis' && (
          <div className="space-y-6 animate-stage-reveal">
            {/* Top Banner Kelola Kuis */}
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  <HelpCircle className="w-4 h-4" />
                  <span>MODUL PEMBUATAN &amp; KELOLA QUIZ MINGGUAN</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Pembuatan Soal Baru &amp; Manajemen Bank Kuis
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Guru dapat menambahkan soal baru, memperbarui materi pertanyaan, pilihan jawaban A, B, C, D, serta mengatur hadiah pahala XP untuk siswa.
                </p>
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-center">
                <div className="text-xs text-emerald-300">Bank Soal Aktif</div>
                <div className="text-xl font-extrabold font-mono text-amber-300">
                  {questions.length} Pertanyaan
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 6 cols: Form Tambah / Edit Soal */}
              <section className="lg:col-span-6 rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">
                        {editingQuestionId
                          ? 'Edit Soal Quiz Mingguan'
                          : 'Buat Soal Quiz Mingguan Baru (Usia SD)'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {editingQuestionId
                          ? 'Ubah isi soal, pilihan, atau kunci jawaban di bawah ini'
                          : 'Soal baru otomatis tampil di halaman Tantangan Quiz siswa'}
                      </p>
                    </div>
                  </div>
                  {editingQuestionId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuestionId(null);
                        setQuestionText('');
                        setOptA('');
                        setOptB('');
                        setOptC('');
                        setOptD('');
                      }}
                      className="text-xs font-extrabold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                {formFeedback && (
                  <div
                    role="status"
                    className={`p-3.5 rounded-xl text-xs font-extrabold border flex items-center gap-2 ${
                      formFeedback.ok
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-red-50 border-red-300 text-red-800'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{formFeedback.text}</span>
                  </div>
                )}

                <form onSubmit={handleCreateOrEditQuestionSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="admin-q-category"
                        className="block text-xs font-extrabold text-slate-700 mb-1"
                      >
                        Kategori Soal SD
                      </label>
                      <select
                        id="admin-q-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as TaskCategory)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-bold text-slate-900"
                      >
                        <option value="akhlak">Akhlak Mulia &amp; Adab</option>
                        <option value="mengaji">Adab Membaca Al-Qur&apos;an</option>
                        <option value="sholat">Ibadah &amp; Salat 5 Waktu</option>
                        <option value="hafalan">Hafalan &amp; Pengetahuan Islam</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="admin-q-xp"
                        className="block text-xs font-extrabold text-slate-700 mb-1"
                      >
                        Hadiah Pahala XP
                      </label>
                      <input
                        id="admin-q-xp"
                        type="number"
                        min={10}
                        max={500}
                        value={xpReward}
                        onChange={(e) => setXpReward(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-mono-tabular font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="admin-q-text"
                      className="block text-xs font-extrabold text-slate-700 mb-1"
                    >
                      Pertanyaan Soal
                    </label>
                    <textarea
                      id="admin-q-text"
                      rows={2}
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="Contoh: Apa yang sebaiknya kita ucapkan saat bertemu bapak/ibu guru?"
                      className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <span className="block text-xs font-extrabold text-slate-700">
                      Pilihan Jawaban (A, B, C, D) &amp; Pilih Kunci Jawaban Benar:
                    </span>

                    {(
                      [
                        { idx: 0, label: 'A', val: optA, setVal: setOptA },
                        { idx: 1, label: 'B', val: optB, setVal: setOptB },
                        { idx: 2, label: 'C', val: optC, setVal: setOptC },
                        { idx: 3, label: 'D', val: optD, setVal: setOptD },
                      ] as const
                    ).map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <label
                          htmlFor={`admin-radio-opt-${item.label}`}
                          className={`w-9 h-9 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 cursor-pointer border ${
                            correctIndex === item.idx
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          <input
                            id={`admin-radio-opt-${item.label}`}
                            type="radio"
                            name="correct-opt"
                            checked={correctIndex === item.idx}
                            onChange={() => setCorrectIndex(item.idx)}
                            className="sr-only"
                          />
                          <span>{item.label}</span>
                        </label>

                        <input
                          type="text"
                          value={item.val}
                          onChange={(e) => item.setVal(e.target.value)}
                          placeholder={`Pilihan jawaban ${item.label}`}
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900"
                        />
                      </div>
                    ))}
                    <span className="text-[11px] text-emerald-800 font-semibold block">
                      *Klik kotak huruf A, B, C, atau D untuk menentukan kunci jawaban yang benar (berwarna hijau).
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{editingQuestionId ? 'Simpan Perubahan Soal' : 'Terbitkan Soal ke Kuis Siswa'}</span>
                  </button>
                </form>
              </section>

              {/* Right 6 cols: Daftar Bank Soal Aktif */}
              <section className="lg:col-span-6 rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-emerald-700" />
                    <h2 className="text-base font-extrabold text-slate-900">
                      Daftar Bank Soal Kuis ({questions.length} Soal)
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Klik Edit atau Hapus
                  </span>
                </div>

                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {questions.map((q, index) => (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 hover:border-emerald-300 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold text-emerald-700">
                          <span className="uppercase">{q.category}</span>
                          <span>&middot;</span>
                          <span className="font-mono-tabular text-amber-700">+{q.xpReward} XP</span>
                        </div>
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                          {index + 1}. {q.question}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          {q.options.map((opt, oIdx) => (
                            <span
                              key={oIdx}
                              className={`text-[11px] px-2 py-1 rounded-lg truncate ${
                                oIdx === q.correctIndex
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'bg-white text-slate-600 border border-slate-200'
                              }`}
                            >
                              {['A', 'B', 'C', 'D'][oIdx]}. {opt}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditQuestion(q)}
                          aria-label={`Edit soal ${index + 1}`}
                          className="p-2 rounded-lg text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          aria-label={`Hapus soal ${index + 1}`}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: KONTROL SESI BACA AL-QUR'AN & PENGATURAN SANDI SESI (DISATUKAN)
           ========================================================================= */}
        {activeTab === 'sesi_dan_sandi' && (
          <div className="space-y-6 animate-stage-reveal">
            {/* Top Banner Kontrol Sesi & Sandi */}
            <div className="rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#065f46] to-[#047857] text-white p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  <KeyRound className="w-4 h-4" />
                  <span>KONTROL SESI BACA AL-QUR&apos;AN &amp; SANDI PENGUNCI</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Pengaturan Sesi Agama &amp; Sandi Pengunci Terpadu
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                  Gabungan kontrol pembukaan sesi pembelajaran Baca Al-Qur&apos;an dan pengaturan sandi rahasia untuk guru &amp; orang tua.
                </p>
              </div>

              <span
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold ${
                  quranSessionConfig.isOpen
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-red-500 text-white'
                }`}
              >
                {quranSessionConfig.isOpen ? 'Sesi Qur\'an Terbuka ✓' : 'Sesi Qur\'an Ditutup'}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Box 1: Kontrol Sesi Pembelajaran Agama: Baca Al-Qur'an */}
              <section className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-700" />
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">
                        Kontrol Sesi Baca Al-Qur&apos;an
                      </h2>
                      <p className="text-xs text-slate-500">
                        Buka atau tutup akses pencatatan tilawah murid (+5 poin/sesi)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label
                      htmlFor="guru-session-title"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Nama / Topik Sesi Pembelajaran Agama:
                    </label>
                    <input
                      id="guru-session-title"
                      type="text"
                      value={sessionTitleInput}
                      onChange={(e) => setSessionTitleInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playCoinReward();
                        onToggleQuranSessionOpen(true, sessionTitleInput);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>Buka Sesi Baca Al-Qur&apos;an Baru</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playOuchTouch();
                        onToggleQuranSessionOpen(false, sessionTitleInput);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Tutup Sesi Baca Al-Qur&apos;an</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Box 2: Pengaturan Sandi Sesi & PIN Guru / Orang Tua */}
              <form
                onSubmit={handleSavePasscodes}
                className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                    <KeyRound className="w-5 h-5 text-amber-600" />
                    <span>Konfigurasi Sandi Sesi Ibadah</span>
                  </div>
                  {pinSavedMsg && (
                    <span className="text-xs font-extrabold text-emerald-700">✓ {pinSavedMsg}</span>
                  )}
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label
                      htmlFor="pin-quran-hafalan"
                      className="block text-xs font-extrabold text-slate-700 mb-1"
                    >
                      Sandi Sesi Baca Al-Qur&apos;an &amp; Hafalan
                    </label>
                    <input
                      id="pin-quran-hafalan"
                      type="text"
                      value={quranPin}
                      onChange={(e) => setQuranPin(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 font-mono-tabular font-extrabold text-sm text-emerald-950"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Default: <strong>753690</strong> (Digunakan siswa untuk membuka sesi tilawah/hafalan)
                    </span>
                  </div>

                  <div>
                    <label
                      htmlFor="pin-parent-salat"
                      className="block text-xs font-extrabold text-slate-700 mb-1"
                    >
                      PIN / Sandi Guru &amp; Orang Tua (Kunci Salat Fardu &amp; Sunah)
                    </label>
                    <input
                      id="pin-parent-salat"
                      type="text"
                      value={parentPin}
                      onChange={(e) => setParentPin(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-300 font-mono-tabular font-extrabold text-sm text-amber-950"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Default Rahasia: <strong>987654</strong> (Hanya dipegang guru &amp; orang tua)
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold cursor-pointer"
                >
                  Simpan Pengaturan Sandi Sesi
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: VALIDASI HAFALAN 10 SURAT (KELAS 3-4 SD)
           ========================================================================= */}
        {activeTab === 'validasi_hafalan' && (
          <div className="space-y-6 animate-stage-reveal">
            {/* Top Banner Validasi Hafalan */}
            <div className="rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#065f46] to-[#047857] text-white p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  <Award className="w-4 h-4" />
                  <span>VALIDASI SETORAN HAFALAN SISWA (KELAS 3–4 SD)</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Pemeriksaan &amp; Penilaian Hafalan 10 Surat Juz &apos;Amma
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                  Jika Diterima, siswa memperoleh <strong>+10 poin</strong> secara permanen. Jika Perlu Perbaikan, siswa diarahkan murajaah dan menyetorkan kembali.
                </p>
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-center">
                <div className="text-xs text-emerald-200">Total Pengajuan</div>
                <div className="text-xl font-extrabold font-mono text-amber-300">
                  {allHafalanSubmissions.length} Setoran
                </div>
              </div>
            </div>

            <section className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-extrabold text-slate-900">
                  Daftar Setoran Hafalan Masuk
                </h2>
                <span className="text-xs font-bold text-slate-500">
                  {pendingHafalanCount} Menunggu Pemeriksaan
                </span>
              </div>

              <div className="space-y-3.5">
                {allHafalanSubmissions.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    Belum ada pengajuan setoran hafalan dari siswa.
                  </p>
                ) : (
                  allHafalanSubmissions.map((item) => {
                    const key = `${item.student.id}_${item.surahId}`;
                    const noteVal = teacherNotes[key] ?? item.teacherNote ?? '';

                    return (
                      <div
                        key={key}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                              {item.student.name}{' '}
                              <span className="text-xs font-mono text-emerald-700">
                                ({item.student.email})
                              </span>
                            </div>
                            <div className="text-xs font-bold text-slate-700 mt-0.5">
                              📖 {item.surahName} (Surat ke-{item.surahNumber} &middot; {item.versesCount} ayat &middot; {item.level})
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Waktu Pengajuan: {item.submittedAt}
                            </div>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-extrabold ${
                              item.status === 'diterima'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : item.status === 'perlu_perbaikan'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-blue-100 text-blue-900 border border-blue-300'
                            }`}
                          >
                            {item.status === 'diterima'
                              ? 'Diterima (+10 Poin) ✓'
                              : item.status === 'perlu_perbaikan'
                                ? 'Perlu Perbaikan (0 Poin)'
                                : 'Menunggu Pemeriksaan'}
                          </span>
                        </div>

                        {/* Teacher Note Input & Validation Buttons */}
                        <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="text"
                            value={noteVal}
                            placeholder="Catatan guru (contoh: Alhamdulillah makhraj tepat & lancar)"
                            onChange={(e) =>
                              setTeacherNotes((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900"
                          />

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playCoinReward();
                                onValidateStudentHafalan(
                                  item.student.id,
                                  item.surahId,
                                  'diterima',
                                  noteVal
                                );
                              }}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer"
                            >
                              Terima (+10 Poin)
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playOuchTouch();
                                onValidateStudentHafalan(
                                  item.student.id,
                                  item.surahId,
                                  'perlu_perbaikan',
                                  noteVal
                                );
                              }}
                              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold cursor-pointer"
                            >
                              Perlu Perbaikan
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};
