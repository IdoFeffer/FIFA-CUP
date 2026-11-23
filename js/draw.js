// הגרלות: ערבוב, בחירה רנדומלית ובחירת "עולה ישר" במספר אי־זוגי.

export function randomInt(max) {
  if (globalThis.crypto?.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickRandom(list) {
  return list[randomInt(list.length)];
}

/** חלוקה לבתים לפי גדלים נתונים, אחרי ערבוב */
export function splitIntoGroups(ids, sizes) {
  const mixed = shuffle(ids);
  const groups = [];
  let i = 0;
  for (const size of sizes) {
    groups.push(mixed.slice(i, i + size));
    i += size;
  }
  return groups;
}

/**
 * מי זכאי להגרלת "עולה ישר": מי שעוד לא עלה בהגרלה.
 * אם כולם כבר עלו פעם – כולם זכאים.
 */
export function drawPool(entrants, alreadyDrawn) {
  const pool = entrants.filter((id) => !alreadyDrawn.includes(id));
  return pool.length ? pool : entrants.slice();
}
