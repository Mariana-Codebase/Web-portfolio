# Project Documentation

This is the working documentation I keep alongside the portfolio. It focuses on the stuff you’ll actually touch: how the project is organized, how data flows, how to run it locally, and how deployments behave.

## Overview

The site is a React + TypeScript app built with Vite. It has a 3D background (Three.js), a terminal mode, bilingual content (ES/EN), and a projects section fed by GitHub through a small serverless API. The structure is intentionally content‑first: update the data file and the UI reflects it.

Goals:
- Keep the UI fast and consistent.
- Make updates simple (content lives in one place).
- Deploy cleanly on Vercel without extra services.

## Local Setup

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start the dev server.
- `npm run build` — run TypeScript checks and build.
- `npm run preview` — serve the production build locally.

## Tech Stack

- React 18 + TypeScript
- Vite
- Three.js
- Tailwind CSS
- React Three Fiber

## Project Structure

```
src/
├── components/     # Reusable UI building blocks
├── sections/       # Page sections (Home, Profile, Education, Projects)
├── context/        # Global state (theme, language, filters)
├── data/           # Content & configuration
└── App.tsx         # App root
api/
└── github.ts       # GitHub proxy
public/
└── favicon.svg     # Browser tab icon
```

### Where to edit content

Everything text‑based lives in `src/data/content.ts`.

- `CONTENT` — localized text for ES/EN.
- `DATA` — personal data, stack, GitHub overrides, certificates.

If you want to change titles, bios, or labels, start here.

Common edits:
- **Hero bio / profile text**: `CONTENT.es.bio` and `CONTENT.en.bio`
- **Profile section**: `CONTENT.es.profileDesc` and `CONTENT.en.profileDesc`
- **Education/Certs**: `DATA.certs`
- **Stack labels**: `DATA.skills` + `CONTENT.stackCategories`

## GitHub Projects (API)

Projects are loaded from a serverless endpoint:

`api/github.ts`

What it does:
- pulls public repos for a user
- filters out `fork`, `archived`, and `disabled`
- supports `?user=` and `?limit=`
- adds cache headers for better performance

### Environment Variables (Vercel)

Set these in your Vercel project:

- `GITHUB_USER` = `your-user`
- `GITHUB_TOKEN` = token with `public_repo` scope

If the API isn’t available locally, the UI falls back to the public GitHub API.

### Manual overrides (tech labels + categories)

Sometimes GitHub doesn’t return a language (or you want a better label). Use overrides:

```ts
DATA.githubLanguages["repo-name"] = "React / TypeScript / Vite"
DATA.githubCategories["repo-name"] = "WEB"
```

If you add a new repo, include it here to control the category label and the tech chips.

## UI Behavior (What to expect)

- The header collapses into a mobile menu.
- The footer adapts to small screens and won’t overlap content.
- The terminal overlay scales to fit mobile height.
- Social icons and the hero name resize on smaller viewports.

## Styling Notes

Most layout and color decisions live in components and `src/index.css`:
- Global animations are defined in `src/index.css`.
- Theme colors are computed in `App.tsx` under `themeColors`.
- UI follows a minimal Neo‑Brutalist style with strong typography and clear borders.

## Deployment (Vercel)

Recommended settings:

- Build Command: `npm run build`
- Output Directory: `dist`

If Vercel can’t find `package.json`, set **Root Directory** to `Website`.

## Troubleshooting

- **ERR_CONNECTION_REFUSED** — the dev server isn’t running.
- **GitHub language missing** — add an override in `DATA.githubLanguages`.
- **Build fails** — run `npm run build` locally to see TypeScript errors.

## Changelog Tips

When you update content or layout:
- Edit `src/data/content.ts` first.
- Run `npm run build` before pushing to avoid Vercel build errors.
