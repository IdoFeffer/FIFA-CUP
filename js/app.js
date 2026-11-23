// נקודת כניסה: ניווט בין מסכים, חיבור אירועים, אנימציית ההגרלה.

import { state, save, resetTournament } from './state.js';
import { createTournament, setScore, clearScore, resolveDraw, koStarted, playerName, matchById, NEEDS_TIEBREAK } from './engine.js';
import { regularScore, penaltiesText } from './standings.js';
import { randomInt } from './draw.js';
import { t as tr, setLang } from './i18n.js';
import { MIN_PLAYERS } from './formats.js';
import { finalMatch } from './stats.js';
import { renderSetup, pickedFormat } from './ui/setup.js';
import { renderStage } from './ui/stage.js';
import { renderBracket } from './ui/bracket.js';
import { renderDraw } from './ui/drawScreen.js';
import { renderChampion } from './ui/champion.js';

const root = document.getElementById('app');
const ui = { confirmReset: false, error: null, editing: null, tie: null, drawWinner: null, spinning: false, toast: '' };
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- ניתוב ---------- */

function currentScreen() {
  const t = state.tournament;
  if (!t) return 'setup';
  if (t.championId) return 'champion';
  if (t.ko.pending) return 'draw';
  if (!t.stage) return 'ko';
  return state.view === 'ko' && t.ko.rounds.length ? 'ko' : 'stage';
}

function render({ keepFocus = true } = {}) {
  const active = document.activeElement;
  const focusKey = keepFocus && active && active.dataset
    ? (active.dataset.match && active.dataset.side ? `[data-match="${active.dataset.match}"][data-side="${active.dataset.side}"]${active.dataset.kind ? '[data-kind="pen"]' : ':not([data-kind])'}`
      : active.id ? `#${active.id}` : null)
    : null;

  const screen = currentScreen();
  const t = state.tournament;
  const html = {
    setup: () => renderSetup(state.setup),
    stage: () => renderStage(t, ui, 'stage'),
    ko: () => renderBracket(t, ui, 'ko'),
    draw: () => renderDraw(t, ui),
    champion: () => renderChampion(t, ui),
  }[screen]();

  document.body.dataset.screen = screen;
  root.innerHTML = html;

  if (focusKey) {
    const el = root.querySelector(focusKey);
    if (el) el.focus({ preventScroll: true });
  }
}

/* ---------- הגדרה ---------- */

function startTournament() {
  const raw = state.setup.names.map((n, i) => n.trim() || tr('playerN', { n: i + 1 }));
  // שמות כפולים מקבלים מספר כדי שיהיה אפשר להבדיל
  const seen = {};
  const names = raw.map((n) => {
    seen[n] = (seen[n] || 0) + 1;
    return seen[n] > 1 ? `${n} ${seen[n]}` : n;
  });
  const format = pickedFormat(state.setup).id;
  state.setup.format = format;
  state.tournament = createTournament(names, format, state.setup.tiebreak || 'penalties');
  state.view = state.tournament.stage ? 'stage' : 'ko';
  save();
  render({ keepFocus: false });
  window.scrollTo(0, 0);
}

/* ---------- תוצאות ---------- */

const scoreInput = (matchId, side, kind = '') =>
  root.querySelector(`input[data-match="${matchId}"][data-side="${side}"]${kind ? `[data-kind="${kind}"]` : ':not([data-kind])'}`);

function submitScore(matchId, extra = {}) {
  const a = scoreInput(matchId, 'a');
  const b = scoreInput(matchId, 'b');
  if (!a || !b) return;
  if (a.value === '' || b.value === '') {
    if (clearScore(state.tournament, matchId)) afterClear(matchId, a.value, b.value);
    return;
  }
  const pa = scoreInput(matchId, 'a', 'pen');
  const pb = scoreInput(matchId, 'b', 'pen');
  const penA = pa && pa.value !== '' ? Number(pa.value) : null;
  const penB = pb && pb.value !== '' ? Number(pb.value) : null;

  const t = state.tournament;
  const hadKo = koStarted(t);
  const ga = Number(a.value);
  const gb = Number(b.value);
  const result = setScore(t, matchId, ga, gb, { pa: penA, pb: penB, ...extra });

  if (result === NEEDS_TIEBREAK) {
    // תיקו בנוקאאוט: פותחים את פאנל ההכרעה, שומרים את מה שכבר הוקלד
    ui.tie = { matchId, ga, gb, pa: penA, pb: penB };
    ui.error = null;
  } else if (result) {
    ui.error = { matchId, code: result };
    if (ui.tie && ui.tie.matchId === matchId) Object.assign(ui.tie, { ga, gb, pa: penA, pb: penB });
  } else {
    ui.error = null;
    ui.editing = null;
    ui.tie = null;
    if (!hadKo && koStarted(t)) state.view = 'ko';
  }
  save();
  // מחכים שהפוקוס יעבור לשדה הבא לפני הרינדור, כדי להחזיר אותו אליו
  setTimeout(() => {
    render();
    if (state.tournament?.championId) window.scrollTo(0, 0);
  }, 0);
}

/** אחרי מחיקת תוצאה: מעדכנים הכול, ומשאירים את מה שעדיין כתוב בתיבות */
function afterClear(matchId, valueA, valueB) {
  ui.error = null;
  ui.editing = null;
  ui.tie = null;
  save();
  setTimeout(() => {
    render();
    const a = scoreInput(matchId, 'a');
    const b = scoreInput(matchId, 'b');
    if (a) a.value = valueA;
    if (b) b.value = valueB;
    // מסמנים את התוכן, כדי שהקלדה תחליף אותו ולא תתווסף אליו
    if (document.activeElement?.matches('input[data-match]')) document.activeElement.select();
  }, 0);
}

/* ---------- הגרלה ---------- */

function spin() {
  const t = state.tournament;
  if (!t?.ko.pending || ui.spinning) return;
  const pool = t.ko.pending.pool;
  const target = randomInt(pool.length);
  ui.drawWinner = null;
  render({ keepFocus: false });

  if (reducedMotion() || pool.length === 1) {
    ui.drawWinner = pool[target];
    render({ keepFocus: false });
    return;
  }

  ui.spinning = true;
  const rows = [...root.querySelectorAll('.draw-row')];
  const button = root.querySelector('[data-action="draw-spin"]');
  if (button) { button.disabled = true; button.textContent = tr('drawSpinning'); button.classList.add('is-busy'); }

  const n = rows.length;
  const steps = 3 * n + target + 1;
  let i = 0;
  const tick = () => {
    rows.forEach((r) => r.classList.remove('is-on'));
    rows[i % n].classList.add('is-on');
    i++;
    if (i < steps) {
      setTimeout(tick, 55 + Math.pow(i / steps, 3) * 420);
    } else {
      ui.spinning = false;
      ui.drawWinner = pool[(steps - 1) % n];
      render({ keepFocus: false });
    }
  };
  tick();
}

/* ---------- שיתוף ---------- */

async function share() {
  const t = state.tournament;
  const champ = playerName(t, t.championId);
  const f = finalMatch(t);
  const lines = [`🏆 ${tr('shareChamp', { name: champ })}`];
  if (f) {
    let line = `${playerName(t, f.a)} ${f.ga} : ${f.gb} ${playerName(t, f.b)}`;
    if (f.golden) line += tr('shareGolden');
    else if (f.pa != null && f.pb != null) line += tr('sharePens', { score: penaltiesText(f).replace(/ /g, '') });
    lines.push(line);
  }
  const text = lines.join('\n');
  try {
    if (navigator.share) {
      await navigator.share({ title: 'FIFA CUP', text });
      return;
    }
    await navigator.clipboard.writeText(text);
    ui.toast = 'copied';
  } catch (e) {
    if (e && e.name === 'AbortError') return;
    ui.toast = 'shareFailed';
  }
  render({ keepFocus: false });
  setTimeout(() => { ui.toast = ''; render({ keepFocus: false }); }, 2500);
}

/* ---------- אירועים ---------- */

let resetTimer = null;

root.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const action = el.dataset.action;

  switch (action) {
    case 'add-player':
      state.setup.names.push('');
      save();
      render({ keepFocus: false });
      root.querySelector(`#player-${state.setup.names.length - 1}`)?.focus();
      break;
    case 'remove-player':
      if (state.setup.names.length > MIN_PLAYERS) {
        state.setup.names.splice(Number(el.dataset.index), 1);
        save();
        render({ keepFocus: false });
      }
      break;
    case 'lang':
      state.lang = el.dataset.lang;
      setLang(state.lang);
      save();
      render({ keepFocus: false });
      root.querySelector(`[data-action="lang"][data-lang="${state.lang}"]`)?.focus();
      break;
    case 'pick-tiebreak':
      state.setup.tiebreak = el.dataset.tiebreak;
      save();
      render();
      break;
    case 'golden':
      submitScore(el.dataset.match, { golden: el.dataset.side });
      break;
    case 'pick-format':
      state.setup.format = el.dataset.format;
      save();
      render();
      break;
    case 'start':
      startTournament();
      break;
    case 'view':
      state.view = el.dataset.view;
      ui.error = null;
      ui.tie = null;
      save();
      render({ keepFocus: false });
      break;
    case 'edit': {
      const m = matchById(state.tournament, el.dataset.match);
      ui.editing = el.dataset.match;
      ui.error = null;
      ui.tie = null;
      // משחק שהוכרע בפנדלים / גול זהב: פותחים עם התוצאה הרגילה ופאנל ההכרעה
      if (m && (m.golden || (m.pa != null && m.pb != null))) {
        const reg = regularScore(m);
        ui.tie = { matchId: m.id, ga: reg.ga, gb: reg.gb, pa: m.pa, pb: m.pb };
      }
      render({ keepFocus: false });
      scoreInput(el.dataset.match, 'a')?.focus();
      break;
    }
    case 'reset':
      if (ui.confirmReset) {
        clearTimeout(resetTimer);
        ui.confirmReset = false;
        ui.tie = null;
        ui.editing = null;
        resetTournament();
        render({ keepFocus: false });
        window.scrollTo(0, 0);
      } else {
        ui.confirmReset = true;
        render();
        resetTimer = setTimeout(() => { ui.confirmReset = false; render(); }, 3000);
      }
      break;
    case 'new':
      ui.tie = null;
      ui.editing = null;
      resetTournament();
      render({ keepFocus: false });
      window.scrollTo(0, 0);
      break;
    case 'share':
      share();
      break;
    case 'draw-spin':
      spin();
      break;
    case 'draw-again':
      ui.drawWinner = null;
      spin();
      break;
    case 'draw-continue':
      resolveDraw(state.tournament, ui.drawWinner);
      ui.drawWinner = null;
      state.view = 'ko';
      save();
      render({ keepFocus: false });
      window.scrollTo(0, 0);
      break;
    default:
      break;
  }
});

root.addEventListener('input', (e) => {
  const el = e.target;
  if (el.matches('.player-field__input')) {
    state.setup.names[Number(el.dataset.index)] = el.value;
    save();
  }
});

root.addEventListener('change', (e) => {
  const el = e.target;
  if (el.matches('input[data-match]')) submitScore(el.dataset.match);
});

root.addEventListener('keydown', (e) => {
  const el = e.target;
  if (e.key !== 'Enter') return;
  if (el.matches('input[data-match]')) {
    // Enter בשדה הראשון עובר לשני, בשני שומר
    const other = scoreInput(el.dataset.match, 'b', el.dataset.kind || '');
    if (el.dataset.side === 'a' && other) other.focus();
    else el.blur();
  } else if (el.matches('.player-field__input')) {
    const next = root.querySelector(`#player-${Number(el.dataset.index) + 1}`);
    if (next) next.focus();
    else root.querySelector('[data-action="add-player"]')?.click();
  }
});

setLang(state.lang);
render({ keepFocus: false });
