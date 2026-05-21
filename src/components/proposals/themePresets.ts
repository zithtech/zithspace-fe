export interface ThemePreset {
  id: string;
  label: string;
  from: string;
  to: string;
  /** Solid accent colour that replaces --premium-blue inside the paper */
  accent: string;
}

export interface FontPreset {
  id: string;
  label: string;
  family: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'graphite', label: 'Graphite', from: '#0f172a', to: '#334155', accent: '#1e293b' },
  { id: 'azure',    label: 'Azure',    from: '#1d4ed8', to: '#3b82f6', accent: '#2563eb' },
  { id: 'orchid',   label: 'Orchid',   from: '#7c3aed', to: '#a855f7', accent: '#7c3aed' },
  { id: 'ember',    label: 'Ember',    from: '#b45309', to: '#f59e0b', accent: '#d97706' },
  { id: 'forest',   label: 'Forest',   from: '#065f46', to: '#10b981', accent: '#059669' },
  { id: 'rose',     label: 'Rose',     from: '#9d174d', to: '#ec4899', accent: '#db2777' },
];

export const FONT_PRESETS: FontPreset[] = [
  { id: 'inter',  label: 'Inter',  family: '"Inter", system-ui, sans-serif' },
  { id: 'system', label: 'System', family: 'system-ui, -apple-system, sans-serif' },
  { id: 'serif',  label: 'Serif',  family: '"Source Serif Pro", Georgia, serif' },
];

export const resolveTheme = (themeId: string): ThemePreset =>
  THEME_PRESETS.find((t) => t.id === themeId) || THEME_PRESETS[0];

export const resolveFont = (fontId: string): FontPreset =>
  FONT_PRESETS.find((f) => f.id === fontId) || FONT_PRESETS[0];
