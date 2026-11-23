// מסך שלב: בתים / ליגה / שוויצרית.

import { icon } from './icons.js';
import { esc, nm, num, signed, header, tabs, matchRow, progress, standingsTable } from './components.js';
import { t } from '../i18n.js';
import {
  nextMatch, remainingGames, stageMatches, stageTable, groupTables, groupQualifierIds,
  leagueOutcome, matchLabel, swissSubtitle, groupAdvanceText, matchById,
} from '../engine.js';
import { isDone } from '../standings.js';
import { groupLetter, swissRounds } from '../formats.js';

const tabLabels = (type) =>
  ({ groups: [t('tabGroups'), t('tabKo')], swiss: [t('tabSwiss'), t('tabKo')] }[type]);

export function renderStage(tour, ui, view) {
  const type = tour.stage.type;
  return `
  <main class="screen screen--stage">
    ${header(tour, ui)}
    ${tabLabels(type) ? tabs(tour, view, tabLabels(type)) : ''}
    ${explainer(tour)}
    ${banner(tour)}
    <div class="stage-layout">
      <div class="stage-layout__tables">
        ${tablesSection(tour)}
      </div>
      <div class="stage-layout__matches">
        ${roundsSection(tour, ui)}
        ${type === 'league' ? deciderSection(tour, ui) : ''}
      </div>
    </div>
  </main>`;
}

/* ---------- רצועת הסבר ---------- */

function explainer(tour) {
  const n = tour.players.length;
  const odd = n % 2 === 1;
  let items;
  if (tour.stage.type === 'swiss') {
    items = [
      [swissRounds(n), t('expSwissRounds')],
      ['', t('expSwissSimilar')],
      [4, t('expSwissTop4')],
    ];
  } else if (tour.stage.type === 'league') {
    items = [
      [(n * (n - 1)) / 2, t('expLeagueGames')],
      ...(odd ? [[1, t('expLeagueRest')]] : []),
    ];
  } else {
    return '';
  }
  return `
  <ul class="explainer" aria-label="${t('howItWorks')}">
    ${items.map(([big, text]) => `<li class="explainer__item">${big ? `${num(big, 'strong')} ` : ''}${esc(text)}</li>`).join('')}
  </ul>`;
}

/* ---------- באנר המשחק הבא ---------- */

function positionOf(tour, id) {
  if (tour.stage.type === 'groups') {
    const g = tour.stage.groups.findIndex((ids) => ids.includes(id));
    const row = groupTables(tour)[g].find((r) => r.id === id);
    return t('posGroup', { pos: row.pos, g: groupLetter(g) });
  }
  const row = stageTable(tour).find((r) => r.id === id);
  return t('posPts', { pos: row.pos, pts: row.pts });
}

function restingNow(tour, m) {
  if (!m || m.phase !== 'stage') return [];
  const round = tour.stage.rounds[m.round];
  return round ? round.byes : [];
}

function banner(tour) {
  const m = nextMatch(tour);
  if (!m) return '';
  const isStage = m.phase === 'stage';
  let context = matchLabel(tour, m);
  if (isStage && tour.stage.type === 'groups') context = t('roundWithin', { label: context, n: m.round + 1 });
  if (isStage && tour.stage.type === 'league') context = t('roundOf', { word: t('roundWordLeague'), n: m.round + 1, total: tour.stage.totalRounds });
  if (isStage && tour.stage.type === 'swiss') context = t('roundOf', { word: t('roundWordSwiss'), n: m.round + 1, total: tour.stage.totalRounds });

  const resting = restingNow(tour, m)
    .filter((b) => tour.stage.type !== 'groups' || b.group === m.group)
    .map((b) => nm(tour, b.id));

  return `
  <section class="banner" aria-label="${t('nextMatch')}">
    <div class="banner__top">
      <span class="banner__kicker"><span class="dot dot--next" aria-hidden="true"></span>${t('nextMatch')}</span>
      <span class="banner__context">${esc(context)}</span>
    </div>
    <div class="banner__vs">
      <div class="banner__player banner__player--home">
        <span class="banner__name">${nm(tour, m.a)}</span>
        ${isStage ? `<span class="banner__sub">${esc(positionOf(tour, m.a))}</span>` : ''}
      </div>
      <span class="banner__versus digits">${t('versus')}</span>
      <div class="banner__player banner__player--away">
        <span class="banner__name">${nm(tour, m.b)}</span>
        ${isStage ? `<span class="banner__sub">${esc(positionOf(tour, m.b))}</span>` : ''}
      </div>
    </div>
    <div class="banner__bottom ${resting.length ? '' : 'banner__bottom--center'}">
      ${resting.length ? `<span class="banner__rest">${icon('pause', { stroke: 2.2 })}<span>${t('restingNow', { names: resting.join(', ') })}</span></span>` : ''}
      <span>${t('gamesLeft', { n: num(remainingGames(tour), 'strong') })}</span>
    </div>
  </section>`;
}

/* ---------- טבלאות ---------- */

function tablesSection(tour) {
  const type = tour.stage.type;
  let html = '';
  if (type === 'groups') {
    const q = groupQualifierIds(tour);
    const legend = groupAdvanceText(tour);
    html = groupTables(tour).map((rows, g) =>
      standingsTable(tour, rows, { mode: 'played', title: t('groupX', { g: groupLetter(g) }), legend, mark: (r) => q.includes(r.id) })
    ).join('');
  } else if (type === 'swiss') {
    const r = tour.stage.rounds.length;
    const done = stageMatches(tour).filter((m) => m.round === r - 1).every(isDone);
    html = standingsTable(tour, stageTable(tour), {
      mode: 'record',
      title: t(done ? 'swissTableAfter' : 'swissTableDuring', { n: r }),
      legend: t('qualifyTo', { stage: t('semi') }),
      mark: (row) => row.pos <= 4,
    });
  } else {
    html = standingsTable(tour, stageTable(tour), { mode: 'played', title: t('leagueTable'), legend: t('leader'), legendKind: 'next', mark: (row) => row.pos === 1 });
    html += leagueStatus(tour);
  }
  return `
  <section class="section" aria-labelledby="tables-title">
    <h2 class="section__title" id="tables-title">${type === 'groups' ? t('tables') : t('table')}</h2>
    ${html}
  </section>`;
}

function leagueStatus(tour) {
  if (!stageMatches(tour).some(isDone)) return '';
  const o = leagueOutcome(tour);
  const allDone = stageMatches(tour).every(isDone);
  const p = {
    lead: t(allDone ? 'leagueOver' : 'ifEndsNow'),
    a: nm(tour, o.first.id),
    b: o.second ? nm(tour, o.second.id) : '',
    gda: signed(o.first.gd),
    gdb: o.second ? signed(o.second.gd) : '',
  };
  let text;
  if (o.needDecider) text = t('statusDecider', p);
  else if (o.second && o.first.pts === o.second.pts) text = t('statusChampTie', p);
  else text = t('statusChamp', p);
  return `<div class="status-line">${icon('trophy', { stroke: 2 })}<span>${text}</span></div>`;
}

/* ---------- מחזורים ---------- */

function roundsSection(tour, ui) {
  const type = tour.stage.type;
  const ms = stageMatches(tour);
  return `
  <section class="section" aria-labelledby="matches-title">
    <h2 class="section__title" id="matches-title">${t('matches')}</h2>
    ${tour.stage.rounds.map((round) => {
      const list = ms.filter((m) => m.round === round.index);
      const done = list.filter(isDone).length;
      const title = type === 'swiss' ? t('swissRoundN', { n: round.index + 1 }) : t('leagueRoundN', { n: round.index + 1 });
      const sub = type === 'swiss' ? swissSubtitle(round.index) : '';
      return `
      <div class="round">
        <div class="round__head">
          <h3 class="round__title">${esc(title)}${sub ? `<span class="round__sub">${esc(sub)}</span>` : ''}</h3>
          ${progress(done, list.length)}
        </div>
        ${list.map((m) => `
        <div class="round__item">
          ${type === 'groups' ? `<span class="round__group">${groupLetter(m.group)}</span>` : ''}
          <div class="round__match">${matchRow(tour, m, ui)}</div>
        </div>`).join('')}
        ${round.byes.map((b) => `
        <div class="rest-row">${icon('pause', { stroke: 2.2 })}<span>${t('restRow', { group: b.group !== null ? groupLetter(b.group) : '', name: nm(tour, b.id), swiss: type === 'swiss' })}</span></div>`).join('')}
      </div>`;
    }).join('')}
  </section>`;
}

/* ---------- משחק מכריע (ליגה) ---------- */

function deciderSection(tour, ui) {
  const d = tour.deciderId ? matchById(tour, tour.deciderId) : null;
  return `
  <section class="section decider" aria-labelledby="decider-title">
    <h2 class="section__title" id="decider-title">${t('decider')}</h2>
    ${d ? matchRow(tour, d, ui) : `
    <div class="match match--md match--future" aria-label="${esc(t('notDecided', { label: t('decider') }))}">
      <div class="match__side match__side--home"><span class="match__name"><span class="match__label">${t('place1')}</span></span><span class="score score--md score--empty">–</span></div>
      <span class="match__sep digits" aria-hidden="true">:</span>
      <div class="match__side match__side--away"><span class="score score--md score--empty">–</span><span class="match__name match__name--away"><span class="match__label">${t('place2')}</span></span></div>
    </div>`}
    <p class="decider__rule">${t('deciderRule')}</p>
  </section>`;
}
