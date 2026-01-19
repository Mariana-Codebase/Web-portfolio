import React from 'react';
import { useApp } from '../context/AppContext';
import { CONTENT, DATA } from '../data/content';
import { Github, Linkedin, Mail } from 'lucide-react';
import { LeetCodeIcon } from '../components/LeetCodeIcon';

interface HomeProps {
  themeColors: {
    cardBg: string;
    cardBorder: string;
    textSec: string;
    socialBtn: string;
  };
}

export const Home: React.FC<HomeProps> = ({ themeColors }) => {
  const { language, isDarkMode } = useApp();
  const t = CONTENT[language];

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700">
      <div className={`${themeColors.cardBg} border ${themeColors.cardBorder} p-12 md:p-20 rounded-[3rem] transition-all duration-1000`}>
        <span className="text-blue-600 font-mono text-xs tracking-[0.2em] uppercase mb-4 block font-black">{DATA.alias}</span>
        <div className="group/name cursor-default inline-block mb-8 sm:mb-10">
          <h1 className="text-[11vw] sm:text-[9vw] lg:text-[7.5rem] font-black leading-[0.9] sm:leading-[0.85] tracking-tighter italic transition-all duration-500 group-hover/name:text-blue-600">
            <div className="flex overflow-hidden">
              {DATA.name.split('').map((char, i) => (
                <span key={i} className="inline-block transition-transform duration-500 group-hover/name:-translate-y-2" style={{ transitionDelay: `${i * 30}ms` }}>
                  {char}
                </span>
              ))}
            </div>
            <div className={`${isDarkMode ? 'text-neutral-500' : 'text-stone-600'} transition-all duration-1000 group-hover/name:text-blue-200 group-hover/name:translate-x-4`}>
              {DATA.surname}
            </div>
          </h1>
        </div>
        <p className={`text-xl ${themeColors.textSec} max-w-2xl font-medium leading-relaxed`}>{t.bio}</p>
        <div className="flex flex-wrap gap-3 sm:gap-4 mt-10 sm:mt-12">
          {[
            { 
              id: 'github', 
              icon: <Github size={20} />,
              href: "#", 
              tooltip: t.tooltips.github,
              hoverColor: isDarkMode ? 'hover:bg-[#a855f7] hover:text-white hover:border-[#a855f7]' : 'hover:bg-[#a855f7] hover:text-white hover:border-[#a855f7]'
            },
            { 
              id: 'linkedin', 
              icon: <Linkedin size={20} />,
              href: "#", 
              tooltip: t.tooltips.linkedin,
              hoverColor: isDarkMode ? 'hover:bg-[#3b82f6] hover:text-white hover:border-[#3b82f6]' : 'hover:bg-[#3b82f6] hover:text-white hover:border-[#3b82f6]'
            },
            { 
              id: 'mail', 
              icon: <Mail size={20} />,
              href: `mailto:contact@${DATA.alias.toLowerCase()}.com`, 
              tooltip: t.tooltips.mail,
              hoverColor: isDarkMode ? 'hover:bg-[#f43f5e] hover:text-white hover:border-[#f43f5e]' : 'hover:bg-[#f43f5e] hover:text-white hover:border-[#f43f5e]'
            },
            { 
              id: 'leetcode', 
              icon: <LeetCodeIcon size={20} />,
              href: "#", 
              tooltip: t.tooltips.leetcode,
              hoverColor: isDarkMode ? 'hover:bg-[#fbbf24] hover:text-black hover:border-[#fbbf24]' : 'hover:bg-[#fbbf24] hover:text-black hover:border-[#fbbf24]'
            }
          ].map(social => (
            <a 
              key={social.id} 
              href={social.href} 
              className={`group relative p-3 sm:p-4 ${themeColors.socialBtn} ${social.hoverColor} rounded-2xl transition-all duration-300 block border ${themeColors.cardBorder}`}
            >
              <span className="inline-flex scale-[0.8] sm:scale-100">
                {social.icon}
              </span>
              <span className={`
                absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase whitespace-nowrap
                opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50
                ${isDarkMode 
                  ? 'bg-black/90 border border-white/20 text-white backdrop-blur-sm' 
                  : 'bg-white/90 border border-neutral-300 text-stone-900 backdrop-blur-sm shadow-lg'
                }
              `}>
                {social.tooltip}
                <span className={`
                  absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b
                  ${isDarkMode 
                    ? 'bg-black/90 border-white/20' 
                    : 'bg-white/90 border-neutral-300'
                  }
                `} />
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
