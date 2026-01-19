import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CONTENT, DATA } from '../data/content';
import { ArrowUpRight, Star, GitBranch, GitCommit } from 'lucide-react';

type GithubProject = {
  source: 'github';
  t: string;
  description: string;
  language: string;
  u: string;
};

type LocalProject = {
  t: string;
  c: 'WEB' | 'MOBILE' | 'BACKEND';
  u: string;
  d: { es: string; en: string };
  tags?: string[];
  stats?: {
    stars?: number;
    commits?: number;
    forks?: number;
  };
  source?: 'local';
};
type ProjectItem = GithubProject | LocalProject;

interface ProjectsProps {
  themeColors: {
    cardBg: string;
    cardBorder: string;
    textSec: string;
  };
  projectFilter: string;
  setProjectFilter: (filter: string) => void;
}

export const Projects: React.FC<ProjectsProps> = ({ themeColors, projectFilter, setProjectFilter }) => {
  const { language, isDarkMode } = useApp();
  const t = CONTENT[language];
  const [githubProjects, setGithubProjects] = useState<GithubProject[]>([]);

  const isGithubProject = (project: ProjectItem): project is GithubProject => project.source === 'github';
  const hasGithubData = githubProjects.length > 0;
  const languageOverrides = DATA.githubLanguages ?? {};
  const categoryOverrides = DATA.githubCategories ?? {};
  const truncateText = (value: string, maxLength: number) => {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength).trim()}...`;
  };

  const localProjects = DATA.projects as LocalProject[];
  const filteredProjects = projectFilter === 'ALL'
    ? localProjects
    : localProjects.filter(p => p.c === projectFilter);

  const githubFiltered = githubProjects.filter((project) => {
    if (projectFilter === 'ALL') return true;
    const category = categoryOverrides[project.t.toLowerCase()];
    return category === projectFilter;
  });

  const projectsToRender: ProjectItem[] = hasGithubData ? githubFiltered : filteredProjects;
  const filters: Array<keyof typeof t.categories> = ['ALL', 'WEB', 'MOBILE', 'BACKEND'];

  useEffect(() => {
    if (!hasGithubData || projectFilter === 'ALL') return;
    if (githubFiltered.length === 0) {
      setProjectFilter('ALL');
    }
  }, [hasGithubData, projectFilter, githubFiltered.length, setProjectFilter]);

  useEffect(() => {
    const user = DATA.githubUser;
    if (!user) return;

    let isMounted = true;
    const mapProjects = (projects: Array<{ name: string; description: string; language: string; url: string }>) => {
      return projects.map((project) => ({
        source: 'github' as const,
        t: project.name,
        description: project.description ?? '',
        language: project.language || 'Unknown',
        u: project.url
      }));
    };

    const fetchFromGithub = async () => {
      try {
        const response = await fetch(`/api/github?user=${encodeURIComponent(user)}&limit=6`);
        if (!response.ok) throw new Error('api_error');
        const data = await response.json();
        if (!isMounted || !Array.isArray(data.projects)) return;
        setGithubProjects(mapProjects(data.projects));
      } catch {
        // Fallback to public GitHub API for local/dev.
        try {
          const response = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=6&sort=updated`);
          if (!response.ok) return;
          const repos = await response.json();
          if (!isMounted || !Array.isArray(repos)) return;
          const mapped = repos.map((repo: { name: string; description: string | null; language: string | null; html_url: string }) => ({
            name: repo.name,
            description: repo.description ?? '',
            language: repo.language ?? 'Unknown',
            url: repo.html_url
          }));
          setGithubProjects(mapProjects(mapped));
        } catch {
          return;
        }
      }
    };

    fetchFromGithub();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">{t.projectsTitle}</h2>
        <div className={`flex flex-wrap gap-2 ${isDarkMode ? 'bg-white/5' : 'bg-white/90 shadow-md'} p-2 rounded-2xl border ${isDarkMode ? themeColors.cardBorder : 'border-stone-400/60'}`}>
          {filters.map(cat => (
            <button
              key={cat}
              onClick={() => setProjectFilter(cat)}
              className={`px-3 md:px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                projectFilter === cat
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {projectsToRender.map((p, i) => (
          <div key={i} className={`group ${themeColors.cardBg} border ${themeColors.cardBorder} p-8 rounded-[2.5rem] hover:border-blue-600 transition-all duration-500 min-h-[360px] flex flex-col justify-between`}>
            <div className="text-left">
              <span className="text-[11px] font-black text-blue-600 mb-6 block tracking-[0.2em] uppercase italic">
                // {isGithubProject(p)
                  ? (categoryOverrides[p.t.toLowerCase()] || 'GITHUB')
                  : t.categories[p.c]}
              </span>
              <h3 className="text-4xl font-black italic tracking-tighter uppercase mb-4 leading-none group-hover:text-blue-600 transition-colors">{p.t}</h3>
              <p className={`${themeColors.textSec} text-base font-medium leading-relaxed mb-4`}>
                {isGithubProject(p)
                  ? truncateText(p.description || (language === 'es' ? 'Sin descripción.' : 'No description.'), 120)
                  : truncateText(p.d[language], 120)}
              </p>

              <div className="flex flex-col items-start gap-2 text-left mb-4 w-full">
                <span className={`w-full text-left text-[10px] font-black uppercase tracking-[0.2em] ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  Tech Stack
                </span>
                <div className="flex flex-wrap items-start justify-start gap-2 text-[10px] font-black uppercase tracking-wider w-full">
                  {isGithubProject(p)
                    ? (languageOverrides[p.t.toLowerCase()] || p.language || 'Unknown')
                        .split('/')
                        .map((tech) => tech.trim())
                        .filter(Boolean)
                        .map((tech) => (
                          <span
                            key={tech}
                            className={`px-3 py-1.5 rounded-full border backdrop-blur-md shadow-sm ${
                              isDarkMode
                                ? 'border-blue-500/30 text-blue-200 bg-blue-500/10'
                                : 'border-blue-600/20 text-blue-700 bg-blue-50'
                            }`}
                          >
                            {tech}
                          </span>
                        ))
                    : (
                      <span className={`px-3 py-1.5 rounded-full border backdrop-blur-md shadow-sm ${
                        isDarkMode
                          ? 'border-blue-500/30 text-blue-200 bg-blue-500/10'
                          : 'border-blue-600/20 text-blue-700 bg-blue-50'
                      }`}>
                        {p.tags?.[0] || 'Unknown'}
                      </span>
                    )}
                </div>
              </div>
              
              {!isGithubProject(p) && p.tags && p.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {p.tags.map((tag: string, tagIndex: number) => (
                    <span
                      key={tagIndex}
                      className={`tag-animate px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                        isDarkMode
                          ? 'bg-blue-600/10 border-blue-600/30 text-blue-400'
                          : 'bg-blue-50 border-blue-300/50 text-blue-700'
                      } transition-all hover:scale-105`}
                      style={{ animationDelay: `${tagIndex * 0.1}s` }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {!isGithubProject(p) && p.stats && (
                <div className="flex gap-6 mb-4">
                  {p.stats.stars !== undefined && (
                    <StatItem
                      icon={<Star size={16} />}
                      value={p.stats.stars}
                      label="Stars"
                      isDarkMode={isDarkMode}
                    />
                  )}
                  {p.stats.commits !== undefined && (
                    <StatItem
                      icon={<GitCommit size={16} />}
                      value={p.stats.commits}
                      label="Commits"
                      isDarkMode={isDarkMode}
                    />
                  )}
                  {p.stats.forks !== undefined && (
                    <StatItem
                      icon={<GitBranch size={16} />}
                      value={p.stats.forks}
                      label="Forks"
                      isDarkMode={isDarkMode}
                    />
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <a
                href={p.u}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-stone-200/50'} group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-12`}
              >
                <ArrowUpRight size={22} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface StatItemProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  isDarkMode: boolean;
}

const StatItem: React.FC<StatItemProps> = ({ icon, value, label, isDarkMode }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(increment * step, value);
      setDisplayValue(Math.floor(current));
      if (step >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
      isDarkMode ? 'bg-white/5' : 'bg-stone-100/50'
    }`}>
      <div className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
        {icon}
      </div>
      <div>
        <div className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>
          {displayValue}
        </div>
        <div className={`text-[9px] font-bold uppercase tracking-wider ${
          isDarkMode ? 'text-neutral-400' : 'text-stone-600'
        }`}>
          {label}
        </div>
      </div>
    </div>
  );
};
