# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Game of Thrones–themed interactive invitation website. It consists of two pages served as static HTML with no build step or package manager:

- **`/` → `invitation/`** — A 3D interactive Great Keep built with Three.js r128. Visitors explore the hall in first-person, click objects to read lore, open a parchment scroll with event details, and submit an RSVP form.
- **`moments/`** — A static photo gallery ("Chronicles") with category filtering and a lightbox modal.

## Running Locally

Serve from the repo root with any static HTTP server (required because `invitation/js/main.js` uses ES modules and FBX assets load via relative URLs):

```bash
# Python
python -m http.server 8080

# Node.js (npx)
npx serve .
```

Then open `http://localhost:8080/` — the root `index.html` auto-redirects to `invitation/`.

There are no build, lint, or test commands. All JS runs directly in the browser.

## QR Code Generator

A standalone Node.js utility to generate a QR code PNG for any URL:

```bash
node generate_qr.js <URL>
# Example: node generate_qr.js https://prathabhithirtha.vercel.app/invitation/
```

Outputs `qr_code.png` in the project root. Requires internet access (calls `api.qrserver.com`).

## Architecture: `invitation/` (3D Page)

The 3D page is structured as ES modules loaded by `invitation/js/main.js`. All modules share a single mutable `state` object from `state.js`.

**Initialization order** (from `main.js`):
1. `dom.js` — caches all DOM element references into a `dom` export
2. `scene.js` — creates Three.js scene, camera, renderer, OrbitControls, and moonlight
3. `materials.js` — defines PBR `MeshStandardMaterial` instances (stone, floor, iron, fire core, roof)
4. `controls.js` — first-person WASD keyboard movement
5. `audio.js` — Web Audio API procedural ambient sound (pink noise wind + fire hiss + ember crackles)
6. `fbx-loader.js` — loads 7 FBX assets from `assets/objects/`, assembles them into `keepGroup`, then scales the whole group to fit a ~45-unit target bounding box
7. `interaction.js` — raycaster on mousedown; maps FBX filename to lore text shown in the object card
8. `ui.js` — scroll parchment toggle, RSVP modal, and RSVP form submit
9. `splash.js` — 2D canvas particle animation on the loading screen
10. `mobile-controls.js` — on-screen D-pad for touch devices
11. `render-loop.js` — `requestAnimationFrame` loop: animates fire lights, ember/dust particles, and drives camera animations

**Camera modes**: OrbitControls are the default. First-person mode (`state.firstPersonActive = true`) is entered via `camera.js:enterTheKeep()` when the user clicks "Enter the Keep". `controls.js` handles WASD movement; `interaction.js` manages pointer lock for mouse look.

**Key constraint**: The `THREE` global is loaded from CDN (r128) along with `FBXLoader` and `OrbitControls`. Do not switch to npm imports without restructuring the HTML.

## Architecture: `moments/` (Gallery Page)

Plain HTML + CSS + vanilla JS (`moments/script.js`). No modules. Category filtering uses `data-category` attributes on `.gallery-card` elements; clicking a card opens a CSS-driven lightbox modal. Keyboard arrow keys and escape are supported in the lightbox.

## Asset Notes

FBX model files live in `invitation/assets/objects/`. The `r1.fbx` file is untracked (see `.gitignore` / git status). Wall texture `wall1_DefaultMaterial_BaseColor.png` is loaded by `fbx-loader.js` via `TextureLoader` and applied to all `wall1.fbx` instances.

## CSS Versioning

`invitation/styles.css` and `invitation/js/main.js` are referenced with query-string cache busters (`?v=13`, `?v=14`) in `invitation/index.html`. Increment these manually when making changes that need to bypass browser cache.
