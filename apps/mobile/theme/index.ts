import { StyleSheet } from 'react-native';

// ── Color Palette ──
// Dark base with neon accents inspired by Tesla's aesthetic

export const colors = {
  // Backgrounds
  background: '#0A0E1A',
  surface: '#121829',
  surfaceLight: '#1A2235',
  card: '#161D2F',

  // Neon accents
  solar: '#FFD93D', // Yellow - solar energy
  battery: '#00E676', // Green - battery
  grid: '#448AFF', // Blue - grid
  home: '#FFFFFF', // White - home consumption
  alert: '#FF5252', // Red - alerts
  savings: '#7C4DFF', // Purple - savings

  // Neon glows (with opacity)
  solarGlow: 'rgba(255, 217, 61, 0.3)',
  batteryGlow: 'rgba(0, 230, 118, 0.3)',
  gridGlow: 'rgba(68, 138, 255, 0.3)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8892A6',
  textMuted: '#4A5568',

  // Borders
  border: '#1E2A3E',
  borderLight: '#2D3A50',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  hero: 36,
};

// ── Common Styles ──

export const commonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  valueText: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  unitText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '400',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
