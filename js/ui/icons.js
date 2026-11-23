// אייקונים כ־SVG inline (צבע לפי currentColor, גודל לפי CSS ב־em).
// אותם אייקונים שמורים גם כקבצים ב־assets/icons.

const svg = (body, { stroke = 2, fill = 'none', label = '' } = {}) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${body}</svg>`;

export const ICONS = {
  trophy: '<path d="M7.5 3h9v6a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 5H4.5v1.5a3 3 0 0 0 3 3"/><path d="M16.5 5h3v1.5a3 3 0 0 1-3 3"/><path d="M12 13.5v3.75"/><path d="M8.6 20.25h6.8"/><path d="M9.75 17.25h4.5v3h-4.5z"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  equals: '<path d="M5 9h14M5 15h14"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="16" cy="8" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="8" cy="16" r="1.2" fill="currentColor"/><circle cx="16" cy="16" r="1.2" fill="currentColor"/>',
  dice3: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="16" cy="16" r="1.2" fill="currentColor"/>',
  pause: '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  restart: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>',
  net: '<path d="M2.5 19V6h19v13"/><path d="M2.5 12.5h19M9 6v13M15 6v13" stroke-width="1.4" opacity="0.6"/>',
  golden: '<circle cx="12" cy="12" r="9"/><path d="M13 6.5l-4 6h4l-2 5"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>',
};

export const icon = (name, opts) => svg(ICONS[name], opts);

/** גביע מלא לזהב במסך האלוף */
export const trophyFilled = (label) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${label}">
    <path d="M7.5 3h9v6a4.5 4.5 0 0 1-9 0z" fill="currentColor"/><path d="M7.5 5H4.5v1.5a3 3 0 0 0 3 3"/><path d="M16.5 5h3v1.5a3 3 0 0 1-3 3"/><path d="M12 13.5v3.75"/><path d="M8.6 20.25h6.8"/><path d="M9.75 17.25h4.5v3h-4.5z" fill="currentColor"/><path d="M10 5v3" stroke="#FFF3C4" stroke-width="0.9"/></svg>`;
