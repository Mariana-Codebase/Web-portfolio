import React from 'react';
import { Language } from '../data/content';

interface LanguageToggleProps {
  lang: Language;
  setLang: (lang: Language) => void;
  isDarkMode: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ lang, setLang, isDarkMode }) => {
  return (
    <button 
      onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
      className="group relative flex items-center justify-center transition-all duration-300 active:scale-95"
    >
      <div className={`
        relative w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center overflow-hidden transition-all duration-500
        ${isDarkMode 
          ? 'bg-black/80 border-white/10 hover:border-blue-500/60' 
          : 'bg-white border-stone-400/70 hover:border-blue-600 shadow-md'
        }
      `}>
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-600'}`} />
        
        <span className={`text-[12px] font-black tracking-tighter transition-transform duration-300 group-hover:-translate-y-1 ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>
          {lang === 'es' ? 'ESP' : 'ENG'}
        </span>
        
        <div className={`h-[2px] w-4 mt-1 transition-all duration-300 group-hover:w-8 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-600'}`} />

        <span className={`absolute bottom-1 text-[7px] font-black opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
          {lang === 'es' ? 'TO ENG' : 'A ESP'}
        </span>
      </div>
    </button>
  );
};
