# REVISI RENCANA IMPLEMENTASI: EMAIL ADMIN @MUTABAAH & SISTEM KUNCI SALAT HARIAN

## 1. Akun Login Admin Master
- Akun utama Admin Master menggunakan domain `@mutabaah`:
  - **Email**: `hariffalah75@mutabaah.id` (dengan alias `hariffalah75@gmail.com` dan `admin@mutabaah.id`)
  - **Kata Sandi**: `Ferarizky123#`
- Di halaman `LoginPage.tsx`:
  - Tampilkan tombol akses cepat / petunjuk akun Admin Master: `hariffalah75@mutabaah.id`.

## 2. Penghapusan Total Akses Guru/Admin dari Portal Siswa
- Menghapus tombol *Panel Guru / Admin* dari navbar `DashboardHeader.tsx` dan dari komponen portal murid lainnya.
- Menghilangkan fungsi pintas `onOpenAdminMaster` pada portal siswa.
- Siswa tidak memiliki akses ke dasbor admin dari dalam akun; guru/admin masuk secara terpisah melalui halaman login awal.

## 3. Sistem Pembukaan Salat Harian Jam 05:00 – 07:00 WIB & Pembukaan dengan Sandi Guru
- Pada `mutabaahChallenges.ts`:
  - Membuat fungsi `getDailyPrayerWindowStatus(targetDay: DayOfWeekId, nowMs?: number)`.
  - Mengonversi waktu saat ini ke WIB (UTC+7):
    - Jika hari ini sama dengan `targetDay` dan jam berada antara **05:00 sampai 07:00 WIB**, sesi salat terbuka otomatis (`terbuka_otomatis_05_07`).
    - Jika di luar rentang jam 05:00 – 07:00 WIB atau hari berbeda, sesi berstatus terkunci (`terkunci_harian`).
- **Aturan Buka Kunci dengan Sandi Guru**:
  - Tombol **Buka Kunci Akses** pada kartu Tantangan **TIDAK AKAN LANGSUNG MEMBUKA KUNCI** saat diklik. Tombol ini wajib memunculkan modal input PIN Guru / Orang Tua (`987654`).
  - Setelah guru/orang tua memasukkan PIN yang benar, akses salat untuk hari tersebut terbuka.

## 4. Sesi Hafalan Al-Qur'an Hanya Dibuka oleh Guru & Sandi Dirahasiakan
- Fitur pengajuan setoran hafalan hanya aktif jika guru telah membuka sesi pembelajaran agama (`quranSessionConfig.isOpen === true`). Jika sesi ditutup guru, muncul notifikasi bahwa sesi hafalan sedang ditutup oleh guru.
- Angka sandi `753690` dirahasiakan sepenuhnya dari antarmuka murid (dihapus dari placeholder, teks penjelasan, dan label tombol).

---

## 5. Rincian Modifikasi File
1. `/src/game/rules.ts`:
   - Daftarkan `hariffalah75@mutabaah.id` dan `hariffalah75@gmail.com` dengan sandi `Ferarizky123#` di `authenticateStudent`.
2. `/src/components/LoginPage.tsx`:
   - Perbarui petunjuk & tombol akses cepat Admin Master menjadi `hariffalah75@mutabaah.id`.
3. `/src/components/DashboardHeader.tsx` & `/src/App.tsx`:
   - Hapus tombol dan callback `Panel Guru / Admin` di portal siswa.
4. `/src/game/mutabaahChallenges.ts`:
   - Implementasikan fungsi `getDailyPrayerWindowStatus` (WIB 05:00 - 07:00).
5. `/src/components/ChallengesView.tsx`:
   - Ubah tombol `Buka Kunci Akses` agar selalu membuka modal PIN guru.
   - Tampilkan informasi jadwal pembukaan jam 05:00 - 07:00 WIB.
   - Sembunyikan sandi `753690` dari pandangan siswa.
   - Kunci Sesi Hafalan Al-Qur'an jika `!quranSessionConfig.isOpen`.
6. `/src/game/rules.test.ts`:
   - Tambahkan pengujian login admin `hariffalah75@mutabaah.id` dan logika jam 05:00 - 07:00 WIB.

---

## 6. Verifikasi
- Jalankan test `npx tsx --test src/game/rules.test.ts`.
- Jalankan `compile_applet` dan `lint_applet`.
- Restart dev server dan uji coba alur kerja aplikasi.
