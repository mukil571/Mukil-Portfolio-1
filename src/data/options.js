import {
  Sparkles,
  BarChart3,
  ListChecks,
  Code2,
  Globe,
  Database,
  Rocket,
  Cpu,
  Smartphone,
  Bot,
  LayoutDashboard,
  Gamepad2,
} from 'lucide-react';

/** Icons a project can use. Keys are what content.json stores (kept in sync with schema.js). */
export const ICONS = {
  sparkles: Sparkles,
  chart: BarChart3,
  list: ListChecks,
  code: Code2,
  globe: Globe,
  database: Database,
  rocket: Rocket,
  cpu: Cpu,
  smartphone: Smartphone,
  bot: Bot,
  layout: LayoutDashboard,
  gamepad: Gamepad2,
};

/** Colours a skill category can use. Keys are what content.json stores. */
export const COLORS = {
  cyan: '#00F0FF',
  blue: '#38BDF8',
  violet: '#A78BFA',
  green: '#34D399',
  pink: '#F472B6',
  amber: '#FBBF24',
};

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
