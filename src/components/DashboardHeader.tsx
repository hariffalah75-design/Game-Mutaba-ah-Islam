import React from 'react';
import {
  Gamepad2,
  ClipboardCheck,
  History,
  Settings,
  MessageCircle,
  Shield,
  LogOut,
  Flame,
} from 'lucide-react';
import {
  LanguageCode,
  StudentAccount,
  TRANSLATIONS,
} from '../game/rules';

export type ActiveTab = 'beranda' | 'tantangan' | 'riwayat' | 'pengaturan';

interface DashboardHeaderProps {
  student: StudentAccount;
  language: LanguageCode;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  remainingTasksCount: number;
  unreadChatCount: number;
  isChatOpen: boolean;
  onToggleChat: () => void;
  onOpenAdminMaster?: () => void;
  onLogout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  student,
  language,
  activeTab,
  onSelectTab,
  unreadChatCount,
  isChatOpen,
  onToggleChat,
  onOpenAdminMaster,
  onLogout,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 lg:py-0 lg:h-16 flex flex-wrap lg:flex-nowrap items-center justify-between gap-y-2 gap-x-2 sm:gap-x-3">
        {/* 1. Logo Bulan Sabit + 2. Nama MUTABA'AH PERILAKU + 3. Label PORTAL SISWA & SISWI */}
        <div className="order-1 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onSelectTab('beranda')}
            className="flex items-center gap-2 sm:gap-2.5 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#064e3b] flex items-center justify-center shadow-xs shrink-0 border border-emerald-700">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-400" fill="currentColor">
                <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
                <circle cx="17.5" cy="6.5" r="1.5" />
              </svg>
            </div>
            <div>
              <div className="font-display-serif font-extrabold text-xs sm:text-base tracking-wide text-slate-900 group-hover:text-emerald-800 transition-colors leading-tight">
                MUTABA&apos;AH PERILAKU
              </div>
              <div className="text-[9px] sm:text-[11px] text-emerald-700 font-extrabold tracking-wider uppercase">
                PORTAL SISWA &amp; SISWI
              </div>
            </div>
          </button>
        </div>

        {/* 4. Menu Beranda | 5. Menu Tantangan | 6. Menu Riwayat | 7. Menu Pengaturan */}
        <nav
          aria-label="Navigasi Utama Portal Siswa dan Siswi"
          className="order-3 lg:order-2 w-full lg:w-auto grid grid-cols-4 lg:flex items-center gap-1 sm:gap-1.5 pt-1.5 lg:pt-0 border-t lg:border-t-0 border-slate-100"
        >
          {/* 4. Menu Beranda */}
          <button
            type="button"
            onClick={() => onSelectTab('beranda')}
            className={`relative h-9 sm:h-10 px-2 sm:px-3.5 rounded-xl flex items-center justify-center gap-1.5 text-[11px] sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'beranda'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>{t.navHome}</span>
          </button>

          {/* 5. Menu Tantangan (Indikator Aktif Berwarna Hijau) */}
          <button
            type="button"
            onClick={() => onSelectTab('tantangan')}
            className={`relative h-9 sm:h-10 px-2 sm:px-3.5 rounded-xl flex items-center justify-center gap-1.5 text-[11px] sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tantangan'
                ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Tantangan</span>
          </button>

          {/* 6. Menu Riwayat */}
          <button
            type="button"
            onClick={() => onSelectTab('riwayat')}
            className={`relative h-9 sm:h-10 px-2 sm:px-3.5 rounded-xl flex items-center justify-center gap-1.5 text-[11px] sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'riwayat'
                ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Riwayat</span>
          </button>

          {/* 7. Menu Pengaturan */}
          <button
            type="button"
            onClick={() => onSelectTab('pengaturan')}
            className={`relative h-9 sm:h-10 px-2 sm:px-3.5 rounded-xl flex items-center justify-center gap-1.5 text-[11px] sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pengaturan'
                ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Pengaturan</span>
          </button>
        </nav>

        {/* Right Zone: 8. Informasi Streak + Guru/Admin + Chat + 9. Tombol Keluar */}
        <div className="order-2 lg:order-3 flex items-center gap-1 sm:gap-2 shrink-0">
          {/* 8. Informasi Streak */}
          <div
            title="Informasi Streak Ibadah Harian Siswa"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 font-mono-tabular text-[11px] sm:text-xs font-extrabold whitespace-nowrap"
          >
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500 shrink-0" />
            <span>{student.streakDays} Hari Streak</span>
          </div>

          {/* Chat Sesama Siswa Button */}
          <button
            type="button"
            onClick={onToggleChat}
            aria-label="Buka Chat Sesama Siswa"
            className={`relative flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer whitespace-nowrap ${
              isChatOpen
                ? 'bg-emerald-700 text-white border-emerald-800'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden xl:inline">Chat</span>
            {unreadChatCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-mono-tabular text-[10px] font-extrabold">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* 9. Tombol Keluar */}
          <button
            type="button"
            onClick={onLogout}
            title="Keluar dari Akun Siswa"
            aria-label="Keluar"
            className="px-2 sm:px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
