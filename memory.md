# Solar Monitor - Architecture Decisions & Notes

## Architecture Decisions

### 2026-04-04: Initial Architecture
- **Monorepo with Turborepo**: Chosen for shared types, single CI pipeline, and coordinated releases
- **Fastify over Express**: Faster, better TypeScript support, built-in validation/serialization
- **Raw SQL over full ORM**: More control over TimescaleDB-specific queries; Drizzle ORM available for migrations later
- **Expo Router**: File-based routing matches Next.js patterns, good for future web support
- **Demo mode first**: Lets us build and test the full app without Tesla API credentials

### Data Model
- Energy readings stored as watts (not kW) for precision
- Battery: positive = charging, negative = discharging
- Grid: positive = importing, negative = exporting
- 1-minute polling interval for live data, 15-min aggregation for history

### Security
- Tesla tokens encrypted with AES-256-GCM before storage
- JWT for API auth, tokens stored in Expo SecureStore on device
- No plain-text credentials in database

## Tesla API Notes

- Fleet API base: `https://fleet-api.prd.na.vn.cloud.tesla.com`
- Auth: OAuth2 at `https://auth.tesla.com/oauth2/v3/`
- Scope needed: `energy_device_data`
- `live_status` returns: solar_power, battery_power, load_power, grid_power, percentage_charged
- `calendar_history` supports 15-min intervals with `interval=15m`
- `tariff_rate` returns TOU periods (ON_PEAK, PARTIAL_PEAK, OFF_PEAK)

## Known Issues / Technical Debt

- [ ] No rate limiting on API endpoints yet
- [ ] Push notifications not wired up to Expo (needs EAS build)
- [ ] No database connection pooling health checks
- [ ] Tesla OAuth flow not implemented yet (using demo mode)

## Future Feature Ideas

- Weather forecast integration for solar prediction
- Smart home device integration (control loads based on solar)
- Community features (compare with neighbors)
- Export data to CSV/PDF
- Apple Watch / Wear OS widget
- White-label support for commercial deployment
