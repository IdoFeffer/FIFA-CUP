// מסך נוקאאוט: עץ אנכי למובייל.

import { esc, nm, num, header, tabs, koCard, koPlaceholder, drawCard, progress, trophyDim, connector } from './components.js';
import { t } from '../i18n.js';
import { playerName, nextMatch, remainingGames, matchById, futureKoRounds, matchLabel, koRoundLabel } from '../engine.js';
import { isDone, winnerOf } from '../standings.js';
import { icon } from './icons.js';

const tabLabels = (format) =>
  ({ groups: [t('tabGroups'), t('tabKo')], swiss: [t('tabSwiss'), t('tabKo')] }[format]);

/** קיצור לשם משחק בתוך שלב: "רבע 1" / "QF 1" */
function shortLabel(count) {
  if (count === 8) return t('shortQuarter');
  if (count === 4 || count === 3) return t('shortSemi');
  if (count === 16) return t('shortR16');
  return t('shortMatch');
}

const cardLabel = (label, count, total, j) => (total === 1 ? label : `${shortLabel(count)} ${j + 1}`);

export function renderBracket(tour, ui, view) {
  const rounds = tour.ko.rounds;
  const future = futureKoRounds(tour);
  const sections = [];

  rounds.forEach((r, i) => {
    const label = koRoundLabel(tour, i);
    const ms = r.matchIds.map((id) => matchById(tour, id));
    const done = ms.filter(isDone).length;
    const nextLabel = rounds[i + 1] ? koRoundLabel(tour, i + 1) : future[0]?.label || t('final');
    sections.push(`
    <section class="ko-round" aria-label="${esc(label)}">
      <div class="round__head">
        <h2 class="section__title">${esc(label)}${r.count % 2 === 1 ? `<span class="round__sub">${t('nPlayers', { n: r.count })}</span>` : ''}</h2>
        ${progress(done, ms.length)}
      </div>
      ${r.bye ? drawCard(tour, r, nextLabel) : ''}
      <div class="ko-grid ${ms.length === 1 ? 'ko-grid--single' : ''}">
        ${ms.map((m, j) => koCard(tour, m, cardLabel(label, r.count, ms.length, j), ui, i)).join('')}
      </div>
    </section>`);
  });

  // השלב הבא: מי שכבר ידוע (עלה בהגרלה / ניצח) מופיע בשמו
  const lastIdx = rounds.length - 1;
  const last = rounds[lastIdx];
  const known = last && !tour.ko.pending ? [
    ...(last.bye ? [playerName(tour, last.bye)] : []),
    ...last.matchIds.map((id, j) => {
      const w = winnerOf(matchById(tour, id));
      return w ? playerName(tour, w) : t('winnerOf', { label: cardLabel(koRoundLabel(tour, lastIdx), last.count, last.matchIds.length, j) });
    }),
  ] : null;

  future.forEach((f, fi) => {
    const slots = fi === 0 && known && !f.hasDraw ? known : null;
    const cards = Array.from({ length: f.matches }, (_, j) =>
      koPlaceholder(cardLabel(f.label, f.count, f.matches, j), slots?.[j * 2], slots?.[j * 2 + 1])
    ).join('');
    sections.push(`
    <section class="ko-round ko-round--future" aria-label="${esc(f.label)}">
      <div class="round__head"><h2 class="section__title">${esc(f.label)}</h2></div>
      ${f.hasDraw ? `<div class="luck-card luck-card--future">${icon('dice')}<span>${t('futureDraw')}</span></div>` : ''}
      <div class="ko-grid ${f.matches === 1 ? 'ko-grid--single' : ''}">${cards}</div>
    </section>`);
  });

  return `
  <main class="screen screen--ko">
    ${header(tour, ui)}
    ${tabLabels(tour.format) ? tabs(tour, view, tabLabels(tour.format)) : ''}
    ${shortBanner(tour, ui)}
    <div class="bracket">
      ${sections.join(connector())}
      ${connector()}
      ${trophyDim(t('championDecided'))}
    </div>
  </main>`;
}

function shortBanner(tour, ui) {
  const m = nextMatch(tour);
  if (!m) return '';
  const waiting = ui.tie && ui.tie.matchId === m.id;
  const meta = waiting
    ? t('waitingFor', { what: t(tour.tiebreak === 'golden' ? 'tieGolden' : 'tiePenalties') })
    : t('left', { n: num(remainingGames(tour), 'strong') });
  return `
  <div class="banner-short" role="status">
    <span class="dot dot--next" aria-hidden="true"></span>
    <span class="banner-short__kicker">${t('nextMatchColon')}</span>
    <span class="banner-short__match"><span class="tone-home">${nm(tour, m.a)}</span> ${t('vs')} <span class="tone-away">${nm(tour, m.b)}</span></span>
    <span class="banner-short__meta">${esc(matchLabel(tour, m))} · ${meta}</span>
  </div>`;
}
