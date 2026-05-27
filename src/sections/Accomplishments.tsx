import React from 'react';
import { useApp } from '../context/AppContext';
import { CONTENT, DATA } from '../data/content';
import { Trophy, ExternalLink } from 'lucide-react';

interface AccomplishmentsProps {
  themeColors: {
    cardBg: string;
    cardBorder: string;
    textSec: string;
  };
}

export const Accomplishments: React.FC<AccomplishmentsProps> = ({ themeColors }) => {
  const { language, isDarkMode } = useApp();
  const t = CONTENT[language];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">
          {t.achievementsTitle}
        </h2>
        <p className={`text-sm font-bold uppercase tracking-widest max-w-2xl ${themeColors.textSec}`}>
          {t.achievementsSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {DATA.achievements.map((item, i) => (
          <article
            key={i}
            className={`${themeColors.cardBg} border ${themeColors.cardBorder} p-8 sm:p-10 rounded-[2.5rem] hover:border-blue-600 transition-all duration-500 flex flex-col gap-6`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/15 rounded-2xl text-amber-500">
                  <Trophy size={28} />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter leading-none">
                    {item.project}
                  </h3>
                  <p className={`mt-2 text-[11px] font-bold ${themeColors.textSec} uppercase tracking-widest`}>
                    {item.event[language]}
                  </p>
                </div>
              </div>
              {item.competitors && (
                <span
                  className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                    isDarkMode ? 'border-white/15 text-neutral-400' : 'border-stone-400/50 text-stone-600'
                  }`}
                >
                  {item.competitors[language]}
                </span>
              )}
            </div>

            <p className={`text-sm sm:text-base leading-relaxed ${isDarkMode ? 'text-neutral-300' : 'text-stone-700'}`}>
              {item.summary[language]}
            </p>

            {item.highlights && item.highlights.length > 0 && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {item.highlights.map((highlight, j) => (
                  <li
                    key={j}
                    className={`flex items-start gap-3 p-4 rounded-2xl border ${
                      isDarkMode ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white/60 border-stone-300/60'
                    }`}
                  >
                    <span className="text-lg leading-none shrink-0" aria-hidden>
                      {highlight.icon}
                    </span>
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-wide leading-snug">
                      {highlight.label[language]}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-500 transition-colors group/link w-fit"
              >
                {t.achievementsLeaderboard}
                <ExternalLink size={14} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
              </a>
            )}
          </article>
        ))}
      </div>
    </div>
  );
};
