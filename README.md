# BUNKER CONQUEST — Local GPU Edition

A local-first, browser-based first-person bunker-combat prototype built with PlayCanvas Engine 2, Vite, and procedural assets.

## What it includes

- WebGPU requested first, with WebGL 2 fallback when supported by the browser and device.
- Procedurally generated bunker surfaces, light fixtures, props, and combat effects.
- Desktop keyboard/mouse controls and on-screen touch controls.
- A small playable mission slice with an enemy sentry, shooting, a relay objective, and reactive environmental targets.

> This is a prototype, not a finished AAA production. The meshes and textures are generated at runtime; the project still needs professionally authored characters, animations, and environment assets to reach AAA visual quality. A successful build is not the same as a verified gameplay test on every GPU.

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The game renders on the user's local GPU; the development server only serves files. Browsers commonly require `localhost` for WebGPU secure-context support.

## Build

```sh
npm run build
npm run preview
```

## Controls

- `W A S D`: move
- Mouse: look / aim
- Left click: fire
- `R`: reload
- `Q`: switch weapon
- `E`: interact with the relay
- `Shift`: sprint
- `Space`: jump
- Touch devices: virtual joystick, drag-to-look, and action buttons

## GitHub Pages

A GitHub Actions workflow builds with Vite and deploys the `dist/` directory on pushes to `main`. Enable **Settings → Pages → Build and deployment → GitHub Actions** if Pages is not already enabled.

## License

Prototype source. Add an explicit license before redistributing outside your own project.