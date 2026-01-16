# Mariana Dev - Portfolio

A modern portfolio with a Neo‑Brutalist minimalist vibe, a subtle 3D background, and a clean React setup. It also includes a terminal mode, a splash screen, and live projects pulled from GitHub.

## Highlights

**Neo‑Brutalist Minimalist UI** with strong typography
**3D background** (1,500 particles) with gentle pointer response
**Light/Dark mode** with smooth transitions
**Native i18n** (ES/EN) without extra dependencies
**Terminal mode** for quick navigation and settings, also just for a fun touch :D
**Splash screen** with custom logo and loader
**GitHub projects** updated automatically with my serverless api
**Responsive** across devices

## Tech

- React 18 + TypeScript
- Vite
- Three.js
- Tailwind CSS
- React Three Fiber

## Setup

```bash
npm install
```

## Dev

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Project Structure

```
src/
├── components/     # Reusable UI
├── sections/       # Main sections
├── context/        # Global state (Context API)
├── data/          # Content/config
└── App.tsx        # App root
api/
└── github.ts      # Serverless GitHub API
```

## GitHub Projects (Vercel API)

The projects section uses the serverless endpoint at `/api/github` in production.


## Terminal Commands

- `help` shows commands
- `clear` clears the terminal
- `es` / `en` switches language
- `d` / `l` switches theme
- `me`, `p`, `ed`, `h` navigate sections

## Notes

- If `/api` isn’t available locally, the UI falls back to the public GitHub API.
