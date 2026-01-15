import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: string) => void;
  onSetTheme: (theme: 'dark' | 'light') => void;
  onSetLanguage: (lang: 'es' | 'en') => void;
}

export const Terminal: React.FC<TerminalProps> = ({ isOpen, onClose, onNavigate, onSetTheme, onSetLanguage }) => {
  const { language, isDarkMode } = useApp();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Array<{ command: string; output: string }>>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const helpMessage = `Available commands:
  help          - Show this help message
  clear         - Clear terminal
  me            - Navigate to profile section
  p             - Navigate to projects section
  ed            - Navigate to education section
  h             - Navigate to home section
  es/en         - Quick language change (e.g., 'español' or 'english')
  d/l           - Quick theme change (e.g., 'd' for dark, 'l' for light)
  exit          - Close terminal`;

  const commands: Record<string, (args?: string) => string> = {
    help: () => {
      return helpMessage;
    },
    clear: () => {
      return '';
    },
    me: () => {
      onNavigate('about');
      return 'Navigating to profile section...';
    },
    p: () => {
      onNavigate('projects');
      return 'Navigating to projects section...';
    },
    ed: () => {
      onNavigate('certs');
      return 'Navigating to education section...';
    },
    h: () => {
      onNavigate('home');
      return 'Navigating to home section...';
    },
    about: () => {
      onNavigate('about');
      return 'Navigating to profile section...';
    },
    projects: () => {
      onNavigate('projects');
      return 'Navigating to projects section...';
    },
    education: () => {
      onNavigate('certs');
      return 'Navigating to education section...';
    },
    home: () => {
      onNavigate('home');
      return 'Navigating to home section...';
    },
    theme: (args?: string) => {
      if (!args || args.trim() === '') {
        return `Current theme: ${isDarkMode ? 'dark' : 'light'}\nUsage: theme [dark|light|d|l]`;
      }
      const themeArg = args.trim().toLowerCase();
      let theme: 'dark' | 'light' | null = null;
      
      if (themeArg === 'dark' || themeArg === 'd') {
        theme = 'dark';
      } else if (themeArg === 'light' || themeArg === 'l') {
        theme = 'light';
      }
      
      if (theme) {
        onSetTheme(theme);
        return `Theme changed to ${theme}`;
      }
      return `Invalid theme. Use 'dark', 'light', 'd', or 'l'`;
    },
    lang: (args?: string) => {
      if (!args || args.trim() === '') {
        return `Current language: ${language}\nUsage: lang [es|en]`;
      }
      const langArg = args.trim().toLowerCase();
      if (langArg === 'es' || langArg === 'en') {
        onSetLanguage(langArg as 'es' | 'en');
        return `Language changed to ${langArg === 'es' ? 'Spanish' : 'English'}`;
      }
      return `Invalid language. Use 'es' or 'en'`;
    },
    exit: () => {
      onClose();
      return 'Closing terminal...';
    },
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (isOpen) {
      setShowWelcome(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const inputTrimmed = input.trim();
    const [cmd, ...args] = inputTrimmed.split(' ');
    const command = cmd.toLowerCase();
    const argsStr = args.join(' ');

    // Support shorthand commands (language/theme).
    let actualCommand = command;
    let actualArgs = argsStr;
    
    if (command === 'es' || command === 'en' || command === 'español' || command === 'english') {
      actualCommand = 'lang';
      if (command === 'español') {
        actualArgs = 'es';
      } else if (command === 'english') {
        actualArgs = 'en';
      } else {
        actualArgs = command;
      }
    } 
    else if (command === 'd' || command === 'l') {
      actualCommand = 'theme';
      actualArgs = command;
    }

    if (actualCommand === 'clear') {
      setHistory([]);
      setShowWelcome(true);
      setInput('');
      return;
    }

    let output = '';
    if (commands[actualCommand]) {
      output = commands[actualCommand](actualArgs);
    } else {
      output = `Command not found: ${command}. Type 'help' for available commands.`;
    }

    setHistory([...history, { command: input, output }]);
    setInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/90' : 'bg-stone-900/95'}`} onClick={onClose} />
      <div
        className={`relative w-full max-w-3xl h-[600px] rounded-2xl border-2 ${
          isDarkMode ? 'bg-[#0a0a0a] border-green-500/50' : 'bg-[#1a1a1a] border-green-400/50'
        } shadow-2xl overflow-hidden font-mono`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-4 py-3 border-b ${
          isDarkMode ? 'border-green-500/30 bg-black/50' : 'border-green-400/30 bg-black/30'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className={`ml-4 text-xs font-bold ${
              isDarkMode ? 'text-green-400' : 'text-green-300'
            }`}>
              TERMINAL v1.0.0
            </span>
          </div>
          <button
            onClick={onClose}
            className={`text-xs px-3 py-1 rounded hover:bg-white/10 transition-colors ${
              isDarkMode ? 'text-green-400' : 'text-green-300'
            }`}
          >
            [X]
          </button>
        </div>

        <div
          ref={terminalRef}
          className={`h-[calc(100%-120px)] overflow-y-auto p-4 text-sm ${
            isDarkMode ? 'text-green-400' : 'text-green-300'
          }`}
          style={{ fontFamily: 'monospace' }}
        >
          {showWelcome && (
            <div className="mb-4">
              <div className={`${isDarkMode ? 'text-blue-400' : 'text-blue-300'}`}>
                Welcome to my Portfolio's Terminal
              </div>
              <div className="mt-2 opacity-70">
                Type 'help' for available commands
              </div>
            </div>
          )}

          {history.map((item, i) => (
            <div key={i} className="mb-2">
              <div className="mb-1">
                <span className={`${isDarkMode ? 'text-blue-400' : 'text-blue-300'}`}>$ </span>
                <span>{item.command}</span>
              </div>
              {item.output && (
                <div className="ml-4 opacity-90 whitespace-pre-wrap">{item.output}</div>
              )}
            </div>
          ))}

          <form onSubmit={handleSubmit} className="flex items-center">
            <span className={`${isDarkMode ? 'text-blue-400' : 'text-blue-300'}`}>$ </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={`flex-1 ml-2 bg-transparent outline-none ${
                isDarkMode ? 'text-green-400' : 'text-green-300'
              } caret-green-500`}
              autoFocus
            />
          </form>
        </div>
      </div>
    </div>
  );
};
