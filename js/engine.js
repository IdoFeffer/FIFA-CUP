// מנוע הטורניר: יצירה, הזנת תוצאות, התקדמות בין שלבים, הגרלות ואלוף.

import { getFormats, groupSizes, groupQualifiers, swissRounds, stageName, groupLetter } from './formats.js';
import { t as tr, localName } from './i18n.js';
import { shuffle, splitIntoGroups, drawPool } from './draw.js';
import { roundRobin, swissPairings, koPairs } from './schedule.js';
import { computeTable, isDone, winnerOf } from './standings.js';

let uid = 0;
const newId = (prefix) => `${prefix}${Date.now().toString(36)}${(uid++).toString(36)}`;

/* ------------------------------------------------------------------ */
/* יצירה                                                               */
/* ------------------------------------------------------------------ */

export function createTournament(names, format, tiebreak = 'penalties') {
  const players = names.map((name, i) => ({ id: `p${i + 1}`, name }));
  const seedOrder = shuffle(players.map((p) => p.id));
  const t = {
    format,
    tiebreak,
    players,
    seedOrder,
    matches: [],
    stage: null,
    ko: { rounds: [], drawn: [], pending: null },
    deciderId: null,
    championId: null,
    createdAt: Date.now(),
  };

  if (format === 'league') {
    const rr = roundRobin(seedOrder);
    t.stage = { type: 'league', groups: null, rounds: [], totalRounds: rr.length, swissByes: {} };
    rr.forEach((round, r) => {
      t.stage.rounds.push({ index: r, byes: round.bye ? [{ id: round.bye, group: null }] : [] });
      round.pairs.forEach(([a, b]) => addMatch(t, { a, b, phase: 'stage', round: r, group: null }));
    });
  } else if (format === 'groups') {
    const groups = splitIntoGroups(seedOrder, groupSizes(players.length));
    const perGroup = groups.map((g) => roundRobin(g));
    const total = Math.max(...perGroup.map((rr) => rr.length));
    t.stage = { type: 'groups', groups, rounds: [], totalRounds: total, swissByes: {} };
    for (let r = 0; r < total; r++) {
      const byes = [];
      perGroup.forEach((rr, g) => {
        const round = rr[r];
        if (!round) return;
        if (round.bye) byes.push({ id: round.bye, group: g });
        round.pairs.forEach(([a, b]) => addMatch(t, { a, b, phase: 'stage', round: r, group: g }));
      });
      t.stage.rounds.push({ index: r, byes });
    }
  } else if (format === 'swiss') {
    t.stage = { type: 'swiss', groups: null, rounds: [], totalRounds: swissRounds(players.length), swissByes: {} };
    createSwissRound(t);
  } else {
    startKnockout(t, seedOrder);
  }
  return t;
}

function addMatch(t, fields) {
  const m = { id: newId('m'), ga: null, gb: null, pa: null, pb: null, golden: null, group: null, ...fields };
  t.matches.push(m);
  return m;
}

/* ------------------------------------------------------------------ */
/* שאילתות                                                             */
/* ------------------------------------------------------------------ */

export const playerName = (t, id) => localName(t.players.find((p) => p.id === id)?.name ?? '');
export const stageMatches = (t) => t.matches.filter((m) => m.phase === 'stage');
export const matchById = (t, id) => t.matches.find((m) => m.id === id);
export const koStarted = (t) => t.ko.rounds.length > 0 || t.ko.pending !== null;

export function isStageActive(t) {
  if (!t.stage || t.championId) return false;
  if (koStarted(t)) return false;
  if (t.format === 'league' && t.deciderId) return false;
  return true;
}

export function currentSwissRound(t) {
  return t.stage.rounds.length - 1;
}

export function nextMatch(t) {
  return t.matches.find((m) => !isDone(m)) || null;
}

export function plannedGames(t) {
  const f = getFormats(t.players.length).find((x) => x.id === t.format);
  return (f ? f.games : 0) + (t.deciderId ? 1 : 0);
}

export function remainingGames(t) {
  const done = t.matches.filter(isDone).length;
  return Math.max(0, plannedGames(t) - done);
}

export function stageTable(t, ids = t.players.map((p) => p.id)) {
  return computeTable(ids, stageMatches(t), { byes: t.stage?.swissByes, seedOrder: t.seedOrder });
}

export function groupTables(t) {
  return t.stage.groups.map((ids) => computeTable(ids, stageMatches(t), { seedOrder: t.seedOrder }));
}

/** מי מסומן כעולה בטבלאות הבתים, לפי המצב הנוכחי */
export function groupQualifierIds(t) {
  const tables = groupTables(t);
  const g = tables.length;
  if (g === 3) {
    const ids = tables.map((tb) => tb[0].id);
    const ru = bestOf(tables.map((tb) => tb[1]).filter(Boolean), t);
    if (ru) ids.push(ru.id);
    return ids;
  }
  return tables.flatMap((tb) => tb.slice(0, 2).map((r) => r.id));
}

function bestOf(rows, t) {
  return rows.slice().sort((x, y) =>
    y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || t.seedOrder.indexOf(x.id) - t.seedOrder.indexOf(y.id)
  )[0];
}

/** מצב הליגה: מי אלוף אם נגמר עכשיו, והאם צריך משחק מכריע */
export function leagueOutcome(t) {
  const table = stageTable(t);
  const [first, second] = table;
  const needDecider = !!second && first.pts === second.pts && Math.abs(first.gd - second.gd) <= 1;
  return { table, first, second, needDecider };
}

export function matchLabel(t, m) {
  if (m.phase === 'decider') return tr('decider');
  if (m.phase === 'ko') {
    const i = t.ko.rounds.findIndex((r) => r.matchIds.includes(m.id));
    return i >= 0 ? koRoundLabel(t, i) : tr('knockout');
  }
  if (t.stage.type === 'groups') return tr('groupX', { g: groupLetter(m.group) });
  if (t.stage.type === 'swiss') return tr('swissRoundN', { n: m.round + 1 });
  return tr('leagueRoundN', { n: m.round + 1 });
}

/** שם שלב נוקאאוט – מחושב בכל רינדור, כדי שהחלפת שפה תשנה אותו */
export const koRoundLabel = (t, i) => stageName(t.ko.rounds[i].count, i);
export const pendingLabel = (t) => stageName(t.ko.pending.count, t.ko.rounds.length);
export const pendingNextLabel = (t) => stageName(Math.ceil(t.ko.pending.count / 2), t.ko.rounds.length + 1);

/** האם מותר להזין / לשנות תוצאה למשחק הזה */
export function canEdit(t, m) {
  if (t.championId) return false;
  if (m.phase === 'stage') {
    if (!isStageActive(t)) return false;
    if (t.stage.type === 'swiss') return m.round === currentSwissRound(t);
    return true;
  }
  if (m.phase === 'decider') return true;
  if (t.ko.pending) return false;
  const last = t.ko.rounds[t.ko.rounds.length - 1];
  return !!last && last.matchIds.includes(m.id);
}

/* ------------------------------------------------------------------ */
/* הזנת תוצאה                                                          */
/* ------------------------------------------------------------------ */

export const NEEDS_TIEBREAK = 'NEEDS_TIEBREAK';

/**
 * @param {{pa?: number, pb?: number, golden?: 'a'|'b'}} extra הכרעת תיקו בנוקאאוט
 * @returns {string|null} קוד שגיאה (ERR_… – מתורגם בממשק), NEEDS_TIEBREAK, או null אם נשמר
 */
export function setScore(t, matchId, ga, gb, extra = {}) {
  const m = matchById(t, matchId);
  if (!m || !canEdit(t, m)) return 'ERR_LOCKED';
  const valid = (x) => Number.isInteger(x) && x >= 0 && x <= 99;
  if (!valid(ga) || !valid(gb)) return 'ERR_SCORE';

  if (m.phase === 'stage' || ga !== gb) {
    Object.assign(m, { ga, gb, pa: null, pb: null, golden: null });
    advance(t);
    return null;
  }

  // תיקו בנוקאאוט / משחק מכריע
  if (t.tiebreak === 'golden') {
    if (extra.golden !== 'a' && extra.golden !== 'b') return NEEDS_TIEBREAK;
    Object.assign(m, {
      ga: ga + (extra.golden === 'a' ? 1 : 0),
      gb: gb + (extra.golden === 'b' ? 1 : 0),
      pa: null, pb: null, golden: extra.golden,
    });
    advance(t);
    return null;
  }

  const { pa, pb } = extra;
  if (pa == null || pb == null || Number.isNaN(pa) || Number.isNaN(pb)) return NEEDS_TIEBREAK;
  if (!valid(pa) || !valid(pb)) return 'ERR_PENS';
  if (pa === pb) return 'ERR_PENS_EQUAL';
  Object.assign(m, { ga, gb, pa, pb, golden: null });
  advance(t);
  return null;
}

export const tiebreakLabel = (t) => tr(t.tiebreak === 'golden' ? 'tieGolden' : 'tiePenalties');

/** בודק אם שלב הסתיים ומתקדם לשלב הבא */
export function advance(t) {
  if (t.championId) return;

  // משחק מכריע בליגה
  if (t.deciderId) {
    const d = matchById(t, t.deciderId);
    if (isDone(d)) t.championId = winnerOf(d);
    return;
  }

  if (isStageActive(t)) {
    const stage = stageMatches(t);
    if (!stage.every(isDone)) return;

    if (t.stage.type === 'swiss' && t.stage.rounds.length < t.stage.totalRounds) {
      createSwissRound(t);
      return;
    }
    if (t.stage.type === 'swiss') {
      const top = stageTable(t).slice(0, 4).map((r) => r.id);
      startKnockout(t, [top[0], top[3], top[1], top[2]]);
      return;
    }
    if (t.stage.type === 'groups') {
      startKnockout(t, groupEntrants(t));
      return;
    }
    if (t.stage.type === 'league') {
      const o = leagueOutcome(t);
      if (o.needDecider) {
        const d = addMatch(t, { a: o.first.id, b: o.second.id, phase: 'decider', round: 0 });
        t.deciderId = d.id;
      } else {
        t.championId = o.first.id;
      }
    }
    return;
  }

  // נוקאאוט
  const last = t.ko.rounds[t.ko.rounds.length - 1];
  if (!last || t.ko.pending) return;
  const ms = last.matchIds.map((id) => matchById(t, id));
  if (!ms.every(isDone)) return;
  const next = [...(last.bye ? [last.bye] : []), ...ms.map(winnerOf)];
  createKoRound(t, next);
}

/* ------------------------------------------------------------------ */
/* שוויצרית                                                            */
/* ------------------------------------------------------------------ */

function createSwissRound(t) {
  const r = t.stage.rounds.length;
  const ranked = r === 0 ? t.seedOrder.slice() : stageTable(t).map((row) => row.id);
  const { pairs, bye } = swissPairings(ranked, stageMatches(t), t.stage.swissByes);
  if (bye) t.stage.swissByes[bye] = (t.stage.swissByes[bye] || 0) + 1;
  t.stage.rounds.push({ index: r, byes: bye ? [{ id: bye, group: null }] : [] });
  pairs.forEach(([a, b]) => addMatch(t, { a, b, phase: 'stage', round: r, group: null }));
}

export function swissSubtitle(r) {
  if (r === 0) return tr('swissSub0');
  if (r === 1) return tr('swissSub1');
  return tr('swissSubN');
}

/* ------------------------------------------------------------------ */
/* בתים → נוקאאוט                                                      */
/* ------------------------------------------------------------------ */

function groupEntrants(t) {
  const tables = groupTables(t);
  const g = tables.length;

  if (g === 2) return [tables[0][0].id, tables[1][1].id, tables[1][0].id, tables[0][1].id];

  if (g === 3) {
    const winners = tables.map((tb, i) => ({ ...tb[0], group: i }));
    const ru = bestOf(tables.map((tb, i) => ({ ...tb[1], group: i })), t);
    const ordered = winners.slice().sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf);
    // המנצח הטוב ביותר שלא מאותו בית של המקום השני – פוגש אותו
    const vsRu = ordered.find((w) => w.group !== ru.group);
    const others = ordered.filter((w) => w !== vsRu);
    return [vsRu.id, ru.id, others[0].id, others[1].id];
  }

  const out = [];
  for (let i = 0; i + 1 < g; i += 2) {
    const A = tables[i];
    const B = tables[i + 1];
    out.push(A[0].id, B[1].id, B[0].id, A[1].id);
  }
  if (g % 2 === 1) out.push(tables[g - 1][0].id, tables[g - 1][1].id);
  return out;
}

export function groupAdvanceText(t) {
  const g = t.stage.groups.length;
  return tr('qualifyTo', { stage: stageName(groupQualifiers(g)) });
}

/* ------------------------------------------------------------------ */
/* נוקאאוט והגרלות                                                     */
/* ------------------------------------------------------------------ */

function startKnockout(t, entrants) {
  createKoRound(t, entrants);
}

function createKoRound(t, entrants) {
  if (entrants.length === 1) {
    t.championId = entrants[0];
    return;
  }
  const count = entrants.length;
  if (count % 2 === 1) {
    t.ko.pending = { entrants, pool: drawPool(entrants, t.ko.drawn), count };
    return;
  }
  pushKoRound(t, entrants, count, null, []);
}

function pushKoRound(t, entrants, count, bye, pool) {
  const playing = entrants.filter((id) => id !== bye);
  const matchIds = koPairs(playing).map(([a, b]) => addMatch(t, { a, b, phase: 'ko', round: t.ko.rounds.length }).id);
  t.ko.rounds.push({ count, bye, pool, matchIds });
}

/** סיום ההגרלה: הזוכה עולה ישר, השאר משחקים */
export function resolveDraw(t, winnerId) {
  const p = t.ko.pending;
  if (!p || !p.pool.includes(winnerId)) return;
  t.ko.drawn.push(winnerId);
  t.ko.pending = null;
  pushKoRound(t, p.entrants, p.count, winnerId, p.pool);
}

/** שלבים עתידיים בעץ (משבצות ריקות) */
export function futureKoRounds(t) {
  const out = [];
  let count;
  let idx = t.ko.rounds.length;
  if (t.ko.pending) {
    count = Math.ceil(t.ko.pending.count / 2);
    idx += 1;
  } else {
    const last = t.ko.rounds[t.ko.rounds.length - 1];
    if (!last) return out;
    count = Math.ceil(last.count / 2);
  }
  while (count > 1) {
    out.push({ label: stageName(count, idx), count, hasDraw: count % 2 === 1, matches: Math.floor(count / 2) });
    count = Math.ceil(count / 2);
    idx++;
  }
  return out;
}

