/**
 * College Management Portal - Authoritative Mobile Color Palette
 * Aligned with the official web UI design system (Phase 1 & Phase 2).
 */
export const COLORS = {
  // Brand
  primary: '#1E3A8A',
  primaryLight: '#3B82F6',
  primaryDark: '#1E293B',
  accent: '#0D9488',

  // Surfaces
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Typography
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Role Colors (Supports both backend ENUMs and internal lowercase identifiers)
  roles: {
    ADMIN: { background: '#EEF2FF', accent: '#4F46E5' },
    DEPARTMENT_STAFF: { background: '#F0FDF4', accent: '#16A34A' },
    FACULTY: { background: '#FEF3C7', accent: '#D97706' },
    STUDENT: { background: '#ECFDF5', accent: '#059669' },
    admin: { background: '#EEF2FF', accent: '#4F46E5' },
    hod: { background: '#F0FDF4', accent: '#16A34A' },
    faculty: { background: '#FEF3C7', accent: '#D97706' },
    student: { background: '#ECFDF5', accent: '#059669' },
  },
};

export const ROLE_COLORS = COLORS.roles;

export default COLORS;
