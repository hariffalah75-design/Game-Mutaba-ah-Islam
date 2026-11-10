import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  BedDouble,
  Shirt,
  Utensils,
  Share2,
  ArrowRight,
  RotateCcw,
  Shield,
  Flame,
  Grid,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  CharacterExpression,
  DailyTask,
  JUBAH_DESIGNS,
  JubahCorakType,
  JubahRobeDesign,
  SessionPasscodes,
  StudentAccount,
  TaskCategory,
  computeBaseExpression,
  getCategoryStats,
  isJubahOwned,
} from '../game/rules';
import { soundFX } from '../utils/sound';

interface PouBedroomStageProps {
  student: StudentAccount;
  tasks: DailyTask[];
  passcodes: SessionPasscodes;
  availableSholatPoints?: number;
  totalEarnedSholatPoints?: number;
  onToggleTask: (taskId: string) => void;
  onUnlockQuranHafalan: () => void;
  onCleanRoom: (target: 'bed' | 'clothes' | 'all') => void;
  onMakeRoomMessy: () => void;
  onFeedCharacter: (foodName: string) => void;
  onSelectJubah: (
    jubahId: string
  ) => { ok: boolean; message: string; purchasedNew: boolean } | void;
  onShareCharacterToChat: () => void;
  onGoToChallenges: () => void;
  feedbackBanner: { type: 'success' | 'info'; text: string } | null;
}

function parseHexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 6) return [181, 137, 90];
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Draws the festive Jubah motif (Corak) onto a 512x512 offscreen canvas.
 * Only pixels inside the character's outer Jubah mask (jubahMask[idx] === 1)
 * will be composited onto the character so black outlines, hands, and inner white gamis remain untouched.
 */
function drawJubahCorakOverlay(
  pCtx: CanvasRenderingContext2D,
  corakType: JubahCorakType
) {
  pCtx.save();
  pCtx.lineCap = 'round';
  pCtx.lineJoin = 'round';

  if (corakType === 'aurora') {
    // 1. Shimmering diagonal aurora light ribbons across sleeves & panels
    const auroraGrad = pCtx.createLinearGradient(110, 200, 390, 415);
    auroraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    auroraGrad.addColorStop(0.5, 'rgba(232, 121, 249, 0.55)');
    auroraGrad.addColorStop(1, 'rgba(250, 204, 21, 0.55)');
    pCtx.strokeStyle = auroraGrad;
    pCtx.lineWidth = 14;
    for (let yOff = 215; yOff <= 410; yOff += 46) {
      pCtx.beginPath();
      pCtx.moveTo(115, yOff);
      pCtx.bezierCurveTo(190, yOff - 22, 310, yOff + 22, 395, yOff - 10);
      pCtx.stroke();
    }

    // 2. Golden-lavender inner lapel trim lines & sleeve cuff bands
    pCtx.strokeStyle = '#fde047';
    pCtx.lineWidth = 4.5;
    pCtx.beginPath();
    pCtx.moveTo(198, 200);
    pCtx.lineTo(196, 412);
    pCtx.moveTo(284, 200);
    pCtx.lineTo(286, 415);
    // Bottom hem gold trim
    pCtx.moveTo(165, 396);
    pCtx.lineTo(205, 402);
    pCtx.moveTo(278, 405);
    pCtx.lineTo(328, 398);
    pCtx.stroke();

    // 3. Sparkling 4-point Aurora Stars & Crescent Moons
    const drawStar = (cx: number, cy: number, rOuter: number, color: string) => {
      pCtx.save();
      pCtx.fillStyle = color;
      pCtx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const r = i % 2 === 0 ? rOuter : rOuter * 0.36;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) pCtx.moveTo(x, y);
        else pCtx.lineTo(x, y);
      }
      pCtx.closePath();
      pCtx.fill();
      pCtx.restore();
    };

    // Stars on Left & Right Panels and Sleeves
    drawStar(148, 252, 11, '#fde047');
    drawStar(358, 256, 11, '#fde047');
    drawStar(188, 250, 9.5, '#fef08a');
    drawStar(300, 250, 9.5, '#fef08a');
    drawStar(188, 315, 11, '#f472b6');
    drawStar(300, 315, 11, '#38bdf8');
    drawStar(188, 372, 9.5, '#fde047');
    drawStar(300, 372, 9.5, '#fde047');
  } else if (corakType === 'api') {
    // CORAK API BERKOBAR (Hijau ke Kuningan dengan Lidah Api Merah-Oranye-Emas Menyala)
    const drawFlameCluster = (
      baseX: number,
      baseY: number,
      width: number,
      height: number
    ) => {
      // Outer fiery crimson-orange flame
      const outerGrad = pCtx.createLinearGradient(
        baseX,
        baseY,
        baseX,
        baseY - height
      );
      outerGrad.addColorStop(0, '#dc2626');
      outerGrad.addColorStop(0.55, '#f97316');
      outerGrad.addColorStop(1, '#facc15');

      pCtx.fillStyle = outerGrad;
      pCtx.beginPath();
      pCtx.moveTo(baseX - width * 0.55, baseY);
      pCtx.quadraticCurveTo(
        baseX - width * 0.65,
        baseY - height * 0.5,
        baseX - width * 0.22,
        baseY - height * 0.88
      );
      pCtx.quadraticCurveTo(
        baseX - width * 0.1,
        baseY - height * 0.55,
        baseX,
        baseY - height
      );
      pCtx.quadraticCurveTo(
        baseX + width * 0.14,
        baseY - height * 0.58,
        baseX + width * 0.28,
        baseY - height * 0.85
      );
      pCtx.quadraticCurveTo(
        baseX + width * 0.65,
        baseY - height * 0.45,
        baseX + width * 0.55,
        baseY
      );
      pCtx.closePath();
      pCtx.fill();

      // Inner bright yellow-white flame core
      pCtx.fillStyle = '#fef08a';
      pCtx.beginPath();
      pCtx.moveTo(baseX - width * 0.3, baseY);
      pCtx.quadraticCurveTo(
        baseX - width * 0.25,
        baseY - height * 0.42,
        baseX,
        baseY - height * 0.68
      );
      pCtx.quadraticCurveTo(
        baseX + width * 0.25,
        baseY - height * 0.42,
        baseX + width * 0.3,
        baseY
      );
      pCtx.closePath();
      pCtx.fill();
    };

    // Flames rising up Left Panel (x=186, y=414) & Right Panel (x=302, y=418)
    drawFlameCluster(186, 416, 42, 165);
    drawFlameCluster(302, 420, 48, 170);

    // Secondary mid-chest flame tongues
    drawFlameCluster(186, 330, 34, 95);
    drawFlameCluster(302, 334, 38, 98);

    // Flames rising from Left Sleeve cuff (x=145, y=318) & Right Sleeve cuff (x=360, y=322)
    drawFlameCluster(145, 318, 48, 95);
    drawFlameCluster(360, 322, 48, 95);

    // Glowing fire embers / sparks rising toward shoulders
    const embers = [
      [186, 228, 4.5],
      [192, 248, 3.5],
      [296, 226, 4.5],
      [308, 246, 3.5],
      [148, 222, 4],
      [356, 226, 4],
    ];
    embers.forEach(([ex, ey, er]) => {
      pCtx.fillStyle = '#fef08a';
      pCtx.beginPath();
      pCtx.arc(ex, ey, er, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.strokeStyle = '#ea580c';
      pCtx.lineWidth = 1.5;
      pCtx.stroke();
    });
  } else if (corakType === 'panda') {
    // CORAK PANDA & BAMBU (Merah ke Orenan dengan Wajah Panda Lucu, Jejak Kaki & Bambu Emas)
    // 1. Golden Bamboo Stalks & Leaves
    pCtx.strokeStyle = '#fde047';
    pCtx.lineWidth = 3.5;
    pCtx.beginPath();
    pCtx.moveTo(178, 210);
    pCtx.lineTo(178, 405);
    pCtx.moveTo(312, 210);
    pCtx.lineTo(312, 410);
    pCtx.stroke();

    const drawBambooLeaf = (lx: number, ly: number, angle: number) => {
      pCtx.save();
      pCtx.translate(lx, ly);
      pCtx.rotate(angle);
      pCtx.fillStyle = '#bef264';
      pCtx.strokeStyle = '#15803d';
      pCtx.lineWidth = 1.5;
      pCtx.beginPath();
      pCtx.ellipse(8, 0, 9, 3.8, 0, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.stroke();
      pCtx.restore();
    };

    drawBambooLeaf(178, 232, -0.4);
    drawBambooLeaf(178, 278, 0.45);
    drawBambooLeaf(178, 348, -0.35);
    drawBambooLeaf(312, 236, 2.7);
    drawBambooLeaf(312, 282, -2.6);
    drawBambooLeaf(312, 352, 2.65);

    // 2. Cute Cartoon Panda Face Emblem Helper
    const drawPandaFace = (cx: number, cy: number, radius: number) => {
      pCtx.save();
      // Black round panda ears
      pCtx.fillStyle = '#0f172a';
      pCtx.beginPath();
      pCtx.arc(cx - radius * 0.68, cy - radius * 0.68, radius * 0.38, 0, Math.PI * 2);
      pCtx.arc(cx + radius * 0.68, cy - radius * 0.68, radius * 0.38, 0, Math.PI * 2);
      pCtx.fill();

      // White round panda head with crisp dark outline
      pCtx.fillStyle = '#ffffff';
      pCtx.strokeStyle = '#0f172a';
      pCtx.lineWidth = 2.4;
      pCtx.beginPath();
      pCtx.arc(cx, cy, radius, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.stroke();

      // Black eye patches
      pCtx.fillStyle = '#0f172a';
      pCtx.beginPath();
      pCtx.ellipse(
        cx - radius * 0.36,
        cy - radius * 0.08,
        radius * 0.26,
        radius * 0.32,
        -0.2,
        0,
        Math.PI * 2
      );
      pCtx.ellipse(
        cx + radius * 0.36,
        cy - radius * 0.08,
        radius * 0.26,
        radius * 0.32,
        0.2,
        0,
        Math.PI * 2
      );
      pCtx.fill();

      // White eye sparkles
      pCtx.fillStyle = '#ffffff';
      pCtx.beginPath();
      pCtx.arc(cx - radius * 0.34, cy - radius * 0.14, radius * 0.1, 0, Math.PI * 2);
      pCtx.arc(cx + radius * 0.34, cy - radius * 0.14, radius * 0.1, 0, Math.PI * 2);
      pCtx.fill();

      // Pink cheeks
      pCtx.fillStyle = '#fb7185';
      pCtx.beginPath();
      pCtx.arc(cx - radius * 0.52, cy + radius * 0.22, radius * 0.14, 0, Math.PI * 2);
      pCtx.arc(cx + radius * 0.52, cy + radius * 0.22, radius * 0.14, 0, Math.PI * 2);
      pCtx.fill();

      // Cute black nose & smile
      pCtx.fillStyle = '#0f172a';
      pCtx.beginPath();
      pCtx.ellipse(cx, cy + radius * 0.18, radius * 0.16, radius * 0.11, 0, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.restore();
    };

    // Draw Panda Faces on Left & Right Panels and Both Sleeves
    drawPandaFace(189, 310, 12.5);
    drawPandaFace(299, 310, 13.5);
    drawPandaFace(148, 265, 13);
    drawPandaFace(358, 268, 13);

    // Draw cute Panda Paw Prints above & below
    const drawPaw = (px: number, py: number) => {
      pCtx.save();
      pCtx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      pCtx.strokeStyle = '#0f172a';
      pCtx.lineWidth = 1.5;
      pCtx.beginPath();
      pCtx.arc(px, py, 6.5, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.stroke();
      pCtx.fillStyle = '#0f172a';
      pCtx.beginPath();
      pCtx.arc(px, py + 1.5, 3, 0, Math.PI * 2);
      pCtx.arc(px - 3, py - 2.5, 1.4, 0, Math.PI * 2);
      pCtx.arc(px, py - 3.5, 1.4, 0, Math.PI * 2);
      pCtx.arc(px + 3, py - 2.5, 1.4, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.restore();
    };

    drawPaw(189, 252);
    drawPaw(299, 252);
    drawPaw(189, 372);
    drawPaw(299, 372);
  } else if (corakType === 'naga') {
    // CORAK NAGA EMAS (Ungu ke Kuningan dengan Sisik Naga & Naga Emas Melingkar)
    // 1. Golden Dragon Scale Lattice on Sleeves & Upper Shoulders
    pCtx.strokeStyle = 'rgba(254, 240, 138, 0.55)';
    pCtx.lineWidth = 2.2;
    for (let sy = 212; sy <= 320; sy += 16) {
      for (let sx = 120; sx <= 172; sx += 16) {
        pCtx.beginPath();
        pCtx.arc(sx, sy, 8, 0, Math.PI);
        pCtx.stroke();
      }
      for (let sx = 330; sx <= 390; sx += 16) {
        pCtx.beginPath();
        pCtx.arc(sx, sy, 8, 0, Math.PI);
        pCtx.stroke();
      }
    }

    // 2. Winding Golden Dragon Body along Left & Right Front Panels + Sleeves
    const drawGoldenDragon = (
      centerX: number,
      topY: number,
      bottomY: number,
      flip: number
    ) => {
      pCtx.save();
      // Outer fiery-gold dragon aura
      pCtx.strokeStyle = '#b45309';
      pCtx.lineWidth = 13;
      pCtx.beginPath();
      pCtx.moveTo(centerX, bottomY);
      pCtx.bezierCurveTo(
        centerX + 16 * flip,
        bottomY - 55,
        centerX - 16 * flip,
        topY + 65,
        centerX,
        topY + 18
      );
      pCtx.stroke();

      // Main radiant gold dragon body
      pCtx.strokeStyle = '#fde047';
      pCtx.lineWidth = 8.5;
      pCtx.beginPath();
      pCtx.moveTo(centerX, bottomY);
      pCtx.bezierCurveTo(
        centerX + 16 * flip,
        bottomY - 55,
        centerX - 16 * flip,
        topY + 65,
        centerX,
        topY + 18
      );
      pCtx.stroke();

      // Dragon dorsal fin spikes along the curve
      pCtx.fillStyle = '#f97316';
      for (let dy = topY + 32; dy <= bottomY - 16; dy += 22) {
        const waveX =
          centerX + Math.sin(((dy - topY) / (bottomY - topY)) * Math.PI * 2) * 6 * flip;
        pCtx.beginPath();
        pCtx.moveTo(waveX - 5, dy);
        pCtx.lineTo(waveX + 7 * flip, dy - 7);
        pCtx.lineTo(waveX + 5, dy + 5);
        pCtx.closePath();
        pCtx.fill();
      }

      // Crowned Golden Dragon Head at top of chest panel
      const hx = centerX;
      const hy = topY + 20;
      // Crimson Dragon Horns
      pCtx.strokeStyle = '#ef4444';
      pCtx.lineWidth = 3.5;
      pCtx.beginPath();
      pCtx.moveTo(hx - 5, hy - 6);
      pCtx.lineTo(hx - 11, hy - 16);
      pCtx.moveTo(hx + 5, hy - 6);
      pCtx.lineTo(hx + 11, hy - 16);
      pCtx.stroke();

      // Golden Dragon Head Shield
      pCtx.fillStyle = '#facc15';
      pCtx.strokeStyle = '#78350f';
      pCtx.lineWidth = 2.2;
      pCtx.beginPath();
      pCtx.moveTo(hx, hy - 11);
      pCtx.lineTo(hx + 11, hy - 2);
      pCtx.lineTo(hx + 8, hy + 11);
      pCtx.lineTo(hx, hy + 15);
      pCtx.lineTo(hx - 8, hy + 11);
      pCtx.lineTo(hx - 11, hy - 2);
      pCtx.closePath();
      pCtx.fill();
      pCtx.stroke();

      // Glowing white-cyan dragon eyes
      pCtx.fillStyle = '#ffffff';
      pCtx.beginPath();
      pCtx.arc(hx - 4, hy, 2.3, 0, Math.PI * 2);
      pCtx.arc(hx + 4, hy, 2.3, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.restore();
    };

    // Draw Twin Golden Dragons on Left & Right Jubah Panels
    drawGoldenDragon(188, 222, 396, 1);
    drawGoldenDragon(300, 222, 400, -1);

    // Dragon Medallion Emblems on Left & Right Sleeves
    drawGoldenDragon(148, 235, 312, 1);
    drawGoldenDragon(358, 238, 315, -1);
  }

  pCtx.restore();
}

const HALAL_FOOD_MENU = [
  { id: 'kurma', name: 'Kurma Ajwa', emoji: '🌴', bonus: '+25 Energi' },
  { id: 'susu', name: 'Susu Madu', emoji: '🥛', bonus: '+30 Energi' },
  { id: 'kebuli', name: 'Nasi Kebuli', emoji: '🍛', bonus: '+35 Energi' },
  { id: 'apel', name: 'Apel Segar', emoji: '🍎', bonus: '+20 Energi' },
];

export const PUTRA_CHARACTER_IMAGE =
  '/assets/aistudio/Gemini_Generated_Image_9lsoza9lsoza9lso_7e9a8ad7.jpg';
export const PUTRI_CHARACTER_IMAGE =
  '/assets/aistudio/Gemini_Generated_Image_wzd2ahwzd2ahwzd2_b40300a5.jpg';

export const RobloxCharacterCanvas: React.FC<PouBedroomStageProps> = ({
  student,
  tasks,
  passcodes,
  availableSholatPoints = 0,
  onToggleTask,
  onUnlockQuranHafalan,
  onCleanRoom,
  onMakeRoomMessy,
  onFeedCharacter,
  onSelectJubah,
  onShareCharacterToChat,
  onGoToChallenges,
  feedbackBanner,
}) => {
  // Temporary reaction override when touched ('sakit') or fed ('senang')
  const [tempReaction, setTempReaction] = useState<CharacterExpression | null>(null);
  const [speechText, setSpeechText] = useState<string>('');
  const [curtainKey, setCurtainKey] = useState<number>(1);
  const [activeFoodEmoji, setActiveFoodEmoji] = useState<string | null>(null);
  const [touchCount, setTouchCount] = useState<number>(0);
  const [artStyle, setArtStyle] = useState<'anime_rpg' | 'piskel_pixel'>('anime_rpg');
  const [activeChallengeTab, setActiveChallengeTab] = useState<TaskCategory>('sholat');
  const [berandaPinInput, setBerandaPinInput] = useState('');
  const [berandaPinError, setBerandaPinError] = useState<string | null>(null);
  const [transparentCharUrl, setTransparentCharUrl] = useState<string | null>(null);
  const [showSpeechBubble, setShowSpeechBubble] = useState<boolean>(true);

  useEffect(() => {
    setShowSpeechBubble(true);
    const timer = window.setTimeout(() => {
      setShowSpeechBubble(false);
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [speechText]);

  const rawCharImage =
    student.gender === 'putri' ? PUTRI_CHARACTER_IMAGE : PUTRA_CHARACTER_IMAGE;

  const baseExpression = computeBaseExpression(student.bedroom);
  const currentExpression: CharacterExpression = tempReaction || baseExpression;

  const currentJubah: JubahRobeDesign =
    JUBAH_DESIGNS.find((j) => j.id === student.selectedJubahId) || JUBAH_DESIGNS[0];

  // Automatically remove outer white background, recolor Jubah with gradient + Corak (Polos, Aurora, Api, Panda, Naga),
  // AND draw dynamic facial expression ('marah', 'sakit', 'senang') onto the character's face
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        const S = 512;
        canvas.width = S;
        canvas.height = S;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, S, S);
        const imageData = ctx.getImageData(0, 0, S, S);
        const data = imageData.data;
        const visited = new Uint8Array(S * S);
        const queue = new Int32Array(S * S);
        let head = 0;
        let tail = 0;

        const isOuterWhite = (idx: number) => {
          const p = idx * 4;
          return data[p] > 232 && data[p + 1] > 232 && data[p + 2] > 232;
        };

        const pushCorner = (x: number, y: number) => {
          const idx = y * S + x;
          if (!visited[idx] && isOuterWhite(idx)) {
            visited[idx] = 1;
            queue[tail++] = idx;
          }
        };

        pushCorner(0, 0);
        pushCorner(S - 1, 0);
        pushCorner(0, S - 1);
        pushCorner(S - 1, S - 1);

        while (head < tail) {
          const curr = queue[head++];
          data[curr * 4 + 3] = 0; // transparent
          const cx = curr % S;
          const cy = (curr - cx) / S;

          if (cx > 0) {
            const n = curr - 1;
            if (!visited[n] && isOuterWhite(n)) {
              visited[n] = 1;
              queue[tail++] = n;
            }
          }
          if (cx < S - 1) {
            const n = curr + 1;
            if (!visited[n] && isOuterWhite(n)) {
              visited[n] = 1;
              queue[tail++] = n;
            }
          }
          if (cy > 0) {
            const n = curr - S;
            if (!visited[n] && isOuterWhite(n)) {
              visited[n] = 1;
              queue[tail++] = n;
            }
          }
          if (cy < S - 1) {
            const n = curr + S;
            if (!visited[n] && isOuterWhite(n)) {
              visited[n] = 1;
              queue[tail++] = n;
            }
          }
        }

        // ===================================================================
        // DYNAMIC JUBAH GRADIENT & CORAK RENDERING ON THE OUTER COAT
        // ===================================================================
        if (currentJubah.corakType !== 'polos') {
          const jubahMask = new Uint8Array(S * S);
          const [topR, topG, topB] = parseHexToRgb(currentJubah.gradientTopHex);
          const [botR, botG, botB] = parseHexToRgb(currentJubah.gradientBottomHex);

          for (let y = 192; y <= 432; y++) {
            const t = Math.max(0, Math.min(1, (y - 196) / 224));
            const gradR = topR + (botR - topR) * t;
            const gradG = topG + (botG - topG) * t;
            const gradB = topB + (botB - topB) * t;

            for (let x = 108; x <= 406; x++) {
              const idx = y * S + x;
              const p = idx * 4;
              if (data[p + 3] === 0) continue;
              const r = data[p];
              const g = data[p + 1];
              const b = data[p + 2];

              // Exclude hands skin box at bottom of sleeves
              const isHandSkin =
                y >= 322 &&
                y <= 382 &&
                (x <= 168 || x >= 330) &&
                r >= 210 &&
                g >= 145;
              // Exclude neck/chin skin near collar
              const isNeckSkin = y <= 210 && x >= 195 && x <= 290;

              // Detect original warm brown Jubah fabric pixels while preserving 3D shading
              const isBrownJubahPixel =
                !isHandSkin &&
                !isNeckSkin &&
                r >= 95 &&
                g >= 60 &&
                b >= 38 &&
                r - b >= 35 &&
                r - g >= 22;

              if (isBrownJubahPixel) {
                jubahMask[idx] = 1;
                // Preserve 3D highlight/shadow luminance from original brown pixel (base brown lum ~ 142)
                const origLum = 0.299 * r + 0.587 * g + 0.114 * b;
                const shadeFactor = Math.max(
                  0.62,
                  Math.min(1.32, origLum / 140)
                );
                data[p] = Math.min(255, Math.round(gradR * shadeFactor));
                data[p + 1] = Math.min(255, Math.round(gradG * shadeFactor));
                data[p + 2] = Math.min(255, Math.round(gradB * shadeFactor));
              }
            }
          }

          // Render custom Corak (Aurora, Api, Panda, Naga) onto an offscreen canvas
          // and blend strictly inside jubahMask so black outlines remain 100% crisp
          const patternCanvas = document.createElement('canvas');
          patternCanvas.width = S;
          patternCanvas.height = S;
          const pCtx = patternCanvas.getContext('2d');
          if (pCtx) {
            drawJubahCorakOverlay(pCtx, currentJubah.corakType);
            const pData = pCtx.getImageData(0, 0, S, S).data;
            for (let y = 192; y <= 432; y++) {
              for (let x = 108; x <= 406; x++) {
                const idx = y * S + x;
                if (jubahMask[idx] !== 1) continue;
                const p = idx * 4;
                const pa = pData[p + 3] / 255;
                if (pa > 0.01) {
                  const blend = Math.min(0.92, pa);
                  data[p] = Math.round(data[p] * (1 - blend) + pData[p] * blend);
                  data[p + 1] = Math.round(
                    data[p + 1] * (1 - blend) + pData[p + 1] * blend
                  );
                  data[p + 2] = Math.round(
                    data[p + 2] * (1 - blend) + pData[p + 2] * blend
                  );
                }
              }
            }
          }
        }

        // If expression is 'marah', 'sakit', or 'senang', cleanly replace the inner facial features
        // (brows, eyes, blush, mouth inside x:196..291, y:109..182) with the character's smooth skin tone
        if (
          currentExpression === 'marah' ||
          currentExpression === 'sakit' ||
          currentExpression === 'senang'
        ) {
          // Sample clean skin tone along the center bridge (x=243, y=121..164)
          const skinSampleIdx = (145 * S + 243) * 4;
          const baseR = data[skinSampleIdx] || 248;
          const baseG = data[skinSampleIdx + 1] || 189;
          const baseB = data[skinSampleIdx + 2] || 138;

          for (let y = 109; y <= 182; y++) {
            // Safe horizontal bounds inside the face that never touch the outer head or hijab black outline
            const dy = (y - 146) / 38;
            const xSpan = Math.round(47 * Math.sqrt(Math.max(0, 1 - dy * dy * 0.35)));
            const xMin = Math.max(197, 243 - xSpan);
            const xMax = Math.min(289, 243 + xSpan);

            // Sample clean skin at center x=243 if available, otherwise fallback to base skin
            const midIdx = (y * S + 243) * 4;
            const rowIsCleanMid =
              y >= 119 &&
              y <= 164 &&
              data[midIdx] > 210 &&
              data[midIdx + 1] > 145 &&
              data[midIdx + 2] > 95;
            const rowR = rowIsCleanMid ? data[midIdx] : baseR;
            const rowG = rowIsCleanMid ? data[midIdx + 1] : baseG;
            const rowB = rowIsCleanMid ? data[midIdx + 2] : baseB;

            for (let x = xMin; x <= xMax; x++) {
              const p = (y * S + x) * 4;
              const r = data[p];
              const g = data[p + 1];
              const b = data[p + 2];
              // Detect non-skin pixels inside the safe inner face zone (dark ink, white eye-shine, or pink blush)
              const isCleanSkin =
                r > 215 &&
                g > 155 &&
                g < 212 &&
                b > 105 &&
                b < 175 &&
                r - g < 72 &&
                r - b > 55;
              if (!isCleanSkin) {
                data[p] = rowR;
                data[p + 1] = rowG;
                data[p + 2] = rowB;
                data[p + 3] = 255;
              }
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);

        // Draw crisp cartoon facial expression matching the character's line-art style
        const ink = '#0d0d0d';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (currentExpression === 'marah') {
          // Warm angry blush on cheeks
          ctx.fillStyle = 'rgba(239, 68, 68, 0.38)';
          ctx.beginPath();
          ctx.ellipse(206, 159, 11, 6.5, 0, 0, Math.PI * 2);
          ctx.ellipse(279, 159, 11, 6.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Angry eyes with fierce flat upper slant
          const drawAngryEye = (cx: number, cy: number, isLeft: boolean) => {
            ctx.save();
            ctx.beginPath();
            if (isLeft) {
              ctx.moveTo(cx - 14, cy - 12);
              ctx.lineTo(cx + 14, cy - 4);
              ctx.lineTo(cx + 14, cy + 16);
              ctx.lineTo(cx - 14, cy + 16);
            } else {
              ctx.moveTo(cx - 14, cy - 4);
              ctx.lineTo(cx + 14, cy - 12);
              ctx.lineTo(cx + 14, cy + 16);
              ctx.lineTo(cx - 14, cy + 16);
            }
            ctx.closePath();
            ctx.clip();

            ctx.fillStyle = ink;
            ctx.beginPath();
            ctx.ellipse(cx, cy + 1, 11.5, 13, 0, 0, Math.PI * 2);
            ctx.fill();

            // White eye highlight
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx - 3.5, cy - 1.5, 3.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          };

          drawAngryEye(217, 141, true);
          drawAngryEye(269, 141, false);

          // Thick slanted V-shaped angry eyebrows
          ctx.strokeStyle = ink;
          ctx.lineWidth = 7.5;
          ctx.beginPath();
          ctx.moveTo(202, 115);
          ctx.lineTo(231, 126);
          ctx.moveTo(283, 115);
          ctx.lineTo(254, 126);
          ctx.stroke();

          // Frowning angry mouth
          ctx.strokeStyle = ink;
          ctx.lineWidth = 6.5;
          ctx.beginPath();
          ctx.moveTo(229, 176);
          ctx.quadraticCurveTo(243, 163, 257, 176);
          ctx.stroke();
        } else if (currentExpression === 'sakit') {
          // Rosy hurt cheek blush
          ctx.fillStyle = 'rgba(251, 113, 133, 0.42)';
          ctx.beginPath();
          ctx.ellipse(206, 159, 10, 6, 0, 0, Math.PI * 2);
          ctx.ellipse(279, 159, 10, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          // Worried upward eyebrows
          ctx.strokeStyle = ink;
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(203, 121);
          ctx.lineTo(226, 113);
          ctx.moveTo(282, 121);
          ctx.lineTo(259, 113);
          ctx.stroke();

          // Wincing > < eyes
          ctx.strokeStyle = ink;
          ctx.lineWidth = 7;
          ctx.beginPath();
          // Left '>'
          ctx.moveTo(206, 132);
          ctx.lineTo(225, 141);
          ctx.lineTo(206, 150);
          // Right '<'
          ctx.moveTo(279, 132);
          ctx.lineTo(260, 141);
          ctx.lineTo(279, 150);
          ctx.stroke();

          // Wavy / Open "Aduh!" mouth
          ctx.fillStyle = '#7f1d1d';
          ctx.strokeStyle = ink;
          ctx.lineWidth = 5.5;
          ctx.beginPath();
          ctx.ellipse(243, 172, 11, 7.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Cute cold sweat drop on upper right temple
          ctx.fillStyle = '#38bdf8';
          ctx.strokeStyle = ink;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(285, 108);
          ctx.quadraticCurveTo(293, 120, 285, 126);
          ctx.quadraticCurveTo(277, 120, 285, 108);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (currentExpression === 'senang') {
          // Rosy happy pink blush ovals
          ctx.fillStyle = 'rgba(244, 114, 182, 0.52)';
          ctx.beginPath();
          ctx.ellipse(205, 158, 11.5, 6.5, 0, 0, Math.PI * 2);
          ctx.ellipse(280, 158, 11.5, 6.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Cheerful arched eyebrows
          ctx.strokeStyle = ink;
          ctx.lineWidth = 6.5;
          ctx.beginPath();
          ctx.moveTo(204, 118);
          ctx.quadraticCurveTo(217, 109, 229, 117);
          ctx.moveTo(256, 117);
          ctx.quadraticCurveTo(269, 109, 281, 118);
          ctx.stroke();

          // Happy crescent ^ ^ eyes
          ctx.strokeStyle = ink;
          ctx.lineWidth = 7.5;
          ctx.beginPath();
          ctx.moveTo(205, 144);
          ctx.quadraticCurveTo(217, 127, 229, 144);
          ctx.moveTo(256, 144);
          ctx.quadraticCurveTo(268, 127, 280, 144);
          ctx.stroke();

          // Big happy laughing mouth :D with pink tongue
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(227, 166);
          ctx.quadraticCurveTo(243, 168, 259, 166);
          ctx.quadraticCurveTo(257, 182, 243, 182);
          ctx.quadraticCurveTo(229, 182, 227, 166);
          ctx.closePath();
          ctx.fillStyle = '#451a03';
          ctx.fill();
          ctx.clip();

          ctx.fillStyle = '#fb7185';
          ctx.beginPath();
          ctx.ellipse(243, 180, 10, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          ctx.strokeStyle = ink;
          ctx.lineWidth = 5.5;
          ctx.beginPath();
          ctx.moveTo(227, 166);
          ctx.quadraticCurveTo(243, 168, 259, 166);
          ctx.quadraticCurveTo(257, 182, 243, 182);
          ctx.quadraticCurveTo(229, 182, 227, 166);
          ctx.closePath();
          ctx.stroke();
        }

        if (!cancelled) {
          setTransparentCharUrl(canvas.toDataURL('image/png'));
        }
      } catch {
        if (!cancelled) {
          setTransparentCharUrl(null);
        }
      }
    };
    img.src = rawCharImage;
    return () => {
      cancelled = true;
    };
  }, [rawCharImage, currentExpression, currentJubah.id, currentJubah.corakType, currentJubah.gradientTopHex, currentJubah.gradientBottomHex]);

  useEffect(() => {
    if (!tempReaction) {
      if (student.bedroom.bedMessy && student.bedroom.clothesMessy) {
        setSpeechText(
          'Hmmph! Kasur dan bajuku masih berantakan sekali! Ayo rapikan kamar dulu biar aku tidak marah!'
        );
      } else if (student.bedroom.bedMessy) {
        setSpeechText(
          'Hmmph! Kasurnya masih berantakan! Klik kasur atau tombol "Rapikan Kasur" ya!'
        );
      } else if (student.bedroom.clothesMessy) {
        setSpeechText(
          'Hmmph! Bajuku masih berserakan di lantai! Klik tombol "Rapikan Baju" yuk!'
        );
      } else {
        setSpeechText(
          `Alhamdulillah kamarku rapi & bersih! Aku memakai ${currentJubah.name} dengan gagah!`
        );
      }
    }
  }, [
    student.bedroom.bedMessy,
    student.bedroom.clothesMessy,
    currentJubah.name,
    tempReaction,
  ]);

  const reactionTimerRef = useRef<number | null>(null);

  const scheduleReactionReset = (ms: number) => {
    if (reactionTimerRef.current !== null) {
      window.clearTimeout(reactionTimerRef.current);
    }
    reactionTimerRef.current = window.setTimeout(() => {
      setActiveFoodEmoji(null);
      setTempReaction(null);
      reactionTimerRef.current = null;
    }, ms);
  };

  useEffect(() => {
    return () => {
      if (reactionTimerRef.current !== null) {
        window.clearTimeout(reactionTimerRef.current);
      }
    };
  }, []);

  // Handle touching/poking the character -> 'sakit' (ouch expression)
  const handleTouchCharacter = () => {
    soundFX.playOuchTouch();
    const nextCount = touchCount + 1;
    setTouchCount(nextCount);
    setActiveFoodEmoji(null);
    setTempReaction('sakit');
    const ouchMessages = [
      'Aduh! Sakit tahu kalau dicubit! Jangan disentuh keras-keras ya!',
      'Aduuh! Pipiku sakit dicolek terus! Kasih aku makan Kurma atau Susu Madu saja yuk!',
      'Aw! Jangan dijahili terus dong, ayo kita selesaikan tantangan Sholat & Mengaji!',
    ];
    setSpeechText(ouchMessages[nextCount % ouchMessages.length]);
    scheduleReactionReset(2600);
  };

  // Handle feeding the character -> 'senang' (delighted expression)
  const handleFeedClick = (food: (typeof HALAL_FOOD_MENU)[number]) => {
    soundFX.playEatFood();
    setActiveFoodEmoji(food.emoji);
    setTempReaction('senang');
    setSpeechText(`Bismillah... Nyam nyam! ${food.name} enak sekali! Alhamdulillah aku senang banget!`);
    onFeedCharacter(food.name);
    scheduleReactionReset(2600);
  };

  // Handle cleaning room items
  const handleCleanClick = (target: 'bed' | 'clothes' | 'all') => {
    soundFX.playCleanRoom();
    onCleanRoom(target);
    setActiveFoodEmoji(null);
    setTempReaction('senang');
    setSpeechText(
      target === 'bed'
        ? 'Alhamdulillah kasurnya sudah rapi dan wangi!'
        : target === 'clothes'
          ? 'Alhamdulillah baju-baju sudah terlipat rapi di lemari!'
          : 'MasyaAllah! Seluruh kamar sudah bersih dan rapi!'
    );
    scheduleReactionReset(2400);
  };

  // Handle selecting or clicking a Jubah: only wearable if already purchased/owned
  const handleJubahCardClick = (jubah: JubahRobeDesign) => {
    const owned = isJubahOwned(student, jubah.id);
    if (owned) {
      soundFX.playCleanRoom();
      setCurtainKey((prev) => prev + 1);
      onSelectJubah(jubah.id);
      setActiveFoodEmoji(null);
      setTempReaction('bangga');
      setSpeechText(
        `Bismillah! Mengenakan ${jubah.name} (${jubah.colorThemeLabel} · ${jubah.corakLabel})!`
      );
      scheduleReactionReset(2200);
    } else {
      soundFX.playOuchTouch();
      setActiveFoodEmoji(null);
      setTempReaction('marah');
      setSpeechText(
        `Jubah ${jubah.name} belum dibeli! Kamu harus membelinya dengan ${jubah.pointCost} Poin Sholat terlebih dahulu sebelum bisa memakainya.`
      );
      scheduleReactionReset(3200);
    }
  };

  // Handle purchasing or equipping Jubah with Poin Sholat
  const handleBuyOrEquipJubah = (
    e: React.MouseEvent,
    jubah: JubahRobeDesign
  ) => {
    e.stopPropagation();
    const owned = isJubahOwned(student, jubah.id);
    if (!owned) {
      if (availableSholatPoints < jubah.pointCost) {
        soundFX.playOuchTouch();
        setActiveFoodEmoji(null);
        setTempReaction('marah');
        setSpeechText(
          `Poin Sholat belum cukup (${availableSholatPoints} / ${jubah.pointCost} Poin). Belum bisa memakai ${jubah.name} sebelum dibeli!`
        );
        scheduleReactionReset(3200);
      }
    }
    const res = onSelectJubah(jubah.id);
    if (res && typeof res === 'object') {
      if (res.ok) {
        setCurtainKey((prev) => prev + 1);
        setActiveFoodEmoji(null);
        setTempReaction('senang');
        setSpeechText(res.message);
        scheduleReactionReset(2600);
      } else {
        soundFX.playOuchTouch();
        setSpeechText(res.message);
      }
    }
  };

  const renderJubahMotifBadgeSvg = (jubah: JubahRobeDesign) => {
    return (
      <svg
        viewBox="0 0 64 56"
        className="w-12 h-11 rounded-xl shadow-sm border border-white/60 shrink-0 overflow-hidden"
      >
        <defs>
          <linearGradient id={`grad-${jubah.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={jubah.gradientTopHex} />
            <stop offset="100%" stopColor={jubah.gradientBottomHex} />
          </linearGradient>
        </defs>
        <rect width="64" height="56" fill={`url(#grad-${jubah.id})`} />
        {/* Mini Jubah Silhouette */}
        <path
          d="M18 10 L26 8 L32 15 L38 8 L46 10 L54 24 L46 28 L43 19 L44 49 L20 49 L21 19 L18 28 L10 24 Z"
          fill="rgba(255,255,255,0.16)"
          stroke={jubah.accentHex}
          strokeWidth="1.8"
        />
        {jubah.corakType === 'polos' && (
          <g>
            <line
              x1="32"
              y1="15"
              x2="32"
              y2="48"
              stroke="#fde68a"
              strokeWidth="2"
            />
          </g>
        )}
        {jubah.corakType === 'aurora' && (
          <g>
            <path
              d="M12 38 Q32 22 52 34"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
            />
            <polygon
              points="32,16 34,22 40,24 34,26 32,32 30,26 24,24 30,22"
              fill="#fde047"
            />
            <circle cx="21" cy="36" r="2.2" fill="#f472b6" />
            <circle cx="43" cy="36" r="2.2" fill="#fde047" />
          </g>
        )}
        {jubah.corakType === 'api' && (
          <g>
            {/* Fiery Flame Tongues */}
            <path
              d="M18 49 Q20 33 25 27 Q26 36 29 31 Q32 18 35 29 Q38 22 40 34 Q44 27 46 49 Z"
              fill="#f97316"
              stroke="#dc2626"
              strokeWidth="1"
            />
            <path
              d="M23 49 Q26 37 32 26 Q38 37 41 49 Z"
              fill="#fef08a"
            />
          </g>
        )}
        {jubah.corakType === 'panda' && (
          <g>
            {/* Cute Cartoon Panda Head */}
            <circle cx="24" cy="21" r="4.2" fill="#0f172a" />
            <circle cx="40" cy="21" r="4.2" fill="#0f172a" />
            <circle
              cx="32"
              cy="28"
              r="10.5"
              fill="#ffffff"
              stroke="#0f172a"
              strokeWidth="2"
            />
            <ellipse cx="28" cy="27" rx="2.8" ry="3.4" fill="#0f172a" />
            <ellipse cx="36" cy="27" rx="2.8" ry="3.4" fill="#0f172a" />
            <circle cx="28.5" cy="26" r="1" fill="#ffffff" />
            <circle cx="36.5" cy="26" r="1" fill="#ffffff" />
            <ellipse cx="32" cy="31" rx="2" ry="1.3" fill="#0f172a" />
            <circle cx="25.5" cy="31" r="1.6" fill="#fb7185" />
            <circle cx="38.5" cy="31" r="1.6" fill="#fb7185" />
          </g>
        )}
        {jubah.corakType === 'naga' && (
          <g>
            {/* Winding Golden Dragon */}
            <path
              d="M22 45 C16 34, 48 30, 32 16"
              fill="none"
              stroke="#fde047"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <polygon points="32,11 39,17 35,23 29,23 25,17" fill="#facc15" stroke="#78350f" strokeWidth="1.2" />
            <circle cx="30" cy="17" r="1.2" fill="#ffffff" />
            <circle cx="34" cy="17" r="1.2" fill="#ffffff" />
          </g>
        )}
      </svg>
    );
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-4 animate-stage-reveal">
      <div className="rounded-3xl bg-white border-2 border-amber-200/90 shadow-xl overflow-hidden">
          {/* Bedroom Top Header Bar */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-amber-50 via-orange-50/70 to-emerald-50 border-b border-amber-200/80 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  Kamar Santri Interaktif · {currentJubah.name}
                </h2>
                <span
                  className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full text-white shadow-xs"
                  style={{
                    background: `linear-gradient(135deg, ${currentJubah.gradientTopHex}, ${currentJubah.gradientBottomHex})`,
                  }}
                >
                  {currentJubah.colorThemeLabel} · {currentJubah.corakLabel}
                </span>
                <span
                  className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    currentExpression === 'marah'
                      ? 'bg-red-100 text-red-700 border border-red-300'
                      : currentExpression === 'sakit'
                        ? 'bg-orange-100 text-orange-800 border border-orange-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {currentExpression === 'marah'
                    ? '😠 Marah (Kamar Berantakan!)'
                    : currentExpression === 'sakit'
                      ? '😣 Aduh Sakit! (Disentuh)'
                      : currentExpression === 'senang'
                        ? '😄 Sangat Senang!'
                        : '😎 Gagah & Rapi'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Sentuh karakter untuk lihat reaksinya, beri makan, dan rapikan kasur serta baju agar wajahnya tidak merah marah!
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle Art Style: Anime RPG HD vs Piskel Pixel-Art */}
              <button
                type="button"
                onClick={() =>
                  setArtStyle((prev) => (prev === 'anime_rpg' ? 'piskel_pixel' : 'anime_rpg'))
                }
                className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>{artStyle === 'anime_rpg' ? 'Mode Piskel 16-Bit' : 'Mode Anime RPG'}</span>
              </button>

              <button
                type="button"
                onClick={onShareCharacterToChat}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Pamerkan Jubah</span>
              </button>
            </div>
          </div>

          {/* INTERACTIVE BEDROOM VIEWPORT (Realistic Warm Daylight Bedroom + Curtain Opening Animation) */}
          <div
            data-testid="pou-bedroom-stage"
            className="relative h-[450px] sm:h-[480px] w-full select-none overflow-hidden"
            style={{
              background:
                'linear-gradient(180deg, #fffbeb 0%, #fef3c7 58%, #d9a066 58.5%, #c68b59 100%)',
            }}
          >
            {/* Animated Opening Curtains on Jubah Change / Room Reveal */}
            <div
              key={`curtain-left-${curtainKey}`}
              className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-emerald-800 to-emerald-600 z-30 pointer-events-none animate-curtain-left border-r-4 border-amber-400 shadow-2xl"
            />
            <div
              key={`curtain-right-${curtainKey}`}
              className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-emerald-800 to-emerald-600 z-30 pointer-events-none animate-curtain-right border-l-4 border-amber-400 shadow-2xl"
            />

            {/* Bedroom Architecture SVG: Sunlit Window, Bookshelf, Rug, Wall Frame & Wood Floor */}
            <svg
              viewBox="0 0 800 480"
              className="absolute inset-0 w-full h-full pointer-events-none"
              preserveAspectRatio="xMidYMid slice"
            >
              {/* Warm Wall Paneling & Baseboard */}
              <rect x="0" y="255" width="800" height="24" fill="#e6ccb2" stroke="#b08968" strokeWidth="2" />
              {/* Perspective Wood Floor Planks */}
              <line x1="0" y1="330" x2="800" y2="330" stroke="#b07d4f" strokeWidth="2" opacity="0.55" />
              <line x1="0" y1="390" x2="800" y2="390" stroke="#b07d4f" strokeWidth="2" opacity="0.55" />
              <line x1="0" y1="445" x2="800" y2="445" stroke="#b07d4f" strokeWidth="2" opacity="0.55" />
              <line x1="200" y1="279" x2="110" y2="480" stroke="#b07d4f" strokeWidth="2" opacity="0.45" />
              <line x1="400" y1="279" x2="400" y2="480" stroke="#b07d4f" strokeWidth="2" opacity="0.45" />
              <line x1="600" y1="279" x2="690" y2="480" stroke="#b07d4f" strokeWidth="2" opacity="0.45" />

              {/* Sunlight Window on Left-Center Wall showing Bright Sky & Green Trees */}
              <g transform="translate(65, 36)">
                <rect x="0" y="0" width="170" height="145" rx="12" fill="#bae6fd" stroke="#92400e" strokeWidth="6" />
                {/* Sun & Clouds outside window */}
                <circle cx="42" cy="36" r="18" fill="#fde047" />
                <circle cx="115" cy="42" r="16" fill="#ffffff" opacity="0.9" />
                <circle cx="132" cy="45" r="12" fill="#ffffff" opacity="0.9" />
                {/* Green hills & trees outside */}
                <path d="M4 115 Q55 82 110 112 T166 105 L166 141 L4 141 Z" fill="#4ade80" />
                <path d="M4 128 Q85 102 166 125 L166 141 L4 141 Z" fill="#16a34a" />
                {/* Window Panes */}
                <line x1="85" y1="0" x2="85" y2="145" stroke="#92400e" strokeWidth="5" />
                <line x1="0" y1="72" x2="170" y2="72" stroke="#92400e" strokeWidth="5" />
                {/* Soft Red/Gold Drapes */}
                <path d="M-8 -6 L28 -6 L14 152 L-8 148 Z" fill="#f59e0b" opacity="0.85" />
                <path d="M142 -6 L178 -6 L178 148 L156 152 Z" fill="#f59e0b" opacity="0.85" />
              </g>

              {/* Center Wall Islamic Calligraphy Frame */}
              <g transform="translate(335, 24)">
                <rect x="0" y="0" width="130" height="54" rx="8" fill="#065f46" stroke="#d97706" strokeWidth="4" />
                <rect x="6" y="6" width="118" height="42" rx="4" fill="none" stroke="#fde68a" strokeWidth="1.5" />
                <text x="65" y="31" textAnchor="middle" fill="#fef08a" fontSize="13" fontWeight="bold">
                  بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
                </text>
              </g>

              {/* Right Wall Wooden Wardrobe & Bookshelf */}
              <g transform="translate(565, 38)">
                <rect x="0" y="0" width="175" height="225" rx="8" fill="#92400e" stroke="#78350f" strokeWidth="4" />
                <rect x="10" y="12" width="74" height="200" rx="4" fill="#b45309" stroke="#78350f" strokeWidth="2" />
                <rect x="91" y="12" width="74" height="95" rx="4" fill="#78350f" />
                {/* Books on Shelf */}
                <rect x="98" y="62" width="12" height="42" rx="2" fill="#10b981" />
                <rect x="112" y="56" width="14" height="48" rx="2" fill="#f59e0b" />
                <rect x="128" y="60" width="12" height="44" rx="2" fill="#3b82f6" />
                <rect x="142" y="52" width="15" height="52" rx="2" fill="#ec4899" />
                {/* Lower Wardrobe Drawer */}
                <rect x="91" y="115" width="74" height="97" rx="4" fill="#b45309" stroke="#78350f" strokeWidth="2" />
                <circle cx="74" cy="112" r="4" fill="#fde047" />
                <circle cx="102" cy="162" r="4" fill="#fde047" />
              </g>

              {/* Center Woven Bedroom Carpet / Sajadah Rug under Character */}
              <ellipse cx="400" cy="382" rx="145" ry="46" fill="#065f46" stroke="#fbbf24" strokeWidth="4" />
              <ellipse cx="400" cy="382" rx="122" ry="35" fill="#047857" stroke="#fde68a" strokeWidth="1.5" />
            </svg>

            {/* Top Status HUD Bars inside Bedroom: Kebersihan Kamar & Energi Kenyang */}
            <div className="absolute top-3 left-6 right-6 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <div className="flex items-center gap-2 bg-white/95 border border-amber-300 px-3.5 py-1.5 rounded-2xl shadow-md">
                <span className="text-xs font-extrabold text-slate-800">Kebersihan Kamar:</span>
                <div className="w-24 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      student.bedroom.cleanliness < 100 ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${student.bedroom.cleanliness}%` }}
                  />
                </div>
                <span
                  className={`text-xs font-mono-tabular font-extrabold ${
                    student.bedroom.cleanliness < 100 ? 'text-red-600' : 'text-emerald-700'
                  }`}
                >
                  {student.bedroom.cleanliness}%
                </span>
              </div>

              <div className="flex items-center gap-2 bg-white/95 border border-amber-300 px-3.5 py-1.5 rounded-2xl shadow-md">
                <Utensils className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs font-extrabold text-slate-800">Kenyang:</span>
                <div className="w-20 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${student.bedroom.hunger}%` }}
                  />
                </div>
                <span className="text-xs font-mono-tabular font-extrabold text-amber-700">
                  {student.bedroom.hunger}%
                </span>
              </div>
            </div>

            {/* INTERACTIVE PROP 1 (LEFT): KASUR (BED) — Enlarged & positioned higher near the window */}
            <button
              type="button"
              onClick={() => handleCleanClick('bed')}
              aria-label={
                student.bedroom.bedMessy
                  ? 'Kasur Berantakan - Klik untuk Merapikan Kasur'
                  : 'Kasur Sudah Rapi'
              }
              className="absolute left-4 sm:left-6 top-[166px] sm:top-[172px] z-10 group text-left cursor-pointer focus:outline-none transition-transform hover:scale-[1.02]"
            >
              <div className="relative">
                <svg viewBox="0 0 210 135" className="w-52 sm:w-64 h-36 sm:h-44 drop-shadow-lg">
                  {/* Wooden Bed Frame */}
                  <rect x="8" y="16" width="20" height="104" rx="5" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
                  <rect x="184" y="44" width="18" height="76" rx="4" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
                  <rect x="14" y="66" width="182" height="40" rx="4" fill="#92400e" stroke="#451a03" strokeWidth="1.5" />
                  {/* Mattress */}
                  <rect x="24" y="48" width="164" height="28" rx="6" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />

                  {student.bedroom.bedMessy ? (
                    /* MESSY BED: Crooked pillows & tangled blanket hanging onto floor */
                    <g>
                      <rect
                        x="30"
                        y="32"
                        width="46"
                        height="22"
                        rx="6"
                        transform="rotate(-18 45 45)"
                        fill="#f87171"
                        stroke="#991b1b"
                        strokeWidth="2"
                      />
                      <path
                        d="M65 48 Q98 30 138 53 L168 114 Q115 128 78 96 Z"
                        fill="#dc2626"
                        stroke="#7f1d1d"
                        strokeWidth="2.5"
                      />
                      <path
                        d="M95 56 Q125 42 156 66 L142 104 Z"
                        fill="#fbbf24"
                        stroke="#92400e"
                        strokeWidth="2"
                      />
                    </g>
                  ) : (
                    /* NEAT BED: Crisp folded emerald sheet, straight pillow & gold trim */
                    <g>
                      <rect
                        x="30"
                        y="34"
                        width="48"
                        height="20"
                        rx="5"
                        fill="#ffffff"
                        stroke="#10b981"
                        strokeWidth="2"
                      />
                      <rect
                        x="74"
                        y="46"
                        width="114"
                        height="32"
                        rx="5"
                        fill="#10b981"
                        stroke="#047857"
                        strokeWidth="2.5"
                      />
                      <rect x="74" y="46" width="18" height="32" fill="#fde047" />
                    </g>
                  )}
                </svg>

                <div
                  className={`-mt-2 px-3 py-1 rounded-xl text-[11px] font-extrabold shadow-md flex items-center gap-1.5 w-fit ${
                    student.bedroom.bedMessy
                      ? 'bg-red-600 text-white animate-bounce'
                      : 'bg-emerald-700 text-white'
                  }`}
                >
                  <BedDouble className="w-3.5 h-3.5" />
                  <span>
                    {student.bedroom.bedMessy ? 'Kasur Berantakan! (Rapikan)' : 'Kasur Rapi ✓'}
                  </span>
                </div>
              </div>
            </button>

            {/* INTERACTIVE PROP 2 (RIGHT): BAJU (CLOTHES) — Messy Pile vs Folded Neatly */}
            <button
              type="button"
              onClick={() => handleCleanClick('clothes')}
              aria-label={
                student.bedroom.clothesMessy
                  ? 'Baju Berserakan - Klik untuk Merapikan Baju'
                  : 'Baju Sudah Rapi'
              }
              className="absolute right-5 sm:right-7 bottom-6 z-10 group text-left cursor-pointer focus:outline-none"
            >
              <div className="relative flex flex-col items-end">
                <svg viewBox="0 0 170 115" className="w-36 sm:w-40 h-24 sm:h-28 drop-shadow-md">
                  {student.bedroom.clothesMessy ? (
                    /* MESSY CLOTHES: Scattered shirts, socks & sarung on floor */
                    <g>
                      <path
                        d="M20 75 Q48 45 85 68 L98 95 L15 98 Z"
                        fill="#fb7185"
                        stroke="#9f1239"
                        strokeWidth="2.5"
                      />
                      <path
                        d="M68 62 Q112 38 148 72 L135 98 L62 92 Z"
                        fill="#38bdf8"
                        stroke="#0369a1"
                        strokeWidth="2.5"
                      />
                      <rect
                        x="45"
                        y="48"
                        width="44"
                        height="22"
                        rx="5"
                        transform="rotate(22 60 55)"
                        fill="#facc15"
                        stroke="#854d0e"
                        strokeWidth="2"
                      />
                    </g>
                  ) : (
                    /* NEAT FOLDED CLOTHES BASKET */
                    <g>
                      <rect
                        x="32"
                        y="58"
                        width="106"
                        height="42"
                        rx="6"
                        fill="#b45309"
                        stroke="#78350f"
                        strokeWidth="2.5"
                      />
                      <rect x="42" y="46" width="86" height="14" rx="4" fill="#10b981" stroke="#065f46" strokeWidth="2" />
                      <rect x="46" y="34" width="78" height="14" rx="4" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
                      <rect x="50" y="22" width="70" height="14" rx="4" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
                    </g>
                  )}
                </svg>

                <div
                  className={`-mt-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold shadow-md flex items-center gap-1 ${
                    student.bedroom.clothesMessy
                      ? 'bg-red-600 text-white animate-bounce'
                      : 'bg-emerald-700 text-white'
                  }`}
                >
                  <Shirt className="w-3.5 h-3.5" />
                  <span>
                    {student.bedroom.clothesMessy ? 'Baju Berantakan! (Rapikan)' : 'Baju Rapi ✓'}
                  </span>
                </div>
              </div>
            </button>

            {/* STATIONARY POU-STYLE EXPRESSIVE HERO CHARACTER IN CENTER OF BEDROOM */}
            <div className="absolute left-1/2 top-[53%] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
              {/* Speech Bubble Above Character */}
              {showSpeechBubble && speechText && (
                <div
                  onClick={() => setShowSpeechBubble(false)}
                  title="Klik untuk menyembunyikan teks"
                  className={`mb-1.5 px-4 py-2 rounded-2xl text-xs font-extrabold shadow-lg border-2 max-w-[300px] text-center leading-snug transition-all cursor-pointer hover:opacity-95 ${
                    currentExpression === 'marah'
                      ? 'bg-red-50 text-red-900 border-red-500 animate-pulse'
                      : currentExpression === 'sakit'
                        ? 'bg-amber-50 text-amber-950 border-amber-500'
                        : 'bg-white text-slate-900 border-emerald-500'
                  }`}
                >
                  {speechText}
                  <div className="text-[9px] font-semibold text-slate-400 mt-0.5">
                    (Ketuk untuk tutup)
                  </div>
                </div>
              )}

              {/* Floating Food Animation when eating */}
              {activeFoodEmoji && (
                <div className="absolute top-28 z-30 text-4xl animate-bounce pointer-events-none">
                  {activeFoodEmoji}
                </div>
              )}

              {/* Clickable Character Stage Using User-Provided Custom Blocky Santri Character Images */}
              <button
                type="button"
                data-testid="expressive-jubah-character"
                onClick={handleTouchCharacter}
                aria-label="Sentuh Karakter Siswa"
                className={`relative group focus:outline-none cursor-pointer transition-transform ${
                  currentExpression === 'sakit'
                    ? 'animate-hurt-shake'
                    : currentExpression === 'senang'
                      ? 'animate-happy-bounce'
                      : 'hover:scale-[1.03]'
                }`}
              >
                <div className="relative w-48 h-56 sm:w-56 sm:h-64 flex items-center justify-center">
                  {/* Subtle Jubah Aura Glow Behind Character */}
                  <div
                    className="absolute inset-6 rounded-full blur-xl opacity-45 pointer-events-none transition-colors duration-500"
                    style={{
                      background:
                        currentExpression === 'marah'
                          ? '#ef4444'
                          : `linear-gradient(135deg, ${currentJubah.gradientTopHex}, ${currentJubah.gradientBottomHex})`,
                    }}
                  />

                  {/* Cutout Uploaded Character Image (Putra / Putri) with Dynamic Jubah Corak */}
                  <img
                    src={
                      transparentCharUrl ||
                      (student.gender === 'putri'
                        ? PUTRI_CHARACTER_IMAGE
                        : PUTRA_CHARACTER_IMAGE)
                    }
                    alt={`Karakter ${student.name}`}
                    className="relative z-10 w-full h-full object-contain drop-shadow-[0_14px_14px_rgba(0,0,0,0.28)] select-none pointer-events-none transition-all duration-300"
                    style={{
                      imageRendering: artStyle === 'piskel_pixel' ? 'pixelated' : 'auto',
                      filter:
                        currentExpression === 'marah'
                          ? 'drop-shadow(0 0 10px rgba(239,68,68,0.65)) saturate(1.15)'
                          : currentExpression === 'sakit'
                            ? 'drop-shadow(0 0 8px rgba(245,158,11,0.65))'
                            : 'drop-shadow(0 12px 14px rgba(0,0,0,0.28))',
                    }}
                  />

                  {/* Dynamic Expression Status Markers for Interactive Feedback & Testability */}
                  {currentExpression === 'marah' && (
                    <span
                      data-testid="face-expression-marah"
                      className="absolute top-3 right-5 z-20 text-2xl animate-bounce pointer-events-none drop-shadow-sm"
                      title="Karakter sedang marah karena kamar berantakan"
                    >
                      💢
                    </span>
                  )}
                  {currentExpression === 'sakit' && (
                    <span
                      data-testid="face-expression-sakit"
                      className="absolute top-3 right-5 z-20 text-2xl animate-bounce pointer-events-none drop-shadow-sm"
                      title="Aduh sakit!"
                    >
                      🩹
                    </span>
                  )}
                  {currentExpression === 'senang' && (
                    <span
                      data-testid="face-expression-senang"
                      className="absolute top-2 right-4 z-20 text-2xl animate-bounce pointer-events-none drop-shadow-sm"
                      title="Senang sekali!"
                    >
                      ✨
                    </span>
                  )}
                  {(currentExpression === 'bangga' || currentExpression === 'khusyuk') && (
                    <span
                      data-testid="face-expression-bangga"
                      className="sr-only"
                    >
                      Gagah &amp; Rapi
                    </span>
                  )}
                </div>

                {/* Nameplate & Jubah Badge under Feet */}
                <div className="-mt-2 px-4 py-1 rounded-full bg-slate-900/90 text-white border-2 border-amber-400 shadow-md flex items-center gap-2 mx-auto w-fit relative z-20">
                  <span className="text-xs font-extrabold text-amber-300">{student.name}</span>
                  <span className="text-[10px] text-emerald-300 font-bold">
                    &middot; {currentJubah.name} ({currentJubah.corakLabel})
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Dedicated Interactive Room Care & Feeding Control Strip right below the Bedroom Canvas */}
          <div className="px-4 py-3 bg-white border-t border-amber-200 flex flex-wrap items-center justify-between gap-2.5">
            {/* Room Care Controls (Rapikan Kasur, Rapikan Baju, Uji Kamar Berantakan) */}
            <div className="flex items-center flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleCleanClick('bed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  student.bedroom.bedMessy
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-xs'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                <BedDouble className="w-3.5 h-3.5" />
                <span>{student.bedroom.bedMessy ? 'Rapikan Kasur' : 'Kasur Rapi ✓'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleCleanClick('clothes')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  student.bedroom.clothesMessy
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-xs'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                <Shirt className="w-3.5 h-3.5" />
                <span>{student.bedroom.clothesMessy ? 'Rapikan Baju' : 'Baju Rapi ✓'}</span>
              </button>

              {!student.bedroom.bedMessy && !student.bedroom.clothesMessy && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playOuchTouch();
                    onMakeRoomMessy();
                  }}
                  title="Uji ekspresi marah saat kamar berantakan"
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Acak Kamar</span>
                </button>
              )}
            </div>

            {/* Food Tray Controls (Beri Makan Karakter seperti Pou) */}
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-[11px] font-extrabold text-slate-700 mr-1">
                Beri Makan:
              </span>
              {HALAL_FOOD_MENU.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => handleFeedClick(food)}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-slate-900 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span>{food.emoji}</span>
                  <span>{food.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Strip under Bedroom: Toko & Koleksi Jubah Kemuliaan (Purchased with Poin Sholat) */}
          <div className="p-4 bg-gradient-to-b from-amber-50/80 to-orange-50/50 border-t border-amber-200/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-slate-900">
                <Shield className="w-4 h-4 text-emerald-700" />
                <span>Koleksi &amp; Toko Jubah Kemuliaan (Beli dengan Poin Sholat):</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div
                  data-testid="available-sholat-points-badge"
                  className="px-3 py-1 rounded-full bg-emerald-700 text-white text-xs font-extrabold shadow-xs flex items-center gap-1.5 border border-amber-300"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Poin Sholat Tersedia: {availableSholatPoints} Poin</span>
                </div>
                <button
                  type="button"
                  onClick={onGoToChallenges}
                  className="px-2.5 py-1 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Cari Poin Sholat</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {feedbackBanner && (
              <div
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center justify-between gap-2 ${
                  feedbackBanner.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}
              >
                <span>{feedbackBanner.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              {JUBAH_DESIGNS.map((jubah) => {
                const isEquipped = student.selectedJubahId === jubah.id;
                const isOwned = isJubahOwned(student, jubah.id);
                const canAfford = availableSholatPoints >= jubah.pointCost;

                return (
                  <div
                    key={jubah.id}
                    data-testid={`jubah-card-${jubah.id}`}
                    onClick={() => handleJubahCardClick(jubah)}
                    className={`p-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative overflow-hidden ${
                      isEquipped
                        ? 'bg-emerald-900 text-white border-amber-400 shadow-lg ring-2 ring-amber-400/60'
                        : isOwned
                          ? 'bg-white hover:bg-emerald-50/70 text-slate-800 border-emerald-300 shadow-xs'
                          : 'bg-slate-50 hover:bg-amber-50/70 text-slate-800 border-slate-200 shadow-xs'
                    }`}
                  >
                    {/* Top Row: Mini Festive SVG Motif Preview + Price / Status Pill */}
                    <div className="flex items-start justify-between gap-1.5">
                      {renderJubahMotifBadgeSvg(jubah)}
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            isEquipped
                              ? 'bg-amber-400 text-slate-950'
                              : isOwned
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : canAfford
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {jubah.pointCost === 0
                            ? 'Gratis'
                            : `${jubah.pointCost} Poin`}
                        </span>
                        <span
                          className={`text-[9px] font-bold ${
                            isEquipped ? 'text-emerald-200' : 'text-slate-500'
                          }`}
                        >
                          Jubah {jubah.tier}
                        </span>
                      </div>
                    </div>

                    {/* Middle Info: Name, Color Theme & Corak Label */}
                    <div className="space-y-0.5">
                      <div className="text-xs font-extrabold leading-snug">
                        {jubah.name}
                      </div>
                      <div
                        className={`text-[10px] font-extrabold ${
                          isEquipped ? 'text-amber-300' : 'text-emerald-700'
                        }`}
                      >
                        {jubah.colorThemeLabel}
                      </div>
                      <div
                        className={`text-[10px] font-semibold leading-tight ${
                          isEquipped ? 'text-emerald-100' : 'text-slate-600'
                        }`}
                      >
                        {jubah.corakLabel}
                      </div>
                    </div>

                    {/* Action Button: Pakai vs Beli dengan Poin Sholat */}
                    <button
                      type="button"
                      data-testid={`jubah-action-${jubah.id}`}
                      onClick={(e) => handleBuyOrEquipJubah(e, jubah)}
                      className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isEquipped
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : isOwned
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : canAfford
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs'
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      {isEquipped ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Sedang Dipakai</span>
                        </>
                      ) : isOwned ? (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Pakai Jubah</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Beli ({jubah.pointCost} Poin)</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
  );
};
