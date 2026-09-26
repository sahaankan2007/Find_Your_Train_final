import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'dark',
  toggle: () => set(s => {
    const next = s.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    return { theme: next };
  }),
  setTheme: (t) => {
    document.documentElement.classList.toggle('dark', t === 'dark');
    set({ theme: t });
  },
}));

// Initialize on load
if (typeof window !== 'undefined') {
  document.documentElement.classList.add('dark');
}
