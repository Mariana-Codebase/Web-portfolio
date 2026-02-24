import React, { useEffect, useState } from 'react';
import { Star, ArrowUpRight, GitPullRequest } from 'lucide-react';
import { CONTENT, DATA } from '../data/content';
import { useApp } from '../context/AppContext';

type Contribution = {
  status: 'OPEN' | 'MERGED';
  project: string;
  title: string;
  stars: number;
  url: string;
  reference: string;
  owner?: string;
  references?: Array<{ url: string; reference: string; author: string; event: string }>;
};

interface ContributionsProps {
  themeColors: {
    cardBg: string;
    cardBorder: string;
    textSec: string;
  };
}

const mapContributions = (items: Array<{
  status: string;
  project: string;
  title?: string;
  stars: number;
  url: string;
  reference: string;
  owner?: string;
  references?: Array<{ url: string; reference: string; author: string; event: string }>;
}>): Contribution[] => {
  return items
    .filter((item) => item.status === 'OPEN' || item.status === 'MERGED')
    .map((item) => ({
      status: item.status as Contribution['status'],
      project: item.project,
      title: item.title ?? '',
      stars: item.stars,
      url: item.url,
      reference: item.reference,
      owner: item.owner,
      references: Array.isArray(item.references) ? item.references : []
    }));
};

const parseOwnerRepoFromUrl = (url: string) => {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
};

const buildCommitHtmlUrl = (commitUrl: string) => {
  const match = commitUrl.match(/repos\/([^/]+)\/([^/]+)\/commits\/([a-f0-9]+)/i);
  if (!match) return null;
  return `https://github.com/${match[1]}/${match[2]}/commit/${match[3]}`;
};

const normalizeReferenceEvent = (event: string) => {
  if (event === 'mentioned') return 'mentioned';
  if (event === 'cross-referenced' || event === 'referenced') return 'referenced';
  return 'referenced';
};

const fetchTimelineReferences = async (
  owner: string,
  repo: string,
  issueNumber: number,
  headers: Record<string, string>
): Promise<Array<{ url: string; reference: string; author: string; event: string }>> => {
  const references: Array<{ url: string; reference: string; author: string; event: string }> = [];
  const seen = new Set<string>();
  let page = 1;
  const perPage = 100;

  while (page <= 5) {
    const timelineResponse = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}/timeline?per_page=${perPage}&page=${page}`,
      { headers: { ...headers, Accept: 'application/vnd.github+json, application/vnd.github.mockingbird-preview+json' } }
    );
    if (!timelineResponse.ok) break;
    const timeline = await timelineResponse.json();
    if (!Array.isArray(timeline) || timeline.length === 0) break;

    for (const entry of timeline) {
      const actor = entry.actor?.login ?? 'unknown';
      if (entry.event === 'cross-referenced' && entry.source?.issue?.html_url) {
        const issue = entry.source.issue;
        const issueUrl = issue.html_url as string;
        const repoInfo = parseOwnerRepoFromUrl(issueUrl);
        const ref = repoInfo ? `${repoInfo.owner}/${repoInfo.repo}#${issue.number}` : `#${issue.number}`;
        const event = normalizeReferenceEvent('cross-referenced');
        const key = `${issueUrl}|${actor}`;
        if (!seen.has(key)) {
          seen.add(key);
          references.push({ url: issueUrl, reference: ref, author: actor, event });
        }
        continue;
      }

      if (entry.event === 'referenced' && entry.commit_url && entry.commit_id) {
        const commitUrl = buildCommitHtmlUrl(entry.commit_url) ?? entry.commit_url;
        const repoInfo = parseOwnerRepoFromUrl(commitUrl) ?? { owner, repo };
        const ref = `${repoInfo.owner}/${repoInfo.repo}@${String(entry.commit_id).slice(0, 7)}`;
        const event = normalizeReferenceEvent('referenced');
        const key = `${commitUrl}|${actor}`;
        if (!seen.has(key)) {
          seen.add(key);
          references.push({ url: commitUrl, reference: ref, author: actor, event });
        }
        continue;
      }

      if (entry.event === 'mentioned' && entry.url) {
        const mentionUrl = entry.url as string;
        const repoInfo = parseOwnerRepoFromUrl(mentionUrl) ?? { owner, repo };
        const ref = `${repoInfo.owner}/${repoInfo.repo}`;
        const event = normalizeReferenceEvent('mentioned');
        const key = `${mentionUrl}|${actor}`;
        if (!seen.has(key)) {
          seen.add(key);
          references.push({ url: mentionUrl, reference: ref, author: actor, event });
        }
      }
    }

    if (timeline.length < perPage) break;
    page += 1;
  }

  return references;
};

export const Contributions: React.FC<ContributionsProps> = ({ themeColors }) => {
  const { language, isDarkMode } = useApp();
  const t = CONTENT[language];
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const blockedUsers = new Set(['greptilea']);

  useEffect(() => {
    const user = DATA.githubUser;
    if (!user) return;
    let isMounted = true;

    const fetchFromApi = async (includeRefs: boolean) => {
      const response = await fetch(
        `/api/contributions?user=${encodeURIComponent(user)}&limit=6&includeRefs=${includeRefs ? '1' : '0'}`
      );
      if (!response.ok) throw new Error('api_error');
      const data = await response.json();
      const rateLimitMessage = data?.message || data?.error;
      if (rateLimitMessage?.includes('API rate limit exceeded')) {
        setErrorMessage(language === 'es'
          ? 'Límite de la API de GitHub excedido. Usa un token para aumentar el límite.'
          : 'GitHub API rate limit exceeded. Use a token to increase the limit.'
        );
      } else {
        setErrorMessage(null);
      }
      if (!isMounted || !Array.isArray(data.contributions)) return;
      const mapped = mapContributions(data.contributions).filter(
        (item) => !item.owner || item.owner.toLowerCase() !== user.toLowerCase()
      );
      setContributions(mapped);
    };

    const fetchFromGithub = async (includeRefs: boolean) => {
      const token = import.meta.env.VITE_GITHUB_TOKEN as string | undefined;
      const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(
        `https://api.github.com/search/issues?q=author:${encodeURIComponent(user)}+is:pr+sort:updated-desc&per_page=12`,
        { headers }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data?.message?.includes('API rate limit exceeded')) {
          setErrorMessage(language === 'es'
            ? 'Límite de la API de GitHub excedido. Usa un token para aumentar el límite.'
            : 'GitHub API rate limit exceeded. Use a token to increase the limit.'
          );
        }
        return;
      }
      const data = await response.json();
      const rateLimitMessage = data?.message || data?.error;
      if (rateLimitMessage?.includes('API rate limit exceeded')) {
        setErrorMessage(language === 'es'
          ? 'Límite de la API de GitHub excedido. Usa un token para aumentar el límite.'
          : 'GitHub API rate limit exceeded. Use a token to increase the limit.'
        );
      } else {
        setErrorMessage(null);
      }
      const items = Array.isArray(data.items) ? data.items : [];
      const result: Contribution[] = [];
      const repoCache = new Map<string, { name: string; fullName: string; stars: number; owner: string }>();

      for (const item of items) {
        if (result.length >= 6) break;
        if (!item.pull_request?.url) continue;
        let status: Contribution['status'] | null = null;
        if (item.state === 'open') {
          status = 'OPEN';
        } else if (item.state === 'closed') {
          try {
            const prResponse = await fetch(item.pull_request.url, {
              headers
            });
            if (prResponse.ok) {
              const prData = await prResponse.json();
              if (prData.merged_at) status = 'MERGED';
            }
          } catch {
            status = null;
          }
        }

        if (!status) continue;
        const repoUrl = item.repository_url;
        let repoData = repoCache.get(repoUrl);
        if (!repoData) {
          try {
            const repoResponse = await fetch(repoUrl, {
              headers
            });
            if (repoResponse.ok) {
              const repoJson = await repoResponse.json();
              repoData = {
                name: repoJson.name,
                fullName: repoJson.full_name,
                stars: repoJson.stargazers_count,
                owner: repoJson.owner?.login ?? repoJson.full_name?.split('/')?.[0] ?? repoUrl
              };
            }
          } catch {
            repoData = undefined;
          }
        }

        if (!repoData) {
          const parts = repoUrl.split('/').filter(Boolean);
          const name = parts[parts.length - 1] ?? repoUrl;
          const owner = parts[parts.length - 2] ?? repoUrl;
          repoData = { name, fullName: `${owner}/${name}`, stars: 0, owner };
        }

        if (repoData.owner.toLowerCase() === user.toLowerCase()) {
          continue;
        }

        repoCache.set(repoUrl, repoData);
        let references: Array<{ url: string; reference: string; author: string; event: string }> = [];
        if (includeRefs) {
          try {
            const allRefs = await fetchTimelineReferences(
              repoData.owner,
              repoData.name,
              item.number,
              headers
            );
            references = allRefs.filter(
              (issue) => issue.author.toLowerCase() !== user.toLowerCase()
            );
          } catch {
            references = [];
          }
        }
        result.push({
          status,
          project: repoData.name,
          title: item.title ?? '',
          stars: repoData.stars,
          url: item.html_url,
          reference: `${repoData.fullName}#${item.number}`,
          owner: repoData.owner,
          references
        });
      }

      if (!isMounted) return;
      setContributions(result);
    };

    const loadContributions = async () => {
      if (import.meta.env.DEV) {
        await fetchFromGithub(false);
        fetchFromGithub(true);
        return;
      }
      try {
        await fetchFromApi(false);
        fetchFromApi(true);
      } catch {
        await fetchFromGithub(false);
        fetchFromGithub(true);
      }
    };

    loadContributions();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">
          {t.contributionsTitle}
        </h2>
      </div>
      {errorMessage && (
        <div className={`text-xs font-semibold uppercase tracking-[0.2em] ${
          isDarkMode ? 'text-red-400' : 'text-red-600'
        }`}>
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5">
        {contributions.map((item, index) => (
          <div
            key={`${item.reference}-${index}`}
            className={`group ${themeColors.cardBg} border ${themeColors.cardBorder} p-5 md:p-6 rounded-[2.5rem] hover:border-blue-600 transition-all duration-500 flex flex-col justify-between w-full`}
          >
            <div className="md:grid md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr] md:gap-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-purple-600/20 text-purple-200 border border-purple-500/40 px-4 py-2 text-xs font-black uppercase tracking-wider">
                      <GitPullRequest size={14} />
                      Merged
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ml-4 ${
                    isDarkMode ? 'bg-white/5 text-blue-200' : 'bg-blue-50 text-blue-700'
                  }`}>
                    <Star size={14} />
                    {item.stars}
                  </div>
                </div>

                <h3 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase mb-2 leading-none group-hover:text-blue-600 transition-colors">
                  {item.project}
                </h3>

                <div className={`${themeColors.textSec} text-base font-semibold leading-relaxed mb-2 space-y-2`}>
                  <div className="break-words">
                    {language === 'es' ? '@PR' : '@PR'} {item.reference.split('#')[1]}: {item.reference.split('#')[0]}
                  </div>
                </div>
                {item.title && (
                  <div className="text-sm font-semibold tracking-tight text-left mb-3">
                    {item.title}
                  </div>
                )}
              </div>

              {item.references && item.references.length > 0 && (
                <div className="mb-2">
                  <div className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${
                          isDarkMode ? 'text-neutral-400' : 'text-stone-600'
                        }`}>
                          Referenced by
                        </div>
                        <div className="space-y-2">
                          {item.references
                            .filter((ref) => !blockedUsers.has(ref.author.toLowerCase()))
                            .filter((ref) => ref.event === 'referenced')
                            .map((ref) => (
                              <a
                                key={ref.url}
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`block text-sm font-semibold underline-offset-4 hover:underline ${
                                  isDarkMode ? 'text-neutral-100' : 'text-stone-800'
                                } break-words leading-relaxed`}
                              >
                                @{ref.author}
                              </a>
                            ))}
                        </div>
                      </div>
                      <div>
                        <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${
                          isDarkMode ? 'text-neutral-400' : 'text-stone-600'
                        }`}>
                          Mentioned by
                        </div>
                        <div className="space-y-2">
                          {item.references
                            .filter((ref) => !blockedUsers.has(ref.author.toLowerCase()))
                            .filter((ref) => ref.event === 'mentioned')
                            .map((ref) => (
                              <a
                                key={ref.url}
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`block text-sm font-semibold underline-offset-4 hover:underline ${
                                  isDarkMode ? 'text-neutral-100' : 'text-stone-800'
                                } break-words leading-relaxed`}
                              >
                                @{ref.author}
                              </a>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-stone-200/50'} group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-12`}
                aria-label={language === 'es' ? 'Ver contribución' : 'View contribution'}
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
