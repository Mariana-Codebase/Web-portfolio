import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Theme, Section } from '../data/content';

interface AppContextType {
  language: Language;
  theme: Theme;
  currentSection: Section;
  projectFilter: string;
  certFilter: string;
  isTerminalOpen: boolean;
  setIsTerminalOpen: (open: boolean) => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  setCurrentSection: (section: Section) => void;
  setProjectFilter: (filter: string) => void;
  setCertFilter: (filter: string) => void;
  isDarkMode: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'es';
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'dark';
  });

  const [currentSection, setCurrentSection] = useState<Section>('home');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [certFilter, setCertFilter] = useState<string>('ALL');
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);

  const isDarkMode = theme === 'dark';

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <AppContext.Provider
      value={{
        language,
        theme,
        currentSection,
        projectFilter,
        certFilter,
        isTerminalOpen,
        setIsTerminalOpen,
        setLanguage,
        setTheme,
        setCurrentSection,
        setProjectFilter,
        setCertFilter,
        isDarkMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
