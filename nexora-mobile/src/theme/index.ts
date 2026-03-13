/**
 * Tema Nexora — Alineado con la web (teal/slate, dark mode por defecto)
 */
export const colors = {
  primary: '#14b8a6',
  primaryDark: '#0d9488',
  primaryLight: '#2dd4bf',

  secondary: '#0d9488',
  secondaryDark: '#0f766e',
  secondaryLight: '#5eead4',

  accent: '#f59e0b',
  accentDark: '#d97706',
  accentLight: '#fbbf24',

  // Dark mode (default, alineado con web slate-950/900/800)
  background: '#0f172a',
  backgroundSecondary: '#1e293b',
  backgroundTertiary: '#334155',

  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textInverse: '#ffffff',

  border: '#334155',
  borderLight: '#475569',

  success: '#22c55e',
  successSoft: 'rgba(34, 197, 94, 0.2)',
  warning: '#f59e0b',
  warningSoft: 'rgba(245, 158, 11, 0.2)',
  error: '#ef4444',
  errorSoft: 'rgba(239, 68, 68, 0.2)',
  info: '#3b82f6',

  card: '#1e293b',
  cardElevated: '#334155',
  textLight: '#94a3b8',
  input: '#334155',
  inputBorder: '#475569',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
};

export const theme = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
};

export default theme;
