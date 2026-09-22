export function icon(name, size = 20) {
  const paths = {
    fish: '<path d="M5 12c5-8 12-8 16 0-4 8-11 8-16 0Z"/><path d="m5 12-4-5v10Z"/><circle cx="16.5" cy="10.5" r=".7" fill="currentColor" stroke="none"/>',
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    sliders: '<path d="M4 7h6m4 0h6M4 17h10m4 0h2"/><circle cx="12" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    sound: '<path d="m11 4-6 5H2v6h3l6 5V4Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    muted: '<path d="m11 4-6 5H2v6h3l6 5V4Z"/><path d="m16 9 6 6m-6 0 6-6"/>',
    expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    play: '<path d="m8 4 12 8-12 8V4Z"/>',
    skip: '<path d="m4 5 11 7-11 7V5Zm15 0v14"/>',
    anchor: '<circle cx="12" cy="5" r="2"/><path d="M12 7v14M8 10h8M3 13v2a9 9 0 0 0 18 0v-2M1 15l2-2 2 2m14 0 2-2 2 2"/>',
    reset: '<path d="M3 10a9 9 0 1 1 1 7M3 4v6h6"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3v.1"/>',
    ruler: '<path d="M3 7h18v10H3zM7 7v4m5-4v6m5-6v4"/>',
    copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.fish}</svg>`;
}
