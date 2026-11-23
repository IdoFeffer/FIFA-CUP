// נתוני מסך האלוף.

import { isDone, winnerOf } from './standings.js';

export function playerStats(t, id) {
  let wins = 0, gf = 0, ga = 0, played = 0;
  for (const m of t.matches) {
    if (!isDone(m) || (m.a !== id && m.b !== id)) continue;
    played++;
    const mine = m.a === id ? m.ga : m.gb;
    const theirs = m.a === id ? m.gb : m.ga;
    gf += mine; ga += theirs;
    if (winnerOf(m) === id) wins++;
  }
  return { played, wins, goals: gf, gd: gf - ga };
}

/** ההפרש הגדול ביותר. שוויון → המנצח הבקיע יותר → המשחק המאוחר */
export function biggestWin(t) {
  let best = null;
  t.matches.forEach((m, i) => {
    if (!isDone(m) || m.ga === m.gb) return;
    const margin = Math.abs(m.ga - m.gb);
    const top = Math.max(m.ga, m.gb);
    if (!best || margin > best.margin || (margin === best.margin && top >= best.top)) best = { m, margin, top, i };
  });
  return best ? best.m : null;
}

/** הכי הרבה שערים. שוויון → הפרש קטן יותר → המשחק המאוחר */
export function craziestMatch(t) {
  let best = null;
  t.matches.forEach((m) => {
    if (!isDone(m)) return;
    const total = m.ga + m.gb;
    const margin = Math.abs(m.ga - m.gb);
    if (total === 0) return;
    if (!best || total > best.total || (total === best.total && margin <= best.margin)) best = { m, total, margin };
  });
  return best ? best.m : null;
}

/** המשחק שהכריע את התואר: גמר / משחק מכריע */
export function finalMatch(t) {
  if (t.deciderId) return t.matches.find((m) => m.id === t.deciderId) || null;
  const last = t.ko.rounds[t.ko.rounds.length - 1];
  if (!last || last.matchIds.length !== 1) return null;
  return t.matches.find((m) => m.id === last.matchIds[0]) || null;
}
