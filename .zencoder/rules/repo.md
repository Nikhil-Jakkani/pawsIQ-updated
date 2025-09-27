# Repository Overview

## Tech Stack
- **Frontend**: React 18 (Vite build tooling), React Router, Tailwind CSS, React Icons, Chart.js
- **State & Services**: Custom React context/hooks, Supabase client, Firebase integration, Axios-based services
- **Backend**: Node.js with Express, TypeScript source compiled to JavaScript, Prisma ORM
- **Infrastructure & Tooling**: Vite for dev/build, ESLint, PostCSS, Tailwind, concurrently for multi-process dev, Vercel deployment config, Workbox PWA tooling

## Project Layout
- **src/**: Frontend SPA source code (components, pages, hooks, context, utils)
- **src/pages/auth/**: Authentication-related pages (login/signup flows)
- **src/pages/provider & src/pages/providers**: Provider-related features and dashboards
- **server/**: Express API written in TypeScript (`server/src`), compiled output under `server/dist`
- **prisma/**: Database schema and migrations
- **public/**: Static assets served by Vite

## Key Entry Points
- **Frontend**: `src/main.jsx` bootstraps the React app, `src/App.jsx` defines routing layout
- **Backend**: `server/src/index.ts` starts the Express server, `server/src/app.ts` configures middleware/routes

## Development Workflow
1. Install dependencies: `npm install`
2. Run both frontend and backend with hot reload: `npm run dev`
3. Frontend-only dev server: `npm run dev:frontend` (defaults to port 3001)
4. Backend-only watcher: `npm run dev:backend`
5. Production build (frontend + backend): `npm run build`
6. Preview production bundles locally: `npm run start`

## Environment & Configuration
- Sample environment variables located at `.env` / `.env.local` (frontend) and `server/.env` / `server/.env.local` (backend)
- Tailwind configuration in `tailwind.config.js`, PostCSS pipeline via `postcss.config.js`
- Vite/PWA behavior configured in `vite.config.js` and `public/manifest`

## Testing & Utilities
- **Testing utilities**: Located under `src/test/`
- **Icon generation**: `generate-icons.js`
- **Scripts**: `server/scripts/hash-password.ts` for password hashing helpers

## Additional Notes
- PWA support includes offline SW assets in `dev-dist/` and `dist/`
- Supabase/Firebase integrations require proper credentials for authentication flows
- Provider-specific features reside under `src/pages/provider*` and may share components with user flows located in `src/components`