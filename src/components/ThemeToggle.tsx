import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDarkMode: boolean;
  toggle: () => void;
  tooltip: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDarkMode, toggle, tooltip }) => {
  return (
    <button 
      onClick={toggle}
      className={`relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-500 active:scale-90 group overflow-hidden border ${
        isDarkMode 
          ? 'bg-black/40 border-white/10 hover:border-blue-500/50' 
          : 'bg-white/90 border-stone-400/70 hover:border-orange-400/70 shadow-md'
      }`}
      title={tooltip}
    >
      <div className={`relative w-full h-full flex items-center justify-center transition-transform duration-700 ease-in-out ${
        isDarkMode ? 'rotate-0' : 'rotate-[360deg]'
      }`}>
        <div className={`absolute transition-all duration-700 transform ${
          isDarkMode ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 -rotate-90 translate-x-4 translate-y-4'
        }`}>
          <Moon size={22} className="text-blue-400" />
        </div>
        <div className={`absolute transition-all duration-700 transform ${
          isDarkMode ? 'scale-0 opacity-0 rotate-90 -translate-x-4 -translate-y-4' : 'scale-100 opacity-100 rotate-0'
        }`}>
          <Sun size={24} className="text-orange-500" />
        </div>
      </div>
    </button>
  );
};
