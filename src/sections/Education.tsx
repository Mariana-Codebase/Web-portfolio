import React from 'react';
import { useApp } from '../context/AppContext';
import { CONTENT, DATA } from '../data/content';
import { ExternalLink, GraduationCap, Briefcase, Award } from 'lucide-react';

interface EducationProps {
  themeColors: {
    cardBg: string;
    cardBorder: string;
    textSec: string;
  };
  certFilter: string;
  setCertFilter: (filter: string) => void;
}

export const Education: React.FC<EducationProps> = ({ themeColors, certFilter, setCertFilter }) => {
  const { language, isDarkMode } = useApp();
  const t = CONTENT[language];

  const filteredCerts = certFilter === 'ALL' 
    ? DATA.certs 
    : DATA.certs.filter(c => c.c === certFilter);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">{t.certsTitle}</h2>
        <div className={`flex flex-wrap gap-2 ${isDarkMode ? 'bg-white/5' : 'bg-white/90 shadow-md'} p-2 rounded-2xl border ${isDarkMode ? themeColors.cardBorder : 'border-stone-400/60'}`}>
          {['ALL', 'EDU', 'CERT', 'INTERN'].map(cat => (
            <button
              key={cat}
              onClick={() => setCertFilter(cat)}
              className={`px-3 md:px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                certFilter === cat
                  ? 'bg-blue-600 text-white shadow-lg'
                  : isDarkMode
                    ? 'text-neutral-400 hover:text-white hover:bg-white/10'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/90'
              }`}
            >
              {t.categories[cat as keyof typeof t.categories]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filteredCerts.map((c, i) => (
          <a key={i} href={c.u} target="_blank" rel="noopener noreferrer" className={`${themeColors.cardBg} border ${themeColors.cardBorder} p-10 rounded-[2.5rem] hover:border-blue-600 transition-all duration-500 group flex flex-col justify-between`}>
            <div>
              <div className="mb-8 flex flex-wrap items-center gap-3">
                <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-600">
                  {c.c === 'EDU' ? <GraduationCap size={28} /> : c.c === 'INTERN' ? <Briefcase size={28} /> : <Award size={28} />}
                </div>
                <span className="text-[10px] sm:text-xs border border-blue-600/30 px-3 py-1.5 rounded-full text-blue-600 font-black uppercase italic tracking-tighter">{t.categories[c.c]}</span>
              </div>
              <h3 className="text-2xl font-black italic uppercase mb-2 leading-none group-hover:text-blue-600 transition-colors tracking-tighter">{typeof c.t === 'object' ? c.t[language] : c.t}</h3>
              <p className={`text-[11px] font-bold ${themeColors.textSec} uppercase tracking-widest`}>{c.i} // {typeof c.y === 'object' ? c.y[language] : c.y}</p>
            </div>
            <div className="mt-8 flex justify-end">
              <ExternalLink size={16} className={`${isDarkMode ? 'text-neutral-700' : 'text-stone-300'} group-hover:text-blue-600 transition-colors`} />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
