// מסך פתיחה כשיש טורניר שמור: להמשיך או להתחיל חדש.

import { icon } from './icons.js';
import { esc, logo, langToggle } from './components.js';
import { t } from '../i18n.js';
import { playerName, remainingGames } from '../engine.js';
import { formatLabel } from '../formats.js';

export function renderResume(tour, ui) {
  const over = !!tour.championId;
  const status = over
    ? t('resumeChampion', { name: `<bdi>${esc(playerName(tour, tour.championId))}</bdi>` })
    : t('gamesLeft', { n: remainingGames(tour) });

  return `
  <main class="screen screen--resume">
    <div class="topbar topbar--end">${langToggle()}</div>

    <header class="hero">
      <span class="hero__trophy">${icon('trophy', { stroke: 1.8 })}</span>
      <h1 class="hero__title">${logo('lg')}</h1>
    </header>

    <section class="resume" aria-labelledby="resume-title">
      <h2 class="section__title" id="resume-title">${t('resumeTitle')}</h2>
      <p class="resume__meta">${esc(formatLabel(tour))}<br>${status}</p>
      <button class="btn btn--primary btn--xl" data-action="resume">${t(over ? 'resumeResults' : 'resumeContinue')}</button>
      <button class="btn btn--secondary" id="resume-new" data-action="reset">${t(ui.confirmReset ? 'confirmNew' : 'newTournament')}</button>
      <p class="resume__meta">${t('resumeNote')}</p>
    </section>
  </main>`;
}
