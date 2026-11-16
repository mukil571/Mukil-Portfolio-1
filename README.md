# Mukil P — Developer Portfolio

A dark, space-themed single-page portfolio built with **React + Vite**, **Tailwind CSS**, **Framer Motion** and **Three.js**.

## Edit your details (no code needed)

```bash
npm run edit
```

This starts the site and opens the **Portfolio Editor** at http://localhost:5173/admin. It has four tabs:

- **Profile & Contact**: name, role, about text, email, phone, location, GitHub/LinkedIn, resume upload
- **Skills**: categories, colours and skills (the 3D constellation updates itself)
- **Projects**: add, edit, reorder or delete projects, with icon, tags, highlights, and **Live Demo** / **Source Code** links. Every project always shows both buttons; a link you haven't added yet shows as a dimmed "Coming soon" button.
- **Education**: add or reorder timeline entries

Click **Save changes** (or press Ctrl+S). The site reloads with your edits and the share-preview image is regenerated. Empty fields are hidden on the site, so nothing looks broken.

To publish, run `npm run build` and redeploy. The editor exists only on your computer; it isn't part of the published site.

After you publish, put your site's address in **Profile & Contact → Website address**. Link previews on WhatsApp, LinkedIn and X need that full URL.

Everything you edit lives in [`src/data/content.json`](src/data/content.json). The previous version is kept as `content.backup.json` in case you want to undo a save.

## Effects

- **Boot-up intro**: a terminal "boot sequence" plays while the 3D scene loads, then jumps to hyperspace into the site.
- **3D WebGL universe**: a 28k-star spiral galaxy, deep star shell, nebulae and shooting stars. The camera follows the mouse, or the phone's tilt on mobile.
- **Morphing particles**: 9,000 particles implode into **"MUKIL P / FULL STACK DEVELOPER"**, then fly into a shape beside each section heading: `</>`, a rocket, a graduation cap and an envelope.
- **Hyperspace warp**: scroll fast and the stars stretch into light streaks.
- **Hidden easter egg**: type `warp` or double-click empty space for a hyperspace jump.
- **3D skill constellation**: skills as glowing stars on a rotating sphere; drag to spin, hover to highlight.
- **Project details**: click a project card for a detail panel with highlights and links.
- **Warp meter**: a scroll-progress rail on the right with clickable section markers.
- **Ambient sound**: optional, off by default (bottom-left speaker). Space ambience, whooshes and click blips, all generated in the browser.
- **Comet cursor, decoding headings, tilt cards, glowing borders.**

Particle counts drop on small screens, the 3D loop pauses in background tabs, and `prefers-reduced-motion` turns the motion off. Three.js loads as a separate chunk after the page content.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Build for production

```bash
npm run build
npm run preview
```

`npm run og` regenerates the share image (`public/og-image.png`) from `scripts/make-og.mjs`.

## Structure

```
src/
  App.jsx                  — page layout
  data/content.json        — all your details (edited via /admin)
  data/content.js          — turns content.json into data the components use
  admin/                   — the /admin editor (dev only)
  lib/bus.js               — event bus between React and the 3D scene
  audio/sound.js           — procedural Web Audio sound
  three/
    Universe.jsx           — canvas; lazy-loads the scene
    scene.js               — renderer, camera, loop, input, hyperjump, tilt
    galaxy.js              — spiral galaxy, star shell, warp streaks
    morphParticles.js      — name + section shape morphing
    cosmos.js              — nebulae + shooting stars
  components/
    BootScreen.jsx, HyperFlash.jsx, WarpMeter.jsx, SoundToggle.jsx,
    SkillConstellation.jsx, ProjectModal.jsx, SocialLinks.jsx,
    CursorFX.jsx, ScrambleText.jsx, Navbar.jsx, Hero.jsx, Section.jsx,
    Skills.jsx, Projects.jsx, Education.jsx, Contact.jsx
public/
  favicon.svg, og-image.png
```
