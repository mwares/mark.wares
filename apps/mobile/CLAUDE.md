# Solar Monitor Mobile App

React Native + Expo mobile app with dark theme and neon accents.

## Running

```bash
npx expo start       # Start Expo dev server
npm test             # Run tests (jest)
npm run test:watch   # Watch mode
npm run typecheck    # Type-check
npm run lint         # Lint
```

## Navigation

File-based routing via Expo Router:
- `app/(tabs)/` - Main tab screens (Dashboard, Analytics, Alerts, Savings)
- `app/auth/` - Auth screens (Login, Tesla Connect)
- `app/_layout.tsx` - Root layout with Stack navigator

## Components

All in `components/`:
- Use functional components with hooks
- Import theme tokens from `@/theme`
- Use `StyleSheet.create()` for styles (defined at bottom of file)

## Theme

Import from `@/theme`:
- `colors` - Dark background + neon accents (solar=yellow, battery=green, grid=blue)
- `spacing`, `borderRadius`, `fontSize` - Design tokens
- `commonStyles` - Reusable style objects (screen, card, row, etc.)

## API Client

`services/api.ts` - Simple fetch wrapper with JWT auth:
```ts
import { api } from '@/services/api';
const data = await api.get<{ data: MyType }>('/api/endpoint');
```

## Testing

- Tests in `__tests__/` mirroring component structure
- Jest + React Native Testing Library
- Mock API responses for screen tests
