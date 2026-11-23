// חישוב טבלאות ושוברי שוויון.
// ניצחון 3, תיקו 1, הפסד 0. שובר שוויון: נקודות → הפרש → שערי זכות → משחק ישיר → סדר ההגרלה.

export const POINTS = { win: 3, draw: 1, loss: 0 };

export const isDone = (m) => m.ga !== null && m.gb !== null;

export function winnerOf(m) {
  if (!isDone(m)) return null;
  if (m.ga === m.gb) {
    // תיקו שהוכרע בפנדלים
    if (m.pa != null && m.pb != null && m.pa !== m.pb) return m.pa > m.pb ? m.a : m.b;
    return null;
  }
  return m.ga > m.gb ? m.a : m.b;
}

/** התוצאה בלי גול הזהב (לעריכה) */
export function regularScore(m) {
  return {
    ga: m.ga === null ? null : m.ga - (m.golden === 'a' ? 1 : 0),
    gb: m.gb === null ? null : m.gb - (m.golden === 'b' ? 1 : 0),
  };
}

/** "5 : 4" – תוצאת הפנדלים, המנצח קודם */
export function penaltiesText(m) {
  return `${Math.max(m.pa, m.pb)} : ${Math.min(m.pa, m.pb)}`;
}

export function loserOf(m) {
  const w = winnerOf(m);
  return w === null ? null : w === m.a ? m.b : m.a;
}

/**
 * @param {string[]} ids השחקנים בטבלה
 * @param {object[]} matches המשחקים שנספרים
 * @param {{byes?: Record<string, number>, seedOrder?: string[]}} opts
 */
export function computeTable(ids, matches, opts = {}) {
  const byes = opts.byes || {};
  const seed = opts.seedOrder || ids;
  const rows = new Map(ids.map((id) => [id, { id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }]));

  for (const m of matches) {
    if (!isDone(m) || !rows.has(m.a) || !rows.has(m.b)) continue;
    const ra = rows.get(m.a);
    const rb = rows.get(m.b);
    ra.p++; rb.p++;
    ra.gf += m.ga; ra.ga += m.gb;
    rb.gf += m.gb; rb.ga += m.ga;
    if (m.ga > m.gb) { ra.w++; rb.l++; }
    else if (m.ga < m.gb) { rb.w++; ra.l++; }
    else { ra.d++; rb.d++; }
  }

  for (const r of rows.values()) {
    const b = byes[r.id] || 0;
    r.w += b; // מנוחה בשוויצרית נחשבת כניצחון
    r.gd = r.gf - r.ga;
    r.pts = r.w * POINTS.win + r.d * POINTS.draw;
  }

  const list = [...rows.values()];
  list.sort((x, y) =>
    y.pts - x.pts ||
    y.gd - x.gd ||
    y.gf - x.gf ||
    headToHead(x.id, y.id, matches) ||
    seed.indexOf(x.id) - seed.indexOf(y.id)
  );
  list.forEach((r, i) => { r.pos = i + 1; });
  return list;
}

// שלילי = x לפני y
function headToHead(x, y, matches) {
  let score = 0;
  for (const m of matches) {
    if (!isDone(m)) continue;
    const w = winnerOf(m);
    if ((m.a === x && m.b === y) || (m.a === y && m.b === x)) {
      if (w === x) score--;
      else if (w === y) score++;
    }
  }
  return score;
}

export const formatGd = (gd) => (gd > 0 ? `+${gd}` : String(gd));
