import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Sparkles,
  Calendar,
  Award,
  Zap,
  Globe,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
} from 'lucide-react';
import {
  LanguageCode,
  StudentAccount,
  Gender,
  TRANSLATIONS,
  authenticateStudent,
  registerStudentAccount,
  updateStudentPassword,
} from '../game/rules';

interface LoginPageProps {
  students: StudentAccount[];
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onLoginSuccess: (student: StudentAccount) => void;
  onAdminLoginSuccess: () => void;
  onStudentsUpdate: (updated: StudentAccount[]) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  students,
  language,
  onLanguageChange,
  onLoginSuccess,
  onAdminLoginSuccess,
  onStudentsUpdate,
}) => {
  const t = TRANSLATIONS[language];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Modals for Register ("Pembuatan Akun") and Forgot/Change Password ("Lupa Kata Sandi & Opsi Mengubah")
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGender, setRegGender] = useState<Gender>('putra');
  const [regGrade, setRegGrade] = useState('Kelas 7A - Al-Khawarizmi');
  const [regError, setRegError] = useState<string | null>(null);

  // Forgot/Change password state
  const [resetEmail, setResetEmail] = useState('putra@murid.id');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthNotice(null);

    const res = authenticateStudent(students, email, password);
    if (!res.ok) {
      setAuthError(res.error);
      return;
    }
    if (res.role === 'admin') {
      onAdminLoginSuccess();
      return;
    }
    onLoginSuccess(res.student);
  };

  const handleAdminQuickFill = (targetEmail: string) => {
    setAuthError(null);
    setEmail(targetEmail);
    setPassword('');
    setAuthNotice('Alamat email Admin Master telah diisi. Silakan masukkan kata sandi.');
  };

  const handleQuickTrialLogin = (targetEmail: string, fallbackPass: string) => {
    setAuthError(null);
    setEmail(targetEmail);
    setPassword(fallbackPass);
    const res = authenticateStudent(students, targetEmail, fallbackPass);
    if (res.ok) {
      if (res.role === 'admin') {
        onAdminLoginSuccess();
      } else {
        onLoginSuccess(res.student);
      }
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const res = registerStudentAccount(students, {
      name: regName,
      email: regEmail,
      password: regPassword,
      gender: regGender,
      grade: regGrade,
    });

    if (!res.ok) {
      setRegError(res.error);
      return;
    }

    onStudentsUpdate(res.updatedStudents);
    setShowRegisterModal(false);
    onLoginSuccess(res.student);
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (resetNewPassword.trim() !== resetConfirmPassword.trim()) {
      setResetError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    const res = updateStudentPassword(students, resetEmail, resetNewPassword);
    if (!res.ok) {
      setResetError(res.error);
      return;
    }

    onStudentsUpdate(res.updatedStudents);
    setEmail(resetEmail);
    setPassword(resetNewPassword);
    setAuthNotice(res.message);
    setShowForgotModal(false);
    setResetNewPassword('');
    setResetConfirmPassword('');
  };

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen mutabaah-bg text-slate-100 flex flex-col justify-between relative overflow-x-hidden"
    >
      {/* Top Bar: Mutaba'ah Perilaku Brand on Top Left + Language Selector on Top Right */}
      <header className="w-full max-w-6xl mx-auto px-6 pt-7 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Yellow Rounded Square Crescent Moon & Star Icon */}
          <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#071c15]" fill="currentColor">
              <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
              <circle cx="17.5" cy="6.5" r="1.5" />
            </svg>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-display-serif text-lg sm:text-xl font-bold tracking-wider text-white">
              MUTABA&apos;AH PERILAKU
            </span>
            <span className="text-[11px] font-semibold text-amber-400/95 border border-amber-500/35 bg-amber-500/10 px-3 py-0.5 rounded-full">
              Sistem Evaluasi Terpadu
            </span>
          </div>
        </div>

        {/* Language Quick Switcher in Header */}
        <div className="flex items-center gap-2 bg-emerald-950/70 border border-emerald-700/40 rounded-xl px-3 py-1.5 text-xs">
          <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <label htmlFor="header-lang-select" className="text-emerald-200/80 font-medium">
            Ubah Bahasa:
          </label>
          <select
            id="header-lang-select"
            aria-label="Ubah Bahasa"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
            className="bg-transparent text-amber-300 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="id" className="bg-[#071c15] text-white">
              Bahasa Indonesia
            </option>
            <option value="en" className="bg-[#071c15] text-white">
              English
            </option>
            <option value="ar" className="bg-[#071c15] text-white">
              العربية (Arabic)
            </option>
            <option value="ms" className="bg-[#071c15] text-white">
              Bahasa Melayu
            </option>
          </select>
        </div>
      </header>

      {/* Main Split Content */}
      <main className="w-full max-w-6xl mx-auto px-6 py-6 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center flex-1">
        {/* Left Column: Hero Information & Quick Student Trial Access */}
        <div className="lg:col-span-7 space-y-6">
          {/* Program Kicker Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-600/40 text-emerald-300 text-xs sm:text-sm font-medium shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{t.heroBadge}</span>
          </div>

          {/* Display Headline Matching Image */}
          <div className="space-y-1">
            <h1 className="font-display-serif text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight leading-[1.08] text-white">
              <span className="block">{t.heroLine1}</span>
              <span className="block">{t.heroLine2}</span>
            </h1>
            <p className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold tracking-tight leading-[1.12] text-gradient-gold-emerald pt-1">
              {t.heroLine3}
            </p>
          </div>

          {/* Description */}
          <p className="text-slate-300/90 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
            {t.heroDesc}
          </p>

          {/* 2 Feature Highlight Boxes (7 Hari Akhlak & 7 Jubah Mulia) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl pt-1">
            <div className="rounded-2xl bg-[#0e2a21]/85 border border-emerald-800/50 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>7 Hari Akhlak</span>
              </div>
              <p className="text-xs text-slate-300/80 leading-relaxed">
                Tantangan harian sholat, mengaji, hafalan, kejujuran, dan adab.
              </p>
            </div>

            <div className="rounded-2xl bg-[#0e2a21]/85 border border-emerald-800/50 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Award className="w-4 h-4 shrink-0" />
                <span>7 Jubah Mulia & Karakter Blox</span>
              </div>
              <p className="text-xs text-slate-300/80 leading-relaxed">
                Apresiasi visual karakter Roblox & tukar koin aksesori setiap menyelesaikan misi.
              </p>
            </div>
          </div>

          {/* AKSES CEPAT UJI COBA: putra@murid.id & putri@murid.id */}
          <div className="space-y-3 pt-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-amber-400">
              <Zap className="w-3.5 h-3.5" />
              <span>{t.quickTrialLabel}</span>
            </div>

            {/* 2 Akun Uji Coba Permanen: putra@murid.id & putri@murid.id (Tidak bisa dihapus & langsung masuk) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Uji Coba Putra: putra@murid.id */}
              <button
                type="button"
                onClick={() => handleQuickTrialLogin('putra@murid.id', 'siswa123')}
                className="group flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0c2d22]/90 hover:bg-[#113d2e] border border-emerald-500/40 hover:border-emerald-400 transition-all text-left cursor-pointer shadow-md"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border border-emerald-500/40 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src="/assets/aistudio/Gemini_Generated_Image_9lsoza9lsoza9lso_7e9a8ad7.jpg"
                      alt="Siswa Putra"
                      className="w-9 h-9 object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                      Siswa: Putra
                    </div>
                    <div className="text-[11px] text-emerald-200/80 font-mono truncate">
                      putra@murid.id
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shrink-0">
                  Laki-laki
                </span>
              </button>

              {/* Uji Coba Putri: putri@murid.id */}
              <button
                type="button"
                onClick={() => handleQuickTrialLogin('putri@murid.id', 'siswi123')}
                className="group flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#24162b]/85 hover:bg-[#311c3b] border border-pink-500/40 hover:border-pink-400 transition-all text-left cursor-pointer shadow-md"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border border-pink-500/40 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src="/assets/aistudio/Gemini_Generated_Image_wzd2ahwzd2ahwzd2_b40300a5.jpg"
                      alt="Siswi Putri"
                      className="w-9 h-9 object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                      Siswi: Putri
                    </div>
                    <div className="text-[11px] text-pink-200/80 font-mono truncate">
                      putri@murid.id
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-pink-500/25 text-pink-300 border border-pink-500/40 shrink-0">
                  Perempuan
                </span>
              </button>
            </div>

            {/* Quick Access: Dasbor Admin Master */}
            <button
              type="button"
              onClick={() => handleAdminQuickFill('hariffalah75@mutabaah.id')}
              className="w-full group flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-950/70 hover:bg-amber-900/80 border border-amber-400/50 hover:border-amber-300 transition-all text-left cursor-pointer shadow-md"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-[#071c15] flex items-center justify-center shrink-0 shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-amber-300 group-hover:text-white transition-colors truncate">
                    Dasbor Admin Master (Guru &amp; Pembimbing)
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 shrink-0">
                Admin Master
              </span>
            </button>
          </div>
        </div>

        {/* Right Column: Facebook-Style White Login Card */}
        <div className="lg:col-span-5">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50 border border-slate-100 max-w-md mx-auto">
            {/* Portal Kicker */}
            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase text-emerald-700">
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.portalTitle}</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">mutaba&apos;ah.id</span>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {t.welcomeBack}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-5 leading-relaxed">
              {t.welcomeSub}
            </p>

            {authError && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{authError}</span>
              </div>
            )}

            {authNotice && (
              <div
                role="status"
                className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{authNotice}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  {t.emailLabel}
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="putra@murid.id, putri@murid.id, atau admin@muhasabah.id"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold text-slate-700"
                  >
                    {t.passwordLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Sembunyikan</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-5 rounded-xl bg-[#046c4e] hover:bg-[#03543f] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-amber-300" />
                <span>{t.loginButton}</span>
              </button>
            </form>

            {/* Forgot Password & Change Password Link Row (Facebook style below login button) */}
            <div className="mt-3.5 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setResetError(null);
                  setShowForgotModal(true);
                }}
                className="font-semibold text-emerald-700 hover:text-emerald-900 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{t.forgotPassword}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setResetError(null);
                  setShowForgotModal(true);
                }}
                className="font-medium text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
              >
                {t.changePassword}
              </button>
            </div>

            {/* Divider ATAU */}
            <div className="my-4 flex items-center gap-3">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {t.orDivider}
              </span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            {/* Create New Account Button (Pembuatan Akun) */}
            <button
              type="button"
              onClick={() => {
                setRegError(null);
                setShowRegisterModal(true);
              }}
              className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-emerald-700" />
              <span>{t.registerButton}</span>
            </button>

            <p className="text-[11px] text-center text-slate-400 mt-2.5">
              {t.registerHint}
            </p>

            {/* Facebook-style Bottom Language Switcher inside Login Card */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-center flex-wrap gap-2">
                {(
                  [
                    { code: 'id', label: 'Bahasa Indonesia' },
                    { code: 'en', label: 'English (UK)' },
                    { code: 'ar', label: 'العربية' },
                    { code: 'ms', label: 'Bahasa Melayu' },
                  ] as { code: LanguageCode; label: string }[]
                ).map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => onLanguageChange(item.code)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      language === item.code
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer Quote & Attribution Matching Reference Image */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-5 border-t border-emerald-900/50 text-center space-y-1.5">
        <p className="text-xs sm:text-sm text-slate-300/90 flex items-center justify-center gap-2 flex-wrap">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            &ldquo;Sesungguhnya Allah menyukai orang-orang yang bertaubat dan menyucikan diri.&rdquo; (QS. Al-Baqarah: 222)
          </span>
        </p>
        <p className="text-xs text-slate-400">
          Powered by: <span className="font-bold text-amber-400">&ldquo;Harif Falah&rdquo;</span>
        </p>
      </footer>

      {/* MODAL 1: Pembuatan Akun Siswa/Siswi Baru */}
      {showRegisterModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-register-title"
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        >
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 id="modal-register-title" className="text-lg font-extrabold text-slate-900">
                  Daftar Akun Siswa / Siswi Baru
                </h3>
                <p className="text-xs text-slate-500">
                  Dapatkan karakter Roblox santri & bonus 200 Koin pertama!
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup modal pendaftaran"
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {regError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="reg-name" className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Siswa/Siswi
                </label>
                <input
                  id="reg-name"
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Contoh: Nabil Al-Faruq"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-xs font-bold text-slate-700 mb-1">
                  Email Murid (@murid.id)
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="nabil@murid.id"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-gender" className="block text-xs font-bold text-slate-700 mb-1">
                    Karakter Siswa
                  </label>
                  <select
                    id="reg-gender"
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value as Gender)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
                  >
                    <option value="putra">Siswa Putra (Laki-laki)</option>
                    <option value="putri">Siswi Putri (Perempuan)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="reg-grade" className="block text-xs font-bold text-slate-700 mb-1">
                    Kelas / Asrama
                  </label>
                  <input
                    id="reg-grade"
                    type="text"
                    value={regGrade}
                    onChange={(e) => setRegGrade(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-pass" className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  id="reg-pass"
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                >
                  Buat Akun & Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Lupa Kata Sandi & Ubah Kata Sandi */}
      {showForgotModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-forgot-title"
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        >
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 id="modal-forgot-title" className="text-lg font-extrabold text-slate-900">
                  Lupa / Ubah Kata Sandi Siswa
                </h3>
                <p className="text-xs text-slate-500">
                  Atur ulang kata sandi untuk akun putri@murid.id, putra@murid.id, atau akunmu.
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup modal ubah kata sandi"
                onClick={() => setShowForgotModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {resetError}
              </div>
            )}

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="reset-email" className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih atau Ketik Email Siswa
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="putra@murid.id atau putri@murid.id"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
                />
                <div className="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setResetEmail('putra@murid.id')}
                    className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold cursor-pointer"
                  >
                    putra@murid.id
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetEmail('putri@murid.id')}
                    className="text-[11px] px-2 py-0.5 rounded bg-pink-50 text-pink-700 font-semibold cursor-pointer"
                  >
                    putri@murid.id
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="reset-new-pass" className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  id="reset-new-pass"
                  type="password"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="reset-confirm-pass" className="block text-xs font-bold text-slate-700 mb-1">
                  Ulangi Kata Sandi Baru
                </label>
                <input
                  id="reset-confirm-pass"
                  type="password"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                >
                  Simpan Kata Sandi Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
