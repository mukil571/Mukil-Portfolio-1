import content from './content.json';
import { ICONS, COLORS, hexToRgb } from './options.js';

/**
 * Everything the site displays comes from content.json.
 * Edit it with `npm run edit` (opens the editor at /admin) instead of by hand.
 */
export const profile = content;

export const projects = (content.projects || []).map((p) => ({
  ...p,
  icon: ICONS[p.icon] || ICONS.code,
  tags: p.tags || [],
  highlights: p.highlights || [],
}));

export const skillGroups = (content.skills || [])
  .filter((g) => g.items?.length)
  .map((g) => {
    const color = COLORS[g.color] || COLORS.cyan;
    return { label: g.category, color, rgb: hexToRgb(color), skills: g.items };
  });

export const education = content.education || [];

// the particle name, constellation and other effects are built once on load,
// so a saved edit reloads the page rather than hot-swapping pieces of it
if (import.meta.hot) {
  import.meta.hot.accept(() => window.location.reload());
}
