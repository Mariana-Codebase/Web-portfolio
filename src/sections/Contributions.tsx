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

const CONTRIBUTIONS_LIMIT = 6;
const SEARCH_PAGE_SIZE = 12;

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

const normalizeGithubHtmlUrl = (url: string, fallbackOwner: string, fallbackRepo: string, issueNumber: number) => {
  if (url.includes('github.com/') && !url.includes('api.github.com')) {
    return url;
  }
  const apiMatch = url.match(/api\.github\.com\/repos\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
  if (apiMatch) {
    return `https://github.com/${apiMatch[1]}/${apiMatch[2]}/issues/${apiMatch[3]}`;
  }
  return `https://github.com/${fallbackOwner}/${fallbackRepo}/pull/${issueNumber}`;
};

const buildCommitHtmlUrl = (commitUrl: string) => {
  const match = commitUrl.match(/repos\/([^/]+)\/([^/]+)\/commits\/([a-f0-9]+)/i);
  if (!match) return null;
  return `https://github.com/${match[1]}/${match[2]}/commit/${match[3]}`;
};

const buildFallbackPrUrl = (owner: string, repo: string, issueNumber: number) =>
  `https://github.com/${owner}/${repo}/pull/${issueNumber}`;

const fetchSearchMentions = async (
  owner: string,
  repo: string,
  issueNumber: number,
  headers: Record<string, string>
) => {
  const query = `repo:${owner}/${repo} is:pr \"${owner}/${repo}#${issueNumber}\"`;
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=50`;
  const response = await fetch(url, { headers });
  if (!response.ok) return [];
  const data = await response.json();
  return (data.items ?? []).map((item: { html_url: string; user?: { login?: string } }) => ({
    url: item.html_url,
    reference: `${owner}/${repo}`,
    author: item.user?.login ?? 'unknown',
    event: 'mentioned'
  }));
};

const fetchGraphqlReferences = async (
  owner: string,
  repo: string,
  issueNumber: number,
  headers: Record<string, string>
) => {
  const graphqlUrl = 'https://api.github.com/graphql';
  const query = `
    query($owner:String!, $repo:String!, $number:Int!, $after:String) {
      repository(owner:$owner, name:$repo) {
        pullRequest(number:$number) {
          timelineItems(first:100, after:$after, itemTypes:[CROSS_REFERENCED_EVENT, REFERENCED_EVENT, MENTIONED_EVENT]) {
            pageInfo { hasNextPage endCursor }
            nodes {
              __typename
              ... on CrossReferencedEvent {
                actor { login }
                source {
                  __typename
                  ... on PullRequest { url author { login } }
                  ... on Issue { url author { login } }
                }
                createdAt
              }
              ... on ReferencedEvent {
                actor { login }
                commitUrl
                createdAt
              }
              ... on MentionedEvent {
                actor { login }
                createdAt
              }
            }
          }
        }
      }
    }
  `;

  const references: Array<{ url: string; reference: string; author: string; event: string }> = [];
  let after: string | null = null;

  while (true) {
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables: { owner, repo, number: issueNumber, after }
      })
    });

    if (!response.ok) break;
    const payload = await response.json();
    const timeline = payload?.data?.repository?.pullRequest?.timelineItems;
    const nodes = timeline?.nodes ?? [];

    for (const node of nodes) {
      if (node.__typename === 'CrossReferencedEvent') {
        const author = node?.source?.author?.login ?? node?.actor?.login ?? 'unknown';
        const url = node?.source?.url ?? buildFallbackPrUrl(owner, repo, issueNumber);
        references.push({ url, reference: `${owner}/${repo}`, author, event: 'mentioned' });
      } else if (node.__typename === 'ReferencedEvent') {
        const author = node?.actor?.login ?? 'unknown';
        const url = node?.commitUrl ?? buildFallbackPrUrl(owner, repo, issueNumber);
        references.push({ url, reference: `${owner}/${repo}`, author, event: 'referenced' });
      } else if (node.__typename === 'MentionedEvent') {
        const author = node?.actor?.login ?? 'unknown';
        const url = buildFallbackPrUrl(owner, repo, issueNumber);
        references.push({ url, reference: `${owner}/${repo}`, author, event: 'mentioned' });
      }
    }

    if (!timeline?.pageInfo?.hasNextPage) break;
    after = timeline.pageInfo.endCursor;
  }

  try {
    const searchRefs = await fetchSearchMentions(owner, repo, issueNumber, headers);
    return references.concat(searchRefs);
  } catch {
    return references;
  }
};

const normalizeReferenceEvent = (event: string) => {
  if (event === 'mentioned') return 'mentioned';
  if (event === 'cross-referenced' || event === 'referenced') return 'referenced';
  return 'referenced';
};

const getRateLimitMessage = (language: 'es' | 'en') =>
  language === 'es'
    ? 'Límite de la API de GitHub excedido. Usa un token para aumentar el límite.'
    : 'GitHub API rate limit exceeded. Use a token to increase the limit.';

const fetchTimelineReferences = async (
  owner: string,
  repo: string,
  issueNumber: number,
  headers: Record<string, string>
): Promise<Array<{ url: string; reference: string; author: string; event: string }>> => {
  const references: Array<{ url: string; reference: string; author: string; event: string }> = [];
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
      let actor =
        entry.actor?.login ??
        entry.user?.login ??
        entry.source?.issue?.user?.login ??
        'unknown';
      if (actor === 'unknown' && entry.event === 'mentioned' && entry.url) {
        try {
          const mentionResponse = await fetch(entry.url, { headers });
          if (mentionResponse.ok) {
            const mentionData = await mentionResponse.json();
            actor = mentionData?.user?.login ?? actor;
          }
        } catch {
          actor = actor;
        }
      }
      if (entry.event === 'cross-referenced') {
        const issue = entry.source?.issue;
        const issueUrl = issue?.html_url as string | undefined;
        const repoInfo = issueUrl ? parseOwnerRepoFromUrl(issueUrl) : null;
        const fallbackUrl = buildFallbackPrUrl(owner, repo, issueNumber);
        const ref = repoInfo ? `${repoInfo.owner}/${repoInfo.repo}#${issue?.number}` : `${owner}/${repo}#${issueNumber}`;
        const event = normalizeReferenceEvent('cross-referenced');
        references.push({ url: issueUrl ?? fallbackUrl, reference: ref, author: actor, event });
        continue;
      }

      if (entry.event === 'referenced') {
        const commitUrl = entry.commit_url
          ? buildCommitHtmlUrl(entry.commit_url) ?? entry.commit_url
          : undefined;
        const repoInfo = commitUrl ? parseOwnerRepoFromUrl(commitUrl) ?? { owner, repo } : { owner, repo };
        const ref = entry.commit_id
          ? `${repoInfo.owner}/${repoInfo.repo}@${String(entry.commit_id).slice(0, 7)}`
          : `${owner}/${repo}#${issueNumber}`;
        const event = normalizeReferenceEvent('referenced');
        references.push({ url: commitUrl ?? buildFallbackPrUrl(owner, repo, issueNumber), reference: ref, author: actor, event });
        continue;
      }

      if (entry.event === 'mentioned') {
        const rawUrl =
          (entry.url as string | undefined) ||
          `https://github.com/${owner}/${repo}/pull/${issueNumber}`;
        const mentionUrl = normalizeGithubHtmlUrl(rawUrl, owner, repo, issueNumber);
        const repoInfo = parseOwnerRepoFromUrl(mentionUrl) ?? { owner, repo };
        const ref = `${repoInfo.owner}/${repoInfo.repo}`;
        const event = normalizeReferenceEvent('mentioned');
        references.push({ url: mentionUrl, reference: ref, author: actor, event });
      }
    }

    if (timeline.length < perPage) break;
    page += 1;
  }

  try {
    const graphqlRefs = await fetchGraphqlReferences(owner, repo, issueNumber, headers);
    return references.concat(graphqlRefs);
  } catch {
    return references;
  }
};

export const Contributions: React.FC<ContributionsProps> = ({ themeColors }) => {
  const { language, isDarkMode } = useApp();
  const t = CONTENT[language];
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const since = DATA.contributionsSince;

  useEffect(() => {
    const user = DATA.githubUser;
    if (!user) return;
    let isMounted = true;

    const fetchFromApi = async (includeRefs: boolean) => {
      const sinceParam = since ? `&since=${encodeURIComponent(since)}` : '';
      const freshParam = includeRefs ? '&fresh=1' : '';
      const response = await fetch(
        `/api/contributions?user=${encodeURIComponent(user)}&limit=${CONTRIBUTIONS_LIMIT}&includeRefs=${includeRefs ? '1' : '0'}${sinceParam}${freshParam}`
      );
      if (!response.ok) throw new Error('api_error');
      const data = await response.json();
      const rateLimitMessage = data?.message || data?.error;
      if (rateLimitMessage?.includes('API rate limit exceeded')) {
        setErrorMessage(getRateLimitMessage(language));
      } else {
        setErrorMessage(null);
      }
      if (!isMounted || !Array.isArray(data.contributions)) return;
      const mapped = mapContributions(data.contributions).filter(
        (item) => !item.owner || item.owner.toLowerCase() !== user.toLowerCase()
      );
      setContributions(mapped);
      if (!includeRefs) {
        setIsLoading(false);
      }
    };

    const fetchFromGithub = async (includeRefs: boolean) => {
      const token = import.meta.env.VITE_GITHUB_TOKEN as string | undefined;
      const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const sinceQuery = since ? `+created:>=${encodeURIComponent(since)}` : '';
      const response = await fetch(
        `https://api.github.com/search/issues?q=author:${encodeURIComponent(user)}+is:pr${sinceQuery}+sort:updated-desc&per_page=${SEARCH_PAGE_SIZE}`,
        { headers }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data?.message?.includes('API rate limit exceeded')) {
          setErrorMessage(getRateLimitMessage(language));
        }
        if (!includeRefs) {
          setIsLoading(false);
        }
        return;
      }
      const data = await response.json();
      const rateLimitMessage = data?.message || data?.error;
      if (rateLimitMessage?.includes('API rate limit exceeded')) {
        setErrorMessage(getRateLimitMessage(language));
      } else {
        setErrorMessage(null);
      }
      const items = Array.isArray(data.items) ? data.items : [];
      const result: Contribution[] = [];
      const repoCache = new Map<string, { name: string; fullName: string; stars: number; owner: string }>();

      for (const item of items) {
        if (result.length >= CONTRIBUTIONS_LIMIT) break;
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
      if (!includeRefs) {
        setIsLoading(false);
      }
    };

    const loadContributions = async () => {
      setIsLoading(true);
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
      {isLoading && (
        <div className={`text-xs font-semibold uppercase tracking-[0.2em] ${
          isDarkMode ? 'text-neutral-400' : 'text-stone-600'
        }`}>
          {language === 'es' ? 'Cargando contribuciones...' : 'Loading contributions...'}
        </div>
      )}
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
            {(() => {
              const mentionedRefs = (item.references ?? []).filter((ref) => ref.event === 'mentioned');
              const referencedRefs = (item.references ?? []).filter((ref) => ref.event === 'referenced');
              const botNames = new Set(['greptile', 'greptile-apps', 'greptileai']);
              const isBot = (author: string) => {
                const lower = author.toLowerCase();
                return lower.includes('bot') || botNames.has(lower);
              };

              return (
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

              {(referencedRefs.length > 0 || mentionedRefs.length > 0) && (
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
                          {referencedRefs.map((ref, idx) => (
                              <a
                                key={`${ref.url}-${ref.author}-${ref.event}-${idx}`}
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`block text-sm font-semibold underline-offset-4 hover:underline truncate ${
                                  isDarkMode ? 'text-neutral-100' : 'text-stone-800'
                                } break-words leading-relaxed`}
                              >
                                @{ref.author}
                                {isBot(ref.author) && (
                                  <span className={`ml-2 text-[9px] font-black uppercase tracking-widest ${
                                    isDarkMode ? 'text-emerald-300' : 'text-emerald-600'
                                  }`}>
                                    BOT
                                  </span>
                                )}
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
                          {mentionedRefs.map((ref, idx) => (
                              <a
                                key={`${ref.url}-${ref.author}-${ref.event}-${idx}`}
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`block text-sm font-semibold underline-offset-4 hover:underline truncate ${
                                  isDarkMode ? 'text-neutral-100' : 'text-stone-800'
                                } break-words leading-relaxed`}
                              >
                                @{ref.author}
                                {isBot(ref.author) && (
                                  <span className={`ml-2 text-[9px] font-black uppercase tracking-widest ${
                                    isDarkMode ? 'text-emerald-300' : 'text-emerald-600'
                                  }`}>
                                    BOT
                                  </span>
                                )}
                              </a>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
              );
            })()}

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
