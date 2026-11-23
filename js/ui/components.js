// רכיבים משותפים שמחזירים HTML: לוגו, כותרת, בורר שפה, שורת משחק, כרטיס נוקאאוט, טבלה, תגים.
// כל טקסט מגיע מ־t() – אין כאן מחרוזות בעברית או באנגלית.

import { icon } from './icons.js';
import { t, getLang } from '../i18n.js';
import { playerName, canEdit, nextMatch } from '../engine.js';
import { isDone, winnerOf, formatGd, regularScore, penaltiesText } from '../standings.js';
import { formatLabel } from '../formats.js';

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** שם שחקן בתוך משפט: <bdi> מבודד כיוון, כך ששם בעברית לא "מתערבב" במשפט באנגלית ולהפך */
export const nm = (tour, id) => `<bdi>${esc(playerName(tour, id))}</bdi>`;

export const num = (n, cls = '') => `<span class="digits ${cls}" dir="ltr">${esc(n)}</span>`;
export const signed = (n, cls = '') => `<span class="digits ${cls}" dir="ltr">${esc(formatGd(n))}</span>`;

export function logo(size = 'sm') {
  return `<span class="logo logo--${size}" dir="ltr" lang="en">FIFA <span class="logo__accent">CUP</span></span>`;
}

/** בורר שפה: תמיד בפינה השמאלית העליונה, בשתי השפות */
export function langToggle() {
  const lang = getLang();
  return `
  <div class="lang-toggle" role="group" aria-label="${t('language')}">
    <button class="lang-toggle__btn" data-action="lang" data-lang="he" lang="he" aria-pressed="${lang === 'he'}" aria-label="עברית">עב</button>
    <button class="lang-toggle__btn" data-action="lang" data-lang="en" lang="en" aria-pressed="${lang === 'en'}" aria-label="English">EN</button>
  </div>`;
}

export function header(tour, ui) {
  const confirm = ui.confirmReset;
  return `
  <header class="topbar">
    ${logo('sm')}
    <div class="topbar__end">
      <span class="topbar__meta">${esc(formatLabel(tour))}</span>
      <button class="icon-btn ${confirm ? 'icon-btn--confirm' : ''}" data-action="reset" aria-label="${confirm ? t('confirmNew') : t('newTournament')}">
        ${confirm ? `<span class="icon-btn__text">${t('confirmShort')}</span>` : icon('restart')}
      </button>
    </div>
    ${langToggle()}
  </header>`;
}

export function tabs(tour, view, labels) {
  const koReady = tour.ko.rounds.length > 0;
  return `
  <nav class="tabs" aria-label="${t('stages')}">
    <button class="tabs__tab" data-action="view" data-view="stage" ${view === 'stage' ? 'aria-current="page"' : ''}>${labels[0]}</button>
    <button class="tabs__tab" data-action="view" data-view="ko" ${view === 'ko' ? 'aria-current="page"' : ''} ${koReady ? '' : 'disabled'}>${labels[1]}</button>
  </nav>`;
}

export const badgeWin = (size = 'md') =>
  `<span class="badge badge--win badge--${size}" role="img" aria-label="${t('won')}">${icon('check', { stroke: 3.4 })}</span>`;
export const badgeDraw = (size = 'md') =>
  `<span class="badge badge--draw badge--${size}" role="img" aria-label="${t('draw')}">${icon('equals', { stroke: 3.6 })}</span>`;
export const diceMark = () =>
  `<span class="dice-mark" role="img" aria-label="${t('luckyBadge')}">${icon('dice3', { stroke: 2.2 })}</span>`;

export function progress(done, total) {
  const complete = done === total;
  return `<span class="progress ${complete ? 'progress--done' : 'progress--open'} digits" dir="ltr">${done}/${total}</span>`;
}

/* ---------- תיבת תוצאה ---------- */

const tieOpen = (ui, m) => ui.tie && ui.tie.matchId === m.id;

function inputValue(m, side, ui) {
  if (tieOpen(ui, m)) return side === 'a' ? ui.tie.ga : ui.tie.gb;
  const reg = regularScore(m);
  return side === 'a' ? reg.ga : reg.gb;
}

function scoreCell(tour, m, side, size, ui) {
  const value = side === 'a' ? m.ga : m.gb;
  const name = playerName(tour, side === 'a' ? m.a : m.b);
  const cls = `score score--${size} score--${side === 'a' ? 'home' : 'away'}`;
  const editing = ui.editing === m.id || tieOpen(ui, m);
  if (isDone(m) && !editing) {
    if (canEdit(tour, m)) {
      return `<button class="${cls}" data-action="edit" data-match="${m.id}" aria-label="${esc(t('editScore', { name, value }))}">${value}</button>`;
    }
    return `<span class="${cls}">${value}</span>`;
  }
  if (!canEdit(tour, m)) return `<span class="${cls} score--empty">–</span>`;
  return `<input class="${cls} score--input" type="number" inputmode="numeric" min="0" max="99" step="1"
    data-match="${m.id}" data-side="${side}" value="${inputValue(m, side, ui) ?? ''}" aria-label="${esc(t('goalsOf', { name }))}">`;
}

function marks(m, id, size, ui) {
  if (!isDone(m) || ui.editing === m.id || tieOpen(ui, m)) return '';
  if (m.ga === m.gb && m.phase === 'stage') return badgeDraw(size);
  return winnerOf(m) === id ? badgeWin(size) : '';
}

/* ---------- הכרעת תיקו בנוקאאוט ---------- */

/** פאנל שנפתח כשמזינים תיקו במשחק נוקאאוט */
export function tiePanel(tour, m, ui) {
  if (!tieOpen(ui, m)) return '';
  const nameA = playerName(tour, m.a);
  const nameB = playerName(tour, m.b);
  if (tour.tiebreak === 'golden') {
    return `
    <div class="tie-panel">
      <span class="tie-panel__title">${icon('golden', { stroke: 2.2 })}${t('tieGoldenTitle')}</span>
      <button class="tie-panel__choice tie-panel__choice--home" data-action="golden" data-match="${m.id}" data-side="a"><bdi>${esc(nameA)}</bdi></button>
      <button class="tie-panel__choice tie-panel__choice--away" data-action="golden" data-match="${m.id}" data-side="b"><bdi>${esc(nameB)}</bdi></button>
    </div>`;
  }
  const pen = (side, name) => `<input class="score score--sm score--${side === 'a' ? 'home' : 'away'} score--input score--pen" type="number" inputmode="numeric" min="0" max="99" step="1"
    data-match="${m.id}" data-side="${side}" data-kind="pen" value="${(side === 'a' ? ui.tie.pa : ui.tie.pb) ?? ''}" aria-label="${esc(t('pensOf', { name }))}">`;
  return `
  <div class="tie-panel">
    <span class="tie-panel__title">${icon('net', { stroke: 2.2 })}${t('tiePensTitle')}</span>
    <div class="tie-panel__inputs">${pen('a', nameA)}<span class="match__sep digits" aria-hidden="true">:</span>${pen('b', nameB)}</div>
  </div>`;
}

/** פס קטן מתחת למשחק שהוכרע בפנדלים / בגול זהב */
export function tieNote(m, ui, { won = false } = {}) {
  if (!isDone(m) || ui.editing === m.id || tieOpen(ui, m)) return '';
  if (m.golden) {
    return `<div class="tie-note tie-note--golden">${icon('golden', { stroke: 2.2 })}<span>${t(won ? 'wonByGolden' : 'noteGolden')}</span></div>`;
  }
  if (m.pa != null && m.pb != null) {
    return `<div class="tie-note tie-note--pen">${icon('net', { stroke: 2.2 })}<span>${t(won ? 'wonByPens' : 'notePens')}</span><span class="digits" dir="ltr">${penaltiesText(m)}</span></div>`;
  }
  return '';
}

const errorLine = (ui, m) =>
  ui.error && ui.error.matchId === m.id ? `<p class="match__error" role="alert">${esc(t(ui.error.code))}</p>` : '';

/* ---------- שורת משחק (בתים / ליגה / שוויצרית / גמר) ---------- */

export function matchRow(tour, m, ui, opts = {}) {
  const size = opts.size || 'md';
  const badge = size === 'sm' ? 'sm' : 'md';
  const isNext = nextMatch(tour)?.id === m.id;
  const lostA = opts.dimLoser && isDone(m) && winnerOf(m) === m.b;
  const lostB = opts.dimLoser && isDone(m) && winnerOf(m) === m.a;
  return `
  <div class="match match--${size} ${isNext ? 'match--next' : ''} ${opts.highlightA ? 'match--hl-home' : ''} ${opts.highlightB ? 'match--hl-away' : ''}">
    <div class="match__side match__side--home ${lostA ? 'is-lost' : ''}">
      <span class="match__name"><span class="match__label">${esc(playerName(tour, m.a))}</span>${marks(m, m.a, badge, ui)}</span>
      ${scoreCell(tour, m, 'a', size, ui)}
    </div>
    <span class="match__sep digits" aria-hidden="true">:</span>
    <div class="match__side match__side--away ${lostB ? 'is-lost' : ''}">
      ${scoreCell(tour, m, 'b', size, ui)}
      <span class="match__name match__name--away">${marks(m, m.b, badge, ui)}<span class="match__label">${esc(playerName(tour, m.b))}</span></span>
    </div>
  </div>${opts.note === false ? '' : tieNote(m, ui)}${tiePanel(tour, m, ui)}${errorLine(ui, m)}`;
}

/* ---------- כרטיס נוקאאוט ---------- */

export function koCard(tour, m, label, ui, roundIndex = 0) {
  // קובייה רק למי שעלה בהגרלה בשלב קודם
  const drawnBefore = (id) => tour.ko.rounds.slice(0, roundIndex).some((r) => r.bye === id);
  const isNext = nextMatch(tour)?.id === m.id;
  const done = isDone(m);
  const row = (id, side) => {
    const won = done && winnerOf(m) === id && ui.editing !== m.id && !tieOpen(ui, m);
    const settled = done && ui.editing !== m.id && !tieOpen(ui, m);
    const lost = settled && winnerOf(m) !== null && winnerOf(m) !== id;
    return `
    <div class="ko-row ko-row--${side === 'a' ? 'home' : 'away'} ${lost ? 'is-lost' : ''}">
      <span class="ko-row__name"><span class="ko-row__label ${won ? 'is-won' : ''}">${esc(playerName(tour, id))}</span>${drawnBefore(id) ? diceMark() : ''}${won ? badgeWin('sm') : ''}</span>
      ${scoreCell(tour, m, side, 'sm', ui)}
    </div>`;
  };
  return `
  <div class="ko-card ${isNext ? 'ko-card--next' : ''}">
    <div class="ko-card__head">
      <span class="ko-card__label">${esc(label)}${isNext ? t('nextSuffix') : ''}</span>
      ${isNext ? '<span class="dot dot--next" aria-hidden="true"></span>' : ''}
    </div>
    ${row(m.a, 'a')}${row(m.b, 'b')}
    ${tieNote(m, ui)}${tiePanel(tour, m, ui)}
    ${errorLine(ui, m)}
  </div>`;
}

export function koPlaceholder(label, a = t('pending'), b = t('pending')) {
  return `
  <div class="ko-card ko-card--future" aria-label="${esc(t('notDecided', { label }))}">
    <div class="ko-card__head"><span class="ko-card__label">${esc(label)}</span></div>
    <div class="ko-row ko-row--home"><span class="ko-row__name"><span class="ko-row__label">${esc(a)}</span></span><span class="score score--sm score--empty">–</span></div>
    <div class="ko-row ko-row--away"><span class="ko-row__name"><span class="ko-row__label">${esc(b)}</span></span><span class="score score--sm score--empty">–</span></div>
  </div>`;
}

/* ---------- כרטיס "עלה בהגרלה" ---------- */

export function drawCard(tour, round, nextLabel) {
  return `
  <div class="luck-card">
    <div class="luck-card__main">
      <span class="luck-card__icon">${icon('dice')}</span>
      <span class="luck-card__text">
        <span class="luck-card__kicker">${t('drawnTitle')}</span>
        <span class="luck-card__name">${esc(playerName(tour, round.bye))}</span>
      </span>
      <span class="luck-card__dest">${esc(t('straightTo', { stage: nextLabel }))}</span>
    </div>
    ${round.pool.length > 1 ? `
    <div class="luck-card__pool">
      <span>${t('inDraw')}</span>
      ${round.pool.map((id) => `<span class="chip ${id === round.bye ? 'chip--luck' : ''}">${esc(playerName(tour, id))}</span>`).join('')}
    </div>` : ''}
  </div>`;
}

/* ---------- טבלה ---------- */

/**
 * @param {object[]} rows שורות מ־computeTable
 * @param {{mode: 'played'|'record', mark: (row) => boolean, title?: string, legend?: string, legendKind?: 'done'|'next'}} o
 */
export function standingsTable(tour, rows, o) {
  const col3 = o.mode === 'record' ? t('colRecord') : t('colPlayed');
  return `
  <div class="table-card">
    <div class="table-card__head">
      <h3 class="table-card__title">${esc(o.title || t('table'))}</h3>
      ${o.legend ? `<span class="legend"><span class="legend__swatch legend__swatch--${o.legendKind || 'done'}"></span>${esc(o.legend)}</span>` : ''}
    </div>
    <table class="standings">
      <thead><tr><th scope="col">#</th><th scope="col">${t('colPlayer')}</th><th scope="col">${col3}</th><th scope="col">${t('colGd')}</th><th scope="col">${t('colPts')}</th></tr></thead>
      <tbody>
        ${rows.map((r) => `
        <tr class="${o.mark(r) ? `is-${o.legendKind || 'done'}` : ''}">
          <td class="digits standings__pos">${r.pos}</td>
          <td class="standings__name">${esc(playerName(tour, r.id))}</td>
          <td class="digits">${o.mode === 'record' ? `<span dir="ltr">${r.w}-${r.d}-${r.l}</span>` : r.p}</td>
          <td>${signed(r.gd)}</td>
          <td class="digits standings__pts">${r.pts}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

export function trophyDim(text) {
  return `<div class="trophy-dim">${icon('trophy', { stroke: 1.6 })}<p>${esc(text)}</p></div>`;
}

export const connector = () =>
  '<svg class="connector" viewBox="0 0 358 28" preserveAspectRatio="none" aria-hidden="true"><path d="M179 0v28"/></svg>';
