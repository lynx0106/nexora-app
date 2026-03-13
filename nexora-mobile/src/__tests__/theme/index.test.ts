import { colors, spacing, typography, borderRadius, shadows } from '../../theme';

describe('Theme', () => {
  describe('colors', () => {
    it('should have primary color defined', () => {
      expect(colors.primary).toBe('#14b8a6');
    });

    it('should have secondary color defined', () => {
      expect(colors.secondary).toBe('#10b981');
    });

    it('should have error color defined', () => {
      expect(colors.error).toBe('#ef4444');
    });

    it('should have success color defined', () => {
      expect(colors.success).toBe('#22c55e');
    });
  });

  describe('spacing', () => {
    it('should have correct spacing values', () => {
      expect(spacing.xs).toBe(4);
      expect(spacing.sm).toBe(8);
      expect(spacing.md).toBe(16);
      expect(spacing.lg).toBe(24);
      expect(spacing.xl).toBe(32);
    });
  });

  describe('typography', () => {
    it('should have h1 style defined', () => {
      expect(typography.h1.fontSize).toBe(32);
      expect(typography.h1.fontWeight).toBe('700');
    });

    it('should have body style defined', () => {
      expect(typography.body.fontSize).toBe(16);
      expect(typography.body.fontWeight).toBe('400');
    });
  });

  describe('borderRadius', () => {
    it('should have correct border radius values', () => {
      expect(borderRadius.sm).toBe(4);
      expect(borderRadius.md).toBe(8);
      expect(borderRadius.lg).toBe(12);
      expect(borderRadius.full).toBe(9999);
    });
  });

  describe('shadows', () => {
    it('should have shadow styles defined', () => {
      expect(shadows.sm).toBeDefined();
      expect(shadows.md).toBeDefined();
      expect(shadows.lg).toBeDefined();
    });
  });
});