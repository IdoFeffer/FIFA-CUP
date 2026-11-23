// מצב האפליקציה ושמירה ב־localStorage.

const KEY = 'fifa-cup:v1';

export const DEFAULT_NAMES = ['', '', '', ''];

function initial() {
  return {
    setup: { names: DEFAULT_NAMES.slice(), format: null, tiebreak: 'penalties' },
    tournament: null,
    view: 'stage', // 'stage' | 'ko' – איזה טאב פתוח כשיש שני שלבים
    lang: 'he', // 'he' | 'en'
  };
}

export const state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const base = initial();
      const merged = { ...base, ...parsed, setup: { ...base.setup, ...(parsed.setup || {}) } };
      // מיגרציה: מצב ישן בלי tiebreak מקבל פנדלים
      if (!merged.setup.tiebreak) merged.setup.tiebreak = 'penalties';
      if (merged.tournament && !merged.tournament.tiebreak) merged.tournament.tiebreak = 'penalties';
      return merged;
    }
  } catch (e) { /* מתחילים מחדש */ }
  return initial();
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) { /* אחסון לא זמין – ממשיכים בלי שמירה */ }
}

/** טורניר חדש: שומרים את שמות השחקנים, מוחקים את הטורניר */
export function resetTournament() {
  // שם ברירת מחדל חוזר לשדה ריק, כדי שיוצג בשפה הפעילה
  const typed = (p, i) => (p.name === `שחקן ${i + 1}` || p.name === `Player ${i + 1}` ? '' : p.name);
  const names = state.tournament ? state.tournament.players.map(typed) : state.setup.names;
  state.tournament = null;
  state.view = 'stage';
  state.setup = { names, format: state.setup.format, tiebreak: state.setup.tiebreak || 'penalties' };
  save();
}
