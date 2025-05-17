import { create } from 'zustand';

interface SettingsState {
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  fontSize: 'medium',
  setFontSize: (size) => set({ fontSize: size }),
}));
