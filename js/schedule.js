// יצירת לוח משחקים: ליגה / בתים (שיטת המעגל), שוויצרית וזיווג נוקאאוט.

/**
 * שיטת המעגל: כל זוג נפגש פעם אחת.
 * במספר אי־זוגי נוסף שחקן "דמה" – מי שמשובץ מולו נח באותו מחזור.
 * @returns {{pairs: [string, string][], bye: string|null}[]}
 */
export function roundRobin(ids) {
  const list = ids.slice();
  if (list.length % 2 === 1) list.push(null);
  const n = list.length;
  const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    let bye = null;
    for (let i = 0; i < n / 2; i++) {
      let a = list[i];
      let b = list[n - 1 - i];
      if (a === null || b === null) {
        bye = a === null ? b : a;
        continue;
      }
      // מחליפים צדדים לסירוגין כדי שכל אחד ישחק גם בכחול וגם בכתום
      if ((r + i) % 2 === 1) [a, b] = [b, a];
      pairs.push([a, b]);
    }
    rounds.push({ pairs, bye });
    // סיבוב: הראשון קבוע, כל השאר זזים מקום אחד
    list.splice(1, 0, list.pop());
  }
  return rounds;
}

/** האם שני שחקנים כבר נפגשו */
export function havePlayed(matches, a, b) {
  return matches.some((m) => (m.a === a && m.b === b) || (m.a === b && m.b === a));
}

/**
 * זיווג סבב שוויצרי.
 * @param {string[]} ranked שחקנים לפי הטבלה (ראשון = מוביל)
 * @param {object[]} matches כל המשחקים עד עכשיו (לבדיקת משחק חוזר)
 * @param {Record<string, number>} byes כמה פעמים כל שחקן נח
 */
export function swissPairings(ranked, matches, byes) {
  let pool = ranked.slice();
  let bye = null;
  if (pool.length % 2 === 1) {
    // הנמוך בטבלה שעוד לא נח, נח
    for (let i = pool.length - 1; i >= 0; i--) {
      if (!byes[pool[i]]) { bye = pool[i]; break; }
    }
    if (bye === null) bye = pool[pool.length - 1];
    pool = pool.filter((id) => id !== bye);
  }

  const result = pairUp(pool, matches);
  return { pairs: result || greedy(pool), bye };
}

// זיווג עם backtracking: צמודים בטבלה, בלי משחק חוזר
function pairUp(pool, matches) {
  if (pool.length === 0) return [];
  const [first, ...rest] = pool;
  for (let i = 0; i < rest.length; i++) {
    if (havePlayed(matches, first, rest[i])) continue;
    const remaining = rest.filter((_, j) => j !== i);
    const sub = pairUp(remaining, matches);
    if (sub) return [[first, rest[i]], ...sub];
  }
  return null;
}

function greedy(pool) {
  const pairs = [];
  for (let i = 0; i + 1 < pool.length; i += 2) pairs.push([pool[i], pool[i + 1]]);
  return pairs;
}

/** זיווג סיבוב נוקאאוט: צמודים ברשימה (0–1, 2–3, ...) */
export function koPairs(entrants) {
  const pairs = [];
  for (let i = 0; i + 1 < entrants.length; i += 2) pairs.push([entrants[i], entrants[i + 1]]);
  return pairs;
}
