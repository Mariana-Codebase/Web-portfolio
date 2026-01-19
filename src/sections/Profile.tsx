import React from 'react';
import { useApp } from '../context/AppContext';
import { CONTENT, DATA } from '../data/content';

interface ProfileProps {
  themeColors: {
    cardBg: string;
    cardBorder: string;
    textSec: string;
  };
}

export const Profile: React.FC<ProfileProps> = ({ themeColors }) => {
  const { language, isDarkMode } = useApp();
  const t = CONTENT[language];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-5 duration-700">
      <div className={`${themeColors.cardBg} border ${themeColors.cardBorder} p-10 md:p-14 rounded-[3rem] lg:col-span-7 flex flex-col justify-center transition-all duration-1000`}>
        <h3 className="text-blue-600 font-mono text-[11px] tracking-[0.25em] mb-6 uppercase italic font-black">{t.profileTitle}</h3>
        <p className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase mb-8 leading-none">{t.profileSlogan}</p>
        <p className={`text-lg ${themeColors.textSec} leading-relaxed font-medium`}>{t.profileDesc}</p>
      </div>
      <div className="lg:col-span-5 flex flex-col gap-8">
        <div className={`${themeColors.cardBg} border ${themeColors.cardBorder} p-6 md:p-8 rounded-[3rem]`}>
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-blue-600 font-mono text-[11px] tracking-[0.25em] uppercase italic font-black">/ {t.stackTitle}</h4>
            <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${isDarkMode ? 'border-white/10 text-white/50' : 'border-stone-300 text-stone-500'}`}>
              Core
            </span>
          </div>
          <div className="space-y-5">
            <div className={`p-4 rounded-2xl border ${themeColors.cardBorder} ${isDarkMode ? 'bg-white/[0.02]' : 'bg-transparent'}`}>
              <h5 className="text-[11px] font-black tracking-widest text-blue-500/90 mb-3 uppercase italic">{t.stackCategories.frontend}</h5>
              <div className="flex flex-wrap gap-2">
                {DATA.skills.frontend.map(s => (
                  <span key={s} className={`px-3 py-1.5 ${isDarkMode ? 'bg-white/5' : 'bg-stone-200/70'} rounded-full text-[11px] font-black border ${themeColors.cardBorder} hover:bg-blue-600 hover:text-white transition-all tracking-tight uppercase`}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
            
            <div className={`p-4 rounded-2xl border ${themeColors.cardBorder} ${isDarkMode ? 'bg-white/[0.02]' : 'bg-transparent'}`}>
              <h5 className="text-[11px] font-black tracking-widest text-blue-500/90 mb-3 uppercase italic">{t.stackCategories.backend}</h5>
              <div className="flex flex-wrap gap-2">
                {DATA.skills.backend.map(s => (
                  <span key={s} className={`px-3 py-1.5 ${isDarkMode ? 'bg-white/5' : 'bg-stone-200/70'} rounded-full text-[11px] font-black border ${themeColors.cardBorder} hover:bg-blue-600 hover:text-white transition-all tracking-tight uppercase`}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
            
            <div className={`p-4 rounded-2xl border ${themeColors.cardBorder} ${isDarkMode ? 'bg-white/[0.02]' : 'bg-transparent'}`}>
              <h5 className="text-[11px] font-black tracking-widest text-blue-500/90 mb-3 uppercase italic">{t.stackCategories.cloud}</h5>
              <div className="flex flex-wrap gap-2">
                {DATA.skills.cloud.map(s => (
                  <span key={s} className={`px-3 py-1.5 ${isDarkMode ? 'bg-white/5' : 'bg-stone-200/70'} rounded-full text-[11px] font-black border ${themeColors.cardBorder} hover:bg-blue-600 hover:text-white transition-all tracking-tight uppercase`}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className={`${themeColors.cardBg} border ${themeColors.cardBorder} p-8 md:p-10 rounded-[3rem]`}>
          <h4 className="text-blue-600 font-mono text-[11px] tracking-[0.25em] mb-6 uppercase italic font-black">/ {t.langTitle}</h4>
          <div className="space-y-4">
            {DATA.langs.map(l => (
              <div key={l.n.en} className="flex justify-between items-center group">
                <span className="font-black text-base italic uppercase tracking-tighter group-hover:text-blue-600 transition-colors">{l.n[language]}</span>
                <span className={`text-[10px] ${isDarkMode ? 'bg-white/5' : 'bg-stone-200/80'} border ${themeColors.cardBorder} px-3 py-1.5 rounded-lg font-black tracking-widest uppercase italic`}>{l.l[language]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
