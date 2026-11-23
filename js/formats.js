// הגדרת הפורמטים לפי מספר השחקנים: זמינות, תיאור, מספר משחקים והמלצה.
// כל הטקסטים מגיעים מ־i18n, ומחושבים בזמן הרינדור (כך שהחלפת שפה משנה הכול).

import { t } from './i18n.js';

export const MIN_PLAYERS = 4;

const pairs = (k) => (k * (k - 1)) / 2;

/** שם שלב בנוקאאוט לפי מספר המשתתפים בו */
export function stageName(count, roundIndex = 0) {
  if (count <= 2) return t('final');
  if (count <= 4) return t('semi');
  if (count === 8) return t('quarter');
  if (count === 16) return t('r16');
  return t('roundN', { n: roundIndex + 1 });
}

/** מספר בתים לפי מספר שחקנים */
export function groupCount(n) {
  return Math.max(2, Math.round(n / 4));
}

/** גדלי הבתים, מחולקים כמה שיותר שווה. למשל 10 → [4, 3, 3] */
export function groupSizes(n) {
  const g = groupCount(n);
  return Array.from({ length: g }, (_, i) => Math.floor(n / g) + (i < n % g ? 1 : 0));
}

/** כמה שחקנים עולים מהבתים לנוקאאוט */
export function groupQualifiers(g) {
  return g <= 3 ? 4 : g * 2;
}

export function swissRounds(n) {
  return Math.ceil(Math.log2(n));
}

/** מספר המשחקים בנוקאאוט עם k משתתפים, כולל עליות בהגרלה */
const koGames = (k) => k - 1;

export const groupLetter = (g) => t('groupLetters')[g] ?? String(g + 1);

export function groupShape(n) {
  const sizes = groupSizes(n);
  const same = sizes.every((k) => k === sizes[0]);
  return same
    ? t('groupShapeEven', { g: sizes.length, size: sizes[0] })
    : t('groupShapeMixed', { g: sizes.length, sizes: sizes.join(', ') });
}

export function getFormats(n) {
  const list = [];
  const odd = n % 2 === 1;

  list.push({
    id: 'league',
    title: t('fmtLeague'),
    desc: t('descLeague') + (odd ? t('descOddRound') : ''),
    games: pairs(n),
  });

  if (n >= 6) {
    const sizes = groupSizes(n);
    const g = sizes.length;
    const q = groupQualifiers(g);
    const adv = g === 3 ? t('advTop1Plus') : t('advTop2');
    list.push({
      id: 'groups',
      title: t('fmtGroups'),
      desc: t('descGroups', { shape: groupShape(n), adv, stage: stageName(q) }),
      games: sizes.reduce((sum, k) => sum + pairs(k), 0) + koGames(q),
    });
  }

  list.push({
    id: 'ko',
    title: t('fmtKo'),
    desc: t('descKo') + (odd || (n & (n - 1)) !== 0 ? t('descKoDraw') : ''),
    games: koGames(n),
  });

  if (n >= 6) {
    const r = swissRounds(n);
    list.push({
      id: 'swiss',
      title: t('fmtSwiss'),
      desc: t('descSwiss', { r }) + (odd ? t('descOddSwiss') : ''),
      games: r * Math.floor(n / 2) + koGames(4),
    });
  }

  const rec = n <= 5 ? 'league' : 'groups';
  return list.map((f) => ({ ...f, recommended: f.id === rec }));
}

export function formatLabel(tour) {
  const n = tour.players.length;
  const what = {
    groups: () => groupShape(n),
    league: () => t('fmtLeague'),
    swiss: () => t('fmtSwiss'),
    ko: () => t('fmtKo'),
  }[tour.format]();
  return t('formatLabel', { what, n });
}
