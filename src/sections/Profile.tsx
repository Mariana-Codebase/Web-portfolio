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
        <h3 className="text-blue-600 font-mono text-[10px] tracking-[0.25em] mb-6 uppercase italic font-black">{t.profileTitle}</h3>
        <p className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase mb-8 leading-none">{t.profileSlogan}</p>
        <p className={`text-lg ${themeColors.textSec} leading-relaxed font-medium`}>{t.profileDesc}</p>
      </div>
      <div className="lg:col-span-5 flex flex-col gap-8">
        <div className={`${themeColors.cardBg} border ${themeColors.cardBorder} p-6 md:p-8 rounded-[3rem]`}>
          <h4 className="text-xs font-black tracking-widest text-blue-600 mb-5 uppercase italic font-mono">{t.stackTitle}</h4>
          <div className="space-y-4">
            <div>
              <h5 className="text-[11px] font-black tracking-widest text-blue-500/80 mb-3 uppercase italic font-mono">{t.stackCategories.frontend}</h5>
              <div className="flex flex-wrap gap-1.5">
                {DATA.skills.frontend.map(s => (
                  <span key={s} className={`px-3 py-2 ${isDarkMode ? 'bg-white/5' : 'bg-stone-200/50'} rounded-lg text-xs font-black border ${themeColors.cardBorder} hover:bg-blue-600 hover:text-white transition-all tracking-tighter uppercase italic`}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="text-[11px] font-black tracking-widest text-blue-500/80 mb-3 uppercase italic font-mono">{t.stackCategories.backend}</h5>
              <div className="flex flex-wrap gap-1.5">
                {DATA.skills.backend.map(s => (
                  <span key={s} className={`px-3 py-2 ${isDarkMode ? 'bg-white/5' : 'bg-stone-200/50'} rounded-lg text-xs font-black border ${themeColors.cardBorder} hover:bg-blue-600 hover:text-white transition-all tracking-tighter uppercase italic`}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="text-[11px] font-black tracking-widest text-blue-500/80 mb-3 uppercase italic font-mono">{t.stackCategories.cloud}</h5>
              <div className="flex flex-wrap gap-1.5">
                {DATA.skills.cloud.map(s => (
                  <span key={s} className={`px-3 py-2 ${isDarkMode ? 'bg-white/5' : 'bg-stone-200/50'} rounded-lg text-xs font-black border ${themeColors.cardBorder} hover:bg-blue-600 hover:text-white transition-all tracking-tighter uppercase italic`}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className={`${themeColors.cardBg} border ${themeColors.cardBorder} p-8 md:p-10 rounded-[3rem]`}>
          <h4 className="text-[10px] font-black tracking-widest text-blue-600 mb-6 uppercase italic">{t.langTitle}</h4>
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
