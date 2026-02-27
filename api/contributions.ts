import path from "path";
import fs from "fs";

const DEFAULT_LIMIT = 6;
const CACHE_TTL_MS = 10 * 60 * 1000;
const responseCache = new Map<string, { expiresAt: number; data: unknown }>();
const timelineCache = new Map<string, { expiresAt: number; data: Array<{ url: string; reference: string; author: string; event: string; createdAt?: string }> }>();
const releaseCache = new Map<string, { expiresAt: number; data: { name?: string; tag?: string; url?: string } | null }>();
const MAX_TIMELINE_PAGES = 1;
const WITH_REFS_LIMIT = 2;

const parseLimit = (value: string | undefined) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, 50);
};

const parseIncludeRefs = (value: string | undefined) => {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return normalized !== "0" && normalized !== "false";
};

const parseSince = (value: string | undefined) => {
  if (!value) return undefined;
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return undefined;
  return normalized;
};

const parseFresh = (value: string | undefined) => {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return normalized === "1" || normalized === "true";
};

const parseClearCache = (value: string | undefined) => {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return normalized === "1" || normalized === "true";
};

const buildSearchUrl = (user: string, perPage: number, since?: string) => {
  const sinceFilter = since ? ` created:>=${since}` : "";
  const params = new URLSearchParams({
    q: `author:${user} is:pr is:merged${sinceFilter} sort:updated-desc`,
    per_page: String(perPage)
  });

  return `https://api.github.com/search/issues?${params.toString()}`;
};

const parseRepoFromUrl = (repoUrl: string) => {
  const parts = repoUrl.split('/').filter(Boolean);
  if (parts.length < 2) return { fullName: repoUrl, name: repoUrl };
  const name = parts[parts.length - 1];
  const owner = parts[parts.length - 2];
  return { fullName: `${owner}/${name}`, name };
};

const parseOwnerRepo = (fullName: string) => {
  const [owner, repo] = fullName.split('/');
  if (!owner || !repo) return null;
  return { owner, repo };
};

const parseOwnerRepoFromUrl = (url: string) => {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
};

const normalizeGithubHtmlUrl = (url: string, fallbackOwner: string, fallbackRepo: string, issueNumber: number) => {
  if (url.includes("github.com/") && !url.includes("api.github.com")) {
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

const fetchLatestRelease = async (
  owner: string,
  repo: string,
  headers: Record<string, string>,
  fresh: boolean
) => {
  const cacheKey = `${owner}/${repo}`;
  const now = Date.now();
  const cached = releaseCache.get(cacheKey);
  if (!fresh && cached && cached.expiresAt > now) {
    return cached.data;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases/latest`,
      { headers }
    );
    if (!response.ok) {
      releaseCache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, data: null });
      return null;
    }
    const data = (await response.json()) as { name?: string; tag_name?: string; html_url?: string };
    const payload = { name: data.name, tag: data.tag_name, url: data.html_url };
    releaseCache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, data: payload });
    return payload;
  } catch {
    releaseCache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, data: null });
    return null;
  }
};

const normalizeReferenceEvent = (event: string) => {
  if (event === "mentioned") return "mentioned";
  if (event === "cross-referenced" || event === "referenced") return "referenced";
  return "referenced";
};

const fetchTimelineReferences = async (
  owner: string,
  repo: string,
  issueNumber: number,
  headers: Record<string, string>,
  fresh: boolean
) => {
  const cacheKey = `${owner}/${repo}#${issueNumber}`;
  const now = Date.now();
  const cached = timelineCache.get(cacheKey);
  if (!fresh && cached && cached.expiresAt > now) {
    return cached.data;
  }
  const references: Array<{ url: string; reference: string; author: string; event: string; createdAt?: string }> = [];
  let page = 1;
  const perPage = 100;

  while (page <= MAX_TIMELINE_PAGES) {
    const timelineResponse = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}/timeline?per_page=${perPage}&page=${page}`,
      {
        headers: {
          ...headers,
          Accept: "application/vnd.github+json, application/vnd.github.mockingbird-preview+json"
        }
      }
    );
    if (!timelineResponse.ok) break;
    const timeline = (await timelineResponse.json()) as Array<{
      event?: string;
      url?: string;
      commit_id?: string;
      commit_url?: string;
      created_at?: string;
      actor?: { login?: string };
      user?: { login?: string };
      source?: {
        issue?: {
          html_url?: string;
          number?: number;
          user?: { login?: string };
          pull_request?: Record<string, unknown>;
        };
      };
    }>;
    if (!Array.isArray(timeline) || timeline.length === 0) break;
    for (const entry of timeline) {
      let actor =
        entry.actor?.login ??
        entry.user?.login ??
        entry.source?.issue?.user?.login ??
        "unknown";
      if (actor === "unknown" && entry.event === "mentioned" && entry.url) {
        try {
          const mentionResponse = await fetch(entry.url, { headers });
          if (mentionResponse.ok) {
            const mentionData = (await mentionResponse.json()) as { user?: { login?: string } };
            actor = mentionData.user?.login ?? actor;
          }
        } catch {
          actor = actor;
        }
      }
      if (entry.event === "cross-referenced") {
        const issue = entry.source?.issue;
        const issueUrl = issue?.html_url as string | undefined;
        const repoInfo = issueUrl ? parseOwnerRepoFromUrl(issueUrl) : null;
        const fallbackUrl = buildFallbackPrUrl(owner, repo, issueNumber);
        const ref = repoInfo
          ? `${repoInfo.owner}/${repoInfo.repo}#${issue?.number}`
          : `${owner}/${repo}#${issueNumber}`;
        const event = normalizeReferenceEvent("cross-referenced");
        references.push({
          url: issueUrl ?? fallbackUrl,
          reference: ref,
          author: actor,
          event,
          createdAt: entry.created_at
        });
        continue;
      }

      if (entry.event === "referenced") {
        const commitUrl = entry.commit_url
          ? buildCommitHtmlUrl(entry.commit_url) ?? entry.commit_url
          : undefined;
        const repoInfo = commitUrl ? parseOwnerRepoFromUrl(commitUrl) ?? { owner, repo } : { owner, repo };
        const ref = entry.commit_id
          ? `${repoInfo.owner}/${repoInfo.repo}@${String(entry.commit_id).slice(0, 7)}`
          : `${owner}/${repo}#${issueNumber}`;
        const event = normalizeReferenceEvent("referenced");
        references.push({
          url: commitUrl ?? buildFallbackPrUrl(owner, repo, issueNumber),
          reference: ref,
          author: actor,
          event,
          createdAt: entry.created_at
        });
        continue;
      }

      if (entry.event === "mentioned") {
        const rawUrl =
          (entry.url as string | undefined) ||
          `https://github.com/${owner}/${repo}/pull/${issueNumber}`;
        const mentionUrl = normalizeGithubHtmlUrl(rawUrl, owner, repo, issueNumber);
        const repoInfo = parseOwnerRepoFromUrl(mentionUrl) ?? { owner, repo };
        const ref = `${repoInfo.owner}/${repoInfo.repo}`;
        const event = normalizeReferenceEvent("mentioned");
        references.push({ url: mentionUrl, reference: ref, author: actor, event, createdAt: entry.created_at });
      }
    }
    if (timeline.length < perPage) break;
    page += 1;
  }

  timelineCache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, data: references });
  return references;
};

export default async function handler(req: any, res: any) {
  const user =
    typeof req.query?.user === "string"
      ? req.query.user
      : (typeof (globalThis as any).process !== "undefined"
          ? (globalThis as any).process.env.GITHUB_USER
          : undefined);

  const limit = parseLimit(
    typeof req.query?.limit === "string" ? req.query.limit : undefined
  );
  const includeRefs = parseIncludeRefs(
    typeof req.query?.includeRefs === "string" ? req.query.includeRefs : undefined
  );
  const since = parseSince(
    typeof req.query?.since === "string" ? req.query.since : undefined
  );
  const fresh = parseFresh(
    typeof req.query?.fresh === "string" ? req.query.fresh : undefined
  );
  const clearCache = parseClearCache(
    typeof req.query?.clearCache === "string" ? req.query.clearCache : undefined
  );

  if (clearCache) {
    responseCache.clear();
    timelineCache.clear();
  }

  if (!user) {
    res.status(400).json({ error: "Missing GitHub user." });
    return;
  }

  const token =
    typeof (globalThis as any).process !== "undefined"
      ? (globalThis as any).process.env?.GITHUB_TOKEN
      : undefined;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "portfolio-site"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // File cache: datos precargados en public/contributions-cache.json (actualizado cada 10 min)
  if (!fresh && limit === DEFAULT_LIMIT && !includeRefs && typeof process !== "undefined" && process.cwd) {
    try {
      const cachePath = path.join(process.cwd(), "public", "contributions-cache.json");
      const raw = fs.readFileSync(cachePath, "utf8");
      const data = JSON.parse(raw) as { user?: string; contributions?: unknown[] };
      if (data?.user === user && Array.isArray(data.contributions) && data.contributions.length > 0) {
        res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600");
        res.status(200).json({ user: data.user, contributions: data.contributions });
        return;
      }
    } catch {
      // sin archivo o inválido: seguir con caché en memoria o GitHub
    }
  }

  const cacheKey = `${user}:${limit}:${includeRefs ? "refs" : "norefs"}:${since ?? "all"}`;
  const now = Date.now();
  const cached = responseCache.get(cacheKey);
  if (!fresh && cached && cached.expiresAt > now) {
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600");
    res.status(200).json(cached.data);
    return;
  }

  try {
    const perPage = Math.min(limit * 3, 30);
    const searchResponse = await fetch(buildSearchUrl(user, perPage, since), { headers });
    if (!searchResponse.ok) {
      const message = await searchResponse.text();
      res.status(searchResponse.status).json({ error: message || "GitHub API error" });
      return;
    }

    const searchData = (await searchResponse.json()) as {
      items: Array<{
        html_url: string;
        number: number;
        state: "open" | "closed";
        repository_url: string;
        pull_request?: { url: string };
        title?: string;
      }>;
    };

    const repoCache = new Map<string, { name: string; fullName: string; stars: number; owner: string }>();
    const contributions: Array<{
      status: "OPEN" | "MERGED";
      project: string;
      title: string;
      stars: number;
      url: string;
      reference: string;
      owner: string;
      references: Array<{ url: string; reference: string; author: string; event: string; createdAt?: string }>;
      release?: { name?: string; tag?: string; url?: string } | null;
    }> = [];

    for (const item of searchData.items ?? []) {
      if (contributions.length >= limit) break;
      if (!item.pull_request?.url) continue;

      // La búsqueda ya filtra solo PRs mergeados
      const status: "MERGED" = "MERGED";

      const repoUrl = item.repository_url;
      let repoData = repoCache.get(repoUrl);
      if (!repoData) {
        try {
          const repoResponse = await fetch(repoUrl, { headers });
          if (repoResponse.ok) {
            const repoJson = (await repoResponse.json()) as {
              name: string;
              full_name: string;
              stargazers_count: number;
              owner: { login: string };
            };
            repoData = {
              name: repoJson.name,
              fullName: repoJson.full_name,
              stars: repoJson.stargazers_count,
              owner: repoJson.owner.login
            };
          }
        } catch {
          repoData = undefined;
        }

        if (!repoData) {
          const parsed = parseRepoFromUrl(repoUrl);
          const owner = parsed.fullName.split("/")[0] ?? parsed.fullName;
          repoData = { name: parsed.name, fullName: parsed.fullName, stars: 0, owner };
        }

        repoCache.set(repoUrl, repoData);
      }

      if (repoData.owner?.toLowerCase() === user.toLowerCase()) {
        continue;
      }

      let references: Array<{ url: string; reference: string; author: string; event: string; createdAt?: string }> = [];
      let release: { name?: string; tag?: string; url?: string } | null = null;

      const shouldIncludeRefs = includeRefs && fresh && contributions.length < WITH_REFS_LIMIT;

      if (shouldIncludeRefs) {
        const ownerRepo = parseOwnerRepo(repoData.fullName);
        if (ownerRepo) {
          try {
            const [allRefs, latestRelease] = await Promise.all([
              fetchTimelineReferences(ownerRepo.owner, ownerRepo.repo, item.number, headers, fresh),
              fetchLatestRelease(ownerRepo.owner, ownerRepo.repo, headers, fresh)
            ]);
            references = allRefs.filter(
              (issue) => issue.author.toLowerCase() !== user.toLowerCase()
            );
            release = latestRelease;
          } catch {
            references = [];
            release = null;
          }
        }
      }

      contributions.push({
        status,
        project: repoData.name,
        title: item.title ?? "",
        stars: repoData.stars,
        url: item.html_url,
        reference: `${repoData.fullName}#${item.number}`,
        owner: repoData.owner,
        references,
        release
      });
    }

    const payload = { user, contributions };
    responseCache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, data: payload });
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600");
    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ error: "Unexpected server error." });
  }
}
