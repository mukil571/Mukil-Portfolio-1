// Vite plugins for the self-service content editor.
//  - contentTokens(): fills %TITLE% / %DESCRIPTION% / %OG_IMAGE% in index.html from content.json (dev + build)
//  - contentEditor(): dev-server-only API used by /admin to read and save content.json and upload a resume
import { readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ICON_KEYS, COLOR_KEYS, TEXT_FIELDS } from '../src/data/schema.js';

const MAX_RESUME_BYTES = 10 * 1024 * 1024;
const MAX_JSON_BYTES = 512 * 1024;

function paths(root) {
  return {
    content: path.join(root, 'src/data/content.json'),
    backup: path.join(root, 'src/data/content.backup.json'),
    resume: path.join(root, 'public/resume.pdf'),
  };
}

const escapeAttr = (s) =>
  String(s ?? '').replace(/[&"<>]/g, (c) => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' })[c]);

export function contentTokens() {
  let root = process.cwd();
  return {
    name: 'content-tokens',
    configResolved(config) {
      root = config.root;
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (!html.includes('%TITLE%')) return html;
        const c = JSON.parse(readFileSync(paths(root).content, 'utf8'));
        const title = [c.name, c.role].filter(Boolean).join(' — ');
        const description = [title, c.subtitle].filter(Boolean).join(' | ');
        const site = (c.siteUrl || '').trim().replace(/\/+$/, '');
        const ogImage = site ? `${site}/og-image.png` : '/og-image.png';
        return html
          .replaceAll('%TITLE%', escapeAttr(title))
          .replaceAll('%DESCRIPTION%', escapeAttr(description))
          .replaceAll('%OG_IMAGE%', escapeAttr(ogImage));
      },
    },
  };
}

// ---------- validation ----------

const str = (v, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const strList = (v, maxItems, maxLen = 200) =>
  Array.isArray(v) ? v.map((x) => str(x, maxLen)).filter(Boolean).slice(0, maxItems) : [];

/** Returns { content } with only known, well-typed fields, or { error } describing the problem. */
export function validateContent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Content must be an object.' };
  const out = {};
  for (const key of TEXT_FIELDS) out[key] = str(input[key], key === 'tagline' || key === 'contactNote' ? 1000 : 300);
  if (!out.name) return { error: 'Name is required.' };

  if (input.skills !== undefined && !Array.isArray(input.skills)) return { error: 'Skills must be a list.' };
  out.skills = (input.skills || []).slice(0, 20).map((g) => ({
    category: str(g?.category, 80),
    color: COLOR_KEYS.includes(g?.color) ? g.color : 'cyan',
    items: strList(g?.items, 40, 60),
  }));

  if (input.projects !== undefined && !Array.isArray(input.projects)) return { error: 'Projects must be a list.' };
  out.projects = (input.projects || []).slice(0, 30).map((p) => ({
    title: str(p?.title, 120),
    description: str(p?.description, 1000),
    icon: ICON_KEYS.includes(p?.icon) ? p.icon : 'code',
    tags: strList(p?.tags, 20, 40),
    highlights: strList(p?.highlights, 12, 200),
    repo: str(p?.repo, 300),
    demo: str(p?.demo, 300),
  }));
  if (out.projects.some((p) => !p.title)) return { error: 'Every project needs a title.' };

  if (input.education !== undefined && !Array.isArray(input.education)) return { error: 'Education must be a list.' };
  out.education = (input.education || []).slice(0, 20).map((e) => ({
    degree: str(e?.degree, 200),
    institution: str(e?.institution, 200),
    period: str(e?.period, 80),
  }));
  if (out.education.some((e) => !e.degree)) return { error: 'Every education entry needs a degree or title.' };

  return { content: out };
}

// ---------- request helpers ----------

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

/** Only the editor page served by this dev server may call the API (blocks other websites and DNS rebinding). */
function isTrusted(req) {
  const host = req.headers.host || '';
  const hostName = host.replace(/:\d+$/, '');
  if (!LOCAL_HOSTS.has(hostName)) return false;
  const origin = req.headers.origin;
  if (!origin) return req.method === 'GET';
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error('Too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function writeAtomic(file, data) {
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, data);
  try {
    await fs.rename(tmp, file);
  } catch {
    // Windows can refuse the rename while a watcher holds the file; fall back to a direct write
    await fs.writeFile(file, data);
    await fs.rm(tmp, { force: true });
  }
}

export function contentEditor() {
  let root = process.cwd();
  return {
    name: 'content-editor',
    apply: 'serve',
    configResolved(config) {
      root = config.root;
    },
    configureServer(server) {
      const p = paths(root);

      server.middlewares.use(async (req, res, next) => {
        const url = (req.url || '').split('?')[0];
        if (url === '/admin' || url === '/admin/') {
          req.url = '/admin.html';
          return next();
        }
        if (url !== '/__content' && url !== '/__resume') return next();

        if (!isTrusted(req)) return send(res, 403, { error: 'Forbidden' });

        try {
          if (url === '/__content' && req.method === 'GET') {
            return send(res, 200, JSON.parse(await fs.readFile(p.content, 'utf8')));
          }

          if (url === '/__content' && req.method === 'POST') {
            let parsed;
            try {
              parsed = JSON.parse((await readBody(req, MAX_JSON_BYTES)).toString('utf8'));
            } catch (err) {
              return send(res, err.status || 400, { error: err.status ? 'Too large' : 'Invalid JSON' });
            }
            const { content, error } = validateContent(parsed);
            if (error) return send(res, 400, { error });

            await fs.copyFile(p.content, p.backup).catch(() => {});
            await writeAtomic(p.content, `${JSON.stringify(content, null, 2)}\n`);

            import('./make-og.mjs')
              .then(({ generateOg }) => generateOg(content))
              .catch((err) => server.config.logger.warn(`[content-editor] share image not updated: ${err.message}`));

            return send(res, 200, { ok: true, content });
          }

          if (url === '/__resume' && req.method === 'POST') {
            const body = await readBody(req, MAX_RESUME_BYTES);
            if (body.subarray(0, 4).toString('latin1') !== '%PDF') {
              return send(res, 400, { error: 'That file is not a PDF.' });
            }
            await fs.writeFile(p.resume, body);
            return send(res, 200, { ok: true, path: '/resume.pdf' });
          }

          return send(res, 405, { error: 'Method not allowed' });
        } catch (err) {
          return send(res, err.status || 500, { error: err.status === 413 ? 'File too large (max 10 MB).' : err.message });
        }
      });
    },
  };
}
