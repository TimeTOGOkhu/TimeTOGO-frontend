import { useSettingsStore } from '../store/settingsStore';
import { TRANSLATIONS } from '@constants/Languages';

export const useTranslation = () => {
  const language = useSettingsStore(state => state.language);
  
  const t = (key: keyof typeof TRANSLATIONS.ko): string => {
    return TRANSLATIONS[language][key] || TRANSLATIONS.ko[key] || key;
  };
  
  return { t, language };
};
