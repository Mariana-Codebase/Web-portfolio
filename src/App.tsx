import React, { Suspense, lazy, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageToggle } from './components/LanguageToggle';
import { ThemeToggle } from './components/ThemeToggle';
import { SplashScreen } from './components/SplashScreen';
import { Terminal } from './components/Terminal';
import { TerminalToggle } from './components/TerminalToggle';
import { CONTENT, DATA } from './data/content';

const Scene3D = lazy(() => import('./components/Scene3D').then((m) => ({ default: m.Scene3D })));
const Home = lazy(() => import('./sections/Home').then((m) => ({ default: m.Home })));
const Profile = lazy(() => import('./sections/Profile').then((m) => ({ default: m.Profile })));
const Education = lazy(() => import('./sections/Education').then((m) => ({ default: m.Education })));
const Projects = lazy(() => import('./sections/Projects').then((m) => ({ default: m.Projects })));

const AppContent: React.FC = () => {
  const { language, isDarkMode, currentSection, setCurrentSection, setTheme, setLanguage, projectFilter, setProjectFilter, certFilter, setCertFilter, isTerminalOpen, setIsTerminalOpen } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const t = CONTENT[language];

  const themeColors = {
    bg: isDarkMode ? 'bg-[#050505]' : 'bg-[#a8a29e]',
    text: isDarkMode ? 'text-white' : 'text-[#262626]',
    textSec: isDarkMode ? 'text-neutral-400' : 'text-neutral-600',
    cardBg: isDarkMode ? 'bg-white/[0.02]' : 'bg-[#e7e5e4]/40 shadow-lg shadow-neutral-400/5',
    cardBorder: isDarkMode ? 'border-white/[0.08]' : 'border-neutral-300',
    navBg: isDarkMode ? 'bg-black/80' : 'bg-white/95 shadow-2xl shadow-stone-900/10',
    navBorder: isDarkMode ? 'border-white/20' : 'border-stone-400/60',
    socialBtn: isDarkMode ? 'bg-white/5 text-white' : 'bg-stone-200/50 text-stone-700',
  };

  const handleNavigate = (section: string) => {
    setCurrentSection(section as typeof currentSection);
    setIsTerminalOpen(false);
    setIsNavOpen(false);
  };

  return (
    <>
      {isLoading && <SplashScreen onComplete={() => setIsLoading(false)} isDarkMode={isDarkMode} />}
      
      <div className={`min-h-screen ${themeColors.bg} ${themeColors.text} transition-colors duration-1000 font-sans selection:bg-blue-600/50 overflow-x-hidden relative ${isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-1000'}`}>
        <Suspense fallback={null}>
        <Scene3D isDarkMode={isDarkMode} />
        </Suspense>

      <header className="fixed top-4 md:top-8 w-full px-4 md:px-6 z-[100]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between md:justify-center gap-3">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              type="button"
              onClick={() => setIsNavOpen((prev) => !prev)}
              className={`md:hidden h-12 w-12 rounded-xl border ${themeColors.navBorder} ${themeColors.navBg} backdrop-blur-2xl flex items-center justify-center transition-all`}
              aria-label={isNavOpen ? 'Close menu' : 'Open menu'}
            >
              <div className="flex flex-col gap-1.5">
                <span className={`h-0.5 w-5 ${isDarkMode ? 'bg-white' : 'bg-stone-900'}`} />
                <span className={`h-0.5 w-5 ${isDarkMode ? 'bg-white' : 'bg-stone-900'}`} />
              </div>
            </button>
            <nav className={`hidden md:flex gap-1.5 ${themeColors.navBg} backdrop-blur-2xl border ${themeColors.navBorder} p-2 rounded-2xl transition-all duration-500`}>
              {Object.entries(t.nav).map(([id, label]) => (
                <button 
                  key={id}
                  onClick={() => handleNavigate(id)}
                  className={`relative px-5 py-2.5 rounded-xl text-[11px] font-black tracking-[0.1em] transition-all duration-300 transform active:scale-95 ${
                    currentSection === id 
                      ? 'text-white bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg scale-105 z-10' 
                      : isDarkMode ? 'text-neutral-500 hover:text-white hover:bg-white/5' : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/80'
                  }`}
                >
                  {label}
                  {currentSection === id && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex gap-2.5">
            <LanguageToggle 
              lang={language} 
              setLang={setLanguage} 
              isDarkMode={isDarkMode} 
            />
            <ThemeToggle 
              isDarkMode={isDarkMode} 
              toggle={() => setTheme(isDarkMode ? 'light' : 'dark')} 
              tooltip={t.tooltips.theme}
            />
          </div>
        </div>

        <div className={`${isNavOpen ? 'block' : 'hidden'} md:hidden mt-3`}>
          <nav className={`flex flex-col gap-2 ${themeColors.navBg} backdrop-blur-2xl border ${themeColors.navBorder} p-2 rounded-2xl transition-all duration-500`}>
            {Object.entries(t.nav).map(([id, label]) => (
              <button 
                key={id}
                onClick={() => handleNavigate(id)}
                className={`relative px-4 py-3 rounded-xl text-[11px] font-black tracking-[0.1em] transition-all duration-300 transform active:scale-95 ${
                  currentSection === id 
                    ? 'text-white bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg' 
                    : isDarkMode ? 'text-neutral-500 hover:text-white hover:bg-white/5' : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/80'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-32 md:pt-40 pb-32 md:pb-24 relative z-10">
        <Suspense fallback={null}>
        {currentSection === 'home' && <Home themeColors={themeColors} />}
        {currentSection === 'about' && <Profile themeColors={themeColors} />}
        {currentSection === 'certs' && <Education themeColors={themeColors} certFilter={certFilter} setCertFilter={setCertFilter} />}
        {currentSection === 'projects' && <Projects themeColors={themeColors} projectFilter={projectFilter} setProjectFilter={setProjectFilter} />}
        </Suspense>
      </main>

      <Terminal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        onNavigate={handleNavigate}
        onSetTheme={setTheme}
        onSetLanguage={setLanguage}
      />

      <footer className={`fixed bottom-0 left-0 right-0 px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0 text-[9px] md:text-[10px] font-black tracking-[0.2em] md:tracking-[0.3em] z-50 uppercase backdrop-blur-2xl border-t ${
        isDarkMode 
          ? 'text-white/30 bg-black/60 border-white/10' 
          : 'text-stone-600/60 bg-white/80 border-stone-300/60'
      }`}>
        <div className="flex flex-wrap gap-3 items-center justify-center md:justify-start">
          <TerminalToggle 
            onClick={() => setIsTerminalOpen(true)} 
            isDarkMode={isDarkMode} 
          />
          <span className="pointer-events-none">{t.status}</span>
        </div>
        <span className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 pointer-events-none text-center">
          <span>{t.designedBy} {DATA.alias}</span>
          <span>© {new Date().getFullYear()}</span>
        </span>
      </footer>
      </div>
    </>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
