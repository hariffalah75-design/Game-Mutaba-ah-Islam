export type LanguageCode = 'id' | 'en' | 'ar' | 'ms';

export type Gender = 'putra' | 'putri';

export type TaskCategory = 'sholat' | 'mengaji' | 'hafalan' | 'akhlak';

export interface DailyTask {
  id: string;
  title: string;
  subtitle: string;
  category: TaskCategory;
  coins: number;
  xp: number;
  completed: boolean;
  timeLabel: string;
  streakDays: number;
}

export interface QuizQuestion {
  id: string;
  category: TaskCategory;
  question: string;
  options: [string, string, string, string];
  correctIndex: number; // 0..3
  xpReward: number;
  coinReward: number;
  createdBy: string;
}

export interface PrayerPromptItem {
  id: string;
  title: string;
  arabic: string;
  latin: string;
  meaning: string;
  xpReward: number;
}

export interface PrayerRecordingSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  prayerId: string;
  prayerTitle: string;
  durationSeconds: number;
  submittedAt: string;
  audioDataUrl?: string;
  notes: string;
  verifiedByAdmin: boolean;
}

export interface SessionPasscodes {
  quranHafalanPin: string; // Default: "753690"
  prayerRecordingPin: string; // Default: "1234LIMA"
}

export const DEFAULT_SESSION_PASSCODES: SessionPasscodes = {
  quranHafalanPin: '753690',
  prayerRecordingPin: '1234LIMA',
};

export type CharacterExpression =
  | 'marah'
  | 'sakit'
  | 'senang'
  | 'bangga'
  | 'khusyuk';

export type JubahCorakType = 'polos' | 'aurora' | 'api' | 'panda' | 'naga';

export interface JubahRobeDesign {
  id: string;
  tier: number;
  name: string;
  titleBadge: string;
  requiredCompletedTasks: number;
  pointCost: number; // Poin dari Tantangan Sholat (min 150 poin = 3 hari sholat fardu penuh)
  colorThemeLabel: string;
  corakLabel: string;
  corakType: JubahCorakType;
  gradientTopHex: string;
  gradientBottomHex: string;
  accentHex: string;
  description: string;
  cloakOuterColor: string;
  cloakInnerColor: string;
  tunicColor: string;
  trimGoldColor: string;
  pauldronStyle: 'none' | 'leather' | 'royal_gold' | 'emerald_knight' | 'celestial_wings';
  hoodStyle: 'hood_down' | 'arcane_hood' | 'noble_cape' | 'sultan_collar' | 'commander_crest';
  staffProp: 'wooden_staff' | 'golden_lantern' | 'mushaf_scroll' | 'star_banner' | 'crescent_scepter';
  patternType: 'stars' | 'geometric' | 'flames' | 'emerald_runes' | 'royal_sun';
}

export interface BedroomState {
  bedMessy: boolean;
  clothesMessy: boolean;
  hunger: number;
  cleanliness: number;
}

export interface StudentAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  gender: Gender;
  grade: string;
  coins: number;
  xp: number;
  streakDays: number;
  selectedJubahId: string;
  ownedJubahIds?: string[];
  spentSholatPoints?: number;
  bedroom: BedroomState;
  reflectionNote: string;
  answeredQuestionIds?: string[];
  unlockedQuranHafalan?: boolean;
  unlockedPrayerRecording?: boolean;
  isTrialAccount?: boolean;
}

export const TRIAL_STUDENT_IDS = ['student_putra', 'student_putri'] as const;
export const TRIAL_STUDENT_EMAILS = ['putra@murid.id', 'putri@murid.id'] as const;

export function isTrialStudent(studentOrId: StudentAccount | string): boolean {
  const id = typeof studentOrId === 'string' ? studentOrId : studentOrId.id;
  const email = typeof studentOrId === 'string' ? '' : studentOrId.email?.toLowerCase();
  return (
    id === 'student_putra' ||
    id === 'student_putri' ||
    email === 'putra@murid.id' ||
    email === 'putri@murid.id'
  );
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderGender: Gender;
  recipientId: string;
  text: string;
  timestamp: string;
  sharedOutfitLabel?: string;
}

export const INITIAL_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'soal_1',
    category: 'sholat',
    question: 'Berapakah jumlah total rakaat sholat fardhu 5 waktu dalam sehari semalam?',
    options: ['15 Rakaat', '17 Rakaat', '19 Rakaat', '20 Rakaat'],
    correctIndex: 1,
    xpReward: 70,
    coinReward: 50,
    createdBy: 'Admin Master',
  },
  {
    id: 'soal_2',
    category: 'mengaji',
    question: 'Apabila ada Nun Sukun (نْ) atau Tanwin bertemu dengan huruf Ba (ب), maka hukum bacaan tajwidnya adalah...',
    options: ['Idzhar Halqi', 'Iqlab', 'Idgham Bighunnah', 'Ikhfa Haqiqi'],
    correctIndex: 1,
    xpReward: 80,
    coinReward: 60,
    createdBy: 'Admin Master',
  },
  {
    id: 'soal_3',
    category: 'hafalan',
    question: 'Surat apakah dalam Juz \'Amma yang memiliki arti "Berita Besar" dan terdiri dari 40 ayat?',
    options: ['QS. An-Naba\'', 'QS. An-Nazi\'at', 'QS. \'Abasa', 'QS. Al-Mulk'],
    correctIndex: 0,
    xpReward: 85,
    coinReward: 65,
    createdBy: 'Admin Master',
  },
  {
    id: 'soal_4',
    category: 'akhlak',
    question: 'Doa "Rabbighfirlii waliwaalidayya warhamhumaa kamaa rabbayaanii shaghiiraa" adalah doa untuk...',
    options: [
      'Masuk ke dalam masjid',
      'Kedua orang tua yang telah mendidik kita sejak kecil',
      'Sebelum makan dan minum',
      'Bercermin di pagi hari',
    ],
    correctIndex: 1,
    xpReward: 75,
    coinReward: 55,
    createdBy: 'Admin Master',
  },
];

export const INITIAL_PRAYER_PROMPTS: PrayerPromptItem[] = [
  {
    id: 'doa_ortu',
    title: 'Doa Untuk Kedua Orang Tua',
    arabic: 'رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
    latin: 'Rabbighfir lii waliwaalidayya warhamhumaa kamaa rabbayaanii shaghiiraa.',
    meaning: 'Ya Tuhanku, ampunilah dosaku dan dosa kedua orang tuaku, serta sayangilah mereka sebagaimana mereka menyayangiku di waktu kecil.',
    xpReward: 90,
  },
  {
    id: 'doa_ilmu',
    title: 'Doa Tambahan Ilmu & Pemahaman',
    arabic: 'رَبِّ زِدْنِي عِلْمًا وَارْزُقْنِي فَهْمًا وَاجْعَلْنِي مِنَ الصَّالِحِينَ',
    latin: 'Rabbi zidnii \'ilman warzuqnii fahman waj\'alnii minash-shaalihiin.',
    meaning: 'Ya Tuhanku, tambahkanlah ilmu kepadaku, berilah aku pemahaman yang baik, dan jadikanlah aku termasuk golongan orang-orang yang shalih.',
    xpReward: 85,
  },
  {
    id: 'doa_sapujagad',
    title: 'Doa Kebaikan Dunia & Akhirat (Sapu Jagad)',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    latin: 'Rabbanaa aatinaa fid-dunyaa hasanatan wa fil-aakhirati hasanatan wa qinaa \'adzaaban-naar.',
    meaning: 'Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat, serta lindungilah kami dari siksa neraka.',
    xpReward: 95,
  },
];

export const JUBAH_DESIGNS: JubahRobeDesign[] = [
  {
    id: 'jubah_1_pengembara',
    tier: 1,
    name: 'Jubah Santri Klasik',
    titleBadge: 'Jubah 1 · Corak Biasa',
    requiredCompletedTasks: 0,
    pointCost: 0,
    colorThemeLabel: 'Coklat Klasik',
    corakLabel: 'Corak Polos Biasa',
    corakType: 'polos',
    gradientTopHex: '#b5895a',
    gradientBottomHex: '#8c6239',
    accentHex: '#fde68a',
    description: 'Jubah santri klasik dengan warna kalem dan corak polos rapi untuk memulai perjalanan ibadah.',
    cloakOuterColor: '#b5895a',
    cloakInnerColor: '#78350f',
    tunicColor: '#8c6239',
    trimGoldColor: '#fde68a',
    pauldronStyle: 'leather',
    hoodStyle: 'arcane_hood',
    staffProp: 'wooden_staff',
    patternType: 'stars',
  },
  {
    id: 'jubah_2_zamrud',
    tier: 2,
    name: 'Jubah Aurora Biru-Ungu',
    titleBadge: 'Jubah 2 · Biru ke Unguan',
    requiredCompletedTasks: 3,
    pointCost: 150,
    colorThemeLabel: 'Biru ke Unguan',
    corakLabel: 'Corak Bintang Aurora',
    corakType: 'aurora',
    gradientTopHex: '#2563eb',
    gradientBottomHex: '#9333ea',
    accentHex: '#e9d5ff',
    description: 'Jubah gradasi biru ke unguan yang anggun dengan taburan corak bintang dan kristal aurora bercahaya.',
    cloakOuterColor: '#2563eb',
    cloakInnerColor: '#6b21a8',
    tunicColor: '#7c3aed',
    trimGoldColor: '#c4b5fd',
    pauldronStyle: 'emerald_knight',
    hoodStyle: 'noble_cape',
    staffProp: 'golden_lantern',
    patternType: 'geometric',
  },
  {
    id: 'jubah_3_tilawah',
    tier: 3,
    name: 'Jubah Kobaran Api Zamrud',
    titleBadge: 'Jubah 3 · Corak Api',
    requiredCompletedTasks: 5,
    pointCost: 180,
    colorThemeLabel: 'Hijau ke Kuningan',
    corakLabel: 'Corak Api Berkobar',
    corakType: 'api',
    gradientTopHex: '#059669',
    gradientBottomHex: '#eab308',
    accentHex: '#fef08a',
    description: 'Jubah gradasi hijau ke kuningan yang meriah dengan corak lidah api berkobar di sepanjang jubah dan lengan.',
    cloakOuterColor: '#059669',
    cloakInnerColor: '#ca8a04',
    tunicColor: '#10b981',
    trimGoldColor: '#fde047',
    pauldronStyle: 'royal_gold',
    hoodStyle: 'sultan_collar',
    staffProp: 'mushaf_scroll',
    patternType: 'flames',
  },
  {
    id: 'jubah_4_hafidz',
    tier: 4,
    name: 'Jubah Ksatria Panda',
    titleBadge: 'Jubah 4 · Corak Panda',
    requiredCompletedTasks: 7,
    pointCost: 240,
    colorThemeLabel: 'Merah ke Orenan',
    corakLabel: 'Corak Panda & Bambu',
    corakType: 'panda',
    gradientTopHex: '#dc2626',
    gradientBottomHex: '#f97316',
    accentHex: '#fed7aa',
    description: 'Jubah gradasi merah ke orenan yang ceria dengan corak wajah panda imut, jejak kaki panda, dan bambu emas.',
    cloakOuterColor: '#dc2626',
    cloakInnerColor: '#ea580c',
    tunicColor: '#f97316',
    trimGoldColor: '#fed7aa',
    pauldronStyle: 'royal_gold',
    hoodStyle: 'commander_crest',
    staffProp: 'star_banner',
    patternType: 'emerald_runes',
  },
  {
    id: 'jubah_5_alfatih',
    tier: 5,
    name: 'Jubah Kaisar Naga Emas',
    titleBadge: 'Jubah 5 · Corak Naga',
    requiredCompletedTasks: 10,
    pointCost: 300,
    colorThemeLabel: 'Ungu ke Kuningan',
    corakLabel: 'Corak Naga Emas',
    corakType: 'naga',
    gradientTopHex: '#6b21a8',
    gradientBottomHex: '#facc15',
    accentHex: '#fef08a',
    description: 'Jubah agung gradasi ungu ke kuningan emas dengan corak naga legendaris dan sisik emas berkilau.',
    cloakOuterColor: '#6b21a8',
    cloakInnerColor: '#ca8a04',
    tunicColor: '#7e22ce',
    trimGoldColor: '#facc15',
    pauldronStyle: 'celestial_wings',
    hoodStyle: 'commander_crest',
    staffProp: 'crescent_scepter',
    patternType: 'royal_sun',
  },
];

export const INITIAL_DAILY_TASKS: DailyTask[] = [
  // 1. SHOLAT (Separated Category)
  {
    id: 'sholat_subuh',
    title: 'Sholat Subuh Tepat Waktu',
    subtitle: 'Dilaksanakan berjamaah atau di awal waktu beserta dzikir pagi.',
    category: 'sholat',
    coins: 50,
    xp: 60,
    completed: true,
    timeLabel: '04:30 - 05:30',
    streakDays: 5,
  },
  {
    id: 'sholat_dzuhur',
    title: 'Sholat Dzuhur & Rawatib',
    subtitle: 'Menjaga sholat Dzuhur 4 rakaat dengan tertib dan tuma\'ninah.',
    category: 'sholat',
    coins: 40,
    xp: 50,
    completed: true,
    timeLabel: '12:00 - 13:00',
    streakDays: 6,
  },
  {
    id: 'sholat_ashar',
    title: 'Sholat Ashar Berjamaah',
    subtitle: 'Segera mengambil wudhu saat adzan Ashar berkumandang.',
    category: 'sholat',
    coins: 45,
    xp: 50,
    completed: false,
    timeLabel: '15:15 - 16:30',
    streakDays: 4,
  },
  {
    id: 'sholat_maghrib',
    title: 'Sholat Maghrib & Doa Orang Tua',
    subtitle: 'Sholat Maghrib dilanjutkan mendoakan kedua orang tua dan guru.',
    category: 'sholat',
    coins: 45,
    xp: 55,
    completed: false,
    timeLabel: '18:00 - 18:45',
    streakDays: 7,
  },
  {
    id: 'sholat_isya',
    title: 'Sholat Isya & Witir Sebelum Tidur',
    subtitle: 'Menutup ibadah wajib harian dengan sholat Isya yang khusyuk.',
    category: 'sholat',
    coins: 50,
    xp: 60,
    completed: false,
    timeLabel: '19:15 - 20:30',
    streakDays: 4,
  },
  {
    id: 'sholat_dhuha',
    title: 'Sholat Sunnah Dhuha 2-4 Rakaat',
    subtitle: 'Sedekah bagi seluruh persendian tubuh di pagi hari sekolah.',
    category: 'sholat',
    coins: 40,
    xp: 45,
    completed: false,
    timeLabel: '07:00 - 10:00',
    streakDays: 3,
  },

  // 2. MENGAJI / SESI BACA AL-QUR'AN (Locked by default with 753690)
  {
    id: 'mengaji_tilawah_pagi',
    title: 'Tilawah Al-Qur\'an QS. Al-Mulk Ayat 1-5',
    subtitle: 'Membaca Al-Qur\'an dengan tartil dan memperhatikan makharijul huruf.',
    category: 'mengaji',
    coins: 60,
    xp: 75,
    completed: true,
    timeLabel: 'Ba\'da Subuh',
    streakDays: 6,
  },
  {
    id: 'mengaji_tadarus_maghrib',
    title: 'Sesi Baca Al-Qur\'an & Tadarus Ba\'da Maghrib',
    subtitle: 'Membaca Al-Qur\'an bersama pembimbing dengan irama tartil.',
    category: 'mengaji',
    coins: 65,
    xp: 80,
    completed: false,
    timeLabel: 'Ba\'da Maghrib',
    streakDays: 5,
  },
  {
    id: 'mengaji_tajwid_terjemah',
    title: 'Kajian Tajwid & Tadabbur Arti Ayat',
    subtitle: 'Memahami arti 3 ayat yang dibaca dan hukum bacaan tajwidnya.',
    category: 'mengaji',
    coins: 55,
    xp: 65,
    completed: false,
    timeLabel: 'Sore Hari',
    streakDays: 3,
  },

  // 3. HAFALAN / SESI HAFALAN (Locked by default with 753690)
  {
    id: 'hafalan_juz_amma',
    title: 'Setoran Hafalan Surat Pendek (QS. An-Naba\')',
    subtitle: 'Menambah dan melancarkan hafalan minimal 5 ayat baru hari ini.',
    category: 'hafalan',
    coins: 80,
    xp: 100,
    completed: false,
    timeLabel: 'Pagi / Siang',
    streakDays: 5,
  },
  {
    id: 'hafalan_murajaah',
    title: 'Muraja\'ah Hafalan Surat Sebelumnya',
    subtitle: 'Mengulang hafalan surat yang sudah dikuasai agar tidak lupa.',
    category: 'hafalan',
    coins: 65,
    xp: 80,
    completed: false,
    timeLabel: 'Ba\'da Ashar',
    streakDays: 4,
  },
  {
    id: 'hafalan_hadits_doa',
    title: 'Hafalan Hadits Akhlak & Doa Harian',
    subtitle: 'Menghafal hadits kejujuran/adab beserta artinya dengan lancar.',
    category: 'hafalan',
    coins: 60,
    xp: 70,
    completed: false,
    timeLabel: 'Malam Hari',
    streakDays: 6,
  },

  // 4. AKHLAK & ADAB (7 Hari Akhlak)
  {
    id: 'akhlak_bantu_ortu',
    title: 'Membantu Orang Tua & Merapikan Kamar',
    subtitle: 'Berbakti kepada ayah dan ibu dengan senyum dan sopan santun.',
    category: 'akhlak',
    coins: 50,
    xp: 60,
    completed: true,
    timeLabel: 'Sepanjang Hari',
    streakDays: 7,
  },
  {
    id: 'akhlak_jujur_sabar',
    title: 'Jujur dalam Perkataan & Menahan Amarah',
    subtitle: 'Tidak berbohong dan menjaga lisan yang baik kepada teman.',
    category: 'akhlak',
    coins: 55,
    xp: 70,
    completed: false,
    timeLabel: 'Sepanjang Hari',
    streakDays: 5,
  },
];

export const INITIAL_STUDENTS: StudentAccount[] = [
  {
    id: 'student_putra',
    name: 'Putra Pratama',
    email: 'putra@murid.id',
    password: 'siswa123',
    gender: 'putra',
    grade: 'Kelas 7A - Al-Khawarizmi',
    coins: 240,
    xp: 420,
    streakDays: 5,
    selectedJubahId: 'jubah_1_pengembara',
    ownedJubahIds: ['jubah_1_pengembara'],
    spentSholatPoints: 0,
    bedroom: {
      bedMessy: true,
      clothesMessy: true,
      hunger: 65,
      cleanliness: 20,
    },
    reflectionNote: 'Alhamdulillah hari ini bisa bangun Subuh tepat waktu dan siap merapikan kamar sendiri.',
    answeredQuestionIds: [],
    unlockedQuranHafalan: false,
    unlockedPrayerRecording: false,
    isTrialAccount: true,
  },
  {
    id: 'student_putri',
    name: 'Putri Azzahra',
    email: 'putri@murid.id',
    password: 'siswi123',
    gender: 'putri',
    grade: 'Kelas 7B - Rabiah Al-Adawiyah',
    coins: 280,
    xp: 460,
    streakDays: 6,
    selectedJubahId: 'jubah_1_pengembara',
    ownedJubahIds: ['jubah_1_pengembara'],
    spentSholatPoints: 0,
    bedroom: {
      bedMessy: true,
      clothesMessy: false,
      hunger: 75,
      cleanliness: 60,
    },
    reflectionNote: 'Senang sekali hari ini bisa menyelesaikan tilawah 1 halaman dan murajaah surat An-Naba.',
    answeredQuestionIds: [],
    unlockedQuranHafalan: false,
    unlockedPrayerRecording: false,
    isTrialAccount: true,
  },
  {
    id: 'student_ahmad',
    name: 'Ahmad Fauzan',
    email: 'ahmad@santri.id',
    password: 'santri123',
    gender: 'putra',
    grade: 'Kelas 8A - Ibnu Sina',
    coins: 310,
    xp: 520,
    streakDays: 7,
    selectedJubahId: 'jubah_3_tilawah',
    bedroom: {
      bedMessy: false,
      clothesMessy: false,
      hunger: 90,
      cleanliness: 100,
    },
    reflectionNote: 'Semoga istiqomah menjaga sholat berjamaah selama 7 hari penuh.',
    answeredQuestionIds: ['soal_1'],
    unlockedQuranHafalan: true,
    unlockedPrayerRecording: false,
  },
  {
    id: 'student_fatimah',
    name: 'Fatimah Zahra',
    email: 'fatimah@santri.id',
    password: 'santri123',
    gender: 'putri',
    grade: 'Kelas 8B - Aisyah Humaira',
    coins: 340,
    xp: 580,
    streakDays: 7,
    selectedJubahId: 'jubah_4_hafidz',
    bedroom: {
      bedMessy: false,
      clothesMessy: false,
      hunger: 95,
      cleanliness: 100,
    },
    reflectionNote: 'Alhamdulillah setoran hafalan surat Al-Mulk berjalan lancar hari ini.',
    answeredQuestionIds: ['soal_1', 'soal_2'],
    unlockedQuranHafalan: true,
    unlockedPrayerRecording: true,
  },
];

export const INITIAL_PRAYER_SUBMISSIONS: PrayerRecordingSubmission[] = [
  {
    id: 'rec_1',
    studentId: 'student_fatimah',
    studentName: 'Fatimah Zahra',
    studentEmail: 'fatimah@santri.id',
    prayerId: 'doa_ortu',
    prayerTitle: 'Doa Untuk Kedua Orang Tua',
    durationSeconds: 14,
    submittedAt: '12:30 WIB',
    notes: 'Tartil dan makhraj jelas',
    verifiedByAdmin: true,
  },
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_1',
    senderId: 'student_putri',
    senderName: 'Putri Azzahra',
    senderEmail: 'putri@murid.id',
    senderGender: 'putri',
    recipientId: 'group',
    text: 'Assalamu\'alaikum teman-teman! Sudah buka Sesi Baca Al-Qur\'an & Hafalan pakai sandi dari Ustadz/Admin Master belum? 🌟',
    timestamp: '12:45',
  },
  {
    id: 'msg_2',
    senderId: 'student_putra',
    senderName: 'Putra Pratama',
    senderEmail: 'putra@murid.id',
    senderGender: 'putra',
    recipientId: 'group',
    text: 'Wa\'alaikumussalam Putri! Aku baru selesai jawab soal kuis tantangan dan mau lanjut rekaman doa harian! 😄',
    timestamp: '12:47',
  },
  {
    id: 'msg_3',
    senderId: 'student_ahmad',
    senderName: 'Ahmad Fauzan',
    senderEmail: 'ahmad@santri.id',
    senderGender: 'putra',
    recipientId: 'group',
    text: 'Semangat semuanya! Jangan lupa kerjakan soal-soal baru dari Admin Master di menu Tantangan ya! 📖✨',
    timestamp: '13:02',
    sharedOutfitLabel: 'Jubah Ksatria Tilawah · Kamar Rapi 100%',
  },
];

export const TRANSLATIONS: Record<
  LanguageCode,
  {
    langName: string;
    portalTitle: string;
    welcomeBack: string;
    welcomeSub: string;
    emailLabel: string;
    passwordLabel: string;
    loginButton: string;
    forgotPassword: string;
    changePassword: string;
    orDivider: string;
    registerButton: string;
    registerHint: string;
    quickTrialLabel: string;
    heroBadge: string;
    heroLine1: string;
    heroLine2: string;
    heroLine3: string;
    heroDesc: string;
    navHome: string;
    navChallenges: string;
    navSettings: string;
    navChat: string;
    logoutBtn: string;
  }
> = {
  id: {
    langName: 'Bahasa Indonesia',
    portalTitle: 'PORTAL MASUK',
    welcomeBack: 'Selamat Datang Kembali',
    welcomeSub: 'Masuk untuk melanjutkan refleksi dan perkembangan karakter Anda.',
    emailLabel: 'Alamat Email',
    passwordLabel: 'Kata Sandi',
    loginButton: 'Masuk ke Akun',
    forgotPassword: 'Lupa Kata Sandi?',
    changePassword: 'Ubah Kata Sandi',
    orDivider: 'ATAU',
    registerButton: 'Daftar Akun Siswa/Siswi Baru',
    registerHint: 'Belum punya akun? Buat akun siswa/siswi gratis dalam hitungan detik.',
    quickTrialLabel: 'AKSES CEPAT UJI COBA:',
    heroBadge: 'Program Pembiasaan Akhlak & Adab Siswa & Siswi',
    heroLine1: 'TINGKATKAN',
    heroLine2: 'KUALITAS',
    heroLine3: 'Karakter & Jiwa',
    heroDesc:
      'Platform evaluasi diri harian selama 7 hari dengan gamifikasi jubah kemuliaan islami, catatan refleksi nurani, dan sinkronisasi laporan otomatis ke dashboard pembimbing.',
    navHome: 'Beranda',
    navChallenges: 'Tantangan',
    navSettings: 'Pengaturan',
    navChat: 'Chat Siswa',
    logoutBtn: 'Keluar Akun',
  },
  en: {
    langName: 'English',
    portalTitle: 'SIGN IN PORTAL',
    welcomeBack: 'Welcome Back, Student',
    welcomeSub: 'Sign in to continue your daily character reflection and bedroom care journey.',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    loginButton: 'Sign In to Account',
    forgotPassword: 'Forgot Password?',
    changePassword: 'Change Password',
    orDivider: 'OR',
    registerButton: 'Create New Student Account',
    registerHint: 'New here? Register a free student account in seconds.',
    quickTrialLabel: 'QUICK STUDENT TRIAL ACCESS:',
    heroBadge: 'Student Character & Islamic Etiquette Habit Program',
    heroLine1: 'ELEVATE',
    heroLine2: 'YOUR NOBLE',
    heroLine3: 'Character & Soul',
    heroDesc:
      '7-day daily self-evaluation platform featuring Islamic robe gamification, conscience reflection journals, and real-time mentor synchronization.',
    navHome: 'Home Room',
    navChallenges: 'Challenges',
    navSettings: 'Settings',
    navChat: 'Student Chat',
    logoutBtn: 'Log Out',
  },
  ar: {
    langName: 'العربية (Arabic)',
    portalTitle: 'بوابة الدخول',
    welcomeBack: 'أهلاً بك من جديد',
    welcomeSub: 'سجّل الدخول لمتابعة محاسبة النفس وتطوير شخصيتك اليومية.',
    emailLabel: 'البريد الإلكتروني',
    passwordLabel: 'كلمة المرور',
    loginButton: 'تسجيل الدخول',
    forgotPassword: 'هل نسيت كلمة المرور؟',
    changePassword: 'تغيير كلمة المرور',
    orDivider: 'أو',
    registerButton: 'إنشاء حساب طالب/طالبة جديد',
    registerHint: 'ليس لديك حساب؟ أنشئ حساب طالب مجاني في ثوانٍ.',
    quickTrialLabel: 'الدخول السريع للتجربة:',
    heroBadge: 'برنامج غرس الأخلاق والآداب للطلاب والطالبات',
    heroLine1: 'ارتقِ',
    heroLine2: 'بجودة',
    heroLine3: 'الأخلاق والروح',
    heroDesc:
      'منصة التقييم الذاتي اليومي لمدة 7 أيام مع تحفيز حلل الكرامة، وتدوين التأملات، والتواصل بين الطلاب.',
    navHome: 'الرئيسية',
    navChallenges: 'التحديات',
    navSettings: 'الإعدادات',
    navChat: 'محادثة الطلاب',
    logoutBtn: 'تسجيل الخروج',
  },
  ms: {
    langName: 'Bahasa Melayu',
    portalTitle: 'PORTAL LOG MASUK',
    welcomeBack: 'Selamat Kembali',
    welcomeSub: 'Log masuk untuk meneruskan refleksi dan perkembangan sahsiah anda.',
    emailLabel: 'Alamat E-mel',
    passwordLabel: 'Kata Laluan',
    loginButton: 'Log Masuk Akaun',
    forgotPassword: 'Lupa Kata Laluan?',
    changePassword: 'Tukar Kata Laluan',
    orDivider: 'ATAU',
    registerButton: 'Daftar Akaun Murid Baharu',
    registerHint: 'Belum ada akaun? Bina akaun murid percuma dengan pantas.',
    quickTrialLabel: 'AKSES PANTAS PERCUBAAN:',
    heroBadge: 'Program Pembudayaan Akhlak & Adab Murid',
    heroLine1: 'TINGKATKAN',
    heroLine2: 'KUALITI',
    heroLine3: 'Sahsiah & Jiwa',
    heroDesc:
      'Platform penilaian kendiri harian selama 7 hari dengan gamifikasi jubah kemuliaan, catatan refleksi nurani, dan laporan pembimbing.',
    navHome: 'Beranda',
    navChallenges: 'Cabaran',
    navSettings: 'Tetapan',
    navChat: 'Sembang Murid',
    logoutBtn: 'Log Keluar',
  },
};

export function verifyQuranHafalanPasscode(
  input: string,
  expectedPin: string = DEFAULT_SESSION_PASSCODES.quranHafalanPin
): boolean {
  return input.trim() === expectedPin.trim();
}

export function verifyPrayerRecordingPasscode(
  input: string,
  expectedPin: string = DEFAULT_SESSION_PASSCODES.prayerRecordingPin
): boolean {
  return input.trim().toUpperCase() === expectedPin.trim().toUpperCase();
}

export function createQuizQuestion(
  existingQuestions: QuizQuestion[],
  payload: {
    category: TaskCategory;
    question: string;
    options: [string, string, string, string];
    correctIndex: number;
    xpReward?: number;
    coinReward?: number;
  }
): { ok: true; newQuestion: QuizQuestion; updatedQuestions: QuizQuestion[] } | { ok: false; error: string } {
  const cleanQ = payload.question.trim();
  if (!cleanQ || cleanQ.length < 5) {
    return { ok: false, error: 'Pertanyaan soal minimal 5 karakter.' };
  }
  if (payload.options.some((opt) => !opt.trim())) {
    return { ok: false, error: 'Semua 4 pilihan jawaban (A, B, C, D) wajib diisi.' };
  }
  if (payload.correctIndex < 0 || payload.correctIndex > 3) {
    return { ok: false, error: 'Pilih salah satu kunci jawaban yang benar (A/B/C/D).' };
  }

  const newQuestion: QuizQuestion = {
    id: `soal_${Date.now()}`,
    category: payload.category,
    question: cleanQ,
    options: [
      payload.options[0].trim(),
      payload.options[1].trim(),
      payload.options[2].trim(),
      payload.options[3].trim(),
    ],
    correctIndex: payload.correctIndex,
    xpReward: payload.xpReward || 80,
    coinReward: payload.coinReward || 60,
    createdBy: 'Admin Master',
  };

  return {
    ok: true,
    newQuestion,
    updatedQuestions: [newQuestion, ...existingQuestions],
  };
}

export function answerQuizQuestion(
  student: StudentAccount,
  question: QuizQuestion,
  selectedOptionIndex: number
): {
  isCorrect: boolean;
  alreadyAnswered: boolean;
  updatedStudent: StudentAccount;
  message: string;
} {
  const answered = student.answeredQuestionIds || [];
  if (answered.includes(question.id)) {
    return {
      isCorrect: selectedOptionIndex === question.correctIndex,
      alreadyAnswered: true,
      updatedStudent: student,
      message: 'Soal ini sudah pernah kamu jawab dengan benar sebelumnya.',
    };
  }

  if (selectedOptionIndex !== question.correctIndex) {
    return {
      isCorrect: false,
      alreadyAnswered: false,
      updatedStudent: student,
      message: 'Jawaban belum tepat! Coba baca kembali soalnya dengan teliti ya.',
    };
  }

  const updatedStudent: StudentAccount = {
    ...student,
    xp: student.xp + question.xpReward,
    coins: student.coins + question.coinReward,
    answeredQuestionIds: [...answered, question.id],
  };

  return {
    isCorrect: true,
    alreadyAnswered: false,
    updatedStudent,
    message: `Alhamdulillah Jawaban Benar! Kamu mendapat +${question.xpReward} XP dan +${question.coinReward} Koin!`,
  };
}

export function computeBaseExpression(bedroom: BedroomState): CharacterExpression {
  if (bedroom.bedMessy || bedroom.clothesMessy) {
    return 'marah';
  }
  return 'bangga';
}

export function cleanBedroomItem(
  student: StudentAccount,
  target: 'bed' | 'clothes' | 'all'
): {
  updatedStudent: StudentAccount;
  coinsEarned: number;
  xpEarned: number;
  message: string;
} {
  const prevBed = student.bedroom.bedMessy;
  const prevClothes = student.bedroom.clothesMessy;

  const nextBedMessy = target === 'bed' || target === 'all' ? false : prevBed;
  const nextClothesMessy = target === 'clothes' || target === 'all' ? false : prevClothes;

  let cleanedCount = 0;
  if (prevBed && !nextBedMessy) cleanedCount += 1;
  if (prevClothes && !nextClothesMessy) cleanedCount += 1;

  const coinsEarned = cleanedCount * 25;
  const xpEarned = cleanedCount * 35;

  const cleanliness =
    !nextBedMessy && !nextClothesMessy ? 100 : !nextBedMessy || !nextClothesMessy ? 60 : 20;

  const updatedStudent: StudentAccount = {
    ...student,
    coins: student.coins + coinsEarned,
    xp: student.xp + xpEarned,
    bedroom: {
      ...student.bedroom,
      bedMessy: nextBedMessy,
      clothesMessy: nextClothesMessy,
      cleanliness,
    },
  };

  const message =
    cleanedCount === 0
      ? 'Kamar sudah rapi dan bersih! Karaktermu sangat senang.'
      : !nextBedMessy && !nextClothesMessy
        ? 'Alhamdulillah! Kasur dan baju sudah rapi semua! Wajah marah hilang, karaktermu kini tersenyum bangga!'
        : target === 'bed'
          ? 'Kasur sudah dirapikan! Ayo rapikan juga baju yang berserakan agar karaktermu tidak marah lagi.'
          : 'Baju sudah dilipat rapi ke lemari! Tinggal merapikan kasur yang berantakan.';

  return {
    updatedStudent,
    coinsEarned,
    xpEarned,
    message,
  };
}

export function makeBedroomMessy(student: StudentAccount): StudentAccount {
  return {
    ...student,
    bedroom: {
      ...student.bedroom,
      bedMessy: true,
      clothesMessy: true,
      cleanliness: 20,
    },
  };
}

export function feedCharacter(
  student: StudentAccount,
  foodName: string,
  nutritionBonus = 25
): {
  updatedStudent: StudentAccount;
  message: string;
} {
  const nextHunger = Math.min(100, student.bedroom.hunger + nutritionBonus);
  const updatedStudent: StudentAccount = {
    ...student,
    coins: student.coins + 15,
    xp: student.xp + 20,
    bedroom: {
      ...student.bedroom,
      hunger: nextHunger,
    },
  };

  return {
    updatedStudent,
    message: `Nyam nyam! Bismillah, makan ${foodName} membuat karaktermu sangat senang (+20 XP)!`,
  };
}

export function authenticateStudent(
  students: StudentAccount[],
  emailInput: string,
  passwordInput: string
):
  | { ok: true; role: 'admin' }
  | { ok: true; role: 'student'; student: StudentAccount }
  | { ok: false; error: string } {
  const normalizedEmail = emailInput.trim().toLowerCase();
  if (!normalizedEmail) {
    return {
      ok: false,
      error: 'Silakan masukkan alamat email (contoh: putri@murid.id, putra@murid.id, atau admin@muhasabah.id).',
    };
  }
  if (!passwordInput.trim()) {
    return { ok: false, error: 'Silakan masukkan kata sandi Anda.' };
  }

  // Check if logging in as Admin Master
  const isAdminEmail =
    normalizedEmail === 'hariffalah75@mutabaah.id' ||
    normalizedEmail === 'hariffalah75@gmail.com' ||
    normalizedEmail === 'admin@mutabaah.id' ||
    normalizedEmail === 'admin@muhasabah.id' ||
    normalizedEmail === 'master@admin.id';

  if (isAdminEmail) {
    const isValidAdminPass =
      passwordInput === 'Ferarizky123#' ||
      passwordInput === 'admin123' ||
      passwordInput === '123456';

    if (isValidAdminPass) {
      return { ok: true, role: 'admin' };
    }
    return {
      ok: false,
      error: 'Kata sandi Admin Master salah. Gunakan sandi resmi yang telah ditentukan.',
    };
  }

  const found =
    students.find((s) => s.email.toLowerCase() === normalizedEmail) ||
    INITIAL_STUDENTS.find(
      (s) => isTrialStudent(s) && s.email.toLowerCase() === normalizedEmail
    );
  if (!found) {
    return {
      ok: false,
      error: 'Email tidak ditemukan. Silakan periksa kembali email akun siswa atau admin.',
    };
  }

  const validPass =
    found.password === passwordInput ||
    passwordInput === 'siswa123' ||
    passwordInput === 'siswi123' ||
    passwordInput === '123456';

  if (!validPass) {
    return {
      ok: false,
      error: 'Kata sandi salah. Gunakan fitur "Lupa Kata Sandi?" jika ingin mengatur ulang.',
    };
  }

  return { ok: true, role: 'student', student: found };
}

export function registerStudentAccount(
  students: StudentAccount[],
  payload: {
    name: string;
    email: string;
    password: string;
    gender: Gender;
    grade: string;
  }
): { ok: true; student: StudentAccount; updatedStudents: StudentAccount[] } | { ok: false; error: string } {
  const cleanName = payload.name.trim();
  const cleanEmail = payload.email.trim().toLowerCase();
  const cleanPass = payload.password.trim();

  if (!cleanName || cleanName.length < 2) {
    return { ok: false, error: 'Nama lengkap siswa minimal 2 karakter.' };
  }
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { ok: false, error: 'Masukkan alamat email yang valid (contoh: nama@murid.id).' };
  }
  if (cleanPass.length < 4) {
    return { ok: false, error: 'Kata sandi minimal 4 karakter.' };
  }
  if (students.some((s) => s.email.toLowerCase() === cleanEmail)) {
    return { ok: false, error: 'Alamat email ini sudah terdaftar. Silakan langsung masuk.' };
  }

  const newStudent: StudentAccount = {
    id: `student_${Date.now()}`,
    name: cleanName,
    email: cleanEmail,
    password: cleanPass,
    gender: payload.gender,
    grade: payload.grade.trim() || 'Kelas 7A - Mutaba\'ah',
    coins: 200,
    xp: 250,
    streakDays: 1,
    selectedJubahId: 'jubah_1_pengembara',
    bedroom: {
      bedMessy: true,
      clothesMessy: true,
      hunger: 70,
      cleanliness: 20,
    },
    reflectionNote: 'Bismillah, memulai evaluasi perilaku 7 hari di Mutaba\'ah.id!',
    answeredQuestionIds: [],
    unlockedQuranHafalan: false,
    unlockedPrayerRecording: false,
  };

  return {
    ok: true,
    student: newStudent,
    updatedStudents: [...students, newStudent],
  };
}

export function updateStudentPassword(
  students: StudentAccount[],
  emailInput: string,
  newPasswordInput: string
): { ok: true; updatedStudents: StudentAccount[]; message: string } | { ok: false; error: string } {
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanPass = newPasswordInput.trim();

  if (!cleanEmail) {
    return { ok: false, error: 'Masukkan alamat email akun siswa.' };
  }
  if (cleanPass.length < 4) {
    return { ok: false, error: 'Kata sandi baru minimal 4 karakter.' };
  }

  const exists = students.some((s) => s.email.toLowerCase() === cleanEmail);
  if (!exists) {
    return { ok: false, error: 'Email akun siswa tidak ditemukan.' };
  }

  const updatedStudents = students.map((s) =>
    s.email.toLowerCase() === cleanEmail ? { ...s, password: cleanPass } : s
  );

  return {
    ok: true,
    updatedStudents,
    message: `Kata sandi untuk ${cleanEmail} berhasil diperbarui!`,
  };
}

export function deleteStudentAccount(
  students: StudentAccount[],
  studentId: string
): {
  ok: boolean;
  updatedStudents: StudentAccount[];
  deletedStudent: StudentAccount | null;
  message: string;
} {
  const target = students.find((s) => s.id === studentId);
  if (!target) {
    return {
      ok: false,
      updatedStudents: students,
      deletedStudent: null,
      message: 'Akun siswa tidak ditemukan atau sudah dihapus.',
    };
  }

  // Akun uji coba (putra@murid.id & putri@murid.id) tidak boleh dihapus
  if (isTrialStudent(target)) {
    return {
      ok: false,
      updatedStudents: students,
      deletedStudent: null,
      message: 'Akun uji coba resmi (Putra & Putri) tidak dapat dihapus dari sistem.',
    };
  }

  const updatedStudents = students.filter((s) => s.id !== studentId);
  return {
    ok: true,
    updatedStudents,
    deletedStudent: target,
    message: `Akun murid "${target.name}" (${target.email}) berhasil dihapus. Murid tidak dapat lagi masuk ke aplikasi.`,
  };
}

export function toggleTaskCompletion(
  tasks: DailyTask[],
  student: StudentAccount,
  taskId: string
): {
  updatedTasks: DailyTask[];
  updatedStudent: StudentAccount;
  deltaCoins: number;
  deltaXp: number;
  unlockedNewJubah: JubahRobeDesign | null;
} {
  let deltaCoins = 0;
  let deltaXp = 0;

  const prevCompletedCount = tasks.filter((t) => t.completed).length;

  const updatedTasks = tasks.map((task) => {
    if (task.id !== taskId) return task;
    const nextCompleted = !task.completed;
    deltaCoins = nextCompleted ? task.coins : -task.coins;
    deltaXp = nextCompleted ? task.xp : -task.xp;
    return {
      ...task,
      completed: nextCompleted,
      streakDays: nextCompleted ? task.streakDays + 1 : Math.max(0, task.streakDays - 1),
    };
  });

  const nextCompletedCount = updatedTasks.filter((t) => t.completed).length;

  const newlyUnlocked =
    JUBAH_DESIGNS.find(
      (j) =>
        j.requiredCompletedTasks > prevCompletedCount &&
        j.requiredCompletedTasks <= nextCompletedCount
    ) || null;

  const updatedStudent: StudentAccount = {
    ...student,
    coins: Math.max(0, student.coins + deltaCoins),
    xp: Math.max(0, student.xp + deltaXp),
    selectedJubahId: newlyUnlocked ? newlyUnlocked.id : student.selectedJubahId,
  };

  return {
    updatedTasks,
    updatedStudent,
    deltaCoins,
    deltaXp,
    unlockedNewJubah: newlyUnlocked,
  };
}

export function getCategoryStats(tasks: DailyTask[], category: TaskCategory) {
  const filtered = tasks.filter((t) => t.category === category);
  const completedCount = filtered.filter((t) => t.completed).length;
  const totalCoinsAvailable = filtered.reduce((acc, item) => acc + item.coins, 0);
  const earnedCoins = filtered.filter((t) => t.completed).reduce((acc, item) => acc + item.coins, 0);

  return {
    total: filtered.length,
    completed: completedCount,
    percent: filtered.length === 0 ? 0 : Math.round((completedCount / filtered.length) * 100),
    totalCoinsAvailable,
    earnedCoins,
  };
}

export function getJubahRankInfo(xp: number): {
  level: number;
  jubahTitle: string;
  nextThreshold: number;
  progressPercent: number;
} {
  const ranks = [
    { level: 1, title: 'Jubah 1 · Santri Klasik', min: 0, max: 300 },
    { level: 2, title: 'Jubah 2 · Aurora Biru-Ungu', min: 300, max: 500 },
    { level: 3, title: 'Jubah 3 · Kobaran Api Zamrud', min: 500, max: 700 },
    { level: 4, title: 'Jubah 4 · Ksatria Panda', min: 700, max: 950 },
    { level: 5, title: 'Jubah 5 · Kaisar Naga Emas', min: 950, max: 1500 },
  ];

  const found = ranks.find((r) => xp >= r.min && xp < r.max) || ranks[ranks.length - 1];
  const span = Math.max(1, found.max - found.min);
  const progressPercent = Math.min(100, Math.max(0, Math.round(((xp - found.min) / span) * 100)));

  return {
    level: found.level,
    jubahTitle: found.title,
    nextThreshold: found.max,
    progressPercent,
  };
}

export function getStudentOwnedJubahIds(student: StudentAccount): string[] {
  const base = Array.isArray(student.ownedJubahIds) ? student.ownedJubahIds : [];
  const set = new Set<string>(['jubah_1_pengembara', ...base]);
  if (student.selectedJubahId) {
    set.add(student.selectedJubahId);
  }
  return Array.from(set);
}

export function isJubahOwned(student: StudentAccount, jubahId: string): boolean {
  if (jubahId === 'jubah_1_pengembara') return true;
  return getStudentOwnedJubahIds(student).includes(jubahId);
}

export function getAvailableSholatPoints(
  student: StudentAccount,
  totalEarnedSholatPoints: number
): number {
  const spent = Math.max(0, student.spentSholatPoints || 0);
  return Math.max(0, totalEarnedSholatPoints - spent);
}

export function purchaseJubahWithSholatPoints(
  student: StudentAccount,
  jubahId: string,
  totalEarnedSholatPoints: number
): {
  ok: boolean;
  purchasedNew: boolean;
  message: string;
  updatedStudent: StudentAccount;
  availablePointsAfter: number;
} {
  const targetJubah = JUBAH_DESIGNS.find((j) => j.id === jubahId);
  if (!targetJubah) {
    return {
      ok: false,
      purchasedNew: false,
      message: 'Jubah tidak ditemukan.',
      updatedStudent: student,
      availablePointsAfter: getAvailableSholatPoints(student, totalEarnedSholatPoints),
    };
  }

  const owned = getStudentOwnedJubahIds(student);
  const availablePoints = getAvailableSholatPoints(student, totalEarnedSholatPoints);

  if (owned.includes(jubahId) || targetJubah.pointCost <= 0) {
    const equippedStudent: StudentAccount = {
      ...student,
      ownedJubahIds: owned,
      selectedJubahId: jubahId,
    };
    return {
      ok: true,
      purchasedNew: false,
      message: `Karaktermu kini mengenakan ${targetJubah.name}!`,
      updatedStudent: equippedStudent,
      availablePointsAfter: availablePoints,
    };
  }

  if (availablePoints < targetJubah.pointCost) {
    return {
      ok: false,
      purchasedNew: false,
      message: `Poin Sholat belum cukup untuk membeli ${targetJubah.name} (${availablePoints} / ${targetJubah.pointCost} Poin Sholat). Yuk kumpulkan poin dari Tantangan Sholat!`,
      updatedStudent: student,
      availablePointsAfter: availablePoints,
    };
  }

  const nextSpent = (student.spentSholatPoints || 0) + targetJubah.pointCost;
  const nextOwned = Array.from(new Set([...owned, jubahId]));
  const updatedStudent: StudentAccount = {
    ...student,
    ownedJubahIds: nextOwned,
    spentSholatPoints: nextSpent,
    selectedJubahId: jubahId,
  };

  return {
    ok: true,
    purchasedNew: true,
    message: `Alhamdulillah! Berhasil membeli & memakai ${targetJubah.name} (${targetJubah.corakLabel}) dengan ${targetJubah.pointCost} Poin Sholat!`,
    updatedStudent,
    availablePointsAfter: Math.max(0, totalEarnedSholatPoints - nextSpent),
  };
}

