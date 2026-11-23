// מסך הגדרה: שחקנים, בחירת פורמט, תיקו בנוקאאוט, הגרלה.

import { icon } from './icons.js';
import { esc, logo, num, langToggle } from './components.js';
import { t } from '../i18n.js';
import { getFormats, MIN_PLAYERS } from '../formats.js';

const TIE_OPTIONS = [
  { id: 'penalties', key: 'tiePenalties', icon: 'net' },
  { id: 'golden', key: 'tieGolden', icon: 'golden' },
];

export function pickedFormat(setup) {
  const list = getFormats(setup.names.length);
  const found = list.find((f) => f.id === setup.format);
  return found || list.find((f) => f.recommended);
}

export function renderSetup(setup) {
  const n = setup.names.length;
  const formats = getFormats(n);
  const current = pickedFormat(setup);
  const tiebreak = setup.tiebreak === 'golden' ? 'golden' : 'penalties';

  return `
  <main class="screen screen--setup">
    <div class="topbar topbar--end">${langToggle()}</div>

    <header class="hero">
      <span class="hero__trophy">${icon('trophy', { stroke: 1.8 })}</span>
      <h1 class="hero__title">${logo('lg')}</h1>
    </header>

    <section class="section" aria-labelledby="players-title">
      <div class="section__head">
        <h2 class="section__title" id="players-title">${t('players')}</h2>
        <span class="section__meta">${t('playersMeta', { n: num(n, 'strong'), min: MIN_PLAYERS })}</span>
      </div>
      <div class="players">
        ${setup.names.map((name, i) => `
        <div class="player-field">
          <span class="player-field__num digits">${i + 1}</span>
          <label class="sr-only" for="player-${i}">${t('playerN', { n: i + 1 })}</label>
          <input class="player-field__input" id="player-${i}" data-index="${i}" value="${esc(name)}" placeholder="${esc(t('playerN', { n: i + 1 }))}" autocomplete="off" maxlength="20" dir="auto">
          ${n > MIN_PLAYERS ? `<button class="icon-btn icon-btn--ghost" data-action="remove-player" data-index="${i}" aria-label="${esc(t('removePlayer', { name: name || t('playerN', { n: i + 1 }) }))}">${icon('close', { stroke: 2.2 })}</button>` : ''}
        </div>`).join('')}
      </div>
      <button class="btn btn--dashed" data-action="add-player">${icon('plus', { stroke: 2.2 })}${t('addPlayer')}</button>
    </section>

    <section class="section" aria-labelledby="format-title">
      <div class="section__head">
        <h2 class="section__title" id="format-title">${t('format')}</h2>
      </div>
      <div class="formats" role="radiogroup" aria-labelledby="format-title">
        ${formats.map((f) => {
          const on = f.id === current.id;
          return `
          <button class="format ${on ? 'is-selected' : ''}" role="radio" aria-checked="${on}" data-action="pick-format" data-format="${f.id}">
            <span class="format__radio" aria-hidden="true"></span>
            <span class="format__body">
              <span class="format__title">${esc(f.title)}${f.recommended ? `<span class="tag tag--next">${t('recommended')}</span>` : ''}</span>
              <span class="format__desc">${esc(f.desc)}</span>
            </span>
            <span class="format__games"><span class="digits">${f.games}</span><span class="format__games-label">${t('games')}</span></span>
          </button>`;
        }).join('')}
      </div>
    </section>

    <section class="section" aria-labelledby="tie-title">
      <div class="section__head">
        <h2 class="section__title" id="tie-title">${t('tieTitle')}</h2>
        <span class="section__meta">${t('tieMeta')}</span>
      </div>
      <div class="tie-options" role="radiogroup" aria-labelledby="tie-title">
        ${TIE_OPTIONS.map((o) => {
          const on = o.id === tiebreak;
          return `
          <button class="tie-option ${on ? 'is-selected' : ''}" role="radio" aria-checked="${on}" data-action="pick-tiebreak" data-tiebreak="${o.id}">
            <span class="tie-option__icon">${icon(o.icon)}</span>
            <span class="tie-option__title">${t(o.key)}</span>
          </button>`;
        }).join('')}
      </div>
    </section>

    <section class="setup-footer">
      <div class="summary">
        <span>${num(n, 'strong')} ${t('summaryPlayers')}</span>
        <span class="summary__dot" aria-hidden="true">·</span>
        <span>${num(current.games, 'strong')} ${t('summaryGames')}</span>
        <span class="summary__dot" aria-hidden="true">·</span>
        <span>${t('summaryTie')} <strong>${t(tiebreak === 'golden' ? 'tieGolden' : 'tiePenalties')}</strong></span>
      </div>
      <button class="btn btn--primary btn--xl" data-action="start">${icon('dice')}${t('start')}</button>
    </section>
  </main>`;
}
