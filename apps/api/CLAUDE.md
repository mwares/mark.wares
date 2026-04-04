# Solar Monitor API

Fastify + TypeScript backend for the Solar Monitor app.

## Running

```bash
npm run dev          # Start with hot reload (tsx watch)
npm test             # Run tests (vitest)
npm run test:watch   # Watch mode
npm run test:coverage # With coverage report
npm run typecheck    # Type-check
npm run lint         # Lint
```

## Route Pattern

All routes are Fastify plugins registered in `src/server.ts`:

```ts
export const myRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', (app as any).authenticate); // Protected routes
  app.get('/endpoint', async (request, reply) => { ... });
};
```

## Service Layer

Services are standalone modules imported by routes:
- `services/tesla.ts` - Tesla Fleet API client
- `services/demo.ts` - Demo data generator (for development/demo mode)
- `services/alert-engine.ts` - Alert threshold evaluation
- `services/analytics.ts` - Usage pattern analysis
- `services/recommendations.ts` - Savings recommendation engine

## Database

- Connection pool in `src/db/client.ts`
- Schema in `src/db/schema.sql`
- Use `db.query(sql, params)` for all queries (parameterized)
- TimescaleDB hypertable for `energy_readings`

## Testing

- Tests in `src/__tests__/` mirroring the `src/` structure
- Use `vitest` with `describe/it/expect`
- Mock DB and external services in tests
