export type ThemeMode = 'cyber-blue' | 'emerald-tech' | 'gold-titanium' | 'crimson-command';

export interface ThemeColors {
  id: ThemeMode;
  name: string;
  primary: string;
  primaryGlow: string;
  accent: string;
  bgDark: string;
  bgCard: string;
  border: string;
  badgeBg: string;
  chartColors: string[];
}

export const THEMES: Record<ThemeMode, ThemeColors> = {
  'cyber-blue': {
    id: 'cyber-blue',
    name: 'Cyber Blue (Klasik DataV)',
    primary: '#00f2fe',
    primaryGlow: 'rgba(0, 242, 254, 0.4)',
    accent: '#4facfe',
    bgDark: '#030816',
    bgCard: 'rgba(7, 20, 48, 0.75)',
    border: 'rgba(0, 242, 254, 0.25)',
    badgeBg: 'rgba(0, 242, 254, 0.1)',
    chartColors: ['#00f2fe', '#4facfe', '#38ef7d', '#f12711', '#f5af19', '#7f00ff']
  },
  'emerald-tech': {
    id: 'emerald-tech',
    name: 'Emerald Matrix',
    primary: '#05ffa1',
    primaryGlow: 'rgba(5, 255, 161, 0.4)',
    accent: '#00b4db',
    bgDark: '#02130e',
    bgCard: 'rgba(4, 30, 23, 0.8)',
    border: 'rgba(5, 255, 161, 0.25)',
    badgeBg: 'rgba(5, 255, 161, 0.12)',
    chartColors: ['#05ffa1', '#00b4db', '#e1eec3', '#f05053', '#00c6ff', '#f3a683']
  },
  'gold-titanium': {
    id: 'gold-titanium',
    name: 'Amber Gold Tech',
    primary: '#f6d365',
    primaryGlow: 'rgba(246, 211, 101, 0.4)',
    accent: '#fda085',
    bgDark: '#120d04',
    bgCard: 'rgba(32, 22, 10, 0.8)',
    border: 'rgba(246, 211, 101, 0.25)',
    badgeBg: 'rgba(246, 211, 101, 0.12)',
    chartColors: ['#f6d365', '#fda085', '#ff9900', '#f368e0', '#54a0ff', '#1dd1a1']
  },
  'crimson-command': {
    id: 'crimson-command',
    name: 'Crimson Command',
    primary: '#ff3366',
    primaryGlow: 'rgba(255, 51, 102, 0.4)',
    accent: '#ba265d',
    bgDark: '#140308',
    bgCard: 'rgba(34, 8, 17, 0.8)',
    border: 'rgba(255, 51, 102, 0.25)',
    badgeBg: 'rgba(255, 51, 102, 0.12)',
    chartColors: ['#ff3366', '#ff758c', '#ff7eb3', '#fbc2eb', '#a18cd1', '#38ef7d']
  }
};
