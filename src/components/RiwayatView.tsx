import React, { useState } from 'react';
import {
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  BookOpen,
  Award,
  Calendar,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react';
import { StudentAccount } from '../game/rules';
import {
  DAYS_OF_WEEK,
  DayOfWeekId,
  FARDU_PRAYER_ORDER,
  SUNNAH_PRAYER_ORDER,
  StudentMutabaahChallengeData,
  TEN_HAFALAN_SURAHS,
  calculateDailyWorshipPoints,
  calculateSingleFarduPoints,
  calculateSingleSunnahPoints,
  calculateTotalHafalanPoints,
  calculateWeeklyWorshipSummary,
  calculateWeeklyWorshipSummaryFromDailySchedule,
} from '../game/mutabaahChallenges';

interface RiwayatViewProps {
  student: StudentAccount;
  challengeData: StudentMutabaahChallengeData;
  onBackToChallenges: () => void;
}

export const RiwayatView: React.FC<RiwayatViewProps> = ({
  student,
  challengeData,
  onBackToChallenges,
}) => {
  const [activeDayTab, setActiveDayTab] = useState<DayOfWeekId>(
    challengeData.selectedDay || 'senin'
  );
  const [categoryFilter, setCategoryFilter] = useState<
    | 'semua'
    | 'salat_fardu'
    | 'ibadah_sunah'
    | 'quiz_mingguan'
    | 'baca_alquran'
    | 'hafalan_alquran'
    | 'periode_mingguan'
  >('semua');

  const worshipSummary = calculateWeeklyWorshipSummaryFromDailySchedule(
    challengeData.dailyWorship
  );
  const totalQuranPoints = challengeData.quranLogs.reduce((acc, l) => acc + l.points, 0);
  const totalHafalanPoints = calculateTotalHafalanPoints(challengeData.hafalanRecords);
  const quizScore = challengeData.weeklyQuizSubmission
    ? challengeData.weeklyQuizSubmission.score
    : null;

  const filteredHistory =
    categoryFilter === 'semua'
      ? challengeData.historyEntries
      : challengeData.historyEntries.filter((item) => item.category === categoryFilter);

  return (
    <div className="space-y-6 animate-stage-reveal">
      {/* Top Banner Riwayat */}
      <div className="rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#065f46] to-[#047857] text-white p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
            <History className="w-4 h-4" />
            <span>REKAPITULASI &amp; RIWAYAT MUTABA&apos;AH SISWA</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Riwayat Ibadah, Kuis, Baca Al-Qur&apos;an &amp; Validasi Hafalan
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
            Seluruh catatan ibadah milik <strong>{student.name}</strong> ({student.email} &middot;{' '}
            {challengeData.groupNumberLabel}) tersimpan secara terpisah dan aman pada akun ini.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToChallenges}
          className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Tantangan</span>
        </button>
      </div>

      {/* 4 Summary Metric Cards for Current Student */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500">
            Poin Ibadah Minggu Ini (Fardu + Sunah)
          </div>
          <div className="text-2xl font-mono-tabular font-extrabold text-emerald-700">
            {worshipSummary.totalPoints} / 60 Poin
          </div>
          <div className="text-[11px] text-slate-600">
            Fardu: <strong>{worshipSummary.farduPoints}/50</strong> &middot; Sunah:{' '}
            <strong>{worshipSummary.sunnahPoints}/10</strong>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500">Nilai Quiz Mingguan</div>
          <div className="text-2xl font-mono-tabular font-extrabold text-amber-600">
            {quizScore !== null ? `${quizScore} / 100` : 'Belum Dikirim'}
          </div>
          <div className="text-[11px] text-slate-600">
            {challengeData.weeklyQuizSubmission
              ? `Benar ${challengeData.weeklyQuizSubmission.correctCount} dari ${challengeData.weeklyQuizSubmission.totalQuestions} soal`
              : 'Kerjakan di tab Tantangan'}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500">Total Poin Baca Al-Qur&apos;an</div>
          <div className="text-2xl font-mono-tabular font-extrabold text-emerald-700">
            {totalQuranPoints} Poin
          </div>
          <div className="text-[11px] text-slate-600">
            {challengeData.quranLogs.length} sesi tercatat bersama guru
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500">
            Poin Hafalan Tervalidasi Guru
          </div>
          <div className="text-2xl font-mono-tabular font-extrabold text-emerald-700">
            {totalHafalanPoints} Poin
          </div>
          <div className="text-[11px] text-slate-600">
            {
              Object.values(challengeData.hafalanRecords).filter(
                (r) => r.status === 'diterima'
              ).length
            }{' '}
            / 10 Surat Diterima (+10 poin/surat)
          </div>
        </div>
      </div>

      {/* Current Week Detailed Snapshot + Previous Archived Weekly Periods */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 cols: Rincian Salat 5 Waktu & Sunah Periode Aktif + Riwayat Baca Al-Qur'an */}
        <div className="lg:col-span-6 space-y-6">
          <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Rekap Salat Fardu &amp; Sunah (7 Hari: Senin – Minggu)
                </h2>
                <p className="text-xs text-slate-500">
                  {challengeData.currentPeriodStartLabel} – {challengeData.currentPeriodEndLabel}
                </p>
              </div>
              <span className="text-xs font-mono-tabular font-extrabold text-emerald-700">
                Total Sepekan: {worshipSummary.totalPoints}/60 Poin
              </span>
            </div>

            {/* 7 Days of the Week Selection Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {DAYS_OF_WEEK.map((day) => {
                const daySchedule = challengeData.dailyWorship?.[day.id];
                const dayPts = daySchedule
                  ? calculateDailyWorshipPoints(daySchedule)
                  : { totalPoints: 0 };
                const isSelected = activeDayTab === day.id;

                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setActiveDayTab(day.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{day.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        isSelected
                          ? 'bg-emerald-800 text-amber-300'
                          : 'bg-white text-slate-600'
                      }`}
                    >
                      {dayPts.totalPoints}p
                    </span>
                  </button>
                );
              })}
            </div>

            {(() => {
              const activeSchedule = challengeData.dailyWorship?.[activeDayTab];
              const farduData = activeSchedule?.fardu || challengeData.fardu;
              const sunnahData = activeSchedule?.sunnah || challengeData.sunnah;
              const activeDayLabel =
                DAYS_OF_WEEK.find((d) => d.id === activeDayTab)?.label ||
                activeDayTab;

              return (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-600 px-1">
                    Catatan Ibadah Hari <strong>{activeDayLabel}</strong>:
                  </div>

                  {FARDU_PRAYER_ORDER.map((id) => {
                    const rec = farduData[id];
                    const pts = calculateSingleFarduPoints(rec);
                    return (
                      <div
                        key={id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="font-extrabold text-slate-900">{rec.name}</span>
                          <span className="text-slate-500 ml-2">
                            {rec.performed === true
                              ? `Dilaksanakan (+5) · ${
                                  rec.congregation ? 'Berjamaah (+3)' : 'Sendiri (+0)'
                                } · ${
                                  rec.place === 'masjid'
                                    ? 'Masjid (+2)'
                                    : rec.place === 'rumah'
                                      ? 'Rumah (+1)'
                                      : 'Tempat belum dipilih'
                                }`
                              : rec.performed === false
                                ? 'Tidak dilaksanakan (0 Poin)'
                                : 'Belum dicatat'}
                          </span>
                        </div>
                        <span className="font-mono-tabular font-extrabold text-emerald-700 shrink-0">
                          {pts} / 10 Poin
                        </span>
                      </div>
                    );
                  })}

                  {SUNNAH_PRAYER_ORDER.map((id) => {
                    const rec = sunnahData[id];
                    const pts = calculateSingleSunnahPoints(rec);
                    return (
                      <div
                        key={id}
                        className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/70 flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="font-extrabold text-emerald-950">{rec.name} (Sunah)</span>
                          <span className="text-slate-600 ml-2">
                            {rec.performed === true
                              ? 'Dilaksanakan: Ya (+5 Poin)'
                              : rec.performed === false
                                ? 'Dilaksanakan: Tidak (0 Poin)'
                                : 'Belum dicatat'}
                          </span>
                        </div>
                        <span className="font-mono-tabular font-extrabold text-emerald-700 shrink-0">
                          {pts} / 5 Poin
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>

          {/* Riwayat Pencatatan Baca Al-Qur'an */}
          <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                <h2 className="text-base font-extrabold text-slate-900">
                  Riwayat Pencatatan Baca Al-Qur&apos;an
                </h2>
              </div>
              <span className="text-xs font-mono-tabular font-extrabold text-emerald-700">
                Total: {totalQuranPoints} Poin
              </span>
            </div>

            {challengeData.quranLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">
                Belum ada pencatatan sesi Baca Al-Qur&apos;an pada periode ini.
              </p>
            ) : (
              <div className="space-y-2.5">
                {challengeData.quranLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-extrabold text-slate-900">
                        {log.performed
                          ? 'Dilaksanakan Bersama Guru (+5 Poin)'
                          : 'Tidak Dilaksanakan (+0 Poin)'}
                      </div>
                      <p className="text-slate-600">{log.note}</p>
                      <div className="text-[11px] text-slate-400">
                        {log.dateLabel} &middot; {log.periodLabel}
                      </div>
                    </div>
                    <span className="font-mono-tabular font-extrabold text-emerald-700 shrink-0">
                      +{log.points} Poin
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right 6 cols: Status 10 Target Hafalan & Arsip Minggu Sebelumnya */}
        <div className="lg:col-span-6 space-y-6">
          <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-700" />
                <h2 className="text-base font-extrabold text-slate-900">
                  Status Setoran &amp; Validasi Guru (10 Surat Kelas 3–4 SD)
                </h2>
              </div>
              <span className="text-xs font-mono-tabular font-extrabold text-emerald-700">
                {totalHafalanPoints} / 100 Poin
              </span>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {TEN_HAFALAN_SURAHS.map((surah) => {
                const rec = challengeData.hafalanRecords[surah.id];
                const status = rec ? rec.status : 'belum_disetorkan';

                return (
                  <div
                    key={surah.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-slate-900">
                        QS. {surah.surahNumber} &middot; {surah.name} ({surah.versesCount} ayat)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {surah.level}
                        {rec?.submittedAt ? ` · Diajukan: ${rec.submittedAt}` : ''}
                      </div>
                      {rec?.teacherNote && (
                        <div className="text-[11px] text-emerald-800 font-medium">
                          Catatan Guru: &ldquo;{rec.teacherNote}&rdquo;
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      {status === 'diterima' && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Diterima (+10 Poin)</span>
                        </span>
                      )}
                      {status === 'menunggu_pemeriksaan' && (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-extrabold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Menunggu Guru</span>
                        </span>
                      )}
                      {status === 'perlu_perbaikan' && (
                        <span className="inline-flex items-center gap-1 text-red-600 font-extrabold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Perlu Perbaikan</span>
                        </span>
                      )}
                      {status === 'belum_disetorkan' && (
                        <span className="text-slate-400 font-semibold">Belum Disetorkan</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Arsip Periode Mingguan Sebelumnya */}
          <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <h2 className="text-base font-extrabold text-slate-900">
                  Arsip Periode Mingguan Sebelumnya ({challengeData.archivedPeriods.length})
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              {challengeData.archivedPeriods.map((arch) => (
                <div
                  key={arch.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-slate-900">{arch.periodLabel}</span>
                    <span className="font-mono-tabular font-extrabold text-emerald-700">
                      {arch.totalWeeklyWorshipPoints} / 60 Poin
                    </span>
                  </div>
                  <div className="text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Fardu: {arch.farduPoints}/50</span>
                    <span>&middot;</span>
                    <span>Sunah: {arch.sunnahPoints}/10</span>
                    <span>&middot;</span>
                    <span>
                      Quiz: {arch.quizScore !== null ? `${arch.quizScore}/100` : 'Belum diikuti'}
                    </span>
                    <span>&middot;</span>
                    <span>Al-Qur&apos;an: +{arch.quranPoints} Poin</span>
                    <span>&middot;</span>
                    <span>Hafalan: +{arch.hafalanPoints} Poin</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Full Chronological Activity Log with Category Filter */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-700" />
            <h2 className="text-base font-extrabold text-slate-900">
              Log Aktivitas Lengkap Siswa ({filteredHistory.length})
            </h2>
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            {(
              [
                { key: 'semua', label: 'Semua' },
                { key: 'salat_fardu', label: 'Salat 5 Waktu' },
                { key: 'ibadah_sunah', label: 'Ibadah Sunah' },
                { key: 'quiz_mingguan', label: 'Quiz Mingguan' },
                { key: 'baca_alquran', label: "Baca Al-Qur'an" },
                { key: 'hafalan_alquran', label: 'Setoran Hafalan' },
                { key: 'periode_mingguan', label: 'Periode Mingguan' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCategoryFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  categoryFilter === tab.key
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            Belum ada riwayat aktivitas pada kategori ini.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-extrabold text-slate-900">{item.title}</div>
                  <div className="text-slate-600">{item.detail}</div>
                  <div className="text-[11px] text-slate-400">
                    {item.timestamp} &middot; {item.periodLabel} &middot; Status:{' '}
                    <strong className="text-slate-600">{item.statusLabel}</strong>
                  </div>
                </div>

                <div className="font-mono-tabular font-extrabold text-emerald-700 shrink-0">
                  {item.points > 0 ? `+${item.points} Poin` : '0 Poin'}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
