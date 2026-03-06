import React, { useEffect, useState } from 'react';
import { Star, ArrowUpRight, GitPullRequest } from 'lucide-react';
import { CONTENT, DATA } from '../data/content';
import { useApp } from '../context/AppContext';

type Contribution = {
  status: 'MERGED' | 'CLOSED';
  project: string;
  title: string;
  stars: number;
  url: string;
  reference: string;
  owner?: string;
  references?: Array<{ url: string; reference: string; author: string; event: string }>;
  release?: { name?: string; tag?: string; url?: string } | null;
  note?: {
    author: string;
    text: string;
    mentions?: string[];
    commit?: { sha: string; title: string; url: string } | null;
    comments?: Array<{ author: string; text: string }>;
  } | null;
};

const CONTRIBUTIONS_LIMIT = 6;
const SEARCH_PAGE_SIZE = 12;
const MAX_TIMELINE_PAGES = 20;
const IGNORED_PR_NUMBERS = new Set([18665, 26977, 26984]);

const dedupeReferences = (
  references: Array<{ url: string; reference: string; author: string; event: string }> | undefined
) => {
  const byKey = new Map<string, { url: string; reference: string; author: string; event: string }>();
  for (const ref of references ?? []) {
    const key = `${ref.event}::${ref.reference}`;
    if (!byKey.has(key)) {
      byKey.set(key, ref);
    }
  }
  return Array.from(byKey.values());
};

const OPENCLAW_RELEASE = {
  name: 'openclaw 2026.3.1',
  tag: 'v2026.3.1',
  url: 'https://github.com/openclaw/openclaw/releases/tag/v2026.3.1'
};

const OPENCLAW_RELEASE_18685 = {
  name: 'openclaw 2026.2.24',
  tag: 'v2026.2.24',
  url: 'https://github.com/openclaw/openclaw/releases/tag/v2026.2.24'
};

const PR_29198_SUMMARY: Record<'es' | 'en', { issue: string; fix: string }> = {
  es: {
    issue:
      'Identifiqué y resolví una inconsistencia de seguridad en el gateway de OpenClaw donde las rutas registradas por plugins seguían un modelo "fail-open". Aunque las rutas core de la API estaban protegidas, las rutas dinámicas no exigían autenticación obligatoria, lo que generaba un riesgo de bypass para background workers y endpoints de plugins.',
    fix:
      'Refactoricé la lógica de autenticación del gateway de OpenClaw para reemplazar el modelo "fail-open" por una arquitectura secure-by-default. Implementé canonical path matching para normalizar URLs entrantes y evitar bypasses por variaciones de mayúsculas o encoding, y apliqué validación obligatoria de gateway-token en todas las rutas de plugins registradas explícitamente. También diseñé un sistema de gating por niveles para asegurar background workers sin romper integraciones webhook que dependen de firmas de terceros.'
  },
  en: {
    issue:
      'I identified and resolved a security inconsistency in the OpenClaw gateway where plugin-registered routes followed a "fail-open" model. While core API paths were protected, dynamic routes lacked mandatory authentication, creating a bypass risk for background workers and plugin endpoints.',
    fix:
      'I refactored the OpenClaw gateway authentication logic to replace a "fail-open" model with a secure-by-default architecture. I implemented canonical path matching to normalize incoming URLs and prevent bypasses through casing or encoding variants, and I enforced mandatory gateway-token validation across all explicitly registered plugin routes. I also designed a tiered gating system to secure background workers without breaking webhook integrations that rely on third-party signatures.'
  }
};

const PR_18685_SUMMARY: Record<'es' | 'en', { issue: string; fix: string }> = {
  es: {
    issue:
      'La vulnerabilidad estaba en como la interfaz de chat abria imagenes. Al usar window.open sin restricciones, la nueva pestana mantenia una conexion jerarquica con la aplicacion principal mediante window.opener. Esto habilitaba un riesgo serio de Reverse Phishing: la pestana de la imagen podia redirigir maliciosamente la pestana original a una URL fraudulenta, como una pagina falsa de login, sin que el usuario lo notara. Eso podia terminar en robo de sesiones o tokens sensibles.',
    fix:
      'Implemente medidas de seguridad en el componente de renderizado del chat (ui/src/ui/chat/grouped-render.ts) para neutralizar la comunicacion entre pestanas y garantizar aislamiento estricto de contexto. Agregue noopener y noreferrer al proceso de apertura de ventanas, asegurando que la nueva pestana se ejecute en un proceso separado sin acceso al contexto de la pestana origen. Ademas, force explicitamente window.opener = null para eliminar cualquier enlace tecnico remanente. El resultado es la eliminacion completa del vector de redireccion maliciosa, garantizando que la pestana de imagen no tenga privilegios ni capacidad de manipulacion sobre la aplicacion principal de OpenClaw.'
  },
  en: {
    issue:
      'The vulnerability was rooted in how the chat interface managed opening images. By using window.open without restrictions, the newly opened tab kept a hierarchical connection to the main application through window.opener. This created a serious Reverse Phishing risk: the image tab could maliciously redirect the original tab to a fraudulent URL, such as a fake login page, without the user noticing. This could lead to session or sensitive token theft.',
    fix:
      'I implemented security hardening in the chat rendering component (ui/src/ui/chat/grouped-render.ts) to neutralize cross-tab communication and guarantee strict context isolation. I added noopener and noreferrer to the window opening process, ensuring the new tab runs in a separate process without access to the source tab context. I also explicitly set window.opener = null to remove any remaining technical link. The result is the complete elimination of the malicious redirection vector, ensuring the image tab has no privilege or manipulation capability over the main OpenClaw application.'
  }
};

const PR_18685_FALLBACK_COMMENTS = [
  {
    author: 'shakkernerd',
    text:
      'Landed iin main:\n\n- Pushed commit `a42f6f25d` to the PR head branch.\n- Merged this PR as squash into `main`.\n\nMerge commit: `649d141527488281e75d9f67e380ee522426817b`\n\nThanks @Mariana-Codebase!'
  }
];

const PR_29198_FALLBACK_COMMENTS = [
  {
    author: 'steipete',
    text:
      'Landed manually on main as part of the gateway access/auth/config migration cluster.\n\nIncluded commits:\n- 53d10f868 (fix(gateway): land access/auth/config migration cluster)\n- 1c8ae978d (test(lobster): preserve execFile in child_process mock)\n\nValidation run before landing:\n- pnpm lint\n- pnpm build\n- pnpm test\n\nThanks again @Mariana-Codebase for #29198.'
  },
  {
    author: 'KJT125',
    text:
      'We run claude-mem plugin with an HTTP worker on port 37777. If plugin routes are not behind gateway auth, that worker endpoint could be accessed without authorization. Combined with #28140 (config typo silently drops all security settings), this creates a scenario where plugins are both exposed AND the safety net is gone.\n\nThis fix should be backported or highlighted in release notes so users know to upgrade.'
  }
];

const PR_29198_COMMIT_URL = 'https://github.com/openclaw/openclaw/commit/53d10f868';

const isUserAuthor = (author: string) => {
  const normalized = author.trim().toLowerCase();
  if (!normalized) return false;
  if (/\[bot\]$/i.test(author)) return false;
  const knownBots = new Set(['greptile', 'greptile-apps', 'greptileai', 'codex']);
  return !knownBots.has(normalized);
};

const isFounder = (author: string) => author.trim().toLowerCase() === 'steipete';

const OPENCLAW_DESCRIPTION: Record<
  'es' | 'en',
  { intro: string; achievementsTitle: string; achievements: string; privacyTitle: string; privacy: string }
> = {
  es: {
    intro:
      'OpenClaw es un sistema de IA de codigo abierto con arquitectura local-first, disenado para actuar como un agente autonomo dentro del sistema operativo. Desarrollado por Peter Steinberger (@steipete). A diferencia de un modelo de lenguaje convencional, OpenClaw posee capacidades de ejecucion agentica, lo que le permite interactuar directamente con el sistema de archivos, operar la terminal de comandos y automatizar tareas complejas de desarrollo de software.',
    achievementsTitle: 'Logros',
    achievements:
      'Record historico en GitHub: se convirtio en el proyecto open source con el crecimiento mas rapido de la historia. En apenas unos meses de 2026, supero las 250,000 estrellas, rebasando la popularidad de pilares de la industria como Linux y React.',
    privacyTitle: 'Privacidad',
    privacy: 'OpenClaw prioriza la ejecucion local. Esto es fundamental para la seguridad y soberania de datos.'
  },
  en: {
    intro:
      'OpenClaw is an open-source AI system with a local-first architecture, designed to act as an autonomous agent inside the operating system. It is developed by Peter Steinberger (@steipete). Unlike a conventional language model, OpenClaw has agentic execution capabilities, allowing it to interact directly with the file system, operate the command terminal, and automate complex software development tasks.',
    achievementsTitle: 'Achievements',
    achievements:
      'Historic GitHub record: it became the fastest-growing open-source project in history. In just a few months of 2026, it surpassed 250,000 stars, overtaking major industry pillars such as Linux and React.',
    privacyTitle: 'Privacy',
    privacy: 'OpenClaw prioritizes local execution. This is fundamental for data security and sovereignty.'
  }
};

const OPENCLAW_SECTION_TEXT: Record<
  'es' | 'en',
  {
    whatIsOpenClaw: string;
    whatIDid: string;
    whatIIdentified: string;
    whatIDidToFixIt: string;
    whereCanIFindIt: string;
    whereDescription: string;
    release: string;
    pullRequest: string;
    referencedCommit: string;
  }
> = {
  es: {
    whatIsOpenClaw: 'Que es OpenClaw',
    whatIDid: 'Que hice',
    whatIIdentified: 'Que identifique',
    whatIDidToFixIt: 'Que hice para solucionarlo',
    whereCanIFindIt: 'Donde lo puedo encontrar',
    whereDescription:
      'Este fix fue agregado manualmente como parte del gateway access/auth/config migration cluster en el release openclaw 2026.3.1.',
    release: 'Release',
    pullRequest: 'Pull request',
    referencedCommit: 'Tambien referenciado en el commit'
  },
  en: {
    whatIsOpenClaw: 'What is OpenClaw',
    whatIDid: 'What I did',
    whatIIdentified: 'What I identified',
    whatIDidToFixIt: 'What I did to fix it',
    whereCanIFindIt: 'Where can I find it',
    whereDescription:
      'This fix was manually added as part of the gateway access/auth/config migration cluster on the release openclaw 2026.3.1.',
    release: 'Release',
    pullRequest: 'Pull request',
    referencedCommit: 'Also referenced on commit'
  }
};

interface ContributionsProps {
  themeColors: {
    cardBg: string;
    cardBorder: string;
    textSec: string;
  };
}

const hasMinimumEvidence = (item: {
  references?: Array<{ url: string; reference: string; author: string; event: string }>;
  note?: {
    text?: string;
    comments?: Array<{ author?: string; text?: string }>;
  } | null;
}) => {
  const refsCount = (item.references ?? []).length;
  const hasNoteText = Boolean(item.note?.text?.trim());
  const hasNoteComments = Boolean(
    item.note?.comments?.some((comment) => Boolean(comment?.text?.trim()))
  );
  return refsCount > 0 || hasNoteText || hasNoteComments;
};

const mapContributions = (items: Array<{
  status: string;
  project: string;
  title?: string;
  stars: number;
  url: string;
  reference: string;
  owner?: string;
  references?: Array<{ url: string; reference: string; author: string; event: string }>;
  release?: { name?: string; tag?: string; url?: string } | null;
  note?: {
    author?: string;
    text?: string;
    mentions?: string[];
    commit?: { sha?: string; title?: string; url?: string } | null;
    comments?: Array<{ author?: string; text?: string }>;
  } | null;
}>): Contribution[] => {
  return items
    .filter((item) => item.status === 'MERGED' || item.status === 'CLOSED')
    .filter((item) => {
      const prNumber = Number(String(item.reference).split('#')[1] ?? '');
      return !IGNORED_PR_NUMBERS.has(prNumber);
    })
    .filter((item) => hasMinimumEvidence(item))
    .map((item) => ({
      status: item.status as Contribution['status'],
      project: item.project,
      title: item.title ?? '',
      stars: item.stars,
      url: item.url,
      reference: item.reference,
      owner: item.owner,
      references: dedupeReferences(Array.isArray(item.references) ? item.references : []),
      release: item.release ?? null,
      note:
        item.note && typeof item.note.text === 'string' && item.note.text.trim()
          ? {
              author: item.note.author ?? 'unknown',
              text: item.note.text,
              mentions: Array.isArray(item.note.mentions) ? item.note.mentions : [],
              commit:
                item.note.commit &&
                typeof item.note.commit.sha === 'string' &&
                typeof item.note.commit.title === 'string' &&
                typeof item.note.commit.url === 'string'
                  ? {
                      sha: item.note.commit.sha,
                      title: item.note.commit.title,
                      url: item.note.commit.url
                    }
                  : null,
              comments: Array.isArray(item.note.comments)
                ? item.note.comments
                    .filter(
                      (comment) =>
                        typeof comment?.author === 'string' &&
                        comment.author.trim().length > 0 &&
                        typeof comment?.text === 'string' &&
                        comment.text.trim().length > 0
                    )
                    .map((comment) => ({ author: comment.author as string, text: comment.text as string }))
                : []
            }
          : null
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

const fetchLatestRelease = async (owner: string, repo: string, headers: Record<string, string>) => {
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases/latest`,
    { headers }
  );
  if (!response.ok) return null;
  const data = await response.json();
  return { name: data?.name, tag: data?.tag_name, url: data?.html_url };
};

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
    const payload = (await response.json()) as {
      data?: {
        repository?: {
          pullRequest?: {
            timelineItems?: {
              nodes?: Array<{
                __typename?: string;
                actor?: { login?: string };
                source?: { url?: string; author?: { login?: string } };
                commitUrl?: string;
              }>;
              pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
            };
          };
        };
      };
    };
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
    after = timeline.pageInfo.endCursor ?? null;
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

  while (page <= MAX_TIMELINE_PAGES) {
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
  const openclawText = OPENCLAW_SECTION_TEXT[language];
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
      const shouldForceFresh = includeRefs && import.meta.env.DEV;
      const freshParam = shouldForceFresh ? '&fresh=1' : '';
      const cacheBustParam = shouldForceFresh ? `&t=${Date.now()}` : '';
      const response = await fetch(
        `/api/contributions?user=${encodeURIComponent(user)}&limit=${CONTRIBUTIONS_LIMIT}&includeRefs=${includeRefs ? '1' : '0'}${sinceParam}${freshParam}${cacheBustParam}`,
        shouldForceFresh ? { cache: 'no-store' } : undefined
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
      setIsLoading(false);
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
        if (IGNORED_PR_NUMBERS.has(Number(item.number))) continue;
        let status: Contribution['status'] | null = null;
        if (item.state === 'closed') {
          try {
            const prResponse = await fetch(item.pull_request.url, {
              headers
            });
            if (prResponse.ok) {
              const prData = await prResponse.json();
              status = prData.merged_at ? 'MERGED' : 'CLOSED';
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
        let release: { name?: string; tag?: string; url?: string } | null = null;
        if (includeRefs) {
          try {
            const allRefs = await fetchTimelineReferences(
              repoData.owner,
              repoData.name,
              item.number,
              headers
            );
            references = dedupeReferences(allRefs);
          } catch {
            references = [];
          }

          try {
            release = await fetchLatestRelease(repoData.owner, repoData.name, headers);
          } catch {
            release = null;
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
          references,
          release
        });
      }

      if (!isMounted) return;
      setContributions(result.filter((item) => hasMinimumEvidence(item)));
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
        await fetchFromApi(true);
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
              const isOpenClawContribution = item.reference?.toLowerCase().startsWith('openclaw/openclaw');
              const isPr29198 = item.reference?.toLowerCase() === 'openclaw/openclaw#29198';
              const isPr18685 = item.reference?.toLowerCase() === 'openclaw/openclaw#18685';
              const specialPrSummary = isPr29198
                ? PR_29198_SUMMARY[language]
                : isPr18685
                  ? PR_18685_SUMMARY[language]
                  : null;
              const specialPrRelease = isPr29198 ? OPENCLAW_RELEASE : isPr18685 ? OPENCLAW_RELEASE_18685 : null;
              const specialPrCommitUrl = isPr29198 ? PR_29198_COMMIT_URL : null;
              const commentCandidates = [
                ...(item.note?.text
                  ? [{ author: item.note.author, text: item.note.text }]
                  : []),
                ...(item.note?.comments ?? []),
                ...(isPr29198 ? PR_29198_FALLBACK_COMMENTS : []),
                ...(isPr18685 ? PR_18685_FALLBACK_COMMENTS : [])
              ];
              const noteComments = commentCandidates
                .filter((comment) => {
                  const author = comment.author?.trim() ?? '';
                  if (!author || !isUserAuthor(author)) return false;
                  const text = comment.text?.trim() ?? '';
                  return Boolean(text);
                })
                .filter((comment, idx, arr) => {
                  const key = `${comment.author.trim().toLowerCase()}::${comment.text.trim()}`;
                  return arr.findIndex((item) => `${item.author.trim().toLowerCase()}::${item.text.trim()}` === key) === idx;
                });
              const hasAnyComments = noteComments.length > 0;
              const hasSideContent = referencedRefs.length > 0 || mentionedRefs.length > 0 || hasAnyComments || isOpenClawContribution;

              return (
            <div className="md:grid md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr] md:gap-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider border ${
                        item.status === 'MERGED'
                          ? 'bg-purple-600/20 text-purple-200 border-purple-500/40'
                          : 'bg-amber-600/20 text-amber-200 border-amber-500/40'
                      }`}
                    >
                      <GitPullRequest size={14} />
                      {item.status === 'MERGED' ? 'Merged' : 'Closed'}
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
                  <div className="text-lg md:text-xl font-black tracking-tight text-left mb-3">
                    {item.title}
                  </div>
                )}
                {(() => {
                  const release = isOpenClawContribution ? specialPrRelease ?? item.release : item.release;
                  return release && (release.name || release.tag) ? (
                    <a
                      href={release.url || item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] mb-3 ${
                        isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
                      }`}
                    >
                      <span>Release</span>
                      <span className={isDarkMode ? 'text-neutral-200' : 'text-stone-700'}>
                        {release.name || release.tag}
                      </span>
                    </a>
                  ) : null;
                })()}
                {hasAnyComments && (
                  <div
                    className={`text-xs leading-relaxed rounded-2xl border px-4 py-3 mb-4 ${
                      isDarkMode ? 'bg-white/5 border-white/10 text-neutral-200' : 'bg-stone-100 border-stone-200 text-stone-700'
                    }`}
                  >
                    <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${isDarkMode ? 'text-neutral-400' : 'text-stone-600'}`}>
                      Comments
                    </div>
                    <div className="space-y-3">
                      {noteComments.map((comment, idx) => (
                        <details
                          key={`${comment.author}-${idx}`}
                          className={`rounded-xl border px-3 py-2 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-stone-300 bg-white'}`}
                        >
                          <summary className="cursor-pointer select-none text-[11px] font-black uppercase tracking-[0.16em]">
                            @{comment.author}
                            {isFounder(comment.author) && (
                              <span className={`ml-1 inline-flex items-center gap-1 ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                                <img src="/VERIFIED.PNG" alt="Verified" className="inline-block w-3.5 h-3.5" />
                                <span aria-hidden="true">🦞</span>
                              </span>
                            )}{' '}
                            commented
                          </summary>
                          <div className="mt-2 font-semibold whitespace-pre-line break-words">{comment.text}</div>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {hasSideContent && (
                <div className="mb-2">
                  <div className="p-0">
                    {isOpenClawContribution && (
                      <details
                        className={`rounded-2xl border px-4 py-3 text-xs leading-relaxed mb-4 ${
                          isDarkMode ? 'bg-white/5 border-white/10 text-neutral-200' : 'bg-stone-100 border-stone-200 text-stone-700'
                        }`}
                      >
                        <summary className="cursor-pointer select-none font-black uppercase tracking-[0.2em]">
                          {openclawText.whatIsOpenClaw}
                        </summary>
                        <div className="mt-3 space-y-3">
                          <p className="font-semibold">
                            {(() => {
                              const intro = OPENCLAW_DESCRIPTION[language].intro;
                              const founderToken = '(@steipete)';
                              if (!intro.includes(founderToken)) return intro;
                              const [before, after] = intro.split(founderToken);
                              return (
                                <>
                                  {before}
                                  <span className="inline-flex items-center gap-1">
                                    <span>(@steipete)</span>
                                    <span className={`inline-flex items-center gap-1 ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                                      <img src="/VERIFIED.PNG" alt="Verified" className="inline-block w-3.5 h-3.5" />
                                      <span aria-hidden="true">🦞</span>
                                    </span>
                                  </span>
                                  {after}
                                </>
                              );
                            })()}
                          </p>
                          <div>
                            <p className="font-black">{OPENCLAW_DESCRIPTION[language].achievementsTitle}</p>
                            <p className="font-semibold mt-1">{OPENCLAW_DESCRIPTION[language].achievements}</p>
                          </div>
                          <div>
                            <p className="font-black">{OPENCLAW_DESCRIPTION[language].privacyTitle}</p>
                            <p className="font-semibold mt-1">{OPENCLAW_DESCRIPTION[language].privacy}</p>
                          </div>
                        </div>
                      </details>
                    )}
                    {specialPrSummary && (
                      <details
                        className={`rounded-2xl border px-4 py-3 text-xs leading-relaxed mb-4 ${
                          isDarkMode ? 'bg-white/5 border-white/10 text-neutral-200' : 'bg-stone-100 border-stone-200 text-stone-700'
                        }`}
                      >
                        <summary className="cursor-pointer select-none font-black uppercase tracking-[0.2em]">
                          {openclawText.whatIDid}
                        </summary>
                        <div className="mt-3 space-y-3">
                          <div>
                            <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-stone-600'}`}>
                              {openclawText.whatIIdentified}
                            </div>
                            <p className="font-semibold">{specialPrSummary.issue}</p>
                          </div>
                          <div>
                            <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-stone-600'}`}>
                              {openclawText.whatIDidToFixIt}
                            </div>
                            <p className="font-semibold">{specialPrSummary.fix}</p>
                          </div>
                        </div>
                      </details>
                    )}
                    {specialPrRelease && (
                      <details
                        className={`rounded-2xl border px-4 py-3 text-xs leading-relaxed mb-4 ${
                          isDarkMode ? 'bg-white/5 border-white/10 text-neutral-200' : 'bg-stone-100 border-stone-200 text-stone-700'
                        }`}
                      >
                        <summary className="cursor-pointer select-none font-black uppercase tracking-[0.2em]">
                          {openclawText.whereCanIFindIt}
                        </summary>
                        <div className="mt-3 space-y-3 font-semibold">
                          {(isPr29198 || isPr18685) && (
                            <p>
                              {isPr29198
                                ? openclawText.whereDescription
                                : language === 'es'
                                  ? 'Este fix se encuentra en el release openclaw 2026.2.24 y corresponde al hardening de seguridad para la apertura de imagenes en chat.'
                                  : 'This fix is included in the openclaw 2026.2.24 release and corresponds to security hardening for opening chat images.'}
                            </p>
                          )}
                          <p>
                            {openclawText.release}:{' '}
                            <a href={specialPrRelease.url} target="_blank" rel="noopener noreferrer" className={`underline underline-offset-4 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                              {specialPrRelease.name || specialPrRelease.tag}
                            </a>
                          </p>
                          <p>
                            {openclawText.pullRequest}:{' '}
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className={`underline underline-offset-4 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                              @PR {item.reference.split('#')[1]}: {item.reference.split('#')[0]}
                            </a>
                          </p>
                          {specialPrCommitUrl && (
                            <p>
                              {openclawText.referencedCommit}:{' '}
                              <a
                                href={specialPrCommitUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`underline underline-offset-4 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}
                              >
                                53d10f868
                              </a>
                            </p>
                          )}
                        </div>
                      </details>
                    )}
                    {(referencedRefs.length > 0 || mentionedRefs.length > 0) && (
                      <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-stone-200'}`}>
                        <div className="space-y-2">
                          <div className={`text-xs font-black uppercase tracking-[0.15em] ${isDarkMode ? 'text-neutral-400' : 'text-stone-600'}`}>
                            References:{' '}
                            <span className={`${isDarkMode ? 'text-neutral-100' : 'text-stone-900'}`}>{referencedRefs.length}</span>
                          </div>
                          <div className={`text-xs font-black uppercase tracking-[0.15em] ${isDarkMode ? 'text-neutral-400' : 'text-stone-600'}`}>
                            Mentions:{' '}
                            <span className={`${isDarkMode ? 'text-neutral-100' : 'text-stone-900'}`}>{mentionedRefs.length}</span>
                          </div>
                        </div>
                      </div>
                    )}
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
