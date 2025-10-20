# Vellum Demo

Vellum Demo is a Vite + React prototype for exploring a multi-surface Shopify merchant experience.  
It brings together internal admin tooling (MX), customer-facing storefront flows, and CX operations in one codebase.

- **Framework**: React 18 with TypeScript, Vite, and Shopify Polaris UI.
- **Surfaces**: Merchant experience dashboards, customer onboarding (storefront), CX team tooling.
- **Routing**: React Router v7 keeps each surface isolated behind its own route tree.
- **Styling**: Polaris tokens with project-wide globals in `src/styles/global.css`.

## Local Development

```bash
npm install
npm run dev
```

The dev server defaults to `http://localhost:5173`.  
Linting and type safety helpers:

```bash
npm run lint
npm run typecheck
```

## Building

```bash
npm run build
npm run preview  # optional: serve the production build locally
```

The production bundle emits to `dist/`.

## Deployment (Netlify)

Netlify picks up builds directly from Git pushes:

- **Base directory**: `(root)`
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node runtime**: `20` (configured in `netlify.toml`)
- **SPA routing**: all routes redirect to `index.html`

Add any required environment variables (API keys, feature flags) in the Netlify dashboard under **Site settings → Build & deploy → Environment** before triggering a build.

## Repo Setup

This repository was split from the original `vellum-mx-prototype` project to reduce deployment friction.  
If you need the earlier history or design notes, check `Mission.md` and `references/UI-Tweak-Log.md`.
