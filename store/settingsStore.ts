import { create } from 'zustand';

export type Language = 'ko' | 'en' | 'zh' | 'ja';

interface SettingsState {
  fontSize: 'small' | 'medium' | 'large';
  language: Language;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setLanguage: (language: Language) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  fontSize: 'medium',
  language: 'ko',
  setFontSize: (size) => set({ fontSize: size }),
  setLanguage: (language) => set({ language }),
}));
