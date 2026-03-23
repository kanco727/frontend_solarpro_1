# Copilot Instructions for frontend_solarpro

## Project Overview
This is a React + TypeScript frontend for a solar energy management platform. It uses Vite for build tooling and Tailwind CSS for styling. The codebase is organized by feature, with each major domain (e.g., MiniGrids, Monitoring, Maintenance) in its own directory under `src/components/`.

## Architecture & Patterns
- **Component Structure:**
  - Major features are in `src/components/<Feature>/`. Each feature has its own view and supporting components.
  - Shared logic (e.g., authentication) is in `src/contexts/`.
  - API calls are abstracted in `src/services/api.ts`.
  - Type definitions are in `src/types/`.
- **Styling:** Tailwind CSS is used throughout. Utility classes are preferred over custom CSS.
- **State Management:** Context API is used for global state (see `src/contexts/AuthContext.tsx`).
- **Data Flow:**
  - Data is fetched via `api.ts` and passed down as props.
  - No Redux or MobX; keep state local or in context unless cross-cutting.

## Developer Workflows
- **Install dependencies:** `npm install`
- **Start dev server:** `npm run dev`
- **Build for production:** `npm run build`
- **Preview production build:** `npm run preview`
- **Type checking:** `npm run type-check` (if defined in `package.json`)
- **Linting:** `npx eslint .` (uses `eslint.config.js`)

## Conventions
- **File Naming:** Use PascalCase for components, camelCase for functions/variables.
- **Component Exports:** Default export for main component in each file.
- **API Integration:** All HTTP requests go through `services/api.ts`.
- **Types:** Always import from `src/types/` for shared types.
- **No direct DOM manipulation.**

## Integration Points
- **External APIs:** All backend communication is via `api.ts`.
- **Maps:** Map-related features are in `components/Cartographie/` and `components/Dashboard/MiniGridMap.tsx`.
- **Charts:** Energy charts in `components/Dashboard/EnergyChart.tsx`.

## Examples
- To add a new feature, create a folder in `src/components/` and follow the structure of existing features.
- For authentication, use the context in `src/contexts/AuthContext.tsx`.
- For new API endpoints, add methods to `services/api.ts` and types to `types/api.ts`.

---
For questions about project structure or patterns, see this file or ask a maintainer.
