import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode, SUPPORTED_LANGUAGES, TRANSLATIONS } from '../config/languages';

interface LanguageContextType {
  currentLanguage: LanguageCode;
  languages: typeof SUPPORTED_LANGUAGES;
  setLanguage: (code: LanguageCode) => void;
  t: (key: string, defaultText?: string) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLangState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('tradecore_lang') as LanguageCode;
    return saved && TRANSLATIONS[saved] ? saved : 'en';
  });

  const activeLangObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    localStorage.setItem('tradecore_lang', currentLanguage);
    document.documentElement.dir = activeLangObj.dir;
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage, activeLangObj]);

  const setLanguage = (code: LanguageCode) => {
    setCurrentLangState(code);
  };

  const t = (key: string, defaultText?: string): string => {
    const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
    if (dict[key]) return dict[key];
    if (TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, languages: SUPPORTED_LANGUAGES, setLanguage, t, dir: activeLangObj.dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
