import React, { useState } from 'react';
import {
  LogOut,
  User,
  KeyRound,
  Globe,
  Volume2,
  VolumeX,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import {
  Gender,
  LanguageCode,
  StudentAccount,
  TRANSLATIONS,
} from '../game/rules';

interface SettingsViewProps {
  student: StudentAccount;
  language: LanguageCode;
  soundEnabled: boolean;
  onLanguageChange: (lang: LanguageCode) => void;
  onToggleSound: () => void;
  onUpdateProfile: (updates: { name: string; grade: string; gender: Gender }) => void;
  onChangePassword: (newPassword: string) => { ok: boolean; message: string };
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  student,
  language,
  soundEnabled,
  onLanguageChange,
  onToggleSound,
  onUpdateProfile,
  onChangePassword,
  onLogout,
}) => {
  const t = TRANSLATIONS[language];

  const [name, setName] = useState(student.name);
  const [grade, setGrade] = useState(student.grade);
  const [gender, setGender] = useState<Gender>(student.gender);
  const [profileSaved, setProfileSaved] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwFeedback, setPwFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onUpdateProfile({
      name: name.trim(),
      grade: grade.trim() || student.grade,
      gender,
    });
    setProfileSaved('Profil siswa berhasil diperbarui!');
    setTimeout(() => setProfileSaved(null), 2500);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.trim().length < 4) {
      setPwFeedback({ ok: false, text: 'Kata sandi baru minimal 4 karakter.' });
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      setPwFeedback({ ok: false, text: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }
    const res = onChangePassword(newPassword.trim());
    setPwFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-stage-reveal">
      {/* Top Banner with Prominent Logout Button */}
      <div className="rounded-3xl bg-white border-2 border-amber-200/90 p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-700">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>Pengaturan Akun Siswa · mutaba&apos;ah.id</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Kelola Profil, Bahasa, Kata Sandi &amp; Keluar Akun
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Sedang masuk sebagai <strong className="text-emerald-800">{student.name}</strong> (
            <span className="font-mono text-amber-800">{student.email}</span>)
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="px-5 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar dari Akun Siswa ({t.logoutBtn})</span>
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Edit Student Profile */}
        <form
          onSubmit={handleProfileSave}
          className="rounded-3xl bg-white border-2 border-amber-200/90 p-6 space-y-4 shadow-md"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
              <User className="w-5 h-5 text-emerald-700" />
              <span>Profil &amp; Karakter Siswa</span>
            </div>
            <span className="text-xs font-mono-tabular font-extrabold text-amber-800">
              {student.xp} XP
            </span>
          </div>

          {profileSaved && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSaved}</span>
            </div>
          )}

          <div>
            <label htmlFor="settings-name" className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap Siswa/Siswi
            </label>
            <input
              id="settings-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="settings-grade" className="block text-xs font-bold text-slate-700 mb-1">
              Kelas / Rombongan Belajar
            </label>
            <input
              id="settings-grade"
              type="text"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="settings-gender" className="block text-xs font-bold text-slate-700 mb-1">
              Model Karakter Siswa
            </label>
            <select
              id="settings-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900"
            >
              <option value="putra">Siswa Putra (Laki-laki)</option>
              <option value="putri">Siswi Putri (Perempuan)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Simpan Perubahan Profil
          </button>
        </form>

        {/* Card 2: Language, Sound & Password Change */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-white border-2 border-amber-200/90 p-6 space-y-4 shadow-md">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base border-b border-slate-200 pb-3">
              <Globe className="w-5 h-5 text-amber-600" />
              <span>Opsi Bahasa &amp; Suara Game</span>
            </div>

            <div>
              <label htmlFor="settings-lang" className="block text-xs font-bold text-slate-700 mb-1.5">
                Pilih Bahasa Aplikasi (Ubah Bahasa)
              </label>
              <select
                id="settings-lang"
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 cursor-pointer"
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
                <option value="ar">العربية (Arabic)</option>
                <option value="ms">Bahasa Melayu</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-xs font-extrabold text-slate-900">Efek Suara Interaksi Kamar</div>
                <div className="text-[11px] text-slate-500">
                  Bunyi saat merapikan kamar, memberi makan &amp; ganti jubah
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleSound}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ${
                  soundEnabled
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Aktif</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Senyap</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <form
            onSubmit={handlePasswordSubmit}
            className="rounded-3xl bg-white border-2 border-amber-200/90 p-6 space-y-3.5 shadow-md"
          >
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base border-b border-slate-200 pb-3">
              <KeyRound className="w-5 h-5 text-amber-600" />
              <span>Ubah Kata Sandi Siswa</span>
            </div>

            {pwFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-bold border ${
                  pwFeedback.ok
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-red-50 border-red-300 text-red-800'
                }`}
              >
                {pwFeedback.text}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="set-new-pw" className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  id="set-new-pw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 4 karakter"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="set-conf-pw" className="block text-xs font-bold text-slate-700 mb-1">
                  Konfirmasi Sandi
                </label>
                <input
                  id="set-conf-pw"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer"
            >
              Perbarui Kata Sandi
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Account Switch / Logout Card */}
      <div className="rounded-3xl bg-red-50 border border-red-200 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-extrabold text-red-950">
            Ingin berganti ke akun siswa lain (putra@murid.id / putri@murid.id)?
          </h2>
          <p className="text-xs text-red-800/85">
            Klik tombol keluar di samping untuk kembali ke halaman utama Portal Masuk Mutaba&apos;ah Perilaku.
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Akun Sekarang</span>
        </button>
      </div>
    </div>
  );
};
