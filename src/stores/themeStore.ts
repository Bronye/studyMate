import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeName = 'arcade' | 'minimal' | 'cyberpunk' | 'nature' | 'pastel' | 'cyberspace' | 'rpg';

interface ThemeState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'rpg',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'studymate-theme-storage',
    }
  )
);

export const themeNames: Record<ThemeName, string> = {
  arcade: 'Retro Arcade',
  minimal: 'Minimal Clean',
  cyberpunk: 'Cyberpunk',
  nature: 'Nature Calm',
  pastel: 'Soft Pastel',
  cyberspace: 'Cyber Space',
  rpg: 'Quest RPG',
};

export const themeDescriptions: Record<ThemeName, string> = {
  arcade: 'Pixel-perfect retro gaming vibes with neon colors',
  minimal: 'Clean, modern, and distraction-free',
  cyberpunk: 'Futuristic tech aesthetic with neon glows',
  nature: 'Calming greens and earth tones for focused learning',
  pastel: 'Soft, calm colors to reduce testing anxiety',
  cyberspace: 'High-energy competitive vibes for exam prep',
  rpg: 'Tactile game feel with exploration elements',
};
