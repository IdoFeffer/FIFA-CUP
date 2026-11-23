// מסך האלוף.

import { icon, trophyFilled } from './icons.js';
import { esc, logo, matchRow, signed, tieNote, langToggle } from './components.js';
import { t } from '../i18n.js';
import { playerName, matchLabel, stageTable } from '../engine.js';
import { playerStats, biggestWin, craziestMatch, finalMatch } from '../stats.js';

export function renderChampion(tour, ui) {
  const id = tour.championId;
  const s = playerStats(tour, id);
  const final = finalMatch(tour);
  const big = biggestWin(tour);
  const crazy = craziestMatch(tour);
  const frozen = { ...ui, error: null, editing: null, tie: null };

  let finalBlock = '';
  if (final) {
    finalBlock = `
    <section class="section" aria-label="${t('finalScore')}">
      <h2 class="section__title section__title--soft">${esc(matchLabel(tour, final))}</h2>
      ${matchRow(tour, final, frozen, { size: 'lg', dimLoser: true, highlightA: final.a === id, highlightB: final.b === id, note: false })}
      ${tieNote(final, frozen, { won: true })}
    </section>`;
  } else if (tour.format === 'league') {
    const row = stageTable(tour)[0];
    finalBlock = `<p class="champion__note">${t('leagueFirst', { pts: `<span class="digits">${row.pts}</span>`, gd: signed(row.gd) })}</p>`;
  }

  const highlight = (title, m) => !m ? '' : `
    <section class="highlight" aria-label="${title}">
      <div class="highlight__head">
        <h2 class="highlight__title">${title}</h2>
        <span class="highlight__meta">${esc(matchLabel(tour, m))}</span>
      </div>
      ${matchRow(tour, m, frozen, { size: 'sm', dimLoser: true })}
    </section>`;

  return `
  <main class="screen screen--champion">
    <header class="topbar">${logo('sm')}${langToggle()}</header>

    <section class="champion">
      <div class="champion__halo">${trophyFilled(t('trophy'))}</div>
      <span class="champion__kicker">${t('championKicker')}</span>
      <h1 class="champion__name"><bdi>${esc(playerName(tour, id))}</bdi></h1>
    </section>

    ${finalBlock}

    <section class="stat-tiles" aria-label="${t('pathToCup')}">
      <div class="stat-tile"><span class="stat-tile__value digits" dir="ltr">${s.wins}</span><span class="stat-tile__label">${t('statWins')}</span></div>
      <div class="stat-tile"><span class="stat-tile__value digits" dir="ltr">${s.goals}</span><span class="stat-tile__label">${t('statGoals')}</span></div>
      <div class="stat-tile"><span class="stat-tile__value">${signed(s.gd)}</span><span class="stat-tile__label">${t('statGd')}</span></div>
    </section>

    ${highlight(t('biggestWin'), big)}
    ${highlight(t('craziest'), crazy)}

    <div class="champion__actions">
      <button class="btn btn--primary btn--xl" data-action="new">${t('newTournament')}</button>
      <button class="btn btn--secondary" data-action="share">${icon('share')}${t('share')}</button>
      <p class="toast" role="status" aria-live="polite">${ui.toast ? esc(t(ui.toast)) : ''}</p>
    </div>
  </main>`;
}
