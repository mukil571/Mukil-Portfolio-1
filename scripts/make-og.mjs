// Generates public/og-image.svg and public/og-image.png (1200×630 social share preview)
// from src/data/content.json. Run with `npm run og`; the /admin editor also calls it on save.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const W = 1200;
const H = 630;
const PUBLIC_DIR = new URL('../public/', import.meta.url);
const CONTENT_FILE = new URL('../src/data/content.json', import.meta.url);

const escapeXml = (s) =>
  String(s ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);

function buildSvg(content) {
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const stars = Array.from({ length: 260 }, () => {
    const big = rand() < 0.08;
    const r = big ? 1.8 + rand() * 1.2 : 0.5 + rand() * 1.1;
    const pick = rand();
    const color = pick < 0.25 ? '#00F0FF' : pick < 0.35 ? '#A78BFA' : '#FFFFFF';
    return `<circle cx="${(rand() * W).toFixed(1)}" cy="${(rand() * H).toFixed(1)}" r="${r.toFixed(2)}" fill="${color}" opacity="${(0.3 + rand() * 0.7).toFixed(2)}"/>`;
  }).join('');

  const name = escapeXml((content.name || '').toUpperCase());
  const role = escapeXml((content.role || '').toUpperCase());
  const subtitle = escapeXml((content.subtitle || '').toUpperCase());
  // shrink the name for long names so it stays inside the card
  const nameSize = Math.min(150, Math.floor(1050 / Math.max(1, (content.name || '').length * 0.68)));
  const sans = "Inter, 'Segoe UI', Arial, sans-serif";
  const mono = "'JetBrains Mono', Consolas, 'Courier New', monospace";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="n1" cx="28%" cy="32%" r="45%">
      <stop offset="0" stop-color="#00F0FF" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#00F0FF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="n2" cx="80%" cy="72%" r="50%">
      <stop offset="0" stop-color="#7C3AED" stop-opacity="0.3"/>
      <stop offset="1" stop-color="#7C3AED" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur" x="-20%" y="-60%" width="140%" height="220%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="#050505"/>
  <rect width="${W}" height="${H}" fill="url(#n1)"/>
  <rect width="${W}" height="${H}" fill="url(#n2)"/>
  ${stars}
  <text x="600" y="318" text-anchor="middle" font-family="${sans}" font-weight="800" font-size="${nameSize}" fill="#00F0FF" opacity="0.65" filter="url(#blur)">${name}</text>
  <text x="600" y="318" text-anchor="middle" font-family="${sans}" font-weight="800" font-size="${nameSize}" fill="#FFFFFF">${name}</text>
  <text x="600" y="392" text-anchor="middle" font-family="${mono}" font-weight="600" font-size="30" letter-spacing="12" fill="#00F0FF">${role}</text>
  ${subtitle ? `<line x1="480" x2="720" y1="436" y2="436" stroke="#00F0FF" stroke-opacity="0.35"/>
  <text x="600" y="480" text-anchor="middle" font-family="${mono}" font-size="20" letter-spacing="6" fill="#94A3B8">${subtitle}</text>` : ''}
</svg>
`;
}

export async function generateOg(content) {
  const { default: sharp } = await import('sharp');
  const svg = buildSvg(content);
  writeFileSync(new URL('og-image.svg', PUBLIC_DIR), svg);
  await sharp(Buffer.from(svg)).png().toFile(fileURLToPath(new URL('og-image.png', PUBLIC_DIR)));
}

const isCli =
  process.argv[1] &&
  resolve(fileURLToPath(import.meta.url)).toLowerCase() === resolve(process.argv[1]).toLowerCase();
if (isCli) {
  const content = JSON.parse(readFileSync(CONTENT_FILE, 'utf8'));
  await generateOg(content);
  console.log('Wrote public/og-image.svg and public/og-image.png');
}
