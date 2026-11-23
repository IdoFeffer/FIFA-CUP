// מסך ההגרלה: מי עולה ישר כשיש מספר אי־זוגי בשלב נוקאאוט.

import { icon } from './icons.js';
import { esc, nm, header, num } from './components.js';
import { t } from '../i18n.js';
import { playerName, pendingLabel, pendingNextLabel } from '../engine.js';

export function renderDraw(tour, ui) {
  const p = tour.ko.pending;
  const winner = ui.drawWinner;
  const done = !!winner;
  const games = Math.floor((p.count - 1) / 2);
  const label = pendingLabel(tour);
  const next = pendingNextLabel(tour);

  return `
  <main class="screen screen--draw">
    ${header(tour, ui)}
    <section class="draw-hero">
      <span class="draw-hero__icon">${icon('dice')}</span>
      <h1 class="draw-hero__title">${esc(t('drawTitle', { label }))}</h1>
      <p class="draw-hero__text">${t('drawText', { count: num(p.count), next: esc(next), games: num(games) })}</p>
    </section>

    <ul class="draw-list ${done ? 'is-done' : ''}" aria-label="${t('drawList')}" aria-live="polite">
      ${p.pool.map((id) => {
        const on = winner === id;
        return `
        <li class="draw-row ${on ? 'is-on' : ''}" data-id="${id}">
          <span class="draw-row__name">${esc(playerName(tour, id))}</span>
          ${on ? `<span class="draw-row__tag">${t('goesStraight')}${icon('dice3')}</span>` : ''}
        </li>`;
      }).join('')}
    </ul>

    ${done ? `<p class="draw-result">${t('drawResult', { name: nm(tour, winner), next: esc(next), games: num(games), label: esc(label) })}</p>` : ''}

    <div class="draw-actions">
      ${done
        ? `<button class="btn btn--primary btn--xl" data-action="draw-continue">${esc(t('continueTo', { label }))}</button>
           <button class="btn btn--secondary" data-action="draw-again">${t('drawAgain')}</button>`
        : `<button class="btn btn--luck btn--xl" data-action="draw-spin">${t('drawSpin')}</button>`}
      <p class="draw-actions__note">${t('drawNote')}</p>
    </div>
  </main>`;
}
