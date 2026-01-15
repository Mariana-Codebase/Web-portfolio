import React from 'react';
import { Code2 } from 'lucide-react';

interface TerminalToggleProps {
  onClick: () => void;
  isDarkMode: boolean;
}

export const TerminalToggle: React.FC<TerminalToggleProps> = ({ onClick, isDarkMode }) => {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center gap-2 text-[11px] font-black tracking-[0.1em] transition-all duration-300 transform active:scale-95 ${
        isDarkMode
          ? 'text-green-400 hover:text-green-300'
          : 'text-green-600 hover:text-green-700'
      }`}
      title="Modo Terminal"
      style={{
        textShadow: isDarkMode ? '0 0 8px rgba(34,197,94,0.5)' : 'none',
      }}
    >
      <Code2 size={16} className={isDarkMode ? 'text-green-400' : 'text-green-600'} />
      <span>TERMINAL</span>
    </button>
  );
};
