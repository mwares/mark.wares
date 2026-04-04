# Solar Monitor

A mobile-first solar energy monitoring app for Tesla Powerwall + solar panel systems, built for future commercialisation.

## Architecture

- **Monorepo**: Turborepo with npm workspaces
- **Mobile**: React Native + Expo (Expo Router for navigation)
- **API**: Fastify + TypeScript
- **Database**: PostgreSQL + TimescaleDB
- **Shared**: TypeScript types and constants

## Quick Start

```bash
npm install                  # Install all dependencies
npm run db:setup             # Start PostgreSQL via Docker
npm run db:migrate           # Apply database schema
npm run db:seed              # Seed with demo data
npm run dev                  # Start all apps (turbo dev)
```

## Commands

| Command | Description |
|---------|-------------|
| `turbo dev` | Start all apps in dev mode |
| `turbo test` | Run all tests |
| `turbo lint` | Lint all packages |
| `turbo typecheck` | Type-check all packages |
| `turbo build` | Build all packages |
| `npm run format` | Format all files with Prettier |

## Coding Conventions

- **TypeScript**: Strict mode, no `any` types
- **Components**: Functional components with hooks only
- **API routes**: Fastify plugin pattern (`FastifyPluginAsync`)
- **Services**: Pure functions or classes, injected via Fastify decorators
- **Database**: Raw SQL via `pg` pool (see `apps/api/src/db/client.ts`)
- **Imports**: Use `@/` alias in mobile app, `.js` extensions in API (ESM)
- **Styling**: React Native `StyleSheet.create()`, use theme tokens from `@/theme`

## Environment Variables

See `.env.example` for required variables. Key ones:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Auth token signing secret
- `ENCRYPTION_KEY` - 256-bit hex key for encrypting Tesla tokens
- `TESLA_CLIENT_ID` / `TESLA_CLIENT_SECRET` - Tesla Fleet API credentials
- `EXPO_PUBLIC_API_URL` - API URL for mobile app

## Testing

- **API**: Vitest (`apps/api/src/__tests__/`)
- **Mobile**: Jest + React Native Testing Library (`apps/mobile/__tests__/`)
- Coverage target: 80%+ on services, 70%+ on routes
